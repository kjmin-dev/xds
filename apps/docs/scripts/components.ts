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
  /** Source file per platform. Touch-only components have no web or GPUI entry. */
  sources: { web?: string; gpui?: string; reactNative: string; compose: string };
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
