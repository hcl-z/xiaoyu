# 05: Migrate app Chrome and overlays

**What to build:** The Expo design system provides native App Chrome and overlay components that can be exercised from the Showcase: TabBar, BottomActionBar, Alert, SuccessOverlay, FullScreenModal, and an interactive Bottom Sheet. These components respect safe areas and use native gesture and modal behavior.

**Blocked by:** 03: Migrate base UI components; 04: Build reusable motion primitives.

**Status:** ready-for-agent

- [ ] TabBar exposes active and inactive states using the native design tokens and Icon abstraction.
- [ ] BottomActionBar respects the device safe area and maintains usable touch targets.
- [ ] Alert and SuccessOverlay provide clear destructive and successful feedback.
- [ ] FullScreenModal presents and dismisses through an appropriate Expo-native presentation.
- [ ] Bottom Sheet uses @gorhom/bottom-sheet rather than a custom gesture implementation.
- [ ] Bottom Sheet supports the required snap, backdrop, dismiss, scroll, keyboard, and safe-area behavior.
- [ ] Chrome and overlay transitions use the shared motion primitives and tokens.
- [ ] The Showcase renders and can interact with each Chrome and overlay component.
