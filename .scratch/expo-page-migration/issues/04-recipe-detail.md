# 04: Migrate the 菜谱详情 screen

**What to build:** Tapping a recipe opens a pushed detail screen with the image header and transparent compact navigation bar, the metric row, and the 食材 / 步骤 / 记录 tabs. 食材 supports 人份 rescaling and per-group ticking, 记录 aggregates the dish's 已安排 and 历次笔记, and a fixed bottom action records that the dish was cooked. Favouriting from the image header writes through to the library's 收藏 filter.

**Blocked by:** 03: Migrate the 菜谱库 screen.

**Status:** ready-for-agent

**User stories:** 27, 28, 29, 30, 31, 32, 33, 34, 35, 36

- [x] The detail screen is a stack push with the image header and a transparent compact navigation bar.
- [x] 用时 / 人份 / 做过 render as a metric row, and 上次做于 and any 已安排 badge come from the API payload rather than being recomputed locally.
- [x] 食材 / 步骤 / 记录 switch with the migrated segment motion, and each tab's empty state offers the relevant next action.
- [x] Changing 人份 rescales displayed 用量 using the Web app's amount-scaling rules, leaves the recipe itself unmodified, offers 复原, and never invents a number for amounts that cannot be parsed. — 番茄牛腩饭实测：增加人份后出现「原方 2 人份 / 复原人份 / 用量已按 2 → 3 人份换算，菜谱本身未修改」，复原后回到「按菜谱原方」；无法解析的用量没有单独构造数据。
- [x] Ingredients can be ticked off per group, with a per-group completion note and an overall ticked count. — 勾选「牛腩」后底部计数从「已备 0 / 7 项」变为「已备 1 / 7 项」。
- [x] 历次笔记 shows only non-empty notes, newest first, and links back to that day.
- [x] The 收藏 toggle writes through and is reflected in the 菜谱库 收藏 filter. — 取消收藏番茄牛腩饭后，菜谱库「收藏」筛选从 3 道变 2 道；重新收藏后回到 3 道（已复原）。
- [x] A fixed bottom action bar records a cook for this dish, and a missing recipe renders a clear empty state instead of a blank screen.
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 详情页三个分段（食材 5 / 步骤 3 / 记录 2）、返回、编辑入口都跑通；「做好了，记一笔」拉起打卡弹层。
- 2026-09-28: 观察到的数据现象（Web 同样存在，不是迁移缺陷）：演示账号的种子菜谱 `cooked` 是写死的数字（如 21），而真实打卡记录只有 1 条；一旦为该菜谱新增一条打卡，`syncRecipeCookStats` 会按真实记录重算，计数会从 21 掉到 2。要与产品确认演示数据是否要把种子打卡补全。
