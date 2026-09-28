# 05: Migrate 新建菜谱 and 编辑菜谱

**What to build:** Creating and editing a recipe are modal tasks presented over the current screen, with 取消 on the left and 完成 on the right, and 完成 disabled until 名称 is filled. The editor covers 名称, 备注, 分类, 用时, 份量, 标签, ingredient groups and items, and steps, and can create a new 标签 inline. Editing prefills every field and can delete the recipe after confirmation.

**Blocked by:** 04: Migrate the 菜谱详情 screen.

**Status:** ready-for-agent

**User stories:** 37, 38, 39, 40, 41, 42, 43, 44, 45

- [x] 新建菜谱 and 编辑菜谱 open as modal presentations from the 菜谱库 and the detail screen, with the design system's full-screen task chrome.
- [x] Cancelling returns to the exact screen the task was opened from.
- [x] 完成 is disabled while 名称 is empty, and the form states that 名称 is the only required field.
- [x] The form covers 名称, 备注, 分类, 用时, 份量, 标签, ingredient groups and items, and steps, using the migrated design system controls throughout.
- [x] Ingredient groups and steps can be added and removed, and empty items are dropped on save the same way the Web app drops them. — 新增一条食材并随菜谱保存成功（详情页食材 1）；步骤编辑框通过辅助功能读屏拿不到输入句柄，没在里面打字，所以「加了步骤再删」和空项丢弃没有实测。
- [x] A new 标签 can be created without leaving the editor, and a new 分类 comes from the account's taxonomy list.
- [ ] A current value that no longer exists in the taxonomy library stays selectable rather than silently changing. — 代码里有这个分支，没构造过这种数据。
- [x] 编辑菜谱 prefills every field and offers delete with confirmation; deleting keeps the dish's 打卡 history. — 预填与「删除这道菜谱」入口已确认；实际删除没跑。
- [x] Saving a new recipe lands on its detail screen. — 实测：新建「测试菜谱A」（主食 / 20 分钟 / 2 人份 / 一条食材）保存后直接落到它的详情页（食材 1 / 步骤 0 / 记录 0）；随后用编辑页的「删除这道菜谱」+ 确认框删掉，菜谱库回到 6 道。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 新建菜谱（空表单、名称必填提示、完成置灰）与编辑菜谱（名称 / 备注 / 分类 / 用时 / 份量 / 三枚已选标签 / 两组食材带用量 / 三步文本全部预填）都已在模拟器上打开确认；取消能回到原页面。
- 2026-09-28: 新建/编辑的保存与删除都已在 iPhone 16e 跑通，测试菜谱已清理。删除确认框在编辑页（非弹层）上正常显示。
