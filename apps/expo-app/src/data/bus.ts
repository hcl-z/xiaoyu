/**
 * daily + · DATA BUS
 * ------------------------------------------------------------------
 * Web 用 window 上的 CustomEvent 通知「菜谱变了 / 打卡变了 / 分类标签变了」，
 * 原生换成进程内的事件总线——订阅形状与触发时机保持一致，
 * 屏幕代码因此可以逐字对应，不必各自发明刷新策略。
 */

export type DataEventType = 'recipes' | 'checkins' | 'taxonomies' | 'auth';

export type DataEvent = {
  type: DataEventType;
  /** 打卡事件带上日期，只有关心这一天的调用方需要重新拉取 */
  day?: string;
};

type Listener = (event: DataEvent) => void;

const listeners = new Set<Listener>();

export function emitDataEvent(event: DataEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeData(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
