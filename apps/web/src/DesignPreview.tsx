// The design preview: every token group and every component in every variant and state, at
// `/design`. The mobile app has the same screen at `/design`, and the desktop app opens it with
// `acme --design`.

import { colors, icons, radius, size, space, typography } from "@acme/tokens";
import {
  Avatar,
  Badge,
  type BadgeTone,
  Banner,
  type BannerTone,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  type ControlSize,
  Divider,
  Icon,
  type IconName,
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
  /^(button|field|badge|banner|switch|checkbox|segmented|avatar|progress|listRow|topBar|tabBar|sheet)/;

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
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];
const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];
const TEXT_VARIANTS = Object.keys(typography) as (keyof typeof typography)[];

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
          <a className="text-acme-detail text-acme-text-accent underline" href="/">
            Back to the app
          </a>
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
      </Section>

      <Section title="Banners">
        {BANNER_TONES.map((tone) => (
          <Banner key={tone} tone={tone} title={tone}>
            Your changes are saved on this device. They sync when you are back online.
          </Banner>
        ))}
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
          </Row>
          <Row label="progress">
            <div className="max-w-xs flex-1">
              <ProgressBar value={0.6} label="Upload" />
            </div>
          </Row>
        </Card>
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
        </Card>
      </Section>
    </main>
  );
}
