// What the component pages say. The prop tables describe the web components in packages/ui;
// the other platforms take the same options under their own naming. Which clients have a
// component, their source files, and how they differ come from design/components.json, the
// contract the CLI reads too: `generate.ts` fails the build for a component it does not list,
// and for a design preview section named here that does not exist.

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
  /**
   * The live example: the web components at /demo/<slug>/ (src/demos/index.tsx), or, for a
   * touch-only component, the React Native one drawn by react-native-web at /demo-native/<slug>/
   * (src/demos/native.tsx).
   */
  demo: "web" | "native";
  /**
   * The section of the web design preview (SECTIONS in packages/ui-core/src/preview/design.ts)
   * that shows it, by title. Every component with a web version names one; touch-only
   * components have none.
   */
  preview?: string;
};

export const COMPONENTS: Component[] = [
  {
    slug: "button",
    name: "Button",
    summary: "Triggers an action or toggles a state.",
    guidance: [
      "Use `primary` for the single main action on a view (at most once per view). Use `secondary` for standard actions, `ghost` for low-emphasis actions, and `danger` for destructive ones.",
      "Label buttons with a clear verb.",
      "Pressing a button scales it down slightly so press feedback does not rely on color alone.",
      "Disabled buttons use dedicated disabled tokens instead of reduced opacity. Loading buttons keep their label and active colors while the action is in progress.",
      "`iconStart` and `iconEnd` render icons alongside the label in the same color. An icon-only button renders as a square and requires an `aria-label`.",
      "Passing `selected` turns the button into a toggle (`aria-pressed`). Selected `secondary` and `ghost` buttons show a tinted fill, accent border, and filled `iconStart`; `primary` and `danger` keep their fills.",
    ],
    example: `import { Button } from "@acme/ui";

<Button variant="primary" onPress={save}>Save</Button>
<Button onPress={cancel}>Cancel</Button>
<Button variant="primary" loading>Saving</Button>
<Button iconStart="heart" selected={liked} onPress={() => setLiked(!liked)}>Like</Button>
<Button variant="ghost" iconStart="settings" aria-label="Settings" />`,
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
        description: "Defaults to `md`. Heights adapt to pointer vs. touch input.",
      },
      {
        name: "iconStart",
        type: "IconName",
        description: "Leading icon: 16px, or 20px in `lg` buttons.",
      },
      { name: "iconEnd", type: "IconName", description: "Trailing icon." },
      {
        name: "selected",
        type: "boolean",
        description:
          "Enables toggle mode (`aria-pressed`). When `true`, styles `secondary` and `ghost` buttons as selected.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "loading",
        type: "boolean",
        description:
          "Shows a spinner and disables clicks. Keeps the label visible and replaces `iconStart` so the button width stays stable.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        description: "Expands to fill the container width.",
      },
      { name: "type", type: '"button" | "submit" | "reset"', description: "Defaults to `button`." },
      { name: "onPress", type: "() => void", description: "" },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name required for icon-only buttons.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Button label. Omit for icon-only buttons.",
      },
    ],
    demo: "web",
    preview: "Buttons",
  },
  {
    slug: "text-field",
    name: "TextField",
    summary: "Single-line or multi-line text input with a visible label.",
    guidance: [
      "Always provide a visible label. Placeholder text disappears as soon as the user types and cannot replace a label.",
      "Setting `error` replaces `description` and switches to a thicker red border.",
      "Clear `error` as soon as the user edits the field so an invalid state does not block submitting the corrected value.",
      "`leading` and `trailing` place an icon, unit, or compact control inside the input without changing its height; they inherit the placeholder color unless styled otherwise.",
      "`multiline` renders a textarea sized to `rows` lines that scrolls past that height. Slots align with the first line.",
      "`maxLength` caps input length and displays a character counter on the trailing edge opposite the description or error.",
    ],
    example: `import { Icon, TextField } from "@acme/ui";

<TextField
  label="Email"
  type="email"
  description="We send the sign-in code to this address."
  value={email}
  onChange={setEmail}
/>
<TextField
  label="Search"
  leading={<Icon name="search" size="sm" />}
  value={query}
  onChange={setQuery}
/>
<TextField label="Bio" multiline rows={3} maxLength={80} value={bio} onChange={setBio} />`,
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
      {
        name: "leading",
        type: "ReactNode",
        description: "Inside the box, in front of the text: an icon or a unit.",
      },
      {
        name: "trailing",
        type: "ReactNode",
        description: "Inside the box, after the text: an icon, a unit or a small button.",
      },
      { name: "multiline", type: "boolean", description: "A text area. `type` does not apply." },
      {
        name: "rows",
        type: "number",
        description: "The height of a text area in lines. Defaults to 3.",
      },
      {
        name: "maxLength",
        type: "number",
        description: "The most characters the field takes. Shows a count such as `12/80`.",
      },
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
    demo: "web",
    preview: "Text fields",
  },
  {
    slug: "text",
    name: "Text",
    summary: "Typographic text styled by a semantic role.",
    guidance: [
      "Choose a role via `variant` instead of a raw font size; each role sets size, weight, line height, and letter spacing together.",
      "Choose the HTML element via `as` for document semantics (`h1`, `h2`, `p`), independent of visual styling.",
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
    demo: "web",
    preview: "Typography",
  },
  {
    slug: "badge",
    name: "Badge",
    summary: "Compact label for a status or category.",
    guidance: [
      "The label should carry the meaning on its own; color only reinforces it.",
      '`dot` adds a status indicator for live states such as "Connected", and `icon` places a 12px icon before the label.',
      "`overlay` renders a translucent dark pill with white text for placement over images, unchanged across light and dark modes.",
      "For numeric counts, use `CountBadge`.",
    ],
    example: `import { Badge } from "@acme/ui";

<Badge tone="success" dot>Connected</Badge>
<Badge tone="warning" icon="clock">Pending</Badge>
<Badge tone="overlay" icon="play">2:45</Badge>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "tone",
        type: '"neutral" | "accent" | "success" | "warning" | "danger" | "overlay"',
        description: "Defaults to `neutral`.",
      },
      { name: "dot", type: "boolean", description: "" },
      {
        name: "icon",
        type: "IconName",
        description: "12px icon rendered before the label (after `dot` if both are set).",
      },
    ],
    demo: "web",
    preview: "Badges",
  },
  {
    slug: "count-badge",
    name: "CountBadge",
    summary: "Numeric badge for unread counts or cart items on an icon, avatar, or button.",
    guidance: [
      "When wrapping a child, it overlaps the top-end corner and follows layout direction. Without children, it renders inline (for example, at the end of a `ListRow`).",
      "Counts of `0` or less render nothing. Values above `max` display as `99+`.",
      'Pass `label` (such as `"3 unread notifications"`) so screen readers announce context rather than a bare number.',
    ],
    example: `import { CountBadge, Icon } from "@acme/ui";

<CountBadge count={3} label="3 unread notifications">
  <Icon name="bell" size="lg" />
</CountBadge>
<CountBadge count={120} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "count", type: "number", description: "Required. Values `<= 0` render nothing." },
      {
        name: "max",
        type: "number",
        description: "Maximum number shown before `+`. Defaults to `99`.",
      },
      {
        name: "label",
        type: "string",
        description: "Accessible label announced by screen readers.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Optional anchor element; the badge overlays its top-end corner.",
      },
    ],
    demo: "web",
    preview: "Badges",
  },
  {
    slug: "banner",
    name: "Banner",
    summary: "Inline status message for a page or section.",
    guidance: [
      "Each tone uses a distinct icon shape so status does not rely on color alone.",
      "`warning` and `danger` announce assertively to screen readers; `info` and `success` announce politely.",
      "`action` adds a small secondary button beneath the message for a direct recovery or follow-up action.",
      "`onDismiss` renders a close button at the top-end corner. The banner is controlled—the handler decides whether to unmount it.",
    ],
    example: `import { Banner } from "@acme/ui";

<Banner
  tone="danger"
  title="Could not save"
  action={{ label: "Try again", onPress: save }}
  onDismiss={() => setShown(false)}
>
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
      {
        name: "action",
        type: "{ label: string; onPress: () => void }",
        description: "Small secondary button shown below the message.",
      },
      { name: "onDismiss", type: "() => void", description: "Renders a dismiss button." },
      {
        name: "dismissLabel",
        type: "string",
        description: "Accessible label for the dismiss button. Defaults to `Dismiss`.",
      },
    ],
    demo: "web",
    preview: "Banners",
  },
  {
    slug: "card",
    name: "Card",
    summary: "Elevated container for grouping related content.",
    guidance: [
      "A hairline border and subtle shadow separate the card from the page in light mode; in dark mode, the lighter surface fill provides the separation.",
      "`flush` removes internal padding and gaps—useful when wrapping edge-to-edge list rows.",
      "`media` renders full-bleed media at the top, clipped to the card's top corners.",
      "`onPress` turns the entire card into a single button with hover, pressed, and focus states. Do not nest interactive controls inside a pressable card; `actions` is ignored when `onPress` is set.",
      "`selected` replaces the hairline border with a thicker accent outline without shifting layout, and sets `aria-pressed` on pressable cards.",
    ],
    example: `import { Button, Card } from "@acme/ui";

<Card title="Weekly report" actions={<Button size="sm">Edit</Button>}>
  …
</Card>
<Card
  title="Yearly billing"
  media={<img src={cover} alt="" />}
  selected={plan === "yearly"}
  onPress={() => setPlan("yearly")}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "title", type: "string", description: "Rendered as a heading." },
      { name: "description", type: "string", description: "" },
      { name: "actions", type: "ReactNode", description: "Shown across from the title." },
      {
        name: "media",
        type: "ReactNode",
        description: "At the top of the card, edge to edge above the padding.",
      },
      { name: "flush", type: "boolean", description: "No padding and no gaps." },
      {
        name: "onPress",
        type: "() => void",
        description: "Makes the whole card one button. `actions` are not drawn then.",
      },
      {
        name: "selected",
        type: "boolean",
        description: "Outlines the card as the current choice.",
      },
      { name: "className", type: "string", description: "" },
    ],
    demo: "web",
    preview: "Card",
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
    demo: "web",
    preview: "List",
  },
  {
    slug: "spinner",
    name: "Spinner",
    summary: "Indeterminate loading indicator.",
    guidance: [
      "Inherits the surrounding text color.",
      "Provide `label` to announce loading state to assistive technology; omit it when adjacent text already describes what is loading.",
      "For operations with known progress, use `ProgressBar`.",
    ],
    example: `import { Spinner } from "@acme/ui";

<Spinner label="Loading" />`,
    exampleLanguage: "tsx",
    props: [
      { name: "size", type: '"sm" | "md" | "lg"', description: "Defaults to `md`." },
      {
        name: "label",
        type: "string",
        description: "Accessible label announced by screen readers.",
      },
    ],
    demo: "web",
    preview: "Card",
  },
  {
    slug: "switch",
    name: "Switch",
    summary: "Toggle for settings that take effect immediately.",
    guidance: [
      "For selections submitted later as part of a form, use `Checkbox`.",
      "The track maintains 3:1 contrast against the page even when off.",
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
        description: "Label beside the switch. Clicking it toggles the switch.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name when no visible label is provided.",
      },
      { name: "disabled", type: "boolean", description: "" },
    ],
    demo: "web",
    preview: "Selection",
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    summary: "Binary selection applied when a form is submitted.",
    guidance: ["For settings that take effect immediately, use `Switch`."],
    example: `import { Checkbox } from "@acme/ui";

<Checkbox label="Remember me" checked={remember} onChange={setRemember} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "checked", type: "boolean", description: "Required." },
      { name: "onChange", type: "(checked: boolean) => void", description: "Required." },
      {
        name: "label",
        type: "string",
        description: "Label beside the checkbox. Clicking it toggles the checkbox.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name when no visible label is provided.",
      },
      { name: "name", type: "string", description: "" },
      { name: "disabled", type: "boolean", description: "" },
    ],
    demo: "web",
    preview: "Selection",
  },
  {
    slug: "segmented-control",
    name: "SegmentedControl",
    summary: "Inline switcher for two to four mutually exclusive views or modes.",
    guidance: [
      "The active segment is raised with a border and shadow so selection does not rely on background contrast alone.",
      "On the web, it renders native radio inputs so arrow keys move between segments.",
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
      {
        name: "aria-label",
        type: "string",
        description: "Required. Accessible name for the group.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        description: "Expands to fill the container width.",
      },
    ],
    demo: "web",
    preview: "Selection",
  },
  {
    slug: "avatar",
    name: "Avatar",
    summary: "User or team image with automatic initials fallback.",
    guidance: [
      "Assistive technology receives the full `name` whether an image loads or not. The `sm` size displays a single initial.",
      "Initials display while the image loads and remain visible if loading fails.",
      "To display a compact group of avatars, use `AvatarStack`.",
    ],
    example: `import { Avatar } from "@acme/ui";

<Avatar name="Ada Lovelace" />
<Avatar name="Ada Lovelace" src={ada.pictureUrl} size="xl" />`,
    exampleLanguage: "tsx",
    props: [
      { name: "name", type: "string", description: "Required." },
      {
        name: "src",
        type: "string",
        description: "Image URL, cropped to fill the circle.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        description: "Defaults to `md` (`24`, `32`, `40`, or `56px`).",
      },
    ],
    demo: "web",
    preview: "Card",
  },
  {
    slug: "avatar-stack",
    name: "AvatarStack",
    summary: "Overlapping group of avatars with an overflow count.",
    guidance: [
      "Each avatar overlaps the previous one by 25% with a surface-colored ring, so place the stack on a matching surface.",
      "When `people.length` exceeds `max`, a trailing circle displays `+N` for the remaining count.",
      "Exposed to assistive technology as a single image listing every name. Pass `label` when the full list would be too verbose.",
    ],
    example: `import { AvatarStack } from "@acme/ui";

<AvatarStack
  people={[
    { name: "Ada Lovelace", src: ada.pictureUrl },
    { name: "Grace Hopper" },
    { name: "Alan Turing" },
  ]}
  max={2}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "people",
        type: "readonly { name: string; src?: string }[]",
        description: "Required. Rendered in order.",
      },
      {
        name: "max",
        type: "number",
        description: "Maximum avatars shown before `+N`. Defaults to `4`.",
      },
      { name: "size", type: '"sm" | "md" | "lg" | "xl"', description: "Defaults to `md`." },
      {
        name: "label",
        type: "string",
        description: "Custom accessible label overriding the generated list of names.",
      },
    ],
    demo: "web",
    preview: "Card",
  },
  {
    slug: "progress-bar",
    name: "ProgressBar",
    summary: "Determinate progress indicator.",
    guidance: ["For indeterminate work, use `Spinner`."],
    example: `import { ProgressBar } from "@acme/ui";

<ProgressBar label="Upload" value={0.6} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "value", type: "number", description: "Required. Progress from `0` to `1`." },
      {
        name: "label",
        type: "string",
        description: "Required. Announced alongside the percentage by screen readers.",
      },
    ],
    demo: "web",
    preview: "Card",
  },
  {
    slug: "icon",
    name: "Icon",
    summary: "SVG icon from the design system icon set, inheriting surrounding text color.",
    guidance: [
      "Icons next to text are decorative—omit `label` so screen readers skip them. Standalone icons require `label`.",
      "Use `xs` inside badges, `sm` and `md` inline with text, `lg` for standalone navigation icons (such as tab bars), and `xl` for illustrations like empty states.",
      "`filled` adds a solid fill beneath the stroke to indicate active state by shape as well as color (for example, a liked heart or saved bookmark). Use it only on closed-shape icons.",
      "Icons come from the SVG files in `design/icons`. Add a new SVG there and run `mise run tokens`.",
    ],
    example: `import { Icon } from "@acme/ui";

<Icon name="search" />
<Icon name="bell" size="lg" label="Notifications" />
<Icon name="heart" filled label="Liked" />`,
    exampleLanguage: "tsx",
    props: [
      { name: "name", type: "IconName", description: "Required. A file name in `design/icons`." },
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg" | "xl"',
        description: "Defaults to `md`. 12, 16, 20, 24 and 32 pixels.",
      },
      {
        name: "filled",
        type: "boolean",
        description: "Fills the shapes. For icons made of closed shapes.",
      },
      {
        name: "label",
        type: "string",
        description: "Names the icon for assistive technology. Without it the icon is hidden.",
      },
      {
        name: "className",
        type: "string",
        description: "`rtl:-scale-x-100` mirrors an arrow or a chevron in a right-to-left layout.",
      },
    ],
    demo: "web",
    preview: "Icons",
  },
  {
    slug: "list-row",
    name: "ListRow",
    summary: "Single row for lists, navigation, or settings screens.",
    guidance: [
      "Separate adjacent rows with `Divider` inside a `flush` `Card`.",
      "`onPress` turns the entire row into a button; do not place another interactive control in `trailing` when `onPress` is set.",
      "`selected` highlights the active row with a tinted fill, bolder title, and `aria-current`.",
      "`compact` reduces row height and text size for dense lists like menus and sidebars.",
    ],
    example: `import { Avatar, ListRow } from "@acme/ui";

<ListRow
  title="Ada Lovelace"
  description="ada@example.com"
  leading={<Avatar name="Ada Lovelace" />}
  chevron
  onPress={open}
/>
<ListRow compact title="Inbox" selected onPress={openInbox} />`,
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
      { name: "selected", type: "boolean", description: "The row that is the current choice." },
      { name: "compact", type: "boolean", description: "A shorter row with smaller text." },
      { name: "onPress", type: "() => void", description: "Makes the whole row a button." },
      { name: "disabled", type: "boolean", description: "" },
    ],
    demo: "web",
    preview: "List",
  },
  {
    slug: "icon-button",
    name: "IconButton",
    summary: "Square button displaying only an icon.",
    guidance: [
      "Use for recognizable icons in tight spaces like toolbars, list rows, or card corners. When space allows, prefer a labeled `Button`.",
      "`label` is required as the accessible name. Pair with a `Tooltip` on pointer clients so sighted users can also see the label.",
      "Shares `Button`'s variants, sizes, and states, defaulting to `ghost`.",
      "Hit area always meets the minimum target size even when the visual square is smaller.",
      "Passing `selected` enables toggle mode (`aria-pressed`), tinting and outlining `secondary` and `ghost` buttons with a filled icon.",
    ],
    example: `import { IconButton } from "@acme/ui";

<IconButton icon="settings" label="Settings" onPress={openSettings} />
<IconButton icon="pin" label="Pin" selected={pinned} onPress={() => setPinned(!pinned)} />
<IconButton icon="trash" label="Delete" variant="danger" size="sm" onPress={remove} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "icon", type: "IconName", description: "Required." },
      { name: "label", type: "string", description: "Required. Accessible name." },
      {
        name: "variant",
        type: '"primary" | "secondary" | "ghost" | "danger"',
        description: "Defaults to `ghost`.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        description: "Defaults to `md`. Icon renders at `16`, `20`, or `24px`.",
      },
      {
        name: "selected",
        type: "boolean",
        description: "Enables toggle mode and sets `aria-pressed`.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "loading",
        type: "boolean",
        description: "Replaces the icon with a spinner and disables clicks.",
      },
      { name: "onPress", type: "() => void", description: "" },
    ],
    demo: "web",
    preview: "Buttons",
  },
  {
    slug: "chip",
    name: "Chip",
    summary: "Interactive filter pill.",
    guidance: [
      "Use chips for combinable filters. Unlike `Badge`, chips are interactive toggles.",
      "Selected chips show a tinted fill, accent border, and checkmark (replacing `iconStart`) without changing height.",
      "Controlled component: pass `selected` and update it in `onPress`.",
      "Rendered as a toggle button (`aria-pressed`).",
    ],
    example: `import { Chip } from "@acme/ui";

<Chip label="Open" selected={open} onPress={() => setOpen(!open)} />
<Chip label="Tagged" iconStart="tag" selected={tagged} onPress={() => setTagged(!tagged)} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required." },
      { name: "selected", type: "boolean", description: "Defaults to `false`." },
      { name: "onPress", type: "() => void", description: "" },
      {
        name: "iconStart",
        type: "IconName",
        description: "Leading icon, replaced by a checkmark when selected.",
      },
      { name: "disabled", type: "boolean", description: "" },
    ],
    demo: "web",
    preview: "Chips",
  },
  {
    slug: "chip-bar",
    name: "ChipBar",
    summary: "Horizontally scrolling single-row container for filter chips.",
    guidance: [
      "Place above a list to hold its filter chips.",
      "Never wraps; scrolls horizontally without a visible scrollbar so content below stays aligned.",
      "Stateless layout container—selection state lives in the parent.",
      "`label` provides the accessible group name.",
    ],
    example: `import { Chip, ChipBar } from "@acme/ui";

<ChipBar label="Filter the tasks">
  <Chip label="Open" selected={open} onPress={() => setOpen(!open)} />
  <Chip label="Assigned to me" selected={mine} onPress={() => setMine(!mine)} />
</ChipBar>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "label",
        type: "string",
        description: "Required. Accessible name for the filter group.",
      },
      { name: "children", type: "ReactNode", description: "Required. `Chip` items." },
    ],
    demo: "web",
    preview: "Chips",
  },
  {
    slug: "tabs",
    name: "Tabs",
    summary: "Horizontal tab bar for switching between views within a screen.",
    guidance: [
      "For two to four short modes, `SegmentedControl` is lighter. Use `Tabs` for more items, longer labels, or horizontally scrollable navigation.",
      "The active tab displays both darker text and an underline indicator so selection does not rely on color alone.",
      "Scrolls horizontally without a visible scrollbar when tabs overflow.",
      "Renders only the tab bar; the parent renders the panel matching `value`.",
      "On the web, arrow keys move between tabs.",
    ],
    example: `import { Tabs } from "@acme/ui";

<Tabs
  label="Workspace pages"
  items={[
    { value: "overview", label: "Overview", icon: "house" },
    { value: "members", label: "Members", icon: "users" },
    { value: "billing", label: "Billing" },
  ]}
  value={page}
  onChange={setPage}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "items",
        type: "readonly { value: Value; label: string; icon?: IconName }[]",
        description: "Required.",
      },
      { name: "value", type: "Value", description: "Required. The selected tab." },
      { name: "onChange", type: "(value: Value) => void", description: "Required." },
      { name: "label", type: "string", description: "Required. Names the tab list." },
      { name: "fullWidth", type: "boolean", description: "The tabs share the width equally." },
    ],
    demo: "web",
    preview: "Tabs",
  },
  {
    slug: "menu",
    name: "Menu",
    summary: "Contextual action list anchored to a trigger control.",
    guidance: [
      "Use for secondary actions that do not need standalone buttons; keep the primary action visible outside the menu.",
      "Selecting an item runs `onSelect` and closes the menu. Clicking outside, pressing Escape, or pressing Back also closes it.",
      "Mark destructive items with `danger` and place them last after a separator.",
      "Selected items display a trailing checkmark so state does not rely on color alone.",
      "On the web, `trigger` must be a `Button` or `IconButton`. Arrow keys move focus, Enter activates an item, and focus returns to the trigger on close.",
    ],
    example: `import { IconButton, Menu } from "@acme/ui";

<Menu
  label="Report actions"
  align="end"
  trigger={<IconButton icon="ellipsis" label="Report actions" />}
  items={[
    { label: "Rename", icon: "pencil", onSelect: rename },
    { label: "Duplicate", icon: "copy", onSelect: duplicate },
    "separator",
    { label: "Delete", icon: "trash", danger: true, onSelect: remove },
  ]}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "trigger",
        type: "ReactNode",
        description: "Required. The control that opens the menu: a Button or an IconButton.",
      },
      { name: "label", type: "string", description: "Required. Names the menu." },
      {
        name: "items",
        type: 'readonly ("separator" | { label: string; icon?: IconName; onSelect: () => void; danger?: boolean; disabled?: boolean; selected?: boolean })[]',
        description: "Required.",
      },
      {
        name: "align",
        type: '"start" | "end"',
        description: "The edge of the trigger the menu lines up with. Defaults to `start`.",
      },
    ],
    demo: "web",
    preview: "Menu",
  },
  {
    slug: "dialog",
    name: "Dialog",
    summary: "Modal overlay for confirmations or focused short tasks.",
    guidance: [
      "Use when the user must make a decision before continuing. For non-blocking messages, use `Banner` or `Toast`.",
      "Frame the title as a clear question and the actions as direct answers (`Delete weekly report?`, `Cancel`, `Delete`), with the primary action last.",
      "Controlled via `open`. Pressing Escape, Back, or the backdrop calls `onClose`.",
      "Set `dismissible={false}` only when an explicit choice is required; Escape and backdrop clicks are then ignored.",
      "Traps focus while open and restores focus to the previous element on close.",
    ],
    example: `import { Button, Dialog } from "@acme/ui";

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete the weekly report?"
  description="This cannot be undone."
  actions={
    <>
      <Button onPress={() => setOpen(false)}>Cancel</Button>
      <Button variant="danger" onPress={remove}>Delete</Button>
    </>
  }
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "open", type: "boolean", description: "Required." },
      {
        name: "onClose",
        type: "() => void",
        description: "Required. Called on Escape or backdrop click.",
      },
      { name: "title", type: "string", description: "Required. Accessible dialog title." },
      { name: "description", type: "string", description: "Accessible dialog description." },
      {
        name: "children",
        type: "ReactNode",
        description: "Optional body content; scrolls if taller than the viewport.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "Action buttons aligned to the trailing edge.",
      },
      {
        name: "dismissible",
        type: "boolean",
        description: "Defaults to `true`. Set to `false` to disable Escape and backdrop dismissal.",
      },
    ],
    demo: "web",
    preview: "Dialog",
  },
  {
    slug: "toast",
    name: "Toast",
    summary: "Transient confirmation message that dismisses automatically.",
    guidance: [
      "Use to confirm a completed action, optionally with a quick follow-up such as `Undo`.",
      "Never put the only path to an action inside a toast—it disappears after a few seconds. Use `Banner` for persistent notices.",
      "Controlled via `open`; `onClose` fires when the timer expires or after the action is clicked.",
      "On the web, the auto-dismiss timer pauses while the toast is hovered or focused.",
      "Announced politely to screen readers without stealing focus.",
    ],
    example: `import { Toast } from "@acme/ui";

<Toast
  open={open}
  onClose={() => setOpen(false)}
  message="The draft was deleted."
  action={{ label: "Undo", onPress: restore }}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "open", type: "boolean", description: "Required." },
      {
        name: "onClose",
        type: "() => void",
        description: "Required. Called when the timer expires or after the action runs.",
      },
      { name: "message", type: "string", description: "Required." },
      {
        name: "action",
        type: "{ label: string; onPress: () => void }",
        description: "Optional action button; runs `onPress` then calls `onClose`.",
      },
      {
        name: "duration",
        type: "number",
        description:
          "Auto-dismiss delay in milliseconds. Defaults to `5000`; `0` disables auto-dismiss.",
      },
    ],
    demo: "web",
    preview: "Toast",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    summary: "Short text hint shown on pointer hover or keyboard focus.",
    guidance: [
      "Touch devices have no hover, so never hide essential information in a tooltip.",
      "Use on icon-only controls like `IconButton` to reveal a brief label and optional shortcut.",
      "A tooltip supplements rather than replaces an accessible name—`IconButton` still requires `label`.",
      "Appears after 500ms on hover, immediately on keyboard focus, and dismisses on pointer leave, blur, or Escape.",
      "Never place interactive elements inside a tooltip.",
    ],
    example: `import { IconButton, Tooltip } from "@acme/ui";

<Tooltip label="Search" shortcut="⌘K">
  <IconButton icon="search" label="Search" onPress={search} />
</Tooltip>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Tooltip text." },
      { name: "shortcut", type: "string", description: "Optional keyboard shortcut hint." },
      {
        name: "placement",
        type: '"top" | "bottom"',
        description: "Defaults to `top`; flips automatically when clipped.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Required. Trigger control (`Button` or `IconButton`).",
      },
    ],
    demo: "web",
    preview: "Buttons",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    summary: "Placeholder block reserving space for loading content.",
    guidance: [
      "Match the layout shape of incoming content to prevent layout shift. For actions in progress, use `Spinner`.",
      "`text` matches a line of body copy, `rect` fits media or blocks, and `circle` fits avatars.",
      "Pulses smoothly and stays static when reduced motion is enabled.",
      "Hidden from assistive technology; announce loading state once on the enclosing container.",
    ],
    example: `import { Skeleton } from "@acme/ui";

<div role="status" aria-label="Loading the report">
  <Skeleton shape="rect" height={128} />
  <Skeleton shape="circle" width={40} />
  <Skeleton />
  <Skeleton width="60%" />
</div>`,
    exampleLanguage: "tsx",
    props: [
      { name: "shape", type: '"text" | "rect" | "circle"', description: "Defaults to `text`." },
      {
        name: "width",
        type: "number | string",
        description: "A number is in pixels. A `text` line fills its row without it.",
      },
      {
        name: "height",
        type: "number | string",
        description: "A `rect` needs one. A `circle` is as tall as it is wide.",
      },
    ],
    demo: "web",
    preview: "Skeleton",
  },
  {
    slug: "search-field",
    name: "SearchField",
    summary: "Pill-shaped input for search and filtering.",
    guidance: [
      "Use for searching or filtering on-screen content. For form fields that save data, use `TextField` with a visible label.",
      "`label` is required for accessibility and is visually hidden; the leading search icon indicates the field's purpose.",
      "When non-empty, a trailing clear button resets the value and keeps focus in the input. On the web, Escape also clears the field.",
      "`onSubmit` fires on Enter or the software keyboard's search key.",
    ],
    example: `import { SearchField } from "@acme/ui";

<SearchField
  label="Search projects"
  placeholder="Search projects"
  value={query}
  onChange={setQuery}
  onSubmit={search}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "value", type: "string", description: "Required." },
      { name: "onChange", type: "(value: string) => void", description: "Required." },
      { name: "onSubmit", type: "(value: string) => void", description: "Called on Enter." },
      { name: "label", type: "string", description: "Required. The accessible name." },
      { name: "placeholder", type: "string", description: "" },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "clearLabel",
        type: "string",
        description: "Names the control that empties the field. Defaults to `Clear`.",
      },
    ],
    demo: "web",
    preview: "Text fields",
  },
  {
    slug: "radio-group",
    name: "RadioGroup",
    summary: "Single-choice selection from a small set of visible options.",
    guidance: [
      "Use for two to six options that should all remain visible. For immediate mode switching among two to four options, use `SegmentedControl`; for longer lists, use `Select`.",
      "`label` renders as the group's visible legend and accessible name.",
      "The selected option shows a thicker ring and center dot. The entire option row—including its description—is clickable.",
      "`error` renders below the options and is announced to screen readers. Clear it when the selection changes.",
      "On the web, options render as native radio inputs with arrow-key navigation.",
    ],
    example: `import { RadioGroup } from "@acme/ui";

<RadioGroup
  label="Delivery"
  options={[
    { value: "standard", label: "Standard", description: "Three to five working days." },
    { value: "express", label: "Express", description: "The next working day." },
  ]}
  value={delivery}
  onChange={setDelivery}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. The visible legend." },
      {
        name: "options",
        type: "readonly { value: Value; label: string; description?: string }[]",
        description: "Required.",
      },
      {
        name: "value",
        type: "Value | undefined",
        description: "The chosen option. Leave it out while nothing is chosen.",
      },
      { name: "onChange", type: "(value: Value) => void", description: "Required." },
      { name: "disabled", type: "boolean", description: "Disables the whole group." },
      {
        name: "error",
        type: "string | undefined",
        description: "Shown under the options and announced.",
      },
      { name: "name", type: "string", description: "The name the choice is submitted under." },
    ],
    demo: "web",
    preview: "Selection",
  },
  {
    slug: "select",
    name: "Select",
    summary: "Dropdown field for choosing one option from a long list.",
    guidance: [
      "When closed, it matches `TextField` with a visible label and a description or error beneath the box.",
      "When opened, the listbox matches the trigger width and marks the active option with a checkmark.",
      "Selecting an option calls `onChange` and closes the list; clicking outside or pressing Escape also closes it.",
      "Exposes listbox ARIA state. On the web, arrow keys navigate options, typing jumps by prefix, and Enter selects.",
      "For two to six options that should stay visible, use `RadioGroup`.",
    ],
    example: `import { Select } from "@acme/ui";

<Select
  label="Country"
  placeholder="Choose a country"
  options={[
    { value: "fr", label: "France" },
    { value: "kr", label: "Korea" },
  ]}
  value={country}
  onChange={setCountry}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Always visible." },
      {
        name: "options",
        type: "readonly { value: Value; label: string; description?: string }[]",
        description: "Required. A description shows under the label in the list only.",
      },
      {
        name: "value",
        type: "Value | undefined",
        description: "The chosen option. Leave it out while nothing is chosen.",
      },
      { name: "onChange", type: "(value: Value) => void", description: "Required." },
      { name: "placeholder", type: "string", description: "Shown while nothing is chosen." },
      {
        name: "description",
        type: "string",
        description: "Help under the field, replaced by `error` while there is one.",
      },
      { name: "error", type: "string | undefined", description: "" },
      { name: "name", type: "string", description: "The name the choice is submitted under." },
      { name: "disabled", type: "boolean", description: "" },
    ],
    demo: "web",
    preview: "Controls",
  },
  {
    slug: "date-picker",
    name: "DatePicker",
    summary: "Single-date calendar picker field.",
    guidance: [
      "When closed, it resembles `Select` and displays the selected date in the locale's medium format (for example, `Mar 10, 2026`), or `placeholder` when empty.",
      "Opening shows a single-month calendar focused on the selected date (or today, clamped to `min`/`max`). Out-of-range dates are dimmed and disabled; today shows a ring and the selected date a filled circle.",
      "Selecting a date calls `onChange` with `YYYY-MM-DD` and closes the calendar. Clicking outside or pressing Escape dismisses without changing the value and returns focus to the field.",
      "In the calendar, arrow keys move by day or week, Page Up/Page Down move by month (with Shift for year), and Home/End jump to the start or end of the month within `min`/`max`. Tab cycles between the month buttons and the focused day.",
      "Month names, weekday names, date formatting, and the first day of the week follow the page locale on web and the system locale on GPUI, Compose, and React Native. For date ranges, use `DateRangePicker`. Direct text input and month/year zoom views are not supported.",
    ],
    example: `import { DatePicker } from "@acme/ui";

<DatePicker
  label="Due date"
  value={due}
  onChange={setDue}
  min="2026-03-05"
  max="2026-04-20"
  description="Within the current sprint."
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Always visible." },
      {
        name: "value",
        type: "string | undefined",
        description: "The chosen day, as `YYYY-MM-DD`. Leave it out while none is chosen.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        description: "Required. Gets the chosen day as `YYYY-MM-DD`.",
      },
      { name: "min", type: "string", description: "The first day that can be chosen." },
      { name: "max", type: "string", description: "The last day that can be chosen." },
      { name: "placeholder", type: "string", description: "Shown while no day is chosen." },
      {
        name: "description",
        type: "string",
        description: "Help under the field, replaced by `error` while there is one.",
      },
      { name: "error", type: "string | undefined", description: "" },
      {
        name: "name",
        type: "string",
        description: "The name the day is submitted under, as `YYYY-MM-DD`.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "previousLabel",
        type: "string",
        description:
          "Names the button to the month before for assistive technology. Defaults to `Previous month`.",
      },
      {
        name: "nextLabel",
        type: "string",
        description:
          "Names the button to the month after for assistive technology. Defaults to `Next month`.",
      },
    ],
    demo: "web",
    preview: "Controls",
  },
  {
    slug: "date-range-picker",
    name: "DateRangePicker",
    summary: "Calendar picker for selecting a start and end date range.",
    guidance: [
      "Use for stays, trips, or leave ranges where both endpoints are picked together. When closed, it formats both dates cleanly, collapsing shared months or years (for example, `Mar 10 – 14, 2026`).",
      "Opening shows two side-by-side months when space permits (or one on narrow viewports) beneath a summary bar labeled with `startLabel` and `endLabel`.",
      "The first click sets the start date and previews the span as you hover or move focus; the second click sets the end date, fires `onChange` once with `{ start, end }` in `YYYY-MM-DD`, and closes the calendar. Clicking a date before the start resets the start there.",
      "`minLength` and `maxLength` constrain the day span between start and end (for example, nights of a stay) and disable invalid end dates while picking. With no `minLength`, picking the same day twice creates a single-day range.",
      "Escape or clicking outside cancels an incomplete selection and keeps the previous range. Keyboard navigation matches `DatePicker`, with Page Up/Page Down shifting by one month regardless of how many months are visible.",
      'Blocked individual dates inside bounds, manual text entry, and preset shortcuts (such as "Next week") are not included.',
    ],
    example: `import { DateRangePicker } from "@acme/ui";

<DateRangePicker
  label="Stay"
  value={stay}
  onChange={setStay}
  min="2026-03-05"
  max="2026-04-20"
  minLength={2}
  maxLength={14}
  startLabel="Check-in"
  endLabel="Check-out"
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Always visible." },
      {
        name: "value",
        type: "{ start: string; end: string } | undefined",
        description:
          "The chosen range, both days as `YYYY-MM-DD`. Leave it out while none is chosen.",
      },
      {
        name: "onChange",
        type: "(value: { start: string; end: string }) => void",
        description: "Required. Gets the range once its end is chosen, not the start alone.",
      },
      { name: "min", type: "string", description: "The first day that can be chosen." },
      { name: "max", type: "string", description: "The last day that can be chosen." },
      {
        name: "minLength",
        type: "number",
        description:
          "The fewest days from the start to the end. Defaults to 0, a range of one day.",
      },
      {
        name: "maxLength",
        type: "number",
        description: "The most days from the start to the end. No limit unless it is given.",
      },
      { name: "placeholder", type: "string", description: "Shown while no range is chosen." },
      {
        name: "description",
        type: "string",
        description: "Help under the field, replaced by `error` while there is one.",
      },
      { name: "error", type: "string | undefined", description: "" },
      {
        name: "startName",
        type: "string",
        description: "The name the first day is submitted under, as `YYYY-MM-DD`.",
      },
      {
        name: "endName",
        type: "string",
        description: "The name the last day is submitted under, as `YYYY-MM-DD`.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "startLabel",
        type: "string",
        description:
          "Names the first day in the summary and for assistive technology. Defaults to `Start`.",
      },
      {
        name: "endLabel",
        type: "string",
        description: "Names the last day, as `startLabel` does the first. Defaults to `End`.",
      },
      {
        name: "previousLabel",
        type: "string",
        description:
          "Names the button to the month before for assistive technology. Defaults to `Previous month`.",
      },
      {
        name: "nextLabel",
        type: "string",
        description:
          "Names the button to the month after for assistive technology. Defaults to `Next month`.",
      },
    ],
    demo: "web",
    preview: "Controls",
  },
  {
    slug: "slider",
    name: "Slider",
    summary: "Range control for picking a numeric value along a track.",
    guidance: [
      "Use when relative position matters more than an exact figure (such as volume). For precise numeric input, use `TextField`.",
      "Clicking the track jumps the thumb to that position; values snap to `step`.",
      "`showValue` displays the current numeric value at the trailing end of the label row.",
      "Exposes slider ARIA attributes (`min`, `max`, `value`), with arrow keys adjusting by one step.",
    ],
    example: `import { Slider } from "@acme/ui";

<Slider label="Volume" value={volume} onChange={setVolume} showValue />
<Slider label="Font size" min={12} max={24} step={2} value={size} onChange={setSize} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Shown above the track." },
      { name: "value", type: "number", description: "Required." },
      { name: "onChange", type: "(value: number) => void", description: "Required." },
      { name: "min", type: "number", description: "Defaults to 0." },
      { name: "max", type: "number", description: "Defaults to 100." },
      { name: "step", type: "number", description: "Defaults to 1." },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "showValue",
        type: "boolean",
        description: "Shows the current value at the end of the label's line.",
      },
    ],
    demo: "web",
    preview: "Controls",
  },
  {
    slug: "thumbnail",
    name: "Thumbnail",
    summary: "Fixed-aspect-ratio image container for videos, articles, or products.",
    guidance: [
      "Fills the available width and derives height from `ratio`, cropping the image to cover.",
      "Displays an image placeholder while loading, on error, or when `src` is omitted.",
      "Pass descriptive `alt` text, or an empty string when adjacent text already describes the image.",
      "`badge` renders a short overlay label (such as duration) in the bottom-end corner; `progress` draws a watch-progress bar along the bottom edge.",
    ],
    example: `import { Thumbnail } from "@acme/ui";

<Thumbnail src={video.poster} alt="" badge="12:04" progress={0.35} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "src", type: "string | undefined", description: "Image URL." },
      {
        name: "alt",
        type: "string",
        description: 'Required. Image description; pass `""` for decorative thumbnails.',
      },
      {
        name: "ratio",
        type: '"16:9" | "1:1" | "4:3" | "9:16"',
        description: "Aspect ratio. Defaults to `16:9`.",
      },
      { name: "badge", type: "string", description: "Short overlay text such as duration." },
      {
        name: "progress",
        type: "number",
        description: "Value from `0` to `1` (`0` hides the bar). Shifts `badge` upward when shown.",
      },
    ],
    demo: "web",
    preview: "Media",
  },
  {
    slug: "media-card",
    name: "MediaCard",
    summary: "Thumbnail paired with a title and metadata for feeds or lists.",
    guidance: [
      "`vertical` stacks the thumbnail on top; `horizontal` places it at the leading edge at 40% width.",
      "Titles clamp to two lines and each `meta` entry clamps to one line with ellipsis.",
      "With `onPress`, the entire card acts as a single button with no resting surface fill.",
      "`action` remains an independent control (such as `IconButton` or `Menu`)—activating it does not trigger `onPress`.",
      "`leading` (typically an `Avatar`) renders only in `vertical` layout.",
    ],
    example: `import { Avatar, IconButton, MediaCard } from "@acme/ui";

<MediaCard
  src={video.poster}
  title={video.title}
  meta={[video.channel, "12K views · 3 days ago"]}
  badge="12:04"
  leading={<Avatar name={video.channel} src={video.avatar} />}
  action={<IconButton icon="ellipsis-vertical" label="More actions" onPress={openMenu} />}
  onPress={play}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "layout",
        type: '"vertical" | "horizontal"',
        description: "Defaults to `vertical`.",
      },
      { name: "src", type: "string | undefined", description: "As a Thumbnail's." },
      {
        name: "alt",
        type: "string",
        description: "Defaults to an empty string: the title already says what the picture is.",
      },
      {
        name: "ratio",
        type: '"16:9" | "1:1" | "4:3" | "9:16"',
        description: "Defaults to `16:9`.",
      },
      { name: "badge", type: "string", description: "As a Thumbnail's." },
      { name: "progress", type: "number", description: "As a Thumbnail's." },
      { name: "title", type: "string", description: "Required. Two lines at most." },
      { name: "meta", type: "readonly string[]", description: "Short details, one line each." },
      {
        name: "leading",
        type: "ReactNode",
        description: "Before the text in the vertical layout, such as an Avatar.",
      },
      {
        name: "action",
        type: "ReactNode",
        description: "At the end of the text: an IconButton or a Menu.",
      },
      { name: "onPress", type: "() => void", description: "Makes the whole card one button." },
    ],
    demo: "web",
    preview: "Media",
  },
  {
    slug: "section-header",
    name: "SectionHeader",
    summary: "Heading row introducing a content section, with an optional trailing action.",
    guidance: [
      "Renders the title as a heading at `level` (`h1`–`h6`). Choose `level` for document structure rather than visual size.",
      "`action` renders a compact `ghost` button with a trailing chevron (such as `See all`) that mirrors automatically in RTL layouts.",
    ],
    example: `import { SectionHeader } from "@acme/ui";

<SectionHeader
  title="Continue watching"
  description="Pick up where you left off."
  action={{ label: "See all", onPress: openHistory }}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "title", type: "string", description: "Required." },
      { name: "description", type: "string", description: "A line under the title." },
      { name: "icon", type: "IconName", description: "Before the title." },
      {
        name: "action",
        type: "{ label: string; onPress: () => void }",
        description: "A `ghost` `sm` Button with a chevron at its end.",
      },
      { name: "level", type: "1 | 2 | 3 | 4 | 5 | 6", description: "Defaults to 2." },
    ],
    demo: "web",
    preview: "Media",
  },
  {
    slug: "empty-state",
    name: "EmptyState",
    summary: "Centered placeholder shown when a view has no content.",
    guidance: [
      "State what is missing in `title`, and explain why or what will appear in `description`.",
      "Include at most one primary action to help populate the view.",
      "Centers within its container (up to dialog width); the icon is decorative.",
    ],
    example: `import { Button, EmptyState } from "@acme/ui";

<EmptyState
  icon="mail"
  title="No messages yet"
  description="When someone writes to you, the conversation shows up here."
  action={<Button variant="primary" iconStart="plus" onPress={compose}>New message</Button>}
/>`,
    exampleLanguage: "tsx",
    props: [
      { name: "icon", type: "IconName", description: "Required. Rendered at `xl` size." },
      { name: "title", type: "string", description: "Required." },
      { name: "description", type: "string", description: "" },
      {
        name: "action",
        type: "ReactNode",
        description: "Optional call to action, typically a `Button`.",
      },
    ],
    demo: "web",
    preview: "Empty state",
  },
  {
    slug: "accordion",
    name: "Accordion",
    summary: "Collapsible list of sections that expand inline under their headers.",
    guidance: [
      "Use for FAQs or secondary settings read one at a time; avoid hiding essential content inside an accordion.",
      "Only one item stays open at a time unless `multiple` is enabled. `expanded` is controlled by the parent.",
      "The chevron flips when expanded so state does not rely on color. Height animations are disabled when reduced motion is enabled.",
      "Each header is a button exposing `aria-expanded` and `aria-controls`.",
    ],
    example: `import { Accordion } from "@acme/ui";

<Accordion
  items={[
    { value: "cancel", title: "Can I cancel at any time?", content: "Yes." },
    { value: "seats", title: "How are seats counted?", content: "One per person." },
  ]}
  expanded={open}
  onChange={setOpen}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "items",
        type: "readonly { value: Value; title: string; description?: string; content: ReactNode }[]",
        description: "Required.",
      },
      {
        name: "expanded",
        type: "readonly Value[]",
        description: "Required. Values of currently expanded items.",
      },
      { name: "onChange", type: "(expanded: Value[]) => void", description: "Required." },
      {
        name: "multiple",
        type: "boolean",
        description: "Allow multiple items to be expanded simultaneously. Defaults to `false`.",
      },
    ],
    demo: "web",
    preview: "Accordion",
  },
  {
    slug: "sidebar",
    name: "Sidebar",
    summary: "Top-level navigation rail for pointer-oriented apps.",
    guidance: [
      "Pointer counterpart to `TabBar` on touch clients.",
      "The active destination is tinted with a bolder label and a filled icon; use closed-shape icons for sidebar items.",
      "`count` displays a muted item count. For unread alerts, place a `CountBadge` where it stays prominent.",
      "`collapsed` shrinks the sidebar to an icon rail with tooltips. Collapse state is controlled by the app; `header` and `footer` should handle narrow widths.",
      'Rendered as a `<nav>` landmark named by `label`, with `aria-current="page"` on the active item.',
    ],
    example: `import { Sidebar } from "@acme/ui";

<Sidebar
  label="Main"
  sections={[
    { items: [{ value: "home", label: "Home", icon: "house" }] },
    { title: "Library", items: [{ value: "saved", label: "Saved", icon: "bookmark", count: 12 }] },
  ]}
  value={place}
  onChange={setPlace}
  collapsed={narrow}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "sections",
        type: "readonly { title?: string; items: readonly { value: Value; label: string; icon: IconName; count?: number }[] }[]",
        description:
          "Required. Section titles collapse into hairline dividers when `collapsed` is set.",
      },
      { name: "value", type: "Value", description: "Required. Active destination." },
      { name: "onChange", type: "(value: Value) => void", description: "Required." },
      {
        name: "label",
        type: "string",
        description: "Required. Accessible navigation landmark label.",
      },
      { name: "collapsed", type: "boolean", description: "Renders as a compact icon rail." },
      {
        name: "header",
        type: "ReactNode",
        description: "Optional top slot (for example, app title or switcher).",
      },
      {
        name: "footer",
        type: "ReactNode",
        description: "Optional bottom slot (for example, account row).",
      },
    ],
    demo: "web",
    preview: "Sidebar",
  },
  {
    slug: "top-bar",
    name: "TopBar",
    summary: "Navigation header showing the current screen title and optional back button.",
    guidance: [
      'The default `solid` surface matches the page background. With `surface="glass"`, give trailing actions an opaque fill.',
      "Place inside the top safe area so it does not overlap the status bar.",
    ],
    example: `import { Button, TopBar } from "@acme/ui-native";

<TopBar
  title="Settings"
  onBack={goBack}
  trailing={<Button variant="ghost" label="Edit" onPress={edit} />}
/>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "surface",
        type: '"solid" | "glass"',
        description:
          "Defaults to `solid`. `glass` samples a sibling `GlassBackdrop` inside a `GlassScene`.",
      },
      { name: "title", type: "string", description: "Required." },
      { name: "onBack", type: "() => void", description: "Renders a circular back button." },
      {
        name: "backLabel",
        type: "string",
        description: "Accessible label for the back button. Defaults to `Back`.",
      },
      {
        name: "trailing",
        type: "ReactNode",
        description: "Optional trailing action such as a ghost button.",
      },
    ],
    demo: "native",
  },
  {
    slug: "tab-bar",
    name: "TabBar",
    summary: "Floating bottom navigation bar for top-level destinations on touch clients.",
    guidance: [
      "Use for three to five top-level destinations.",
      "Floats as a capsule above the bottom edge; apply horizontal and bottom margins inside the safe area.",
      "The active tab sits inside its own pill indicator so selection does not rely on color alone.",
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
        name: "surface",
        type: '"solid" | "glass"',
        description:
          "Defaults to `solid`. `glass` samples a sibling `GlassBackdrop` inside a `GlassScene`.",
      },
      {
        name: "items",
        type: "readonly { key: Key; label: string; icon: (color: string) => ReactNode }[]",
        description: "Required. Icons render at 24pt above each label.",
      },
      { name: "value", type: "Key", description: "Required." },
      { name: "onChange", type: "(key: Key) => void", description: "Required." },
    ],
    demo: "native",
  },
  {
    slug: "bottom-sheet",
    name: "BottomSheet",
    summary: "Floating modal sheet that slides up from the bottom for short tasks or action lists.",
    guidance: [
      "Floats inset from the screen edges with all four corners rounded.",
      "Dismisses on backdrop tap, downward drag, or the system back button.",
    ],
    example: `import { BottomSheet, Button } from "@acme/ui-native";

<BottomSheet open={open} onClose={() => setOpen(false)} title="Share report">
  <Button variant="primary" label="Copy link" onPress={copy} fullWidth />
</BottomSheet>`,
    exampleLanguage: "tsx",
    props: [
      {
        name: "surface",
        type: '"solid" | "glass"',
        description:
          "Defaults to `solid`. `glass` samples a sibling `GlassBackdrop` inside a `GlassScene`.",
      },
      { name: "open", type: "boolean", description: "Required." },
      {
        name: "onClose",
        type: "() => void",
        description: "Required. Called when the sheet is dismissed.",
      },
      { name: "title", type: "string", description: "" },
      {
        name: "closeLabel",
        type: "string",
        description: "Accessible label for the dismiss scrim. Defaults to `Close`.",
      },
    ],
    demo: "native",
  },
];
