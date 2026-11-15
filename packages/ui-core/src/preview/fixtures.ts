// The made-up content the design preview fills its components with.

import type { IconName } from "@acme/tokens";
import type { SidebarSection } from "../sidebar.ts";

// The pictures are drawn here and carried in the page, so the preview works offline. Their
// colors are the pictures' own, in both color modes, which is what `overlay` is tested on.
const picture = (width: number, height: number, shapes: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`,
  )}`;
export const PORTRAIT = picture(
  96,
  96,
  '<rect width="96" height="96" fill="peachpuff"/><circle cx="48" cy="38" r="17" fill="sienna"/><path d="M14 96c0-21 15-33 34-33s34 12 34 33z" fill="sienna"/>',
);
export const NIGHT = picture(
  320,
  160,
  '<rect width="320" height="160" fill="midnightblue"/><circle cx="250" cy="44" r="18" fill="lemonchiffon"/><path d="M0 160 90 80l60 50 50-30 120 60z" fill="black"/>',
);
export const DAY = picture(
  320,
  160,
  '<rect width="320" height="160" fill="aliceblue"/><circle cx="70" cy="46" r="20" fill="khaki"/><path d="M0 160 110 90l60 40 60-50 90 80z" fill="lightsteelblue"/>',
);
// Not a picture, so it fails to load at once and without a request.
export const BROKEN = "data:image/png;base64,AAAA";

export const PEOPLE = [
  { name: "Ada Lovelace", src: PORTRAIT },
  { name: "Grace Hopper" },
  { name: "Alan Turing" },
  { name: "Katherine Johnson" },
  { name: "Margaret Hamilton" },
  { name: "Linus Torvalds" },
  { name: "Barbara Liskov" },
];

export const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const DELIVERY = [
  { value: "standard", label: "Standard", description: "Three to five working days. Free." },
  { value: "express", label: "Express", description: "The next working day. 9 euros." },
  { value: "pickup", label: "Pick up in a store" },
];

export const SIZES_OF_SHIRT = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
];

export const PLANS = [
  { value: "free", label: "Free", description: "Up to 3 projects" },
  { value: "team", label: "Team", description: "Up to 20 people" },
  { value: "business", label: "Business", description: "Single sign-on and audit logs" },
  { value: "enterprise", label: "Enterprise", description: "A contract of your own" },
];

export const COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "Japan",
  "Korea",
  "Mexico",
  "Spain",
  "United Kingdom",
  "United States",
].map((name) => ({ value: name.toLowerCase().replace(/ /g, "-"), label: name }));

export const TIME_ZONES = [
  { value: "utc", label: "Coordinated Universal Time" },
  { value: "seoul", label: "Seoul" },
  { value: "berlin", label: "Berlin" },
];

export const CURRENCIES = [{ value: "eur", label: "Euro" }];

export const FILTERS: readonly { value: string; label: string; icon: IconName }[] = [
  { value: "open", label: "Open", icon: "flag" },
  { value: "mine", label: "Assigned to me", icon: "user" },
  { value: "mentions", label: "Mentions", icon: "message-square" },
  { value: "review", label: "Needs review", icon: "eye" },
  { value: "blocked", label: "Blocked", icon: "ban" },
  { value: "done", label: "Done this week", icon: "check-check" },
  { value: "archived", label: "Archived", icon: "history" },
];

export const PAGES: readonly { value: string; label: string; icon: IconName }[] = [
  { value: "overview", label: "Overview", icon: "house" },
  { value: "activity", label: "Activity", icon: "bell" },
  { value: "members", label: "Members", icon: "users" },
  { value: "billing", label: "Billing", icon: "credit-card" },
  { value: "settings", label: "Settings", icon: "settings" },
];

// Icons made of closed shapes, since the current place's icon is filled.
export const PLACES: readonly SidebarSection[] = [
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

export const QUESTIONS = [
  {
    value: "cancel",
    title: "Can I cancel at any time?",
    content: "Yes. The plan stays active until the end of the period you paid for.",
  },
  {
    value: "seats",
    title: "How are seats counted?",
    description: "Guests are free",
    content: "Each person with an account in the workspace takes a seat. Guests do not.",
  },
  {
    value: "invoice",
    title: "Where do I find my invoices?",
    content: "Under Settings, then Billing. Each invoice can be downloaded as a PDF.",
  },
];

export const PREFERENCES = [
  {
    value: "notifications",
    title: "Notifications",
    description: "Mentions, replies and reminders",
    content: "Choose what you hear about, and whether by email or in the app.",
  },
  {
    value: "privacy",
    title: "Privacy",
    content: "Choose who can see your profile and your activity.",
  },
  {
    value: "language",
    title: "Language and region",
    content: "The language of the app, and how dates and numbers are written.",
  },
];
