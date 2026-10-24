/**
 * 登录前的服务器地址入口。
 * 正式包装机后默认指向 localhost，手机上第一次启动必须先把地址改对才能登录，
 * 所以这个入口要出现在欢迎页与登录页脚，而不是等登录成功后的「我的」里。
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Sheet } from '@/chrome';
import { Icon } from '@/components/icon';
import { FieldError, TextField } from '@/components/inputs';
import { Caption } from '@/components/text';
import { getApiBaseUrl, setApiBaseUrl } from '@/data/client';
import { useSession } from '@/session';

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
}

/** 连不通的地址保存了也没意义，保存前先探一下 /api/health */
async function pingHealth(base: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${base}/api/health`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function ServerEntry() {
  const { serverUrl, switchServer } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** 每次打开都从当前生效地址开始编辑，保存前不给陈旧值留机会 */
  const openSheet = () => {
    setInput(getApiBaseUrl());
    setError('');
    setOpen(true);
  };

  const save = async () => {
    if (busy) return;
    setError('');
    const trimmed = input.trim();
    if (!trimmed) {
      // 留空 = 恢复默认；switchServer 会一并同步界面上的地址显示
      await switchServer('');
      setOpen(false);
      return;
    }
    const previous = getApiBaseUrl();
    const candidate = setApiBaseUrl(trimmed);
    if (!candidate) {
      setError('地址需以 http:// 或 https:// 开头');
      return;
    }
    setBusy(true);
    const reachable = await pingHealth(candidate);
    setBusy(false);
    if (!reachable) {
      // 探不通先不落盘，运行时也退回去，让用户改完再保存
      setApiBaseUrl(previous);
      setError('连不上这个地址：请确认手机与后端在同一网络、后端正在运行');
      return;
    }
    await switchServer(trimmed);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="服务器地址"
        onPress={openSheet}
        hitSlop={8}
        className="mt-4 flex-row items-center justify-center gap-1.5 py-1">
        <Icon name="database" size="sm" />
        <Caption tone="muted">服务器 {hostOf(serverUrl)}</Caption>
      </Pressable>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="服务器地址"
        subtitle="指向运行 daily + 后端的电脑"
        action={{
          label: busy ? '保存中…' : '保存',
          onPress: () => void save(),
          disabled: busy,
        }}>
        <View className="gap-4 pb-2">
          <TextField
            value={input}
            onChange={(v) => {
              setInput(v);
              setError('');
            }}
            label="新地址"
            placeholder="http://192.168.1.5:3000"
            align="left"
            layout="stacked"
            inputMode="text"
            error={Boolean(error)}
            autoFocus
          />
          {error ? <FieldError>{error}</FieldError> : null}
          <View className="gap-1">
            <Caption>当前地址：{serverUrl}</Caption>
            <Caption tone="muted">
              手机与后端需在同一网络；示例 http://192.168.1.5:3000。{'\n'}
              留空保存则恢复默认地址。
            </Caption>
          </View>
        </View>
      </Sheet>
    </>
  );
}
