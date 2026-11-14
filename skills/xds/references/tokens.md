# Adding or changing a token

## The files

| File | Contents |
| --- | --- |
| `design/tokens/palette.json` | Raw color ramps. Referenced only by semantic color tokens and never emitted into generated platform code |
| `design/tokens/color.light.json`, `color.dark.json` | Semantic color groups (`text`, `background`, `border`, `accent`, `control`, `danger`, `status`, `overlay`) and per-component color groups (`button`, `field`, `badge`, and so on). Both files must define the exact same set of token paths |
| `design/tokens/base.json` | Spacing, border radius, border widths, focus ring, font families, typographic roles, motion, and shadows |
| `design/tokens/size.pointer.json`, `size.touch.json` | Control dimensions for pointer (mouse/trackpad) and touch input. Both files must define the exact same set of token paths |

Token files use the DTCG format: each token is a JSON object with a `$value` field and an optional `$description` field. Braces denote an alias to another token (`"$value": "{color.accent.default}"`). Direct color values are sRGB objects containing `colorSpace`, `components`, and `hex`. Inspect an existing token with `xds tokens <query>` and follow the same structure.

## Steps

1. Add new tokens to every file in their category: add color tokens to both `color.light.json` and `color.dark.json`, and size tokens to both size files. The token build fails if a token is missing from one color mode or input device.
2. Preserve the token hierarchy: component color tokens must alias semantic colors, and semantic colors must alias palette steps. Do not reference palette tokens directly from a component group.
3. If the new color is rendered as foreground or background against another color, register the pairing in `PAIRS` in `tools/design-build/src/contrast.ts`:

   ```ts
   ...on("chip.text", ["chip.background"], TEXT),       // text: 4.5:1
   ...on("chip.border", SURFACES, PART),                // an outline or a mark: 3:1
   ```

   Test the contrast ratio beforehand with `xds contrast chip.text chip.background --min 4.5`.
4. Run `mise run tokens` to regenerate the platform token files. If any pairing falls below its required contrast ratio, the build fails and reports the offending pair, color mode, and measured ratio. Fix the token value rather than lowering the threshold.
5. Reference the generated token in client code:

   | Client | Color | Size or spacing |
   | --- | --- | --- |
   | Web | `bg-acme-chip-background`, `var(--acme-color-chip-background)` | `var(--acme-space-4)`, `h-acme-control-md` |
   | React Native | `useColors().chipBackground` | `space[4]`, `size.touch.controlMd` |
   | GPUI | `color(palette(cx).chip_background)` | `tokens::SPACE_4`, `tokens::POINTER.control_md` |
   | Compose | `LocalColors.current.chipBackground` | `Space.s4`, `LocalSizes.current.controlMd` |

   In a scaffolded project, `acme` is replaced by the project's name. Check an existing component in the target client for the exact naming pattern.
6. Commit the source token JSON files together with the regenerated platform files. `mise run check:generated` fails in CI if they are out of sync.
