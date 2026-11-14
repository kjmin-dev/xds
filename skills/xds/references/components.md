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
| `web-solid` | `packages/ui-solid/src/<Name>.tsx`, re-exported from `index.ts`; its prop types, classes, and CSS in `packages/ui-core/src` | `apps/web-solid/src/preview/<Section>.tsx`, listed in `sections.ts` |
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
   - On the web, the React component is the reference. The Solid component takes its classes from a recipe in `packages/ui-core`, which never imports a framework, and its states from a stylesheet there; it must look and behave like the React one in both color modes.
4. Export the component from each library's entry point, and add a section or row to each client's design preview demonstrating all variants, tones, sizes, and states. For an interactive web component, also add a scenario to `packages/ui-core/test/scenarios.ts` and the checks of its keyboard, focus, and ARIA behavior to `packages/ui-core/test/behavior.ts`, then build the scenario with the component in every web library's mount adapter (`packages/ui/test/behavior.test.tsx` for React, `packages/ui-solid/test/behavior.test.tsx` for Solid), so that each library runs the same checks.
5. Register the component in `design/components.json` with the implementing source file and symbol name for each client. Automated tests verify that every listed file exists and defines the symbol, and that every export from the TypeScript libraries is documented in the contract.
6. TopBar, TabBar, and BottomSheet are implemented only on the two touch clients (React Native and Compose), and Tooltip and Sidebar only on the pointer clients (the web clients and GPUI). If a new component is similarly specific to one kind of input, implement it on those clients and note why in its `purpose` field.
7. Run `mise run check`, then visually inspect the design previews on each client; see [verifying.md](verifying.md).
