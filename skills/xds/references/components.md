# Adding a component, a variant, or a tone

The libraries share a contract, not code. Whatever you add goes on every client the project has, under the same name, with the same options.

## Find what exists

```sh
xds components --json                      # every component and the clients that have it
xds components Badge --code --json         # one component with its source on each client
```

`design/components.json` is the contract these read.

## Where the code is

| Client | Library | Design preview |
| --- | --- | --- |
| `web-react` | `packages/ui/src/<Name>.tsx`, exported from `index.ts` | `apps/web/src/DesignPreview.tsx` |
| `mobile-react-native` | `packages/ui-native/src/<Name>.tsx`, exported from `index.ts` | `apps/mobile/app/design.tsx` |
| `desktop-gpui` | `crates/acme-ui/src/components.rs` or `controls.rs`, exported from `lib.rs` | `crates/acme-ui/src/preview.rs` |
| `kotlin-compose` | `kotlin/ui/src/commonMain/kotlin/acme/ui/<Name>.kt` | `DesignPreview.kt` in the same directory |

## Steps

1. Decide the contract first: the name, what it is for, its options (`variant`, `size`, `tone`, flags), and its states. Reuse the names other components use: sizes are `sm`, `md`, `lg`; tones are `neutral`, `accent`, `success`, `warning`, `danger`.
2. Add the colors the component needs as a group of its own in both color files, and their contrast pairings. See [tokens.md](tokens.md).
3. Implement it on each client. Start from the closest existing component on that client and follow it:
   - Colors, sizes, and spacing come from tokens. No hex values.
   - Hover, pressed, and disabled are separate token colors, not opacity.
   - A pressable part is at least `size.target-min` in both directions.
   - A state never depends on color alone: pair it with a shape, a border, or text.
   - Give it its accessible role and name. Web components that wrap a native input keep the input and hide it visually.
4. Export it, and add a section or a row for it to each client's design preview, showing every variant and state.
5. Add it to `design/components.json`, with the source file and the symbol on each client. A test checks that every listed file exists and contains the symbol, and that everything the TypeScript libraries export is listed.
6. TopBar, TabBar, and BottomSheet exist only on the two touch clients. A component that makes sense only for touch follows them; say so in its `purpose`.
7. Run `mise run check`, then look at the previews: see [verifying.md](verifying.md).
