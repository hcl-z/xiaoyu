# 07: Migrate the 今日 screen

**What to build:** The 今日 tab opens on today and shows a week strip with 记录 and 已安排 markers, day-overview ring and 连续记录 streak, a 近 7 天 chart, 待确认的安排 with one-tap confirmation, the day's 饮食 timeline, 接下来的安排, 常做菜谱, and the month totals. Past dates can be browsed and backfilled, and future dates show 计划 instead of records.

**Blocked by:** 06: Migrate the 打卡弹层 and its entry points.

**Status:** ready-for-agent

**User stories:** 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 91, 92

- [x] The screen opens on today, and both the week strip and the day's data follow the selected date.
- [x] The week strip shows 记录 / 已安排 markers, highlights today, marks the selected date, and disables dates beyond the planning horizon.
- [x] The strip pages a week at a time, and the header offers a one-tap return to 今天 when a past date is selected. — 点「下一周」从 9/28 那周跳到 10/5–10/11 那周，标题变「10月5日」，出现「回到今天」并能一键回到今天。
- [x] The day overview shows the ring, the count of records or 安排, and the current 连续记录 streak from the API.
- [x] 近 7 天记录频次 renders from the API's daily counts.
- [ ] 待确认的安排 is grouped separately with a one-tap 吃了 action that does not open the sheet, and tapping the row opens the sheet for editing.
- [x] The 饮食 timeline is ordered by time, shows a photo thumbnail where the record has a photo, and opens the record for edit or delete on tap. — 文本记录已确认（「修改 麻油拌菠菜」）；带照片的记录没跑。
- [x] Future dates show the day's 计划 and an 安排一道 empty state instead of a record timeline. — 9 月 29 日显示「这天还没安排 / 提前挂上想做的菜…」+「安排一道」；安排后变成「这天的安排」列出计划并带「再安排一道」。
- [x] 常做菜谱 shows the three most-cooked dishes with 累计次数 and 上次做于, and 接下来的安排 lists the next seven days' plans.
- [x] Selecting a date deep-links to that day so a record can be shared as a link. — 热力方格点击会跳到当日；`exp://…/--/today?day=2026-09-20` 也能直接落到 9 月 20 日那一周并选中该日。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 今日页整体通过：周条（今天高亮、可安排 / 已记录标记）、打卡记录计数、连续天数、近 7 天频次、今日饮食空态与写入后状态、常做菜谱三项。打卡写入后页面计数同步刷新。
- 2026-09-28: 过去日期视图也确认过：9/22 显示「当日打卡 3 次记录」与三条当日饮食。
- 2026-09-28: 「一键 吃了」本次是从弹层里的「按计划吃了，确认一下」走通的（今日页那一行只有在当天有未确认计划时才会出现）；两种入口共用同一个 confirmPlan。
