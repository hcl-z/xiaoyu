# daily + · iOS 风格菜谱与饮食打卡

pnpm 管理的 monorepo：Web 应用（前端 + 自建后端 API）与 Expo 移动应用，数据存
Supabase Postgres，ORM 用 Drizzle。

## 目录结构

```text
apps/
├── web/       # Next.js：产品界面（今日 / 菜谱 / 我的）+ API 路由 + Drizzle
└── expo-app/  # Expo Router：与 Web 平行的原生应用，含应用内更新
scripts/       # 发布脚本（release-android / release-ios / changelog）
.github/       # Release phone app 工作流
```

## 开发

```bash
pnpm install

# Web（默认命令；API 与页面都从这里出）
pnpm dev            # http://localhost:3000

# 移动应用（Expo Go 可用；应用内更新只在发布构建生效）
pnpm dev:expo       # Metro，然后 a / i

# 检查
pnpm check:all      # 两个应用的 lint + typecheck
```

`apps/web` 需要 `DATABASE_URL`（Supabase 事务池器 6543 端口）写在
`apps/web/.env.local`；数据库结构由 Drizzle 迁移管理：

```bash
pnpm --filter @recipe/web db:generate   # 改 src/db/schema.ts 后生成迁移
pnpm --filter @recipe/web db:migrate    # 应用到 Supabase
```

移动端默认连开发机 `:3000`（Metro 主机自动发现）；装好的 APK 在
「我的 › 服务器地址」里改成后端所在电脑的局域网地址。

## 发布手机应用（GitHub Releases，不依赖 EAS）

版本是 `apps/expo-app/app.json` 的 `version`（Android versionCode 由它推导，
见 `app.config.ts`）。发布说明来自根 `CHANGELOG.md` 对应小节。

1. 在 `CHANGELOG.md` 写好该版本的 `## [X.Y.Z]` 小节，需要时升 `version` 并提交推送；
2. 手动触发 Actions 里的 **Release phone app** 工作流（`gh workflow run
   release-mobile.yml --ref <分支>`），它创建 `mobile-vX.Y.Z` 的 draft release，
   在 Ubuntu 上构建签名 APK、在 macOS 上构建免签名 ipa，并上传到 draft；
3. 检查无误后发布（发布即打 tag）：

```bash
gh release edit mobile-vX.Y.Z --draft=false
```

Android 应用每天自动检查一次新版本（GitHub API），发现后弹窗，应用内下载
（带进度）并调起系统安装器；「我的 › 软件更新」可随时手动检查。iOS 的 ipa
需要用 AltStore / Sideloadly 等工具以个人 Apple ID 签名后安装。

### 一次性配置：Android 签名密钥

发布密钥是 alias 为 `dailyplus` 的 PKCS12 keystore，维护者保存在
`~/Library/Application Support/dailyplus/android-keys/`（`release.keystore` 与
`release.keystore.password`）。丢失它，已安装的应用将无法原地更新。仓库的
Actions secrets 需要配置：

```bash
keys="$HOME/Library/Application Support/dailyplus/android-keys"
base64 -i "$keys/release.keystore" | gh secret set ANDROID_KEYSTORE
gh secret set ANDROID_KEYSTORE_PASSWORD < "$keys/release.keystore.password"
```

`scripts/release-android.mjs` 里钉死了发布证书的 SHA-256，任何其他签名的 APK
都会被构建拒绝——Android 只接受与已装应用同签名的更新。

### 从本机构建

```bash
pnpm release-android   # dist/android/daily-<version>-android.apk（需 Android SDK + JDK 17）
pnpm release-ios       # dist/ios/daily-<version>-ios.ipa（需 Xcode + CocoaPods）
```

## 新增子项目

将项目放到 `apps/<name>` 下，并确保它有独立的 `package.json`。pnpm 会自动将其纳入
workspace，再按需在根 `package.json` 加 `--filter` 别名。
