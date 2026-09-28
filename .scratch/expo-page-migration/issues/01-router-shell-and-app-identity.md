# 01: Stand up the Expo Router shell and app identity

**What to build:** The Expo app stops being a single Showcase route and becomes a navigable app shell: a session-aware initial route, an auth flow group, and 今日 / 菜谱 / 我的 as tabs with the migrated TabBar and correct safe areas. The Design System Showcase moves to its own route and stays reachable. The app also stops being the Expo scaffold — name, slug, scheme and the monorepo's ability to track the app are settled.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**User stories:** 1, 2, 3, 4, 6, 7, 8, 94, 96

- [x] Expo Router owns the app structure: an initial route that resolves session state, an auth flow group for 欢迎 / 登录 / 注册, and a tab group for 今日 / 菜谱 / 我的.
- [x] The TabBar renders on tab roots with correct active state and safe-area padding, and is absent on pushed and modal screens.
- [x] Placeholder tab and auth screens navigate correctly, so the shell is demoable before any screen is migrated.
- [x] The Design System Showcase is reachable from a non-initial route instead of being the launch screen.
- [x] `app.json` carries the product's name, slug and URL scheme.
- [x] The nested Git repository inside the Expo app no longer prevents the monorepo from tracking its contents.
- [x] Expo TypeScript, lint and formatting checks pass after the restructure.

## Comments

- 2026-09-28: Verified on iPhone 16e (iOS 26.3, Expo Go 57.0.9, Metro :8082). 会话恢复、标签栏、三个标签页、Showcase 深链（`exp://…/--/showcase`，395 个元素）均正常。
