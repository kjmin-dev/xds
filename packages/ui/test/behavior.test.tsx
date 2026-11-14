// The behavior tests that every web library shares, from @acme/ui-core, run against this
// package's React components. Each scenario is a small screen built as an app would build it,
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
import { type ReactNode, StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import "../src/styles/index.css";
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

function Selection() {
  const [notifications, setNotifications] = useState(true);
  const [remember, setRemember] = useState(true);
  return (
    <>
      <Switch checked={notifications} onChange={setNotifications} label="Notifications" />
      <Switch checked onChange={() => {}} label="Locked" disabled />
      <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
      <Checkbox checked={false} onChange={() => {}} label="Unchecked" disabled />
    </>
  );
}

function Radios() {
  const [delivery, setDelivery] = useState<string>("standard");
  const [size, setSize] = useState<string>();
  return (
    <>
      <RadioGroup label="Delivery" options={DELIVERY} value={delivery} onChange={setDelivery} />
      <RadioGroup
        label="Size"
        options={SIZES}
        value={size}
        onChange={setSize}
        error={size === undefined ? SIZE_ERROR : undefined}
      />
    </>
  );
}

function TabRow() {
  const [page, setPage] = useState<string>("overview");
  return <Tabs items={PAGES} value={page} onChange={setPage} label="Workspace pages" />;
}

function Menus() {
  const [chosen, setChosen] = useState<string>();
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
      {chosen && <p>Chose {chosen}.</p>}
    </>
  );
}

function Selects() {
  const [plan, setPlan] = useState<string>("team");
  const [country, setCountry] = useState<string>();
  return (
    <>
      <Select label="Plan" options={PLANS} value={plan} onChange={setPlan} />
      <Select
        label="Country"
        placeholder={COUNTRY_PLACEHOLDER}
        options={COUNTRIES}
        value={country}
        onChange={setCountry}
      />
    </>
  );
}

function Dialogs() {
  const [confirming, setConfirming] = useState(false);
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button variant="danger" onPress={() => setConfirming(true)}>
        Delete the report
      </Button>
      <Button onPress={() => setAsking(true)}>Ask</Button>
      <Dialog
        open={confirming}
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
        open={asking}
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
  const [volume, setVolume] = useState(60);
  const [fontSize, setFontSize] = useState(16);
  return (
    <>
      <Slider label="Volume" value={volume} onChange={setVolume} showValue />
      <Slider
        label="Font size"
        min={12}
        max={24}
        step={2}
        value={fontSize}
        onChange={setFontSize}
        showValue
      />
      <Slider label="Balance" value={30} onChange={() => {}} disabled />
    </>
  );
}

function Accordions() {
  const [question, setQuestion] = useState<string[]>(["seats"]);
  const [preferences, setPreferences] = useState<string[]>(["notifications"]);
  return (
    <>
      <Accordion items={QUESTIONS} expanded={question} onChange={setQuestion} />
      <Accordion items={PREFERENCES} expanded={preferences} onChange={setPreferences} multiple />
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
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
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
      <p>{deleted ? "The draft is deleted." : "The draft is there."}</p>
      <Toast
        open={open}
        onClose={() => setOpen(false)}
        message={TOAST.message}
        duration={TOAST.duration}
        action={{ label: "Undo", onPress: () => setDeleted(false) }}
      />
    </>
  );
}

const SCENARIOS: Record<Scenario, () => ReactNode> = {
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

let root: Root | undefined;

afterEach(() => {
  root?.unmount();
  root = undefined;
  document.body.replaceChildren();
});

describeBehavior((scenario) => {
  const Screen = SCENARIOS[scenario];
  root = createRoot(document.body.appendChild(document.createElement("main")));
  // Rendered at once, so that the first key a test presses finds the scenario on the page.
  flushSync(() =>
    root?.render(
      <StrictMode>
        <Screen />
      </StrictMode>,
    ),
  );
});
