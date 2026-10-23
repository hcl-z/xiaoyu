/**
 * 动态 Expo 配置：app.json 仍是唯一手写事实源，这里只补两件静态 json 做不到的事——
 *
 * 1. android.versionCode 由版本号计算（1.2.3 → 1002003）：Android 只认递增的整数版本，
 *    由版本号推导就不会出现「升了版本忘了升 versionCode」的装不上的更新。
 * 2. ios.buildNumber 走 DAILY_IOS_BUILD_NUMBER：发布脚本（scripts/release-ios.mjs）
 *    用 UTC 时间生成，只在构建时注入。
 */
import appJson from './app.json';

const [major, minor, patch] = appJson.expo.version!.split('.').map(Number);

export default {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    buildNumber: process.env.DAILY_IOS_BUILD_NUMBER,
  },
  android: {
    ...appJson.expo.android,
    versionCode: major! * 1_000_000 + minor! * 1_000 + patch!,
  },
};
