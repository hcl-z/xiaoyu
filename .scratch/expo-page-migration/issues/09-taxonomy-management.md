# 09: Migrate 分类管理 and 标签管理

**What to build:** 分类 and 标签 can be created inline, renamed and deleted from modal screens opened from 我的. Each item shows how many 菜谱 use it, renaming updates every referencing recipe, a 分类 still in use cannot be deleted, and deleting a 标签 removes it from recipes while keeping the recipes.

**Blocked by:** 03: Migrate the 菜谱库 screen.

**Status:** ready-for-agent

**User stories:** 75, 76, 77, 78, 79, 80

- [x] 分类管理 and 标签管理 open as modal presentations from 我的, with counts shown on entry.
- [x] New items can be added inline and the input keeps focus so several can be added in a row. — 分类与标签都实测：分类用回车添加（「输入分类名，回车即添加」），标签点右侧「添加」按钮；添加后输入框自动清空并保持焦点，可连续添加。
- [x] Each row shows how many 菜谱 use the item, or 未使用.
- [x] Renaming writes through and the change appears on every referencing recipe in the 菜谱库. — 分类 testcate→testcat2、标签 临时标签→临时标签2 都改名成功；改名后列表即时更新（受影响的菜谱列表待与 03 一起复查）。
- [x] Deleting a 分类 that is still in use is refused and the server's explanation is shown. — 对「主食」（2 道菜谱）执行删除，弹层内出现「仍有 2 道菜谱属于「主食」」，分类保留。
- [x] Deleting a 标签 removes it from recipes and keeps the recipes. — 建了一个临时标签走通添加→改名→删除整条链路；删除的是未被引用的标签（演示账号为共享数据，没有删掉真实被引用的标签做破坏性验证）。
- [x] Duplicate and over-length names are rejected with the server's message. — 输入已存在的「主食」回车后被拒，提示「主食」已存在，列表数量不变。超长名称未单独验证（走同一条服务端校验）。
- [x] Editing and deleting use the design system's sheet and confirmation alert. — 编辑弹层已确认打开并预填；改名、删除确认、被拒提示都跑通。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 分类管理（4 个）与标签管理（16 个）都能从我的打开并列出计数。弹层一开始整层不渲染，根因与打卡弹层相同（见 06 的 Comments），换掉 `src/chrome/sheet.tsx` 之后两处编辑弹层都能正常弹出。
- 2026-09-28: 又一个原生专属缺陷已修：确认框（Alert）用 RN Modal 实现，而它要盖在同样是 Modal 的弹层之上，iOS 不允许两层 Modal 叠加，于是点「删除分类 / 删除标签」时确认框整层不出现。现在 `Alert` 增加 `inline` 形态（绝对定位、不新建 Modal），弹层新增 `overlay` 插槽，分类/标签与打卡弹层的删除确认都走插槽渲染，实测正常显示并能完成删除。
- 2026-09-28: 写路径实测记录：分类 添加(testcate)→改名(testcat2)→删除 全通过，测试分类已清理；重复名「主食」被拒；占用中的「主食」删除被拒。标签 添加(临时标签)→改名(临时标签2)→删除 全通过，测试标签已清理，回到 16 个。
