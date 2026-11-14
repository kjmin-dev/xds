import {
  Avatar,
  IconButton,
  MediaCard,
  Menu,
  SectionHeader,
  Text,
  Thumbnail,
  type ThumbnailRatio,
} from "@acme/ui-solid";
import { createSignal, type Element, For } from "solid-js";
import { BROKEN, DAY, NIGHT, PORTRAIT } from "./shared.tsx";

const RATIOS: { ratio: ThumbnailRatio; width: string }[] = [
  // Each about as tall as the others, so the row lines up.
  { ratio: "16:9", width: "w-48" },
  { ratio: "4:3", width: "w-36" },
  { ratio: "1:1", width: "w-28" },
  { ratio: "9:16", width: "w-16" },
];

export function MediaSection() {
  const [opened, setOpened] = createSignal("Nothing opened yet.");
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
  const thumbnails: { caption: string; thumbnail: Element }[] = [
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
  ];
  return (
    <>
      <SectionHeader
        title="Continue watching"
        description="Pick up where you left off."
        action={{ label: "See all", onPress: () => setOpened("See all.") }}
      />
      <div class="flex flex-wrap items-end gap-3">
        <For each={RATIOS}>
          {(item) => (
            <div class={`flex flex-col gap-1 ${item.width}`}>
              <Thumbnail src={item.ratio === "1:1" ? PORTRAIT : NIGHT} alt="" ratio={item.ratio} />
              <Text variant="footnote" tone="secondary" as="span">
                {item.ratio}
              </Text>
            </div>
          )}
        </For>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <For each={thumbnails}>
          {(item) => (
            <div class="flex flex-col gap-1">
              {item.thumbnail}
              <Text variant="footnote" tone="secondary" as="span">
                {item.caption}
              </Text>
            </div>
          )}
        </For>
      </div>
      <div class="grid items-start gap-2 sm:grid-cols-3">
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
      <div class="grid items-start gap-2 sm:grid-cols-2">
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
        {opened()}
      </Text>
      <SectionHeader
        icon="history"
        title="On its own"
        description="An icon, a description and an action, at heading level 3."
        action={{ label: "Clear history", onPress: () => setOpened("Cleared the history.") }}
        level={3}
      />
    </>
  );
}
