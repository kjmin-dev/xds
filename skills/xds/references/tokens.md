# Adding or changing a token

## The files

| File | Holds |
| --- | --- |
| `design/tokens/palette.json` | Raw color ramps. Only semantic colors refer to them, and they are not generated into platform code |
| `design/tokens/color.light.json`, `color.dark.json` | Semantic colors (`text`, `background`, `border`, `accent`, `control`, `danger`, `status`) and one group per component (`button`, `field`, `badge`, ...). Both files have the same tokens |
| `design/tokens/base.json` | Space, radius, border widths, focus ring, fonts, type roles, motion, shadows |
| `design/tokens/size.pointer.json`, `size.touch.json` | Control sizes for a mouse and for fingers. Both files have the same tokens |

The format is DTCG: a token is an object with `$value`, and may have `$description`. A value in braces is an alias: `"$value": "{color.accent.default}"`. Colors are sRGB objects with `colorSpace`, `components`, and `hex`. Find a neighbor with `xds tokens <query>` and write the new token the same way.

## Steps

1. Add the token to every file of its kind: a color to both `color.light.json` and `color.dark.json`, a size to both size files. The build refuses a token that exists for one mode or one input device only.
2. A component color aliases a semantic color, and a semantic color aliases the palette. Do not alias the palette from a component group.
3. If the color is drawn on or under another color, add the pairing to `PAIRS` in `tools/design-build/src/contrast.ts`:

   ```ts
   ...on("chip.text", ["chip.background"], TEXT),       // text: 4.5:1
   ...on("chip.border", SURFACES, PART),                // an outline or a mark: 3:1
   ```

   Check a pairing before committing to it: `xds contrast chip.text chip.background --min 4.5`.
4. Run `mise run tokens`. It rewrites the generated files and stops with the pairing, the mode, and the measured ratio when a pairing is too low. Fix the token, not the threshold.
5. Use the token from the generated names:

   | Client | A color | A size or a space |
   | --- | --- | --- |
   | Web | `bg-acme-chip-background`, `var(--acme-color-chip-background)` | `var(--acme-space-4)`, `h-acme-control-md` |
   | React Native | `useColors().chipBackground` | `space[4]`, `size.touch.controlMd` |
   | GPUI | `color(palette(cx).chip_background)` | `tokens::SPACE_4`, `tokens::POINTER.control_md` |
   | Compose | `LocalColors.current.chipBackground` | `Space.s4`, `LocalSizes.current.controlMd` |

   `acme` is the project's own name in a scaffolded project. Look at an existing component on the client for the exact spelling.
6. Commit the token files together with the generated files. `mise run check:generated` fails when they are out of step.
