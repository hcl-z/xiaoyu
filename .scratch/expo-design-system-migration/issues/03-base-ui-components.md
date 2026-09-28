# 03: Migrate base UI components

**What to build:** The Expo Showcase can use native versions of the design system’s foundational UI: Icon, Text, Pressable, Button, Segment, Toggle, Input, Card, Surface, and basic data presentation. Components preserve the Web system’s semantic contracts while using touch-appropriate native states.

**Blocked by:** 02: Establish native design tokens.

**Status:** ready-for-agent

- [ ] Icon uses the established Lucide visual language behind a replaceable native Icon abstraction.
- [ ] Text exposes semantic typography and color roles without depending on View text inheritance.
- [ ] Pressable and Button expose appropriate default, pressed, disabled, loading, and destructive states.
- [ ] Segment and Toggle expose selected state and touch feedback.
- [ ] Input exposes empty, filled, focused, disabled, and error states.
- [ ] Card and Surface preserve the grouped canvas, floating card, radius, border, and elevation treatment.
- [ ] Data examples support the established metric and metadata presentation.
- [ ] The Showcase renders representative examples and applicable states for every base component.
