// What the component pages say. The prop tables describe the web components in packages/ui;
// the other platforms take the same options under their own naming. `generate.ts` checks that
// every source file named here exists, so a renamed or removed component fails the build.

export type Prop = { name: string; type: string; description: string };

export type Component = {
  slug: string;
  name: string;
  summary: string;
  /** When to use it and the rules that go with it. */
  guidance: string[];
  /** The web example. Touch-only components show the React Native one. */
  example: string;
  exampleLanguage: "tsx";
  props: Prop[];
  /** Source file per platform. Touch-only components have no web or GPUI entry. */
  sources: { web?: string; gpui?: string; reactNative: string; compose: string };
  /** The live example at /demo/<slug>/. Touch-only components have none. */
  demo: boolean;
};

const web = (file: string) => `packages/ui/src/${file}.tsx`;
const native = (file: string) => `packages/ui-native/src/${file}.tsx`;
const compose = (file: string) => `kotlin/ui/src/commonMain/kotlin/acme/ui/${file}.kt`;
const GPUI_COMPONENTS = "crates/acme-ui/src/components.rs";
const GPUI_CONTROLS = "crates/acme-ui/src/controls.rs";

const everywhere = (file: string, gpui: string) => ({
  web: web(file),
  gpui,
  reactNative: native(file),
  compose: compose(file),
});

export const COMPONENTS: Component[] = [
  {
    slug: "button",
    name: "Button",
    summary: "Starts an action.",
    guidance: [
      "Use `primary` for the one action a view is for, at most once per view. `secondary` is any other action, `ghost` one that should stay out of the way, and `danger` one that destroys something.",
      "Label it with a verb.",
      "A button is a rounded rectangle for pointer input and a capsule for touch. Pressing it also scales it down slightly, so the feedback does not depend on color.",
      "A disabled button is recolored with its own tokens rather than faded. A loading button keeps its label and its colors, because the action was accepted.",
    ],
    example: `import { Button } from "@acme/ui";

<Button variant="primary" onPress={save}>Save</Button>
<Button onPress={cancel}>Cancel</Button>
<Button variant="primary" loading>Saving</Button>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "ghost" | "danger"',
        description: "Defaults to `secondary`.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        description: "Defaults to `md`. The heights depend on the input device.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "loading",
        type: "boolean",
        description:
          "Shows a spinner and ignores presses. The label stays, so the button keeps its width.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        description: "Stretches to the width of its container.",
      },
      { name: "type", type: '"button" | "submit" | "reset"', description: "Defaults to `button`." },
      { name: "onPress", type: "() => void", description: "" },
      {
        name: "aria-label",
        type: "string",
        description: "Names the button for assistive technology when it has no text.",
      },
    ],
    sources: everywhere("Button", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "text-field",
    name: "TextField",
    summary: "A labelled single-line text field.",
    guidance: [
      "Always give it a visible label. Placeholder text is not a substitute: it disappears as soon as the person types.",
      "An error replaces the description, turns the border red and makes it thicker.",
      "Clear `error` as soon as the person edits the value. An invalid field blocks its form from being submitted, so an error left in place would block the corrected value too.",
    ],
    example: `import { TextField } from "@acme/ui";

<TextField
  label="Email"
  type="email"
  description="We send the sign-in code to this address."
  value={email}
  onChange={setEmail}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Always visible." },
      { name: "value", type: "string", description: "Required." },
      { name: "onChange", type: "(value: string) => void", description: "Required." },
      {
        name: "description",
        type: "string",
        description: "Help shown under the field. Replaced by `error` while there is one.",
      },
      { name: "error", type: "string", description: "What is wrong and how to fix it." },
      { name: "placeholder", type: "string", description: "" },
      { name: "type", type: "HTMLInputTypeAttribute", description: "Defaults to `text`." },
      {
        name: "inputMode",
        type: '"text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search"',
        description: "",
      },
      { name: "name", type: "string", description: "" },
      { name: "autoComplete", type: "HTMLInputAutoCompleteAttribute", description: "" },
      { name: "autoFocus", type: "boolean", description: "" },
      { name: "required", type: "boolean", description: "" },
      { name: "disabled", type: "boolean", description: "" },
    ],
    sources: everywhere("TextField", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "text",
    name: "Text",
    summary: "Text in one of the type roles.",
    guidance: [
      "Pick a role with `variant`, never a raw font size. A role sets size, weight, line height and letter spacing together.",
      "Choose the element with `as` for the document outline (`h1`, `h2`, `p`), not for looks.",
    ],
    example: `import { Text } from "@acme/ui";

<Text variant="title" as="h2">Weekly report</Text>
<Text tone="secondary">Sent every Monday.</Text>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "variant",
        type: '"display" | "title" | "heading" | "body" | "body-strong" | "label" | "detail" | "footnote"',
        description: "Defaults to `body`.",
      },
      {
        name: "tone",
        type: '"primary" | "secondary" | "accent" | "danger" | "success" | "warning" | "inherit"',
        description: "Defaults to `primary`. `inherit` takes the color of the surrounding text.",
      },
      { name: "as", type: "ElementType", description: "The element to render. Defaults to `p`." },
      { name: "className", type: "string", description: "" },
    ],
    sources: everywhere("Text", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "badge",
    name: "Badge",
    summary: "A short status or category.",
    guidance: [
      "The words carry the meaning and the color only reinforces it, so a badge still reads for someone who cannot tell the tones apart.",
      '`dot` adds a small mark for live states such as "connected".',
    ],
    example: `import { Badge } from "@acme/ui";

<Badge tone="success" dot>Connected</Badge>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "tone",
        type: '"neutral" | "accent" | "success" | "warning" | "danger"',
        description: "Defaults to `neutral`.",
      },
      { name: "dot", type: "boolean", description: "" },
    ],
    sources: everywhere("Badge", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "banner",
    name: "Banner",
    summary: "A message about the whole view or a section of it.",
    guidance: [
      "Each tone has its own mark shape, so the tone does not depend on color.",
      "`warning` and `danger` interrupt a screen reader. `info` and `success` wait their turn.",
    ],
    example: `import { Banner } from "@acme/ui";

<Banner tone="danger" title="Could not save">
  Check your connection and try again.
</Banner>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "tone",
        type: '"info" | "success" | "warning" | "danger"',
        description: "Defaults to `info`.",
      },
      { name: "title", type: "string", description: "" },
    ],
    sources: everywhere("Banner", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "card",
    name: "Card",
    summary: "A surface that groups related content.",
    guidance: [
      "A hairline border and a subtle shadow separate it from the page. In dark mode, where shadows barely show, the lighter fill does that.",
      "`flush` removes the padding, for a card that holds a list whose rows run edge to edge.",
    ],
    example: `import { Button, Card } from "@acme/ui";

<Card title="Weekly report" actions={<Button size="sm">Edit</Button>}>
  …
</Card>`,
    exampleLanguage: "tsx",
    props: [
      { name: "title", type: "string", description: "Rendered as a heading." },
      { name: "description", type: "string", description: "" },
      { name: "actions", type: "ReactNode", description: "Shown across from the title." },
      { name: "flush", type: "boolean", description: "No padding and no gaps." },
      { name: "className", type: "string", description: "" },
    ],
    sources: everywhere("Card", GPUI_COMPONENTS),
    demo: true,
  },
  {
    slug: "divider",
    name: "Divider",
    summary: "A line between groups of content.",
    guidance: [
      "It is decorative, so it uses the low-contrast border color. Use it between the rows of a list.",
    ],
    example: `import { Divider } from "@acme/ui";

<Divider />`,
    exampleLanguage: "tsx",
    props: [],
    sources: {
      web: web("Divider"),
      gpui: GPUI_COMPONENTS,
      reactNative: native("Card"),
      compose: compose("Card"),
    },
    demo: true,
  },
  {
    slug: "spinner",
    name: "Spinner",
    summary: "Says that something is in progress, for work of unknown length.",
    guidance: [
      "It takes the color of the text around it.",
      "With `label` it is announced to assistive technology. Without one it is decoration next to text that already says what is happening.",
      "For work of known length, use a ProgressBar.",
    ],
    example: `import { Spinner } from "@acme/ui";

<Spinner label="Loading" />`,
    exampleLanguage: "tsx",
    props: [
      { name: "size", type: '"sm" | "md" | "lg"', description: "Defaults to `md`." },
      { name: "label", type: "string", description: "What a screen reader says." },
    ],
    // The desktop client uses GPUI Component's own spinner, inside a loading button.
    sources: { web: web("Spinner"), reactNative: native("Spinner"), compose: compose("Spinner") },
    demo: true,
  },
  {
    slug: "switch",
    name: "Switch",
    summary: "Turns a setting on or off, and takes effect at once.",
    guidance: [
      "For a choice that is applied later, with a form, use a Checkbox.",
      "The track holds 3:1 contrast against the page when off, so the control is visible before it is on.",
    ],
    example: `import { Switch } from "@acme/ui";

<Switch label="Notifications" checked={on} onChange={setOn} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "checked", type: "boolean", description: "Required." },
      { name: "onChange", type: "(checked: boolean) => void", description: "Required." },
      {
        name: "label",
        type: "string",
        description: "Shown beside the switch. Pressing it toggles too.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Names the switch when there is no visible label.",
      },
      { name: "disabled", type: "boolean", description: "" },
    ],
    sources: everywhere("Switch", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    summary: "A choice that is applied later, with the form it belongs to.",
    guidance: ["For a setting that takes effect at once, use a Switch."],
    example: `import { Checkbox } from "@acme/ui";

<Checkbox label="Remember me" checked={remember} onChange={setRemember} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "checked", type: "boolean", description: "Required." },
      { name: "onChange", type: "(checked: boolean) => void", description: "Required." },
      {
        name: "label",
        type: "string",
        description: "Shown beside the box. Pressing it toggles too.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Names the checkbox when there is no visible label.",
      },
      { name: "name", type: "string", description: "" },
      { name: "disabled", type: "boolean", description: "" },
    ],
    sources: everywhere("Checkbox", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "segmented-control",
    name: "SegmentedControl",
    summary: "A choice between a few views or modes, all visible at once.",
    guidance: [
      "The selected segment is outlined as well as filled, so the choice does not depend on telling two greys apart.",
      "On the web it is a group of native radio buttons, so the arrow keys move between segments.",
    ],
    example: `import { SegmentedControl } from "@acme/ui";

<SegmentedControl
  aria-label="Period"
  options={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
  ]}
  value={period}
  onChange={setPeriod}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "options",
        type: "readonly { value: Value; label: string }[]",
        description: "Required.",
      },
      { name: "value", type: "Value", description: "Required." },
      { name: "onChange", type: "(value: Value) => void", description: "Required." },
      { name: "aria-label", type: "string", description: "Required. Says what is being chosen." },
      {
        name: "fullWidth",
        type: "boolean",
        description: "Stretches to the width of its container.",
      },
    ],
    sources: everywhere("SegmentedControl", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "avatar",
    name: "Avatar",
    summary: "Stands for a person or a team by their initials.",
    guidance: ["Assistive technology gets the full name. The small size has room for one letter."],
    example: `import { Avatar } from "@acme/ui";

<Avatar name="Ada Lovelace" />`,
    exampleLanguage: "tsx",
    props: [
      { name: "name", type: "string", description: "Required." },
      { name: "size", type: '"sm" | "md" | "lg"', description: "Defaults to `md`." },
    ],
    sources: everywhere("Avatar", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "progress-bar",
    name: "ProgressBar",
    summary: "How far along something is.",
    guidance: ["For work of unknown length, use a Spinner."],
    example: `import { ProgressBar } from "@acme/ui";

<ProgressBar label="Upload" value={0.6} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "value", type: "number", description: "Required. From 0 to 1." },
      {
        name: "label",
        type: "string",
        description: "Required. A screen reader reads it with the percentage.",
      },
    ],
    sources: everywhere("ProgressBar", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "list-row",
    name: "ListRow",
    summary: "One line of a list or a settings screen.",
    guidance: [
      "Separate rows with a Divider, inside a `flush` Card.",
      "`onPress` makes the whole row a button. Do not put another control in `trailing` then.",
    ],
    example: `import { Avatar, ListRow } from "@acme/ui";

<ListRow
  title="Ada Lovelace"
  description="ada@example.com"
  leading={<Avatar name="Ada Lovelace" />}
  chevron
  onPress={open}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "title", type: "string", description: "Required." },
      { name: "description", type: "string", description: "" },
      {
        name: "leading",
        type: "ReactNode",
        description: "In front of the title: an avatar or an icon.",
      },
      {
        name: "trailing",
        type: "ReactNode",
        description: "At the far end: a value, a badge or a switch.",
      },
      { name: "chevron", type: "boolean", description: "For a row that leads somewhere else." },
      { name: "onPress", type: "() => void", description: "Makes the whole row a button." },
      { name: "disabled", type: "boolean", description: "" },
    ],
    sources: everywhere("ListRow", GPUI_CONTROLS),
    demo: true,
  },
  {
    slug: "top-bar",
    name: "TopBar",
    summary: "The bar at the top of a screen: where you are, and the way back.",
    guidance: [
      "Touch clients only: React Native and Compose.",
      "It has the page's background and no border, so content scrolls up to it without a line in between.",
      "It does not cover the status bar. Put it inside the safe area.",
    ],
    example: `import { Button, TopBar } from "@acme/ui-native";

<TopBar
  title="Settings"
  onBack={goBack}
  trailing={<Button variant="ghost" label="Edit" onPress={edit} />}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "title", type: "string", description: "Required." },
      { name: "onBack", type: "() => void", description: "Shows a back button." },
      {
        name: "backLabel",
        type: "string",
        description: "What a screen reader says for the back button. Defaults to `Back`.",
      },
      {
        name: "trailing",
        type: "ReactNode",
        description: "An action at the far end, such as a ghost button.",
      },
    ],
    sources: { reactNative: native("TopBar"), compose: compose("TopBar") },
    demo: false,
  },
  {
    slug: "tab-bar",
    name: "TabBar",
    summary: "Switches between the top-level places of an app.",
    guidance: [
      "Touch clients only: React Native and Compose.",
      "Use it for three to five places.",
      "It is a capsule that floats over the bottom of the screen, so give it a margin at the sides and below, inside the safe area.",
      "The selected tab sits in a pill of its own, so the selection does not depend on color.",
    ],
    example: `import { TabBar } from "@acme/ui-native";

<TabBar
  items={[
    { key: "home", label: "Home", icon: (color) => <HomeIcon color={color} /> },
    { key: "search", label: "Search", icon: (color) => <SearchIcon color={color} /> },
  ]}
  value={tab}
  onChange={setTab}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "items",
        type: "readonly { key: Key; label: string; icon: (color: string) => ReactNode }[]",
        description: "Required. The icon is drawn above the label, 24 points square.",
      },
      { name: "value", type: "Key", description: "Required." },
      { name: "onChange", type: "(key: Key) => void", description: "Required." },
    ],
    sources: { reactNative: native("TabBar"), compose: compose("TabBar") },
    demo: false,
  },
  {
    slug: "bottom-sheet",
    name: "BottomSheet",
    summary: "A panel that slides up over the screen for a short task or a set of choices.",
    guidance: [
      "Touch clients only: React Native and Compose.",
      "It floats: a margin separates it from the screen edges, and all four corners are rounded.",
      "It closes on a tap outside, a drag down, or the back button.",
    ],
    example: `import { BottomSheet, Button } from "@acme/ui-native";

<BottomSheet open={open} onClose={() => setOpen(false)} title="Share report">
  <Button variant="primary" label="Copy link" onPress={copy} fullWidth />
</BottomSheet>`,
    exampleLanguage: "tsx",
    props: [
      { name: "open", type: "boolean", description: "Required." },
      {
        name: "onClose",
        type: "() => void",
        description: "Required. Called when the person dismisses the sheet.",
      },
      { name: "title", type: "string", description: "" },
      {
        name: "closeLabel",
        type: "string",
        description:
          "What a screen reader says for the area outside the sheet. Defaults to `Close`.",
      },
    ],
    sources: { reactNative: native("BottomSheet"), compose: compose("BottomSheet") },
    demo: false,
  },
];
