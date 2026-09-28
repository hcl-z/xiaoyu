# NativeWind — Guides



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Writing Custom Components (https://www.nativewind.dev/docs/guides/custom-components)

> This guide is about writing your own components. If you are looking for a guide on how to use Nativewind with third-party components, see the [third-party components](https://www.nativewind.dev/docs/guides/third-party-components) guide.
>
> Unless you are styling a custom native component, you should never have to use `cssInterop` or `remapProps` when writing your own components. These are only used when working with third-party components.

## Your first component

Nativewind works by passing class names to components. This is the same pattern as Tailwind CSS, which uses utility classes to style elements.

To create a component with default styles, simply merge the className string.

```tsx
function MyComponent({ className }) {
  const defaultStyles = "text-black dark:text-white";
  return <Text className={`${defaultStyles} ${className}`} />;
}

<MyComponent className="font-bold" />;
```

You can expand this pattern to create more complex components. For example, you can create a `Button` component with different variants.

```tsx
const variantStyles = {
  default: "rounded",
  primary: "bg-blue-500 text-white",
  secondary: "bg-white-500 text-black",
};

function MyComponent({ variant, className, ...props }) {
  return (
    <Text
      className={`
        ${variantStyles.default}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props }
    />
  );
}
```

Creating your own variants can quickly become complex. We recommend using a class name management library to simplify the process.

* [tailwind-variants](https://www.tailwind-variants.org/)
* [cva](https://cva.style/docs)
* [tw-classed](https://tw-classed.vercel.app)
* [clsx](https://www.npmjs.com/package/clsx)
* [classnames](https://www.npmjs.com/package/classnames)

## Merging with inline styles

Nativewind will automatically merge with inline-styles. [Read more about style specificity](https://www.nativewind.dev/docs/core-concepts/style-specificity) documentation.

```tsx
<Text className="text-white" style={{ color: "black" }} /> // Will be black
```

## Handling components with multiple style props

Custom components can have multiple style props. For example, a `Button` component may have an `outerClassName` and an `innerClassName`.

```tsx title=MyComponent.tsx
function MyComponent({ className, textClassName }) {
  return (
    <View className={className}>
      <Text className={textClassName}>Hello, Nativewind!</Text>
    </View>
  );
}
```

# Custom Fonts (https://www.nativewind.dev/docs/guides/custom-fonts)

How to load and use custom fonts with Nativewind v4 and Expo

React Native handles fonts differently from the web. There is no `@font-face`, no automatic font discovery, and no fallback font stacks. Every font weight is a separate file, and the file name matters. This guide walks through the full setup.

> A complete working example is available at [nativewind/custom-fonts-example-v4](https://github.com/nativewind/custom-fonts-example-v4).

## Prerequisites

* An Expo project with Nativewind v4 installed
* A custom font you want to use (this guide uses [Inter](https://rsms.me/inter/))

## Step 1: Choose your font files

**Use OTF or TTF format.** OTF files render slightly better and have a smaller file size. Either format works across iOS, Android, and web.

**Variable fonts do not work on React Native.** You must download individual static weight files. For Inter, that means separate files for Regular, Bold, Italic, Medium, etc.

Download the static font files from your font's release page. For Inter, grab the OTF files from the [GitHub releases](https://github.com/rsms/inter/releases).

## Step 2: Name files correctly

Place font files in your project, for example `assets/fonts/`:

```
assets/
  fonts/
    Inter-Regular.otf
    Inter-Bold.otf
    Inter-Italic.otf
    Inter-BoldItalic.otf
    Inter-Medium.otf
    Inter-SemiBold.otf
```

**The file name must match the PostScript name of the font.** iOS uses the PostScript name to look up fonts at runtime. If the names don't match, the font silently fails to load on iOS while appearing to work on Android.

You can check a font's PostScript name by opening it in Font Book (macOS) or using a tool like [fontdrop.info](https://fontdrop.info).

## Step 3: Load fonts with expo-font

The simplest approach is to use the `expo-font` config plugin in `app.json`:

```bash
bun add expo-font
```

```json title="app.json"
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/Inter-Regular.otf",
            "./assets/fonts/Inter-Bold.otf",
            "./assets/fonts/Inter-Italic.otf",
            "./assets/fonts/Inter-BoldItalic.otf",
            "./assets/fonts/Inter-Medium.otf",
            "./assets/fonts/Inter-SemiBold.otf"
          ]
        }
      ]
    ]
  }
}
```

Alternatively, load fonts at runtime with the `useFonts` hook:

```tsx title="App.tsx"
import { useFonts } from "expo-font";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.otf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.otf"),
  });

  if (!fontsLoaded) return null;

  return <>{/* your app */}</>;
}
```

The `app.json` approach is preferred because fonts are available immediately without a loading state.

## Step 4: Verify with inline styles

Before touching your Tailwind config, confirm the fonts actually loaded:

```tsx
<Text style={{ fontFamily: "Inter-Regular" }}>
  This should render in Inter
</Text>
```

If this does not work, the issue is with font loading, not with Nativewind. Check your file names and `app.json` config.

## Step 5: Add to Tailwind config

Map each font to a utility class in `tailwind.config.js`:

```js title="tailwind.config.js"
module.exports = {
  content: ["./App.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter-Regular"],
        "inter-bold": ["Inter-Bold"],
        "inter-italic": ["Inter-Italic"],
        "inter-bold-italic": ["Inter-BoldItalic"],
        "inter-medium": ["Inter-Medium"],
        "inter-semibold": ["Inter-SemiBold"],
      },
    },
  },
  plugins: [],
};
```

> React Native does not support fallback fonts. If you provide an array with multiple fonts, only the first one is used.

## Step 6: Use in components

```tsx
<Text className="font-inter">Regular text</Text>
<Text className="font-inter-bold">Bold text</Text>
<Text className="font-inter-medium">Medium text</Text>
<Text className="font-inter-semibold">SemiBold text</Text>
<Text className="font-inter-italic">Italic text</Text>
```

## Common pitfalls

| Problem                                   | Cause                                           | Fix                                                   |
| ----------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Font works on Android but not iOS         | File name doesn't match PostScript name         | Rename the file to match exactly                      |
| Font doesn't render at all                | Font not loaded by expo-font                    | Check `app.json` plugin config or `useFonts` hook     |
| Using `font-bold` doesn't make Inter bold | `font-bold` sets `fontWeight`, not `fontFamily` | Use `font-inter-bold` to set the bold font family     |
| Variable font doesn't work                | React Native doesn't support variable fonts     | Download static weight files instead                  |
| Font renders as system default            | PostScript name mismatch                        | Open font in Font Book and verify the PostScript name |

## Platform-specific fonts

If you need different fonts per platform, use the `platformSelect` helper:

```js title="tailwind.config.js"
const { platformSelect } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: platformSelect({
          ios: "Inter-Bold",
          android: "Inter-Bold",
          default: "ui-sans-serif",
        }),
      },
    },
  },
};
```

# Other Bundlers (https://www.nativewind.dev/docs/guides/other-bundlers)

Nativewind officially supports Metro bundler, which is the default bundler for React Native. We also provide installation instructions for Next.js (which uses Webpack and Turbopack) as it's a popular choice for React Native Web applications.

To use Nativewind with any bundler, three key conditions must be met:

1. Tailwind CSS is setup with the Nativewind preset
2. React Native is setup and you are using React Native Web >=0.19
3. The JSX runtime is changed to `'automatic'` and `jsxImportSource` set to `'nativewind'`

## Alternative Bundlers

While Nativewind officially supports Metro, there are community-driven solutions for using Nativewind with other bundlers:

### OneJS

[OneJS](https://onestack.dev/) provides a starter template for using Nativewind with Vite. This integration is currently in alpha, and the team welcomes feedback and contributions.

### Re.Pack

[Re.Pack](https://github.com/callstack/repack) by Callstack is a Webpack-based toolkit for building React Native applications. It provides an alternative to Metro bundler and can be configured to work with Nativewind.

For more information about troubleshooting Nativewind setup, please refer to our [Troubleshooting Guide](https://www.nativewind.dev/docs/getting-started/troubleshooting).

# Themes (https://www.nativewind.dev/docs/guides/themes)

As Nativewind uses Tailwind CLI, it supports all the theming options Tailwind CSS does. Read the Tailwind CSS docs on each className to learn more about the possible theming values.

## Dynamic themes

To transition from a static theme to a dynamic one in Nativewind, utilize [CSS Variables as colors](https://tailwindcss.com/docs/customizing-colors#using-css-variables). This approach ensures flexibility and adaptability in theme application, catering to user preferences.

```js title="tailwind.config.js"
module.exports = {
  theme: {
    colors: {
      // Create a custom color that uses a CSS custom value
      primary: "rgb(var(--color-values) / <alpha-value>)",
    },
  },
  plugins: [
    // Set a default value on the `:root` element
    ({ addBase }) =>
      addBase({
        ":root": {
          "--color-values": "255 0 0",
          "--color-rgb": "rgb(255 0 0)",
        },
      }),
  ],
};
```

```tsx title="App.tsx"
import { vars } from 'nativewind'

const userTheme = vars({
  '--color-values': '0 255 0',
  '--color-rgb': 'rbg(0 0 255)'
});

export default App() {
  return (
    <View>
      <Text className="text-primary">Access as a theme value</Text>
      <Text className="text-[--color-rgb]">Or the variable directly</Text>

      {/* Variables can be changed inline */}
      <View style={userTheme}>
        <Text className="text-primary">I am now green!</Text>
        <Text className="text-[--color-rgb]">I am now blue!</Text>
      </View>
    </View>
  )
}
```

## Switching themes

Nativewind is unopinionated on how you implement your theming. This is an example implementation that supports two themes with both a light/dark mode.

```tsx title="App.jsx"
import { vars, useColorScheme } from 'nativewind'

const themes = {
  brand: {
    'light': vars({
      '--color-primary': 'black',
      '--color-secondary': 'white'
    }),
    'dark': vars({
      '--color-primary': 'white',
      '--color-secondary': 'dark'
    })
  },
  christmas: {
    'light': vars({
      '--color-primary': 'red',
      '--color-secondary': 'green'
    }),
    'dark': vars({
      '--color-primary': 'green',
      '--color-secondary': 'red'
    })
  }
}

function Theme(props) {
  const { colorScheme } = useColorScheme()
  return (
    <View style={themes[props.name][colorScheme]}>
      {props.children}
    </View>
  )
}

export default App() {
  return (
    <Theme name="brand">
      <View className="text-primary">{/* rgba(0, 0, 0, 1) */}>
      <Theme name="christmas">
        <View className="text-primary">{/* rgba(255, 0, 0, 1) */}>
      </Theme>
    </Theme>
  )
}
```

## Retrieving theme values

### Accessing default colors

If you need the default color values at runtime, you can import them directly from `tailwindcss`

retrieve them directly from `tailwindcss/colors`

```tsx
import colors from "tailwindcss/colors";

export function MyActivityIndicator(props) {
  return <ActivityIndicator size="small" color={colors.blue.500} {...props} />;
}
```

### Access theme values

If you use custom theme values, extract them to a file that is shared with your code and your `tailwind.config.js`. [Please read the Tailwind CSS documentation for more information](https://tailwindcss.com/docs/configuration#referencing-in-java-script).

```tsx title="colors.ts"
module.exports = {
  tahiti: {
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
  },
};
```

```ts title="tailwind.config.js"
const colors = require("./colors");

module.exports = {
  theme: {
    extend: {
      colors,
    },
  },
};
```

```tsx title="MyActivityIndicator.js"
import colors from "./colors";

export function MyActivityIndicator(props) {
  return <ActivityIndicator color={colors.tahiti.500} {...props} />;
}
```

## Platform specific theming

### platformSelect

platformSelect is the equivalent to [`Platform.select()`](https://reactnative.dev/docs/platform#select)

```js title="tailwind.config.js"
const { platformSelect } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      colors: {
        error: platformSelect({
          ios: "red",
          android: "blue",
          default: "green",
        }),
      },
    },
  },
};
```

### platformColor()

Equivalent of [`PlatformColor`](https://reactnative.dev/docs/platformcolor). Typically used with `platformSelect`.

```ts title="tailwind.config.js"
const { platformColor } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      colors: {
        platformRed: platformSelect({
          android: platformColor("systemRed"),
          web: "red",
        }),
      },
    },
  },
};
```

## Device specific theming

### hairlineWidth()

Equivalent of [`StyleSheet.hairlineWidth`](https://reactnative.dev/docs/stylesheet#hairlinewidth)

```ts title="tailwind.config.js"
const { hairlineWidth } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
};
```

### pixelRatio()

Equivalent of [`PixelRatio.get()`](https://reactnative.dev/docs/pixelratio#get). If a number is provided it returns `PixelRatio.get() * <value>`, otherwise it returns the PixelRatio value.

```ts title="tailwind.config.js"
const { pixelRatio } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      borderWidth: {
        number: pixelRatio(2),
      },
    },
  },
};
```

### pixelRatioSelect()

A helper function to use [`PixelRatio.get()`](https://reactnative.dev/docs/pixelratio#get) in a conditional statement, similar to `Platform.select`.

```ts title="tailwind.config.js"
const { pixelRatio, hairlineWidth } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      borderWidth: pixelRatioSelect({
        2: 1,
        default: hairlineWidth(),
      }),
    },
  },
};
```

### fontScale()

Equivalent of [`PixelRatio.getFontScale()`](https://reactnative.dev/docs/pixelratio#getFontScale). If a number is provided it returns `PixelRatio.getFontScale() * <value>`, otherwise it returns the `PixelRatio.getFontScale()` value.

```ts title="tailwind.config.js"
const { fontScale } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      fontSize: {
        custom: fontScale(2),
      },
    },
  },
};
```

### fontScaleSelect()

A helper function to use [`PixelRatio.getFontScale()`](https://reactnative.dev/docs/pixelratio#getFontScale) in a conditional statement, similar to `Platform.select`.

```ts title="tailwind.config.js"
const { fontScaleSelect, hairlineWidth } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      fontSize: {
        custom: fontScaleSelect({
          2: 14,
          default: 16,
        }),
      },
    },
  },
};
```

### getPixelSizeForLayoutSize()

Equivalent of `PixelRatio.getPixelSizeForLayoutSize()`

```js title=tailwind.config.js
const { getPixelSizeForLayoutSize } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      size: {
        custom: getPixelSizeForLayoutSize(2),
      },
    },
  },
};
```

### roundToNearestPixel()

Equivalent of `PixelRatio.roundToNearestPixel()`

```ts title=tailwind.config.js
const { roundToNearestPixel } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      size: {
        custom: roundToNearestPixel(8.4)
      },
    },
  },
});
```

# Styling Third-Party Components (https://www.nativewind.dev/docs/guides/third-party-components)

A third-party component is a component that is a dependency of your application and not a core React Native component. Nativewind works by passing the `className` prop to the core React Native components. Unfortunately, its not always obvious what third-party components implement this behavior without checking their source code.

This is an example of a 3rd party component that does not pass the `className` prop down:

```tsx
// ❌ This component will not work with Nativewind
// This component is 'picking' the props.
// Any props that are not explicitly defined will not be passed down
function ThirdPartyComponent({ style }) {
  return <View style={style} />;
}

// ✅ This component will work with Nativewind
function ThirdPartyComponent({ style, ...props }) {
  return <View style={style} {...props} />;
}
```

## Improving 3rd party components

If you encounter a 3rd party component 'picks' its props, you should consider submitting a pull request to modify the component so it passes all props down. Components that 'pick' their props can be very limiting, and not just for Nativewind! React Native often adds new APIs and 'picking' props prevents you from using these new features.

```tsx
function ThirdPartyComponent({ style }) {
  return <View style={style} />;
}

// aria-label was added in 0.71, but this component will not work with it!
<ThirdPartyComponent aria-label="My Label" />;
```

## Handling components with multiple style props

Some components will pass the `className` prop down, but they may also have multiple style props. For example, React Native's `<FlatList />` component has a `style` and `contentContainerStyle` prop. The `remapProps` function can be used to create new `className` props for these components.

```tsx
// This component has two 'style' props
function ThirdPartyComponent({ style, contentContainerStyle, ...props }) {
  return (
    <FlatList
      style={style}
      contentContainerStyle={contentContainerStyle}
      {...props}
    />
  );
}

// Call this once at the entry point of your app
remapProps(ThirdPartyComponent, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

// Now you can use the component with Nativewind
<ThirdPartyComponent className="p-5" contentContainerClassName="p-2" />;
```

> Nativewind's style objects are more complex than the objected created `StyleSheet.create`. To not break third-party components, `remapProps` will pass a special object to the target prop. To the third-party component this will appear as an empty object.

## Handling components with style attribute props

Some components may require style attributes to be passed as props (for example, React Native's `<StatusBar />` component accepts a `backgroundColor` prop), or they may access the `style` prop directly.

```tsx
/*
 * This component will not work as expected with Nativewind
 *   - borderColor will not work as it is a prop
 *   - backgroundColor will not work as it is based on the style.color value
 */
function ThirdPartyComponent({ borderColor, style, ...props }) {
  // The background color is based on the style prop
  const backgroundColor = style.color === "white" ? "black" : "white";
  return (
    <View
      style={{
        ...style,
        borderColor,
        backgroundColor,
      }}
    />
  );
}
```

To support these components, you can use the [`cssInterop`](https://www.nativewind.dev/docs/api/css-interop) function. You can think of `cssInterop` as a "className termination". It a marker that Nativewind needs to convert the `className` props into style objects.

> CAUTION
>
> Enabling the `cssInterop` for a component comes at a performance cost. Nativewind will need to resolve the styles, add event handlers, inject context, etc.

## Handling multiple props with similar properties

Sometimes a component will have multiple props that are similar.

```tsx
function ThirdPartyComponent({ labelColor, inputColor, ...props }) {
  return (
    <>
      <Text style={color: labelColor}>Label</Text>
      <TextInput style={color: labelColor} />
    </>
  );
}
```

You could creating a new mapping for each props, but it can be cumbersome to manage multiple props with className management libraries

```tsx
// This is possible
cssInterop(ThirdPartyComponent, {
  labelColorClassName: {
    target: false
    nativeStyleToProps: { color: 'labelColor' }
  }
  inputColorClassName: {
    target: false
    nativeStyleToProps: { color: 'inputColor' }
  }
})

function Wrapper() {
  // Need to create a new className for each prop
  const labelStyle = cva('color-black')
  const inputStyle = cva('color-black')

  return (
    <ThirdPartyComponent
      labelColorClassName={labelStyle}
      inputColorClassName={inputStyle}
    />
  )
}
```

Instead, you can use the dynamic mapping modifier to move props.

```tsx
cssInterop(ThirdPartyComponent, {
  className: "style",
});

function Wrapper() {
  // Need to create a new className for each prop
  const style = cva("{}-[inputColor]:color-black {}-[labelColor]:color-black");

  return <ThirdPartyComponent className={style} />;
}
```

## Dynamic mapping modifier

The dynamic mapping modifier allows you to move props from one prop to another. This is useful when you have multiple props that are similar, or you want to manage the styles in a single prop.

There are two ways to use the dynamic mapping modifier:

* `{}-[<propName>]`: This will move the values the style to the `propName` prop. If a className sets multiple properties, the last property will be used.
* `{}-[<propName>]:style-property`: This will move the `propName` prop to the `style-property` of the `className` prop, but only for the specified `style-property`

Both `propName` and `style-property` can be written using dot notation to access nested properties.

```tsx
//This class
{}-[screenOptions.tabBarTintColor]/color:color-red-500
// Will output
{ screenOptions: { tabBarTintColor: 'color-red-500' } }
```

## TypeScript

Both `remapProps` and `cssInterop` will return a typed version of your component. However, you can globally defined the types in a new declaration file.

```tsx title=custom-components-env.d.ts
declare module "<3rd party package>" {
  interface 3rdPartyComponentProps {
    customClassName?: string;
  }
}
```

**Example**

Setting global types requires in-depth knowledge of TypeScript. Your interface declaration needs to **exactly match** the 3rd party declaration (including `extends` and generics).

For example, Nativewind uses the follow types for React Native's `<FlatList />`, which uses multiple interfaces for its props, across multiple packages.

```tsx title=custom-components-env.d.ts
import {
  ScrollViewProps,
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
  VirtualizedListProps,
} from "react-native";

declare module "@react-native/virtualized-lists" {
  export interface VirtualizedListWithoutRenderItemProps<ItemT>
    extends ScrollViewProps {
    ListFooterComponentClassName?: string;
    ListHeaderComponentClassName?: string;
  }
}

declare module "react-native" {
  interface ScrollViewProps
    extends ViewProps,
      ScrollViewPropsIOS,
      ScrollViewPropsAndroid,
      Touchable {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
    columnWrapperClassName?: string;
  }
  interface ViewProps {
    className?: string;
  }
}
```

# Using with Monorepos (https://www.nativewind.dev/docs/guides/using-with-monorepos)

Learn how to set up Nativewind in monorepo environments like NX

Nativewind can be used in an Nx Monorepo that is already configured to use Expo and the corresponding plugin [@nx/expo](https://nx.dev/nx-api/expo)

## NX Monorepo Setup

When working with Nativewind in an NX monorepo, there are some specific configurations needed to ensure proper integration. The main challenge is correctly configuring the Metro bundler to work with both NX and Nativewind.

### Prerequisites

Simply configure your Expo project in Nx as per [the Expo setup guide](https://www.nativewind.dev/docs/getting-started/installation)

> Skip the `metro.config.js` setup as we will address this part here.

### Modify your metro.config.js

Add the Nativewind plugin to your `metro.config.js` using a promise chain as shown below:

```js title="metro.config.js"
const { withNativeWind } = require("nativewind/metro");

// ... existing Nx configuration

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // ... existing Nx config
}).then((config) => withNativeWind(config, { input: "./global.css" }));
```

## Additional Resources

For more complex monorepo setups or specific issues, refer to:

* [NX documentation for React Native](https://nx.dev/recipes/react/react-native)
* [NX documentation for Expo](https://nx.dev/nx-api/expo)
* [Expo documentation for monorepos](https://docs.expo.dev/guides/monorepos/)

