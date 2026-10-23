/**
 * 输入形态 · 定稿对照
 * ------------------------------------------------------------------
 * 这一页是**评审用**的并排对照，不是产品组件；定稿后应删掉。
 *
 * 上一轮列了四种（含一种深色填充），本轮按反馈收敛：
 *   - 不要深色填充 → 淘汰「加深填充行」，且输入行一律白底，不用 fill
 *   - 不要浅蓝获焦填充 → 聚焦只动描边，整行不换底色
 *   - 文字要垂直居中 → 统一走 INPUT_METRICS（见线面说明）
 *
 * 剩下三种按场景用：
 *   A 白底描边行   —— 独立字段、需要一个个填的表单（登录 / 注册 / 编辑器头部）
 *   B 整组共用白卡 —— 连续多行、追求密度（食材 / 步骤 / 分类选择）
 *   D 上下标签式   —— 字段少但语义重、需要标签常驻（新建菜谱的名称与备注）
 */
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Body, Micro } from '@/components/text';
import { INPUT_METRICS } from '@/components/inputs';
import { alpha, color, hairline, motion as mt, radius } from '@/theme';

import { ShowcaseStage } from './gallery';

const EASE = Easing.bezier(mt.ease[0], mt.ease[1], mt.ease[2], mt.ease[3]);
const STATE_MS = 170;
const ROW_H = 50;

type State = 'idle' | 'focus' | 'error' | 'disabled';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 描边两端点：idle / disabled 是发丝色（看得见但很轻），
 * 聚焦转蓝、出错转红。**不换底色**——底色一变整行会发亮。
 */
const EDGE_IDLE = color.hair;
const EDGE_FOCUS: [string, string] = [EDGE_IDLE, color.accent];
const EDGE_ERROR: [string, string] = [EDGE_IDLE, color.danger];

/** 标签：次要信息用 muted 常规字重，和值（ink medium）拉开层级 */
function Label({ children, state }: { children: string; state: State }) {
  return (
    <Body
      tone={state === 'error' ? 'danger' : 'muted'}
      weight="font-normal"
      numberOfLines={1}
      className="shrink-0">
      {children}
    </Body>
  );
}

function Value({ children, state }: { children: string; state: State }) {
  return (
    <Body tone={state === 'error' ? 'danger' : 'ink'} weight="font-medium" numberOfLines={1}>
      {children}
    </Body>
  );
}

/** 单行输入：三种形态共用，垂直居中靠 INPUT_METRICS */
function Cell({
  value,
  onChange,
  placeholder,
  error,
  onFocusChange,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error: boolean;
  onFocusChange: (f: boolean) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={error ? alpha.dangerPlaceholder : alpha.placeholder}
      selectionColor={color.accent}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      className={cx('text-body min-w-0 flex-1', error ? 'text-danger' : 'text-ink')}
      style={INPUT_METRICS}
    />
  );
}

/* ---- A · 白底描边行 ---- */
function RowA({
  label,
  value,
  onChange,
  placeholder,
  state: forced,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  state?: State;
}) {
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const state: State = forced ?? (focused ? 'focus' : 'idle');
  const target = state === 'focus' || state === 'error' ? 1 : 0;
  const edge = useSharedValue(target);

  useEffect(() => {
    edge.set(withTiming(target, { duration: reduceMotion ? 0 : STATE_MS, easing: EASE }));
  }, [edge, target, reduceMotion]);

  const shell = useAnimatedStyle(() => ({
    borderColor: interpolateColor(edge.get(), [0, 1], state === 'error' ? EDGE_ERROR : EDGE_FOCUS),
  }));

  return (
    <Animated.View
      style={[
        shell,
        {
          height: ROW_H,
          borderRadius: radius.control,
          borderWidth: hairline,
          backgroundColor: color.card,
        },
      ]}
      className={cx(
        'w-full flex-row items-center gap-3 px-3.5',
        state === 'disabled' && 'opacity-45'
      )}>
      <Label state={state}>{label}</Label>
      <View className="min-w-0 flex-1 flex-row items-center justify-end">
        {state === 'disabled' ? (
          <Value state={state}>{value}</Value>
        ) : (
          <Cell
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={false}
            onFocusChange={setFocused}
          />
        )}
      </View>
    </Animated.View>
  );
}

/* ---- B · 整组共用白卡 ---- */
function RowB({
  label,
  value,
  onChange,
  placeholder,
  separator,
  state: forced,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  separator?: boolean;
  state?: State;
}) {
  const [focused, setFocused] = useState(false);
  const state: State = forced ?? (focused ? 'focus' : 'idle');

  return (
    <View className={cx(state === 'disabled' && 'opacity-45')}>
      <View
        style={{ minHeight: ROW_H, paddingVertical: 13, position: 'relative' }}
        className="w-full flex-row items-center gap-3 px-4">
        <Label state={state}>{label}</Label>
        <View className="min-w-0 flex-1 flex-row items-center justify-end">
          {state === 'disabled' ? (
            <Value state={state}>{value}</Value>
          ) : (
            <Cell
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              error={false}
              onFocusChange={setFocused}
            />
          )}
        </View>
        {/* 聚焦指示：贴左的一细条系统蓝 */}
        <FocusBar visible={state === 'focus'} />
      </View>
      {separator ? <View className="bg-hair ml-4" style={{ height: hairline }} /> : null}
    </View>
  );
}

function FocusBar({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(visible ? 1 : 0, { duration: reduceMotion ? 0 : STATE_MS, easing: EASE }));
  }, [p, visible, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scaleY: 0.4 + 0.6 * p.get() }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: 'absolute',
          left: 0,
          top: 9,
          bottom: 9,
          width: 3,
          borderRadius: 2,
          backgroundColor: color.accent,
        },
      ]}
    />
  );
}

/* ---- D · 上下标签式 ---- */
function RowD({
  label,
  value,
  onChange,
  placeholder,
  state: forced,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  state?: State;
}) {
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const state: State = forced ?? (focused ? 'focus' : 'idle');
  const target = state === 'focus' || state === 'error' ? 1 : 0;
  const edge = useSharedValue(target);
  const tint = useSharedValue(state === 'error' ? 1 : 0);

  useEffect(() => {
    const ms = reduceMotion ? 0 : STATE_MS;
    edge.set(withTiming(target, { duration: ms, easing: EASE }));
    tint.set(withTiming(state === 'error' ? 1 : 0, { duration: ms, easing: EASE }));
  }, [edge, tint, target, state, reduceMotion]);

  const shell = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(tint.get(), [0, 1], [color.card, color.dangerTint]),
    borderColor: interpolateColor(edge.get(), [0, 1], state === 'error' ? EDGE_ERROR : EDGE_FOCUS),
  }));

  return (
    <Animated.View
      style={[
        shell,
        {
          borderRadius: radius.control,
          borderWidth: hairline,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
      ]}
      className={cx('w-full', state === 'disabled' && 'opacity-45')}>
      <Micro tone={state === 'error' ? 'danger' : 'muted'}>{label}</Micro>
      <View className="mt-0.5 min-w-0 flex-row items-center">
        {state === 'disabled' ? (
          <Value state={state}>{value}</Value>
        ) : (
          <Cell
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={state === 'error'}
            onFocusChange={setFocused}
          />
        )}
      </View>
    </Animated.View>
  );
}

function Rail({ render }: { render: (s: State) => React.ReactNode }) {
  const states: State[] = ['idle', 'focus', 'error', 'disabled'];
  return <View style={{ rowGap: 8 }}>{states.map((s) => render(s))}</View>;
}

export function InputCandidatesSection() {
  const [a1, setA1] = useState('番茄牛腩饭');
  const [a2, setA2] = useState('');
  const [b1, setB1] = useState('牛腩');
  const [b2, setB2] = useState('500 g');
  const [d1, setD1] = useState('番茄牛腩饭');
  const [d2, setD2] = useState('');

  return (
    <View style={{ rowGap: 20 }}>
      <ShowcaseStage label="A · 白底描边行" caption="独立字段 · 逐个填">
        <Rail
          render={(s) => (
            <RowA
              key={s}
              label={s === 'disabled' ? '禁用' : s === 'error' ? '出错' : '菜名'}
              value={s === 'disabled' ? '不可编辑' : s === 'error' ? '格式不对' : '番茄牛腩饭'}
              onChange={() => {}}
              state={s}
            />
          )}
        />
        <View className="mt-3" style={{ rowGap: 8 }}>
          <RowA label="菜名" value={a1} onChange={setA1} placeholder="例如：番茄牛腩饭" />
          <RowA label="分类" value={a2} onChange={setA2} placeholder="选择分类" />
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="B · 整组共用白卡" caption="连续多行 · 密度优先">
        <View className="rounded-group overflow-hidden" style={{ backgroundColor: color.card }}>
          <RailB />
        </View>
        <View
          className="rounded-group mt-3 overflow-hidden"
          style={{ backgroundColor: color.card }}>
          <RowB label="食材" value={b1} onChange={setB1} placeholder="食材" separator />
          <RowB label="用量" value={b2} onChange={setB2} placeholder="用量" separator />
          <RowB label="食材" value="番茄" onChange={() => {}} separator />
          <RowB label="用量" value="3 个" onChange={() => {}} />
        </View>
      </ShowcaseStage>

      <ShowcaseStage label="D · 上下标签式" caption="字段少 · 标签常驻">
        <Rail
          render={(s) => (
            <RowD
              key={s}
              label={s === 'disabled' ? '禁用' : s === 'error' ? '出错' : '菜名'}
              value={s === 'disabled' ? '不可编辑' : s === 'error' ? '格式不对' : '番茄牛腩饭'}
              onChange={() => {}}
              state={s}
            />
          )}
        />
        <View className="mt-3" style={{ rowGap: 8 }}>
          <RowD label="菜名" value={d1} onChange={setD1} placeholder="例如：番茄牛腩饭" />
          <RowD label="备注" value={d2} onChange={setD2} placeholder="一句话说明（可选）" />
        </View>
      </ShowcaseStage>
    </View>
  );
}

/** B 的状态轨也需要一个白卡包住，单独抽出来避免嵌套过深 */
function RailB() {
  const states: State[] = ['idle', 'focus', 'error', 'disabled'];
  return (
    <>
      {states.map((s) => (
        <RowB
          key={s}
          label={
            s === 'disabled' ? '禁用' : s === 'error' ? '出错' : s === 'focus' ? '聚焦' : '默认'
          }
          value={s === 'disabled' ? '不可编辑' : s === 'focus' ? 'name@example.com' : '番茄牛腩饭'}
          onChange={() => {}}
          separator
          state={s}
        />
      ))}
    </>
  );
}
