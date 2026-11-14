import { type IconName, Tabs } from "@acme/ui-solid";
import { createSignal } from "solid-js";

const PAGES = [
  { value: "overview", label: "Overview", icon: "house" },
  { value: "activity", label: "Activity", icon: "bell" },
  { value: "members", label: "Members", icon: "users" },
  { value: "billing", label: "Billing", icon: "credit-card" },
  { value: "settings", label: "Settings", icon: "settings" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

export function TabsSection() {
  const [page, setPage] = createSignal<(typeof PAGES)[number]["value"]>("overview");
  return (
    <>
      <Tabs items={PAGES} value={page()} onChange={setPage} label="Workspace pages" />
      <Tabs
        items={PAGES.map(({ value, label }) => ({ value, label }))}
        value={page()}
        onChange={setPage}
        label="Workspace pages, without icons"
      />
      <Tabs
        items={PAGES.slice(0, 3)}
        value={page() === "billing" || page() === "settings" ? "overview" : page()}
        onChange={setPage}
        label="Workspace pages, full width"
        fullWidth
      />
      {/* Narrower than its tabs, so the row has to scroll. */}
      <div class="max-w-xs">
        <Tabs items={PAGES} value={page()} onChange={setPage} label="Workspace pages, scrolling" />
      </div>
    </>
  );
}
