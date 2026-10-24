# daily +

精致柔和的 iOS 风菜谱管理与饮食打卡 App（Expo / React Native），**数据与服务全部由 Supabase 承载**：认证 Supabase Auth、数据 Postgres（RLS 行级隔离）、照片 Storage。

## 结构

```
apps/expo-app        # 应用（Expo SDK 57 / expo-router / NativeWind）
  src/data           # supabase 客户端、数据 hook、Storage 照片、起步种子
  modules/updater    # 应用内更新（GitHub Releases 检查 + 下载安装）
scripts              # 本地打包（release-android / release-ios）
.github/workflows    # 发布工作流：出签名 APK + 免签名 ipa，全在 GitHub 上完成
```

## 开发

```bash
pnpm install
pnpm dev             # Metro（--offline）
pnpm ios / pnpm android   # 原生构建运行（自定义原生模块需 dev build）
pnpm check           # typecheck + lint + prettier
```

`.env`（已入库，均为公开值）：`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY`（publishable key，权限由 RLS 决定）。

## 发布

版本来自 `apps/expo-app/app.json`，发布说明来自 `CHANGELOG.md` 对应小节。
手动触发 GitHub Actions `Release phone app` → 构建 APK/iPA → 草稿 Release → 手动发布并打 `mobile-v<版本>` 标签。Android 端支持应用内更新。

## 数据模型

- `recipes` / `checkins` / `taxonomies`：`user_id uuid`，RLS 策略 `user_id = auth.uid()`（经 `public.app_uid()` 桥接，auth schema 不直接授权）。
- 照片：Storage 桶 `checkin-photos`（公开读），路径 `{uid}/checkins|covers/xxx.jpg`。
- 统计（连续天数 / 28 天热力图 / 总计）由客户端按原始记录现算。
- 新账号自动写入 6 道起步菜谱与默认分类标签（登录时空账号自动补种）。
