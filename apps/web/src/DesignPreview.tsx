// The design preview: every token group and every component in every variant and state, at
// `/design`. The mobile app has the same screen at `/design`, and the desktop app opens it with
// `acme --design`.

import { colors, icons, radius, size, space, typography } from "@acme/tokens";
import {
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
  type ControlSize,
  CountBadge,
  Divider,
  Icon,
  type IconName,
  type IconSize,
  ListRow,
  ProgressBar,
  SegmentedControl,
  Spinner,
  Switch,
  Text,
  TextField,
  type TextVariant,
} from "@acme/ui";
import { type ReactNode, useState } from "react";

type Theme = "light" | "dark";

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|card|switch|checkbox|segmented|avatar|progress|listRow|topBar|tabBar|sheet)/;

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
  "Badges",
  "Banners",
  "Card",
  "List",
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

/** Each section can be linked to: `/design#buttons`. */
function Section({ title, children }: { title: (typeof SECTIONS)[number]; children: ReactNode }) {
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
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

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
    </main>
  );
}
