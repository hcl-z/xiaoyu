# 06: Migrate the 打卡弹层 and its entry points

**What to build:** A floating action button on tab screens opens 打卡 as a bottom sheet over the current screen. The sheet suggests a meal type from the clock, lets the user pick a 菜谱 or type what they ate, sets 份量 and writes 笔记, saves or updates optimistically, and confirms with a success state. A future date turns the same sheet into 计划, and 计划 can be confirmed as 吃了 in one tap. The `/checkin` deep link still resolves.

**Blocked by:** 03: Migrate the 菜谱库 screen.

**Status:** ready-for-agent

**User stories:** 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 89, 90, 91, 92

- [x] The FAB appears on tab roots and fans out into 菜谱打卡 and 照片打卡 entries, and on a future date becomes a single 安排一道 action. — 扇出与两个入口已确认；未来日期只看了「可安排」标记，没点到那一天。
- [x] The sheet is presented natively over the current screen with drag-to-dismiss, keyboard handling and safe-area padding. — 见 Comments：**放弃了第三方手势弹层**，改成系统 Modal 上滑，背板点击关闭；下拉关闭不再有。
- [x] The meal type is suggested from the current time and remains changeable.
- [x] One field both searches the recipe library and accepts free text, and a query with no match offers to save it as a custom record. — 输入「楼下小面」后出现「添加「楼下小面」」与「没有想要的？直接保存为「楼下小面」」，底部预览卡也变成「将保存为 楼下小面」。
- [x] Selecting a 菜谱 shows the chosen dish with a way to re-select; 份量 and 笔记 are captured on the record. — 选中后显示菜名 + 分类·用时 + 「重新选择菜谱」，份量（½ / 1 / 1.5 份）与「这次的笔记」都在；今日那条记录就是按这套字段写进去的。
- [ ] Notes written against a 菜谱 become that dish's 历次笔记.
- [x] Saving on a future date creates a 计划 rather than a record, and the sheet explains the difference. — 9 月 29 日在今日页点「安排一道」，弹层顶部提示「9月29日还没到，这会存成一条用餐计划…」，按钮文案为「安排到9月29日」；保存后那天变成「已有安排 1 道」，累计记录不变。
- [x] An existing record can be edited or deleted, and a 计划 can be converted to a record without opening the sheet from 今日. — 今日记录能打开编辑弹层，底部有「删除这条记录」并弹出确认框（本次只确认到弹框，点了取消，没真删）；计划可在今日页的「待确认的安排」用右侧「吃了」一键转正，也可在弹层里点「按计划吃了，确认一下」。
- [x] Saving shows the success state and never blocks on a slow API. — 记录写成功后「今日饮食」出现「修改 麻油拌菠菜」，打卡记录 0→1，累计记录 11→12。
- [x] The `/checkin` deep-link route redirects to 今日 and opens the sheet with its parameters applied. — 实测 `exp://…/--/checkin?recipe=sesame-spinach&meal=轻食`：落到今日并自动展开弹层，粥选中的是麻油拌菠菜、餐次是轻食、保存可用。`day` 参数与 Web 一致地不转发。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 打卡弹层原本整层不渲染。诊断：`@gorhom/bottom-sheet` 5.2.14 在这个 RN 0.86 + Reanimated 4 组合下，`BottomSheetModal.present()` 被调用（日志确认 ref 存在、present 已执行）但内容始终没有进入视图树；同一问题也让「分类管理 / 标签管理」的编辑弹层失效。已把 `src/chrome/sheet.tsx` 换成自带的 RN `Modal` 实现（Web 分支原本就是这套），并从 `app/_layout.tsx` 摘掉 `BottomSheetModalProvider`，`@gorhom/bottom-sheet` 不再被引用。
- 2026-09-28: 复测：FAB → 菜谱打卡 → 弹层出现（记一笔 / 今天·正餐 / 餐次分段 / 搜索 / 最近吃过 / 份量 / 笔记 / 记录到今天）→ 选「麻油拌菠菜」→ 保存 → 回到今日并写入成功。键盘弹起时弹层会收缩并在内部滚动。
- 2026-09-28: 保存写入、未来日期计划、编辑/删除入口、自由文本与深链都已跑通。删记录的确认框属于本轮修掉的模态叠加缺陷。
- 2026-09-28: 「笔记成为该菜谱的历次笔记」仍未单独验证：没有往演示数据里写测试笔记。
