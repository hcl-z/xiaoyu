# NativeWind — Tailwind New Concepts



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Safe Area Insets (https://www.nativewind.dev/docs/tailwind/new-concepts/safe-area-insets)

## Overview

Safe Area Insets are the area of the screen that is not covered by the notch, home indicator, or rounded corners. This is the area where you should place your content to ensure it is not obscured by the system UI.

## Usage (native)

On native, the safe area measurements are provided by [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context). You will need to wrap your app with the `SafeAreaProvider` and use the `useSafeAreaEnv` hook to get the safe area insets.

```tsx
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export function MyApp(props) {
  // Make sure you have the SafeAreaProvider at the root of your app
  return (
    <SafeAreaProvider>
      <View className="p-safe" {...props} />
    </SafeAreaProvider>
  );
}
```

> Expo Router adds the \<SafeAreaProvider /> to every route. This setup is not needed

## Usage (web)

On web, your CSS StyleSheet will use the [CSS `env()` function](https://developer.mozilla.org/en-US/docs/Web/CSS/env) and no extra setup is needed.

The `h-screen-safe` and `min-h-screen-safe` utilities may not work as expected on Google Chrome. Add height: `-webkit-fill-available` on parent nodes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    height: -webkit-fill-available;
  }

  body {
    height: -webkit-fill-available;
  }

  #root {
    height: -webkit-fill-available;
  }
}
```

## Compatibility

| Class               | Support     | Comments         |
| ------------------- | ----------- | ---------------- |
| `m-safe`            | ✅ Supported | \[object Object] |
| `p-safe`            | ✅ Supported | \[object Object] |
| `mx-safe`           | ✅ Supported | \[object Object] |
| `px-safe`           | ✅ Supported | \[object Object] |
| `my-safe`           | ✅ Supported | \[object Object] |
| `py-safe`           | ✅ Supported | \[object Object] |
| `ms-safe`           | ✅ Supported | \[object Object] |
| `me-safe`           | ✅ Supported | \[object Object] |
| `ps-safe`           | ✅ Supported | \[object Object] |
| `pe-safe`           | ✅ Supported | \[object Object] |
| `mt-safe`           | ✅ Supported | \[object Object] |
| `pt-safe`           | ✅ Supported | \[object Object] |
| `mr-safe`           | ✅ Supported | \[object Object] |
| `pr-safe`           | ✅ Supported | \[object Object] |
| `mb-safe`           | ✅ Supported | \[object Object] |
| `pb-safe`           | ✅ Supported | \[object Object] |
| `ml-safe`           | ✅ Supported | \[object Object] |
| `pl-safe`           | ✅ Supported | \[object Object] |
| `inset-safe`        | ✅ Supported | \[object Object] |
| `inset-x-safe`      | ✅ Supported | \[object Object] |
| `inset-y-safe`      | ✅ Supported | \[object Object] |
| `top-safe`          | ✅ Supported | \[object Object] |
| `right-safe`        | ✅ Supported | \[object Object] |
| `bottom-safe`       | ✅ Supported | \[object Object] |
| `left-safe`         | ✅ Supported | \[object Object] |
| `start-safe`        | ✅ Supported | \[object Object] |
| `end-safe`          | ✅ Supported | \[object Object] |
| `h-screen-safe`     | ✅ Supported | \[object Object] |
| `min-h-screen-safe` | ✅ Supported | \[object Object] |
| `max-h-screen-safe` | ✅ Supported | \[object Object] |
| `*-safe-or-[n]`     | ✅ Supported | \[object Object] |
| `*-safe-offset-[n]` | ✅ Supported | \[object Object] |

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

