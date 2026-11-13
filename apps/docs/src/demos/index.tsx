// The live examples on the component pages: the real components from @acme/ui, not pictures.
// Each one is shown by `/demo/<name>/`, which a component page embeds in a frame of its own so
// the design system's stylesheet and the site's stay apart.

import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
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

function ButtonDemo() {
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
    </div>
  );
}

function TextFieldDemo() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("12345");
  const [error, setError] = useState<string | undefined>("That code is wrong or has expired.");
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
    <Row>
      <Badge>Draft</Badge>
      <Badge tone="accent">New</Badge>
      <Badge tone="success" dot>
        Connected
      </Badge>
      <Badge tone="warning">Expiring</Badge>
      <Badge tone="danger">Failed</Badge>
    </Row>
  );
}

function BannerDemo() {
  return (
    <Column>
      <Banner tone="info">A new version is available.</Banner>
      <Banner tone="success" title="Saved">
        Your changes are live.
      </Banner>
      <Banner tone="warning">Your trial ends in three days.</Banner>
      <Banner tone="danger" title="Could not save">
        Check your connection and try again.
      </Banner>
    </Column>
  );
}

function CardDemo() {
  return (
    <Column>
      <Card
        title="Weekly report"
        description="Sent every Monday at 9:00."
        actions={<Button size="sm">Edit</Button>}
      >
        <Text tone="secondary">A card groups related content.</Text>
      </Card>
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
    </Row>
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
  banner: BannerDemo,
  card: CardDemo,
  divider: DividerDemo,
  spinner: SpinnerDemo,
  switch: SwitchDemo,
  checkbox: CheckboxDemo,
  "segmented-control": SegmentedControlDemo,
  avatar: AvatarDemo,
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
