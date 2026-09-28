/**
 * daily + · 会话令牌存储
 * ------------------------------------------------------------------
 * 原生放进设备钥匙串（Keychain / Keystore）。Web 预览环境没有 SecureStore，
 * 降级到 localStorage，保证 `expo start --web` 时不会因为读存储而崩。
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'daily_session_token';

function webStorage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function readToken(): Promise<string | null> {
  const web = webStorage();
  if (web) return web.getItem(TOKEN_KEY);
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function writeToken(token: string): Promise<void> {
  const web = webStorage();
  if (web) {
    web.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  const web = webStorage();
  if (web) {
    web.removeItem(TOKEN_KEY);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // 令牌本来就取不到时无需报错
  }
}
