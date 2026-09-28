# 04: Build reusable motion primitives

**What to build:** Expo components have a shared motion layer that reproduces the Web system’s enter, fade, slide, scale, press, segment, toggle, layout, and success-feedback behavior. Motion parameters come from the token layer so interactions remain consistent across the Showcase.

**Blocked by:** 02: Establish native design tokens.

**Status:** ready-for-agent

- [x] Fade, Slide, and Scale primitives support the Showcase’s visible entrance and state transitions.
- [x] Press feedback provides a consistent touch response for interactive components.
- [x] Segment indicator and Toggle transitions use their defined spring behavior.
- [x] Layout or presence transitions cover the required component-level movement without Web-only APIs.
- [x] Success/pop feedback uses the defined spring treatment.
- [x] Motion primitives consume shared timing, easing, and spring tokens rather than local duplicated constants.
- [x] The Showcase renders representative examples of the motion primitives.
