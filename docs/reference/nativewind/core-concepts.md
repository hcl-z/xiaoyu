# NativeWind — Core Concepts



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Dark Mode (https://www.nativewind.dev/docs/core-concepts/dark-mode)

Nativewind supports two primary approaches for implementing dark mode in your app:

1. **System Preference (Automatic)**
2. **Manual Selection (User Toggle)**

Both approaches use [`colorScheme`](https://www.nativewind.dev/docs/api/use-color-scheme) from Nativewind, which provides a unified API for reading and setting the color scheme using React Native's appearance APIs. Under the hood, the `Appearance` API is used on native and `prefers-color-scheme` is used on web.

* To **read** the current system preference, use the `colorScheme` value returned from `useColorScheme`.
* To **manually set** the color scheme (e.g., via a user toggle), use the `colorScheme.set()` function.

Both `colorScheme` and `colorScheme.set()` are imported from Nativewind.

***

## 1. System Preference (Automatic)

By default, Nativewind will follow the device's system appearance (light, dark, or automatic). This is the recommended approach for most apps, as it provides a seamless experience for users who have set their device to a preferred mode.

To read the current system preference, use the `colorScheme` value from the `useColorScheme` hook:

> **Expo Note:**
> Expo apps only follow the system appearance if `userInterfaceStyle` is set to `automatic` in your `app.json`.
> See the [Expo color scheme guide](https://docs.expo.dev/guides/color-schemes/) for more details.

**Example (Expo Snack):**
See a full example in the [Expo Docs](https://docs.expo.dev/develop/user-interface/color-themes/#minimal-example).

This will automatically update when the system appearance changes.

***

## 2. Manual Selection (User Toggle)

If you want to allow users to manually select between light, dark, or system mode, you should use the `colorScheme.set()` function. This is useful for apps that provide a theme toggle in their UI.

**Example:**
See a full implementation at [nativewind/theme-toggle on GitHub](https://github.com/nativewind/theme-toggle).

**Basic Toggle Example:**

```tsx
import { useState } from "react";
import { SafeAreaView, Text, Pressable } from "react-native";
import { colorScheme } from "nativewind";
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    colorScheme.set(newTheme);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} justify-center items-center`}
    >
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <Pressable
        onPress={toggleTheme}
        className="mt-4"
      >
        <Text className={currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} style={{ fontSize: 16, fontWeight: 'bold' }}>
          {currentTheme === 'dark' ? 'Dark' : 'Light'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
```

You can persist the user's choice using a storage solution like [React Native Async Storage](https://react-native-async-storage.github.io/async-storage/).

***

## Best Practice

* **Use the `colorScheme` value from `useColorScheme`** to read the current color scheme (system preference).
* **Use `colorScheme.set()`** to allow users to manually select a color scheme.
* For most apps, system preference is recommended.
* If you provide a manual toggle, always offer a "System" option as well.

***

## References

* [Expo Color Schemes Guide](https://docs.expo.dev/guides/color-schemes/)
* [Nativewind useColorScheme API](https://www.nativewind.dev/docs/api/use-color-scheme)
* [Theme Toggle Example (GitHub)](https://github.com/nativewind/theme-toggle)

# Platform Differences (https://www.nativewind.dev/docs/core-concepts/differences)

Nativewind aligns CSS and React Native into a common language. However the two style engines do have their differences. These are some common differences you may encounter.

## Styling per platform

Styles can be applied selectively per platform using a platform variant. Additionally the `native` variant can be used to target all platforms except for web.

Supported platform modifiers are: `ios:`, `android:`, `web:`, `windows:`, `osx:`, `native:`.

## Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues it's best to declare all styles.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color.

```tsx
❌ <Text className="dark:text-white-500" />
✅ <Text className="text-black dark:text-red-500" />
```

## dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different, however Nativewind treats them as if they are equivalent. This can cause confusion in your theme, do you use `10` or `10px`? The general rule of theme is use `10px`, and Nativewind will fix it for you.

## Flex

React Native uses a different base flex definition to the web. Generally this can be fixed by adding `flex-1` to your classes, however you may need custom styles for more complex layouts.

## Flex Direction

React Native uses a different default `flex-direction` to the web. This can be fixed by explicitly setting a `flex-direction`.

## rem sizing

React Native's `<Text />` renders with a `fontSize: 14`, while the web's default is `16px`. For consistency, Nativewind uses an `rem` value of `16` on web and `14` on native.

## Color Opacity

For performance reasons, Nativewind renders with the `corePlugins`: `textOpacity`,`borderOpacity`, `divideOpacity` and `backgroundOpacity` disabled. Theses plugin allows colors to dynamically changed via CSS variables. Instead, the opacity is set as a static value in the `color` property.

If you require this functionality, you can enable the disabled plugins in your `tailwind.config.js` file.

# Functions & Directives (https://www.nativewind.dev/docs/core-concepts/functions-and-directives)

## Overview

Nativewind allows the same functions and directives as Tailwind CSS. Please refer to the [Tailwind CSS documentation](https://tailwindcss.com/docs/functions-and-directives).

These functions can be used within your theme, arbitrary class names, or within your custom CSS.

In addition to the functions and directives provided by Tailwind CSS, Nativewind polyfills the following CSS functions:

## var()

`var()` is a CSS function that allows you to use the value of a custom property (sometimes called a "CSS variable") inside the value of another property.

```js title="tailwind.config.js"
module.exports = {
  theme: {
    extend: {
      color: {
        custom: "var(--my-custom-color)",
      },
    },
  },
};
```

```tsx
// style: { color: "red" }
<Text className="text-custom [--my-custom-color:red]">

// style: { color: "green" }
<View style={vars({ "--my-custom-color": "green" })}>
  <Text className="text-custom">
</View>
```

## calc()

`calc()` is a CSS function that allows you to perform calculations when specifying CSS property values. It can be used to perform addition, subtraction, multiplication, and division and can be used with other CSS functions such as `var()`

### Supported Modes

Nativewind supports `calc()` with the following unit types:

* **Numerical** (`px`): `calc(10px + 100px)` resolves to `110`
* **Percentage** (`%`): `calc(var(--width) + 20%)` resolves to `"30%"` (when `--width` is `10%`)
* **`rem` units**: `calc(2rem * 5)` resolves correctly using the platform rem value
* **`em` units**: `calc(2em * 2)` resolves relative to the element's font size
* **CSS variables**: `calc(var(--variable) + 20px)` resolves with the variable's runtime value
* **Inside color functions**: `hsl(calc(var(--H) + 20), calc(var(--S) - 10%), calc(var(--L) + 30%))` works for dynamic color calculations

```css
// Numerical calc
.element {
  width: calc(10px + 100px);
}

// With rem units
.element {
  width: calc(2rem * 5);
}

// With CSS variables
.element {
  width: calc(var(--my-variable) + 20px);
}

// Inside color functions
.element {
  background-color: hsl(
    calc(var(--H) + 20),
    calc(var(--S) - 10%),
    calc(var(--L) + 30%)
  )
}
```

### Limitations

#### Mixing Unit Types

React Native's layout engine does not support mixing numerical and percentage units in the same expression. Ensure all operands use the same unit type.

```css
.element {
  // ❌ This mixes numerical and percentage units
  width: calc(100% - 20px);
}

.element {
  // ✅  This only uses numerical units
  --width: 100rem;
  width: calc(var(--width) - 20px);
}

.element {
  // ✅  This only uses percentage units
  --width: 100%;
  width: calc(var(--width) - 20%);
}
```

#### Custom Properties

Nativewind does not support operations in custom properties. Instead, you can use `calc()` with custom properties by first defining the custom property and then using `calc()` to perform the operation.

```css
.element {
  // ❌ Operators cannot be in a custom property
  --width: 100% - 20%;
  width: calc(var(--width));
}

.element {
  // ✅  Operator is part of the calc() expression
  --width: 100%;
  width: calc(var(--width) - 20%);
}
```

## env()

`env()` is a CSS function that allows you to access device specific environment information.

Nativewind supports:

```css
env(safe-area-inset-top);
env(safe-area-inset-bottom);
env(safe-area-inset-left);
env(safe-area-inset-right);
```

Please see [Safe Area Insets](https://www.nativewind.dev/docs/tailwind/new-concepts/safe-area-insets) for more information.

# Quirks (https://www.nativewind.dev/docs/core-concepts/quirks)

Nativewind aligns CSS and React Native into a common language. However the two style engines do have their differences. We refer to these differences as quirks.

## Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues it's best to declare all styles.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color. This is especially important for transitions and animations.

## dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different, however Nativewind treats them as if they are equivalent. Additionally, the Nativewind's compiler requires a unit for most numeric values forcing some styles to use a `px` unit. Generally this works fine, however you may need to use the platform modifiers (`web:`/`native:`/`ios:`/`android:`) to adjust per platform

## Flex

Flexbox works the same way in React Native as it does in CSS on the web, with a few exceptions. The defaults are different, with `flexDirection` defaulting to `column` instead of `row`, `alignContent` defaulting to `flex-start` instead of `stretch`, `flexShrink` defaulting to `0` instead of `1`, the `flex` parameter only supporting a single number.

We recommend explicitly setting the flex direction and using the className `flex-1` for consistent styles

## Yoga 2 vs 3

React Native previously flipped left/right (and start/end) edges when dealing with margin, padding, or border, set on a row-reverse container. In Yoga 3 (introduced in React Native 0.74) the behavior of these properties lines up with web.

# Responsive Design (https://www.nativewind.dev/docs/core-concepts/responsive-design)

> CAUTION
>
> Nativewind's default theme is not yet designed for native devices and still uses breakpoints that were mostly designed for web.

Nativewind's responsive design works identically to Tailwind CSS, please refer to the [official Tailwind CSS docs](https://tailwindcss.com/docs/responsive-design) for more information.

# States & Pseudo-classes (https://www.nativewind.dev/docs/core-concepts/states)

## Hover, Focus, and Active

Nativewind supports the `:hover`, `:focus`, and `:active` pseudo-classes. These work by mapping to the corresponding React Native event props on the component.

| Pseudo-class | Tailwind Modifier | Activating Event | Deactivating Event |
| ------------ | ----------------- | ---------------- | ------------------ |
| `:hover`     | `hover:`          | `onHoverIn`      | `onHoverOut`       |
| `:active`    | `active:`         | `onPressIn`      | `onPressOut`       |
| `:focus`     | `focus:`          | `onFocus`        | `onBlur`           |

```tsx
import { Pressable, Text } from "react-native";

function MyButton() {
  return (
    <Pressable className="bg-blue-500 active:bg-blue-700">
      <Text className="text-white">Press Me</Text>
    </Pressable>
  );
}
```

> The component must support the relevant event prop for the modifier to work. For example, `hover:` requires `onHoverIn`/`onHoverOut`, which is available on `Pressable` and `TextInput` but not `View` or `Text`.

### Combining Pseudo-classes

Multiple pseudo-classes can be combined. All conditions must be met for the styles to apply:

```tsx
<TextInput className="hover:active:focus:border-blue-500" />
```

## Disabled and Empty

Nativewind supports the `:disabled` and `:empty` pseudo-classes.

| Pseudo-class | Tailwind Modifier | Condition                            |
| ------------ | ----------------- | ------------------------------------ |
| `:disabled`  | `disabled:`       | Component has `disabled={true}` prop |
| `:empty`     | `empty:`          | Component has no children            |

```tsx
import { TextInput } from "react-native";

function MyInput({ disabled }) {
  return (
    <TextInput
      className="border disabled:opacity-50 disabled:bg-gray-200"
      disabled={disabled}
    />
  );
}
```

## Data Attribute Selectors

Nativewind supports `[data-*]` attribute selectors, allowing you to style components based on data attributes. This uses React Native Web's `dataSet` prop.

```tsx
import { View, Text } from "react-native";

function StatusBadge({ active }) {
  return (
    <View
      className="[&[data-active]]:bg-green-500 [&[data-active='false']]:bg-gray-500"
      {...{ dataSet: { active: active } }}
    >
      <Text>Status</Text>
    </View>
  );
}
```

Attribute selectors support both presence checks (`[data-test]`) and value equality checks (`[data-test='value']`).

## Styling Based on Parent State

You can style child components based on the state of a parent using the `group` utility. Add `group/{name}` to the parent and use `group-hover/{name}:`, `group-active/{name}:`, or `group-focus/{name}:` modifiers on children.

```tsx
import { Pressable, Text, View } from "react-native";

function Card() {
  return (
    <Pressable className="group/card">
      <View className="group-active/card:bg-blue-100">
        <Text className="group-active/card:text-blue-700">
          Press the card to see child styles change
        </Text>
      </View>
    </Pressable>
  );
}
```

### How it works

1. The parent component is tagged with `group/{name}` (e.g. `group/item`)
2. Children use `group-{modifier}/{name}:` to react to the parent's state
3. When the parent's state changes (e.g. pressed), child styles update automatically
4. Transitions and animations work with group states

```tsx
<View className="group/item">
  <Text className="group-active/item:text-red-500 transition-colors duration-300">
    This text transitions to red when the parent is pressed
  </Text>
</View>
```

# Style Specificity (https://www.nativewind.dev/docs/core-concepts/style-specificity)

Nativewind employs a specificity model that aligns with CSS rules, augmented to accommodate the inline-style characteristic of React Native and its existing ecosystem.

## Problem Identification

```tsx
function MyText({ style }) {
  return <Text {...props} style={[{ color: 'black' }, style]} />;
}

remapProps(MyText, { className: 'style' })

<MyText style={{ color: 'red' }}>The text will be red on all platforms</MyText>
<MyText className="text-red-500">What color should I render as?</MyText>
```

Different platforms interpret this differently due to variations in style specificity rules, causing inconsistencies.

```tsx
// Native has red text
<Text style={{ color: 'black' }, { color: 'red' }} />

// Web has black text
<Text className="text-red-500" style={{ color: 'black'}} />
```

## Specificity Order

Nativewind has defined the following order of specificity (highest to lowest):

* Styles marked as important (following CSS specificity order)
* Inline & remapped styles (applied in right-to-left order)
* className styles (following CSS specificity order)

## Concept of Remapped Styles

Remapped styles are a novel concept introduced by Nativewind, not present in traditional CSS. They refer to styles translated from a className to a prop, and applied inline. This approach maintains the order of styles, ensuring consistency with existing React Native components.

## Addressing Styling Differences

To address styling discrepancies across platforms, Nativewind allows the use of the !important modifier. This returns the styles to a specificity-based order, facilitating consistency.

## Examples

### Basic components

```tsx
// Basic components
<Text className="text-red-500" style={{ color: 'green' }} /> // green text
<Text className="!text-red-500" style={{ color: 'green' }} /> // red text

// Remapped components (reusing the initial problem example)
<MyText className="text-red-500" /> // Native: red, Web: black
<MyText className="!text-red-500" /> // Both platforms: red

```

# Built on Tailwind CSS (https://www.nativewind.dev/docs/core-concepts/tailwindcss)

Nativewind is built upon the Tailwind CSS style language. As such the core-concepts of Tailwind CSS apply to Nativewind. Recommend you read their guides on:

* [Utility-First Fundamentals](https://tailwindcss.com/docs/utility-first)
* [Reusing Styles](https://tailwindcss.com/docs/reusing-styles)
* [Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)

It is also important to understand that since CSS styles are generated via the Tailwind CLI, the entire Tailwind CSS language & compiler options are available for web.

This documentation only documents whats is universally compatible, but you can always use a platform prefix to apply styles that are only support on web.

# Units (https://www.nativewind.dev/docs/core-concepts/units)

## Polyfilled Units

You can use these units within classes or `tailwind.config.js`.

