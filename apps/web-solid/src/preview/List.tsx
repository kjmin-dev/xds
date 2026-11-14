import {
  Avatar,
  Badge,
  Card,
  CountBadge,
  Divider,
  Icon,
  ListRow,
  Switch,
  Text,
} from "@acme/ui-solid";
import { notifications, setNotifications } from "./shared.tsx";

export function ListSection() {
  return (
    <>
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
              checked={notifications()}
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
      <Card flush class="max-w-xs">
        <ListRow
          compact
          leading={<Icon name="mail" size="sm" class="text-acme-text-secondary" />}
          title="Inbox"
          trailing={<CountBadge count={12} label="12 unread" />}
          selected
          onPress={() => {}}
        />
        <ListRow
          compact
          leading={<Icon name="file-text" size="sm" class="text-acme-text-secondary" />}
          title="Drafts"
          onPress={() => {}}
        />
        <ListRow
          compact
          leading={<Icon name="clock" size="sm" class="text-acme-text-secondary" />}
          title="Scheduled"
          description="Compact, with a description"
          onPress={() => {}}
        />
        <ListRow
          compact
          leading={<Icon name="trash" size="sm" class="text-acme-text-secondary" />}
          title="Trash"
          onPress={() => {}}
          disabled
        />
      </Card>
    </>
  );
}
