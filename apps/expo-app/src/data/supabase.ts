/**
 * daily + · SUPABASE CLIENT
 * ------------------------------------------------------------------
 * 会话持久化沿用 session/storage.ts 的取舍：原生放钥匙串（SecureStore），
 * Web 预览没有 SecureStore，降级 localStorage。EXPO_PUBLIC_* 变量由 Metro
 * 构建期内联进 bundle，publishable key 只能走 anon 角色，能读到哪些行
 * 由数据库的 RLS 策略决定，不需要也不应该在这里藏密钥。
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore 单个值上限 2048 字节，超限时会在控制台警告——
// 登录会话里塞了大段 user_metadata 时才可能碰到，现阶段够用。
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const localStorageAdapter = {
  getItem: (key: string) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
  setItem: (key: string, value: string) =>
    Promise.resolve(globalThis.localStorage?.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(globalThis.localStorage?.removeItem(key)),
};

const authStorage = Platform.OS === 'web' ? localStorageAdapter : secureStoreAdapter;

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
