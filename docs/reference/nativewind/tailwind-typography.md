# NativeWind — Tailwind Typography



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Content (https://www.nativewind.dev/docs/tailwind/typography/content)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/content)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `content-none` | 🌐 Web only |

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

# Font Family (https://www.nativewind.dev/docs/tailwind/typography/font-family)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-family)

React Native loads fonts differently between iOS and Android. We recommend following <https://github.com/jsamr/react-native-font-demo> to use fonts that work consistently on all platforms and allow you to use Tailwind CSS as expected.

### Differences on Native

React Native does not support fallback fonts. If an array of fonts are provided, Nativewind will only use the first font.

### Adding fonts to your theme

> Nativewind will not load/link fonts into your app. If you have any issues with the font family or weights not rendering, please first verify it works with inline styles.

```tsx title="tailwind.config.js"
import { platformSelect } from "nativewind/theme";

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        example: ["ExampleFontFamily"],
        system: platformSelect({
          ios: "Georgia",
          android: "sans-serif",
          default: "ui-sans-serif",
        }),
      },
    },
  },
};
```

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `font-sans`  | ✅ Supported |
| `font-serif` | ✅ Supported |
| `font-mono`  | ✅ Supported |
| `font-[n]`   | ✅ Supported |
| `font-{n}`   | ✅ Supported |

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

# Font Size (https://www.nativewind.dev/docs/tailwind/typography/font-size)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-size)

## `rem` scaling

Tailwind CSS uses `rem` units for font sizes by default. To improve performance Nativewind will inline `rem` values on all platforms, except for Web. Nativewind uses the following `rem` for each platform

* **Web**: `16px`
* **All other platforms**: `14px` (matches React Native's default Text size)

If you need dynamically scaling text for a section of your app, we recommend using a CSS variable.

```tsx title="tailwind.config.js"
module.exports = {
  theme: {
    extend: {
      fontSize: {
        dynamic: "var(--font-size-dynamic)",
      },
    },
  },
};
```

### Scaling text based upon screen width

A common use case for dynamically scaling text is to scale text based upon the screen width. You can do this by using CSS variables and media queries.

> Nativewind currently does not support media queries on `:root`, so you'll need to use a class.

```css title="global.css"
@media (min-width: 640px) {
  .text-root {
    --font-size-dynamic: 16px;
  }
}

@media (min-width: 768px) {
  .text-root {
    --font-size-dynamic: 18px;
  }
}
```

```tsx title="App.tsx"
export default App() {
  return (
    <Text className="text-root">
      <Text className="text-[--font-size-dynamic]">I scale with screen width</Text>
    </Text>
  )
}
```

### Changing the default inlined `rem` value

You can the change the default `rem` value by setting `rem` in your `metro.config.js`

```tsx title="metro.config.js"
module.exports = withNativeWind({
  input: "./global.css"
  inlineRem: 16,
});
```

### Disabling `inlineRem`

You can disable the inlining behaviour by passing `false`

```tsx title="metro.config.js"
module.exports = withNativeWind({
  inline: "./global.css"
  inlineRem: false,
});
```

You will then need to specify your own `rem` value in your CSS.

```css title="global.css"
:root {
  font-size: 16px;
}
```

## Compatibility

| Class       | Support     |
| ----------- | ----------- |
| `text-{n}`  | ✅ Supported |
| `text-[n]`  | ✅ Supported |
| `text-base` | ✅ Supported |

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

# Font Smoothing (https://www.nativewind.dev/docs/tailwind/typography/font-smoothing)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-smoothing)

## Compatibility

| Class                  | Support     |
| ---------------------- | ----------- |
| `antialiased`          | ✅ Supported |
| `subpixel-antialiased` | ✅ Supported |

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

# Font Style (https://www.nativewind.dev/docs/tailwind/typography/font-style)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-style)

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `italic`     | ✅ Supported |
| `not-italic` | ✅ Supported |

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

# Font Variant Numeric (https://www.nativewind.dev/docs/tailwind/typography/font-variant-numeric)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-variant-numeric)

## Compatibility

| Class                | Support     |
| -------------------- | ----------- |
| `normal-nums`        | ✅ Supported |
| `ordinal`            | ✅ Supported |
| `slashed-zero`       | ✅ Supported |
| `lining-nums`        | ✅ Supported |
| `oldstyle-nums`      | ✅ Supported |
| `proportional-nums`  | ✅ Supported |
| `tabular-nums`       | ✅ Supported |
| `diagonal-fractions` | ✅ Supported |
| `stacked-fractions`  | ✅ Supported |

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

# Font Weight (https://www.nativewind.dev/docs/tailwind/typography/font-weight)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/font-weight)

## Compatibility

| Class             | Support     |
| ----------------- | ----------- |
| `font-thin`       | ✅ Supported |
| `font-extralight` | ✅ Supported |
| `font-light`      | ✅ Supported |
| `font-normal`     | ✅ Supported |
| `font-medium`     | ✅ Supported |
| `font-semibold`   | ✅ Supported |
| `font-bold`       | ✅ Supported |
| `font-extrabold`  | ✅ Supported |
| `font-black`      | ✅ Supported |

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

# Hyphens (https://www.nativewind.dev/docs/tailwind/typography/hyphens)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/hyphens)

## Compatibility

| Class            | Support     |
| ---------------- | ----------- |
| `hyphens-none`   | 🌐 Web only |
| `hyphens-manual` | 🌐 Web only |
| `hyphens-auto`   | 🌐 Web only |

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

# Letter Spacing (https://www.nativewind.dev/docs/tailwind/typography/letter-spacing)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/letter-spacing)

## Compatibility

| Class              | Support     |
| ------------------ | ----------- |
| `tracking-tighter` | ✅ Supported |
| `tracking-tight`   | ✅ Supported |
| `tracking-normal`  | ✅ Supported |
| `tracking-wide`    | ✅ Supported |
| `tracking-wider`   | ✅ Supported |
| `tracking-widest`  | ✅ Supported |

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

# Line Clamp (https://www.nativewind.dev/docs/tailwind/typography/line-clamp)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/line-clamp)

## Compatibility

| Class             | Support     |
| ----------------- | ----------- |
| `line-clamp-1`    | ✅ Supported |
| `line-clamp-2`    | ✅ Supported |
| `line-clamp-3`    | ✅ Supported |
| `line-clamp-4`    | ✅ Supported |
| `line-clamp-5`    | ✅ Supported |
| `line-clamp-6`    | ✅ Supported |
| `line-clamp-none` | ✅ Supported |

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

# Line Height (https://www.nativewind.dev/docs/tailwind/typography/line-height)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/line-height)

## Compatibility

React Native does not support the relative line height utilities due to lack of support for `em` units.

| Class             | Support     |
| ----------------- | ----------- |
| `leading-{n}`     | ✅ Supported |
| `leading-[n]`     | ✅ Supported |
| `leading-none`    | 🌐 Web only |
| `leading-tight`   | 🌐 Web only |
| `leading-snug`    | 🌐 Web only |
| `leading-normal`  | 🌐 Web only |
| `leading-relaxed` | 🌐 Web only |
| `leading-loose`   | 🌐 Web only |

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

# List Style Image (https://www.nativewind.dev/docs/tailwind/typography/list-style-image)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/list-style-image)

## Compatibility

| Class             | Support     |
| ----------------- | ----------- |
| `list-image-none` | ✅ Supported |

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

# List Style Position (https://www.nativewind.dev/docs/tailwind/typography/list-style-position)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/list-style-position)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `list-inside`  | ✅ Supported |
| `list-outside` | ✅ Supported |

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

# List Style Type (https://www.nativewind.dev/docs/tailwind/typography/list-style-type)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/list-style-type)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `list-none`    | ✅ Supported |
| `list-disc`    | ✅ Supported |
| `list-decimal` | ✅ Supported |

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

# Text Transform (https://www.nativewind.dev/docs/tailwind/typography/text-align)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-align)

## Compatibility

| Class         | Support     |
| ------------- | ----------- |
| `uppercase`   | ✅ Supported |
| `lowercase`   | ✅ Supported |
| `capitalize`  | ✅ Supported |
| `normal-case` | 🌐 Web only |

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

# Text Color (https://www.nativewind.dev/docs/tailwind/typography/text-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-color)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `text-{n}`     | ✅ Supported |
| `text-[n]`     | ✅ Supported |
| `text-inherit` | 🌐 Web only |
| `text-current` | 🌐 Web only |

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

> textOpacity (native only)
>
> For performance reasons, Nativewind renders with the `corePlugin` `textOpacity` disabled. This plugin allows text to dynamically change its opacity via the `--tw-text-opacity` variable. Instead, the opacity is set as a static value in the `color` property.
>
> If you need to use this feature, you can enable it by adding the following to your `tailwind.config.js` file:
>
> ```js title=tailwind.config.js
> module.exports = {
>   /* ...  */
>   corePlugin: {
>     textOpacity: true,
>   },
> };
> ```

# Text Decoration Color (https://www.nativewind.dev/docs/tailwind/typography/text-decoration-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-decoration-color)

## Compatibility

| Class                | Support     |
| -------------------- | ----------- |
| `decoration-{n}`     | ✅ Supported |
| `decoration-[n]`     | ✅ Supported |
| `decoration-inherit` | 🌐 Web only |
| `decoration-current` | 🌐 Web only |

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

# Text Decoration Style (https://www.nativewind.dev/docs/tailwind/typography/text-decoration-style)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-decoration-style)

## Compatibility

| Class               | Support     |
| ------------------- | ----------- |
| `decoration-solid`  | ✅ Supported |
| `decoration-double` | ✅ Supported |
| `decoration-dotted` | ✅ Supported |
| `decoration-dashed` | ✅ Supported |
| `decoration-wavy`   | 🌐 Web only |

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

# Text Decoration Thickness (https://www.nativewind.dev/docs/tailwind/typography/text-decoration-thickness)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-decoration-thickness)

## Compatibility

| Class                  | Support     |
| ---------------------- | ----------- |
| `decoration-auto`      | 🌐 Web only |
| `decoration-from-font` | 🌐 Web only |
| `decoration-0`         | 🌐 Web only |
| `decoration-1`         | 🌐 Web only |
| `decoration-2`         | 🌐 Web only |
| `decoration-4`         | 🌐 Web only |
| `decoration-8`         | 🌐 Web only |

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

# Text Decoration (https://www.nativewind.dev/docs/tailwind/typography/text-decoration)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-decoration)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `underline`    | ✅ Supported |
| `line-through` | ✅ Supported |
| `no-underline` | ✅ Supported |
| `overline`     | 🌐 Web only |

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

# Text Indent (https://www.nativewind.dev/docs/tailwind/typography/text-indent)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-indent)

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `indent-[n]` | 🌐 Web only |
| `indent-{n}` | 🌐 Web only |

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

# Text Overflow (https://www.nativewind.dev/docs/tailwind/typography/text-overflow)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-overflow)

## Compatibility

| Class           | Support     |
| --------------- | ----------- |
| `truncate`      | 🌐 Web only |
| `text-ellipsis` | 🌐 Web only |
| `text-clip`     | 🌐 Web only |

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

# Text Align (https://www.nativewind.dev/docs/tailwind/typography/text-transform)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-transform)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `text-left`    | ✅ Supported |
| `text-center`  | ✅ Supported |
| `text-right`   | ✅ Supported |
| `text-justify` | ✅ Supported |
| `text-start`   | ✅ Supported |
| `text-end`     | ✅ Supported |

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

# Text Underline Offset (https://www.nativewind.dev/docs/tailwind/typography/text-underline-offset)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/text-underline-offset)

## Compatibility

| Class                   | Support     |
| ----------------------- | ----------- |
| `underline-offset-auto` | 🌐 Web only |
| `underline-offset-0`    | 🌐 Web only |
| `underline-offset-1`    | 🌐 Web only |
| `underline-offset-2`    | 🌐 Web only |
| `underline-offset-4`    | 🌐 Web only |
| `underline-offset-8`    | 🌐 Web only |

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

# Vertical Align (https://www.nativewind.dev/docs/tailwind/typography/vertical-align)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/vertical-align)

## Compatibility

| Class               | Support     |
| ------------------- | ----------- |
| `align-baseline`    | 🌐 Web only |
| `align-top`         | 🌐 Web only |
| `align-middle`      | 🌐 Web only |
| `align-bottom`      | 🌐 Web only |
| `align-text-top`    | 🌐 Web only |
| `align-text-bottom` | 🌐 Web only |
| `align-sub`         | 🌐 Web only |
| `align-super`       | 🌐 Web only |

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

# Whitespace (https://www.nativewind.dev/docs/tailwind/typography/whitespace)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/whitespace)

## Compatibility

| Class                     | Support     |
| ------------------------- | ----------- |
| `whitespace-normal`       | 🌐 Web only |
| `whitespace-nowrap`       | 🌐 Web only |
| `whitespace-pre`          | 🌐 Web only |
| `whitespace-pre-line`     | 🌐 Web only |
| `whitespace-pre-wrap`     | 🌐 Web only |
| `whitespace-break-spaces` | 🌐 Web only |

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

# Word Break (https://www.nativewind.dev/docs/tailwind/typography/word-break)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/word-break)

## Compatibility

| Class                | Support     |
| -------------------- | ----------- |
| `break-normal`       | 🌐 Web only |
| `word-break: normal` | 🌐 Web only |
| `break-words`        | 🌐 Web only |
| `break-all`          | 🌐 Web only |
| `break-keep`         | 🌐 Web only |

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

