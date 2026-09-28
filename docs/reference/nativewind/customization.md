# NativeWind — Customization



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Colors (https://www.nativewind.dev/docs/customization/colors)

You can customize your colors in the same manner as Tailwind CSS. Please refer to the [Tailwind CSS documentation](https://tailwindcss.com/docs/customizing-colors) for more information.

## Platform Colors

Unlike the web, which uses a common color palette, native platforms have their own unique system colors which are accessible through [PlatformColor](https://reactnative.dev/docs/platformcolor).

Nativewind allows you to use access PlatformColor via the `platformColor()` utility.

```js
// tailwind.config.js

const { platformSelect, platformColor } = require("nativewind/theme");

module.exports = {
  theme: {
    extend: {
      colors: {
        error: platformSelect({
          // Now you can provide platform specific values
          ios: platformColor("systemRed"),
          android: platformColor("?android:colorError"),
          default: "red",
        }),
      },
    },
  },
};
```

# Configuration (https://www.nativewind.dev/docs/customization/configuration)

Nativewind uses the same `tailwind.config.js` as Tailwind CSS. You can read more about how to configure your project [through the Tailwind CSS documentation](https://tailwindcss.com/docs/configuration).

## Metro configuration

### `input`

**required**

Type: `string`

The path to the entry file for your Tailwind styles

### `projectRoot`

Default: `process.cwd()`

The path to the root of your project

### `outputDir`

Default: `node_modules/.cache/nativewind`

The path to the directory where the generated styles should be written. Should be relative to the `projectRoot`

### `configFile`

Default: `tailwind.config.js`

The path to your Tailwind config file

### `cliCommand`

Default: `node node_modules/tailwind/lib/cli.js`

The command to run the Tailwind CLI

### `browserslist`

Default: `last 1 versions`

The [browserslist used by browserslist & autoprefixer](https://github.com/postcss/autoprefixer)

### `browserslistEnv`

Default: `native`

The [environment used by browserslist & autoprefixer](https://github.com/browserslist/browserslist#configuring-for-different-environments)

### `hotServerOptions`

Default: `{ port: <next-available> }`

The options passed to `ws` for the development hot reloading server.

# Content (https://www.nativewind.dev/docs/customization/content)

Nativewind follows the same `content` rules as Tailwind CSS. Please refer to the [Tailwind CSS documentation](https://tailwindcss.com/docs/content-configuration) for more information and troubleshooting steps.

# Screens (https://www.nativewind.dev/docs/customization/screens)

This documentation page has no guidance yet. Refer to the installation guide and documented APIs rather than inferring support.

# Theme (https://www.nativewind.dev/docs/customization/theme)

Nativewind uses the same theme values as as Tailwind CSS. You can read more about how to configure your project [through the Tailwind CSS documentation](https://tailwindcss.com/docs/theme).

Fully dynamic React Native applications often make use of helper functions such as `Platform.select` and `PixelRatio`. Nativewind exports helpers allowing you to embed these functions into your theme.

## platformSelect

`platformSelect` is the equivalent to [`Platform.select()`](https://reactnative.dev/docs/platform#select).

```js
// tailwind.config.js

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

```ts title=tailwind.config.js
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

### hairlineWidth()

Equivalent of [`StyleSheet.hairlineWidth`](https://reactnative.dev/docs/stylesheet#hairlinewidth)

```ts title=tailwind.config.js
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

```ts title=tailwind.config.js
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

```ts title=tailwind.config.js
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

```ts title=tailwind.config.js
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

```ts title=tailwind.config.js
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
const { getPixelSizeForLayoutSize } = require("nativewind");

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

