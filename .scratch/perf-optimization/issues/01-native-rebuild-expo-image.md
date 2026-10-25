# expo-image 为原生模块，dev client 需重新构建

Status: ready-for-human

## 背景

性能专项引入 `expo-image@~57.0.5`（`apps/expo-app/package.json`）。它是原生模块，
JS 侧 `pnpm install` 已完成，但本仓库用 `expo run:ios` / `run:android` 的自定义 dev client，
**不带 Expo Go**，原生层还没有这个模块。

## 需要做的事

```bash
# iOS
cd apps/expo-app/ios && pod install && cd ..
pnpm run ios

# Android
pnpm run android
```

## 影响

构建完成前，Metro 热更加载新 bundle 会在图片处报原生视图不存在的错；
web 端不受影响（`expo export --platform web` 已验证通过）。

## Comments

- 2026-10-25 · 性能专项创建。生产 web bundle 编译已验证依赖图无误。
- 2026-10-25 · **iOS 侧已完成并验证**：`pod install` 成功（`ExpoImage` 已入 Podfile.lock），
  重新构建安装到 iPhone 17 Pro 模拟器后 App 干净启动——欢迎页 / 登录页正常渲染，
  `dailyplus:///login` 深链路由正常，无原生模块缺失崩溃（根布局即依赖 expo-image，
  缺模块会在启动时红屏）。Metro 仍在 8081 运行，可热更。
- 待办：Android 侧 `pnpm run android` 需要设备/模拟器，留给下一次 Android 构建时完成。
