/**
 * 登录：默认免验证进入公共演示空间；私人账号作为可选入口。
 * 「点击登录直接进主页」这条路径保留，不检查输入、不等待网络。
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { Section } from '@/components/surfaces';
import { Icon } from '@/components/icon';
import { Body, Caption } from '@/components/text';
import { FormGroup, TextField } from '@/components/inputs';
import { useSession } from '@/session';

import { AuthScaffold } from './scaffold';

export function LoginScreen() {
  const router = useRouter();
  const { signInDemo, signIn, busy } = useSession();
  const [personal, setPersonal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const canSignIn = Boolean(email.trim() && password) && !busy;

  const enterHome = async () => {
    const res = await signInDemo();
    if (!res.ok) setError(res.error);
  };

  const signInPersonal = async () => {
    if (!canSignIn) {
      setError('请输入邮箱和密码；也可以返回免验证入口直接进入主页');
      return;
    }
    setError('');
    const res = await signIn(email, password);
    if (!res.ok) setError(res.error);
  };

  const switchTo = (target: '/login' | '/register') => {
    router.replace(target);
  };

  return (
    <AuthScaffold
      title="欢迎回来"
      description={
        personal
          ? '使用你的个人账号继续管理私人菜谱与饮食记录。'
          : '当前环境可跳过账号校验，点击登录直接进入主页。'
      }
      actionLabel="注册"
      onAction={() => switchTo('/register')}
      error={error}
      footer={
        personal ? (
          <>
            <Button
              size="lg"
              block
              disabled={!canSignIn}
              loading={busy}
              onPress={() => void signInPersonal()}>
              {busy ? '登录中…' : '使用个人账号登录'}
            </Button>
            <View className="mt-3">
              <Button
                size="lg"
                variant="tonal"
                block
                disabled={busy}
                onPress={() => {
                  setPersonal(false);
                  setError('');
                }}>
                返回免验证入口
              </Button>
            </View>
          </>
        ) : (
          <>
            <Button size="lg" block loading={busy} onPress={() => void enterHome()}>
              登录
            </Button>
            <View className="mt-3">
              <Button
                size="lg"
                variant="tonal"
                block
                onPress={() => {
                  setPersonal(true);
                  setError('');
                }}>
                使用个人账号登录
              </Button>
            </View>
            <View className="mt-3">
              <Caption className="text-center leading-relaxed">
                免验证进入的是公共演示空间，请勿填写隐私信息
              </Caption>
            </View>
          </>
        )
      }>
      {personal ? (
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
      ) : (
        <Section>
          <View className="flex-row items-center gap-3 px-4 py-4">
            <View className="bg-tint rounded-control h-10 w-10 shrink-0 items-center justify-center">
              <Icon name="arrow-right" size="md" tone="accent" />
            </View>
            <View className="min-w-0 flex-1">
              <Body weight="font-semibold">一键进入主页</Body>
              <Caption className="mt-0.5">无需密码 · 使用演示账号体验所有功能</Caption>
            </View>
          </View>
        </Section>
      )}
    </AuthScaffold>
  );
}
