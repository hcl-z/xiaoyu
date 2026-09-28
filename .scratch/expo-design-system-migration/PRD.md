# Expo Design System Migration

Status: ready-for-agent

## Problem Statement

The repository already has a coherent Web design system for the recipe product, including visual tokens, reusable components, app chrome, and Framer Motion interactions. The Expo app is still a starter project with NativeWind configured but without the Web design language, component library, navigation structure, or motion system. As a result, the mobile app cannot provide the same visual identity or reusable UI foundation as the Web app.

The migration also cannot be a direct DOM/CSS copy. React Native needs native equivalents for CSS utilities, Web hover states, fixed overlays, backdrop effects, Framer Motion transitions, safe areas, sheets, and modal interactions.

## Solution

Build an Expo-native implementation of the existing Web design system while preserving its visual language and component contracts where practical. The first delivery will establish an Expo Router-based Design System Showcase and migrate the design tokens, base UI components, app chrome, and motion primitives needed by that Showcase.

NativeWind will be the default styling mechanism. React Native styles and Reanimated will only be used where required for dynamic values, animation, shadows, platform-specific behavior, or native interaction. The Expo implementation will use local copied tokens for this phase; extracting a shared package is deferred until the design system is stable.

The first delivery will not migrate Recipe business screens or real data. It will use deterministic local fixtures where component examples need data. The Showcase will be the primary validation seam. Validation will consist of TypeScript checking plus lint and formatting checks, with no screenshot, E2E, Maestro, Detox, or component-test infrastructure required in this phase.

## User Stories

1. As a mobile product designer, I want the Expo app to use the same color palette as the Web app, so that the product feels visually consistent across platforms.
2. As a mobile product designer, I want semantic surface, text, accent, success, danger, and chart colors, so that components communicate the same meaning everywhere.
3. As a developer, I want typed Expo design tokens, so that new native components do not invent arbitrary visual values.
4. As a developer, I want NativeWind theme values for static tokens, so that common layout and visual styling remains concise and consistent.
5. As a developer, I want TypeScript tokens for values NativeWind cannot express cleanly, so that animations, shadows, and native APIs can use typed values.
6. As a user, I want typography hierarchy to match the Web design system, so that titles, body copy, labels, captions, and metrics have consistent emphasis.
7. As a developer, I want semantic typography roles, so that components depend on intent rather than scattered font-size values.
8. As a user, I want spacing, radii, and layout proportions to feel familiar from the Web product, so that the mobile UI has the same design language.
9. As a developer, I want the icon implementation to preserve the Web icon family, so that controls remain recognizable across platforms.
10. As a developer, I want a single Icon abstraction, so that the underlying icon library can change without changing component consumers.
11. As a user, I want text components to render the correct hierarchy and semantic color, so that content remains readable and scannable.
12. As a user, I want buttons to provide primary, secondary, destructive, disabled, loading, and pressed states, so that actions are understandable and tactile.
13. As a user, I want press feedback on interactive controls, so that I can tell when a touch has been received.
14. As a user, I want segmented controls to show the selected item and animate the indicator, so that the current choice is obvious.
15. As a user, I want toggles to animate between states, so that state changes feel immediate and understandable.
16. As a user, I want inputs to show focused, filled, disabled, and error states, so that I understand what action is available and how to correct invalid input.
17. As a user, I want cards and surfaces to preserve the grouped-canvas and floating-card relationship, so that content hierarchy remains clear.
18. As a developer, I want reusable surface primitives, so that cards, overlays, and future recipe screens share the same visual foundation.
19. As a user, I want data components to use the established metric and tabular-number treatment, so that values are easy to compare.
20. As a user, I want the mobile app to have an app chrome layer matching the Web product, so that navigation and system-level UI feel coherent.
21. As a user, I want a tab bar with clear active and inactive states, so that I can understand the current app section.
22. As a user, I want bottom actions to respect the device safe area, so that controls are not obscured by system gestures.
23. As a user, I want alerts and success overlays to communicate outcomes clearly, so that destructive and successful actions are unambiguous.
24. As a user, I want full-screen modal presentation to feel native, so that temporary flows remain easy to enter and dismiss.
25. As a user, I want bottom sheets to support dragging, dismissal, snap points, scrolling, keyboard interaction, and safe areas, so that sheet-based flows feel reliable on iOS.
26. As a developer, I want bottom sheets implemented with a mature native library, so that gesture and keyboard edge cases are not reimplemented from scratch.
27. As a user, I want content to enter, leave, scale, and settle with the same motion character as the Web app, so that the product feels polished.
28. As a developer, I want motion primitives for fade, slide, scale, press feedback, layout transitions, and overlays, so that components share timing and spring behavior.
29. As a developer, I want motion tokens to define durations, easing, and spring specifications, so that individual components do not create inconsistent animations.
30. As a user, I want segmented controls, toggles, sheets, alerts, and success states to use appropriate spring behavior, so that each interaction has the intended tactile quality.
31. As a developer, I want the Expo app to use Expo Router from the beginning, so that the Showcase and future product screens have a stable navigation foundation.
32. As a developer, I want the Showcase to be a single vertically scrollable page, so that the complete design system can be inspected consistently.
33. As a developer, I want the Showcase to contain stable examples of each token and component category, so that it can serve as the primary validation seam.
34. As a developer, I want the Showcase to focus on component instances rather than Web documentation prose, so that the first migration remains focused and mobile-appropriate.
35. As a developer, I want deterministic local fixtures for data examples, so that validation does not depend on network services or backend availability.
36. As a maintainer, I want the Expo package versions to be pinned and compatible with the selected Expo and React Native versions, so that installs are reproducible.
37. As a maintainer, I want NativeWind content discovery to cover all Expo source areas, so that classes used by the design system are compiled reliably.
38. As a developer, I want platform-specific differences to be isolated behind native component APIs, so that Web DOM assumptions do not leak into Expo code.
39. As a developer, I want Web hover behavior to be translated into touch-appropriate pressed, focused, selected, or disabled behavior, so that controls remain usable on mobile.
40. As a developer, I want Web-only CSS effects to have explicit native alternatives, so that unsupported CSS is not silently copied or ignored.
41. As a product team member, I want the design system completed and validated before Recipe pages are migrated, so that business screens are built on stable primitives.
42. As a developer, I want later extraction of shared tokens to remain possible, so that this phase does not create an irreversible architecture.
43. As a maintainer, I want TypeScript checking to pass for the migrated Expo project, so that token and component contracts remain sound.
44. As a maintainer, I want linting to pass, so that migrated components follow repository code-quality rules.
45. As a maintainer, I want formatting checks to pass, so that the new design-system code remains consistent with the project style.

## Implementation Decisions

- Treat the existing Web design tokens and design-system components as the visual and behavioral source of truth, while implementing Expo components with React Native primitives rather than copying DOM or CSS code.
- Use a three-layer native architecture: theme tokens, base UI components, and composite Chrome/showcase components. Keep motion primitives as a reusable support layer used by UI and Chrome.
- Initially copy and adapt the Web token mirror into the Expo project’s theme area. Do not create a shared workspace package in this phase.
- Maintain two token consumption paths: NativeWind theme configuration for static styles, and typed TypeScript tokens for animation values, native shadow configuration, dynamic styles, and platform APIs.
- Use NativeWind by default. Use StyleSheet only when NativeWind cannot express the required native behavior cleanly, especially for animated styles, dynamic calculations, complex shadows, and platform-specific styles.
- Use Expo Router immediately and make the Design System Showcase the initial route. Keep the Showcase as one vertically scrollable page with sections for colors, typography, spacing/radius, icons, controls, inputs, surfaces, data, Chrome, and motion.
- Use lucide-react-native behind a local Icon abstraction to preserve the Lucide visual language while keeping the implementation replaceable.
- Use @gorhom/bottom-sheet for interactive bottom sheets, with safe-area, keyboard, backdrop, snap-point, scrolling, and dismissal behavior handled through the native sheet integration.
- Use native Modal or Expo Router modal presentation where appropriate for full-screen modal behavior, and use local overlay components for alerts and success feedback.
- Use Reanimated and the existing worklets setup for motion primitives, replacing Framer Motion concepts with Animated views, shared values, timing, springs, press feedback, and layout transitions.
- Preserve the Web motion vocabulary: enter/exit placement, fade, sheet spring, segment spring, toggle spring, success pop, and progress drawing. Do not duplicate motion constants inside individual components.
- Do not implement reduced-motion behavior in the first phase, even though the Web system supports it. Record it as a follow-up accessibility requirement.
- Translate Web hover states into touch-appropriate press, focus, selected, disabled, or gesture states. Do not attempt to reproduce hover semantics on native mobile.
- Replace unsupported Web effects explicitly: CSS fixed positioning becomes native absolute positioning with safe-area handling; pseudo-elements become additional native views; backdrop effects use an appropriate native surface or blur alternative; Web-only scrollbar and grain effects are not first-phase blockers.
- Configure deterministic mock fixtures only for Showcase data examples. Do not migrate real data fetching, caching, or Recipe domain logic in this specification.
- Keep the external component contracts semantic and platform-neutral where practical, while allowing native implementations to use React Native-specific internals.
- Validate the migration at the highest available seam: the Expo Design System Showcase. Do not add screenshot, E2E, Maestro, Detox, or broad component-test infrastructure in this phase.

## Testing Decisions

- The primary test seam is the Expo Design System Showcase because it exercises the token layer, base components, Chrome, motion primitives, navigation entry point, and deterministic fixtures together through user-visible behavior.
- Tests and checks should verify that the app compiles, the Showcase route can be type-checked, and all migrated components satisfy their public TypeScript contracts.
- TypeScript checking is required for the Expo project and should catch invalid token usage, incorrect component props, route integration problems, and animation type errors.
- Linting is required for the migrated Expo source and should catch import, React, accessibility, and code-quality issues supported by the current project configuration.
- Formatting validation is required for all migrated Expo source and configuration files.
- Do not test whether a component uses NativeWind, StyleSheet, Reanimated, or a particular third-party implementation. Those are implementation choices; tests should focus on the externally observable contract.
- Do not add screenshot comparison or device automation in this phase. Visual inspection can be performed during development, but it is not a required automated acceptance check.
- There is currently no established Expo test suite or React Native test pattern in the repository. TypeScript, lint, and formatting checks are therefore the applicable prior-art baseline for this migration.
- The acceptance checks are: Expo TypeScript check passes, Expo lint passes, and Expo formatting check passes.

## Out of Scope

- Recipe home, recipe detail, search, filtering, favorites, settings, or other business screens.
- Real API integration, database access, authentication, caching, synchronization, and production data state management.
- Migration of Web design-system documentation prose or desktop documentation layout.
- Extraction into a shared workspace package or cross-platform source package.
- Full source-code reuse between Web and Expo components.
- Reduced-motion support and accessibility preference synchronization in the first phase.
- Screenshot baselines, screenshot diffing, Maestro, Detox, Appium, or other end-to-end automation.
- Full Android-specific visual optimization, although APIs should not block Android support.
- Reproducing Web-only hover, CSS pseudo-elements, CSS filters, fixed positioning semantics, scrollbars, or grain effects exactly.
- New Recipe domain models or production fixtures beyond the deterministic examples needed by Showcase components.
- Refactoring unrelated Web design-system code unless required to clarify token or behavior parity.

## Further Notes

- The Web design system currently combines a CSS token source with a TypeScript mirror. The Expo migration should preserve the semantic vocabulary and avoid adding values that exist only because of a single screen.
- The Expo starter currently uses an unpinned NativeWind version alongside pinned Expo and React Native versions. Dependency compatibility and reproducibility must be resolved before relying on the migrated components.
- The initial implementation should be delivered in milestones: Expo Router and dependency foundation; tokens; base UI; motion primitives; Chrome; Showcase; then validation and cleanup.
- After the Showcase passes the agreed TypeScript, lint, and formatting checks, a separate follow-up specification can cover Recipe page migration and determine whether the copied theme should become a shared package.
