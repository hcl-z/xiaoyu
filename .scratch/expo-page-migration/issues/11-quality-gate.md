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

- 2026-10-03: 动效与交互链路自我迭代（第一轮）。以「内容换批」为主线，新增层 1.5 的四个原语并落到具体屏幕：
  - `useMotionPreference` / `useReducedMotion` —— 系统「减弱动态效果」开关接进所有位移与缩放动效（`SlideIn` / `ScaleIn` / `SwapIn` / `StaggerItem` / `ScreenEnter` / `useDrawProgress` / `CheckCircle` 对钩），透明度过渡保留。PRD 里挂起的 reduced-motion 项至此落地。
  - `SwapIn` + `useSwapDirection` —— 由 key 驱动的内容换批落位，方向跟手势一致。落到菜谱详情三分段（食材 / 步骤 / 记录，按 ing→step→log 顺序判断滑入方向）与今日的整块日期内容（ISO 日期字典序即时序，往后一天从右侧进、往前一天从左侧进）。
  - `ScreenEnter` —— 三个标签页根容器的落位（8pt / 0.24s）。Expo Router 换页是瞬时挂载，此前是硬闪。
  - `CrossFade` —— 菜谱库骨架屏与结果之间的交底，不再是硬切。
  - `StaggerItem` 以 `ListRow` 的 `staggerIndex` / `staggerKey` 两个新 prop 接入，而不是在 `Section` 里包一层：`ListGroup` 靠 `cloneElement` 给直接子节点注入 `separator`，外面套一层会让分隔线整片消失。这一点在改动中被发现并规避。
- 2026-10-03: 标签栏选中态。`TabButton` 给激活图标加 pop 弹簧轻弹（1.08）+ 按压反馈，颜色仍走 tone 切换——不引入滑块，与 iOS 原生标签栏一致。
- 2026-10-03: 修掉今日「空态撑开整屏」的观感问题：过去 / 将来没有记录时，空态 `minHeight` 从 360 收到 232，图标不再被推到离周历很远的地方。
- 2026-10-03: 端到端复测时的环境问题（非代码缺陷）：点击「先逛逛」报网络超时，原因是 `apps/web` 的 API 服务器没有启动，而 App 固定按 Metro 的主机去访问 `:3000`，请求在 4.5s 读超时后回 `null`。已用 `pnpm dev:web` 起服务并复测通过（`/api/health` 返回 `{"ok":true}`，`/api/auth/demo` 13ms 返回令牌）。**结论：本地联调必须同时起 Metro 与 web 两个进程。**
- 2026-10-03: `pnpm --filter expo-app typecheck / lint / format:check` 全部通过。

- 2026-10-03: 基础组件层第二轮打磨（组件自身，而非页面接线）。逐项：
  - **`text.tsx` — 动态字体的上限**：原来所有字阶都写死 `maxFontSizeMultiplier={1.15}`，等于把系统「更大字体」设置压到最多放大 15%，是可访问性缺陷。现在正文 1.6 / 标题 1.3（与 iOS 大标题比正文收敛一致），并给 `Metric`/`Display`/`Title`/`Subhead` 各自设上限。已在模拟器把 content_size 调到 extra-extra-large 实测：字号确实变大。
  - **`text.tsx` — `Micro` 的中文字距**：`Micro` 一直是「大写 + 0.22em 字距」的拉丁小标签范式，但全仓 23 处 `Micro` 几乎全是中文（做得最多 / 常做菜谱 / 接下来的安排 / 将安排为 …）。中文没有大小写，`uppercase` 是空操作，2.42px 字距会把中文标签拉开到散架。现在按内容判定：只有纯西文才加宽字距与大写，含 CJK 则收回正常字距。Showcase 之前靠调用点逐个写 `tracking-normal` 绕过，现在从源头修掉。
  - **`button.tsx` — 触控区**：`IconButton` 的 hitSlop 原本是 `sm:6 / md:4 / lg:0`，尺寸越大补偿越少（完全反向）。现在统一用 `slopFor()` 把视觉尺寸不足 44pt 的控件补到 44pt；`Button` 的 `sm`（32pt）也补上了 hitSlop。`layout.tapMin` 本来就有，只是组件没用。
  - **`button.tsx` — Spinner**：连续旋转属于前庭类动效，原先无视减弱设置。现在开了「减弱动态效果」就停在静止环上。
  - **按压反馈归一**：发现同一层级控件各写各的缩放（0.92 / 0.95 / 0.98 / 0.99 / 0.995）。新增 `motion.pressScale` 四档令牌（block / button / icon / chip），按钮、列表行、时间轴行、Pill、步进器全部改走令牌，并修掉 `usePressFeedback` 的默认值。
  - **`inputs.tsx` — 焦点过渡**：描边原本是瞬间切 className。现在改成行容器自己的描边，用颜色插值在 idle / focus / error 三态间过渡（170ms，`STATE_MS`），描边始终占位所以不跳行（**注：不是「绝对定位下沿线」——形状已定为「填充底 + 圆角」，见文件头注释**）。顺带：占位文字颜色从三处硬编码 `rgba(99,99,102,…)` 收回 `alpha.placeholder`（普通输入）与 `alpha.placeholderSoft`（搜索框）令牌；补 `maxLength` / `selectionColor`；`TextArea` 支持按内容自动增高；搜索框的清除键改为缩放淡入淡出（不再硬闪，且收起后不吃点击）。
  - **`surfaces.tsx`**：`Skeleton` 的持续呼吸在减弱动效下改为静止占位；`Checkmark` 从「条件挂载」改为淡入淡出，并在未选中时退出可访问性树。
  - **`data.tsx`**：`Bar` / `Sparkbar` / `HeatCell` 全部接入减弱设置；图表入场时长集中成 `CHART_ENTER_MS`，让环 / 条 / 柱 / 热力格节奏一致；`Sparkbars` 在 `labels.length !== values.length` 时不再渲染错位的标签行。
  - **`controls.tsx` — Segmented 指示器偏移**：`useSegmentIndicator` 用「轨道宽 ÷ 段数」算位移步长，而指示器宽度是「（轨道宽 − 两侧内边距）÷ 段数」，两者不等，导致后面的分段逐步偏移。现在把每段宽度算一次、宽度与步长共用同一个值。
- 2026-10-03: `pnpm --filter expo-app typecheck / lint / format:check` 全部通过；模拟器上新建菜谱页与 Showcase 复测无回归。

- 2026-10-04: 对上一轮自我迭代做了一次两轴评审（Standards / Spec）后的修正。逐项：
  - **`text.tsx` — `Micro` 的双重来源**：上一轮同时用行内 `style={{letterSpacing:0}}` 和 `size={cx(size,'tracking-normal')}` 两处去压中文的 0.22em 字距，两条来源互相打架，而且把字距类塞进「字阶」槽本身就是错位；此外 `style` 没有显式解构，调用方传 `style` 时会从 `{...rest}` 覆盖掉这个修正。现在只保留行内一个来源，并把调用方的 `style` 合并进去。
  - **`primitives.tsx` — `CrossFade` 骨架不该淡入**：骨架是首帧就要看到的内容（冷启动就停在 loading），上一轮给它挂了 `entering`，结果先白一下再淡入——那是多出来的一次闪。现在骨架只保留 `exiting`，真正需要过渡的只有两层之间的那一次交底。
  - **`primitives.tsx` — 方向判定的重复**：`today.tsx` 把「props 变化时调整 state」的写法整段抄了一遍。抽出内部 `useDirection(current, compare)`，`useSwapDirection`（有限集合、查下标）与新增的 `useSequenceDirection`（无限序列、比字典序，供日期用）共用同一骨架；`today.tsx` 改用 `useSequenceDirection(day)`。
  - **触控区补偿归一**：`slopFor()` 从 `button.tsx` 导出，`controls.tsx`（Pill / StepperButton / CheckCircle）与 `inputs.tsx`（SearchField 清除键）里原先各自写死的 `hitSlop={6}` / `hitSlop={10}` 全部改走同一个算法。
  - **令牌不再有裸数字**：`motion.selectPop`（1.08）收进令牌，`tabbar.tsx` 与 `uses` 表同步；`PressableScale` 的默认 `scale` 从裸 `0.98` 改为 `mt.pressScale.button`；Showcase 动效页的 `0.96` 改为 `mt.pressScale.icon`。删掉两个定义了却没人用的令牌：`motion.swap`；`alpha.placeholderSoft` 则接进 `SearchField`（它本来就该用这一档）。
  - **三个标签页根容器收敛**：`app/(tabs)/{today,recipes,profile}.tsx` 原先各写一遍同样的 `ScreenEnter` 包裹，改为 `withScreenEnter(Screen)` 一处定义。
  - **Showcase 的状态对照表**：`InputsSection` 的 STATES 一栏里「聚焦」那行从来没有焦点，和「空态」长得一模一样。改为用 `FormRow state="focus"` 固定展示聚焦态（这一组是规格对照，不该去抢真实焦点）。
  - **`recipe-editor.tsx`**：`-mt-2` 与 `style={{marginTop:-10}}` 同时写同一个值，后者胜出、前者是死代码，去掉。
- 2026-10-04: `pnpm --filter expo-app check`（typecheck + lint + format:check）全部通过。
- 2026-10-04: 遗留项（未在本次处理）：`AGENTS.md` 指向的 `docs/constraints.md` 在仓库里不存在，所有「必须遵守的约束」目前无处可依；需要补上这个文件或从 AGENTS.md 里拿掉这条引用。

- 2026-10-04: 输入域重做（第三轮）。起点是「输入框太丑」，顺着截图查下去发现是三个具体缺陷，不是审美问题：
  - **边界不可见**：行底 `#EBEBF0` 与页面底 `#F2F2F7` 只差 7 个色阶，整行等于没有边界；叠上白卡后是三层灰互相打架。加深到 `#DEDEE4` 又会读成 disabled——所以两条填充路线都不成立。**定稿：白底 + 始终可见的发丝描边**，不依赖背景色，放卡里和放页面上都成立。聚焦只动描边（蓝），不换底色；出错是唯一允许换底的（淡红底 + 红边）。
  - **文字不垂直居中**：`TextInput` 在两端都有内部行高/padding，只靠外层 `items-center` 是不够的。新增 `INPUT_METRICS`（`includeFontPadding: false` + `lineHeight: 22` + 两端 `padding` 归零），单行输入与搜索框共用。实测 25 个输入全部 `上 14 / 下 14`。
  - **浅蓝获焦/按压填充**：`active:bg-tint/70` 这类「点一下整行泛蓝」出现在 9 处（列表行、动作行、编辑器可点行、Sheet 动作）。全部换成中性灰 `active:bg-fill/60`。蓝色只保留在「可点」的标识上（文字、图标、描边），不再当按压反馈。
- 2026-10-04: 输入行按场景分三型，并补两个新形态：
  - **inline**（默认）：左标签 + 右值，白底描边。用于登录 / 注册 / 时间 / 份数这类独立字段。
  - **stacked**（新）：框内上方小标签 + 下方值。用于封面右侧的「菜名 / 备注」——横向只剩封面旁边那点宽度，左标签会把输入区挤没；两个框叠起来刚好和 110pt 封面齐平。
  - **bare**（新）：不套输入行的框，只留裸输入。用于「食材 / 用量」这类一行两个输入的密集行——再给每个输入套框会变成四个框叠在一起。
- 2026-10-04: 顺手修掉的重复与冗余：标签与占位符同词（`label="用时"` + `placeholder="用时"`、`label="分组名"`、`label="食材"` / `label="用量"`）；步骤行左边已有序号圆点却又写一次 `label=第 N 步`。`Stepper` 的 `label` 改为可选（它只用来拼按钮的朗读文案，不必渲染成可见标签）。
- 2026-10-04: 新增 `showcase/InputCandidatesSection.tsx`（**评审用，定稿后删**）：把三型形态连同 idle / 聚焦 / 出错 / 禁用四态并排陈列，供选型。已挂在 Showcase 的「03B 输入形态候选」。
- 2026-10-04: `pnpm --filter expo-app check`（typecheck + lint + format:check）全部通过。
