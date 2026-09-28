# 02: Native session and the 欢迎 / 登录 / 注册 flow

**What to build:** A user can launch the app, enter the public 演示空间 with one tap, or register / log in with a private account, and the session survives an app restart. This is the first slice that crosses client, transport and server: the Web API gains a bearer-token path so a native client can authenticate without cookies, and the Expo app stores the token in the device keychain and sends it on every request.

**Blocked by:** 01: Stand up the Expo Router shell and app identity.

**Status:** ready-for-agent

**User stories:** 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20

- [x] The Web API authenticates a request carrying an `Authorization: Bearer …` token in addition to its existing Cookie, without changing browser behaviour.
- [x] Login, register and demo responses give a native client the session token it needs, and logout invalidates that token.
- [x] The Expo app persists the token in the device keychain and restores the session on launch via the current-user endpoint.
- [x] A 欢迎 screen offers 开始使用, 我已有账号 and 先逛逛, and 先逛逛 enters the 演示空间 without credentials.
- [ ] 注册 collects 昵称 / 邮箱 / 密码, checks the password rules live against the server's actual rules, and seeds the account's 起步菜谱 through the existing API. — 界面已确认（三项输入、密码规则实时勾选、未满足时不可提交）；提交会在服务端真实建号，等确认后再跑。
- [x] 登录 supports both the one-tap 演示空间 entry and private email/password sign-in.
- [x] Sign-out asks for confirmation, clears the stored token and all in-memory data, and returns to 欢迎.
- [ ] An expired or rejected session returns the app to the sign-in entry point instead of showing broken screens. — 401 时 `setUnauthorizedHandler` 会清会话回入口，逻辑在，但没有构造过期的令牌去跑一遍。
- [x] The API client resolves its base URL from configuration, so simulator and device builds can point at different hosts. — 开发期从 Metro 的 `hostUri` 推主机名，`EXPO_PUBLIC_API_BASE_URL` 优先。
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 修复「点了没反应」。根因是登录成功后没有任何地方跳转：`app/(auth)/_layout.tsx` 现在在 `status === 'signedIn'` 时 `<Redirect href="/today" />`，`SessionProvider.enter()` 先让内存会话生效再落盘（钥匙串写失败不再挡住进入），`WelcomeScreen` 会把错误显示出来。
- 2026-09-28: 冷启动全流程复测通过——退出登录后冷启动落在欢迎页；「先逛逛」进入今日；「我已有账号，登录 → 登录（一键进入主页）」同样进入今日；再次冷启动直接回到今日（钥匙串令牌恢复）。
- 仍未验证：真机（非模拟器）上的同一流程；注册页的实际提交（只在界面上确认了密码规则勾选与按钮可用性）。
- 2026-09-28: 登录、先逛逛、一键进入主页、退出登录、冷启动恢复会话都已复测通过；只剩「真提交一次注册」等确认。
