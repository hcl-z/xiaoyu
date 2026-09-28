# Expo Page Migration

Status: ready-for-agent

## Problem Statement

The Expo app now carries the whole Web design system — tokens, base UI, motion
primitives, App Chrome and the Design System Showcase — and TypeScript, lint and
formatting all pass. But the app is still a single-route shell: it opens straight
into the Showcase and has no navigation, no session, no API access and no product
screens.

The Web app already owns the product: twelve real routes backed by a working
Next.js + Postgres API. Until those routes exist natively, the Expo app cannot be
handed to a user as "daily +", and the design system has no real screen to serve.

The migration also cannot be a copy of the Web screens. Cookies, `window` events,
`<img>` tags, `<input type="file">` photo capture, `useSearchParams` deep links,
scroll-locked overlays and page-level modal hosts all need native counterparts,
and one of them — session transport — requires a small, additive change to the Web
API so a native client can authenticate without cookies.

## Solution

Migrate the Web app's twelve product routes into the Expo app and make the native
app the product experience, reusing the existing Next.js API as the backend and
the migrated design system as the UI foundation.

The Expo app launches through Expo Router, restores a stored session, and presents
the same structure and behaviour as the Web app: 今日 / 菜谱 / 我的 as tabs, recipe
browsing, a recipe detail with ingredient scaling, recipe create and edit, the
打卡弹层, 照片打卡, statistics, 分类管理 and 标签管理. Screen copy, layout
hierarchy, states and semantics stay faithful to the Web app; only the mechanics
that cannot exist natively are replaced.

The Web API gains a bearer-token path alongside its Cookie path, so the native
client can authenticate, restore a session and sign out through the same
endpoints. Everything else reuses the existing route handlers unchanged.

The Design System Showcase moves off the initial route and stays reachable, so the
design system remains inspectable and the earlier phase's validation seam is not
lost.

Validation is route by route on a device or simulator — each route must be
usable end to end — with the existing TypeScript, lint and formatting checks as
the automated gate.

## User Stories

### Navigation and app shell

1. As a user, I want the app to open on a real product screen instead of a design
   system page, so that the app I launch is the app I use.
2. As a user, I want 今日 / 菜谱 / 我的 to be persistent tabs with clear active and
   inactive states, so that I always know which section I am in.
3. As a user, I want the tab bar to disappear on pushed and modal screens, so that
   focused tasks have the whole screen.
4. As a user, I want pushed screens to enter and leave with the same motion
   character as the Web app, so that navigation feels continuous.
5. As a user, I want modal screens to present and dismiss natively, so that
   cancel returns me exactly where I was.
6. As a developer, I want every route to exist in Expo Router from the start, so
   that later product screens have a stable navigation foundation.
7. As a developer, I want the Design System Showcase to remain reachable after it
   stops being the initial route, so that the design system stays inspectable.
8. As a user, I want the app to use the safe area correctly on every screen, so
   that content is never hidden behind system UI.

### Session and authentication

9. As a user, I want to land on a 欢迎 screen when I have no session, so that the
   product explains itself before asking for anything.
10. As a user, I want to enter the public 演示空间 with one tap and no password, so
    that I can see the whole product immediately.
11. As a user with an account, I want to log in with email and password, so that I
    can reach my own private 菜谱 and 饮食记录.
12. As a new user, I want to register with 昵称 / 邮箱 / 密码 and see the password
    rules checked live, so that I can satisfy them before submitting.
13. As a new user, I want registration to seed my 起步菜谱, so that the app is not
    empty on first launch.
14. As a user, I want my session to survive app restarts, so that I do not log in
    again every time I open the app.
15. As a user, I want to sign out through a confirmation, so that I do not lose my
    session by accident.
16. As a user, I want sign-out to fully clear the previous account's local data, so
    that the next person on this device never sees my records.
17. As a user, I want an expired session to return me to the sign-in entry point
    instead of showing broken screens, so that I always know what to do.
18. As a developer, I want a native client to authenticate against the same API as
    the Web app, so that there is one backend and one set of data contracts.
19. As a developer, I want the authentication change to be additive, so that
    existing Web browser sessions keep working unchanged.
20. As a maintainer, I want password and email rules to match the server's, so that
    the form never accepts something the API will reject.

### 菜谱库

21. As a user, I want to see my 菜谱 as a list with a featured card first, so that
    the library is scannable and the most-cooked dish stands out.
22. As a user, I want to search by 菜名, 标签 and 食材, so that searching "菠菜"
    finds the dish that uses spinach.
23. As a user, I want to filter by 分类 and by 收藏, so that I can narrow a large
    library quickly.
24. As a user, I want the featured card to appear only while browsing, so that a
    filtered result is never silently enlarged.
25. As a user, I want loading skeletons and an empty state with a corrective
    action, so that I understand what is happening when there is nothing to show.
26. As a user, I want each row to show 分类, 用时 and 上次做于, so that I can choose
    without opening the dish.

### 菜谱详情

27. As a user, I want an image header with a transparent compact navigation bar, so
    that the dish leads the screen.
28. As a user, I want 用时 / 人份 / 做过 as a metric row, so that the key facts are
    readable at a glance.
29. As a user, I want to switch between 食材 / 步骤 / 记录, so that a long recipe
    stays navigable.
30. As a user, I want to change 人份 and see 用量 rescaled, so that I can cook a
    different amount without editing the recipe.
31. As a user, I want to tick off ingredients per group, so that I can shop and
    prep against the list.
32. As a user, I want to see how many ingredients I have ticked, so that I know how
    close I am to being ready.
33. As a user, I want to see 已安排 and 历次笔记 on the dish, so that my past notes
    are usable the next time I cook it.
34. As a user, I want to favourite a dish from the detail screen, so that it shows
    up under the 收藏 filter.
35. As a user, I want a fixed bottom action to record that I cooked this dish, so
    that the action is always reachable.
36. As a user, I want a clear state when the dish no longer exists, so that a stale
    link does not leave me on a blank screen.

### 新建 / 编辑菜谱

37. As a user, I want 新建菜谱 to open as a modal task with 取消 on the left and
    完成 on the right, so that it is obviously a task I finish or abandon.
38. As a user, I want 完成 disabled while 名称 is empty, so that I cannot save an
    unnamed recipe.
39. As a user, I want to set 名称, 备注, 分类, 用时, 份量 and 标签, so that the
    recipe carries everything the library and detail screens show.
40. As a user, I want to add, name and remove 食材分组 and 食材行, so that I can
    express real recipes.
41. As a user, I want to add and remove 步骤, so that the detail screen can number
    them.
42. As a user, I want to create a new 标签 without leaving the editor, so that I am
    not forced into a separate management screen mid-task.
43. As a user, I want 编辑菜谱 to open with every field prefilled, so that I change
    only what I need to.
44. As a user, I want deleting a recipe to ask for confirmation and to keep its
    history, so that I cannot destroy data by accident.
45. As a user, I want to land on the newly created dish after saving, so that I can
    confirm it worked.

### 打卡

46. As a user, I want a floating action button on tab screens, so that recording a
    meal is always one touch away.
47. As a user, I want the button to fan out into 菜谱打卡 and 照片打卡, so that both
    kinds of record are equally reachable.
48. As a user, I want 打卡 to open as a bottom sheet over the current screen, so
    that I do not lose my place.
49. As a user, I want a meal type suggested from the current time, so that the
    common case needs no decision.
50. As a user, I want to either pick a 菜谱 or type what I ate, so that both planned
    and spontaneous meals can be recorded.
51. As a user, I want to set 份量 and write 笔记 on the record, so that the note can
    later surface on the dish as 历次笔记.
52. As a user, I want recording on a future date to become 计划 rather than a
    record, so that the app does not claim I ate something I have not.
53. As a user, I want to confirm a 计划 in one tap on the day, so that planning and
    recording stay one flow.
54. As a user, I want to edit or delete an existing record, so that mistakes are
    recoverable.
55. As a user, I want a clear success state after saving, so that I know the record
    landed.
56. As a user, I want the FAB on a future date to mean 安排一道, so that planning
    reads correctly.

### 今日

57. As a user, I want 今日 to open on today by default, so that the common case is
    zero taps.
58. As a user, I want a week strip with 记录 / 已安排 markers, so that I can see the
    shape of the week at a glance.
59. As a user, I want to browse to any past date and see that day's records, so that
    I can review and backfill.
60. As a user, I want future dates to be assignable but their 记录 list replaced by
    计划, so that the screen shows the right thing for that date.
61. As a user, I want to page the strip a week at a time, so that browsing is fast.
62. As a user, I want a day overview with an activity ring and the current 连续记录
    streak, so that I can see how I am doing.
63. As a user, I want a 近 7 天记录频次 chart, so that my recent rhythm is visible.
64. As a user, I want 待确认的安排 grouped separately with a one-tap 吃了 action, so
    that plans convert to records without opening the sheet.
65. As a user, I want my 常做菜谱 with 累计次数 and 上次做于, so that I can quickly
    repeat a familiar dish.
66. As a user, I want 本月打卡天 / 累计记录 / 待赴的安排 totals, so that the tab
    summarises the month.

### 我的

67. As a user, I want an identity card showing my name and 连续记录 days, so that
    the tab is personal.
68. As a user, I want a 演示账号 badge when I am in the public 演示空间, so that I
    know my data is shared.
69. As a user, I want a 28-day 热力图 I can tap to jump to that date, so that
    reviewing history is one gesture.
70. As a user, I want 累计记录 / 菜谱 / 收藏 totals, so that the account has a
    summary.
71. As a user, I want entry points to 分类管理 and 标签管理 that show how many
    exist, so that I can find them.
72. As a user, I want an 关于 alert, so that the app can explain itself.
73. As a user, I want to reach the design system from 关于, so that the system is
    still inspectable on device.
74. As a user, I want to sign out from 我的 with confirmation, so that the action is
    deliberate.

### 分类 / 标签管理

75. As a user, I want to create a 分类 or 标签 inline and keep focus, so that I can
    add several in a row.
76. As a user, I want to see how many 菜谱 use each item, so that I understand the
    consequences of renaming or deleting.
77. As a user, I want renaming to update every referencing 菜谱, so that the library
    stays consistent.
78. As a user, I want a 分类 that is still in use to be undeletable, with an
    explanation, so that no recipe is left without a category.
79. As a user, I want deleting a 标签 to remove it from recipes but keep the
    recipes, so that cleanup is safe.
80. As a user, I want duplicate names to be rejected with the server's message, so
    that the list stays unambiguous.

### 照片打卡

81. As a user, I want to take a photo or pick one from my library, so that a meal
    can be recorded as a picture.
82. As a user, I want the photo compressed before upload, so that recording stays
    fast on a weak connection.
83. As a user, I want to write a short caption on the photo, so that the record
    reads in my own words.
84. As a user, I want the meal type inferred from the time with no extra choice, so
    that photo capture is quick.
85. As a user, I want a clear success state, so that I know the photo was saved.
86. As a user, I want my photo records to show a thumbnail in the 今日 timeline, so
    that they are distinguishable from recipe records.
87. As a user, I want a photo record's image to be visible when I reopen it, so that
    I can confirm what I recorded.

### Cross-cutting

88. As a user, I want the same Chinese copy and the same visual hierarchy as the
    Web app, so that the two platforms feel like one product.
89. As a user, I want optimistic feedback on writes, so that the UI responds
    immediately even on a slow connection.
90. As a user, I want a record I just created to survive navigation, so that moving
    between tabs never loses it.
91. As a user, I want the UI to keep working when the API is slow, so that a cold
    backend never leaves me on a spinner forever.
92. As a user, I want to see the server's Chinese error message when a write fails,
    so that I know what to change.
93. As a developer, I want the Web app's data contracts reused, so that a change to
    a payload cannot silently diverge between platforms.
94. As a maintainer, I want the app's name, slug and URL scheme to be the product's,
    so that the build is not still the scaffold.
95. As a maintainer, I want TypeScript, lint and formatting to pass for the Expo
    project after the migration, so that the codebase stays healthy.
96. As a maintainer, I want the Expo app to be tracked by the monorepo, so that this
    work can actually be committed.

## Implementation Decisions

### Backend

- Reuse the existing Next.js API as the backend. No new service, no schema change,
  no new endpoint beyond authentication transport.
- Add a bearer-token path alongside the Cookie path so a native client can
  authenticate. The token is the same session token the Web app already issues;
  the server already stores only its SHA-256, so the change is confined to reading
  the token from an `Authorization: Bearer …` header in addition to the Cookie, and
  returning the token to clients that ask for it on login / register / demo.
  Existing browser behaviour is unchanged.
- The native client sends `Authorization` on every API call and never relies on
  cookies, `Set-Cookie` or `credentials: include`.
- The API base URL is configuration (`EXPO_PUBLIC_API_BASE_URL`), not a constant.
  Simulator, LAN device and deployed environments differ, and the value must be
  changeable without a code edit.
- Recipe `image` values are stored as paths relative to the Web origin. The native
  client resolves them against the API base URL and falls back to the existing
  蓝浅底 placeholder when the image is empty or cannot be loaded, matching current
  Web behaviour.
- `/api/photos/[id]` requires the session, so native images are requested with an
  `Authorization` header rather than a bare URL.
- CORS is not required for native builds. Making `expo start --web` work against the
  API is out of scope for this phase.

### Modules to build

These are the modules the migration needs. They are listed here so their
boundaries can be agreed before implementation; each is meant to be a deep module
with a small, stable interface.

1. **API client** — base URL resolution, bearer injection, timeout guard, JSON and
   multipart requests, error mapping to the server's Chinese message, and 401
   handling. Knows nothing about any specific screen.
2. **Session** — token storage in the device keychain, restore on launch, sign in /
   register / demo / sign out, and the current user. Exposes one hook to screens.
3. **Data layer** — the native counterpart of the Web app's `use-app-data`: the
   same hook contracts for recipes, check-ins, check-in ranges, statistics,
   taxonomies and per-recipe history, plus their mutations, optimistic updates and
   cross-screen invalidation. The Web app used `window` events for invalidation;
   this module replaces that with an in-process event bus so the screens keep the
   same shape.
4. **Domain helpers** — pure functions shared by screens: local date formatting and
   relative-day labels, day arithmetic, ingredient amount scaling, meal-type
   inference from the clock, and the derived statistics the Web API computes for
   display. Pure, screen-free, and the natural unit-test target.
5. **Photo pipeline** — pick or capture, compress to the same long-edge / quality
   budget as the Web client, upload, and expose a displayable source that carries
   the session header.
6. **App Chrome integration** — how the migrated design system's TabBar,
   BottomActionBar, Sheet, Alert, SuccessOverlay and full-screen modal chrome are
   mounted by the router rather than by the Web app's page-level modal host.
7. **Screens** — one module per route, composed from the design system only.

### Navigation and presentation

- Use Expo Router's file-based routes. The initial route resolves the session and
  sends the user to either the 欢迎 flow or 今日.
- 今日 / 菜谱 / 我的 are a tab group. Pushed and modal screens sit outside it so the
  tab bar is naturally absent there, matching the Web app's rule that the tab bar
  and 打卡 button appear only on tab roots.
- 菜谱详情 is a stack push. 新建菜谱 / 编辑菜谱 / 分类管理 / 标签管理 are modal
  presentations, matching the Web app's "finish or abandon" task semantics.
- The Web app kept parallel routes for 新建菜谱 / 编辑菜谱 / 分类 / 标签 so they could
  be opened directly. Native uses the modal routes as the single implementation and
  keeps deep-linkability through the router, so there is no second code path to
  drift.
- 打卡弹层 is not a route. It is presented over the current screen by the 打卡
  provider and opened from the FAB, exactly as on the Web. A `/checkin` deep link
  route redirects to 今日 and opens the sheet, preserving the Web app's shareable
  deep link.
- The Design System Showcase moves from the initial route to its own route and is
  linked from the 关于 alert.
- Screen transitions use the migrated motion primitives, not ad-hoc animations.

### Behaviour preserved from Web

- Optimistic writes with a bounded timeout so a cold database never blocks the UI.
- Records created in the current session survive navigation.
- Future-dated 打卡 becomes 计划; 计划 converts to a record in one tap.
- Writes send an explicit `day` computed from the device clock; the device's time
  zone is the source of truth for "today", as it already is on Web.
- Server error messages are surfaced verbatim.

### Platform translations

- Cookies → keychain token plus bearer header.
- `window` CustomEvents → in-process event bus inside the data layer.
- `<img>` → the native image component, with headers where the resource is
  session-protected.
- `<input type="file" accept="image/*">` plus canvas compression → the platform
  image picker plus native image manipulation.
- `useSearchParams` / `router.push("/today?day=…")` → typed router params.
- `position: fixed` chrome → safe-area-aware chrome (already delivered by the
  design system).
- `backdrop-filter`, scroll-locking and keyboard/Escape handling → native modal and
  sheet behaviour (already delivered by the design system).
- Web-only grain, scrollbars and hover styling stay unmigrated, as decided in the
  design system phase.

### Repo and build hygiene

- The Expo app is currently a nested Git repository, so the monorepo sees it only
  as an untracked directory and none of this work can be committed. Resolving that
  has to happen before the migration lands.
- `app.json` still carries the scaffold name, slug and scheme. These become the
  product's, and the photo/camera usage descriptions are declared with the picker
  dependency.

## Testing Decisions

- A good test here checks observable behaviour: given this API state, does the
  screen show this, and does this interaction produce this request. It does not
  assert which component library, styling mechanism or storage API was used.
- The primary seam is the running Expo app on a simulator/device, exercised route
  by route. Each migration slice must be usable end to end before it is done — a
  screen that type-checks but cannot complete its flow is not finished.
- The existing automated gate applies unchanged: Expo TypeScript checking, lint and
  formatting must pass.
- The repository has no test runner today. The pure domain helpers are the one
  place where automated tests would pay for themselves immediately, because
  amount scaling, relative-day labels and meal inference have exact expected
  outputs and are used by several screens. Whether to add a minimal runner for
  them, or to rely on the device seam for this phase, is a decision to make before
  implementation starts.
- No screenshot, E2E, Maestro, Detox or device-automation infrastructure is added
  in this phase.

## Out of Scope

- New product features that do not exist on Web. This is a migration, not a
  redesign.
- The Web marketing/Showcase site (`/` and `/design-system`) as a page to migrate.
  The Expo Showcase already covers the design system, and the Web docs layout is
  explicitly not being ported.
- Extracting a shared cross-platform package for tokens, types or validation. It is
  still deferred, and this phase only makes sure it stays possible.
- Offline support, background sync, push notifications and local caching policy
  beyond what the screens need.
- Reduced-motion support, still deferred from the design system phase.
- Android-specific visual optimisation, though nothing should block Android.
- Making `expo start --web` work against the API (CORS, web storage fallbacks).
- Changing the Web product's behaviour, routes or visual design.
- Real authentication hardening for a production mobile client (refresh tokens,
  device revocation, biometric unlock).

## Further Notes

- The Web app's screens are the behavioural source of truth. Where the Web app's
  copy, ordering or states are deliberate — the "featured card only while
  browsing" rule, the "分类 in use cannot be deleted" rule, the
  "计划 does not count as 做过" rule — those rules are part of the migration, not
  implementation detail to be reinvented.
- The Web app derives 做过次数 and 上次做于 from 打卡 records rather than
  incrementing counters. The native client must not recompute or cache these; they
  arrive on the recipe payload from the API.
- Recipe seeds, 分类 and 标签 defaults, and 演示账号 seeding are server-side
  concerns and stay there. The native app never ships starter content of its own.
- The Web app currently has no image assets, so recipe images fall back to the
  placeholder in practice. The native app should still implement the real path so
  that images work as soon as they exist.
- If the device time zone and the server disagree, the device wins for "today",
  because every write already sends an explicit `day`. Keep that invariant.
- After this phase, the outstanding follow-ups are: the shared package extraction,
  reduced-motion support, and any Web/mobile copy divergence discovered during
  migration.
