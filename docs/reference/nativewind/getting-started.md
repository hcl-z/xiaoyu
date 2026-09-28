# NativeWind — Getting Started



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Editor Setup (https://www.nativewind.dev/docs/getting-started/editor-setup)

Please refer to the [v3 documentation on the Tailwind CSS website](https://v3.tailwindcss.com/docs/editor-setup) for more information.

## Editor Support for Custom ClassName Props

When using `cssInterop` or `remapProps` to create custom className props for third-party components, you may need to configure your editor to recognize these new props for proper IntelliSense and autocomplete.

For detailed information about working with third-party components and creating custom className props, see the [Styling Third-Party Components](https://www.nativewind.dev/docs/guides/third-party-components) guide.

### VS Code Configuration

If you're using VS Code with the Tailwind CSS IntelliSense extension, you can add custom className props to the `tailwindCSS.classAttributes` setting:

```json
{
  (...)
  "tailwindCSS.classAttributes": [
    "class",
    "className",
    "headerClassName"
  ]
}
```

This will enable autocomplete and IntelliSense for your custom className props created with `cssInterop` or `remapProps`.

# Troubleshooting (https://www.nativewind.dev/docs/getting-started/troubleshooting)

> While troubleshooting, always start your application without the cache!
>
> * Expo: `npx expo start --clear`
> * Framework-less React Native: `npx react-native start --reset-cache`

Before troubleshooting Nativewind, it's crucial to ensure that Tailwind CSS itself is functioning correctly. Nativewind uses the Tailwind CLI to compile your styles, so any issues with the Tailwind CLI should be resolved first.

Using the command `npx tailwindcss --input <input.css> --output output.css`, the Tailwind CLI will generate an `output.css` file. **The `<input.css>` should be your project's main CSS file (typically `global.css` or `styles.css`) that contains the Tailwind 3 directives `@tailwind base;`, `@tailwind components;` and `@tailwind utilities;`.**

For example:

```bash
npx tailwindcss --input ./global.css --output output.css
```

If you are troubleshooting a class that is not working, ensure that the CSS rule is present in the `output.css` file. This will help you determine if the issue is with Tailwind compilation or with Nativewind's runtime.

## Verifying Nativewind Installation

Nativewind provides a utility function `verifyInstallation()` designed to help confirm that the package has been correctly installed.

Import the `verifyInstallation` function from the Nativewind package and run it within the scope of a React component. **Do not invoke this function on the global scope**; it should be run within a component.

```tsx
import React from 'react';
import { verifyInstallation } from 'nativewind';

function App() {
    // Ensure to call inside a component, not globally
    verifyInstallation();

    return (
      // Your component JSX here...
    );
}

export default App;
```

## Enabling debug mode

Nativewind supports the `DEBUG` environment variable and will output various debug information while your server is running. **Run this command in your project's root directory where your `package.json` file is located.**

The `<start-command>` should be replaced with your project's actual start command:

* **Expo**: `npx expo start --clear`
* **Framework-less React Native**: `npx react-native start --reset-cache`
* **Next.js**: `npm run dev` or `yarn dev`
* **Other frameworks**: Use your project's standard development start command

Mac / Linux

```bash
DEBUG=nativewind <start-command>
```

Windows

```cmd
set "DEBUG=nativewind" && <start-command>
```

> @react-native-community/cli may create multiple terminal sessions. You will need to ensure all sessions have `DEBUG=nativewind` set.

By itself, this information may or may not be useful to you, but it is extremely useful when reporting issues to the developers on GitHub. You can record the terminal output by redirecting the output to a file.

Mac / Linux

```bash
DEBUG=nativewind script output.log <start-command>
```

Windows

```cmd
set "DEBUG=nativewind" && script output.log <start-command>
```

**Note:** For older Windows versions, use:

```cmd
set "DEBUG=nativewind" && <start-command> > output.log 2>output.log
```

**For PowerShell:**

```powershell
$env:DEBUG="nativewind"; <start-command> *> output.log
```

## Common Issues

### Your cache is loading old data

Always reset your cache before troubleshooting an issue.

### Colors are not working

React Native styling is much more restrictive than the web. This code will work on the web, but not on React Native:

```tsx title=App.tsx
export function App() {
  return (
    <View className="text-red-500">
      <Text>Hello, World!</Text>
    </View>
  );
}
```

The reason is that `<View />` does not accept a `color` style and will not cascade the style! Instead, you must move the color classes to the `<Text />` element.

### Modifiers are not working

Ensure the component you are applying the style to supports both the style and the required props (e.g., `hover:text-white` - does the component support `color` styles and have an `onHover` prop?).

### Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues, it's best to declare all styles explicitly.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color.

### dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different; however, Nativewind treats them as if they are equivalent. Additionally, Nativewind's compiler requires a unit for most numeric values, forcing some styles to use a `px` unit.

### Flex

React Native uses a different base flex definition than the web. This can be fixed by adding `flex-1` to your classes, which forces the platforms to align.

### Flex Direction

React Native uses a different default `flex-direction` than the web. This can be fixed by explicitly setting a `flex-direction`.

# Typescript (https://www.nativewind.dev/docs/getting-started/typescript)

Nativewind extends the React Native types via declaration merging. The simplest method to include the types is to create a new `nativewind-env.d.ts` file and add a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) referencing the types.

```tsx
/// <reference types="nativewind/types" />
```

> CAUTION
>
> Do not call this file:
>
> * `nativewind.d.ts`
> * The same name as a file or folder in the same directory e.g `app.d.ts` when an `/app` folder exists
> * The same name as a folder in `node_modules`, e.g `react.d.ts`
>
> By doing so, your types will not be picked up by the TypeScript compiler.

# Installation (https://www.nativewind.dev/docs/getting-started/installation/frameworkless)

> Nativewind works with both Expo and framework-less React Native projects but Expo provides a more streamlined experience.
>
> **Web**: If you'd like to use Metro to bundle for a website or App Clip and you are **not** using Expo, you will need either Expo's Metro config `@expo/metro-config` or to manually use Tailwind CLI to generate a CSS file.

[Expo](https://www.nativewind.dev/docs/getting-started/installation)
\| [Framework-less](https://www.nativewind.dev/docs/getting-started/installation/frameworkless)
\| [Next.js](https://www.nativewind.dev/docs/getting-started/installation/nextjs)

Before installing Nativewind, you will need to [initialize your project with the React Native Community CLI](https://reactnative.dev/docs/getting-started-without-a-framework).

## Installation with Framework-less React Native

### 1. Install Nativewind

You will need to install `nativewind` and its peer dependencies `tailwindcss`, `react-native-reanimated` and `react-native-safe-area-context`.

npm

```bash
npm install nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
```

yarn

```bash
yarn add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
yarn add --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
```

pnpm

```bash
pnpm add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
pnpm add --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
```

bun

```bash
bun add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
bun add --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
```

Nativewind v4.2.7 supports Reanimated 3 and 4. Choose a version compatible with your React Native release. Reanimated 4 also requires a compatible `react-native-worklets`; do not add Worklets to a Reanimated 3 setup. Keep the Nativewind Babel preset below.

Run `pod-install` to finish installation of `react-native-reanimated`

```bash
npx pod-install
```

### 2. Setup Tailwind CSS

Run `npx tailwindcss init` to create a `tailwind.config.js` file

Add the paths to all of your component files in your tailwind.config.js file.

```js title="tailwind.config.js"
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create a CSS file and add the Tailwind directives.

```css title="global.css"
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> From here onwards, replace `./global.css` with the relative path to the CSS file you just created.

### 3. Add the Babel preset

```diff title="babel.config.js"
module.exports = {
- presets: ['<existing presets>'],
+ presets: ['<existing presets>', 'nativewind/babel'],
};
```

### 4. Modify your metro.config.js

Create a `metro.config.js` file in the root of your project if you don't already have one, then add the following configuration:

```js title="metro.config.js"
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = mergeConfig(getDefaultConfig(__dirname), {
  /* your config */
});

module.exports = withNativeWind(config, { input: "./global.css" });
```

### 5. Import your CSS file

```js title="App.js"
import "./global.css"

export default App() {
  /* Your App */
}
```

### 6. TypeScript setup (optional)

If you're using TypeScript in your project, you'll need to set up the type definitions. Nativewind extends the React Native types via declaration merging. The simplest method to include the types is to create a new `nativewind-env.d.ts` file and add a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) referencing the types.

```tsx
/// <reference types="nativewind/types" />
```

> CAUTION
>
> Do not call this file:
>
> * `nativewind.d.ts`
> * The same name as a file or folder in the same directory e.g `app.d.ts` when an `/app` folder exists
> * The same name as a folder in `node_modules`, e.g `react.d.ts`
>
> By doing so, your types will not be picked up by the TypeScript compiler.

## Try it out!

Create a simple component to test your Nativewind setup:

```tsx title="App.tsx"
import "./global.css"
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
    </View>
  );
}
```

This example shows:

* Using `className` prop to style components
* Tailwind utility classes like `flex-1`, `items-center`, `justify-center`
* Color utilities like `bg-white`, `text-blue-500`
* Typography utilities like `text-xl`, `font-bold`

If you see the styled text centered on a white background, Nativewind is working correctly!

## Additional Setup Guides

* [Editor Setup](https://www.nativewind.dev/docs/getting-started/installation/editor-setup) - Learn how to set up your editor to use Nativewind
* [Other Bundlers](https://www.nativewind.dev/docs/guides/other-bundlers) - Learn how to use Nativewind with other bundlers

# Installation (https://www.nativewind.dev/docs/getting-started/installation)

> Nativewind works with both Expo and framework-less React Native projects but Expo provides a more streamlined experience.
>
> **Web**: If you'd like to use Metro to bundle for a website or App Clip and you are **not** using Expo, you will need either Expo's Metro config `@expo/metro-config` or to manually use Tailwind CLI to generate a CSS file.

[Expo](https://www.nativewind.dev/docs/getting-started/installation/)
\| [Framework-less](https://www.nativewind.dev/docs/getting-started/installation/frameworkless)
\| [Next.js](https://www.nativewind.dev/docs/getting-started/installation/nextjs)

> If you'd like to skip manual setup and use Nativewind with Expo, you can use the following command to initialize a new Expo project with Nativewind and Tailwind CSS.
>
> npm
>
> ```bash
> npx rn-new --nativewind
> ```
>
> yarn
>
> ```bash
> npx rn-new --nativewind --yarn
> ```
>
> pnpm
>
> ```bash
> pnpx rn-new --nativewind
> ```
>
> bun
>
> ```bash
> bunx rn-new --nativewind
> ```

## Nativewind v4.2.7

Nativewind v4.2.7 adds Expo SDK 57 support and includes react-native-css-interop 0.2.7. It keeps the Tailwind CSS 3 configuration, Nativewind Babel preset and `withNativeWind(config, { input })` integration. Upgrading within v4 does not require a v5 migration.

For an existing v4 app, update with your package manager, for example `npm install nativewind@4.2.7`. Keep the native package versions compatible with your Expo SDK. On Expo 57, install `react-native-worklets` alongside Reanimated 4 with `npx expo install react-native-reanimated react-native-worklets react-native-safe-area-context`. Older projects using Reanimated 3 should retain their compatible setup instead of adding Worklets just for this patch.

Restart Metro after upgrading. Rebuild the native app if you change native dependencies. Check animations and system appearance on each supported platform.

Looking for the v5 release candidate? Use the separate [v5 installation guide](https://www.nativewind.dev/v5/getting-started/installation) or [migration guide](https://www.nativewind.dev/v5/guides/migrate-from-v4).

## Installation with Expo

### 1. Install Nativewind

You will need to install `nativewind` and its peer dependencies `tailwindcss`, `react-native-reanimated` and `react-native-safe-area-context`.

npm

```bash
npm install nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

yarn

```bash
yarn add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
yarn add --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

pnpm

```bash
pnpm add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
pnpm add --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

bun

```bash
bun add nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
bun add --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

expo

```bash
npx expo install nativewind@4.2.7 react-native-reanimated react-native-safe-area-context
npx expo install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo
```

### 2. Setup Tailwind CSS

Run `npx tailwindcss init` to create a `tailwind.config.js` file

Add the paths to all of your component files in your tailwind.config.js file.

```js title="tailwind.config.js"
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create a CSS file and add the Tailwind directives.

```css title="global.css"
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> From here onwards, replace `./global.css` with the relative path to the CSS file you just created.

### 3. Add the Babel preset

```js title="babel.config.js"
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### 4. Create or modify your metro.config.js

Create a `metro.config.js` file in the root of your project if you don't already have one, then add the following configuration:

```js title="metro.config.js"
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
```

### 5. Import your CSS file

```js title="App.js"
import "./global.css"

export default App() {
  /* Your App */
}
```

### 6. Modify your `app.json`

Switch the bundler to use the [Metro bundler](https://docs.expo.dev/guides/customizing-metro/#web-support)

```js
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 7. TypeScript setup (optional)

If you're using TypeScript in your project, you'll need to set up the type definitions. Nativewind extends the React Native types via declaration merging. The simplest method to include the types is to create a new `nativewind-env.d.ts` file and add a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) referencing the types.

```tsx
/// <reference types="nativewind/types" />
```

> CAUTION
>
> Do not call this file:
>
> * `nativewind.d.ts`
> * The same name as a file or folder in the same directory e.g `app.d.ts` when an `/app` folder exists
> * The same name as a folder in `node_modules`, e.g `react.d.ts`
>
> By doing so, your types will not be picked up by the TypeScript compiler.

## Try it out!

Create a simple component to test your Nativewind setup:

```tsx title="App.tsx"
import "./global.css"
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
    </View>
  );
}
```

This example shows:

* Using `className` prop to style components
* Tailwind utility classes like `flex-1`, `items-center`, `justify-center`
* Color utilities like `bg-white`, `text-blue-500`
* Typography utilities like `text-xl`, `font-bold`

If you see the styled text centered on a white background, Nativewind is working correctly!

## Additional Setup Guides

* [Editor Setup](https://www.nativewind.dev/docs/getting-started/editor-setup) - Learn how to set up your editor to use Nativewind
* [Other Bundlers](https://www.nativewind.dev/docs/guides/other-bundlers) - Learn how to use Nativewind with other bundlers

# Installation (https://www.nativewind.dev/docs/getting-started/installation/nextjs)

> Nativewind works with both Expo and framework-less React Native projects but Expo provides a more streamlined experience.
>
> **Web**: If you'd like to use Metro to bundle for a website or App Clip and you are **not** using Expo, you will need either Expo's Metro config `@expo/metro-config` or to manually use Tailwind CLI to generate a CSS file.

[Expo](https://www.nativewind.dev/docs/getting-started/installation)
\| [Framework-less](https://www.nativewind.dev/docs/getting-started/installation/frameworkless)
\| [Next.js](https://www.nativewind.dev/docs/getting-started/installation/nextjs)

## Installation with Next.js

Nativewind can be used in a Next.js project that is already configured to use Expo or framework-less React Native Web.

Setting up a new Next.js project to use React Native Web is out of scope for these instructions.

> Nativewind will only work with the `/pages` router or on `"use client"` routes. RSC support is in progress.

### 1. Setup Tailwind CSS

Simply configure Next.js as per [the Tailwind CSS Next.js setup guide](https://v3.tailwindcss.com/docs/guides/nextjs)

### 2. Add the Nativewind preset

```diff title="tailwind.config.js"

module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
+ presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
}
```

### 3. Update import source

Nativewind requires the `jsxImportSource` to be set to `nativewind`. The option to configure this depends on how you are compiling your Next.js project.

swc

Next.js uses a `jsconfig.json`/`tsconfig.json` file to configure the `jsxImportSource`.

```json title="tsconfig.json"
{
  "compilerOptions": {
    "jsxImportSource": "nativewind"
  }
}
```

babel

```diff title="babel.config.js"
module.exports = {
  presets: ["next/babel"],
+  plugins: [
+    [
+      "@babel/plugin-transform-react-jsx",
+      {
+        runtime: "automatic",
+        importSource: "nativewind",
+      },
+    ],
+  ],
};

```

### 4. Transpile Nativewind

```diff title="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
+  transpilePackages: ["nativewind", "react-native-css-interop"],
}
```

## Common issues

### Errors about package imports.

```
import typeof AccessibilityInfo from './Libraries/Components/AccessibilityInfo/AccessibilityInfo';
^^^^^^

SyntaxError: Cannot use import statement outside a module
```

This signals that you have incorrectly setup React Native Web and/or a dependency needs to be added to `transpilePackages`. This is out of scope for Nativewind.

### Styles are not being applied

A common issue with Next.js is your styles are imported, but are being overridden by another StyleSheet due to the stylesheet import order.

A simple fix is simply make the Tailwind styles a higher specificity.

```diff title=tailwind.config.json
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  plugins: [require('nativewind/tailwind/css')],
+ important: 'html',
  theme: {
    extend: {},
  },
}
```

## Additional Setup Guides

* [Using with Monorepos](https://www.nativewind.dev/docs/getting-started/installation/using-with-monorepos) - Learn how to set up Nativewind in monorepo environments like NX
* [Other Bundlers](https://www.nativewind.dev/docs/guides/other-bundlers) - Learn how to use Nativewind with other bundlers

