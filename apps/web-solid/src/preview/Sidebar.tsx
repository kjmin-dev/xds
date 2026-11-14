import { Avatar, Icon, type SidebarSection as Places, Sidebar, Text } from "@acme/ui-solid";
import { createSignal, For, Show } from "solid-js";
import { PORTRAIT } from "./shared.tsx";

// Icons made of closed shapes, since the current place's icon is filled.
const PLACES: Places[] = [
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

export function SidebarSection() {
  const [place, setPlace] = createSignal("messages");
  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <For each={[false, true]}>
        {(collapsed) => (
          // A fixed height, as a window would give it, so the footer sits at the bottom, and a
          // page beside the sidebar, as an app has.
          <div class="flex h-[28rem] overflow-hidden rounded-acme-md border border-acme-border-default">
            <Sidebar
              label={collapsed ? "Workspace, collapsed" : "Workspace"}
              sections={PLACES}
              value={place()}
              onChange={setPlace}
              collapsed={collapsed}
              header={
                <div
                  class={`flex h-acme-control-md items-center gap-2 ${collapsed ? "justify-center" : "px-2"}`}
                >
                  <span class="flex size-acme-avatar-md items-center justify-center rounded-acme-md bg-acme-accent-default text-acme-text-on-accent">
                    <Icon name="sparkles" size="sm" />
                  </span>
                  <Show when={!collapsed}>
                    <Text variant="label" as="span">
                      Acme
                    </Text>
                  </Show>
                </div>
              }
              footer={
                <div
                  class={`flex items-center gap-2 py-1 ${collapsed ? "justify-center" : "px-2"}`}
                >
                  <Avatar name="Ada Lovelace" src={PORTRAIT} size="sm" />
                  <Show when={!collapsed}>
                    <Text variant="detail" as="span">
                      Ada Lovelace
                    </Text>
                  </Show>
                </div>
              }
            />
            <div class="flex min-w-0 flex-1 flex-col gap-1 p-4">
              <Text variant="heading" as="span">
                {PLACES.flatMap((section) => section.items).find((item) => item.value === place())
                  ?.label ?? place()}
              </Text>
              <Text variant="detail" tone="secondary" as="span">
                {collapsed
                  ? "Rest the pointer on an icon, or focus it, for its name."
                  : "The page of the current place."}
              </Text>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
