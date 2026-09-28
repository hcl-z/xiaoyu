# NativeWind — Tailwind Svg



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Fill (https://www.nativewind.dev/docs/tailwind/svg/fill)

## Usage

React Native does not have SVG components but universal SVG support can be achieved with 3rd party libraries such as [react-native-svg](https://github.com/react-native-svg/react-native-svg). While these docs use `react-native-svg`, the concept applies to all libraries.

You will need to `cssInterop()` on these components to properly style them for native.

Example usage

```tsx title=App.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { cssInterop } from 'nativewind'

cssInterop(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true }
  },
});
cssInterop(Circle, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});
cssInterop(Rect, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});

export function SvgExample () {
  return (
    <View className="inset-0 items-center content-center">
      <Svg className="h-1/2 w-1/2" viewBox="0 0 100 100" >
        <Circle cx="50" cy="50" r="45" className="stroke-blue-500 stroke-2 fill-green-500" />
        <Rect x="15" y="15" className="w-16 h-16 stroke-red-500 stroke-2 fill-yellow-500" />
      </Svg>
    </View>
  );
}
```

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `fill-{n}`     | ✅ Supported |
| `fill-[n]`     | ✅ Supported |
| `fill-inherit` | 🌐 Web only |
| `fill-current` | 🌐 Web only |

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

# Stroke Width (https://www.nativewind.dev/docs/tailwind/svg/stroke-width)

## Usage

React Native does not have SVG components but universal SVG support can be achieved with 3rd party libraries such as [react-native-svg](https://github.com/react-native-svg/react-native-svg). While these docs use `react-native-svg`, the concept applies to all libraries.

You will need to `cssInterop()` on these components to properly style them for native.

Example usage

```tsx title=App.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { cssInterop } from 'nativewind'

cssInterop(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true }
  },
});
cssInterop(Circle, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});
cssInterop(Rect, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});

export function SvgExample () {
  return (
    <View className="inset-0 items-center content-center">
      <Svg className="h-1/2 w-1/2" viewBox="0 0 100 100" >
        <Circle cx="50" cy="50" r="45" className="stroke-blue-500 stroke-2 fill-green-500" />
        <Rect x="15" y="15" className="w-16 h-16 stroke-red-500 stroke-2 fill-yellow-500" />
      </Svg>
    </View>
  );
}
```

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `stroke-{n}` | ✅ Supported |
| `stroke-[n]` | ✅ Supported |

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

# Stroke (https://www.nativewind.dev/docs/tailwind/svg/stroke)

## Usage

React Native does not have SVG components but universal SVG support can be achieved with 3rd party libraries such as [react-native-svg](https://github.com/react-native-svg/react-native-svg). While these docs use `react-native-svg`, the concept applies to all libraries.

You will need to `cssInterop()` on these components to properly style them for native.

Example usage

```tsx title=App.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { cssInterop } from 'nativewind'

cssInterop(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true }
  },
});
cssInterop(Circle, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});
cssInterop(Rect, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true, stroke: true, strokeWidth: true, fill: true }
  },
});

export function SvgExample () {
  return (
    <View className="inset-0 items-center content-center">
      <Svg className="h-1/2 w-1/2" viewBox="0 0 100 100" >
        <Circle cx="50" cy="50" r="45" className="stroke-blue-500 stroke-2 fill-green-500" />
        <Rect x="15" y="15" className="w-16 h-16 stroke-red-500 stroke-2 fill-yellow-500" />
      </Svg>
    </View>
  );
}
```

## Compatibility

| Class            | Support     |
| ---------------- | ----------- |
| `stroke-{n}`     | ✅ Supported |
| `stroke-[n]`     | ✅ Supported |
| `stroke-inherit` | 🌐 Web only |
| `stroke-current` | 🌐 Web only |

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

