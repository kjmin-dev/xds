import { Checkbox, RadioGroup, SegmentedControl, Switch } from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { notifications, Row, setNotifications } from "./shared.tsx";

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

const DELIVERY = [
  { value: "standard", label: "Standard", description: "Three to five working days. Free." },
  { value: "express", label: "Express", description: "The next working day. 9 euros." },
  { value: "pickup", label: "Pick up in a store" },
] as const;
const SIZES_OF_SHIRT = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
] as const;

export function SelectionSection() {
  const [agreed, setAgreed] = createSignal(true);
  const [view, setView] = createSignal<(typeof VIEWS)[number]["value"]>("week");
  const [delivery, setDelivery] = createSignal<(typeof DELIVERY)[number]["value"]>("standard");
  const [shirt, setShirt] = createSignal<(typeof SIZES_OF_SHIRT)[number]["value"]>();
  return (
    <>
      <Row label="switch">
        <Switch checked={notifications()} onChange={setNotifications} label="Notifications" />
        <Switch checked={false} onChange={() => {}} label="Off" />
        <Switch checked onChange={() => {}} label="Locked" disabled />
      </Row>
      <Row label="checkbox">
        <Checkbox checked={agreed()} onChange={setAgreed} label="Remember me" />
        <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
        <Checkbox checked onChange={() => {}} label="Locked" disabled />
      </Row>
      <Row label="segmented">
        <SegmentedControl
          options={VIEWS}
          value={view()}
          onChange={setView}
          aria-label="Calendar view"
        />
      </Row>
      <div class="grid gap-6 sm:grid-cols-3">
        <RadioGroup label="Delivery" options={DELIVERY} value={delivery()} onChange={setDelivery} />
        <RadioGroup
          label="Size"
          options={SIZES_OF_SHIRT}
          value={shirt()}
          onChange={setShirt}
          error={shirt() === undefined ? "Choose a size to continue." : undefined}
        />
        <RadioGroup
          label="Region, locked"
          options={DELIVERY}
          value="express"
          onChange={() => {}}
          disabled
        />
      </div>
    </>
  );
}
