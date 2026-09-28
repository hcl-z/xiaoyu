# NativeWind — Tailwind Effects



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Background Blend Mode (https://www.nativewind.dev/docs/tailwind/effects/background-blend-mode)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/background-blend-mode)

## Compatibility

| Class                  | Support     |
| ---------------------- | ----------- |
| `bg-blend-normal`      | ✅ Supported |
| `bg-blend-multiply`    | ✅ Supported |
| `bg-blend-screen`      | ✅ Supported |
| `bg-blend-overlay`     | ✅ Supported |
| `bg-blend-darken`      | ✅ Supported |
| `bg-blend-lighten`     | ✅ Supported |
| `bg-blend-color-dodge` | ✅ Supported |
| `bg-blend-color-burn`  | ✅ Supported |
| `bg-blend-hard-light`  | ✅ Supported |
| `bg-blend-soft-light`  | ✅ Supported |
| `bg-blend-difference`  | ✅ Supported |
| `bg-blend-exclusion`   | ✅ Supported |
| `bg-blend-hue`         | ✅ Supported |
| `bg-blend-saturation`  | ✅ Supported |
| `bg-blend-color`       | ✅ Supported |
| `bg-blend-luminosity`  | ✅ Supported |

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

# Box Shadow Color (https://www.nativewind.dev/docs/tailwind/effects/box-shadow-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/box-shadow-color)

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `shadow-{n}` | ✅ Supported |
| `shadow-[n]` | ✅ Supported |

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

# Box Shadow (https://www.nativewind.dev/docs/tailwind/effects/box-shadow)

Nativewind uses the scaling system from [react-native-shadow-generator](https://ethercreative.github.io/react-native-shadow-generator/) to help generate cross platform shadows.

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/box-shadow)

> CAUTION
>
> On native, shadows may not appear if a background color is not set

## Example

```tsx
import { Text, View } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View)
const StyledText = styled(Text)

const App = () => {
  return (
    <StyledView className="flex-1 items-center justify-center">
      <StyledView className="h-[50vh] items-center justify-center shadow">
        <StyledText className="text-slate-800 shadow">Try editing me! 🎉</StyledText>
      </StyledView>
    </StyledView>
  );
}
```

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `shadow`       | ✅ Supported |
| `shadow-{n}`   | ✅ Supported |
| `shadow-none`  | ✅ Supported |
| `shadow-[n]`   | 🌐 Web only |
| `shadow-inner` | 🌐 Web only |

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

# Mix Blend Mode (https://www.nativewind.dev/docs/tailwind/effects/mix-blend-mode)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/mix-blend-mode)

## Compatibility

| Class                    | Support     |
| ------------------------ | ----------- |
| `mix-blend-normal`       | 🌐 Web only |
| `mix-blend-multiply`     | 🌐 Web only |
| `mix-blend-screen`       | 🌐 Web only |
| `mix-blend-overlay`      | 🌐 Web only |
| `mix-blend-darken`       | 🌐 Web only |
| `mix-blend-lighten`      | 🌐 Web only |
| `mix-blend-color-dodge`  | 🌐 Web only |
| `mix-blend-color-burn`   | 🌐 Web only |
| `mix-blend-hard-light`   | 🌐 Web only |
| `mix-blend-soft-light`   | 🌐 Web only |
| `mix-blend-difference`   | 🌐 Web only |
| `mix-blend-exclusion`    | 🌐 Web only |
| `mix-blend-hue`          | 🌐 Web only |
| `mix-blend-saturation`   | 🌐 Web only |
| `mix-blend-color`        | 🌐 Web only |
| `mix-blend-luminosity`   | 🌐 Web only |
| `mix-blend-plus-lighter` | 🌐 Web only |

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

# Opacity (https://www.nativewind.dev/docs/tailwind/effects/opacity)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/opacity)

## Compatibility

| Class         | Support     |
| ------------- | ----------- |
| `opacity-{n}` | ✅ Supported |
| `opacity-[n]` | ✅ Supported |

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

