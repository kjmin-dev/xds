// The design preview: every token group and every component in every variant and state, at
// `/design`. The mobile app has the same screen at `/design`, and the desktop app opens it with
// `acme --design`.

import { colors, icons, radius, size, space, typography } from "@acme/tokens";
import {
  Accordion,
  Avatar,
  AvatarStack,
  Badge,
  type BadgeTone,
  Banner,
  type BannerTone,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  Chip,
  ChipBar,
  type ControlSize,
  CountBadge,
  Dialog,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  type IconName,
  type IconSize,
  ListRow,
  MediaCard,
  Menu,
  ProgressBar,
  RadioGroup,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Select,
  Sidebar,
  type SidebarSection,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  Text,
  TextField,
  type TextVariant,
  Thumbnail,
  type ThumbnailRatio,
  Toast,
  Tooltip,
} from "@acme/ui";
import { type ReactNode, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|card|switch|checkbox|radio|segmented|avatar|progress|slider|listRow|topBar|tabBar|sheet|chip|tabs|menu|dialog|toast|tooltip|skeleton|thumbnail|sidebar|emptyState|accordion)/;

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;
const COLOR_GROUPS = Object.entries(
  Object.groupBy(
    Object.keys(colors.light).filter((name) => !COMPONENT_COLORS.test(name)),
    (name) => kebab(name).split("-")[0] ?? name,
  ),
);

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ControlSize[] = ["sm", "md", "lg"];
// `overlay` is shown apart from these, on the pictures it is for.
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];
const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];
const TEXT_VARIANTS = Object.keys(typography) as (keyof typeof typography)[];
const ICON_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
/** Icons made of closed shapes, which is what `filled` is for. */
const FILLABLE_ICONS: IconName[] = ["heart", "star", "bookmark", "thumbs-up", "bell"];

// The pictures are drawn here and carried in the page, so the preview works offline. Their
// colors are the pictures' own, in both color modes, which is what `overlay` is tested on.
const picture = (width: number, height: number, shapes: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`,
  )}`;
const PORTRAIT = picture(
  96,
  96,
  '<rect width="96" height="96" fill="peachpuff"/><circle cx="48" cy="38" r="17" fill="sienna"/><path d="M14 96c0-21 15-33 34-33s34 12 34 33z" fill="sienna"/>',
);
const NIGHT = picture(
  320,
  160,
  '<rect width="320" height="160" fill="midnightblue"/><circle cx="250" cy="44" r="18" fill="lemonchiffon"/><path d="M0 160 90 80l60 50 50-30 120 60z" fill="black"/>',
);
const DAY = picture(
  320,
  160,
  '<rect width="320" height="160" fill="aliceblue"/><circle cx="70" cy="46" r="20" fill="khaki"/><path d="M0 160 110 90l60 40 60-50 90 80z" fill="lightsteelblue"/>',
);
// Not a picture, so it fails to load at once and without a request.
const BROKEN = "data:image/png;base64,AAAA";

const PEOPLE = [
  { name: "Ada Lovelace", src: PORTRAIT },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Margaret Hamilton" },
  { name: "Linus Torvalds" },
  { name: "Barbara Liskov" },
];

const SECTIONS = [
  "Colors",
  "Typography",
  "Space, radius, size",
  "Icons",
  "Buttons",
  "Text fields",
  "Selection",
  "Controls",
  "Chips",
  "Tabs",
  "Badges",
  "Banners",
  "Card",
  "Media",
  "List",
  "Sidebar",
  "Accordion",
  "Menu",
  "Dialog",
  "Toast",
  "Skeleton",
  "Empty state",
];

const DELIVERY = [
  { value: "standard", label: "Standard", description: "Three to five working days. Free." },
  { value: "express", label: "Express", description: "The next working day. 9 euros." },
  { value: "pickup", label: "Pick up in a store" },
] as const;
const SIZES_OF_SHIRT = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
] as const;

const PLANS = [
  { value: "free", label: "Free", description: "Up to 3 projects" },
  { value: "team", label: "Team", description: "Up to 20 people" },
  { value: "business", label: "Business", description: "Single sign-on and audit logs" },
  { value: "enterprise", label: "Enterprise", description: "A contract of your own" },
] as const;
const COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "Japan",
  "Korea",
  "Mexico",
  "Spain",
  "United Kingdom",
  "United States",
].map((name) => ({ value: name.toLowerCase().replace(/ /g, "-"), label: name }));
const TIME_ZONES = [
  { value: "utc", label: "Coordinated Universal Time" },
  { value: "seoul", label: "Seoul" },
  { value: "berlin", label: "Berlin" },
];

const RATIOS: { ratio: ThumbnailRatio; width: string }[] = [
  // Each about as tall as the others, so the row lines up.
  { ratio: "16:9", width: "w-48" },
  { ratio: "4:3", width: "w-36" },
  { ratio: "1:1", width: "w-28" },
  { ratio: "9:16", width: "w-16" },
];

// Icons made of closed shapes, since the current place's icon is filled.
const PLACES: SidebarSection[] = [
  {
    items: [
      { value: "home", label: "Home", icon: "house" },
      { value: "messages", label: "Messages", icon: "message-square", count: 12 },
      { value: "activity", label: "Activity", icon: "bell", count: 3 },
    ],
  },
  {
    title: "Library",
    items: [
      { value: "saved", label: "Saved", icon: "bookmark", count: 128 },
      { value: "starred", label: "Starred", icon: "star" },
      { value: "liked", label: "Liked", icon: "heart" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { value: "members", label: "Members", icon: "users" },
      { value: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

const QUESTIONS = [
  {
    value: "cancel",
    title: "Can I cancel at any time?",
    content: "Yes. The plan stays active until the end of the period you paid for.",
  },
  {
    value: "seats",
    title: "How are seats counted?",
    description: "Guests are free",
    content: "Each person with an account in the workspace takes a seat. Guests do not.",
  },
  {
    value: "invoice",
    title: "Where do I find my invoices?",
    content: "Under Settings, then Billing. Each invoice can be downloaded as a PDF.",
  },
];
const PREFERENCES = [
  {
    value: "notifications",
    title: "Notifications",
    description: "Mentions, replies and reminders",
    content: "Choose what you hear about, and whether by email or in the app.",
  },
  {
    value: "privacy",
    title: "Privacy",
    content: "Choose who can see your profile and your activity.",
  },
  {
    value: "language",
    title: "Language and region",
    content: "The language of the app, and how dates and numbers are written.",
  },
];

const anchor = (title: string) => title.toLowerCase().replace(/[^a-z]+/g, "-");

/** The links beside the mode switch. */
const LINKS: { label: string; href: string }[] = [{ label: "Back to the app", href: "/" }];
// @if template
// The deployment of this repository's preview links back to the documentation, whose address
// the Preview workflow passes to the build. A project made by `xds create` has no such site.
const DOCS_SITE: string | undefined = import.meta.env.VITE_DOCS_SITE;
if (DOCS_SITE) LINKS.push({ label: "Documentation", href: DOCS_SITE });
// @endif

const FILTERS = [
  { value: "open", label: "Open", icon: "flag" },
  { value: "mine", label: "Assigned to me", icon: "user" },
  { value: "mentions", label: "Mentions", icon: "message-square" },
  { value: "review", label: "Needs review", icon: "eye" },
  { value: "blocked", label: "Blocked", icon: "ban" },
  { value: "done", label: "Done this week", icon: "check-check" },
  { value: "archived", label: "Archived", icon: "history" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

const PAGES = [
  { value: "overview", label: "Overview", icon: "house" },
  { value: "activity", label: "Activity", icon: "bell" },
  { value: "members", label: "Members", icon: "users" },
  { value: "billing", label: "Billing", icon: "credit-card" },
  { value: "settings", label: "Settings", icon: "settings" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

/**
 * `?open=menu`, `?open=select`, `?open=dialog`, `?open=toast` or `?open=tooltip` shows that
 * overlay as soon as the page loads, so that it can be captured without a hand on the page. A
 * menu, a select's list and a tooltip open beside their control, so for those the page starts
 * at that control's section, and the tooltip's row moves to the top of it: a capture of the top
 * of the page then has the overlay in it, and focusing the control does not scroll the page.
 */
const OPEN = new URLSearchParams(location.search).get("open");
const FIRST =
  OPEN === "menu"
    ? "Menu"
    : OPEN === "select"
      ? "Controls"
      : OPEN === "tooltip"
        ? "Buttons"
        : "Colors";

/** Each section can be linked to: `/design#buttons`. */
function Section({ title, children }: { title: (typeof SECTIONS)[number]; children: ReactNode }) {
  if (SECTIONS.indexOf(title) < SECTIONS.indexOf(FIRST)) return null;
  return (
    <section id={anchor(title)} className="flex scroll-mt-20 flex-col gap-4">
      <Text variant="title" as="h2">
        {title}
      </Text>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Text variant="detail" tone="secondary" as="span" className="w-24 shrink-0">
        {label}
      </Text>
      {children}
    </div>
  );
}

export function DesignPreview() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme as Theme);
  const [value, setValue] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("week");
  const [liked, setLiked] = useState(true);
  const [saved, setSaved] = useState(true);
  const [query, setQuery] = useState("");
  const [secret, setSecret] = useState("correct horse");
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState(
    "Ship the weekly report on Monday.\nAsk Grace about the numbers for March.\nBook the room.\nSend the agenda.",
  );
  const [bio, setBio] = useState("Writes programs for machines that do not exist yet.");
  const [dismissed, setDismissed] = useState(false);
  const [picked, setPicked] = useState(true);
  const [pinned, setPinned] = useState(true);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [filters, setFilters] = useState<readonly string[]>(["open", "review"]);
  const [page, setPage] = useState<(typeof PAGES)[number]["value"]>("overview");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [chosen, setChosen] = useState("Nothing chosen yet.");
  const [confirming, setConfirming] = useState(OPEN === "dialog");
  const [asking, setAsking] = useState(false);
  const [copyName, setCopyName] = useState("Weekly report, my copy");
  const [toast, setToast] = useState(OPEN === "toast");
  const [deleted, setDeleted] = useState(OPEN === "toast");
  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]["value"]>("standard");
  const [shirt, setShirt] = useState<(typeof SIZES_OF_SHIRT)[number]["value"]>();
  const [plan, setPlan] = useState<(typeof PLANS)[number]["value"]>("team");
  const [country, setCountry] = useState<string>();
  const [timeZone, setTimeZone] = useState<string>();
  const [volume, setVolume] = useState(60);
  const [fontSize, setFontSize] = useState(16);
  const [opened, setOpened] = useState("Nothing opened yet.");
  const [place, setPlace] = useState("messages");
  const [question, setQuestion] = useState<string[]>(["seats"]);
  const [preferences, setPreferences] = useState<string[]>(["notifications", "language"]);
  const menu = useRef<HTMLSpanElement>(null);
  const select = useRef<HTMLDivElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  // A menu, a select's list and a tooltip open from their control, so the scripted mode works
  // that control the way a person would: a press for the menu and the list, keyboard focus for
  // the tooltip.
  useEffect(() => {
    const target =
      OPEN === "menu"
        ? menu.current
        : OPEN === "select"
          ? select.current
          : OPEN === "tooltip"
            ? tooltip.current
            : null;
    const control = target?.querySelector("button");
    if (!control) return;
    if (OPEN === "tooltip") {
      control.focus();
      return;
    }
    // A select collects its options in a render after its first one, and does not open while
    // it has none, so its press waits a frame.
    const frame = requestAnimationFrame(() => control.click());
    return () => cancelAnimationFrame(frame);
  }, []);
  const videoActions = (title: string) => (
    <Menu
      label={`Actions for ${title}`}
      align="end"
      trigger={<IconButton icon="ellipsis-vertical" label="More actions" />}
      items={[
        {
          label: "Save to watch later",
          icon: "clock",
          onSelect: () => setOpened(`Saved ${title}.`),
        },
        { label: "Share", icon: "share-2", onSelect: () => setOpened(`Shared ${title}.`) },
      ]}
    />
  );
  const toggleFilter = (name: string) =>
    setFilters(
      filters.includes(name) ? filters.filter((other) => other !== name) : [...filters, name],
    );
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  const tooltips = (
    <Row label="tooltip">
      <span ref={tooltip} className="flex">
        <Tooltip label="Search" shortcut="⌘K">
          <IconButton icon="search" label="Search" />
        </Tooltip>
      </span>
      <Tooltip label="Share" placement="bottom">
        <IconButton icon="share-2" label="Share" variant="secondary" />
      </Tooltip>
      <Tooltip label="Export as a spreadsheet">
        <Button iconStart="download">Export</Button>
      </Tooltip>
      <Text variant="detail" tone="secondary" as="span">
        Rest the pointer on a control, or focus it with the keyboard.
      </Text>
    </Row>
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 p-6">
      <header className="flex items-center justify-between">
        <Text variant="display" as="h1">
          Acme design system
        </Text>
        <div className="flex items-center gap-3">
          {LINKS.map(({ label, href }) => (
            <a key={href} className="text-acme-detail text-acme-text-accent underline" href={href}>
              {label}
            </a>
          ))}
          <Button variant="ghost" size="sm" onPress={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </header>

      {/* Stays in view while the page scrolls, so any section is one press away. */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-10 -mx-6 flex gap-1 overflow-x-auto border-acme-border-default border-b bg-acme-background-base px-6 py-2"
      >
        {SECTIONS.map((title) => (
          <a
            key={title}
            href={`#${anchor(title)}`}
            className="whitespace-nowrap rounded-full px-3 py-1 text-acme-label text-acme-text-secondary transition-colors hover:bg-acme-control-default hover:text-acme-text-primary"
          >
            {title}
          </a>
        ))}
      </nav>

      <Section title="Colors">
        {COLOR_GROUPS.map(([group, names]) => (
          <div key={group} className="flex flex-col gap-2">
            <Text variant="label" tone="secondary">
              {group}
            </Text>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(names ?? []).map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="size-8 shrink-0 rounded-acme-sm border border-acme-border-default"
                    style={{ background: `var(--acme-color-${kebab(name)})` }}
                  />
                  <Text variant="footnote" tone="secondary" as="span" className="break-all">
                    {kebab(name)}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Typography">
        {TEXT_VARIANTS.map((name) => (
          <Row key={name} label={`${kebab(name)} ${typography[name].fontSize}`}>
            <Text variant={kebab(name) as TextVariant} as="span">
              다람쥐 헌 쳇바퀴에 타고파. The quick brown fox 123
            </Text>
          </Row>
        ))}
      </Section>

      <Section title="Space, radius, size">
        <Row label="space">
          {Object.entries(space)
            .sort(([, a], [, b]) => a - b)
            .map(([name, px]) => (
              <span key={name} className="flex flex-col items-center gap-1">
                <span className="bg-acme-accent-default" style={{ width: px, height: px }} />
                <Text variant="footnote" tone="secondary" as="span">
                  {name.replace("_", ".")}
                </Text>
              </span>
            ))}
        </Row>
        <Row label="radius">
          {Object.entries(radius).map(([name, px]) => (
            <span
              key={name}
              className="flex size-12 items-center justify-center border border-acme-border-strong"
              style={{ borderRadius: px }}
            >
              <Text variant="footnote" tone="secondary" as="span">
                {name}
              </Text>
            </span>
          ))}
        </Row>
        <Row label="control">
          <Text variant="detail" tone="secondary" as="span">
            Pointer {size.pointer.controlSm}/{size.pointer.controlMd}/{size.pointer.controlLg},
            touch {size.touch.controlSm}/{size.touch.controlMd}/{size.touch.controlLg}. This page
            uses the sizes of the input device it is viewed with.
          </Text>
        </Row>
      </Section>

      <Section title="Icons">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
          {(Object.keys(icons) as IconName[]).map((name) => (
            <span key={name} className="flex items-center gap-2 text-acme-text-primary">
              <Icon name={name} />
              <Text variant="detail" tone="secondary" as="span">
                {name}
              </Text>
            </span>
          ))}
        </div>
        <Row label="Sizes">
          <span className="flex items-end gap-3 text-acme-text-primary">
            {ICON_SIZES.map((iconSize) => (
              <Icon key={iconSize} name="house" size={iconSize} label={`house, ${iconSize}`} />
            ))}
          </span>
        </Row>
        <Row label="Filled">
          <span className="flex items-center gap-3 text-acme-text-primary">
            {FILLABLE_ICONS.map((name) => (
              <span key={name} className="flex items-center gap-1">
                <Icon name={name} />
                <Icon name={name} filled label={`${name}, filled`} />
              </span>
            ))}
          </span>
        </Row>
      </Section>

      <Section title="Buttons">
        {OPEN === "tooltip" && tooltips}
        {VARIANTS.map((variant) => (
          <Row key={variant} label={variant}>
            {SIZES.map((buttonSize) => (
              <Button key={buttonSize} variant={variant} size={buttonSize}>
                Save
              </Button>
            ))}
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Saving
            </Button>
          </Row>
        ))}
        <Row label="icons">
          <Button variant="primary" iconStart="plus">
            New
          </Button>
          <Button iconEnd="chevron-down">Options</Button>
          <Button variant="ghost" size="sm" iconStart="download">
            Export
          </Button>
          <Button variant="primary" size="lg" iconStart="upload" iconEnd="arrow-right">
            Publish
          </Button>
          <Button variant="ghost" iconStart="settings" aria-label="Settings" />
          <Button size="sm" iconStart="ellipsis" aria-label="More" />
        </Row>
        <Row label="icon, loading">
          <Button iconStart="download">Export</Button>
          <Button iconStart="download" loading>
            Export
          </Button>
          <Button size="lg" iconStart="download">
            Export
          </Button>
          <Button size="lg" iconStart="download" loading>
            Export
          </Button>
        </Row>
        <Row label="selected">
          <Button iconStart="heart" selected={liked} onPress={() => setLiked(!liked)}>
            Like
          </Button>
          <Button iconStart="heart" selected={false}>
            Like
          </Button>
          <Button
            variant="ghost"
            iconStart="bookmark"
            selected={saved}
            onPress={() => setSaved(!saved)}
          >
            Save
          </Button>
          <Button variant="ghost" iconStart="bookmark" selected={false}>
            Save
          </Button>
          <Button variant="ghost" size="sm" iconStart="star" selected aria-label="Starred" />
          <Button iconStart="heart" selected disabled>
            Disabled
          </Button>
          <Button variant="primary" iconStart="bell" selected>
            Primary
          </Button>
        </Row>
        {VARIANTS.map((variant) => (
          <Row key={variant} label={`icon, ${variant}`}>
            {SIZES.map((buttonSize) => (
              <IconButton
                key={buttonSize}
                icon="settings"
                label={`Settings, ${buttonSize}`}
                variant={variant}
                size={buttonSize}
              />
            ))}
            <IconButton icon="settings" label="Disabled" variant={variant} disabled />
            <IconButton icon="settings" label="Loading" variant={variant} loading />
          </Row>
        ))}
        <Row label="icon, selected">
          <IconButton icon="pin" label="Pin" selected={pinned} onPress={() => setPinned(!pinned)} />
          <IconButton icon="pin" label="Pin" selected={false} />
          <IconButton icon="star" label="Star" variant="secondary" selected />
          <IconButton icon="star" label="Star" variant="secondary" selected={false} />
          <IconButton icon="heart" label="Like" size="sm" selected />
          <IconButton icon="heart" label="Like" size="lg" selected />
          <IconButton icon="bookmark" label="Save" selected disabled />
          <IconButton icon="bell" label="Notify" variant="primary" selected />
        </Row>
        {OPEN !== "tooltip" && tooltips}
      </Section>

      <Section title="Text fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Email"
            placeholder="name@example.com"
            description="We send the sign-in code to this address."
            value={value}
            onChange={setValue}
          />
          <TextField label="Project name" value="Weekly report" onChange={() => {}} required />
          <TextField
            label="Sign-in code"
            value="12345"
            onChange={() => {}}
            error="That code is wrong or has expired."
          />
          <TextField label="Organization" value="Acme Inc." onChange={() => {}} disabled />
          <TextField
            label="Search"
            placeholder="Projects, people, files"
            leading={<Icon name="search" size="sm" />}
            value={query}
            onChange={setQuery}
          />
          <TextField
            label="Weight"
            inputMode="decimal"
            value="72.5"
            onChange={() => {}}
            trailing={
              <Text variant="detail" tone="inherit" as="span">
                kg
              </Text>
            }
          />
          <TextField
            label="Password"
            type={revealed ? "text" : "password"}
            leading={<Icon name="lock" size="sm" />}
            trailing={
              <Button
                variant="ghost"
                size="sm"
                iconStart={revealed ? "eye-off" : "eye"}
                aria-label={revealed ? "Hide the password" : "Show the password"}
                onPress={() => setRevealed(!revealed)}
              />
            }
            value={secret}
            onChange={setSecret}
          />
          <TextField
            label="Promo code"
            leading={<Icon name="tag" size="sm" />}
            value="SPRING"
            onChange={() => {}}
            error="That code has expired."
          />
          <TextField label="Notes" multiline value={notes} onChange={setNotes} />
          <TextField
            label="Bio"
            description="Shown on your profile."
            multiline
            maxLength={80}
            value={bio}
            onChange={setBio}
          />
          <TextField
            label="Message"
            placeholder="Write a reply"
            multiline
            rows={2}
            leading={<Icon name="message-square" size="sm" />}
            value=""
            onChange={() => {}}
          />
          <TextField
            label="Display name"
            maxLength={12}
            value="Ada Lovelace"
            onChange={() => {}}
            error="Use 12 characters or fewer, without spaces."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchField
            label="Search projects"
            placeholder="Search projects"
            value={search}
            onChange={setSearch}
            onSubmit={setSubmitted}
          />
          <SearchField label="Search people" value="Ada Lovelace" onChange={() => {}} />
          <SearchField
            label="Search files"
            placeholder="Unavailable offline"
            value=""
            onChange={() => {}}
            disabled
          />
          <Text variant="detail" tone="secondary" as="span" className="self-center">
            {submitted ? `Searched for “${submitted}”.` : "Enter searches, Escape clears."}
          </Text>
        </div>
      </Section>

      <Section title="Selection">
        <Row label="switch">
          <Switch checked={notifications} onChange={setNotifications} label="Notifications" />
          <Switch checked={false} onChange={() => {}} label="Off" />
          <Switch checked onChange={() => {}} label="Locked" disabled />
        </Row>
        <Row label="checkbox">
          <Checkbox checked={agreed} onChange={setAgreed} label="Remember me" />
          <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
          <Checkbox checked onChange={() => {}} label="Locked" disabled />
        </Row>
        <Row label="segmented">
          <SegmentedControl
            options={VIEWS}
            value={view}
            onChange={setView}
            aria-label="Calendar view"
          />
        </Row>
        <div className="grid gap-6 sm:grid-cols-3">
          <RadioGroup label="Delivery" options={DELIVERY} value={delivery} onChange={setDelivery} />
          <RadioGroup
            label="Size"
            options={SIZES_OF_SHIRT}
            value={shirt}
            onChange={setShirt}
            {...(shirt === undefined ? { error: "Choose a size to continue." } : {})}
          />
          <RadioGroup
            label="Region, locked"
            options={DELIVERY}
            value="express"
            onChange={() => {}}
            disabled
          />
        </div>
      </Section>

      <Section title="Controls">
        <div className="grid gap-4 sm:grid-cols-2">
          <div ref={select}>
            <Select
              label="Plan"
              options={PLANS}
              value={plan}
              onChange={setPlan}
              description="Change it at any time."
            />
          </div>
          <Select
            label="Country"
            placeholder="Choose a country"
            options={COUNTRIES}
            value={country}
            onChange={setCountry}
          />
          <Select
            label="Time zone"
            placeholder="Choose a time zone"
            options={TIME_ZONES}
            value={timeZone}
            onChange={setTimeZone}
            {...(timeZone === undefined ? { error: "Choose a time zone for the reminders." } : {})}
          />
          <Select
            label="Currency"
            options={[{ value: "eur", label: "Euro" }]}
            value="eur"
            onChange={() => {}}
            disabled
          />
        </div>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <Slider label="Volume" value={volume} onChange={setVolume} showValue />
          <Slider
            label="Font size"
            min={12}
            max={24}
            step={2}
            value={fontSize}
            onChange={setFontSize}
            showValue
          />
          <Slider label="Brightness" value={volume} onChange={setVolume} />
          <Slider label="Balance, locked" value={30} onChange={() => {}} disabled showValue />
        </div>
      </Section>

      <Section title="Chips">
        <Row label="state">
          <Chip label="Unselected" />
          <Chip label="Selected" selected />
          <Chip label="Icon" iconStart="tag" />
          <Chip label="Icon, selected" iconStart="tag" selected />
          <Chip label="Disabled" disabled />
          <Chip label="Disabled, selected" selected disabled />
        </Row>
        <Row label="bar">
          {/* Narrower than its chips, so the row has to scroll. */}
          <div className="min-w-0 max-w-md flex-1">
            <ChipBar label="Filter the tasks">
              {FILTERS.map((filter) => (
                <Chip
                  key={filter.value}
                  label={filter.label}
                  iconStart={filter.icon}
                  selected={filters.includes(filter.value)}
                  onPress={() => toggleFilter(filter.value)}
                />
              ))}
            </ChipBar>
          </div>
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs items={PAGES} value={page} onChange={setPage} label="Workspace pages" />
        <Tabs
          items={PAGES.map(({ value, label }) => ({ value, label }))}
          value={page}
          onChange={setPage}
          label="Workspace pages, without icons"
        />
        <Tabs
          items={PAGES.slice(0, 3)}
          value={page === "billing" || page === "settings" ? "overview" : page}
          onChange={setPage}
          label="Workspace pages, full width"
          fullWidth
        />
        {/* Narrower than its tabs, so the row has to scroll. */}
        <div className="max-w-xs">
          <Tabs items={PAGES} value={page} onChange={setPage} label="Workspace pages, scrolling" />
        </div>
      </Section>

      <Section title="Badges">
        <Row label="tone">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
        <Row label="dot">
          <Badge tone="success" dot>
            Online
          </Badge>
          <Badge tone="warning" dot>
            Connecting
          </Badge>
          <Badge tone="danger" dot>
            Offline
          </Badge>
        </Row>
        <Row label="icon">
          <Badge tone="success" icon="check">
            Verified
          </Badge>
          <Badge tone="warning" icon="clock">
            Pending
          </Badge>
          <Badge icon="lock">Private</Badge>
          <Badge tone="accent" dot icon="sparkles">
            New
          </Badge>
        </Row>
        <Row label="overlay">
          {[
            { name: "dark", src: NIGHT },
            { name: "light", src: DAY },
          ].map((block) => (
            <span key={block.name} className="relative inline-flex overflow-hidden rounded-acme-md">
              <img src={block.src} alt="" className="h-24 w-48 object-cover" />
              <span className="absolute start-2 top-2">
                <Badge tone="overlay" icon="play">
                  2:45
                </Badge>
              </span>
              <span className="absolute end-2 bottom-2">
                <Badge tone="overlay">On a {block.name} picture</Badge>
              </span>
            </span>
          ))}
        </Row>
        <Row label="count">
          <CountBadge count={3} />
          <CountBadge count={120} />
          <CountBadge count={7} max={5} />
          <span className="flex items-center gap-6 ps-3 text-acme-text-primary">
            <CountBadge count={3} label="3 unread notifications">
              <Icon name="bell" size="lg" />
            </CountBadge>
            <CountBadge count={120} label="More than 99 unread messages">
              <Icon name="mail" size="lg" />
            </CountBadge>
            <CountBadge count={2} label="2 new messages from Ada Lovelace">
              <Avatar name="Ada Lovelace" size="lg" />
            </CountBadge>
            <CountBadge count={12} label="12 items in the cart">
              <Button variant="ghost" iconStart="shopping-cart" aria-label="Cart" />
            </CountBadge>
            <CountBadge count={0}>
              <Icon name="message-square" size="lg" label="Messages, none unread" />
            </CountBadge>
          </span>
        </Row>
      </Section>

      <Section title="Banners">
        {BANNER_TONES.map((tone) => (
          <Banner key={tone} tone={tone} title={tone}>
            Your changes are saved on this device. They sync when you are back online.
          </Banner>
        ))}
        {dismissed ? (
          <Button size="sm" onPress={() => setDismissed(false)}>
            Show the dismissed banner again
          </Button>
        ) : (
          <Banner
            tone="warning"
            title="Your trial ends in three days"
            action={{ label: "Choose a plan", onPress: () => {} }}
            onDismiss={() => setDismissed(true)}
          >
            After that the workspace becomes read-only until a plan is chosen.
          </Banner>
        )}
        <Banner tone="info" onDismiss={() => {}} dismissLabel="Dismiss the update notice">
          A new version is available.
        </Banner>
        <Banner tone="danger" action={{ label: "Try again", onPress: () => {} }}>
          The report could not be sent.
        </Banner>
      </Section>

      <Section title="Card">
        <Card
          title="Weekly report"
          description="Updated a few minutes ago."
          actions={
            <Badge tone="success" dot>
              Online
            </Badge>
          }
        >
          <Text tone="secondary">A card groups related content.</Text>
          <Divider />
          <Row label="spinner">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" label="Loading" />
          </Row>
          <Row label="avatar">
            <Avatar name="Ada Lovelace" size="sm" />
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" size="lg" />
            <Avatar name="Alan Turing" size="xl" />
          </Row>
          <Row label="picture">
            <Avatar name="Ada Lovelace" src={PORTRAIT} size="sm" />
            <Avatar name="Ada Lovelace" src={PORTRAIT} />
            <Avatar name="Ada Lovelace" src={PORTRAIT} size="lg" />
            <Avatar name="Ada Lovelace" src={PORTRAIT} size="xl" />
            <Avatar name="Grace Hopper" src={BROKEN} size="xl" />
            <Text variant="detail" tone="secondary" as="span">
              The last picture fails to load.
            </Text>
          </Row>
          <Row label="stack">
            <AvatarStack people={PEOPLE.slice(0, 3)} />
            <AvatarStack people={PEOPLE} />
            <AvatarStack people={PEOPLE} max={3} size="sm" />
            <AvatarStack people={PEOPLE} max={2} size="lg" label="The design team, 7 people" />
            <AvatarStack people={PEOPLE} max={3} size="xl" />
          </Row>
          <Row label="progress">
            <div className="max-w-xs flex-1">
              <ProgressBar value={0.6} label="Upload" />
            </div>
          </Row>
        </Card>
        <div className="grid items-start gap-4 sm:grid-cols-3">
          <Card
            title="Night hike"
            description="Media runs edge to edge."
            media={<img src={NIGHT} alt="" className="h-28 object-cover" />}
          >
            <Text variant="detail" tone="secondary">
              12 km, 4 hours.
            </Text>
          </Card>
          <Card title="Team plan" description="Press anywhere on the card." onPress={() => {}}>
            <Text variant="detail" tone="secondary" as="span">
              Up to 20 people.
            </Text>
          </Card>
          <Card
            title="Yearly billing"
            description={picked ? "Selected. Press to clear." : "Press to select."}
            selected={picked}
            onPress={() => setPicked(!picked)}
          >
            <Text variant="detail" tone="secondary" as="span">
              Two months free.
            </Text>
          </Card>
          <Card
            title="Morning walk"
            description="Selected, with media."
            selected
            media={<img src={DAY} alt="" className="h-28 object-cover" />}
          />
          <Card title="Monthly billing" description="Not selected." selected={false}>
            <Text variant="detail" tone="secondary">
              Cancel at any time.
            </Text>
          </Card>
          <Card title="Selected" description="A card that is not pressable." selected>
            <Text variant="detail" tone="secondary">
              The same size as the one beside it.
            </Text>
          </Card>
        </div>
      </Section>

      <Section title="Media">
        <SectionHeader
          title="Continue watching"
          description="Pick up where you left off."
          action={{ label: "See all", onPress: () => setOpened("See all.") }}
        />
        <div className="flex flex-wrap items-end gap-3">
          {RATIOS.map(({ ratio, width }) => (
            <div key={ratio} className={`flex flex-col gap-1 ${width}`}>
              <Thumbnail src={ratio === "1:1" ? PORTRAIT : NIGHT} alt="" ratio={ratio} />
              <Text variant="footnote" tone="secondary" as="span">
                {ratio}
              </Text>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              caption: "Fails to load",
              thumbnail: <Thumbnail src={BROKEN} alt="A picture that fails to load" />,
            },
            { caption: "No picture, badge", thumbnail: <Thumbnail alt="" badge="Live" /> },
            { caption: "Badge", thumbnail: <Thumbnail src={DAY} alt="" badge="12:04" /> },
            {
              caption: "Progress",
              thumbnail: <Thumbnail src={NIGHT} alt="" progress={0.35} />,
            },
            {
              caption: "Badge and progress",
              thumbnail: <Thumbnail src={DAY} alt="" badge="3:27" progress={0.8} />,
            },
          ].map(({ caption, thumbnail }) => (
            <div key={caption} className="flex flex-col gap-1">
              {thumbnail}
              <Text variant="footnote" tone="secondary" as="span">
                {caption}
              </Text>
            </div>
          ))}
        </div>
        <div className="grid items-start gap-2 sm:grid-cols-3">
          <MediaCard
            src={NIGHT}
            title="Night hike above the city: four hours, twelve kilometres and one long staircase"
            meta={["Ada Lovelace", "12K views · 3 days ago"]}
            badge="12:04"
            progress={0.35}
            leading={<Avatar name="Ada Lovelace" src={PORTRAIT} />}
            action={videoActions("Night hike")}
            onPress={() => setOpened("Opened Night hike.")}
          />
          <MediaCard
            src={DAY}
            title="Morning walk"
            meta={["Grace Hopper", "840 views · 1 week ago"]}
            badge="3:27"
            leading={<Avatar name="Grace Hopper" />}
            action={videoActions("Morning walk")}
            onPress={() => setOpened("Opened Morning walk.")}
          />
          <MediaCard
            src={BROKEN}
            title="Not pressable, and its picture fails to load"
            meta={["Alan Turing"]}
          />
        </div>
        <div className="grid items-start gap-2 sm:grid-cols-2">
          <MediaCard
            layout="horizontal"
            src={DAY}
            title="Ten small changes that make a report easier to read"
            meta={["Katherine Johnson", "5 min read"]}
            badge="5:12"
            progress={0.6}
            action={videoActions("Ten small changes")}
            onPress={() => setOpened("Opened Ten small changes.")}
          />
          <MediaCard
            layout="horizontal"
            src={NIGHT}
            ratio="1:1"
            title="Square, without an action"
            meta={["Margaret Hamilton", "2 days ago"]}
            onPress={() => setOpened("Opened Square.")}
          />
        </div>
        <Text variant="detail" tone="secondary">
          {opened}
        </Text>
        <SectionHeader
          icon="history"
          title="On its own"
          description="An icon, a description and an action, at heading level 3."
          action={{ label: "Clear history", onPress: () => setOpened("Cleared the history.") }}
          level={3}
        />
      </Section>

      <Section title="List">
        <Card flush>
          <ListRow
            leading={<Avatar name="Ada Lovelace" />}
            title="Ada Lovelace"
            description="ada@example.com"
            trailing={<Badge tone="accent">Owner</Badge>}
          />
          <Divider />
          <ListRow
            title="Notifications"
            description="Mentions and replies"
            trailing={
              <Switch
                checked={notifications}
                onChange={setNotifications}
                aria-label="Notifications"
              />
            }
          />
          <Divider />
          <ListRow
            title="Language"
            trailing={
              <Text tone="secondary" as="span">
                English
              </Text>
            }
            chevron
            onPress={() => {}}
          />
          <Divider />
          <ListRow
            title="Storage"
            description="Unavailable offline"
            chevron
            onPress={() => {}}
            disabled
          />
          <Divider />
          <ListRow
            leading={<Avatar name="Grace Hopper" />}
            title="Grace Hopper"
            description="The selected row"
            trailing={<CountBadge count={3} label="3 unread messages" />}
            selected
            onPress={() => {}}
          />
          <Divider />
          <ListRow title="Selected, without an action" description="Read-only" selected />
        </Card>
        <Card flush className="max-w-xs">
          <ListRow
            compact
            leading={<Icon name="mail" size="sm" className="text-acme-text-secondary" />}
            title="Inbox"
            trailing={<CountBadge count={12} label="12 unread" />}
            selected
            onPress={() => {}}
          />
          <ListRow
            compact
            leading={<Icon name="file-text" size="sm" className="text-acme-text-secondary" />}
            title="Drafts"
            onPress={() => {}}
          />
          <ListRow
            compact
            leading={<Icon name="clock" size="sm" className="text-acme-text-secondary" />}
            title="Scheduled"
            description="Compact, with a description"
            onPress={() => {}}
          />
          <ListRow
            compact
            leading={<Icon name="trash" size="sm" className="text-acme-text-secondary" />}
            title="Trash"
            onPress={() => {}}
            disabled
          />
        </Card>
      </Section>

      <Section title="Sidebar">
        <div className="grid gap-4 sm:grid-cols-2">
          {[false, true].map((collapsed) => (
            // A fixed height, as a window would give it, so the footer sits at the bottom, and
            // a page beside the sidebar, as an app has.
            <div
              key={String(collapsed)}
              className="flex h-[28rem] overflow-hidden rounded-acme-md border border-acme-border-default"
            >
              <Sidebar
                label={collapsed ? "Workspace, collapsed" : "Workspace"}
                sections={PLACES}
                value={place}
                onChange={setPlace}
                collapsed={collapsed}
                header={
                  <div
                    className={`flex h-acme-control-md items-center gap-2 ${collapsed ? "justify-center" : "px-2"}`}
                  >
                    <span className="flex size-acme-avatar-md items-center justify-center rounded-acme-md bg-acme-accent-default text-acme-text-on-accent">
                      <Icon name="sparkles" size="sm" />
                    </span>
                    {!collapsed && (
                      <Text variant="label" as="span">
                        Acme
                      </Text>
                    )}
                  </div>
                }
                footer={
                  <div
                    className={`flex items-center gap-2 py-1 ${collapsed ? "justify-center" : "px-2"}`}
                  >
                    <Avatar name="Ada Lovelace" src={PORTRAIT} size="sm" />
                    {!collapsed && (
                      <Text variant="detail" as="span">
                        Ada Lovelace
                      </Text>
                    )}
                  </div>
                }
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
                <Text variant="heading" as="span">
                  {PLACES.flatMap((section) => section.items).find((item) => item.value === place)
                    ?.label ?? place}
                </Text>
                <Text variant="detail" tone="secondary" as="span">
                  {collapsed
                    ? "Rest the pointer on an icon, or focus it, for its name."
                    : "The page of the current place."}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Accordion">
        <div className="grid items-start gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Text variant="label" tone="secondary">
              One at a time
            </Text>
            <Accordion items={QUESTIONS} expanded={question} onChange={setQuestion} />
          </div>
          <div className="flex flex-col gap-2">
            <Text variant="label" tone="secondary">
              Several at once
            </Text>
            <Accordion
              items={PREFERENCES}
              expanded={preferences}
              onChange={setPreferences}
              multiple
            />
          </div>
        </div>
      </Section>

      <Section title="Menu">
        <Row label="menu">
          <span ref={menu} className="flex">
            <Menu
              label="Report actions"
              trigger={<Button iconEnd="chevron-down">Actions</Button>}
              items={[
                { label: "Rename", icon: "pencil", onSelect: () => setChosen("Rename") },
                { label: "Duplicate", icon: "copy", onSelect: () => setChosen("Duplicate") },
                { label: "Share", icon: "share-2", onSelect: () => {}, disabled: true },
                "separator",
                {
                  label: "Comfortable",
                  icon: "list",
                  selected: density === "comfortable",
                  onSelect: () => setDensity("comfortable"),
                },
                {
                  label: "Compact",
                  icon: "layout-grid",
                  selected: density === "compact",
                  onSelect: () => setDensity("compact"),
                },
                "separator",
                {
                  label: "Delete",
                  icon: "trash",
                  danger: true,
                  onSelect: () => setChosen("Delete"),
                },
              ]}
            />
          </span>
          <Menu
            label="More actions"
            align="end"
            trigger={<IconButton icon="ellipsis" label="More actions" variant="secondary" />}
            items={[
              { label: "Copy the link", onSelect: () => setChosen("Copy the link") },
              { label: "Open in a new window", onSelect: () => setChosen("Open in a new window") },
            ]}
          />
          <Text variant="detail" tone="secondary" as="span">
            {chosen} Density: {density}.
          </Text>
        </Row>
      </Section>

      <Section title="Dialog">
        <Row label="dialog">
          <Button variant="danger" onPress={() => setConfirming(true)}>
            Delete the report
          </Button>
          <Button onPress={() => setAsking(true)}>A question that must be answered</Button>
        </Row>
        <Dialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title="Delete the weekly report?"
          description="The report and its 12 comments are removed for everyone. This cannot be undone."
          actions={
            <>
              <Button onPress={() => setConfirming(false)}>Cancel</Button>
              <Button variant="danger" onPress={() => setConfirming(false)}>
                Delete
              </Button>
            </>
          }
        />
        <Dialog
          open={asking}
          onClose={() => setAsking(false)}
          dismissible={false}
          title="Keep the changes?"
          description="You edited the report in another window."
          actions={
            <>
              <Button onPress={() => setAsking(false)}>Discard</Button>
              <Button variant="primary" onPress={() => setAsking(false)}>
                Keep
              </Button>
            </>
          }
        >
          <TextField label="Name of the copy" value={copyName} onChange={setCopyName} />
        </Dialog>
      </Section>

      <Section title="Toast">
        <Row label="toast">
          <Button
            onPress={() => {
              setDeleted(true);
              setToast(true);
            }}
          >
            Delete a draft
          </Button>
          <Text variant="detail" tone="secondary" as="span">
            {deleted ? "The draft is deleted." : "The draft is there."}
          </Text>
        </Row>
        <Toast
          open={toast}
          onClose={() => setToast(false)}
          message="The draft was deleted."
          action={{ label: "Undo", onPress: () => setDeleted(false) }}
          // The scripted mode keeps it, so a capture does not race the timer.
          {...(OPEN === "toast" ? { duration: 0 } : {})}
        />
      </Section>

      <Section title="Skeleton">
        <Row label="shape">
          <div className="flex w-48 flex-col gap-2">
            <Skeleton />
            <Skeleton width="60%" />
          </div>
          <Skeleton shape="rect" width={96} height={64} />
          <Skeleton shape="circle" width={40} />
        </Row>
        {/* The screen says that it is loading, once, since the placeholders say nothing. */}
        <Card className="max-w-sm" flush>
          <div role="status" aria-label="Loading the report" className="flex flex-col">
            <Skeleton shape="rect" height={128} />
            <div className="flex items-center gap-3 p-4">
              <Skeleton shape="circle" width={40} />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton width="70%" />
                <Skeleton width="40%" />
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Empty state">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <EmptyState
              icon="mail"
              title="No messages yet"
              description="When someone writes to you, the conversation shows up here."
              action={
                <Button variant="primary" iconStart="plus">
                  New message
                </Button>
              }
            />
          </Card>
          <Card>
            <EmptyState
              icon="search"
              title="No results"
              description="Try fewer words, or check the spelling."
            />
          </Card>
        </div>
      </Section>
    </main>
  );
}
