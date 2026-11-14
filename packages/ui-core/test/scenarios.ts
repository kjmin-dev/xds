// What each scenario of the behavior tests renders. A web component library mounts these with
// its own components, in a fixture of its own, and runs behavior.ts against them: the data is
// here so that every library renders the same labels and options. The scenarios follow the
// design preview of the web apps.

/**
 * - `selection`: Switch "Notifications" (on), Switch "Locked" (on, disabled), Checkbox
 *   "Remember me" (on), Checkbox "Unchecked" (off, disabled), in that order.
 * - `radio-group`: RadioGroup "Delivery" with DELIVERY, "standard" chosen; RadioGroup "Size"
 *   with SIZES, nothing chosen, and the error SIZE_ERROR while nothing is.
 * - `tabs`: Tabs "Workspace pages" with PAGES, "overview" selected.
 * - `menu`: a Menu "Report actions" opened by a Button "Actions", with REPORT_ACTIONS ("Share"
 *   disabled, a separator before "Delete"), and a paragraph saying "Chose <label>." once an
 *   item is chosen.
 * - `select`: Select "Plan" with PLANS, "team" chosen; Select "Country" with COUNTRIES,
 *   nothing chosen, placeholder COUNTRY_PLACEHOLDER.
 * - `dialog`: a Button "Delete the report" that opens the dismissible dialog CONFIRM, with
 *   the actions "Cancel" and "Delete"; a Button "Ask" that opens the dialog QUESTION, which is
 *   not dismissible and has the action "Keep".
 * - `slider`: Slider "Volume" at 60 with its value shown; Slider "Font size" from 12 to 24 in
 *   steps of 2, at 16; Slider "Balance" at 30, disabled.
 * - `accordion`: Accordion with QUESTIONS, "seats" open, one at a time; Accordion with
 *   PREFERENCES, "notifications" open, several at once.
 * - `tooltip`: IconButton "Search" in a Tooltip "Search" with the shortcut "⌘K", then a Button
 *   "Export" in a Tooltip "Export as a spreadsheet".
 * - `toast`: a Button "Delete a draft" that opens the Toast TOAST, with its duration, whose
 *   action "Undo" restores the draft, and a paragraph saying "The draft is deleted." or "The
 *   draft is there.".
 */
export type Scenario =
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

export const REPORT_ACTIONS = ["Rename", "Duplicate", "Share", "Delete"] as const;

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
