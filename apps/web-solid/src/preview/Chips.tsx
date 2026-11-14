import { Chip, ChipBar, type IconName } from "@acme/ui-solid";
import { createSignal, For } from "solid-js";
import { Row } from "./shared.tsx";

const FILTERS = [
  { value: "open", label: "Open", icon: "flag" },
  { value: "mine", label: "Assigned to me", icon: "user" },
  { value: "mentions", label: "Mentions", icon: "message-square" },
  { value: "review", label: "Needs review", icon: "eye" },
  { value: "blocked", label: "Blocked", icon: "ban" },
  { value: "done", label: "Done this week", icon: "check-check" },
  { value: "archived", label: "Archived", icon: "history" },
] as const satisfies readonly { value: string; label: string; icon: IconName }[];

export function ChipsSection() {
  const [filters, setFilters] = createSignal<readonly string[]>(["open", "review"]);
  const toggleFilter = (name: string) =>
    setFilters(
      filters().includes(name) ? filters().filter((other) => other !== name) : [...filters(), name],
    );
  return (
    <>
      <Row label="state">
        <Chip label="Unselected" />
        <Chip label="Selected" selected />
        <Chip label="Icon" iconStart="tag" />
        <Chip label="Icon, selected" iconStart="tag" selected />
        <Chip label="Disabled" disabled />
        <Chip label="Disabled, selected" selected disabled />
      </Row>
      <Row label="bar">
        {/* Narrower than its chips, so the row has to scroll. */}
        <div class="max-w-md min-w-0 flex-1">
          <ChipBar label="Filter the tasks">
            <For each={FILTERS}>
              {(filter) => (
                <Chip
                  label={filter.label}
                  iconStart={filter.icon}
                  selected={filters().includes(filter.value)}
                  onPress={() => toggleFilter(filter.value)}
                />
              )}
            </For>
          </ChipBar>
        </div>
      </Row>
    </>
  );
}
