# 性能与体验优化专项（1.0.3 · feat/ui）

范围：`apps/expo-app`。两轮推进：第一轮数据层 + 启动 + 图片，第二轮韧性 + 移动端惯例。
结论：**13 项已落地并验证**（见「已落地」），2 项遗留待排期（见 issues/）。

## 一、审计发现

### 第一轮（数据层 / 启动 / 图片）

- **F1 · 数据层重复请求（最大头）**：`useTaxonomies` 内部调 `useRecipes()`，三个标签页常驻后
  **一次打卡触发约 10+ 条查询**（2×stats×3 子查询 + 2×recipes 全表 + 多次 checkins）；
  `CheckinProvider` 挂 `useCheckins()` 与今日页重复拉取；一次操作连发多个事件逐个触发重拉。
- **F2 · 回访闪骨架屏**：`useRecipes` / `useCheckins` 初始 state 为空，会话缓存不播种。
- **F3 · 乐观更新到屏慢**：写入只更新 provider 实例自己的 state，今日页要等一个网络往返。
- **F4 · 启动白屏**：splash 未保持到会话恢复完成，冷启动必闪白纸。
- **F5 · 图片无缓存无降采样**：核心 Image，48px 缩略图按整张 1600px 解码，每次冷启动重新下载。
- **F6 · 计数同步拉全量**：`syncRecipeCookStats` 把整段打卡历史拉回客户端算 count + 最近一天。
- **F7 · 登出在途响应**：登出→换号期间，恢复中的响应可能落到新账号界面（原有隐患）。

### 第二轮（韧性 / 惯例）

- **F8 · `useTaxonomies` 漏合并**：我的页 + 菜谱页两个常驻实例各自拉取（第一轮只合并了其它四类资源）。
- **F9 · 无下拉刷新**：三个 Tab 页都没有 RefreshControl，移动端基本期待，也是出错时唯一自救手段。
- **F10 · 加载失败伪装成空态**：断网冷启动时菜谱页显示「菜谱库还是空的」+「新建第一道菜」、
  今日页显示「今天还没开张」——把「没加载到」当「真的为空」误导用户。
- **F11 · 更新下载进度无节流**：每数据块 setState 一次，整页 Profile 跟着重渲染。

复核过没有问题的部分（第二轮排查）：图标具名导入可摇树；Sheet 键盘联动（interactive）；
编辑器脏检查与连点保护；登录 busy/error 处理；图表组件全部走 Reanimated UI 线程；
无障碍标注全面。

## 二、已落地（对照文件）

| # | 改动 | 文件 |
|---|------|------|
| 1 | 请求合并 `sharedFetch`：recipes / checkins:day / range / stats 多实例共享一次网络请求 | `src/data/store.ts` |
| 2 | 事件去抖：`useDataEvents` 150ms 窗口合并，同 (type,day) 取最后一次、不同事件各送达一次 | `src/data/store.ts` |
| 3 | 打卡写入抽成模块函数，CheckinProvider 不再挂 `useCheckins`；写入先广播乐观值、保存后再广播兜底 | `store.ts`、`chrome/checkin.tsx`、`chrome/checkin-composer.tsx` |
| 4 | 缓存播种：`useRecipes` 播种会话缓存；新增按日缓存 `sessionDays` 播种 `useCheckins` | `src/data/store.ts` |
| 5 | 乐观值即时到屏 + `sessionAliases` 防重复行 | `src/data/store.ts` |
| 6 | 启动屏保持到会话恢复完成 | `app/_layout.tsx` |
| 7 | 图片切 expo-image（memory-disk 缓存、降采样、120ms 淡入），统一走 RemoteImage | `remote-image.tsx`、`today.tsx`、`checkin-composer.tsx`、`photo-checkin.tsx`、`package.json` |
| 8 | 计数同步轻量化：count 表头计数 + limit(1) | `src/data/store.ts` |
| 9 | 代际防护：登出 +1，在途响应丢弃 | `src/data/store.ts` |
| 10 | `useTaxonomies` 补上请求合并（R1） | `src/data/store.ts` |
| 11 | 三个 Tab 页下拉刷新：今日（记录+安排+统计并行）、菜谱、我的（统计+分类），配色走令牌（R2） | `today.tsx`、`recipes.tsx`、`profile.tsx` |
| 12 | 加载失败 ≠ 空态：`useRecipes` / `useCheckins` 暴露 `error`，菜谱页与今日页空态位换成失败态 + 重试（R3） | `store.ts`、`recipes.tsx`、`today.tsx` |
| 13 | 更新下载进度 setState 节流 100ms（R4） | `src/data/updates.ts` |

预期效果（对照审计）：

- 一次打卡的请求量：**~10+ 条 → ~7 条**（两轮去抖批次 × 每资源一条合并请求），新行**立即**出现在时间线。
- 冷启动：**白屏闪 → 启动屏平滑过渡**；切页回访 **骨架屏 → 即时真数据**。
- 照片：**二次访问 0 下载**，列表滚动内存显著下降（缩略图降采样）。
- 断网冷启动：不再误导航到「新建第一道菜」，明确给出失败态与重试；恢复网络后下拉即恢复。

## 三、验证

- `pnpm run check`（typecheck + eslint + prettier）**全绿**（两轮改动各自复跑）。
- `npx expo export --platform web` 生产 bundle 编译通过（两轮各一次）。
- **iOS 模拟器实机验证**：pod install（ExpoImage 入 lock）→ 重新构建安装 → App 干净启动，
  欢迎页 / 登录页正常渲染、`dailyplus:///login` 深链路由正常、无原生模块缺失崩溃。
  带数据的页面（时间线、缩略图缓存、下拉刷新）需要登录账号，留在下方清单人工过。
- 真机回归清单（发布前人工过一遍）：
  1. 冷启动：启动屏保持到进入产品页，无白屏闪；
  2. 记一笔 → 时间线**立即**出现该行，几秒后无重复行；
  3. 菜谱库 ↔ 详情 ↔ 返回：列表即时显示，不闪骨架；
  4. 断网冷启动：菜谱页 / 今日页显示「没能加载」+ 重试；联网后重试或下拉恢复；
  5. 三个 Tab 页下拉刷新：转圈出现、拉新后自动收起；
  6. 断网记一笔 → 行保留（乐观值），联网后恢复；
  7. 退出登录 → 换账号：无上一位数据闪现；
  8. 二次进入带照片的日期：照片即时显示（磁盘缓存）；
  9. Android 应用内更新下载：进度条平滑推进，页面不卡顿。

## 四、遗留（见 issues/）

- `issues/01-native-rebuild-expo-image.md` — expo-image 原生模块需 pod install / 重新构建 dev client（ready-for-human）。
- `issues/02-recipes-slim-payload.md` — 菜谱全表 `select('*')` 与 ScrollView 列表在菜谱量上百后的进一步优化（needs-triage）。
