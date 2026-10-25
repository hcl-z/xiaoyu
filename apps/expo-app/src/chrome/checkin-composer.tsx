/**
 * 打卡弹层 · 快记表单
 * ------------------------------------------------------------------
 * 参照 Things / iOS 提醒事项的快录范式：一个大输入框就是标题（输入即记录），
 * 菜谱匹配是输入途中的建议，餐段药丸决定时间（不给精确时间选择），
 * 笔记是可选项——不打断「写一句 → 记下」的主路径。
 * 照片打卡不在这里：它与 FAB 同层，是独立入口。
 * 修改模式同一套骨架，外加确认计划与删除。
 *
 * 整个弹层由本组件持有：每次打开都是全新一届（key 换届），状态不用手动复位。
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/surfaces';
import { Body, Caption, Micro } from '@/components/text';
import { Button } from '@/components/button';
import { TextArea } from '@/components/inputs';
import { RemoteImage } from '@/components/remote-image';
import {
  addCheckinRecord,
  patchCheckinRecord,
  removeCheckinRecord,
  useRecipes,
} from '@/data/store';
import type { Checkin, Recipe } from '@/data/types';
import { todayISO } from '@/domain/date';
import {
  COMPOSER_SEGMENTS,
  mealOfTime,
  minutesOfTime,
  segmentDefaultTime,
  segmentOfTime,
} from '@/domain/meal';
import { color, elevationStyle } from '@/theme';

import { Alert, SuccessOverlay } from './overlays';
import { Sheet } from './sheet';

/** 保存流程的显式状态：失败要能被看见，也要能原地重试 */
type SavePhase = 'idle' | 'saving' | 'success' | 'failure';
type SaveResult = { tone: 'success' | 'failure'; title: string; caption?: string };

/** 未来日期默认落在正午：半夜安排明天的饭，不该默认记成半夜吃 */
const DEFAULT_PLAN_TIME = '12:00';

function dateToTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function CheckinComposer({
  open,
  day,
  existing,
  presetRecipe,
  onClose,
}: {
  /** 面板常驻挂载（保住关闭动画），打开/关闭由宿主控制；状态重置靠 key 换届 */
  open: boolean;
  day: string;
  existing?: Checkin;
  presetRecipe?: string | null;
  onClose: () => void;
}) {
  const today = todayISO();
  const { recipes, loading: recipesLoading } = useRecipes();

  const isPlan = existing ? existing.planned : day > today;
  const dayLabel =
    day === today ? '今天' : `${Number(day.slice(5, 7))}月${Number(day.slice(8, 10))}日`;

  /** 输入框就是标题：选中菜谱时显示菜名，否则显示输入的原句 */
  const [query, setQuery] = useState('');
  const [slug, setSlug] = useState<string | null>(existing?.recipeSlug ?? presetRecipe ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [noteOpen, setNoteOpen] = useState(Boolean(existing?.note));
  /** 用餐时间：时间轴按它排序，餐段药丸跟着它换档 */
  const [time, setTime] = useState(
    existing ? existing.time : day > today ? DEFAULT_PLAN_TIME : dateToTime(new Date())
  );
  const [phase, setPhase] = useState<SavePhase>('idle');
  const [result, setResult] = useState<SaveResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** 输入框聚焦时描一圈强调色边，让它看起来是可编辑的正文而非标签 */
  const [inputFocused, setInputFocused] = useState(false);

  const selected = recipes.find((r) => r.slug === slug) ?? null;
  const manualTitle = existing && !selected ? query.trim() || existing.title : query.trim();
  const title = selected?.title ?? (slug === null ? manualTitle : '');
  const canSave = title.trim().length > 0;
  /** 保存中 / 结果展示中都算忙，避免连点 */
  const busy = phase !== 'idle';
  const resultOpen = result !== null;

  /** 菜谱匹配只在输入时出现：输入的是自定义标题，匹配只是「换成菜谱」的捷径 */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return recipes
      .filter((r) => r.slug !== slug)
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [query, recipes, slug]);

  /** 真实的「最近吃过」：按上次做于倒序，没做过的排后面 */
  const recentlyCooked = useMemo(
    () =>
      [...recipes]
        .sort((a, b) => (b.lastCookedOn ?? '').localeCompare(a.lastCookedOn ?? ''))
        .slice(0, 6),
    [recipes]
  );

  const nowMinutes = minutesOfTime(dateToTime(new Date()));

  const save = () => {
    if (!canSave || phase !== 'idle') return;
    setPhase('saving');
    void (async () => {
      try {
        if (existing) {
          await patchCheckinRecord(
            existing.id,
            {
              day,
              time,
              title: title.trim(),
              recipeSlug: slug,
              note: note.trim(),
              planned: isPlan,
            },
            existing.day
          );
        } else {
          await addCheckinRecord({
            day,
            time,
            title: title.trim(),
            recipeSlug: slug,
            note: note.trim(),
            planned: isPlan,
          });
        }
        setPhase('success');
        setResult({
          tone: 'success',
          title: existing ? '已更新' : isPlan ? `已安排到${dayLabel}` : `已记录到${dayLabel}`,
        });
        setTimeout(() => onClose(), 900);
      } catch (e) {
        setPhase('failure');
        setResult({
          tone: 'failure',
          title: '保存失败',
          caption: e instanceof Error ? e.message : '网络不太稳，再试一次',
        });
        setTimeout(() => {
          setResult(null);
          setPhase('idle');
        }, 1600);
      }
    })();
  };

  /** 计划 → 已吃：只翻 planned 一个字段，时间改为当下 */
  const confirmPlanInline = () => {
    if (!existing) return;
    setPhase('success');
    setResult({ tone: 'success', title: '已记为吃过' });
    void patchCheckinRecord(
      existing.id,
      { planned: false, time: dateToTime(new Date()) },
      existing.day
    )
      .catch(() => {
        setResult({ tone: 'failure', title: '没能确认', caption: '网络不太稳，再试一次' });
        setTimeout(() => {
          setResult(null);
          setPhase('idle');
        }, 1600);
      })
      .then(() => {
        setTimeout(() => onClose(), 500);
      });
  };

  const remove = async () => {
    if (!existing) return;
    setConfirmDelete(false);
    setPhase('success');
    setResult({
      tone: 'success',
      title: existing.planned ? '已取消这条计划' : '已删除这条记录',
    });
    await removeCheckinRecord(existing.id, day);
    setTimeout(() => onClose(), 500);
  };

  const inputText = selected ? selected.title : query;
  const clearInput = () => {
    setQuery('');
    setSlug(null);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        snapPoints={['50%']}
        title={existing ? (isPlan ? '修改计划' : '修改记录') : isPlan ? '安排一道' : '记一笔'}
        subtitle={dayLabel}
        footer={
          <View style={elevationStyle.card}>
            <Button size="lg" block disabled={!canSave || busy} onPress={save}>
              {phase === 'saving' ? '保存中…' : existing ? '更新' : isPlan ? '安排' : '记下'}
            </Button>
          </View>
        }>
        <View style={{ rowGap: 12, paddingBottom: 12 }}>
          {existing?.photoPath ? (
            <View className="border-hair/70 bg-card rounded-group overflow-hidden border">
              <RemoteImage
                src={existing.photoPath}
                accessibilityLabel="这条记录的照片"
                style={{ width: '100%', height: 168, backgroundColor: '#EBEBF0' }}
              />
              <View className="border-hair/70 border-t px-4 py-2.5">
                <Micro>照片不可更换 · 删除记录会一并删除</Micro>
              </View>
            </View>
          ) : null}

          {isPlan && !existing ? (
            <View className="bg-tint rounded-group flex-row items-start gap-2.5 px-4 py-3">
              <View className="mt-0.5 shrink-0">
                <Icon name="calendar-plus" size="md" tone="accent" />
              </View>
              <Caption className="flex-1 leading-relaxed">
                {dayLabel}还没到，这会存成一条用餐计划；到那天在「今日」确认一下即可。
              </Caption>
            </View>
          ) : null}

          {/* 大输入框：标题即输入，菜谱匹配是输入途中的建议 */}
          <View
            className="bg-card flex-row items-center rounded-[20px]"
            style={{
              paddingHorizontal: 16,
              minHeight: 64,
              borderWidth: 1.5,
              borderColor: inputFocused ? color.accent : color.hair,
              ...(inputFocused ? elevationStyle.lift : undefined),
            }}>
            <View className="mr-3 shrink-0">
              <Icon name={mealOfTime(time).icon} size="xl" tone="muted" />
            </View>
            <TextInput
              value={inputText}
              onChangeText={(v) => {
                setQuery(v);
                setSlug(null);
              }}
              placeholder={isPlan ? '想安排哪道菜？' : '刚吃了什么？'}
              placeholderTextColor="#C7C7CC"
              accessibilityLabel="吃了什么"
              returnKeyType="done"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: '500',
                color: color.ink,
                paddingVertical: 8,
                paddingRight: 8,
              }}
            />
            {inputText.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="清空"
                hitSlop={8}
                onPress={clearInput}
                className="h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <Icon name="x" size="md" tone="muted" strokeWidth={2.2} />
              </Pressable>
            ) : null}
          </View>

          {/* 匹配建议：把这句话换成菜谱，就多挂上详情与历史 */}
          {query.trim() && matches.length > 0 && !selected ? (
            <View className="border-hair/70 bg-card rounded-group overflow-hidden border">
              {matches.map((r, i) => (
                <MatchRow
                  key={r.slug}
                  recipe={r}
                  separated={i < matches.length - 1}
                  onPress={() => {
                    setSlug(r.slug);
                    setQuery('');
                  }}
                />
              ))}
            </View>
          ) : null}

          {/* 最近吃过：真实按上次做于排序；笔记入口并到同一行，消掉孤悬的小药丸 */}
          {!query.trim() && !selected ? (
            recipesLoading ? (
              <View className="flex-row" style={{ gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[38px] w-24" rounded={99} />
                ))}
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between px-1">
                  <Caption tone="soft">最近吃过</Caption>
                  {noteOpen ? null : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="添加笔记"
                      hitSlop={6}
                      onPress={() => setNoteOpen(true)}
                      className="flex-row items-center gap-1 px-1 py-0.5">
                      <Icon name="plus" size="sm" tone="accent" strokeWidth={2.2} />
                      <Body tone="accent" size="text-[13px]" weight="font-medium">
                        笔记
                      </Body>
                    </Pressable>
                  )}
                </View>
                {recipes.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
                    {recentlyCooked.map((r) => (
                      <Pressable
                        key={r.slug}
                        accessibilityRole="button"
                        accessibilityLabel={`选 ${r.title}`}
                        onPress={() => setSlug(r.slug)}
                        className="border-hair bg-card active:border-indigo/40 h-9 shrink-0 flex-row items-center gap-1.5 rounded-full border px-3.5">
                        <Icon name="utensils-crossed" size="sm" tone="accent" />
                        <Body size="text-[14px]" weight="font-medium" numberOfLines={1}>
                          {r.title}
                        </Body>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <Caption tone="muted" className="px-1 pt-2">
                    菜谱库还是空的，直接写下吃了什么
                  </Caption>
                )}
              </View>
            )
          ) : null}

          {/* 餐段分段控件：灰底轨道 + 白色浮起卡片（iOS 分段语言），选段即定时间 */}
          <View className="bg-fill flex-row rounded-full" style={{ padding: 3, gap: 2 }}>
            {COMPOSER_SEGMENTS.map((seg) => {
              const active = segmentOfTime(time) === seg.value;
              return (
                <Pressable
                  key={seg.value}
                  accessibilityRole="button"
                  accessibilityLabel={seg.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    const next = segmentDefaultTime(seg.value, nowMinutes);
                    setTime(next ?? dateToTime(new Date()));
                  }}
                  className="h-[34px] flex-1 items-center justify-center rounded-full"
                  style={
                    active ? [elevationStyle.card, { backgroundColor: color.card }] : undefined
                  }>
                  <Body
                    size="text-[14px]"
                    weight={active ? 'font-semibold' : 'font-medium'}
                    tone={active ? 'ink' : 'muted'}>
                    {seg.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          {noteOpen ? (
            <View className="border-hair/70 bg-card rounded-[16px] border px-4 py-1">
              <TextArea
                value={note}
                onChange={setNote}
                rows={2}
                bare
                label={isPlan ? '备忘' : '这次的笔记'}
                placeholder={
                  isPlan ? '例：周三买牛腩，提前一晚解冻' : '例：糖减一半刚好，收汁多给 5 分钟'
                }
              />
            </View>
          ) : query.trim() || selected ? (
            /* 笔记入口的家（最近吃过行）被输入态顶掉了，就近补一个 */
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="添加笔记"
              hitSlop={6}
              onPress={() => setNoteOpen(true)}
              className="flex-row items-center gap-1.5 self-start px-1 py-0.5">
              <Icon name="plus" size="sm" tone="accent" strokeWidth={2.2} />
              <Body tone="accent" size="text-[13px]" weight="font-medium">
                写句笔记
              </Body>
            </Pressable>
          ) : null}

          {existing && existing.planned ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="按计划吃了，确认一下"
              onPress={confirmPlanInline}
              className="bg-lake-tint h-10 flex-row items-center justify-center gap-1.5 rounded-[12px] active:opacity-70">
              <Icon name="check" size="md" tone="lake" strokeWidth={2.6} />
              <Body tone="lake" weight="font-semibold">
                按计划吃了，确认一下
              </Body>
            </Pressable>
          ) : null}

          {existing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={existing.planned ? '取消这条计划' : '删除这条记录'}
              onPress={() => setConfirmDelete(true)}
              className="h-10 items-center justify-center">
              <Body tone="danger" size="text-[13px]">
                {existing.planned ? '取消这条计划' : '删除这条记录'}
              </Body>
            </Pressable>
          ) : null}
        </View>

        <SuccessOverlay
          open={resultOpen}
          tone={result?.tone ?? 'success'}
          title={result?.title ?? ''}
          caption={result?.caption}
        />
      </Sheet>

      {/* 删除确认：叠在弹层之上，用系统 Modal 呈现 */}
      <Alert
        open={confirmDelete}
        title={existing?.planned ? '取消这条计划？' : '删除这条记录？'}
        message={
          existing?.planned
            ? `${dayLabel}的这条安排将被移除，无法恢复。`
            : `${dayLabel}的这条记录将被移除，无法恢复。`
        }
        confirmLabel={existing?.planned ? '取消计划' : '删除'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}

/** 匹配行：菜谱名 + 用时，点一下把这句话换成菜谱 */
function MatchRow({
  recipe,
  separated,
  onPress,
}: {
  recipe: Recipe;
  separated: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`换成菜谱 ${recipe.title}`}
      onPress={onPress}
      className={`active:bg-fill/60 flex-row items-center gap-3 px-4 ${separated ? 'border-hair/70 border-b' : ''}`}
      style={{ height: 52 }}>
      <View className="bg-tint h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon name="book-open" size="md" tone="accent" />
      </View>
      <View className="min-w-0 flex-1">
        <Body numberOfLines={1} size="text-[15px]" weight="font-medium">
          {recipe.title}
        </Body>
      </View>
      <Caption tone="muted">{recipe.minutes}′</Caption>
    </Pressable>
  );
}
