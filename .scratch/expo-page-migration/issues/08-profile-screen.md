# 08: Migrate the 我的 screen

**What to build:** The 我的 tab shows the identity card with 连续记录 days and the 演示账号 badge when in the public 演示空间, a tappable 28-day 热力图, account totals, entry points to 分类管理 and 标签管理 with their counts, an 关于 alert that links to the design system, and sign-out with confirmation.

**Blocked by:** 07: Migrate the 今日 screen; 09: Migrate 分类管理 and 标签管理.

**Status:** ready-for-agent

**User stories:** 67, 68, 69, 70, 71, 72, 73, 74

- [x] The identity card shows the user's name, initial, 连续记录 days and the 演示账号 badge, and explains the shared demo data.
- [x] The 28-day 热力图 renders from the API's daily counts, and tapping a day opens 今日 for that date. — 热力图已确认；点某天跳今日没单独点过。
- [x] The heatmap footer shows how many of the 28 days have records and the legend.
- [x] 累计记录 / 菜谱 / 收藏 totals come from the API's statistics payload.
- [x] 分类管理 and 标签管理 rows show the current counts and open the corresponding modal.
- [x] The 关于 alert explains the app and can open the Design System Showcase. — 点「关于 daily +」弹出说明，「查看系统」直接进了组件展览页。
- [x] Sign-out goes through the design system's confirmation alert.
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 我的页通过：身份卡（林见月 / 演示账号 / 连续 1 天）、28 天热力图（6/28 天有记录）、三个统计、内容管理两行、关于、退出登录确认框。
- 2026-09-28: 热力方格点击跳转到对应日期的今日页，已实测（9/22）。
- 2026-09-28: 退出登录的确认框此前已确认；账号区、版本号、演示账号说明都在。
