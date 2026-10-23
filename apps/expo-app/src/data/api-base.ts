/**
 * daily + · 服务器地址的本地持久化
 * ------------------------------------------------------------------
 * 与会话令牌同一条路：原生放设备钥匙串（SecureStore），
 * Web 预览降级 localStorage。读取发生在 SessionProvider 启动恢复阶段，
 * 保证第一次网络请求就用上用户上次设置的地址。
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_KEY = 'daily_api_base';

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function readApiBaseOverride(): Promise<string | null> {
  const web = webStorage();
  if (web) return web.getItem(API_BASE_KEY);
  try {
    return await SecureStore.getItemAsync(API_BASE_KEY);
  } catch {
    return null;
  }
}

export async function writeApiBaseOverride(url: string | null): Promise<void> {
  const web = webStorage();
  if (web) {
    if (url) web.setItem(API_BASE_KEY, url);
    else web.removeItem(API_BASE_KEY);
    return;
  }
  try {
    if (url) await SecureStore.setItemAsync(API_BASE_KEY, url);
    else await SecureStore.deleteItemAsync(API_BASE_KEY);
  } catch {
    // 存不进去只影响「重启后记住」，本次使用仍然生效
  }
}
