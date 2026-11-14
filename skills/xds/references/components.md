# Adding a component, a variant, or a tone

Client component libraries share a contract rather than implementation code. Any component, variant, size, or tone you add must be implemented on every client in the project under the same name and with the same options.

## Find what exists

```sh
xds components --json                      # every component and the clients that have it
xds components Badge --code --json         # one component with its source on each client
```

These commands read the component contract in `design/components.json`.

## Where the code is

| Client | Library | Design preview |
| --- | --- | --- |
| `web-react` | `packages/ui/src/<Name>.tsx`, re-exported from `index.ts` | `apps/web/src/DesignPreview.tsx` |
| `mobile-react-native` | `packages/ui-native/src/<Name>.tsx`, re-exported from `index.ts` | `apps/mobile/app/design.tsx` |
| `desktop-gpui` | `crates/acme-ui/src/components.rs` or `controls.rs`, re-exported from `lib.rs` | `crates/acme-ui/src/preview.rs` |
| `kotlin-compose` | `kotlin/ui/src/commonMain/kotlin/acme/ui/<Name>.kt` | `DesignPreview.kt` in the same directory |

## Steps

1. Define the component contract first: its name, purpose, props/options (`variant`, `size`, `tone`, boolean flags), and interactive states. Follow the naming conventions used by existing components: sizes are `sm`, `md`, `lg`; tones are `neutral`, `accent`, `success`, `warning`, `danger`.
2. Add any component-specific color tokens under a dedicated group in both light and dark color token files, along with their contrast pairings. See [tokens.md](tokens.md).
3. Implement the component on every client in the project, using the closest existing component on each client as a template:
   - Take all colors, sizes, and spacing from design tokens. Never hardcode hex values.
   - Represent hover, pressed, and disabled states with dedicated color tokens rather than opacity multipliers.
   - Ensure every interactive touch or click target measures at least `size.target-min` in both width and height.
   - Never rely on color alone to convey state; pair color changes with an icon, shape, border, or text label.
   - Provide appropriate accessibility roles and labels. On the web, components wrapping a native form input must render the real input element (visually hidden if necessary) so keyboard and screen-reader behavior stays intact.
4. Export the component from each library's entry point, and add a section or row to each client's design preview demonstrating all variants, tones, sizes, and states.
5. Register the component in `design/components.json` with the implementing source file and symbol name for each client. Automated tests verify that every listed file exists and defines the symbol, and that every export from the TypeScript libraries is documented in the contract.
6. TopBar, TabBar, and BottomSheet are implemented only on the two touch clients (React Native and Compose), and Tooltip and Sidebar only on the two pointer clients (web and GPUI). If a new component is similarly specific to one kind of input, implement it on those clients and note why in its `purpose` field.
7. Run `mise run check`, then visually inspect the design previews on each client; see [verifying.md](verifying.md).
