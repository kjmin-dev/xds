// The sections of the design preview that show the components: every component in every
// variant, size, tone and state.

import type { BadgeTone } from "../badge.ts";
import type { BannerTone } from "../banner.ts";
import type { ButtonVariant, ControlSize } from "../button.ts";
import type { ThumbnailRatio } from "../thumbnail.ts";
import {
  BROKEN,
  COUNTRIES,
  CURRENCIES,
  DAY,
  DELIVERY,
  FILTERS,
  NIGHT,
  PAGES,
  PEOPLE,
  PLACES,
  PLANS,
  PORTRAIT,
  PREFERENCES,
  QUESTIONS,
  SIZES_OF_SHIRT,
  TIME_ZONES,
  VIEWS,
} from "./fixtures.ts";
import { bind, type DesignState, el, keep, row, show, ui } from "./kit.ts";
import type { Overlay } from "./page.ts";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ControlSize[] = ["sm", "md", "lg"];
// `overlay` is shown apart from these, on the pictures it is for.
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];
const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];
const RATIOS: { ratio: ThumbnailRatio; width: string }[] = [
  // Each about as tall as the others, so the row lines up.
  { ratio: "16:9", width: "w-48" },
  { ratio: "4:3", width: "w-36" },
  { ratio: "1:1", width: "w-28" },
  { ratio: "9:16", width: "w-16" },
];

const toggle =
  (key: "liked" | "saved" | "pinned" | "revealed" | "picked") => (state: DesignState) => ({
    [key]: !state[key],
  });

const tooltips = () =>
  row(
    "tooltip",
    el(
      "span",
      { class: "flex" },
      ui.Tooltip(
        { label: "Search", shortcut: "⌘K" },
        ui.IconButton({ icon: "search", label: "Search" }),
      ),
    ),
    ui.Tooltip(
      { label: "Share", placement: "bottom" },
      ui.IconButton({ icon: "share-2", label: "Share", variant: "secondary" }),
    ),
    ui.Tooltip(
      { label: "Export as a spreadsheet" },
      ui.Button({ iconStart: "download" }, "Export"),
    ),
    ui.Text(
      { variant: "detail", tone: "secondary", as: "span" },
      "Rest the pointer on a control, or focus it with the keyboard.",
    ),
  );

// With `?open=tooltip` the tooltip row comes first, so that its tooltip is at the top of the page.
export const buttons = (open: Overlay | undefined) => [
  ...(open === "tooltip" ? [tooltips()] : []),
  ...VARIANTS.map((variant) =>
    row(
      variant,
      ...SIZES.map((size) => ui.Button({ variant, size }, "Save")),
      ui.Button({ variant, disabled: true }, "Disabled"),
      ui.Button({ variant, loading: true }, "Saving"),
    ),
  ),
  row(
    "icons",
    ui.Button({ variant: "primary", iconStart: "plus" }, "New"),
    ui.Button({ iconEnd: "chevron-down" }, "Options"),
    ui.Button({ variant: "ghost", size: "sm", iconStart: "download" }, "Export"),
    ui.Button(
      { variant: "primary", size: "lg", iconStart: "upload", iconEnd: "arrow-right" },
      "Publish",
    ),
    ui.Button({ variant: "ghost", iconStart: "settings", "aria-label": "Settings" }),
    ui.Button({ size: "sm", iconStart: "ellipsis", "aria-label": "More" }),
  ),
  row(
    "icon, loading",
    ui.Button({ iconStart: "download" }, "Export"),
    ui.Button({ iconStart: "download", loading: true }, "Export"),
    ui.Button({ size: "lg", iconStart: "download" }, "Export"),
    ui.Button({ size: "lg", iconStart: "download", loading: true }, "Export"),
  ),
  row(
    "selected",
    ui.Button(
      { iconStart: "heart", selected: (state) => state.liked, onPress: toggle("liked") },
      "Like",
    ),
    ui.Button({ iconStart: "heart", selected: false }, "Like"),
    ui.Button(
      {
        variant: "ghost",
        iconStart: "bookmark",
        selected: (state) => state.saved,
        onPress: toggle("saved"),
      },
      "Save",
    ),
    ui.Button({ variant: "ghost", iconStart: "bookmark", selected: false }, "Save"),
    ui.Button({
      variant: "ghost",
      size: "sm",
      iconStart: "star",
      selected: true,
      "aria-label": "Starred",
    }),
    ui.Button({ iconStart: "heart", selected: true, disabled: true }, "Disabled"),
    ui.Button({ variant: "primary", iconStart: "bell", selected: true }, "Primary"),
  ),
  ...VARIANTS.map((variant) =>
    row(
      `icon, ${variant}`,
      ...SIZES.map((size) =>
        ui.IconButton({ icon: "settings", label: `Settings, ${size}`, variant, size }),
      ),
      ui.IconButton({ icon: "settings", label: "Disabled", variant, disabled: true }),
      ui.IconButton({ icon: "settings", label: "Loading", variant, loading: true }),
    ),
  ),
  row(
    "icon, selected",
    ui.IconButton({
      icon: "pin",
      label: "Pin",
      selected: (state) => state.pinned,
      onPress: toggle("pinned"),
    }),
    ui.IconButton({ icon: "pin", label: "Pin", selected: false }),
    ui.IconButton({ icon: "star", label: "Star", variant: "secondary", selected: true }),
    ui.IconButton({ icon: "star", label: "Star", variant: "secondary", selected: false }),
    ui.IconButton({ icon: "heart", label: "Like", size: "sm", selected: true }),
    ui.IconButton({ icon: "heart", label: "Like", size: "lg", selected: true }),
    ui.IconButton({ icon: "bookmark", label: "Save", selected: true, disabled: true }),
    ui.IconButton({ icon: "bell", label: "Notify", variant: "primary", selected: true }),
  ),
  ...(open === "tooltip" ? [] : [tooltips()]),
];

export const textFields = () => [
  el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    ui.TextField({
      label: "Email",
      placeholder: "name@example.com",
      description: "We send the sign-in code to this address.",
      ...bind("email"),
    }),
    ui.TextField({ label: "Project name", value: "Weekly report", onChange: keep, required: true }),
    ui.TextField({
      label: "Sign-in code",
      value: "12345",
      onChange: keep,
      error: "That code is wrong or has expired.",
    }),
    ui.TextField({ label: "Organization", value: "Acme Inc.", onChange: keep, disabled: true }),
    ui.TextField({
      label: "Search",
      placeholder: "Projects, people, files",
      leading: ui.Icon({ name: "search", size: "sm" }),
      ...bind("query"),
    }),
    ui.TextField({
      label: "Weight",
      inputMode: "decimal",
      value: "72.5",
      onChange: keep,
      trailing: ui.Text({ variant: "detail", tone: "inherit", as: "span" }, "kg"),
    }),
    ui.TextField({
      label: "Password",
      type: (state) => (state.revealed ? "text" : "password"),
      leading: ui.Icon({ name: "lock", size: "sm" }),
      trailing: ui.Button({
        variant: "ghost",
        size: "sm",
        iconStart: (state) => (state.revealed ? "eye-off" : "eye"),
        "aria-label": (state) => (state.revealed ? "Hide the password" : "Show the password"),
        onPress: toggle("revealed"),
      }),
      ...bind("secret"),
    }),
    ui.TextField({
      label: "Promo code",
      leading: ui.Icon({ name: "tag", size: "sm" }),
      value: "SPRING",
      onChange: keep,
      error: "That code has expired.",
    }),
    ui.TextField({ label: "Notes", multiline: true, ...bind("notes") }),
    ui.TextField({
      label: "Bio",
      description: "Shown on your profile.",
      multiline: true,
      maxLength: 80,
      ...bind("bio"),
    }),
    ui.TextField({
      label: "Message",
      placeholder: "Write a reply",
      multiline: true,
      rows: 2,
      leading: ui.Icon({ name: "message-square", size: "sm" }),
      value: "",
      onChange: keep,
    }),
    ui.TextField({
      label: "Display name",
      maxLength: 12,
      value: "Ada Lovelace",
      onChange: keep,
      error: "Use 12 characters or fewer, without spaces.",
    }),
  ),
  el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    ui.SearchField({
      label: "Search projects",
      placeholder: "Search projects",
      ...bind("search"),
      onSubmit: (_, submitted) => ({ submitted }),
    }),
    ui.SearchField({ label: "Search people", value: "Ada Lovelace", onChange: keep }),
    ui.SearchField({
      label: "Search files",
      placeholder: "Unavailable offline",
      value: "",
      onChange: keep,
      disabled: true,
    }),
    ui.Text({ variant: "detail", tone: "secondary", as: "span", class: "self-center" }, (state) =>
      state.submitted ? `Searched for “${state.submitted}”.` : "Enter searches, Escape clears.",
    ),
  ),
];

export const selection = () => [
  row(
    "switch",
    ui.Switch({ label: "Notifications", ...bind("notifications", "checked") }),
    ui.Switch({ checked: false, onChange: keep, label: "Off" }),
    ui.Switch({ checked: true, onChange: keep, label: "Locked", disabled: true }),
  ),
  row(
    "checkbox",
    ui.Checkbox({ label: "Remember me", ...bind("agreed", "checked") }),
    ui.Checkbox({ checked: false, onChange: keep, label: "Unchecked" }),
    ui.Checkbox({ checked: true, onChange: keep, label: "Locked", disabled: true }),
  ),
  row(
    "segmented",
    ui.SegmentedControl({ options: VIEWS, "aria-label": "Calendar view", ...bind("view") }),
  ),
  el(
    "div",
    { class: "grid gap-6 sm:grid-cols-3" },
    ui.RadioGroup({ label: "Delivery", options: DELIVERY, ...bind("delivery") }),
    ui.RadioGroup({
      label: "Size",
      options: SIZES_OF_SHIRT,
      ...bind("shirt"),
      error: (state) => (state.shirt === undefined ? "Choose a size to continue." : undefined),
    }),
    ui.RadioGroup({
      label: "Region, locked",
      options: DELIVERY,
      value: "express",
      onChange: keep,
      disabled: true,
    }),
  ),
];

export const controls = () => [
  el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    el(
      "div",
      {},
      ui.Select({
        label: "Plan",
        options: PLANS,
        ...bind("plan"),
        description: "Change it at any time.",
      }),
    ),
    ui.Select({
      label: "Country",
      placeholder: "Choose a country",
      options: COUNTRIES,
      ...bind("country"),
    }),
    ui.Select({
      label: "Time zone",
      placeholder: "Choose a time zone",
      options: TIME_ZONES,
      ...bind("timeZone"),
      error: (state) =>
        state.timeZone === undefined ? "Choose a time zone for the reminders." : undefined,
    }),
    ui.Select({
      label: "Currency",
      options: CURRENCIES,
      value: "eur",
      onChange: keep,
      disabled: true,
    }),
  ),
  el(
    "div",
    { class: "grid gap-x-8 gap-y-6 sm:grid-cols-2" },
    ui.Slider({ label: "Volume", ...bind("volume"), showValue: true }),
    ui.Slider({
      label: "Font size",
      min: 12,
      max: 24,
      step: 2,
      ...bind("fontSize"),
      showValue: true,
    }),
    ui.Slider({ label: "Brightness", ...bind("volume") }),
    ui.Slider({
      label: "Balance, locked",
      value: 30,
      onChange: keep,
      disabled: true,
      showValue: true,
    }),
  ),
];

export const chips = () => [
  row(
    "state",
    ui.Chip({ label: "Unselected" }),
    ui.Chip({ label: "Selected", selected: true }),
    ui.Chip({ label: "Icon", iconStart: "tag" }),
    ui.Chip({ label: "Icon, selected", iconStart: "tag", selected: true }),
    ui.Chip({ label: "Disabled", disabled: true }),
    ui.Chip({ label: "Disabled, selected", selected: true, disabled: true }),
  ),
  row(
    "bar",
    // Narrower than its chips, so the row has to scroll.
    el(
      "div",
      { class: "max-w-md min-w-0 flex-1" },
      ui.ChipBar(
        { label: "Filter the tasks" },
        ...FILTERS.map((filter) =>
          ui.Chip({
            label: filter.label,
            iconStart: filter.icon,
            selected: (state) => state.filters.includes(filter.value),
            onPress: (state) => ({
              filters: state.filters.includes(filter.value)
                ? state.filters.filter((other) => other !== filter.value)
                : [...state.filters, filter.value],
            }),
          }),
        ),
      ),
    ),
  ),
];

export const tabs = () => [
  ui.Tabs({ items: PAGES, label: "Workspace pages", ...bind("page") }),
  ui.Tabs({
    items: PAGES.map(({ value, label }) => ({ value, label })),
    label: "Workspace pages, without icons",
    ...bind("page"),
  }),
  ui.Tabs({
    items: PAGES.slice(0, 3),
    label: "Workspace pages, full width",
    ...bind("page"),
    value: (state) =>
      state.page === "billing" || state.page === "settings" ? "overview" : state.page,
    fullWidth: true,
  }),
  // Narrower than its tabs, so the row has to scroll.
  el(
    "div",
    { class: "max-w-xs" },
    ui.Tabs({ items: PAGES, label: "Workspace pages, scrolling", ...bind("page") }),
  ),
];

export const badges = () => [
  row("tone", ...BADGE_TONES.map((tone) => ui.Badge({ tone }, tone))),
  row(
    "dot",
    ui.Badge({ tone: "success", dot: true }, "Online"),
    ui.Badge({ tone: "warning", dot: true }, "Connecting"),
    ui.Badge({ tone: "danger", dot: true }, "Offline"),
  ),
  row(
    "icon",
    ui.Badge({ tone: "success", icon: "check" }, "Verified"),
    ui.Badge({ tone: "warning", icon: "clock" }, "Pending"),
    ui.Badge({ icon: "lock" }, "Private"),
    ui.Badge({ tone: "accent", dot: true, icon: "sparkles" }, "New"),
  ),
  row(
    "overlay",
    ...[
      { name: "dark", src: NIGHT },
      { name: "light", src: DAY },
    ].map((block) =>
      el(
        "span",
        { class: "relative inline-flex overflow-hidden rounded-acme-md" },
        el("img", { src: block.src, alt: "", class: "h-24 w-48 object-cover" }),
        el(
          "span",
          { class: "absolute start-2 top-2" },
          ui.Badge({ tone: "overlay", icon: "play" }, "2:45"),
        ),
        el(
          "span",
          { class: "absolute end-2 bottom-2" },
          ui.Badge({ tone: "overlay" }, "On a ", block.name, " picture"),
        ),
      ),
    ),
  ),
  row(
    "count",
    ui.CountBadge({ count: 3 }),
    ui.CountBadge({ count: 120 }),
    ui.CountBadge({ count: 7, max: 5 }),
    el(
      "span",
      { class: "flex items-center gap-6 ps-3 text-acme-text-primary" },
      ui.CountBadge(
        { count: 3, label: "3 unread notifications" },
        ui.Icon({ name: "bell", size: "lg" }),
      ),
      ui.CountBadge(
        { count: 120, label: "More than 99 unread messages" },
        ui.Icon({ name: "mail", size: "lg" }),
      ),
      ui.CountBadge(
        { count: 2, label: "2 new messages from Ada Lovelace" },
        ui.Avatar({ name: "Ada Lovelace", size: "lg" }),
      ),
      ui.CountBadge(
        { count: 12, label: "12 items in the cart" },
        ui.Button({ variant: "ghost", iconStart: "shopping-cart", "aria-label": "Cart" }),
      ),
      ui.CountBadge(
        { count: 0 },
        ui.Icon({ name: "message-square", size: "lg", label: "Messages, none unread" }),
      ),
    ),
  ),
];

export const banners = () => [
  ...BANNER_TONES.map((tone) =>
    ui.Banner(
      { tone, title: tone },
      "Your changes are saved on this device. They sync when you are back online.",
    ),
  ),
  show(
    (state) => !state.dismissed,
    ui.Banner(
      {
        tone: "warning",
        title: "Your trial ends in three days",
        action: { label: "Choose a plan", onPress: keep },
        onDismiss: () => ({ dismissed: true }),
      },
      "After that the workspace becomes read-only until a plan is chosen.",
    ),
    ui.Button(
      { size: "sm", onPress: () => ({ dismissed: false }) },
      "Show the dismissed banner again",
    ),
  ),
  ui.Banner(
    { tone: "info", onDismiss: keep, dismissLabel: "Dismiss the update notice" },
    "A new version is available.",
  ),
  ui.Banner(
    { tone: "danger", action: { label: "Try again", onPress: keep } },
    "The report could not be sent.",
  ),
];

export const card = () => [
  ui.Card(
    {
      title: "Weekly report",
      description: "Updated a few minutes ago.",
      actions: ui.Badge({ tone: "success", dot: true }, "Online"),
    },
    ui.Text({ tone: "secondary" }, "A card groups related content."),
    ui.Divider({}),
    row(
      "spinner",
      ui.Spinner({ size: "sm" }),
      ui.Spinner({ size: "md" }),
      ui.Spinner({ size: "lg", label: "Loading" }),
    ),
    row(
      "avatar",
      ui.Avatar({ name: "Ada Lovelace", size: "sm" }),
      ui.Avatar({ name: "Ada Lovelace" }),
      ui.Avatar({ name: "Grace Hopper", size: "lg" }),
      ui.Avatar({ name: "Alan Turing", size: "xl" }),
    ),
    row(
      "picture",
      ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT, size: "sm" }),
      ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT }),
      ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT, size: "lg" }),
      ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT, size: "xl" }),
      ui.Avatar({ name: "Grace Hopper", src: BROKEN, size: "xl" }),
      ui.Text(
        { variant: "detail", tone: "secondary", as: "span" },
        "The last picture fails to load.",
      ),
    ),
    row(
      "stack",
      ui.AvatarStack({ people: PEOPLE.slice(0, 3) }),
      ui.AvatarStack({ people: PEOPLE }),
      ui.AvatarStack({ people: PEOPLE, max: 3, size: "sm" }),
      ui.AvatarStack({ people: PEOPLE, max: 2, size: "lg", label: "The design team, 7 people" }),
      ui.AvatarStack({ people: PEOPLE, max: 3, size: "xl" }),
    ),
    row(
      "progress",
      el("div", { class: "max-w-xs flex-1" }, ui.ProgressBar({ value: 0.6, label: "Upload" })),
    ),
  ),
  el(
    "div",
    { class: "grid items-start gap-4 sm:grid-cols-3" },
    ui.Card(
      {
        title: "Night hike",
        description: "Media runs edge to edge.",
        media: el("img", { src: NIGHT, alt: "", class: "h-28 object-cover" }),
      },
      ui.Text({ variant: "detail", tone: "secondary" }, "12 km, 4 hours."),
    ),
    ui.Card(
      { title: "Team plan", description: "Press anywhere on the card.", onPress: keep },
      ui.Text({ variant: "detail", tone: "secondary", as: "span" }, "Up to 20 people."),
    ),
    ui.Card(
      {
        title: "Yearly billing",
        description: (state) => (state.picked ? "Selected. Press to clear." : "Press to select."),
        selected: (state) => state.picked,
        onPress: toggle("picked"),
      },
      ui.Text({ variant: "detail", tone: "secondary", as: "span" }, "Two months free."),
    ),
    ui.Card({
      title: "Morning walk",
      description: "Selected, with media.",
      selected: true,
      media: el("img", { src: DAY, alt: "", class: "h-28 object-cover" }),
    }),
    ui.Card(
      { title: "Monthly billing", description: "Not selected.", selected: false },
      ui.Text({ variant: "detail", tone: "secondary" }, "Cancel at any time."),
    ),
    ui.Card(
      { title: "Selected", description: "A card that is not pressable.", selected: true },
      ui.Text({ variant: "detail", tone: "secondary" }, "The same size as the one beside it."),
    ),
  ),
];

const videoActions = (title: string) =>
  ui.Menu({
    label: `Actions for ${title}`,
    align: "end",
    trigger: ui.IconButton({ icon: "ellipsis-vertical", label: "More actions" }),
    items: [
      {
        label: "Save to watch later",
        icon: "clock",
        onSelect: () => ({ opened: `Saved ${title}.` }),
      },
      { label: "Share", icon: "share-2", onSelect: () => ({ opened: `Shared ${title}.` }) },
    ],
  });

const opens = (opened: string) => () => ({ opened });

export const media = () => [
  ui.SectionHeader({
    title: "Continue watching",
    description: "Pick up where you left off.",
    action: { label: "See all", onPress: opens("See all.") },
  }),
  el(
    "div",
    { class: "flex flex-wrap items-end gap-3" },
    ...RATIOS.map(({ ratio, width }) =>
      el(
        "div",
        { class: `flex flex-col gap-1 ${width}` },
        ui.Thumbnail({ src: ratio === "1:1" ? PORTRAIT : NIGHT, alt: "", ratio }),
        ui.Text({ variant: "footnote", tone: "secondary", as: "span" }, ratio),
      ),
    ),
  ),
  el(
    "div",
    { class: "grid grid-cols-2 gap-3 sm:grid-cols-5" },
    ...[
      {
        caption: "Fails to load",
        thumbnail: ui.Thumbnail({ src: BROKEN, alt: "A picture that fails to load" }),
      },
      { caption: "No picture, badge", thumbnail: ui.Thumbnail({ alt: "", badge: "Live" }) },
      { caption: "Badge", thumbnail: ui.Thumbnail({ src: DAY, alt: "", badge: "12:04" }) },
      { caption: "Progress", thumbnail: ui.Thumbnail({ src: NIGHT, alt: "", progress: 0.35 }) },
      {
        caption: "Badge and progress",
        thumbnail: ui.Thumbnail({ src: DAY, alt: "", badge: "3:27", progress: 0.8 }),
      },
    ].map(({ caption, thumbnail }) =>
      el(
        "div",
        { class: "flex flex-col gap-1" },
        thumbnail,
        ui.Text({ variant: "footnote", tone: "secondary", as: "span" }, caption),
      ),
    ),
  ),
  el(
    "div",
    { class: "grid items-start gap-2 sm:grid-cols-3" },
    ui.MediaCard({
      src: NIGHT,
      title: "Night hike above the city: four hours, twelve kilometres and one long staircase",
      meta: ["Ada Lovelace", "12K views · 3 days ago"],
      badge: "12:04",
      progress: 0.35,
      leading: ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT }),
      action: videoActions("Night hike"),
      onPress: opens("Opened Night hike."),
    }),
    ui.MediaCard({
      src: DAY,
      title: "Morning walk",
      meta: ["Grace Hopper", "840 views · 1 week ago"],
      badge: "3:27",
      leading: ui.Avatar({ name: "Grace Hopper" }),
      action: videoActions("Morning walk"),
      onPress: opens("Opened Morning walk."),
    }),
    ui.MediaCard({
      src: BROKEN,
      title: "Not pressable, and its picture fails to load",
      meta: ["Alan Turing"],
    }),
  ),
  el(
    "div",
    { class: "grid items-start gap-2 sm:grid-cols-2" },
    ui.MediaCard({
      layout: "horizontal",
      src: DAY,
      title: "Ten small changes that make a report easier to read",
      meta: ["Katherine Johnson", "5 min read"],
      badge: "5:12",
      progress: 0.6,
      action: videoActions("Ten small changes"),
      onPress: opens("Opened Ten small changes."),
    }),
    ui.MediaCard({
      layout: "horizontal",
      src: NIGHT,
      ratio: "1:1",
      title: "Square, without an action",
      meta: ["Margaret Hamilton", "2 days ago"],
      onPress: opens("Opened Square."),
    }),
  ),
  ui.Text({ variant: "detail", tone: "secondary" }, (state) => state.opened),
  ui.SectionHeader({
    icon: "history",
    title: "On its own",
    description: "An icon, a description and an action, at heading level 3.",
    action: { label: "Clear history", onPress: opens("Cleared the history.") },
    level: 3,
  }),
];

const listIcon = (name: "mail" | "file-text" | "clock" | "trash") =>
  ui.Icon({ name, size: "sm", class: "text-acme-text-secondary" });

export const list = () => [
  ui.Card(
    { flush: true },
    ui.ListRow({
      leading: ui.Avatar({ name: "Ada Lovelace" }),
      title: "Ada Lovelace",
      description: "ada@example.com",
      trailing: ui.Badge({ tone: "accent" }, "Owner"),
    }),
    ui.Divider({}),
    ui.ListRow({
      title: "Notifications",
      description: "Mentions and replies",
      trailing: ui.Switch({ "aria-label": "Notifications", ...bind("notifications", "checked") }),
    }),
    ui.Divider({}),
    ui.ListRow({
      title: "Language",
      trailing: ui.Text({ tone: "secondary", as: "span" }, "English"),
      chevron: true,
      onPress: keep,
    }),
    ui.Divider({}),
    ui.ListRow({
      title: "Storage",
      description: "Unavailable offline",
      chevron: true,
      onPress: keep,
      disabled: true,
    }),
    ui.Divider({}),
    ui.ListRow({
      leading: ui.Avatar({ name: "Grace Hopper" }),
      title: "Grace Hopper",
      description: "The selected row",
      trailing: ui.CountBadge({ count: 3, label: "3 unread messages" }),
      selected: true,
      onPress: keep,
    }),
    ui.Divider({}),
    ui.ListRow({ title: "Selected, without an action", description: "Read-only", selected: true }),
  ),
  ui.Card(
    { flush: true, class: "max-w-xs" },
    ui.ListRow({
      compact: true,
      leading: listIcon("mail"),
      title: "Inbox",
      trailing: ui.CountBadge({ count: 12, label: "12 unread" }),
      selected: true,
      onPress: keep,
    }),
    ui.ListRow({ compact: true, leading: listIcon("file-text"), title: "Drafts", onPress: keep }),
    ui.ListRow({
      compact: true,
      leading: listIcon("clock"),
      title: "Scheduled",
      description: "Compact, with a description",
      onPress: keep,
    }),
    ui.ListRow({
      compact: true,
      leading: listIcon("trash"),
      title: "Trash",
      onPress: keep,
      disabled: true,
    }),
  ),
];

const placeLabel = (place: string) =>
  PLACES.flatMap((section) => section.items).find((item) => item.value === place)?.label ?? place;

export const sidebar = () => [
  el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    ...[false, true].map((collapsed) =>
      // A fixed height, as a window would give it, so the footer sits at the bottom, and a page
      // beside the sidebar, as an app has.
      el(
        "div",
        {
          class: "flex h-[28rem] overflow-hidden rounded-acme-md border border-acme-border-default",
        },
        ui.Sidebar({
          label: collapsed ? "Workspace, collapsed" : "Workspace",
          sections: PLACES,
          ...bind("place"),
          collapsed,
          header: el(
            "div",
            {
              class: `flex h-acme-control-md items-center gap-2 ${collapsed ? "justify-center" : "px-2"}`,
            },
            el(
              "span",
              {
                class:
                  "flex size-acme-avatar-md items-center justify-center rounded-acme-md bg-acme-accent-default text-acme-text-on-accent",
              },
              ui.Icon({ name: "sparkles", size: "sm" }),
            ),
            ...(collapsed ? [] : [ui.Text({ variant: "label", as: "span" }, "Acme")]),
          ),
          footer: el(
            "div",
            { class: `flex items-center gap-2 py-1 ${collapsed ? "justify-center" : "px-2"}` },
            ui.Avatar({ name: "Ada Lovelace", src: PORTRAIT, size: "sm" }),
            ...(collapsed ? [] : [ui.Text({ variant: "detail", as: "span" }, "Ada Lovelace")]),
          ),
        }),
        el(
          "div",
          { class: "flex min-w-0 flex-1 flex-col gap-1 p-4" },
          ui.Text({ variant: "heading", as: "span" }, (state) => placeLabel(state.place)),
          ui.Text(
            { variant: "detail", tone: "secondary", as: "span" },
            collapsed
              ? "Rest the pointer on an icon, or focus it, for its name."
              : "The page of the current place.",
          ),
        ),
      ),
    ),
  ),
];

export const accordion = () => [
  el(
    "div",
    { class: "grid items-start gap-8 sm:grid-cols-2" },
    el(
      "div",
      { class: "flex flex-col gap-2" },
      ui.Text({ variant: "label", tone: "secondary" }, "One at a time"),
      ui.Accordion({ items: QUESTIONS, ...bind("question", "expanded") }),
    ),
    el(
      "div",
      { class: "flex flex-col gap-2" },
      ui.Text({ variant: "label", tone: "secondary" }, "Several at once"),
      ui.Accordion({ items: PREFERENCES, ...bind("preferences", "expanded"), multiple: true }),
    ),
  ),
];

const chooses = (chosen: string) => () => ({ chosen });

export const menu = () => [
  row(
    "menu",
    el(
      "span",
      { class: "flex" },
      ui.Menu({
        label: "Report actions",
        trigger: ui.Button({ iconEnd: "chevron-down" }, "Actions"),
        items: [
          { label: "Rename", icon: "pencil", onSelect: chooses("Rename") },
          { label: "Duplicate", icon: "copy", onSelect: chooses("Duplicate") },
          { label: "Share", icon: "share-2", onSelect: keep, disabled: true },
          "separator",
          {
            label: "Comfortable",
            icon: "list",
            selected: (state) => state.density === "comfortable",
            onSelect: () => ({ density: "comfortable" }),
          },
          {
            label: "Compact",
            icon: "layout-grid",
            selected: (state) => state.density === "compact",
            onSelect: () => ({ density: "compact" }),
          },
          "separator",
          { label: "Delete", icon: "trash", danger: true, onSelect: chooses("Delete") },
        ],
      }),
    ),
    ui.Menu({
      label: "More actions",
      align: "end",
      trigger: ui.IconButton({ icon: "ellipsis", label: "More actions", variant: "secondary" }),
      items: [
        { label: "Copy the link", onSelect: chooses("Copy the link") },
        { label: "Open in a new window", onSelect: chooses("Open in a new window") },
      ],
    }),
    ui.Text(
      { variant: "detail", tone: "secondary", as: "span" },
      (state) => state.chosen,
      " Density: ",
      (state) => state.density,
      ".",
    ),
  ),
];

export const dialog = () => [
  row(
    "dialog",
    ui.Button({ variant: "danger", onPress: () => ({ confirming: true }) }, "Delete the report"),
    ui.Button({ onPress: () => ({ asking: true }) }, "A question that must be answered"),
  ),
  ui.Dialog({
    open: (state) => state.confirming,
    onClose: () => ({ confirming: false }),
    title: "Delete the weekly report?",
    description: "The report and its 12 comments are removed for everyone. This cannot be undone.",
    actions: [
      ui.Button({ onPress: () => ({ confirming: false }) }, "Cancel"),
      ui.Button({ variant: "danger", onPress: () => ({ confirming: false }) }, "Delete"),
    ],
  }),
  ui.Dialog(
    {
      open: (state) => state.asking,
      onClose: () => ({ asking: false }),
      dismissible: false,
      title: "Keep the changes?",
      description: "You edited the report in another window.",
      actions: [
        ui.Button({ onPress: () => ({ asking: false }) }, "Discard"),
        ui.Button({ variant: "primary", onPress: () => ({ asking: false }) }, "Keep"),
      ],
    },
    ui.TextField({ label: "Name of the copy", ...bind("copyName") }),
  ),
];

export const toast = (open: Overlay | undefined) => [
  row(
    "toast",
    ui.Button({ onPress: () => ({ deleted: true, toast: true }) }, "Delete a draft"),
    ui.Text({ variant: "detail", tone: "secondary", as: "span" }, (state) =>
      state.deleted ? "The draft is deleted." : "The draft is there.",
    ),
  ),
  ui.Toast({
    open: (state) => state.toast,
    onClose: () => ({ toast: false }),
    message: "The draft was deleted.",
    action: { label: "Undo", onPress: () => ({ deleted: false }) },
    // The scripted mode keeps it, so a capture does not race the timer.
    ...(open === "toast" ? { duration: 0 } : {}),
  }),
];

export const skeleton = () => [
  row(
    "shape",
    el(
      "div",
      { class: "flex w-48 flex-col gap-2" },
      ui.Skeleton({}),
      ui.Skeleton({ width: "60%" }),
    ),
    ui.Skeleton({ shape: "rect", width: 96, height: 64 }),
    ui.Skeleton({ shape: "circle", width: 40 }),
  ),
  // The screen says that it is loading, once, since the placeholders say nothing.
  ui.Card(
    { class: "max-w-sm", flush: true },
    el(
      "div",
      { role: "status", "aria-label": "Loading the report", class: "flex flex-col" },
      ui.Skeleton({ shape: "rect", height: 128 }),
      el(
        "div",
        { class: "flex items-center gap-3 p-4" },
        ui.Skeleton({ shape: "circle", width: 40 }),
        el(
          "div",
          { class: "flex flex-1 flex-col gap-2" },
          ui.Skeleton({ width: "70%" }),
          ui.Skeleton({ width: "40%" }),
        ),
      ),
    ),
  ),
];

export const emptyState = () => [
  el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    ui.Card(
      {},
      ui.EmptyState({
        icon: "mail",
        title: "No messages yet",
        description: "When someone writes to you, the conversation shows up here.",
        action: ui.Button({ variant: "primary", iconStart: "plus" }, "New message"),
      }),
    ),
    ui.Card(
      {},
      ui.EmptyState({
        icon: "search",
        title: "No results",
        description: "Try fewer words, or check the spelling.",
      }),
    ),
  ),
];
