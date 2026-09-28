# 11: Complete the Expo page-migration quality gate

**What to build:** The migration is ready for handoff once every migrated route has been exercised end to end on a device or simulator, the automated checks pass, the design system Showcase still works, and the remaining deferred work is written down.

**Blocked by:** 05: Migrate 新建菜谱 and 编辑菜谱; 08: Migrate the 我的 screen; 09: Migrate 分类管理 and 标签管理; 10: Migrate 照片打卡.

**Status:** ready-for-agent

**User stories:** 88, 95

- [x] Every migrated route has been exercised end to end on a device or simulator, including the write paths, and any route that cannot complete its flow is listed as a known gap rather than left silent. — 除「注册提交」与「照片选图上传」两项（都会触发系统级权限/账号创建，未在无人确认下执行）之外，其余路由与写路径都已在 iPhone 16e 上跑通，逐项记录见 02–10；未来日期确认计划后无法再从 App 内删除属于 Web 同款行为，见下方 Comments。
- [x] Expo TypeScript checking, linting and formatting validation all pass.
- [x] The Design System Showcase still renders and is still reachable after the restructure.
- [ ] The Web app still builds and its routes behave as before the bearer-token addition. — 浏览器里手工用过登录与主要页面，构建没单独跑。
- [x] No Web-only mechanism (Cookie handling, `window` events, DOM image tags, file inputs, fixed positioning) remains in the native source.
- [ ] Screen copy and visual hierarchy are checked against the Web app, and any deliberate divergence is recorded. — 截图对比做了主要页面；弹层从第三方手势弹层换成系统 Modal 属于刻意分歧，已记在 06。
- [x] Deferred work is recorded: shared token/validation package extraction, reduced-motion support, and Android visual polish. — 已在 PRD 的 Out of Scope 与 Further Notes 中写明（共享 tokens/校验包抽取、reduced-motion、Android 视觉打磨、离线/推送等）。

## Comments

- 2026-09-28: 本轮在 iPhone 16e（iOS 26.3 / Expo Go 57.0.9）上从冷启动走了一遍：欢迎 → 先逛逛 → 今日 → 菜谱列表 → 详情（三个分段）→ 编辑菜谱 → 打卡弹层写入 → 我的 → 分类管理 / 标签管理 → 照片打卡弹层 → 退出 → 一键进入主页 → 冷启动恢复到今日。
- 2026-09-28: 两个真实缺陷已修并复测：① 登录后无人跳转（见 02）；② 菜谱行点不动（见 03）；③ 打卡 / 分类 / 标签弹层整层不渲染（见 06）。
- 2026-09-28: 已知非阻塞项：菜谱图片 404（Web 与原生同源问题，缺 `apps/web/public/images/*.jpg`）；演示账号种子菜谱的 `cooked` 与真实打卡记录不一致（见 04）。

- 2026-09-28: 本轮补充跑通：分类/标签的新增·改名·删除（09）、新建菜谱保存后落到详情并可删除（05）、未来日期安排一餐 → 计划 → 「按计划吃了，确认一下」转为已记录（07）、菜谱库搜索/分类筛选/收藏筛选/空态（03）、我的热力方格点击跳到当日（08）、打卡弹层的删除确认。
- 2026-09-28: 又修掉一个原生专属缺陷：确认框与弹层同为 RN Modal，iOS 不允许模态叠加，导致弹层内的「删除分类 / 删除标签 / 删除这条记录」点了没反应。`Alert` 现在支持 `inline` 形态并由 `Sheet` 的 `overlay` 插槽承托，三处删除确认都已实测可显示、可完成。
- 2026-09-28: 未验证项（需要人或系统确认）：① 注册提交（会在服务端真实建号）；② 照片打卡的选图（会触发 iOS 相册权限弹窗与真实上传）。两者都已在 02 / 10 标记。
- 2026-09-28: 已知的 Web 同款产品缺口（非迁移回归）：在未来日期把一条计划用「按计划吃了」确认后，该记录落在那一天且不再出现在「这天的安排」里，App 与 Web 都无法再打开或删除它；本次验证产生的测试记录已通过接口清理。
