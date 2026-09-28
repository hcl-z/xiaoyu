/**
 * FieldRow · TextField · TextArea · SearchField
 * ------------------------------------------------------------------
 * 与 Web 的 ds/inputs.tsx 同一套契约。
 * Web 用 outline-none + 容器 focus-within 表达焦点；原生没有 hover，
 * 焦点改为字段自身的下沿描边（始终占位，避免布局跳动），
 * 校验失败时同一位置转为系统红。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { color, hairline } from '@/theme';

import { Icon } from './icon';
import { Body } from './text';

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/** 字段自身的状态描边：未聚焦透明占位，聚焦系统蓝，出错系统红 */
function underline(focused: boolean, error: boolean) {
  return {
    borderBottomWidth: hairline,
    borderBottomColor: error ? color.danger : focused ? color.accent : 'transparent',
  } as const;
}

/** 卡片内的一行表单：左标签 + 右控件 */
export function FieldRow({
  label,
  hint,
  children,
  align = 'right',
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  align?: 'right' | 'left';
}) {
  return (
    <View className="min-h-11 flex-row items-center gap-3 px-4 py-3">
      <Body tone="muted" className="w-16 shrink-0">
        {label}
      </Body>
      <View className={cx('min-w-0 flex-1', align === 'right' && 'flex-row justify-end')}>
        {children}
      </View>
      {hint ? (
        <Body tone="muted" size="text-caption" className="opacity-80">
          {hint}
        </Body>
      ) : null}
    </View>
  );
}

/** Web 的 inputMode 在原生映射到 keyboardType */
const KEYBOARD: Record<'text' | 'numeric' | 'decimal', KeyboardTypeOptions> = {
  text: 'default',
  numeric: 'number-pad',
  decimal: 'decimal-pad',
};

export type TextFieldProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: 'right' | 'left';
  inputMode?: 'text' | 'numeric' | 'decimal';
  autoFocus?: boolean;
  /** 禁用 / 只读态 */
  editable?: boolean;
  /** 校验失败态 */
  error?: boolean;
  className?: string;
  label?: string;
  /** 失焦回调；表单用它把「已填过但格式不对」与「还没填完」区分开 */
  onBlur?: () => void;
  /**
   * 递增的聚焦信号：值每变一次就把光标送进输入框。
   * 用于卡片外的动作按钮把焦点交回卡片内的输入行，而不必向上暴露 ref。
   */
  focusSignal?: number;
  /**
   * 键盘回车提交。Web 的「回车即添加」在原生靠这条回调；
   * 提交后输入框保持聚焦，方便连续添加多项。
   */
  onSubmit?: () => void;
};

export function TextField({
  value,
  onChange,
  placeholder,
  align = 'right',
  inputMode,
  autoFocus,
  editable = true,
  error = false,
  className,
  label,
  onBlur,
  focusSignal,
  onSubmit,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!focusSignal) return;
    inputRef.current?.focus();
  }, [focusSignal]);

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="rgba(99,99,102,0.7)"
      keyboardType={inputMode ? KEYBOARD[inputMode] : undefined}
      autoFocus={autoFocus}
      editable={editable}
      accessibilityLabel={label ?? placeholder}
      accessibilityState={{ disabled: !editable }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      returnKeyType={onSubmit ? 'done' : undefined}
      submitBehavior={onSubmit ? 'submit' : undefined}
      onSubmitEditing={onSubmit}
      className={cx('text-body text-ink min-w-0 flex-1', className)}
      style={[underline(focused, error), { textAlign: align, opacity: editable ? 1 : 0.4 }]}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  autoFocus,
  editable = true,
  error = false,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean;
  label?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="rgba(99,99,102,0.7)"
      multiline
      autoFocus={autoFocus}
      editable={editable}
      accessibilityLabel={label ?? placeholder}
      accessibilityState={{ disabled: !editable }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="text-body text-ink w-full"
      style={[
        underline(focused, error),
        { minHeight: 22 * rows, textAlignVertical: 'top', opacity: editable ? 1 : 0.4 },
      ]}
    />
  );
}

/** 搜索框：白卡药丸 + 发丝描边 */
export function SearchField({
  value,
  onChange,
  placeholder = '搜索',
  onSubmit,
  autoFocus,
  editable = true,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={cx(
        'bg-card flex-row items-center gap-2 rounded-full border px-3.5 py-2.5',
        focused ? 'border-indigo/50' : 'border-hair',
        !editable && 'opacity-40',
        className
      )}>
      <Icon name="search" size="sm" tone="muted" />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={() => onSubmit?.()}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor="rgba(99,99,102,0.8)"
        autoFocus={autoFocus}
        editable={editable}
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="text-body text-ink min-w-0 flex-1"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="清除"
          onPress={() => onChange('')}
          hitSlop={8}
          className="shrink-0 p-1">
          <Icon name="x" size="sm" tone="muted" />
        </Pressable>
      ) : null}
    </View>
  );
}
