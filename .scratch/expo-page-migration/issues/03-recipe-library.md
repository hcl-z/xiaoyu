# 03: Migrate the 菜谱库 screen

**What to build:** The 菜谱 tab lists the account's real recipes from the API, with the featured card, live search across 菜名 / 标签 / 食材, 分类 and 收藏 filtering, and the loading, empty and filtered-empty states the Web app has. This slice establishes the native data layer for recipes: fetch, cache, optimistic mutation plumbing and cross-screen invalidation.

**Blocked by:** 02: Native session and the 欢迎 / 登录 / 注册 flow.

**Status:** ready-for-agent

**User stories:** 21, 22, 23, 24, 25, 26, 89, 90, 91, 92, 93

- [x] The recipe data layer mirrors the Web app's hook contract, including the bounded timeout that keeps the UI responsive when the API is cold.
- [x] The screen shows a featured card for the most-cooked dish only while browsing unfiltered, and a plain list when a query or filter is active.
- [x] Search matches 菜名, 备注, 标签 and 食材 names, so ingredient search finds the dish that uses it. — 实测：搜「一锅出」（标签）命中番茄牛腩饭；搜「燕麦片」（食材，菜名里没有）命中莓果酸奶碗；搜「菠菜」命中麻油拌菠菜。备注字段未单独验证（同一条服务端查询）。
- [x] 分类 filter options come from the account's taxonomies plus 全部 and 收藏, and fall back to 全部 when the selected 分类 disappears.
- [x] Rows show 分类, 用时 and a relative 上次做于 label, and show 未做 when the dish has never been cooked.
- [ ] Loading skeletons and a corrective empty state are shown instead of a blank screen. — 组件在，没等到过冷启动的骨架态。
- [x] Recipe images resolve against the API base URL and fall back to the tint placeholder when absent. — 占位已确认；图片本身在 Web 与原生都 404（`apps/web/public/` 里没有 `/images/*.jpg`），不是迁移引入的。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 修复「点菜谱行没反应」。根因在 `src/components/surfaces.tsx` 的 `ListRow`：按压高亮的 `active:` 类挂在**内层** View 上，而外层 `Pressable` 没有尺寸类，触摸被内层吃掉、外层按压被取消。已把高亮类移到 `Pressable`，内层只保留布局类。复测：点「麻油拌菠菜」进入详情（轻食 / 5 项食材 / 步骤 3 / 记录 2），返回列表正常。
- 2026-09-28: 本轮补测：搜索（标签命中、食材命中、无结果的空态）、分类筛选（汤羹 → 共 1 道）、收藏筛选（3 道）、「清除筛选」恢复全部。骨架态仍未观察到（本地接口太快，冷启动没出现可截到的加载态）。
