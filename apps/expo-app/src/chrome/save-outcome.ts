/**
 * 保存结果模拟器 —— UI 阶段临时件，接真实接口后删除
 * ------------------------------------------------------------------
 * 现在只做 UI 与交互，真实网络结果还没接进来。为了让「失败态」也能被看见、
 * 被反复检验，保存时按固定概率随机给出成功或失败。
 *
 * 接入真实保存后：删掉这个文件，把 checkin.tsx / photo-checkin.tsx 的调用点
 * 换成接口返回值即可 —— 成功态与失败态都已经是现成的。
 */

/** 失败概率：0.5 = 成功失败各半，方便来回看到两种动画 */
export const SIMULATED_FAILURE_RATE = 0.5;

export type SaveOutcome = 'success' | 'failure';

export function simulateSaveOutcome(): SaveOutcome {
  return Math.random() < SIMULATED_FAILURE_RATE ? 'failure' : 'success';
}
