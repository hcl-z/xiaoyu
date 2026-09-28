# NativeWind — Tailwind Transitions Animation



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Animation (https://www.nativewind.dev/docs/tailwind/transitions-animation/animation)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/animation)

Animations are powered by `react-native-reanimated` and support keyframe-based CSS animations including `from`/`to` blocks, multi-step keyframes, per-frame timing functions (`cubic-bezier`), and transform animations.

## Supported Features

* Keyframe animations with `from`/`to` and percentage-based frames
* Transform animations (rotate, translateX, translateY, scale, etc.)
* Starting transform values (animating from a non-default transform)
* Per-frame `animation-timing-function` (e.g. `cubic-bezier`)
* Animations triggered by pseudo-classes (e.g. `:active`)
* Stopping animations by removing the animation class
* `animation-none` to halt an active animation
* Changing `animation-duration` mid-animation (resets and restarts)
* Infinite animations with `animation-iteration-count: infinite`

## Compatibility

| Class            | Support                 |
| ---------------- | ----------------------- |
| `animate-none`   | 🧪 Experimental Support |
| `animate-spin`   | 🧪 Experimental Support |
| `animate-ping`   | 🧪 Experimental Support |
| `animate-pulse`  | 🧪 Experimental Support |
| `animate-bounce` | 🧪 Experimental Support |
| `animate-[n]`    | 🧪 Experimental Support |

Legend

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Supported

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

## Known Limitations

* Animations currently only work with the `style` prop (not all mapped props)
* We are looking for contributors to help improve performance

# Transition Delay (https://www.nativewind.dev/docs/tailwind/transitions-animation/transition-delay)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/transition-delay)

## Compatibility

| Class       | Support                 |
| ----------- | ----------------------- |
| `delay-{n}` | 🧪 Experimental Support |
| `delay-[n]` | 🧪 Experimental Support |

Legend

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Supported

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

# Transition Duration (https://www.nativewind.dev/docs/tailwind/transitions-animation/transition-duration)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/transition-duration)

## Compatibility

| Class          | Support                 |
| -------------- | ----------------------- |
| `duration-{n}` | 🧪 Experimental Support |
| `duration-[n]` | 🧪 Experimental Support |

Legend

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Supported

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

# Transition Property (https://www.nativewind.dev/docs/tailwind/transitions-animation/transition-property)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/transition-property)

Transitions are powered by `react-native-reanimated` and support smooth interpolation between style values when classes change.

## Supported Features

* Numeric property transitions (e.g. `width`, `height`, `opacity`)
* Color transitions with proper interpolation
* Transitions triggered by class changes on rerender
* Transitions triggered by pseudo-class interactions (e.g. `:active`)
* Transitions combined with group parent states

## Compatibility

| Class                  | Support                 |
| ---------------------- | ----------------------- |
| `transition`           | 🧪 Experimental Support |
| `transition-all`       | 🧪 Experimental Support |
| `transition-colors`    | 🧪 Experimental Support |
| `transition-opacity`   | 🧪 Experimental Support |
| `transition-transform` | 🧪 Experimental Support |
| `transition-{n}`       | 🧪 Experimental Support |
| `transition-[n]`       | 🧪 Experimental Support |
| `transition-shadow`    | 🌐 Web only             |

Legend

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Supported

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

# Transition Timing Function (https://www.nativewind.dev/docs/tailwind/transitions-animation/transition-timing-function)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/transition-timing-function)

## Compatibility

| Class      | Support                 |
| ---------- | ----------------------- |
| `ease-{n}` | 🧪 Experimental Support |
| `ease-[n]` | 🧪 Experimental Support |

Legend

### Class

`-{n}` Supports values from theme

`-[n]` Supports arbitrary values

### Icon

✅ Supported

✔️ Partial support on native

🧪 Experimental support on native

📱 Native only

🌐 Web only

