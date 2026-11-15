# The web design preview, as data

`designPreview()` returns the design preview of the web apps (`/design`) as a `Screen`: a tree of nodes and the first value of each state slot. `test/scenarios.ts` writes the behavior tests' screens the same way. Nothing here draws. Each web library has a renderer on its `./preview` subpath that draws a screen with the library's components, and each web app's `src/DesignPreview` component only hands the preview to that renderer.

| File | Contents |
| --- | --- |
| `model.ts` | The nodes, `builder()` to write a screen with, and `resolve` and `isStatic`, which every renderer uses |
| `components.ts` | The props of every web component, with `N` standing for the framework's node: what a screen may pass, and what each renderer checks its library against. `NODE_PROPS` names the props, children aside, that take a node |
| `design.ts` | The page: the header, the section links, the state, and `SECTIONS`, the sections in order |
| `sections.ts`, `specimens.ts` | The sections' content. The token sections are built from `@acme/tokens` |
| `fixtures.ts` | Options, people, and pictures |
| `page.ts` | `?open=`, the anchors, and scrolling to `#section` once the page is drawn |

## Changing the preview

Change the sections here, and every web app shows the change. `ui.Button({ variant: "primary" }, "Save")` is a component, `el("div", { class: "flex gap-2" }, …)` an element, `show(when, children, fallback)` a branch. A prop that follows the state is a function of the state, `(state) => state.liked`; a callback (`onPress`, `onChange`) takes the state and its arguments and returns the slots to change, `(state) => ({ liked: !state.liked })`; `bind("email")` gives a controlled `value` and its `onChange`, and `bind("agreed", "checked")` or `bind("question", "expanded")` the other props an `onChange` controls. The state's type is given to `builder()` once, so a wrong component, prop, value, or slot name is a type error, and so is a node written for another screen's state. A callback that returns a slot the state does not have throws when it runs.

A node goes only where a component takes one, as a prop of its own (`leading`, `actions`, `trigger`) or as a child, never inside a list item or an object such as a menu item or an accordion item: the types refuse it, since Svelte can hand a component a node only as a snippet prop.

A new web component goes into `components.ts` first, then into each renderer's `COMPONENTS`, imported by name from its library. A renderer fails to typecheck while a component is missing from it, while a prop the data passes has a type the library's component does not take, and while the library's component lacks a prop the data may pass.

## Adding a renderer

A renderer is one component, `Preview({ screen })`, in the library's `src/preview` module, exported on the library's `./preview` subpath next to `designPreview`. A framework that draws the whole screen again on every change takes the values as they are; one that updates in place, such as Solid, Vue, or Svelte, reads a value again where it changes.

1. Map every name of `ComponentName` to the library's component in `COMPONENTS`, and check it twice: that each component takes the props of `Components<Node>` for the framework's node type (`satisfies`), which checks the type of every prop the component takes, and that `Lacking` is `never` for each, so that no prop of the data goes to a component without it. Import the components by name: a namespace import of the library's entry puts every component in the chunk that the app's own screens load too.
2. Hold one reactive value per key of `screen.state`, and write the slots a callback returns.
3. Draw a slot: an array is its children side by side; a string or number is text; a function is text, `fn(state)`, kept up to date; a `show` node is `children` while `when(state)` holds and `fallback` otherwise; an `element` node is its `tag`; a `component` node is the library's component of that `name`. Both take `props` and `children`.
4. Give each prop `resolve(value, key, host)`: it calls the functions of the state and resolves what they return, binds the callbacks to the state, and draws the nodes with your `draw`. A renderer that updates in place resolves a prop again when the state changes, unless `isStatic(value, key)`. `class` is the class attribute, and `style` holds CSS property names.
5. Call `screen.mount()` once the screen is on the page, and what it returns when it goes.

The library's `test/behavior.test` file then draws `SCREENS[scenario]` of `test/scenarios.ts` with the same renderer and passes that to `describeBehavior`. The app's `src/DesignPreview` component draws `designPreview()` with it at `/design`.

### Vue and Svelte

Both draw the data as it is. What differs is how a component of theirs takes a node and a controlled value:

- **Nodes.** A prop that takes a node, and the children, become the framework's slots: in Vue, a named slot of the prop's name, for a prop the component does not declare in `props`, and the default slot; in Svelte 5, snippet props of the same names. Svelte has no public way to make a snippet that draws components from a script, so its renderer draws a component through a small recursive component that wraps one node prop at a time in a template `{#snippet}`, which adds nothing to the DOM. Such a prop may hold text, or text that follows the state, as well as a node, so a renderer that must tell a node from text goes by the prop's name in `NODE_PROPS`, which the types keep in step with `Components`, and not by its value. The Svelte renderer does; the Vue renderer needs no such list, since it passes every prop a component does not declare as a slot, and a slot draws text as well. This is why no node sits inside a list item: drawing one there would take `createRawSnippet` and `mount`, which add a wrapper element and start a new root that does not see the context around it.
- **`onChange`.** It controls `value`, `checked`, or `expanded` (`Controlled` in `components.ts`). A Vue library names its model the same, `defineModel("checked")`, or declares the prop and its `update:` event itself where the value it hands back has another type than the prop (a choice that is never undefined, a new list for a read-only one), and the renderer passes `onChange` as the model's update event, `onUpdate:checked`. A Svelte library takes the controlled prop and `onChange` as props, as the data passes them, with no `bind:`.
- **Values the owner keeps.** A control whose `onChange` changes nothing, such as the fields that use `keep` in the design preview, goes on showing the value it is given. React does this for every controlled input, and the Solid library writes the value back after an input. Vue's `defineModel` and Svelte's `$bindable` do not, so their libraries must write it back too. The `controlled` scenario of the behavior tests checks it.
- **The check of step 1.** A Vue component's type keeps its emits and slots apart from its props, so `satisfies` against `Components<VNode>` does not apply as it is: the Vue renderer maps each component's props, emits, and slots onto the names of `Components` in a type of its own before it checks them. Vue also keeps a prop under its camelized name, so a Vue component declares `aria-label` as `ariaLabel`, and the check camelizes the names of the data. Every Vue component's type takes `class` and `style`, but only a component with one root element passes them on, so the check lets the data give them only to the components it lists as having one.

The renderers in this project:

<!-- @if web-react -->
- React, `packages/ui/src/preview.tsx`, used by `apps/web/src/DesignPreview.tsx`: the state is one `useState`, and every change draws the screen again, which React reconciles.
<!-- @endif -->
<!-- @if web-solid -->
- Solid, `packages/ui-solid/src/preview.tsx`, used by `apps/web-solid/src/DesignPreview.tsx`: each slot is a signal, and a prop that is not `isStatic` is a getter, as Solid's compiler writes a prop in JSX.
<!-- @endif -->
<!-- @if web-vue -->
- Vue, `packages/ui-vue/src/preview.ts`, used by `apps/web-vue/src/DesignPreview.vue`: the state is one shallow reactive object, and each component of the screen is drawn by a small component of its own, so a change draws again only the components whose props read the slot. A node prop is a slot of its name, the children the default slot, and `onChange` the update event of the component's `value`, `checked`, or `expanded` model.
<!-- @endif -->
<!-- @if web-svelte -->
- Svelte, `packages/ui-svelte/src/preview/`, used by `apps/web-svelte/src/DesignPreview.svelte`: `Preview.svelte` holds each slot in a `$state.raw`, `Draw.svelte` draws a slot, `Component.svelte` takes the props of `NODE_PROPS` and the children aside and makes every other prop that is not `isStatic` a getter, which the component reads where it uses it, and `Snippets.svelte` is the recursive component that wraps the node props in snippets. Since the node props never reach `resolve`, the host's `draw` is never asked for a node. Its components take the controlled prop and `onChange` as plain props, and the fields write back a value their owner kept, as Solid's do.
<!-- @endif -->
