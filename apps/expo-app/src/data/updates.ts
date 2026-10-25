/**
 * daily + · 应用内更新
 * ------------------------------------------------------------------
 * 发布物是本仓库的 GitHub Releases（标签 mobile-vX.Y.Z），每个 release 挂着
 * daily-X.Y.Z-android.apk。每天查一次，发现新版本由调用方弹窗；
 * 下载带进度，装交给系统安装器。安装器只接受与已装应用同签名的 APK——
 * 完整性由 Android 的签名校验兜底，这里下载完再核对一次字节数。
 *
 * 参照 lorca 的更新链路（mobile/src/core/updates.ts）：按 mobile-v 标签匹配、
 * 跳过 draft / prerelease、取比本机新的最新版本。只在 Android 发布构建生效。
 */
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API = 'https://api.github.com/repos/hcl-z/xiaoyu';
const ATOM = 'https://github.com/hcl-z/xiaoyu/releases.atom';
const TAG_PREFIX = 'mobile-v';
const DAY = 24 * 60 * 60 * 1000;
const CHECKED_KEY = 'daily_update_checked_at';
const SKIPPED_KEY = 'daily_update_skipped';
/** 网络（含 atom / API）请求的统一超时 */
const FETCH_TIMEOUT_MS = 8000;

/** 发布构建（Android）才有更新；开发构建与 Web / iOS 不查也不装 */
export const updatesSupported = Platform.OS === 'android' && !__DEV__;

/** 本机构建携带的版本（app.json 的 version，随 APK 一起打包） */
export const installedVersion: string = Constants.expoConfig?.version ?? '0.0.0';

export type AppRelease = { version: string; notes: string; url: string; size: number };

export type UpdatePhase = 'idle' | 'checking' | 'downloading';

type UpdatesState = {
  phase: UpdatePhase;
  /** 比本机新的最新发布；查过且没有就是 null */
  latest: AppRelease | null;
  checked: boolean;
  /** 下载进度 0-1；不在下载时为 0 */
  progress: number;
  error: string | null;
};

let state: UpdatesState = { phase: 'idle', latest: null, checked: false, progress: 0, error: null };
const listeners = new Set<() => void>();

function setState(patch: Partial<UpdatesState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getUpdatesState(): UpdatesState {
  return state;
}

export function subscribeUpdates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `a` 是不是比 `b` 新的版本号（都是 X.Y.Z） */
export function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

async function github<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (response.status === 404) return null;
  if (response.status === 403) throw new Error('GitHub 查询太频繁，请稍后再试');
  if (!response.ok) throw new Error(`GitHub 接口返回 ${response.status}`);
  return (await response.json()) as T;
}

/** 带超时的 fetch：更新检查不能把界面挂在一个不回包的连接上 */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface GitHubRelease {
  draft: boolean;
  prerelease: boolean;
  body: string | null;
  assets: { name: string; browser_download_url: string; size: number }[];
}

/**
 * 已发布版本号（新的在前）。走 releases.atom 网页订阅而不是 api.github.com：
 * API 未认证限流 60 次/小时还按出口 IP 计，手机蜂窝网络几乎必 403；
 * atom 无速率限制、单请求、天然只含已发布（非 draft）的版本。
 */
async function publishedVersions(): Promise<string[]> {
  const response = await fetchWithTimeout(ATOM, { headers: { Accept: 'application/atom+xml' } });
  if (!response.ok) throw new Error(`GitHub 发布页返回 ${response.status}`);
  const xml = await response.text();
  const seen: string[] = [];
  for (const match of xml.matchAll(/\/releases\/tag\/mobile-v(\d+\.\d+\.\d+)/g)) {
    const version = match[1]!;
    if (!seen.includes(version)) seen.push(version);
  }
  return seen;
}

/** 按命名约定直接拼 APK 下载地址（API 拿不到资产信息时的降级路径） */
function apkUrl(version: string): string {
  return `https://github.com/hcl-z/xiaoyu/releases/download/${TAG_PREFIX}${version}/daily-${version}-android.apk`;
}

/**
 * 比本机新的最新已发布 release。
 * 版本号来自 atom（无 draft）；确认有更新后只调一次 API 拿说明与包大小——
 * API 403 / 超时不再挡更新：降级成直链 + 空说明照样返回。
 */
export async function newestRelease(): Promise<AppRelease | null> {
  const versions = await publishedVersions();
  const target = versions.find((v) => isNewer(v, installedVersion));
  if (!target) return null;

  try {
    const release = await github<GitHubRelease>(`/releases/tags/${TAG_PREFIX}${target}`);
    const apk = release?.assets.find((a) => a.name === `daily-${target}-android.apk`);
    if (!release || !apk) return null;
    return {
      version: target,
      notes: (release.body ?? '').trim(),
      url: apk.browser_download_url,
      size: apk.size,
    };
  } catch {
    return { version: target, notes: '', url: apkUrl(target), size: 0 };
  }
}

let checking: Promise<void> | null = null;

/** 查一次更新，结果落在状态里；弹不弹窗由调用方决定 */
export function checkForUpdates(): Promise<void> {
  if (!updatesSupported) return Promise.resolve();
  if (checking) return checking;
  if (state.phase === 'downloading') return Promise.resolve();
  setState({ phase: 'checking', error: null });
  checking = (async () => {
    try {
      const latest = (await newestRelease()) ?? null;
      void SecureStore.setItemAsync(CHECKED_KEY, String(Date.now())).catch(() => {});
      setState({ phase: 'idle', latest, checked: true });
    } catch {
      setState({
        phase: 'idle',
        // 原始报错（英文状态码 / AbortError）对使用者没有意义
        error: '连不上 GitHub，请检查网络后稍后再试',
        checked: true,
      });
    } finally {
      checking = null;
    }
  })();
  return checking;
}

/** 跳过这个版本：每日提醒不再弹它，直到更新的版本出现 */
export async function skipRelease(version: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SKIPPED_KEY, version);
  } catch {
    // 只影响弹窗提醒，失败不必打断
  }
}

async function isSkipped(version: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(SKIPPED_KEY)) === version;
  } catch {
    return false;
  }
}

/** 下载并安装：下载走原生模块（带进度），装交给系统安装器 */
export async function installUpdate(release: AppRelease): Promise<void> {
  if (!updatesSupported) return;
  const { default: Updater } = await import('../../modules/updater');
  const fileName = `daily-${release.version}-android.apk`;
  setState({ phase: 'downloading', progress: 0, error: null });
  /* 进度回调按数据块触发，逐次 setState 会带着整页订阅者重渲染；100ms 一档足够看 */
  let lastProgressAt = 0;
  const subscription = Updater.addListener('onDownloadProgress', ({ bytesWritten, totalBytes }) => {
    const now = Date.now();
    if (now - lastProgressAt < 100) return;
    lastProgressAt = now;
    const progress = totalBytes > 0 ? Math.min(bytesWritten / totalBytes, 1) : 0;
    setState({ progress });
  });
  try {
    await Updater.download(release.url, fileName, release.size);
    Updater.install(fileName);
    setState({ phase: 'idle', progress: 0 });
  } catch (error) {
    setState({
      phase: 'idle',
      progress: 0,
      error: error instanceof Error ? error.message : '下载失败，请稍后再试',
    });
  } finally {
    subscription.remove();
  }
}

/**
 * 每日自动检查：挂载时与回到前台时看一眼上次检查时间，超过一天才查；
 * 查到新版本且未被跳过时回调 onOffer，由调用方决定怎么提醒。
 */
export function useDailyUpdateCheck(onOffer: (release: AppRelease) => void) {
  useEffect(() => {
    if (!updatesSupported) return;

    let busy = false;
    const maybeCheck = () => {
      if (busy) return;
      busy = true;
      void (async () => {
        try {
          let last: string | null = null;
          try {
            last = await SecureStore.getItemAsync(CHECKED_KEY);
          } catch {
            // 取不到就当没查过
          }
          if (!last || Date.now() - Number(last) >= DAY) {
            await checkForUpdates();
            const { latest } = getUpdatesState();
            if (latest && !(await isSkipped(latest.version))) onOffer(latest);
          }
        } finally {
          busy = false;
        }
      })();
    };

    maybeCheck();
    const subscription = AppState.addEventListener('change', (s) => {
      if (s === 'active') maybeCheck();
    });
    return () => subscription.remove();
    // 回调只读当前状态，不参与订阅语义
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
