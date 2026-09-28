# 02: Establish native design tokens

**What to build:** The Expo design system exposes the Web product’s visual language as typed native tokens and NativeWind theme values. The Showcase can render the palette, typography, spacing, radii, elevations, layout constants, icon sizing, and motion configuration without inventing new values.

**Blocked by:** 01: Lock Expo foundation and add Showcase route.

**Status:** ready-for-agent

- [ ] Surface, text, semantic, and chart colors match the Web design system.
- [ ] Typography roles include metric, display, title, subhead, body, caption, and micro treatments.
- [ ] Spacing, radius, elevation, layout, icon, and motion values are represented as typed Expo tokens.
- [ ] Static token values are available through NativeWind theme configuration.
- [ ] Dynamic, animated, shadow, and native-only values remain available through TypeScript tokens.
- [ ] The Showcase renders a token reference section using the native token layer.
