// What each scenario of the behavior tests draws. The screens are data in the form of the
// design preview's (@acme/ui-core/preview), so every web library draws the same labels and
// options with the renderer of its design preview, and runs behavior.ts against them. They
// follow the design preview of the web apps.

import { builder, type Screen } from "../src/preview/model.ts";

/** The screens behavior.ts checks; SCREENS, at the end, says what each one draws. */
export type Scenario =
  | "controlled"
  | "selection"
  | "radio-group"
  | "tabs"
  | "menu"
  | "select"
  | "dialog"
  | "slider"
  | "accordion"
  | "tooltip"
  | "toast";

export const DELIVERY = [
  { value: "standard", label: "Standard", description: "Three to five working days. Free." },
  { value: "express", label: "Express", description: "The next working day. 9 euros." },
  { value: "pickup", label: "Pick up in a store" },
] as const;

export const SIZES = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
] as const;

export const SIZE_ERROR = "Choose a size to continue.";

export const PAGES = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "members", label: "Members" },
  { value: "billing", label: "Billing" },
] as const;

export const PLANS = [
  { value: "free", label: "Free", description: "Up to 3 projects" },
  { value: "team", label: "Team", description: "Up to 20 people" },
  { value: "business", label: "Business", description: "Single sign-on and audit logs" },
] as const;

export const COUNTRIES = ["Canada", "France", "Germany", "Japan", "Korea"].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

export const COUNTRY_PLACEHOLDER = "Choose a country";

export const CONFIRM = {
  title: "Delete the weekly report?",
  description: "The report and its 12 comments are removed for everyone.",
} as const;

export const QUESTION = {
  title: "Keep the changes?",
  description: "You edited the report in another window.",
} as const;

export const QUESTIONS = [
  { value: "cancel", title: "Can I cancel at any time?", content: "Yes, until the period ends." },
  { value: "seats", title: "How are seats counted?", content: "Each person takes a seat." },
] as const;

export const PREFERENCES = [
  { value: "notifications", title: "Notifications", content: "Choose what you hear about." },
  { value: "privacy", title: "Privacy", content: "Choose who can see your profile." },
] as const;

// Long enough that the test can rest the pointer on the toast before it is gone, short enough
// that waiting it out does not slow the suite down much.
export const TOAST = { message: "The draft was deleted.", duration: 1000 } as const;

const keep = () => undefined;

/** The value of a field whose owner keeps it, whatever is typed. */
export const KEPT = "Weekly report";

function controlled(): Screen {
  const { ui, bind, screen } = builder<{ email: string }>();
  return screen({ email: "" }, [
    ui.TextField({ label: "Email", ...bind("email") }),
    ui.TextField({ label: "Project name", value: KEPT, onChange: keep }),
    ui.Switch({ checked: false, onChange: keep, label: "Off" }),
  ]);
}

function selection(): Screen {
  const { ui, bind, screen } = builder<{ notifications: boolean; remember: boolean }>();
  return screen({ notifications: true, remember: true }, [
    ui.Switch({ label: "Notifications", ...bind("notifications", "checked") }),
    ui.Switch({ checked: true, onChange: keep, label: "Locked", disabled: true }),
    ui.Checkbox({ label: "Remember me", ...bind("remember", "checked") }),
    ui.Checkbox({ checked: false, onChange: keep, label: "Unchecked", disabled: true }),
  ]);
}

function radioGroup(): Screen {
  const { ui, bind, screen } = builder<{ delivery: string; size: string | undefined }>();
  return screen({ delivery: "standard", size: undefined }, [
    ui.RadioGroup({ label: "Delivery", options: DELIVERY, ...bind("delivery") }),
    ui.RadioGroup({
      label: "Size",
      options: SIZES,
      ...bind("size"),
      error: (state) => (state.size === undefined ? SIZE_ERROR : undefined),
    }),
  ]);
}

function tabs(): Screen {
  const { ui, bind, screen } = builder<{ page: string }>();
  return screen(
    { page: "overview" },
    ui.Tabs({ items: PAGES, label: "Workspace pages", ...bind("page") }),
  );
}

function menu(): Screen {
  const { ui, el, show, screen } = builder<{ chosen: string | undefined }>();
  const choose = (chosen: string) => () => ({ chosen });
  return screen({ chosen: undefined }, [
    ui.Menu({
      label: "Report actions",
      trigger: ui.Button({ iconEnd: "chevron-down" }, "Actions"),
      items: [
        { label: "Rename", onSelect: choose("Rename") },
        { label: "Duplicate", onSelect: choose("Duplicate") },
        { label: "Share", onSelect: choose("Share"), disabled: true },
        "separator",
        { label: "Delete", danger: true, onSelect: choose("Delete") },
      ],
    }),
    show(
      (state) => state.chosen !== undefined,
      el("p", {}, "Chose ", (state) => state.chosen ?? "", "."),
    ),
  ]);
}

function select(): Screen {
  const { ui, bind, screen } = builder<{ plan: string; country: string | undefined }>();
  return screen({ plan: "team", country: undefined }, [
    ui.Select({ label: "Plan", options: PLANS, ...bind("plan") }),
    ui.Select({
      label: "Country",
      placeholder: COUNTRY_PLACEHOLDER,
      options: COUNTRIES,
      ...bind("country"),
    }),
  ]);
}

function dialog(): Screen {
  const { ui, screen } = builder<{ confirming: boolean; asking: boolean }>();
  return screen({ confirming: false, asking: false }, [
    ui.Button({ variant: "danger", onPress: () => ({ confirming: true }) }, "Delete the report"),
    ui.Button({ onPress: () => ({ asking: true }) }, "Ask"),
    ui.Dialog({
      open: (state) => state.confirming,
      onClose: () => ({ confirming: false }),
      ...CONFIRM,
      actions: [
        ui.Button({ onPress: () => ({ confirming: false }) }, "Cancel"),
        ui.Button({ variant: "danger", onPress: () => ({ confirming: false }) }, "Delete"),
      ],
    }),
    ui.Dialog({
      open: (state) => state.asking,
      onClose: () => ({ asking: false }),
      dismissible: false,
      ...QUESTION,
      actions: ui.Button({ variant: "primary", onPress: () => ({ asking: false }) }, "Keep"),
    }),
  ]);
}

function slider(): Screen {
  const { ui, bind, screen } = builder<{ volume: number; fontSize: number }>();
  return screen({ volume: 60, fontSize: 16 }, [
    ui.Slider({ label: "Volume", ...bind("volume"), showValue: true }),
    ui.Slider({
      label: "Font size",
      min: 12,
      max: 24,
      step: 2,
      ...bind("fontSize"),
      showValue: true,
    }),
    ui.Slider({ label: "Balance", value: 30, onChange: keep, disabled: true }),
  ]);
}

function accordion(): Screen {
  const { ui, bind, screen } = builder<{ question: string[]; preferences: string[] }>();
  return screen({ question: ["seats"], preferences: ["notifications"] }, [
    ui.Accordion({ items: QUESTIONS, ...bind("question", "expanded") }),
    ui.Accordion({ items: PREFERENCES, ...bind("preferences", "expanded"), multiple: true }),
  ]);
}

function tooltip(): Screen {
  const { ui, screen } = builder<object>();
  return screen({}, [
    ui.Tooltip(
      { label: "Search", shortcut: "⌘K" },
      ui.IconButton({ icon: "search", label: "Search" }),
    ),
    ui.Tooltip(
      { label: "Export as a spreadsheet" },
      ui.Button({ iconStart: "download" }, "Export"),
    ),
  ]);
}

function toast(): Screen {
  const { ui, el, screen } = builder<{ open: boolean; deleted: boolean }>();
  return screen({ open: false, deleted: false }, [
    ui.Button({ onPress: () => ({ deleted: true, open: true }) }, "Delete a draft"),
    el("p", {}, (state) => (state.deleted ? "The draft is deleted." : "The draft is there.")),
    ui.Toast({
      open: (state) => state.open,
      onClose: () => ({ open: false }),
      message: TOAST.message,
      duration: TOAST.duration,
      action: { label: "Undo", onPress: () => ({ deleted: false }) },
    }),
  ]);
}

/** Each scenario's screen, which a library draws with the renderer of its design preview. */
export const SCREENS: Record<Scenario, Screen> = {
  controlled: controlled(),
  selection: selection(),
  "radio-group": radioGroup(),
  tabs: tabs(),
  menu: menu(),
  select: select(),
  dialog: dialog(),
  slider: slider(),
  accordion: accordion(),
  tooltip: tooltip(),
  toast: toast(),
};
