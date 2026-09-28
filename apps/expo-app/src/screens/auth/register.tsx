/**
 * 注册：昵称 / 邮箱 / 密码三项；密码规则实时勾选，满足后才可提交。
 * 规则与服务端 passwordProblem() 完全一致——界面上勾的就是真正生效的规则。
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/button';
import { CheckCircle } from '@/components/controls';
import { Section } from '@/components/surfaces';
import { Caption } from '@/components/text';
import { FieldRow, TextField } from '@/components/inputs';
import { PASSWORD_RULES, isValidEmail } from '@/domain/account';
import { useSession } from '@/session';

import { AuthScaffold } from './scaffold';

export function RegisterScreen() {
  const router = useRouter();
  const { register, busy } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState('');

  const emailValid = isValidEmail(email.trim());
  const rulesMet = PASSWORD_RULES.every((rule) => rule.test(password));
  const canSubmit = name.trim().length > 0 && emailValid && rulesMet && !busy;
  const message =
    error || (emailTouched && email.trim() && !emailValid ? '请输入有效的邮箱地址' : '');

  const submit = async () => {
    if (!canSubmit) return;
    setError('');
    const res = await register(name, email, password);
    if (!res.ok) setError(res.error);
  };

  return (
    <AuthScaffold
      title="创建账号"
      description="注册后会准备 6 道入门菜谱，随时可以编辑或删除。"
      actionLabel="登录"
      onAction={() => router.replace('/login')}
      error={message}
      footer={
        <>
          <Button
            size="lg"
            block
            disabled={!canSubmit}
            loading={busy}
            onPress={() => void submit()}>
            {busy ? '创建中…' : '注册并开始'}
          </Button>
          <View className="mt-2.5">
            <Caption className="text-center leading-relaxed">
              账号仅用于保存你的菜谱与饮食记录
            </Caption>
          </View>
        </>
      }>
      <Section>
        <FieldRow label="昵称" align="left">
          <TextField
            value={name}
            onChange={(v) => {
              setName(v);
              if (error) setError('');
            }}
            align="left"
            placeholder="怎么称呼你"
            label="昵称"
            editable={!busy}
            className="flex-1"
          />
        </FieldRow>
        <FieldRow label="邮箱" align="left">
          <TextField
            value={email}
            onChange={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            align="left"
            placeholder="name@example.com"
            inputMode="email"
            label="邮箱"
            editable={!busy}
            onBlur={() => setEmailTouched(true)}
            error={emailTouched && Boolean(email.trim()) && !emailValid}
            className="flex-1"
          />
        </FieldRow>
        <FieldRow label="密码" align="left">
          <TextField
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (error) setError('');
            }}
            align="left"
            placeholder="设置密码"
            label="密码"
            secure
            editable={!busy}
            className="flex-1"
          />
        </FieldRow>
      </Section>

      <View className="mt-3 flex-row flex-wrap gap-x-5 gap-y-2 px-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <View key={rule.id} className="flex-row items-center gap-1.5">
              <CheckCircle done={met} size={15} />
              <Caption tone={met ? 'lake' : 'muted'}>{rule.label}</Caption>
            </View>
          );
        })}
      </View>
    </AuthScaffold>
  );
}
