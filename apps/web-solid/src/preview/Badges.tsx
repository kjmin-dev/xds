import { Avatar, Badge, type BadgeTone, Button, CountBadge, Icon } from "@acme/ui-solid";
import { For } from "solid-js";
import { DAY, NIGHT, Row } from "./shared.tsx";

// `overlay` is shown apart from these, on the pictures it is for.
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];

export function BadgesSection() {
  return (
    <>
      <Row label="tone">
        <For each={BADGE_TONES}>{(tone) => <Badge tone={tone}>{tone}</Badge>}</For>
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
        <For
          each={[
            { name: "dark", src: NIGHT },
            { name: "light", src: DAY },
          ]}
        >
          {(block) => (
            <span class="relative inline-flex overflow-hidden rounded-acme-md">
              <img src={block.src} alt="" class="h-24 w-48 object-cover" />
              <span class="absolute start-2 top-2">
                <Badge tone="overlay" icon="play">
                  2:45
                </Badge>
              </span>
              <span class="absolute end-2 bottom-2">
                <Badge tone="overlay">On a {block.name} picture</Badge>
              </span>
            </span>
          )}
        </For>
      </Row>
      <Row label="count">
        <CountBadge count={3} />
        <CountBadge count={120} />
        <CountBadge count={7} max={5} />
        <span class="flex items-center gap-6 ps-3 text-acme-text-primary">
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
    </>
  );
}
