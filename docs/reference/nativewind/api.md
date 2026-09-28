# NativeWind — Api



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# cssInterop (https://www.nativewind.dev/docs/api/css-interop)

This function "tags" components so that when its rendered, the runtime will know to resolve the className strings into styles. You should only use this when:

* You have a custom native component
* You are using a third party component that needs the style prop to be resolved
* You are using a third party component that does not pass all its props to its children

## Usage

```tsx
import { cssInterop } from 'nativewind';

// Create a new prop and map it to an existing prop
cssInterop(component, { "new-prop": "existing-prop" });

// Override an existing prop.
cssInterop(component, { "new-prop": true });

// Override an existing prop.
cssInterop(component, {
  "new-prop": {
    target: "existing-prop", // string or boolean
    nativeStyleToProp: {
      "style-attribute": "existing-prop",
    }
    }
  }
});
```

## Examples

Here is the mapping using the core component, `<TextInput />`

```tsx
cssInterop(TextInput, {
  className: {
    target: "style", // map className->style
    nativeStyleToProp: {
      textAlign: true, // extract `textAlign` styles and pass them to the `textAlign` prop
    },
  },
  placeholderClassName: {
    target: false, // Don't pass this as a prop
    nativeStyleToProp: {
      color: "placeholderTextColor", // extract `color` and pass it to the `placeholderTextColor`prop
    },
  },
  selectionClassName: {
    target: false, // Don't pass this as a prop
    nativeStyleToProp: {
      color: "selectionColor", // extract `color` and pass it to the `selectionColor`prop
    },
  },
});
```

# StyleSheet (https://www.nativewind.dev/docs/api/native-wind-style-sheet)

In NativeWind v4, the `StyleSheet` is exported from `react-native-css-interop` (and re-exported from `nativewind`). It provides internal methods used by the build system and runtime.

> NOTE
>
> The `NativeWindStyleSheet` API from v2/v3 (with methods like `setOutput`, `setDimensions`, `setAppearance`) no longer exists in v4. Use `useColorScheme()` for color scheme management instead.

## Color Scheme Management

To set or toggle the color scheme, use the [`useColorScheme()`](https://www.nativewind.dev/docs/api/use-color-scheme) hook:

```tsx
import { useColorScheme } from "nativewind";

function MyComponent() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Text onPress={() => toggleColorScheme()}>
      {`The color scheme is ${colorScheme}`}
    </Text>
  );
}
```

> CAUTION
>
> `setColorScheme` and `toggleColorScheme` require `darkMode: "class"` in your Tailwind config. They will throw an error if `darkMode` is set to `"media"` (the default).

## Internal Methods

The `StyleSheet` object exposes the following methods, primarily used internally by the build system:

| Method                      | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `registerCompiled(options)` | Registers compiled CSS data from the Metro transform |
| `getFlag(name)`             | Retrieves a build flag (e.g. `darkMode` strategy)    |
| `getGlobalStyle(name)`      | Retrieves a registered global style rule             |

These methods are not intended for direct use in application code.

# remapProps (https://www.nativewind.dev/docs/api/remap-props)

Nativewind provides the `remapProps` utility to simplify working with third-party components with multiple "style" props.

```tsx
import { remapProps } from "nativewind";

/**
  ThirdPartyButton is a component with two "style" props, buttonStyle & labelStyle.
  We can use remapProps to create new props that accept Tailwind CSS's classNames.
 */
const CustomizedButton = remapProps(ThirdPartyButton, {
  buttonClass: "buttonStyle",
  labelClass: "labelStyle",
});

<CustomizedButton buttonClass="bg-blue-500" labelClass="text-white" />;
```

`remapProps` can be used with the following options

```tsx
// Create a new prop and map it to an existing prop
remapProps(component, { "new-prop": "existing-prop" });

// Override an existing prop.
remapProps(component, { prop: true });
```

# useColorScheme() (https://www.nativewind.dev/docs/api/use-color-scheme)

useColorScheme() provides access to the devices color scheme.

| Value             | Description                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| colorScheme       | The current device colorScheme                                                                         |
| setColorScheme    | Override the current colorScheme with a different scheme (accepted values are `light`/`dark`/`system`) |
| toggleColorScheme | Toggle the color scheme between `light` and `dark`                                                     |

> CAUTION
>
> `setColorScheme` and `toggleColorScheme` require `darkMode: "class"` in your Tailwind config. They will throw an error if `darkMode` is set to `"media"` (the default). See the [Tailwind CSS dark mode docs](https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually) for setup instructions.

```tsx
import { useColorScheme } from "nativewind";
import { Text } from "react-native";

function MyComponent() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <Text
      onPress={() => setColorScheme(colorScheme === "light" ? "dark" : "light")}
    >
      {`The color scheme is ${colorScheme}`}
    </Text>
  );
}
```

Nativewind v4.2.7 handles the React Native Appearance `unspecified` value internally. Continue using `setColorScheme("system")` with the v4 Nativewind hook to restore system preference; the v5 direct Appearance recipe is a separate API.

# vars() & useUnstableNativeVariable() (https://www.nativewind.dev/docs/api/vars)

## vars()

`vars` is a function that takes a dictionary of CSS variables and returns a style object that can be used in React Native components. This allows you to set CSS variable values from JavaScript and have them flow down the component tree.

```tsx
import { View, Text } from "react-native";
import { vars } from "nativewind";

function ThemedSection({ brandColor }) {
  return (
    <View style={vars({ "--brand-color": brandColor })}>
      <Text className="text-[--brand-color]">Themed text</Text>
    </View>
  );
}
```

Variables set via `vars()` follow standard CSS variable inheritance -- child components can reference variables set by any ancestor. Variables are reactive and update children when values change.

## useUnstableNativeVariable()

> UNSTABLE API
>
> This hook is prefixed with "unstable" because its API may change in future versions.

`useUnstableNativeVariable` reads a CSS variable value from the current variable context. This is useful when you need to access a CSS variable's resolved value directly in JavaScript rather than through a className.

```tsx
import { useUnstableNativeVariable } from "nativewind";

function MyComponent() {
  const brandColor = useUnstableNativeVariable("--brand-color");

  // brandColor is the resolved value, e.g. "red"
  return <ThirdPartyComponent color={brandColor} />;
}
```

The hook is reactive -- if the variable's value changes (e.g. due to a parent re-rendering with different `vars()`), the component will re-render with the new value. It reads from `:root` variables and any variables set by ancestor components via `vars()` or className.

# withNativeWind (https://www.nativewind.dev/docs/api/with-nativewind)

`withNativeWind` is a Metro configuration wrapper that updates your Metro configuration to support Nativewind.

The only required option is `input`, which is the relative path to your `.css` file.

```tsx title=metro.config.js
import { withNativeWind } from "nativewind/metro";

module.exports = withNativeWind(config, {
  input: "<relative path to your .css file>",
});
```

## Options

* `output`: The relative path to the output file. Defaults to `<projectRoot>/node_modules/.cache/nativewind/`
* `projectRoot`: Abolsute path to your project root. Only used to set `output`
* `inlineRem`: The numeric value used to inline the value of `rem` units on native. `false` will disable the behaviour. Defaults to `14`. [More information](https://www.nativewind.dev/docs/tailwind/typography/font-size)
* `configPath`: Relative path to your `tailwind.config` file. Defaults to `tailwind.config`. Recommended you use [`@config`](https://tailwindcss.com/docs/functions-and-directives#config) instead of this option.
* `hotServerOptions`: Options to pass to the hot server. Defaults to `{ port: 8089 }`

### Experimental Options

These options are available under the `experiments` key.

* `inlineAnimations`: Use `react-native-reanimated`'s inline shared values instead of hooks. This greatly improves performance, but has [issues with fast-refresh](https://github.com/software-mansion/react-native-reanimated/pull/5268)

