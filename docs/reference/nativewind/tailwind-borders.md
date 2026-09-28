# NativeWind — Tailwind Borders



> Source: [NativeWind llms-full.txt](https://www.nativewind.dev/llms-full.txt)



# Border Color (https://www.nativewind.dev/docs/tailwind/borders/border-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/border-color)

## Compatibility

| Class            | Support     |
| ---------------- | ----------- |
| `border-{n}`     | ✅ Supported |
| `border-[n]`     | ✅ Supported |
| `border-inherit` | 🌐 Web only |
| `border-current` | 🌐 Web only |

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

> borderOpacity (native only)
>
> For performance reasons, Nativewind renders with the `corePlugin` `borderOpacity` disabled. This plugin allows the border color to dynamically change its opacity via the `--tw-border-opacity` variable. Instead, the opacity is set as a static value in the `color` property.
>
> If you need to use this feature, you can enable it by adding the following to your `tailwind.config.js` file:
>
> ```js title=tailwind.config.js
> module.exports = {
>   /* ...  */
>   corePlugin: {
>     borderOpacity: true,
>   },
> };
> ```

# Border Radius (https://www.nativewind.dev/docs/tailwind/borders/border-radius)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/border-radius)

## Compatibility

| Class             | Support     |
| ----------------- | ----------- |
| `rounded-none`    | ✅ Supported |
| `rounded`         | ✅ Supported |
| `rounded-{n}`     | ✅ Supported |
| `rounded-[n]`     | ✅ Supported |
| `rounded-full`    | ✅ Supported |
| `rounded-t-none`  | ✅ Supported |
| `rounded-t-{n}`   | ✅ Supported |
| `rounded-t-[n]`   | ✅ Supported |
| `rounded-t-full`  | ✅ Supported |
| `rounded-r-none`  | ✅ Supported |
| `rounded-r-{n}`   | ✅ Supported |
| `rounded-r-[n]`   | ✅ Supported |
| `rounded-r-full`  | ✅ Supported |
| `rounded-b-none`  | ✅ Supported |
| `rounded-b-{n}`   | ✅ Supported |
| `rounded-b-[n]`   | ✅ Supported |
| `rounded-b-full`  | ✅ Supported |
| `rounded-l-none`  | ✅ Supported |
| `rounded-l-{n}`   | ✅ Supported |
| `rounded-l-[n]`   | ✅ Supported |
| `rounded-l-full`  | ✅ Supported |
| `rounded-tl-none` | ✅ Supported |
| `rounded-tl-{n}`  | ✅ Supported |
| `rounded-tl-[n]`  | ✅ Supported |
| `rounded-tl-full` | ✅ Supported |
| `rounded-tr-none` | ✅ Supported |
| `rounded-tr-{n}`  | ✅ Supported |
| `rounded-tr-[n]`  | ✅ Supported |
| `rounded-tr-full` | ✅ Supported |
| `rounded-br-none` | ✅ Supported |
| `rounded-br-{n}`  | ✅ Supported |
| `rounded-br-[n]`  | ✅ Supported |
| `rounded-br-full` | ✅ Supported |
| `rounded-bl-none` | ✅ Supported |
| `rounded-bl-{n}`  | ✅ Supported |
| `rounded-bl-[n]`  | ✅ Supported |
| `rounded-bl-full` | ✅ Supported |
| `border-inherit`  | 🌐 Web only |
| `border-current`  | 🌐 Web only |

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

# Border Style (https://www.nativewind.dev/docs/tailwind/borders/border-style)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/border-style)

## Compatibility

> Use `border-0` instead of `border-none` to remove borders on native.

| Class           | Support     |
| --------------- | ----------- |
| `border-solid`  | ✅ Supported |
| `border-dashed` | ✅ Supported |
| `border-dotted` | ✅ Supported |
| `border-none`   | 🌐 Web only |
| `border-double` | 🌐 Web only |
| `border-hidden` | 🌐 Web only |

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

# Border Width (https://www.nativewind.dev/docs/tailwind/borders/border-width)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/border-width)

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `border`       | ✅ Supported |
| `border-{n}`   | ✅ Supported |
| `border-[n]`   | ✅ Supported |
| `border-x`     | ✅ Supported |
| `border-x-{n}` | ✅ Supported |
| `border-x-[n]` | ✅ Supported |
| `border-y`     | ✅ Supported |
| `border-y-{n}` | ✅ Supported |
| `border-y-[n]` | ✅ Supported |
| `border-t`     | ✅ Supported |
| `border-t-{n}` | ✅ Supported |
| `border-t-[n]` | ✅ Supported |
| `border-r`     | ✅ Supported |
| `border-r-{n}` | ✅ Supported |
| `border-r-[n]` | ✅ Supported |
| `border-b`     | ✅ Supported |
| `border-b-{n}` | ✅ Supported |
| `border-b-[n]` | ✅ Supported |
| `border-l`     | ✅ Supported |
| `border-l-{n}` | ✅ Supported |
| `border-l-[n]` | ✅ Supported |

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

# Divide Color (https://www.nativewind.dev/docs/tailwind/borders/divide-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/divide-color)

> CAUTION
>
> `Divide Color` was temporary removed in `v4`. We are working to re-add it in the future.

## Compatibility

| Class            | Support     |
| ---------------- | ----------- |
| `divide-{n}`     | 🌐 Web only |
| `divide-[n]`     | 🌐 Web only |
| `divide-inherit` | 🌐 Web only |
| `divide-current` | 🌐 Web only |

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

> divideOpacity (native only)
>
> For performance reasons, Nativewind renders with the `corePlugin` `divideOpacity` disabled. This plugin allows the divide color to dynamically change its opacity via the `--tw-divide-opacity` variable. Instead, the opacity is set as a static value in the `color` property.
>
> If you need to use this feature, you can enable it by adding the following to your `tailwind.config.js` file:
>
> ```js title=tailwind.config.js
> module.exports = {
>   /* ...  */
>   corePlugin: {
>     divideOpacity: true,
>   },
> };
> ```

# Divide Style (https://www.nativewind.dev/docs/tailwind/borders/divide-style)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/divide-style)

> CAUTION
>
> `Divide Style` was temporary removed in `v4`. We are working to re-add it in the future.

## Compatibility

| Class           | Support     |
| --------------- | ----------- |
| `divide-solid`  | 🌐 Web only |
| `divide-dashed` | 🌐 Web only |
| `divide-dotted` | 🌐 Web only |
| `divide-none`   | 🌐 Web only |
| `divide-double` | 🌐 Web only |
| `divide-hidden` | 🌐 Web only |

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

# Divide Width (https://www.nativewind.dev/docs/tailwind/borders/divide-width)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/divide-width)

> CAUTION
>
> `Divide Width` was temporary removed in `v4`. We are working to re-add it in the future.

## Compatibility

| Class          | Support     |
| -------------- | ----------- |
| `divide-x-{n}` | 🌐 Web only |
| `divide-x-[n]` | 🌐 Web only |
| `divide-y-{n}` | 🌐 Web only |
| `divide-y-[n]` | 🌐 Web only |

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

# Outline Color (https://www.nativewind.dev/docs/tailwind/borders/outline-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/outline-color)

## Compatibility

| Class                 | Support     |
| --------------------- | ----------- |
| `outline-inherit`     | 🌐 Web only |
| `outline-current`     | 🌐 Web only |
| `outline-transparent` | 🌐 Web only |
| `outline-black`       | 🌐 Web only |
| `outline-white`       | 🌐 Web only |
| `outline-{n}`         | 🌐 Web only |
| `outline-[n]`         | 🌐 Web only |

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

# Outline Offset (https://www.nativewind.dev/docs/tailwind/borders/outline-offset)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/outline-offset)

## Compatibility

| Class              | Support     |
| ------------------ | ----------- |
| `outline-offset-0` | 🌐 Web only |
| `outline-offset-1` | 🌐 Web only |
| `outline-offset-2` | 🌐 Web only |
| `outline-offset-4` | 🌐 Web only |
| `outline-offset-8` | 🌐 Web only |

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

# Outline Style (https://www.nativewind.dev/docs/tailwind/borders/outline-style)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/outline-style)

## Compatibility

| Class            | Support     |
| ---------------- | ----------- |
| `outline-none`   | 🌐 Web only |
| `outline`        | 🌐 Web only |
| `outline-dashed` | 🌐 Web only |
| `outline-dotted` | 🌐 Web only |
| `outline-double` | 🌐 Web only |

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

# Outline Width (https://www.nativewind.dev/docs/tailwind/borders/outline-width)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/outline-width)

## Compatibility

| Class       | Support     |
| ----------- | ----------- |
| `outline-0` | 🌐 Web only |
| `outline-1` | 🌐 Web only |
| `outline-2` | 🌐 Web only |
| `outline-4` | 🌐 Web only |
| `outline-8` | 🌐 Web only |

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

# Ring Color (https://www.nativewind.dev/docs/tailwind/borders/ring-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/ring-color)

## Compatibility

| Class              | Support     |
| ------------------ | ----------- |
| `ring-inherit`     | 🌐 Web only |
| `ring-current`     | 🌐 Web only |
| `ring-transparent` | 🌐 Web only |
| `ring-black`       | 🌐 Web only |
| `ring-white`       | 🌐 Web only |
| `ring-{n}`         | 🌐 Web only |
| `ring-[n]`         | 🌐 Web only |

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

# Ring Offset Color (https://www.nativewind.dev/docs/tailwind/borders/ring-offset-color)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/ring-offset-color)

## Compatibility

| Class           | Support     |
| --------------- | ----------- |
| `ring-offset-0` | 🌐 Web only |
| `ring-offset-1` | 🌐 Web only |
| `ring-offset-2` | 🌐 Web only |
| `ring-offset-4` | 🌐 Web only |
| `ring-offset-8` | 🌐 Web only |

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

# Ring Offset Width (https://www.nativewind.dev/docs/tailwind/borders/ring-offset-width)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/ring-offset-width)

## Compatibility

| Class           | Support     |
| --------------- | ----------- |
| `ring-offset-0` | 🌐 Web only |
| `ring-offset-1` | 🌐 Web only |
| `ring-offset-2` | 🌐 Web only |
| `ring-offset-4` | 🌐 Web only |
| `ring-offset-8` | 🌐 Web only |

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

# Ring Width (https://www.nativewind.dev/docs/tailwind/borders/ring-width)

## Usage

[Tailwind CSS documentation](https://v3.tailwindcss.com/docs/ring-width)

## Compatibility

| Class        | Support     |
| ------------ | ----------- |
| `ring-0`     | 🌐 Web only |
| `ring-1`     | 🌐 Web only |
| `ring-2`     | 🌐 Web only |
| `ring`       | 🌐 Web only |
| `ring-4`     | 🌐 Web only |
| `ring-8`     | 🌐 Web only |
| `ring-inset` | 🌐 Web only |

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

