// The live examples on the component pages: the real components from @acme/ui, not pictures.
// Each one is shown by `/demo/<name>/`, which a component page embeds in a frame of its own so
// the design system's stylesheet and the site's stay apart.

import {
  Accordion,
  Avatar,
  AvatarStack,
  Badge,
  Banner,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  Chip,
  ChipBar,
  CountBadge,
  Dialog,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  type IconName,
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
  Thumbnail,
  Toast,
  Tooltip,
} from "@acme/ui";
import { type ReactNode, useState } from "react";

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

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

function IconButtonDemo() {
  const [pinned, setPinned] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <Row>
        {VARIANTS.map((variant) => (
          <IconButton
            key={variant}
            icon="settings"
            label={`Settings, ${variant}`}
            variant={variant}
          />
        ))}
      </Row>
      <Row>
        <IconButton icon="download" label="Download, small" size="sm" />
        <IconButton icon="download" label="Download" />
        <IconButton icon="download" label="Download, large" size="lg" />
        <IconButton icon="download" label="Download, unavailable" disabled />
        <IconButton icon="download" label="Downloading" variant="secondary" loading />
      </Row>
      <Row>
        <IconButton icon="pin" label="Pin" selected={pinned} onPress={() => setPinned(!pinned)} />
        <IconButton icon="star" label="Star" variant="secondary" selected />
        <IconButton icon="star" label="Star" variant="secondary" selected={false} />
      </Row>
    </div>
  );
}

const FILTERS = [
  { value: "open", label: "Open", icon: "flag" },
  { value: "mine", label: "Assigned to me", icon: "user" },
  { value: "mentions", label: "Mentions", icon: "message-square" },
  { value: "review", label: "Needs review", icon: "eye" },
  { value: "blocked", label: "Blocked", icon: "ban" },
  { value: "done", label: "Done this week", icon: "check-check" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

/** The filters that are on, and a way to turn one on or off. The chips themselves hold none. */
function useFilters(initial: readonly string[]) {
  const [on, setOn] = useState(initial);
  const toggle = (name: string) =>
    setOn(on.includes(name) ? on.filter((other) => other !== name) : [...on, name]);
  return [on, toggle] as const;
}

function ChipDemo() {
  const [on, toggle] = useFilters(["review"]);
  return (
    <Row>
      <Chip label="Open" selected={on.includes("open")} onPress={() => toggle("open")} />
      <Chip
        label="Needs review"
        iconStart="eye"
        selected={on.includes("review")}
        onPress={() => toggle("review")}
      />
      <Chip
        label="Mentions"
        iconStart="message-square"
        selected={on.includes("mentions")}
        onPress={() => toggle("mentions")}
      />
      <Chip label="Archived" disabled />
    </Row>
  );
}

function ChipBarDemo() {
  const [on, toggle] = useFilters(["open", "review"]);
  return (
    // Narrower than its chips, so the row scrolls.
    <div className="max-w-sm">
      <ChipBar label="Filter the tasks">
        {FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            iconStart={filter.icon}
            selected={on.includes(filter.value)}
            onPress={() => toggle(filter.value)}
          />
        ))}
      </ChipBar>
    </div>
  );
}

const PAGES = [
  { value: "overview", label: "Overview", icon: "house" },
  { value: "activity", label: "Activity", icon: "bell" },
  { value: "members", label: "Members", icon: "users" },
  { value: "billing", label: "Billing", icon: "credit-card" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

const DETAILS = [
  { value: "comments", label: "Comments" },
  { value: "history", label: "Change history" },
  { value: "linked", label: "Linked issues" },
] as const;

function TabsDemo() {
  const [page, setPage] = useState<(typeof PAGES)[number]["value"]>("overview");
  const [detail, setDetail] = useState<(typeof DETAILS)[number]["value"]>("comments");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Tabs items={PAGES} value={page} onChange={setPage} label="Workspace pages" />
        {/* The tabs are only the row: the page shows the view that matches the value. */}
        <Text variant="detail" tone="secondary">
          The {PAGES.find((item) => item.value === page)?.label} view goes here.
        </Text>
      </div>
      <Tabs items={DETAILS} value={detail} onChange={setDetail} label="Issue details" fullWidth />
    </div>
  );
}

function MenuDemo() {
  const [chosen, setChosen] = useState("Nothing chosen yet.");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  return (
    // Tall enough for the open menu, which would otherwise be cut off by the frame.
    <div className="flex min-h-80 flex-col gap-3">
      <Row>
        <Menu
          label="Report actions"
          trigger={<Button iconEnd="chevron-down">Actions</Button>}
          items={[
            { label: "Rename", icon: "pencil", onSelect: () => setChosen("Rename.") },
            { label: "Duplicate", icon: "copy", onSelect: () => setChosen("Duplicate.") },
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
            { label: "Delete", icon: "trash", danger: true, onSelect: () => setChosen("Delete.") },
          ]}
        />
        <Menu
          label="More actions"
          align="end"
          trigger={<IconButton icon="ellipsis" label="More actions" variant="secondary" />}
          items={[
            { label: "Copy the link", onSelect: () => setChosen("Copy the link.") },
            { label: "Open in a new window", onSelect: () => setChosen("Open in a new window.") },
          ]}
        />
      </Row>
      <Text variant="detail" tone="secondary">
        {chosen} Density: {density}.
      </Text>
    </div>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    // The dialog is centered in the frame, so the frame has to be tall enough to hold it.
    <div className="flex min-h-72 flex-col items-start gap-3">
      <Button variant="danger" onPress={() => setOpen(true)}>
        Delete the report
      </Button>
      <Text variant="detail" tone="secondary">
        {deleted ? "The report is deleted." : "The report is still there."}
      </Text>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete the weekly report?"
        description="The report and its 12 comments are removed for everyone. This cannot be undone."
        actions={
          <>
            <Button onPress={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onPress={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function ToastDemo() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    // The toast sits at the bottom of the frame, clear of the button above it.
    <div className="flex min-h-40 flex-col items-start gap-3">
      <Button
        onPress={() => {
          setDeleted(true);
          setOpen(true);
        }}
      >
        Delete a draft
      </Button>
      <Text variant="detail" tone="secondary">
        {deleted ? "The draft is deleted." : "The draft is there."}
      </Text>
      <Toast
        open={open}
        onClose={() => setOpen(false)}
        message="The draft was deleted."
        action={{ label: "Undo", onPress: () => setDeleted(false) }}
      />
    </div>
  );
}

function TooltipDemo() {
  return (
    // Room above the controls, where the tooltips appear.
    <div className="flex flex-col gap-3 pt-10">
      <Row>
        <Tooltip label="Search" shortcut="⌘K">
          <IconButton icon="search" label="Search" />
        </Tooltip>
        <Tooltip label="Share">
          <IconButton icon="share-2" label="Share" variant="secondary" />
        </Tooltip>
        <Tooltip label="Export as a spreadsheet" placement="bottom">
          <Button iconStart="download">Export</Button>
        </Tooltip>
      </Row>
      <Text variant="detail" tone="secondary">
        Rest the pointer on a control, or focus it with the keyboard.
      </Text>
    </div>
  );
}

function SkeletonDemo() {
  return (
    <Column>
      {/* The screen says that it is loading, once, since the placeholders say nothing. */}
      <Card flush>
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
    </Column>
  );
}

function SearchFieldDemo() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  return (
    <Column>
      <SearchField
        label="Search projects"
        placeholder="Search projects"
        value={query}
        onChange={setQuery}
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
      <Text variant="detail" tone="secondary">
        {submitted ? `Searched for “${submitted}”.` : "Enter searches, Escape clears."}
      </Text>
    </Column>
  );
}

const DELIVERY = [
  { value: "standard", label: "Standard", description: "Three to five working days. Free." },
  { value: "express", label: "Express", description: "The next working day. 9 euros." },
  { value: "pickup", label: "Pick up in a store" },
] as const;

function RadioGroupDemo() {
  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]["value"]>("standard");
  const [size, setSize] = useState<string>();
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <RadioGroup label="Delivery" options={DELIVERY} value={delivery} onChange={setDelivery} />
      <RadioGroup
        label="Size"
        options={[
          { value: "s", label: "Small" },
          { value: "m", label: "Medium" },
          { value: "l", label: "Large" },
        ]}
        value={size}
        onChange={setSize}
        {...(size === undefined ? { error: "Choose a size to continue." } : {})}
      />
      <RadioGroup label="Locked" options={DELIVERY} value="express" onChange={() => {}} disabled />
    </div>
  );
}

function SelectDemo() {
  const [plan, setPlan] = useState<string>("team");
  const [country, setCountry] = useState<string>();
  return (
    // Tall enough for the open list, which would otherwise be cut off by the frame.
    <div className="grid min-h-80 content-start gap-4 sm:grid-cols-2">
      <Select
        label="Plan"
        options={[
          { value: "free", label: "Free", description: "Up to 3 projects" },
          { value: "team", label: "Team", description: "Up to 20 people" },
          { value: "business", label: "Business", description: "Single sign-on and audit logs" },
        ]}
        value={plan}
        onChange={setPlan}
        description="Change it at any time."
      />
      <Select
        label="Country"
        placeholder="Choose a country"
        options={["France", "Germany", "Japan", "Korea", "Spain"].map((name) => ({
          value: name.toLowerCase(),
          label: name,
        }))}
        value={country}
        onChange={setCountry}
        {...(country === undefined ? { error: "Choose the country of the invoice." } : {})}
      />
      <Select
        label="Currency"
        options={[{ value: "eur", label: "Euro" }]}
        value="eur"
        onChange={() => {}}
        disabled
      />
    </div>
  );
}

function SliderDemo() {
  const [volume, setVolume] = useState(60);
  const [size, setSize] = useState(16);
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      <Slider label="Volume" value={volume} onChange={setVolume} showValue />
      <Slider
        label="Font size"
        min={12}
        max={24}
        step={2}
        value={size}
        onChange={setSize}
        showValue
      />
      <Slider label="Brightness" value={volume} onChange={setVolume} />
      <Slider label="Locked" value={30} onChange={() => {}} disabled showValue />
    </div>
  );
}

function ThumbnailDemo() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Thumbnail src={NIGHT} alt="A mountain at night" badge="12:04" />
      <Thumbnail src={NIGHT} alt="" progress={0.35} />
      <Thumbnail src={PORTRAIT} alt="" ratio="1:1" badge="3:27" progress={0.8} />
      {/* A picture that fails to load leaves the placeholder. */}
      <Thumbnail src={BROKEN} alt="A picture that fails to load" ratio="4:3" />
    </div>
  );
}

function MediaCardDemo() {
  const [opened, setOpened] = useState("Nothing opened yet.");
  const actions = (title: string) => (
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
  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <MediaCard
          src={NIGHT}
          title="Night hike above the city: four hours, twelve kilometres and one long staircase"
          meta={["Ada Lovelace", "12K views · 3 days ago"]}
          badge="12:04"
          progress={0.35}
          leading={<Avatar name="Ada Lovelace" src={PORTRAIT} />}
          action={actions("Night hike")}
          onPress={() => setOpened("Opened Night hike.")}
        />
        <MediaCard
          layout="horizontal"
          src={NIGHT}
          title="Ten small changes that make a report easier to read"
          meta={["Grace Hopper", "5 min read"]}
          badge="5:12"
          action={actions("Ten small changes")}
          onPress={() => setOpened("Opened Ten small changes.")}
        />
      </div>
      <Text variant="detail" tone="secondary">
        {opened}
      </Text>
    </div>
  );
}

function SectionHeaderDemo() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Continue watching"
        description="Pick up where you left off."
        action={{ label: "See all", onPress: () => {} }}
      />
      <SectionHeader icon="history" title="Recently viewed" level={3} />
    </div>
  );
}

function EmptyStateDemo() {
  return (
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
  );
}

function AccordionDemo() {
  const [open, setOpen] = useState<string[]>(["seats"]);
  return (
    <Column>
      <Accordion
        items={[
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
            content: "Under Settings, then Billing.",
          },
        ]}
        expanded={open}
        onChange={setOpen}
      />
    </Column>
  );
}

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
    ],
  },
];

function SidebarDemo() {
  const [place, setPlace] = useState("messages");
  return (
    <div className="flex flex-wrap gap-4">
      {[false, true].map((collapsed) => (
        // A fixed height, as a window would give it, so the footer sits at the bottom.
        <div
          key={String(collapsed)}
          className="flex h-80 overflow-hidden rounded-acme-md border border-acme-border-default"
        >
          <Sidebar
            label={collapsed ? "Main, collapsed" : "Main"}
            sections={PLACES}
            value={place}
            onChange={setPlace}
            collapsed={collapsed}
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
          <div className="w-32 p-4">
            <Text variant="detail" tone="secondary" as="span">
              {place}
            </Text>
          </div>
        </div>
      ))}
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
  "icon-button": IconButtonDemo,
  chip: ChipDemo,
  "chip-bar": ChipBarDemo,
  tabs: TabsDemo,
  menu: MenuDemo,
  dialog: DialogDemo,
  toast: ToastDemo,
  tooltip: TooltipDemo,
  skeleton: SkeletonDemo,
  "search-field": SearchFieldDemo,
  "radio-group": RadioGroupDemo,
  select: SelectDemo,
  slider: SliderDemo,
  thumbnail: ThumbnailDemo,
  "media-card": MediaCardDemo,
  "section-header": SectionHeaderDemo,
  "empty-state": EmptyStateDemo,
  accordion: AccordionDemo,
  sidebar: SidebarDemo,
} as const;

export type DemoName = keyof typeof DEMOS;
export const DEMO_NAMES = Object.keys(DEMOS) as DemoName[];

export function Demo({ name }: { name: DemoName }) {
  const Example = DEMOS[name];
  return <Example />;
}
