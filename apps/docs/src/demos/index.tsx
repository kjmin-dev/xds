// The live examples on the component pages: the real components from @acme/ui, not pictures.
// Each one is shown by `/demo/<name>/`, which a component page embeds in a frame of its own so
// the design system's stylesheet and the site's stay apart.

import {
  Avatar,
  AvatarStack,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  CountBadge,
  Divider,
  Icon,
  ListRow,
  ProgressBar,
  SegmentedControl,
  Spinner,
  Switch,
  Text,
  TextField,
} from "@acme/ui";
import { type ReactNode, useEffect, useState } from "react";

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
);
const Column = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full max-w-md flex-col gap-4">{children}</div>
);

// The pictures are drawn here and carried in the page, so the examples load nothing from the
// network. Their colors are the pictures' own, in both color modes.
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
// Not a picture, so it fails to load at once and without a request.
const BROKEN = "data:image/png;base64,AAAA";

const PEOPLE = [
  { name: "Ada Lovelace", src: PORTRAIT },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Margaret Hamilton" },
  { name: "Barbara Liskov" },
];

function ButtonDemo() {
  const [liked, setLiked] = useState(true);
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <Button variant="primary">Save</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="danger">Delete</Button>
      </Row>
      <Row>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" loading>
          Saving
        </Button>
      </Row>
      <Row>
        <Button variant="primary" iconStart="plus">
          New
        </Button>
        <Button iconEnd="chevron-down">Options</Button>
        <Button iconStart="download" loading>
          Export
        </Button>
        <Button variant="ghost" iconStart="settings" aria-label="Settings" />
      </Row>
      <Row>
        <Button iconStart="heart" selected={liked} onPress={() => setLiked(!liked)}>
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
      </Row>
    </div>
  );
}

function TextFieldDemo() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("12345");
  const [error, setError] = useState<string | undefined>("That code is wrong or has expired.");
  const [query, setQuery] = useState("");
  const [bio, setBio] = useState("Writes programs for machines that do not exist yet.");
  return (
    <Column>
      <TextField
        label="Email"
        type="email"
        placeholder="name@example.com"
        description="We send the sign-in code to this address."
        value={email}
        onChange={setEmail}
      />
      <TextField
        label="Sign-in code"
        inputMode="numeric"
        value={code}
        error={error}
        onChange={(value) => {
          setCode(value);
          setError(undefined);
        }}
      />
      <TextField label="Organization" value="Acme Inc." disabled onChange={() => {}} />
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
        label="Bio"
        description="Shown on your profile."
        multiline
        maxLength={80}
        value={bio}
        onChange={setBio}
      />
    </Column>
  );
}

function TextDemo() {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="display" as="h1">
        Display 다람쥐 헌 쳇바퀴
      </Text>
      <Text variant="title" as="h2">
        Title 다람쥐 헌 쳇바퀴
      </Text>
      <Text variant="heading" as="h3">
        Heading 다람쥐 헌 쳇바퀴
      </Text>
      <Text variant="body">Body. The quick brown fox jumps over the lazy dog.</Text>
      <Text variant="body-strong">Body strong. The quick brown fox.</Text>
      <Text variant="label">Label</Text>
      <Text variant="detail" tone="secondary">
        Detail, in the secondary tone.
      </Text>
      <Text variant="footnote" tone="secondary">
        Footnote
      </Text>
      <Row>
        <Text tone="accent">Accent</Text>
        <Text tone="success">Success</Text>
        <Text tone="warning">Warning</Text>
        <Text tone="danger">Danger</Text>
      </Row>
    </div>
  );
}

function BadgeDemo() {
  return (
    <div className="flex flex-col gap-3">
      <Row>
        <Badge>Draft</Badge>
        <Badge tone="accent">New</Badge>
        <Badge tone="success" dot>
          Connected
        </Badge>
        <Badge tone="warning" icon="clock">
          Expiring
        </Badge>
        <Badge tone="danger">Failed</Badge>
      </Row>
      <span className="relative inline-flex w-fit overflow-hidden rounded-acme-md">
        <img src={NIGHT} alt="" className="h-24 w-48 object-cover" />
        <span className="absolute start-2 top-2">
          <Badge tone="overlay" icon="play">
            2:45
          </Badge>
        </span>
      </span>
    </div>
  );
}

function CountBadgeDemo() {
  return (
    <div className="flex items-center gap-6 p-2 text-acme-text-primary">
      <CountBadge count={3} />
      <CountBadge count={120} />
      <CountBadge count={3} label="3 unread notifications">
        <Icon name="bell" size="lg" />
      </CountBadge>
      <CountBadge count={2} label="2 new messages from Ada Lovelace">
        <Avatar name="Ada Lovelace" size="lg" />
      </CountBadge>
      <CountBadge count={12} label="12 items in the cart">
        <Button variant="ghost" iconStart="shopping-cart" aria-label="Cart" />
      </CountBadge>
    </div>
  );
}

function BannerDemo() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Column>
      <Banner tone="info">A new version is available.</Banner>
      <Banner tone="success" title="Saved">
        Your changes are live.
      </Banner>
      {dismissed ? (
        <div>
          <Button size="sm" onPress={() => setDismissed(false)}>
            Show the banner again
          </Button>
        </div>
      ) : (
        <Banner
          tone="warning"
          title="Your trial ends in three days"
          action={{ label: "Choose a plan", onPress: () => {} }}
          onDismiss={() => setDismissed(true)}
        >
          After that the workspace becomes read-only.
        </Banner>
      )}
      <Banner tone="danger" title="Could not save">
        Check your connection and try again.
      </Banner>
    </Column>
  );
}

function CardDemo() {
  const [picked, setPicked] = useState(true);
  return (
    <Column>
      <Card
        title="Weekly report"
        description="Sent every Monday at 9:00."
        actions={<Button size="sm">Edit</Button>}
      >
        <Text tone="secondary">A card groups related content.</Text>
      </Card>
      <Card
        title="Night hike"
        description="Media runs edge to edge."
        media={<img src={NIGHT} alt="" className="h-28 object-cover" />}
      />
      <Card
        title="Yearly billing"
        description={picked ? "Selected. Press to clear." : "Press to select."}
        selected={picked}
        onPress={() => setPicked(!picked)}
      />
    </Column>
  );
}

function DividerDemo() {
  return (
    <Column>
      <Text>Above the line</Text>
      <Divider />
      <Text>Below the line</Text>
    </Column>
  );
}

function SpinnerDemo() {
  return (
    <Row>
      <Spinner size="sm" />
      <Spinner size="md" label="Loading" />
      <Spinner size="lg" />
    </Row>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  return (
    <Row>
      <Switch label="Notifications" checked={on} onChange={setOn} />
      <Switch label="Weekly digest" checked={off} onChange={setOff} />
      <Switch label="Locked" checked={false} disabled onChange={() => {}} />
    </Row>
  );
}

function CheckboxDemo() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  return (
    <Row>
      <Checkbox label="Remember me" checked={on} onChange={setOn} />
      <Checkbox label="Send me updates" checked={off} onChange={setOff} />
      <Checkbox label="Locked" checked disabled onChange={() => {}} />
    </Row>
  );
}

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

function SegmentedControlDemo() {
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("week");
  return <SegmentedControl aria-label="Period" options={VIEWS} value={view} onChange={setView} />;
}

function AvatarDemo() {
  return (
    <Row>
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
      <Avatar name="김민준" size="lg" />
      <Avatar name="Ada Lovelace" size="xl" />
      <Avatar name="Ada Lovelace" src={PORTRAIT} size="xl" />
      {/* A picture that fails to load leaves the initials. */}
      <Avatar name="Grace Hopper" src={BROKEN} size="xl" />
    </Row>
  );
}

function AvatarStackDemo() {
  return (
    // On a surface, which is the color of the ring between two avatars.
    <div className="flex w-fit flex-wrap items-center gap-6 rounded-acme-lg bg-acme-background-surface p-4">
      <AvatarStack people={PEOPLE.slice(0, 3)} />
      <AvatarStack people={PEOPLE} />
      <AvatarStack people={PEOPLE} max={2} size="lg" label="The design team, 6 people" />
    </div>
  );
}

function ProgressBarDemo() {
  return (
    <Column>
      <ProgressBar label="Upload" value={0.6} />
    </Column>
  );
}

function ListRowDemo() {
  const [on, setOn] = useState(true);
  return (
    <Column>
      <Card flush>
        <ListRow
          title="Ada Lovelace"
          description="ada@example.com"
          leading={<Avatar name="Ada Lovelace" />}
          trailing={<Badge tone="accent">Owner</Badge>}
        />
        <Divider />
        <ListRow
          title="Notifications"
          description="Mentions and replies"
          trailing={<Switch aria-label="Notifications" checked={on} onChange={setOn} />}
        />
        <Divider />
        <ListRow
          title="Language"
          trailing={<Text tone="secondary">English</Text>}
          chevron
          onPress={() => {}}
        />
      </Card>
      <Card flush>
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
      </Card>
    </Column>
  );
}

function IconDemo() {
  return (
    <div className="flex flex-col gap-4 text-acme-text-primary">
      <Row>
        <Icon name="house" label="Home" />
        <Icon name="search" label="Search" />
        <Icon name="bell" label="Notifications" />
        <Icon name="settings" label="Settings" />
        <Icon name="share-2" label="Share" />
        <Icon name="download" label="Download" />
        <Icon name="ellipsis-vertical" label="More" />
      </Row>
      <div className="flex items-end gap-3">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Icon key={size} name="house" size={size} label={`Home, ${size}`} />
        ))}
      </div>
      <Row>
        {(["heart", "star", "bookmark", "thumbs-up", "bell"] as const).map((name) => (
          <span key={name} className="flex items-center gap-1">
            <Icon name={name} />
            <Icon name={name} filled label={`${name}, filled`} />
          </span>
        ))}
      </Row>
    </div>
  );
}

const DEMOS = {
  button: ButtonDemo,
  "text-field": TextFieldDemo,
  text: TextDemo,
  badge: BadgeDemo,
  "count-badge": CountBadgeDemo,
  banner: BannerDemo,
  card: CardDemo,
  divider: DividerDemo,
  spinner: SpinnerDemo,
  switch: SwitchDemo,
  checkbox: CheckboxDemo,
  "segmented-control": SegmentedControlDemo,
  avatar: AvatarDemo,
  "avatar-stack": AvatarStackDemo,
  "progress-bar": ProgressBarDemo,
  icon: IconDemo,
  "list-row": ListRowDemo,
} as const;

export type DemoName = keyof typeof DEMOS;
export const DEMO_NAMES = Object.keys(DEMOS) as DemoName[];

/** One example, which also tells the page that embeds it how tall it is. */
export function Demo({ name }: { name: DemoName }) {
  const Example = DEMOS[name];
  useEffect(() => {
    const report = () =>
      parent.postMessage({ demo: name, height: document.documentElement.scrollHeight }, "*");
    const observer = new ResizeObserver(report);
    observer.observe(document.body);
    report();
    return () => observer.disconnect();
  }, [name]);
  return <Example />;
}
