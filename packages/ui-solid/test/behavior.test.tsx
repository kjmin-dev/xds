// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's Solid components. Each scenario is a small screen built as an app would build it,
// with its state in the screen.

import { describeBehavior } from "@acme/ui-core/test/behavior";
import {
  CONFIRM,
  COUNTRIES,
  COUNTRY_PLACEHOLDER,
  DELIVERY,
  PAGES,
  PLANS,
  PREFERENCES,
  QUESTION,
  QUESTIONS,
  type Scenario,
  SIZE_ERROR,
  SIZES,
  TOAST,
} from "@acme/ui-core/test/scenarios";
import { render } from "@solidjs/web";
import { createSignal, type Element, Show } from "solid-js";
import { afterEach } from "vitest";
import {
  Accordion,
  Button,
  Checkbox,
  Dialog,
  IconButton,
  Menu,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tabs,
  Toast,
  Tooltip,
} from "../src/index.ts";
import "../src/styles/index.css";

function Selection() {
  const [notifications, setNotifications] = createSignal(true);
  const [remember, setRemember] = createSignal(true);
  return (
    <>
      <Switch checked={notifications()} onChange={setNotifications} label="Notifications" />
      <Switch checked onChange={() => {}} label="Locked" disabled />
      <Checkbox checked={remember()} onChange={setRemember} label="Remember me" />
      <Checkbox checked={false} onChange={() => {}} label="Unchecked" disabled />
    </>
  );
}

function Radios() {
  const [delivery, setDelivery] = createSignal<string>("standard");
  const [size, setSize] = createSignal<string>();
  return (
    <>
      <RadioGroup label="Delivery" options={DELIVERY} value={delivery()} onChange={setDelivery} />
      <RadioGroup
        label="Size"
        options={SIZES}
        value={size()}
        onChange={setSize}
        error={size() === undefined ? SIZE_ERROR : undefined}
      />
    </>
  );
}

function TabRow() {
  const [page, setPage] = createSignal<string>("overview");
  return <Tabs items={PAGES} value={page()} onChange={setPage} label="Workspace pages" />;
}

function Menus() {
  const [chosen, setChosen] = createSignal<string>();
  const choose = (label: string) => () => setChosen(label);
  return (
    <>
      <Menu
        label="Report actions"
        trigger={<Button iconEnd="chevron-down">Actions</Button>}
        items={[
          { label: "Rename", onSelect: choose("Rename") },
          { label: "Duplicate", onSelect: choose("Duplicate") },
          { label: "Share", onSelect: choose("Share"), disabled: true },
          "separator",
          { label: "Delete", danger: true, onSelect: choose("Delete") },
        ]}
      />
      <Show when={chosen()}>
        <p>Chose {chosen()}.</p>
      </Show>
    </>
  );
}

function Selects() {
  const [plan, setPlan] = createSignal<string>("team");
  const [country, setCountry] = createSignal<string>();
  return (
    <>
      <Select label="Plan" options={PLANS} value={plan()} onChange={setPlan} />
      <Select
        label="Country"
        placeholder={COUNTRY_PLACEHOLDER}
        options={COUNTRIES}
        value={country()}
        onChange={setCountry}
      />
    </>
  );
}

function Dialogs() {
  const [confirming, setConfirming] = createSignal(false);
  const [asking, setAsking] = createSignal(false);
  return (
    <>
      <Button variant="danger" onPress={() => setConfirming(true)}>
        Delete the report
      </Button>
      <Button onPress={() => setAsking(true)}>Ask</Button>
      <Dialog
        open={confirming()}
        onClose={() => setConfirming(false)}
        {...CONFIRM}
        actions={
          <>
            <Button onPress={() => setConfirming(false)}>Cancel</Button>
            <Button variant="danger" onPress={() => setConfirming(false)}>
              Delete
            </Button>
          </>
        }
      />
      <Dialog
        open={asking()}
        onClose={() => setAsking(false)}
        dismissible={false}
        {...QUESTION}
        actions={
          <Button variant="primary" onPress={() => setAsking(false)}>
            Keep
          </Button>
        }
      />
    </>
  );
}

function Sliders() {
  const [volume, setVolume] = createSignal(60);
  const [fontSize, setFontSize] = createSignal(16);
  return (
    <>
      <Slider label="Volume" value={volume()} onChange={setVolume} showValue />
      <Slider
        label="Font size"
        min={12}
        max={24}
        step={2}
        value={fontSize()}
        onChange={setFontSize}
        showValue
      />
      <Slider label="Balance" value={30} onChange={() => {}} disabled />
    </>
  );
}

function Accordions() {
  const [question, setQuestion] = createSignal<string[]>(["seats"]);
  const [preferences, setPreferences] = createSignal<string[]>(["notifications"]);
  return (
    <>
      <Accordion items={QUESTIONS} expanded={question()} onChange={setQuestion} />
      <Accordion items={PREFERENCES} expanded={preferences()} onChange={setPreferences} multiple />
    </>
  );
}

function Tooltips() {
  return (
    <>
      <Tooltip label="Search" shortcut="⌘K">
        <IconButton icon="search" label="Search" />
      </Tooltip>
      <Tooltip label="Export as a spreadsheet">
        <Button iconStart="download">Export</Button>
      </Tooltip>
    </>
  );
}

function Toasts() {
  const [open, setOpen] = createSignal(false);
  const [deleted, setDeleted] = createSignal(false);
  return (
    <>
      <Button
        onPress={() => {
          setDeleted(true);
          setOpen(true);
        }}
      >
        Delete a draft
      </Button>
      <p>{deleted() ? "The draft is deleted." : "The draft is there."}</p>
      <Toast
        open={open()}
        onClose={() => setOpen(false)}
        message={TOAST.message}
        duration={TOAST.duration}
        action={{ label: "Undo", onPress: () => setDeleted(false) }}
      />
    </>
  );
}

const SCENARIOS: Record<Scenario, () => Element> = {
  selection: Selection,
  "radio-group": Radios,
  tabs: TabRow,
  menu: Menus,
  select: Selects,
  dialog: Dialogs,
  slider: Sliders,
  accordion: Accordions,
  tooltip: Tooltips,
  toast: Toasts,
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

describeBehavior((scenario) => {
  const Screen = SCENARIOS[scenario];
  // render() runs the screen's first updates before it returns, so the first key a test
  // presses finds the scenario on the page.
  dispose = render(() => <Screen />, document.body.appendChild(document.createElement("main")));
});
