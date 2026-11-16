// The state of the design preview, and the functions its sections are written with.

import type { DateRange } from "../date-range-picker.ts";
import { builder, type Child } from "./model.ts";

/** Every value the design preview's controls hold, by slot. */
export type DesignState = {
  theme: string | undefined;
  // Buttons
  liked: boolean;
  saved: boolean;
  pinned: boolean;
  // Text fields
  email: string;
  query: string;
  secret: string;
  revealed: boolean;
  notes: string;
  bio: string;
  search: string;
  submitted: string;
  // Selection. `notifications` is also the switch in the List section: the same setting.
  notifications: boolean;
  agreed: boolean;
  view: string;
  delivery: string;
  shirt: string | undefined;
  // Controls
  plan: string;
  country: string | undefined;
  timeZone: string | undefined;
  volume: number;
  fontSize: number;
  dueDate: string;
  startDate: string | undefined;
  stay: DateRange;
  leave: DateRange | undefined;
  // Chips, Tabs, Banners, Card, Media, Sidebar, Accordion
  filters: readonly string[];
  page: string;
  dismissed: boolean;
  picked: boolean;
  opened: string;
  place: string;
  question: readonly string[];
  preferences: readonly string[];
  // Menu, Dialog, Toast
  chosen: string;
  density: string;
  confirming: boolean;
  asking: boolean;
  copyName: string;
  toast: boolean;
  deleted: boolean;
};

export const { ui, el, show, bind, screen } = builder<DesignState>();

/** The callback of a control that shows a value it does not take changes to. */
export const keep = () => undefined;

/** A labelled row of examples. */
export const row = (label: string, ...children: Child<DesignState>[]) =>
  el(
    "div",
    { class: "flex flex-wrap items-center gap-3" },
    ui.Text({ variant: "detail", tone: "secondary", as: "span", class: "w-24 shrink-0" }, label),
    ...children,
  );

/** `backgroundBase` becomes `background-base`, as in the names of the CSS variables. */
export const kebab = (name: string) =>
  name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);
