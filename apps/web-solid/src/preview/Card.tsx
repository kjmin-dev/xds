import {
  Avatar,
  AvatarStack,
  Badge,
  Card,
  Divider,
  ProgressBar,
  Spinner,
  Text,
} from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { BROKEN, DAY, NIGHT, PORTRAIT, Row } from "./shared.tsx";

const PEOPLE = [
  { name: "Ada Lovelace", src: PORTRAIT },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Margaret Hamilton" },
  { name: "Linus Torvalds" },
  { name: "Barbara Liskov" },
];

export function CardSection() {
  const [picked, setPicked] = createSignal(true);
  return (
    <>
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
          <div class="max-w-xs flex-1">
            <ProgressBar value={0.6} label="Upload" />
          </div>
        </Row>
      </Card>
      <div class="grid items-start gap-4 sm:grid-cols-3">
        <Card
          title="Night hike"
          description="Media runs edge to edge."
          media={<img src={NIGHT} alt="" class="h-28 object-cover" />}
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
          description={picked() ? "Selected. Press to clear." : "Press to select."}
          selected={picked()}
          onPress={() => setPicked(!picked())}
        >
          <Text variant="detail" tone="secondary" as="span">
            Two months free.
          </Text>
        </Card>
        <Card
          title="Morning walk"
          description="Selected, with media."
          selected
          media={<img src={DAY} alt="" class="h-28 object-cover" />}
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
    </>
  );
}
