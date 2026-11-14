// What the component pages say. The prop tables describe the web components in packages/ui;
// the other platforms take the same options under their own naming. `generate.ts` checks that
// every source file and design preview section named here exists, so a renamed or removed
// component fails the build.

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
   * Source file per platform. Touch-only components have no web or GPUI entry, and
   * pointer-only ones no React Native or Compose entry.
   */
  sources: { web?: string; gpui?: string; reactNative?: string; compose?: string };
  /** The live example at /demo/<slug>/. Touch-only components have none. */
  demo: boolean;
  /**
   * The section of the web design preview (apps/web/src/DesignPreview.tsx) that shows it, by
   * title. Every component with a web version names one; touch-only components have none.
   */
  preview?: string;
};

const web = (file: string) => `packages/ui/src/${file}.tsx`;
const native = (file: string) => `packages/ui-native/src/${file}.tsx`;
const compose = (file: string) => `kotlin/ui/src/commonMain/kotlin/acme/ui/${file}.kt`;
const GPUI_COMPONENTS = "crates/acme-ui/src/components.rs";
const GPUI_CONTROLS = "crates/acme-ui/src/controls.rs";
const GPUI_OVERLAYS = "crates/acme-ui/src/overlays.rs";

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
      "`iconStart` and `iconEnd` draw an icon beside the label, in the label's color. A button with an icon and no label is a square: name it with `aria-label`.",
      "Giving `selected` makes the button a toggle that reports its state to assistive technology. A selected `secondary` or `ghost` button is tinted and outlined and its `iconStart` is filled, so the state does not depend on color. `primary` and `danger` keep their look.",
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
        description: "Defaults to `md`. The heights depend on the input device.",
      },
      {
        name: "iconStart",
        type: "IconName",
        description: "An icon in front of the label. 16 pixels, or 20 in a `lg` button.",
      },
      { name: "iconEnd", type: "IconName", description: "An icon after the label." },
      {
        name: "selected",
        type: "boolean",
        description:
          "Given at all, the button is a toggle and sets `aria-pressed`. `true` draws a `secondary` or `ghost` button selected.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "loading",
        type: "boolean",
        description:
          "Shows a spinner and ignores presses. The label stays and the spinner stands where `iconStart` was, so the button keeps its width.",
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
      {
        name: "children",
        type: "ReactNode",
        description: "The label. Leave it out for a button that holds only an icon.",
      },
    ],
    sources: everywhere("Button", GPUI_COMPONENTS),
    demo: true,
    preview: "Buttons",
  },
  {
    slug: "text-field",
    name: "TextField",
    summary: "A labelled text field, of one line or several.",
    guidance: [
      "Always give it a visible label. Placeholder text is not a substitute: it disappears as soon as the person types.",
      "An error replaces the description, turns the border red and makes it thicker.",
      "Clear `error` as soon as the person edits the value. An invalid field blocks its form from being submitted, so an error left in place would block the corrected value too.",
      "`leading` and `trailing` put an icon, a unit or a small button inside the box. They take the placeholder's color unless they set their own, and the box keeps its height.",
      "`multiline` makes a text area `rows` lines tall that scrolls beyond that. Slots line up with its first line.",
      "`maxLength` stops the field at that many characters and counts them under its end edge, on the same line as the description or the error.",
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
    sources: everywhere("TextField", GPUI_COMPONENTS),
    demo: true,
    preview: "Text fields",
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
    preview: "Typography",
  },
  {
    slug: "badge",
    name: "Badge",
    summary: "A short status or category.",
    guidance: [
      "The words carry the meaning and the color only reinforces it, so a badge still reads for someone who cannot tell the tones apart.",
      '`dot` adds a small mark for live states such as "connected", and `icon` a drawing in front of the words.',
      "`overlay` is for a badge that sits on a picture: translucent black with white text, the same in both color modes.",
      "For a number of things waiting, use a CountBadge.",
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
        description: "Drawn 12 pixels wide before the label, after the dot when there is one.",
      },
    ],
    sources: everywhere("Badge", GPUI_COMPONENTS),
    demo: true,
    preview: "Badges",
  },
  {
    slug: "count-badge",
    name: "CountBadge",
    summary: "A count on an icon, an avatar or a button: unread messages, items in a cart.",
    guidance: [
      "Around a child it sits on the child's top end corner, overlapping it, and follows the layout direction. On its own it is laid out inline, as at the end of a list row.",
      "A count of zero or less draws no badge. A count above `max` reads `99+`.",
      'Say what is counted with `label`, such as "3 unread notifications". Without it assistive technology reads the number alone.',
    ],
    example: `import { CountBadge, Icon } from "@acme/ui";

<CountBadge count={3} label="3 unread notifications">
  <Icon name="bell" size="lg" />
</CountBadge>
<CountBadge count={120} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "count", type: "number", description: "Required. Zero or less draws no badge." },
      { name: "max", type: "number", description: "The largest number shown. Defaults to 99." },
      { name: "label", type: "string", description: "What a screen reader says." },
      {
        name: "children",
        type: "ReactNode",
        description: "What the count belongs to. The badge sits on its top end corner.",
      },
    ],
    sources: everywhere("CountBadge", GPUI_COMPONENTS),
    demo: true,
    preview: "Badges",
  },
  {
    slug: "banner",
    name: "Banner",
    summary: "A message about the whole view or a section of it.",
    guidance: [
      "Each tone has its own mark shape, so the tone does not depend on color.",
      "`warning` and `danger` interrupt a screen reader. `info` and `success` wait their turn.",
      "`action` adds one small secondary button under the message, for the thing the person can do about it.",
      "`onDismiss` adds a close control at the top end. The banner does not hide itself: the handler decides what happens to it.",
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
        description: "A small secondary button under the message.",
      },
      { name: "onDismiss", type: "() => void", description: "Shows a close control." },
      {
        name: "dismissLabel",
        type: "string",
        description: "What a screen reader says for the close control. Defaults to `Dismiss`.",
      },
    ],
    sources: everywhere("Banner", GPUI_COMPONENTS),
    demo: true,
    preview: "Banners",
  },
  {
    slug: "card",
    name: "Card",
    summary: "A surface that groups related content.",
    guidance: [
      "A hairline border and a subtle shadow separate it from the page. In dark mode, where shadows barely show, the lighter fill does that.",
      "`flush` removes the padding, for a card that holds a list whose rows run edge to edge.",
      "`media` puts a picture at the top, edge to edge and clipped to the card's top corners.",
      "`onPress` makes the whole card one button, with a focus ring and its own hover and pressed fills. Put no other control inside it; it takes no `actions`.",
      "`selected` replaces the hairline with a thicker accent outline without changing the card's size, so the state does not depend on color. Given at all on a pressable card, it also sets `aria-pressed`.",
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
    sources: everywhere("Card", GPUI_COMPONENTS),
    demo: true,
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
    sources: {
      web: web("Divider"),
      gpui: GPUI_COMPONENTS,
      reactNative: native("Card"),
      compose: compose("Card"),
    },
    demo: true,
    preview: "List",
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
    sources: everywhere("Spinner", GPUI_CONTROLS),
    demo: true,
    preview: "Card",
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
    preview: "Selection",
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
    preview: "Selection",
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
    preview: "Selection",
  },
  {
    slug: "avatar",
    name: "Avatar",
    summary: "Stands for a person or a team by a picture, or by their initials when there is none.",
    guidance: [
      "Assistive technology gets the full name, with or without a picture. The small size has room for one letter.",
      "The initials show while the picture loads, and stay if it fails.",
      "For several people in the room of one, use an AvatarStack.",
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
        description: "The URL of a picture. It fills the circle, cropped to cover.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        description: "Defaults to `md`. 24, 32, 40 and 56 pixels.",
      },
    ],
    sources: everywhere("Avatar", GPUI_CONTROLS),
    demo: true,
    preview: "Card",
  },
  {
    slug: "avatar-stack",
    name: "AvatarStack",
    summary: "Several people in the room of one: overlapping avatars, and a count of the rest.",
    guidance: [
      "Each avatar covers a quarter of the one before it, with a ring in the color of the surface between them, so put the stack on a surface.",
      "When there are more people than `max`, a last circle counts those that did not fit.",
      "Assistive technology gets one image named after everyone in it. Give a `label` when the list of names would be too long to listen to.",
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
        description: "Required. In the order they are drawn.",
      },
      { name: "max", type: "number", description: "How many avatars to draw. Defaults to 4." },
      { name: "size", type: '"sm" | "md" | "lg" | "xl"', description: "Defaults to `md`." },
      {
        name: "label",
        type: "string",
        description: "Replaces the list of names that a screen reader says.",
      },
    ],
    sources: everywhere("AvatarStack", GPUI_CONTROLS),
    demo: true,
    preview: "Card",
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
    preview: "Card",
  },
  {
    slug: "icon",
    name: "Icon",
    summary: "A drawing from the icon set, in the color of the text around it.",
    guidance: [
      "An icon beside a label is decoration: leave `label` out and assistive technology skips it. An icon that stands alone needs a `label`.",
      "`xs` fits inside a badge, `sm` and `md` sit beside text, `lg` stands alone, as in a tab bar, and `xl` illustrates, as in an empty state.",
      "`filled` marks a selected state by form, so the state does not depend on color alone: a heart that was pressed, a bookmark that is saved. Use it only on icons made of closed shapes.",
      "The icons are the SVG files in `design/icons`. Add one there and run `mise run tokens`.",
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
    sources: everywhere("Icon", GPUI_CONTROLS),
    demo: true,
    preview: "Icons",
  },
  {
    slug: "list-row",
    name: "ListRow",
    summary: "One line of a list or a settings screen.",
    guidance: [
      "Separate rows with a Divider, inside a `flush` Card.",
      "`onPress` makes the whole row a button. Do not put another control in `trailing` then.",
      "`selected` marks the row that is the current choice: tinted, with a heavier title, and reported with `aria-current`.",
      "`compact` is a shorter row with smaller text, for dense lists such as a sidebar or a menu.",
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
    sources: everywhere("ListRow", GPUI_CONTROLS),
    demo: true,
    preview: "List",
  },
  {
    slug: "icon-button",
    name: "IconButton",
    summary: "A button that holds only an icon.",
    guidance: [
      "Use it where the icon is familiar and room is short: a toolbar, the end of a row, the corner of a card. Where there is room, a Button with a label is clearer.",
      "`label` is required. It is the accessible name, since there is no visible text. Add a Tooltip on pointer clients so that people who see the icon can read the name too.",
      "It takes Button's variants, sizes and states. The default variant is `ghost`.",
      "It is a square as tall as a Button of its size. Its pressable area is never smaller than the minimum target, even when the square is.",
      "Giving `selected` makes it a toggle. A selected `secondary` or `ghost` icon button is tinted and outlined and its icon is filled.",
    ],
    example: `import { IconButton } from "@acme/ui";

<IconButton icon="settings" label="Settings" onPress={openSettings} />
<IconButton icon="pin" label="Pin" selected={pinned} onPress={() => setPinned(!pinned)} />
<IconButton icon="trash" label="Delete" variant="danger" size="sm" onPress={remove} />`,
    exampleLanguage: "tsx",
    props: [
      { name: "icon", type: "IconName", description: "Required." },
      { name: "label", type: "string", description: "Required. The accessible name." },
      {
        name: "variant",
        type: '"primary" | "secondary" | "ghost" | "danger"',
        description: "Defaults to `ghost`.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        description: "Defaults to `md`. The icon is 16, 20 or 24 pixels.",
      },
      {
        name: "selected",
        type: "boolean",
        description: "Given at all, the button is a toggle and sets `aria-pressed`.",
      },
      { name: "disabled", type: "boolean", description: "" },
      {
        name: "loading",
        type: "boolean",
        description: "Shows a spinner in the icon's place and ignores presses.",
      },
      { name: "onPress", type: "() => void", description: "" },
    ],
    sources: everywhere("IconButton", GPUI_COMPONENTS),
    demo: true,
    preview: "Buttons",
  },
  {
    slug: "chip",
    name: "Chip",
    summary: "A choice that filters what is shown.",
    guidance: [
      "Use chips for filters that can be combined. Unlike a Badge, a chip is pressed.",
      "A selected chip is tinted, outlined and marked with a check, which takes the place of `iconStart`. The state does not depend on color, and selecting does not change the chip's height.",
      "The chip holds no state: pass `selected` and change it in `onPress`.",
      "It is a toggle button, so assistive technology hears whether it is pressed.",
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
        description: "An icon in front of the label. A selected chip shows a check instead.",
      },
      { name: "disabled", type: "boolean", description: "" },
    ],
    sources: everywhere("Chip", GPUI_CONTROLS),
    demo: true,
    preview: "Chips",
  },
  {
    slug: "chip-bar",
    name: "ChipBar",
    summary: "One row of chips that scrolls sideways.",
    guidance: [
      "Put the filters of a list in it, above the list.",
      "The row never wraps. When the chips do not fit it scrolls sideways, without a visible scroll bar, so the content under it stays where it is.",
      "The bar holds no state: which chips are selected is the app's business.",
      "`label` names the group for assistive technology.",
    ],
    example: `import { Chip, ChipBar } from "@acme/ui";

<ChipBar label="Filter the tasks">
  <Chip label="Open" selected={open} onPress={() => setOpen(!open)} />
  <Chip label="Assigned to me" selected={mine} onPress={() => setMine(!mine)} />
</ChipBar>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. Says what the chips filter." },
      { name: "children", type: "ReactNode", description: "Required. The chips." },
    ],
    sources: everywhere("ChipBar", GPUI_CONTROLS),
    demo: true,
    preview: "Chips",
  },
  {
    slug: "tabs",
    name: "Tabs",
    summary: "Switches between views inside one screen.",
    guidance: [
      "For two to four short modes a SegmentedControl is lighter. Tabs are for more items, longer labels, or a row that may have to scroll.",
      "The selected tab is underlined as well as darker, so the choice does not depend on color.",
      "The row scrolls sideways when the tabs do not fit, without a visible scroll bar.",
      "The component is only the row. The app shows the view that matches `value`.",
      "On the web the arrow keys move between tabs.",
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
    sources: everywhere("Tabs", GPUI_CONTROLS),
    demo: true,
    preview: "Tabs",
  },
  {
    slug: "menu",
    name: "Menu",
    summary: "A list of actions that opens from a control.",
    guidance: [
      "Use it for actions that do not deserve a button of their own. Keep the most used action outside the menu.",
      "With a pointer it is a popup under its trigger. With touch the same items open in a BottomSheet titled with `label`.",
      "Choosing an item calls its `onSelect` and closes the menu. A press outside, Escape or Back closes it too.",
      "Mark an action that destroys something with `danger` and put it last, after a separator.",
      "A `selected` item shows a check at its end, so the state does not depend on color.",
      "On the web the trigger has to be a Button or an IconButton. It reports that it opens a menu and whether the menu is open; the arrow keys move the highlight, Enter chooses, and focus returns to the trigger on close.",
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
    sources: everywhere("Menu", GPUI_OVERLAYS),
    demo: true,
    preview: "Menu",
  },
  {
    slug: "dialog",
    name: "Dialog",
    summary: "A window that interrupts the screen for a confirmation or a short task.",
    guidance: [
      "Use it when the person has to decide before going on. For a message that needs no answer, use a Banner or a Toast.",
      "Word the title as the question and the actions as its answers: `Delete the report?`, `Cancel`, `Delete`. Put the main action last.",
      "It does not close itself: `open` decides. Escape, Back and a press outside call `onClose`.",
      "Set `dismissible` to false only for a question that must be answered. Then only an action closes the dialog.",
      "It is a modal dialog named by its title and described by its description. Focus moves into it, stays inside it, and returns to where it was on close.",
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
        description: "Required. Called on Escape and on a press outside the dialog.",
      },
      { name: "title", type: "string", description: "Required. Names the dialog." },
      { name: "description", type: "string", description: "Describes the dialog." },
      {
        name: "children",
        type: "ReactNode",
        description: "The body. It scrolls when the dialog would be taller than the window.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "Buttons, in a row at the end edge.",
      },
      {
        name: "dismissible",
        type: "boolean",
        description: "Defaults to `true`. When false, Escape and a press outside do nothing.",
      },
    ],
    sources: everywhere("Dialog", GPUI_OVERLAYS),
    demo: true,
    preview: "Dialog",
  },
  {
    slug: "toast",
    name: "Toast",
    summary: "A short message about what just happened, which leaves on its own.",
    guidance: [
      "Use it to confirm something the person just did, optionally with one action such as undoing it.",
      "Do not put the only way to do something in a toast: it is gone in a few seconds. For a message that has to stay, use a Banner.",
      "It does not close itself: `open` decides, and `onClose` is called when the time is up and after the action.",
      "On the web the time does not run while the pointer is over the toast or focus is inside it.",
      "It is announced politely and never takes focus.",
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
        description: "Required. Called when the time is up and after the action.",
      },
      { name: "message", type: "string", description: "Required." },
      {
        name: "action",
        type: "{ label: string; onPress: () => void }",
        description: "Choosing it calls `onPress` and then `onClose`.",
      },
      {
        name: "duration",
        type: "number",
        description: "In milliseconds. Defaults to 5000. `0` keeps the toast until it is closed.",
      },
    ],
    sources: everywhere("Toast", GPUI_OVERLAYS),
    demo: true,
    preview: "Toast",
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    summary: "Names a control when the pointer rests on it or the keyboard focuses it.",
    guidance: [
      "Pointer clients only: web and GPUI. Touch input has no hover, so nothing may depend on a tooltip.",
      "Use it on a control that has no visible text, such as an IconButton, and say what the control does in a word or two.",
      "It describes the control and is not its name: an IconButton still needs its `label`.",
      "It appears after half a second under a pointer and at once on keyboard focus, and goes when the pointer leaves, focus leaves, or Escape is pressed.",
      "It never holds anything pressable.",
    ],
    example: `import { IconButton, Tooltip } from "@acme/ui";

<Tooltip label="Search" shortcut="⌘K">
  <IconButton icon="search" label="Search" onPress={search} />
</Tooltip>`,
    exampleLanguage: "tsx",
    props: [
      { name: "label", type: "string", description: "Required. The text." },
      { name: "shortcut", type: "string", description: "A key hint shown after the label." },
      {
        name: "placement",
        type: '"top" | "bottom"',
        description: "Defaults to `top`. It flips when there is no room.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Required. The control it describes: a Button or an IconButton.",
      },
    ],
    sources: { web: web("Tooltip"), gpui: GPUI_OVERLAYS },
    demo: true,
    preview: "Buttons",
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    summary: "Holds the place of content that is loading.",
    guidance: [
      "Use skeletons in the shape of the content that is coming, so the screen does not jump when it arrives. For an action in progress, use a Spinner.",
      "`text` is one line of body text, `rect` a block such as a picture, and `circle` an avatar.",
      "It pulses, and stands still for people who ask for less motion.",
      "It is hidden from assistive technology. The screen that shows skeletons says that it is loading, once.",
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
    sources: everywhere("Skeleton", GPUI_CONTROLS),
    demo: true,
    preview: "Skeleton",
  },
  {
    slug: "search-field",
    name: "SearchField",
    summary: "A text field for a query.",
    guidance: [
      "Use it to search or filter what is on the screen. For a value that is saved with a form, use a TextField, which has a visible label.",
      "`label` is required and is not shown: it is the accessible name. The search icon says what the field is for.",
      "While there is a value, a control at the end clears it and keeps focus in the field. On the web Escape clears too.",
      "`onSubmit` is called on Enter, or on the search key of a software keyboard.",
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
    sources: everywhere("SearchField", GPUI_COMPONENTS),
    demo: true,
    preview: "Text fields",
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
