/**
 * 登录：邮箱 + 密码进入自己的账号，数据只来自本人空间。
 */
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { FormGroup, TextField } from '@/components/inputs';
import { useSession } from '@/session';

import { AuthScaffold } from './scaffold';

export function LoginScreen() {
  const router = useRouter();
  const { signIn, busy } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const canSignIn = Boolean(email.trim() && password) && !busy;

  const submit = async () => {
    if (!canSignIn) {
      setError('请输入邮箱和密码');
      return;
    }
    setError('');
    const res = await signIn(email, password);
    if (!res.ok) setError(res.error);
  };

  return (
    <AuthScaffold
      title="欢迎回来"
      description="使用你的账号继续管理私人菜谱与饮食记录。"
      actionLabel="注册"
      onAction={() => router.replace('/register')}
      error={error}
      footer={
        <Button size="lg" block disabled={!canSignIn} loading={busy} onPress={() => void submit()}>
          {busy ? '登录中…' : '登录'}
        </Button>
      }>
      <FormGroup>
        <TextField
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (error) setError('');
          }}
          placeholder="name@example.com"
          inputMode="email"
          label="邮箱"
          editable={!busy}
        />
        <TextField
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (error) setError('');
          }}
          placeholder="输入密码"
          label="密码"
          secure
          editable={!busy}
        />
      </FormGroup>
    </AuthScaffold>
  );
}
