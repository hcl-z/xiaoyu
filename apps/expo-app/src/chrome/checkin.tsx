/**
 * 打卡弹层 · 入口与宿主
 * ------------------------------------------------------------------
 * 与 Web 的 CheckinProvider 同一套行为：FAB 唤起、就地弹出、不离开当前页；
 * 未来日期写的是「计划」，当天可以一键确认成「已吃」。
 * 餐次与份量已经不在界面上出现：吃什么就是什么，不再先归类。
 *
 * 原生差异：Web 用 portal 到 body 解决 transform 包含块的问题，
 * 原生直接把整层浮层挂成覆盖全屏的 box-none 容器，两个扇出按钮用极坐标定位。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Badge, ListRow, Section, Skeleton } from '@/components/surfaces';
import { Body, Caption, Micro } from '@/components/text';
import { Button } from '@/components/button';
import { SearchField, TextArea } from '@/components/inputs';
import { apiUrl, authedImageSource } from '@/data/client';
import { useCheckins, useRecipes } from '@/data/store';
import type { Checkin } from '@/data/types';
import { todayISO } from '@/domain/date';
import { pickPhoto, uploadPhoto, type PreparedPhoto, type PhotoSource } from '@/photo';
import { motion as mt } from '@/theme';

import { Alert, SuccessOverlay } from './overlays';
import { PhotoCheckinModal } from './photo-checkin';
import { simulateSaveOutcome } from './save-outcome';
import { Sheet } from './sheet';

type OpenOpts = { recipe?: string | null; day?: string; existing?: Checkin };
type PhotoOpts = { day?: string };

/** 保存流程的显式状态：失败要能被看见，也要能原地重试 */
type SavePhase = 'idle' | 'saving' | 'success' | 'failure';

type CheckinCtx = {
  /** 当前正在浏览的日期；FAB 据此决定是「记一笔」还是「安排一道」 */
  activeDay: string;
  setActiveDay: (day: string) => void;
  openCheckin: (opts?: OpenOpts) => void;
  /** 照片打卡：与菜谱打卡共用同一种入口，体裁不同 */
  openPhotoCheckin: (opts?: PhotoOpts) => void;
  /** 把一条计划直接确认为已吃，不必打开弹层 */
  confirmPlan: (record: Checkin) => Promise<void>;
};

const Ctx = createContext<CheckinCtx | null>(null);

export function useCheckinSheet(): CheckinCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCheckinSheet must be used within CheckinProvider');
  return ctx;
}

export function CheckinProvider({ children }: { children: ReactNode }) {
  const today = todayISO();
  const { addCheckin, patchCheckin, removeCheckin } = useCheckins();
  const { recipes, loading: recipesLoading } = useRecipes();

  const [activeDay, setActiveDay] = useState(today);

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(today);
  const [existing, setExisting] = useState<Checkin | undefined>();
  const [query, setQuery] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState<SavePhase>('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ---- 照片打卡：同一种入口，但体裁是「拼一张卡片」而不是填表单 ---- */
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoDay, setPhotoDay] = useState(today);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const openPhotoCheckin = useCallback(
    (opts?: PhotoOpts) => {
      setPhotoDay(opts?.day ?? today);
      setPhotoCaption('');
      setPhoto(null);
      setPhotoError('');
      setPhotoBusy(false);
      setPhotoSaved(false);
      setPhotoFailed(false);
      setPhotoOpen(true);
    },
    [today]
  );

  const choosePhoto = useCallback(async (source: PhotoSource) => {
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const picked = await pickPhoto(source);
      if (picked) setPhoto(picked);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : '这张图读不出来，换一张试试');
    } finally {
      setPhotoBusy(false);
    }
  }, []);

  /** 结果展示期间不允许再点保存，避免失败态上又叠一次保存 */
  const canSavePhoto = photo !== null && !photoBusy && !photoSaved && !photoFailed;

  const savePhoto = useCallback(async () => {
    if (!photo || !canSavePhoto) return;
    setPhotoBusy(true);
    setPhotoError('');

    // UI 阶段：随机演练失败态；接入真实保存后换成接口返回值
    if (simulateSaveOutcome() === 'failure') {
      // 失败态自己就是反馈，按钮不再同时转圈
      setPhotoBusy(false);
      setPhotoFailed(true);
      setTimeout(() => {
        setPhotoFailed(false);
      }, 1400);
      return;
    }

    try {
      const photoId = await uploadPhoto(photo);
      setPhotoSaved(true);
      await addCheckin({
        day: photoDay,
        // 文案可空，照片本身就是内容
        title: photoCaption.trim() || '照片记录',
        recipeSlug: null,
        note: '',
        photoId,
      });
      setTimeout(() => {
        setPhotoOpen(false);
        setPhotoSaved(false);
        setPhoto(null);
      }, 700);
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : '保存失败');
      setPhotoSaved(false);
    } finally {
      setPhotoBusy(false);
    }
  }, [addCheckin, canSavePhoto, photo, photoCaption, photoDay]);

  const openCheckin = useCallback(
    (opts?: OpenOpts) => {
      const record = opts?.existing;
      setDay(opts?.day ?? record?.day ?? today);
      setExisting(record);
      setSlug(record?.recipeSlug ?? opts?.recipe ?? null);
      setQuery('');
      setNote(record?.note ?? '');
      setPhase('idle');
      setConfirmDelete(false);
      setOpen(true);
    },
    [today]
  );

  /** 一个字段承担两件事：过滤菜谱；无匹配时首行即「添加"xxx"」 */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = recipes.filter((r) => r.slug !== slug);
    if (!q) return pool.slice(0, 6);
    return pool
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, recipes, slug]);

  const selected = recipes.find((r) => r.slug === slug) ?? null;
  const manualTitle = existing && !selected ? query.trim() || existing.title : query.trim();
  const title = selected?.title ?? (slug === null ? manualTitle : '');
  const canSave = title.trim().length > 0;
  const dayLabel =
    day === today ? '今天' : `${Number(day.slice(5, 7))}月${Number(day.slice(8, 10))}日`;

  /** 未来日期写入的是「计划」；改一条已有记录时沿用它自己的属性 */
  const isPlan = existing ? existing.planned : day > today;
  const verb = isPlan ? '安排' : '记录';
  /** 保存中 / 结果展示中都算忙，避免连点 */
  const busy = phase !== 'idle';
  /** 只有走到结果才覆盖结果态；「保存中」仍然看得到表单 */
  const resultOpen = phase === 'success' || phase === 'failure';

  const close = useCallback(() => {
    setPhase('idle');
    setOpen(false);
  }, []);

  const save = useCallback(() => {
    if (!canSave || phase !== 'idle') return;
    setPhase('saving');
    setTimeout(() => {
      // UI 阶段：随机演练失败态；接入真实保存后换成接口返回值
      if (simulateSaveOutcome() === 'failure') {
        setPhase('failure');
        setTimeout(() => setPhase('idle'), 1400);
        return;
      }
      void (async () => {
        if (existing) {
          await patchCheckin(
            existing.id,
            {
              day,
              title: title.trim(),
              recipeSlug: slug,
              note: note.trim(),
              planned: isPlan,
            },
            existing.day
          );
        } else {
          await addCheckin({
            day,
            title: title.trim(),
            recipeSlug: slug,
            note: note.trim(),
            planned: isPlan,
          });
        }
        setPhase('success');
        setTimeout(() => {
          setOpen(false);
          setPhase('idle');
        }, 900);
      })();
    }, 700);
  }, [addCheckin, canSave, day, existing, isPlan, note, patchCheckin, phase, slug, title]);

  /** 计划 → 已吃：只翻 planned 一个字段，时间改为当下 */
  const confirmPlan = useCallback(
    async (record: Checkin) => {
      await patchCheckin(
        record.id,
        { planned: false, time: new Date().toTimeString().slice(0, 5) },
        record.day
      );
    },
    [patchCheckin]
  );

  const remove = useCallback(async () => {
    if (!existing) return;
    setConfirmDelete(false);
    setPhase('success');
    await removeCheckin(existing.id, day);
    setTimeout(() => {
      setOpen(false);
      setPhase('idle');
      setExisting(undefined);
    }, 500);
  }, [day, existing, removeCheckin]);

  const confirmExistingPlan = useCallback(() => {
    if (!existing) return;
    setPhase('success');
    void confirmPlan(existing).then(() => {
      setTimeout(() => {
        setOpen(false);
        setPhase('idle');
      }, 500);
    });
  }, [confirmPlan, existing]);

  const value = useMemo<CheckinCtx>(
    () => ({ activeDay, setActiveDay, openCheckin, openPhotoCheckin, confirmPlan }),
    [activeDay, openCheckin, openPhotoCheckin, confirmPlan]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      <Sheet
        open={open}
        onClose={close}
        title={existing ? (isPlan ? '修改计划' : '修改记录') : isPlan ? '安排一道' : '记一笔'}
        subtitle={dayLabel}
        action={
          canSave ? { label: existing ? '更新' : '保存', onPress: save, disabled: busy } : undefined
        }
        footer={
          <Button size="lg" block disabled={!canSave || busy} onPress={save}>
            {phase === 'saving'
              ? '保存中…'
              : existing
                ? `更新${dayLabel}${isPlan ? '计划' : '记录'}`
                : `${verb}到${dayLabel}`}
          </Button>
        }>
        <View style={{ rowGap: 20, paddingBottom: 8 }}>
          {existing?.photoId ? (
            <View className="border-hair/70 bg-card rounded-group overflow-hidden border">
              <PhotoPreview photoId={existing.photoId} />
              <View className="border-hair/70 border-t px-4 py-2.5">
                <Micro>照片打卡 · 照片不可更换，删除记录会一并删除</Micro>
              </View>
            </View>
          ) : null}

          {isPlan ? (
            <View className="bg-tint rounded-group flex-row items-start gap-2.5 px-4 py-3">
              <View className="mt-0.5 shrink-0">
                <Icon name="calendar-plus" size="md" tone="accent" />
              </View>
              <Caption className="flex-1 leading-relaxed">
                {day > today
                  ? `${dayLabel}还没到，这会存成一条用餐计划。到那天在「今日」确认一下，就计入打卡与菜谱的制作次数。`
                  : '这是一条尚未确认的计划，确认后才计入打卡与菜谱的制作次数。'}
              </Caption>
            </View>
          ) : null}

          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              if (v) setSlug(null);
            }}
            placeholder="搜索菜谱，或直接输入吃了什么"
          />

          {selected ? (
            <Section tone="deep">
              <ListRow
                title={selected.title}
                subtitle={`${selected.category} · ${selected.minutes} 分钟`}
                trailing={
                  <View className="shrink-0">
                    <Icon name="check" size="md" tone="accent" strokeWidth={2.4} />
                  </View>
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="重新选择菜谱"
                onPress={() => setSlug(null)}
                className="active:bg-tint/70 w-full px-4 py-2.5">
                <Body tone="accent">重新选择</Body>
              </Pressable>
            </Section>
          ) : (
            <Section
              title={query.trim() ? '搜索结果' : '最近吃过'}
              footer={
                query.trim()
                  ? `没有想要的？直接保存为「${query.trim()}」`
                  : '输入名称可搜索全部菜谱'
              }>
              {query.trim() ? (
                <ListRow
                  leading={
                    <View className="bg-fill rounded-thumb h-10 w-10 items-center justify-center">
                      <Icon name="plus" size="md" tone="muted" />
                    </View>
                  }
                  title={`添加「${query.trim()}」`}
                  subtitle="作为自定义记录保存"
                  accessory="chevron"
                  onPress={save}
                />
              ) : null}
              {recipesLoading ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <View key={i} className="flex-row items-center gap-3 px-4 py-3">
                      <Skeleton className="h-10 w-10" rounded={14} />
                      <View className="flex-1" style={{ rowGap: 6 }}>
                        <Skeleton className="h-3.5 w-28" rounded={4} />
                        <Skeleton className="h-2.5 w-20" rounded={4} />
                      </View>
                    </View>
                  ))}
                </>
              ) : results.length === 0 && !query.trim() ? (
                <View className="px-4 py-8">
                  <Caption className="text-center">
                    菜谱库还是空的，先在输入框里写下吃了什么
                  </Caption>
                </View>
              ) : (
                results.map((r) => (
                  <ListRow
                    key={r.slug}
                    title={r.title}
                    subtitle={`${r.category} · ${r.minutes} 分钟`}
                    value={`${r.minutes}′`}
                    onPress={() => {
                      setSlug(r.slug);
                      setQuery('');
                    }}
                  />
                ))
              )}
            </Section>
          )}

          {/* 这次做的心得：绑定了菜谱时会聚合到详情页的「历次笔记」 */}
          <Section
            tone="deep"
            title={isPlan ? '备忘' : '这次的笔记'}
            footer={
              selected
                ? isPlan
                  ? '要买什么、提前做什么，写在这里'
                  : `会出现在「${selected.title}」的历次笔记里`
                : '火候、用量、下次想改什么——可空着'
            }>
            <View className="px-4 py-3">
              <TextArea
                value={note}
                onChange={setNote}
                rows={2}
                label="这次的笔记"
                placeholder={
                  isPlan ? '例：周三买牛腩，提前一晚解冻' : '例：糖减一半刚好，收汁多给 5 分钟'
                }
              />
            </View>
          </Section>

          {existing && existing.planned ? (
            <Section tone="deep" footer="确认后这条就算真的吃过，并计入菜谱的制作次数">
              <ListRow
                leading={
                  <View className="h-[22px] w-[22px] items-center justify-center">
                    <Icon name="check" size="md" tone="lake" strokeWidth={2.6} />
                  </View>
                }
                title="按计划吃了，确认一下"
                subtitle="从计划转为已记录"
                accessory="chevron"
                onPress={confirmExistingPlan}
              />
            </Section>
          ) : null}

          {existing ? (
            <Section tone="deep">
              <ListRow
                leading={
                  <View className="h-[22px] w-[22px] items-center justify-center">
                    <Icon name="trash-2" size="md" tone="danger" />
                  </View>
                }
                title={existing.planned ? '取消这条计划' : '删除这条记录'}
                destructive
                onPress={() => setConfirmDelete(true)}
              />
            </Section>
          ) : null}

          <View className="border-hair/70 bg-paper rounded-group flex-row items-center justify-between gap-3 border px-4 py-3.5">
            <View className="min-w-0 flex-1">
              <Micro>{isPlan ? '将安排为' : '将保存为'}</Micro>
              <Body numberOfLines={1} className="mt-1">
                {title.trim() || '还没选择'}
              </Body>
            </View>
            <View className="shrink-0 flex-row items-center gap-2">
              {isPlan ? <Badge tone="lake">计划</Badge> : null}
            </View>
          </View>
        </View>

        <SuccessOverlay
          open={resultOpen}
          tone={phase === 'failure' ? 'failure' : 'success'}
          title={
            phase === 'failure'
              ? '保存失败'
              : existing
                ? '已更新'
                : isPlan
                  ? `已安排到${dayLabel}`
                  : `已记录到${dayLabel}`
          }
          caption={phase === 'failure' ? '网络不太稳，再试一次' : undefined}
        />
      </Sheet>

      {/* 删除确认：叠在弹层之上，用系统 Modal 呈现（背板 + 居中卡片） */}
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
        onConfirm={remove}
      />

      <PhotoCheckinModal
        open={photoOpen}
        onClose={() => {
          setPhotoOpen(false);
          setPhoto(null);
        }}
        dayLabel={
          photoDay === today
            ? '今天'
            : `${Number(photoDay.slice(5, 7))}月${Number(photoDay.slice(8, 10))}日`
        }
        dateLine={photoDateLine(photoDay)}
        caption={photoCaption}
        onCaptionChange={setPhotoCaption}
        photo={photo}
        busy={photoBusy}
        error={photoError}
        saved={photoSaved}
        failed={photoFailed}
        canSave={canSavePhoto}
        onPick={() => void choosePhoto(photo ? 'library' : 'camera')}
        onClear={() => setPhoto(null)}
        onSave={() => void savePhoto()}
      />
    </Ctx.Provider>
  );
}

function photoDateLine(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d, 12).getDay()];
  return `${y} 年 ${m} 月 ${d} 日 · 星期${weekday}`;
}

/** 打卡照片需要带会话头才能取到 */
function PhotoPreview({ photoId }: { photoId: number }) {
  return (
    <Image
      source={authedImageSource(apiUrl(`/api/photos/${photoId}`))}
      resizeMode="cover"
      accessibilityLabel="这条记录的照片"
      style={{ width: '100%', height: 192, backgroundColor: '#EBEBF0' }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* FAB — 右下角悬浮主操作                                                */
/* ------------------------------------------------------------------ */
const FAB_SIZE = 56;
const ITEM_SIZE = 48;
const FAN_RADIUS = 112;
const FAB_RIGHT = 20;

/**
 * 右下角悬浮主操作。
 *
 * 今天 / 过去：点击斜向扇出两枚子按钮——菜谱 60°、照片 105°；
 * 未来日期：FAB 是「安排计划」语义，那时拍照没意义，不展开菜单。
 */
export function CheckinLayer({ bottomOffset }: { bottomOffset: number }) {
  const { openCheckin, openPhotoCheckin, activeDay } = useCheckinSheet();
  const future = activeDay > todayISO();
  const [menuOpen, setMenuOpen] = useState(false);

  const expanded = menuOpen && !future;
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.set(withSpring(expanded ? 1 : 0, { ...mt.spring.toggle, mass: 1 }));
  }, [expanded, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get() * 45}deg` }],
  }));

  const items = [
    {
      key: 'recipe',
      angle: 60,
      label: '菜谱打卡',
      icon: 'book-open' as const,
      onPress: () => openCheckin({ day: activeDay }),
    },
    {
      key: 'photo',
      angle: 105,
      label: '照片打卡',
      icon: 'camera' as const,
      onPress: () => openPhotoCheckin({ day: activeDay }),
    },
  ].map((item) => {
    const rad = (item.angle * Math.PI) / 180;
    // 向左为负 x、向上为负 y；换算成「距屏幕右边 / 下边」的偏移
    const centerRight = FAB_RIGHT + FAB_SIZE / 2 + Math.cos(rad) * FAN_RADIUS;
    const centerBottom = bottomOffset + FAB_SIZE / 2 + Math.sin(rad) * FAN_RADIUS;
    return {
      ...item,
      right: centerRight - ITEM_SIZE / 2,
      bottom: centerBottom - ITEM_SIZE / 2,
    };
  });

  if (future) {
    return (
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="安排一道"
          onPress={() => openCheckin({ day: activeDay })}
          className="bg-indigo active:bg-indigo-deep absolute h-14 w-14 items-center justify-center rounded-full"
          style={{ right: FAB_RIGHT, bottom: bottomOffset }}>
          <Icon name="calendar-plus" size="xl" tone="invert" strokeWidth={2.2} />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      {expanded ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="收起"
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {items.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                setMenuOpen(false);
                item.onPress();
              }}
              className="bg-indigo active:bg-indigo-deep absolute h-12 w-12 items-center justify-center rounded-full"
              style={{ right: item.right, bottom: item.bottom }}>
              <Icon name={item.icon} size="lg" tone="invert" />
            </Pressable>
          ))}
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? '收起' : '记一笔'}
        accessibilityState={{ expanded }}
        onPress={() => setMenuOpen((v) => !v)}
        className="bg-indigo active:bg-indigo-deep absolute h-14 w-14 items-center justify-center rounded-full"
        style={{ right: FAB_RIGHT, bottom: bottomOffset }}>
        <Animated.View style={iconStyle}>
          <Icon name="plus" size="xl" tone="invert" strokeWidth={2.4} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
