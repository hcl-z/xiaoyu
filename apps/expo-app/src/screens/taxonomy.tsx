/**
 * 分类 / 标签管理：就地新增、弹层编辑、删除确认。
 * 重命名会同步到所有引用它的菜谱；占用中的分类禁止删除。
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Alert, TaskScreen } from '@/chrome/overlays';
import { Sheet } from '@/chrome/sheet';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { TextField } from '@/components/inputs';
import { ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption } from '@/components/text';
import { useTaxonomies } from '@/data/store';
import type { TaxonomyItem, TaxonomyKind } from '@/data/types';

type Copy = {
  title: string;
  label: string;
  emptyDesc: string;
  note: string;
  placeholder: string;
};

const COPY: Record<TaxonomyKind, Copy> = {
  category: {
    title: '分类管理',
    label: '分类',
    emptyDesc: '还没有分类。分类用于菜谱库顶部的筛选，在下方输入即可创建。',
    note: '重命名会同步更新所有属于该分类的菜谱；仍被菜谱使用的分类无法删除，先把菜谱改到其它分类。',
    placeholder: '输入分类名，回车即添加',
  },
  tag: {
    title: '标签管理',
    label: '标签',
    emptyDesc: '还没有标签。标签用来标记做法与场景，在下方输入即可创建。',
    note: '重命名会同步更新所有带该标签的菜谱；删除标签只会把它从菜谱上摘掉，菜谱本身保留。',
    placeholder: '输入标签名，回车即添加',
  },
};

function usageLabel(item: TaxonomyItem) {
  return item.count > 0 ? `正被 ${item.count} 道菜谱使用` : '当前没有菜谱使用';
}

export function TaxonomyScreen({ kind }: { kind: TaxonomyKind }) {
  const router = useRouter();
  const { categories, tags, loading, addTaxonomy, renameTaxonomy, removeTaxonomy } =
    useTaxonomies();

  const copy = COPY[kind];
  const items = kind === 'category' ? categories : tags;

  /* 就地新增：常驻输入行，建完可连续添加 */
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [focusSignal, setFocusSignal] = useState(0);

  /* 弹层只负责编辑（重命名 / 删除） */
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const usedCount = useMemo(() => items.filter((i) => i.count > 0).length, [items]);

  const close = () => router.back();

  const commitAdd = async () => {
    const value = draft.trim();
    if (!value || adding) return;
    if (items.some((i) => i.name === value)) {
      setAddError(`「${value}」已存在`);
      return;
    }
    setAdding(true);
    setAddError('');
    const res = await addTaxonomy(kind, value);
    setAdding(false);
    if (res.ok) setDraft('');
    else setAddError(res.error ?? '添加失败');
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditing(item);
    setName(item.name);
    setError('');
    setSaving(false);
  };

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== editing?.name && !saving;

  const save = async () => {
    if (!editing || !canSave) return;
    setSaving(true);
    setError('');
    const res = await renameTaxonomy(editing.id, trimmedName);
    setSaving(false);
    if (res.ok) setEditing(null);
    else setError(res.error ?? '保存失败');
  };

  const remove = async () => {
    if (!editing) return;
    setConfirmDelete(false);
    setSaving(true);
    setError('');
    const res = await removeTaxonomy(editing.id);
    setSaving(false);
    if (res.ok) setEditing(null);
    else setError(res.error ?? '删除失败');
  };

  return (
    <>
      <TaskScreen
        title={copy.title}
        onClose={close}
        subtitle={!loading && items.length > 0 ? `共 ${items.length} 个` : undefined}
        leading={{ icon: 'x', label: '关闭', onPress: close }}
        trailing={{
          icon: 'plus',
          label: `新增${copy.label}`,
          onPress: () => setFocusSignal((n) => n + 1),
          tone: 'accent',
        }}>
        <View className="px-5 pt-5" style={{ rowGap: 20 }}>
          <Section
            title={`全部${copy.label}`}
            footer={
              !loading && items.length > 0
                ? `共 ${items.length} 个 · ${usedCount} 个正在使用`
                : undefined
            }>
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <View key={i} className="flex-row items-center gap-3 px-4 py-3">
                    <View className="flex-1">
                      <Skeleton className="h-3.5 w-20" rounded={4} />
                    </View>
                    <Skeleton className="h-3 w-10" rounded={4} />
                  </View>
                ))}
              </>
            ) : (
              <>
                {items.length === 0 ? (
                  <View className="px-4 py-6">
                    <Caption className="text-center leading-relaxed">{copy.emptyDesc}</Caption>
                  </View>
                ) : (
                  items.map((item) => (
                    <ListRow
                      key={item.id}
                      label={`编辑${copy.label} ${item.name}`}
                      title={item.name}
                      value={item.count > 0 ? `${item.count} 道` : '未使用'}
                      accessory="chevron"
                      onPress={() => openEdit(item)}
                    />
                  ))
                )}

                {/* 就地新增行：无需弹层，输入后即创建 */}
                <View className="min-h-11 flex-row items-center gap-3 px-4 py-2.5">
                  <View className="bg-tint h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full">
                    <Icon name="plus" size="sm" tone="accent" strokeWidth={2.6} />
                  </View>
                  <TextField
                    value={draft}
                    onChange={(v) => {
                      setDraft(v);
                      if (addError) setAddError('');
                    }}
                    align="left"
                    placeholder={copy.placeholder}
                    label={`新增${copy.label}`}
                    focusSignal={focusSignal}
                    onSubmit={() => void commitAdd()}
                    className="flex-1"
                  />
                  {draft.trim() ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`添加${copy.label}`}
                      accessibilityState={{ disabled: adding }}
                      disabled={adding}
                      onPress={() => void commitAdd()}
                      hitSlop={6}>
                      <Body tone="accent" size="text-[15px]" weight="font-semibold">
                        {adding ? '添加中' : '添加'}
                      </Body>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </Section>

          {addError ? (
            <Caption tone="danger" className="leading-relaxed">
              {addError}
            </Caption>
          ) : null}

          <Section padded>
            <Caption className="leading-relaxed">{copy.note}</Caption>
          </Section>
        </View>
      </TaskScreen>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`编辑${copy.label}`}
        subtitle={editing ? usageLabel(editing) : undefined}
        action={{ label: '保存', onPress: () => void save(), disabled: !canSave }}
        footer={
          <Button size="lg" block disabled={!canSave} onPress={() => void save()}>
            {saving ? '保存中…' : '保存修改'}
          </Button>
        }>
        <View style={{ rowGap: 20, paddingBottom: 8 }}>
          <Section tone="deep">
            <View className="flex-row items-center gap-3 px-4 py-2.5">
              <Body tone="muted" className="w-14 shrink-0">
                名称
              </Body>
              <TextField
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (error) setError('');
                }}
                align="left"
                placeholder={`${copy.label}名称`}
                label={`${copy.label}名称`}
                className="flex-1"
              />
            </View>
          </Section>

          {error ? (
            <Caption tone="danger" className="leading-relaxed">
              {error}
            </Caption>
          ) : null}

          <Section tone="deep">
            <ListRow
              leading={
                <View className="h-[22px] w-[22px] items-center justify-center">
                  <Icon name="trash-2" size="md" tone="danger" />
                </View>
              }
              title={`删除${copy.label}`}
              destructive
              onPress={() => setConfirmDelete(true)}
            />
          </Section>
        </View>
      </Sheet>

      {/* 删除确认：叠在弹层之上，用系统 Modal 呈现（背板 + 居中卡片） */}
      <Alert
        open={confirmDelete}
        title={`删除「${editing?.name ?? ''}」？`}
        message={
          kind === 'category'
            ? '仅当没有菜谱属于该分类时才能删除。'
            : `该标签会从 ${editing?.count ?? 0} 道菜谱上移除，菜谱本身保留。`
        }
        confirmLabel="删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
