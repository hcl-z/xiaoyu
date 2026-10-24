/**
 * 打卡弹层 · 入口与宿主
 * ------------------------------------------------------------------
 * 表单主体在 checkin-composer.tsx；这里只负责挂载、上下文与照片打卡。
 * FAB 扇出两条独立体裁：文字记一笔、拍立得照片打卡；未来日期直接是「安排一道」。
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
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { useCheckins } from '@/data/store';
import type { Checkin } from '@/data/types';
import { todayISO } from '@/domain/date';
import { pickPhoto, uploadPhoto, type PreparedPhoto, type PhotoSource } from '@/photo';
import { motion as mt } from '@/theme';

import { PhotoCheckinModal } from './photo-checkin';
import { CheckinComposer } from './checkin-composer';

type OpenOpts = { recipe?: string | null; day?: string; existing?: Checkin };
type PhotoOpts = { day?: string };

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
  const { addCheckin, patchCheckin } = useCheckins();

  const [activeDay, setActiveDay] = useState(today);

  /* ---- 表单弹层：session 每次打开 +1，composer 换届即全新状态 ---- */
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [day, setDay] = useState(today);
  const [existing, setExisting] = useState<Checkin | undefined>();
  const [presetRecipe, setPresetRecipe] = useState<string | null>(null);

  /* ---- 照片打卡：同一种入口，但体裁是「拼一张卡片」而不是填表单 ---- */
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoDay, setPhotoDay] = useState(today);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);
  /**
   * 失败态不再单独存一份状态：它只由真实错误触发，
   * 所以直接从「有错误文案」派生，避免两个状态互相打架。
   */
  const photoFailed = photoError !== '';

  const openPhotoCheckin = useCallback(
    (opts?: PhotoOpts) => {
      setPhotoDay(opts?.day ?? today);
      setPhotoCaption('');
      setPhoto(null);
      setPhotoError('');
      setPhotoBusy(false);
      setPhotoSaved(false);
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

    try {
      const photoPath = await uploadPhoto(photo, 'checkins');
      setPhotoSaved(true);
      await addCheckin({
        day: photoDay,
        // 文案可空，照片本身就是内容
        title: photoCaption.trim() || '照片记录',
        recipeSlug: null,
        note: '',
        photoPath,
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
      setDay(opts?.day ?? record?.day ?? activeDay);
      setExisting(record);
      setPresetRecipe(opts?.recipe ?? null);
      setSession((s) => s + 1);
      setOpen(true);
    },
    [activeDay]
  );

  const close = useCallback(() => setOpen(false), []);

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

  const value = useMemo<CheckinCtx>(
    () => ({ activeDay, setActiveDay, openCheckin, openPhotoCheckin, confirmPlan }),
    [activeDay, openCheckin, openPhotoCheckin, confirmPlan]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {session > 0 ? (
        <CheckinComposer
          key={session}
          open={open}
          day={day}
          existing={existing}
          presetRecipe={presetRecipe}
          onClose={close}
        />
      ) : null}

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

/* ------------------------------------------------------------------ */
/* FAB — 右下角悬浮主操作：今天/过去扇出「菜谱打卡 · 照片打卡」两条独立体裁 */
/* ------------------------------------------------------------------ */
const FAB_SIZE = 56;
const ITEM_SIZE = 48;
const ITEM_GAP = 14;
const FAB_RIGHT = 20;

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

  /**
   * 照片是与文字并列的独立体裁，不是表单里的一个字段。
   * 子按钮在 FAB 正上方竖排、与其右对齐：极坐标扇出在 430 宽的
   * 屏幕上会把按钮推出右缘，竖排永远不会裁切。
   */
  const items = [
    {
      key: 'recipe',
      label: '记一笔',
      icon: 'utensils-crossed' as const,
      onPress: () => openCheckin({ day: activeDay }),
    },
    {
      key: 'photo',
      label: '拍一张',
      icon: 'camera' as const,
      onPress: () => openPhotoCheckin({ day: activeDay }),
    },
  ].map((item, i) => ({
    ...item,
    right: FAB_RIGHT + (FAB_SIZE - ITEM_SIZE) / 2,
    bottom: bottomOffset + FAB_SIZE + ITEM_GAP + (ITEM_SIZE + ITEM_GAP) * (1 - i),
  }));

  if (future) {
    return (
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="安排一道"
          onPress={() => openCheckin({ day: activeDay })}
          className="bg-indigo active:bg-indigo-deep absolute items-center justify-center rounded-full"
          style={{ right: FAB_RIGHT, bottom: bottomOffset, width: FAB_SIZE, height: FAB_SIZE }}>
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
        accessibilityLabel={expanded ? '收起' : '打卡'}
        accessibilityState={{ expanded }}
        onPress={() => setMenuOpen((v) => !v)}
        className="bg-indigo active:bg-indigo-deep absolute items-center justify-center rounded-full"
        style={{ right: FAB_RIGHT, bottom: bottomOffset, width: FAB_SIZE, height: FAB_SIZE }}>
        <Animated.View style={iconStyle}>
          <Icon name="plus" size="xl" tone="invert" strokeWidth={2.4} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
