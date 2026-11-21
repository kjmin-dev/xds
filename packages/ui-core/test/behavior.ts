// How the interactive components behave, checked the way a person meets them: through roles,
// accessible names, ARIA state, the keyboard and the pointer. Nothing here knows which
// framework drew the component, so every web component library runs the same checks: its
// test/behavior.test.tsx mounts each scenario of scenarios.ts with its own components and calls
// describeBehavior, imported from @acme/ui-core/test/behavior.

import { describe, expect, test, vi } from "vitest";
import { type Locator, page, userEvent } from "vitest/browser";
import {
  CONFIRM,
  COUNTRY_PLACEHOLDER,
  KEPT,
  KEPT_NOTES,
  PART_NAMES,
  LEAVE_ERROR,
  LEAVE_PLACEHOLDER,
  QUESTION,
  QUESTIONS,
  type Scenario,
  SIZE_ERROR,
  START_ERROR,
  START_PLACEHOLDER,
  TOAST,
} from "./scenarios.ts";

/**
 * Renders a scenario into the page, and returns or resolves once it is there. The test file
 * removes it again after each test.
 */
export type Mount = (scenario: Scenario) => void | Promise<void>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Whether focus is on the element or inside it. */
const holdsFocus = (locator: Locator) => locator.element().contains(document.activeElement);

// The ARIA Authoring Practices give a menu or a list box two ways to move the keyboard's focus
// through its items: DOM focus moves to the item, or stays on the menu or the list and its
// aria-activedescendant names the item, as with Zag.js. Assistive technology reports either as
// focus on the item.
const isFocused = (locator: Locator) => {
  const element = locator.element();
  const focused = document.activeElement;
  return (
    focused === element ||
    (element.id !== "" && focused?.getAttribute("aria-activedescendant") === element.id)
  );
};

// A modal hides the rest of the page with `inert` or, as with Zag.js, with aria-hidden; either
// takes it out of the accessibility tree. An open Menu, Select or Dialog is modal, so the
// control that opened it is hidden too until it closes, and a role query, which passes over
// what aria-hidden hides, no longer finds it. A check of the page behind an open overlay holds
// on to the element it found before the overlay opened.
const hiddenFromAssistiveTechnology = (element: Element) =>
  element.closest('[inert], [aria-hidden="true"]') !== null;

// The field of a select is a button that opens a list box, named by the chosen option and the
// label, as in these libraries, or a combobox named by the label, as in the ARIA pattern for a
// select-only combobox. Either name holds the label.
const selectField = (label: string) =>
  page
    .getByRole("button", { name: label, exact: false })
    .or(page.getByRole("combobox", { name: label, exact: false }));

// A native range input reports its value as its value, an element with the slider role as
// aria-valuenow. Either is what assistive technology reads out.
const sliderValue = (locator: Locator) => {
  const element = locator.element();
  return element instanceof HTMLInputElement
    ? element.value
    : element.getAttribute("aria-valuenow");
};

// The field of a date picker is a button named by the chosen day and the label, as a Select's
// field is.
const dateField = (label: string) => page.getByRole("button", { name: label, exact: false });

// A day of the open calendar, by its long English name ("March 10, 2026"), which the weekday
// comes before.
const day = (name: string) => page.getByRole("grid").getByRole("button", { name, exact: false });

/** The name of the day of the open calendar that has the focus, or null. */
const focusedDay = () => {
  const element = document.activeElement;
  return element?.closest('[role="grid"]') ? element.getAttribute("aria-label") : null;
};

// A day of the open range calendar by its long English name, in whichever month's grid holds
// it.
const rangeDay = (name: string) =>
  page.getByRole("dialog").getByRole("button", { name, exact: false });

const rangeCell = (name: string) => page.getByRole("gridcell", { name, exact: false });

/** The names of the grids of the open calendar, one for each month it shows. */
const gridNames = () =>
  [...document.querySelectorAll('[role="grid"]')]
    .filter((grid) => grid.checkVisibility())
    .map((grid) => grid.getAttribute("aria-label"));

/**
 * The numbers of the selected days in the open calendar's grid of `month`. The days of the
 * months around it are in its grid too, hidden, and left out.
 */
const selectedDays = (month = "March 2026") => {
  const grid = [...document.querySelectorAll('[role="grid"]')].find(
    (element) => element.checkVisibility() && element.getAttribute("aria-label") === month,
  );
  return [...(grid?.querySelectorAll('[role="gridcell"][aria-selected="true"]') ?? [])]
    .filter((cell) => cell.firstElementChild?.checkVisibility({ visibilityProperty: true }))
    .map((cell) => Number(cell.textContent));
};

/**
 * Runs `check` in a window wide enough for a calendar of two months side by side, and puts the
 * window back after it.
 */
async function wide(check: () => Promise<void>) {
  const { innerWidth, innerHeight } = window;
  await page.viewport(1024, 768);
  try {
    await check();
  } finally {
    await page.viewport(innerWidth, innerHeight);
  }
}

/**
 * Runs `check` with the page's clock on `now` (local time), which `setNow` moves, so that what a
 * check expects of today does not depend on the day it runs. Only the date is faked: timers run
 * as they do.
 */
async function onDay(now: Date, check: (setNow: (now: Date) => void) => Promise<void>) {
  vi.useFakeTimers({ now, toFake: ["Date"], shouldAdvanceTime: true });
  try {
    await check((next) => vi.setSystemTime(next));
  } finally {
    vi.useRealTimers();
  }
}

export function describeBehavior(mount: Mount) {
  // A field or a switch is controlled: it shows the value its owner gives it, so one whose owner
  // does not take a change goes on showing the old value. A native input changes on its own, and
  // a framework that writes the value only when it changes leaves the edit there.
  describe("Controlled values", () => {
    test("a field shows what is typed into it once its owner takes it", async () => {
      await mount("controlled");
      const email = page.getByRole("textbox", { name: "Email" });
      await email.click();
      await userEvent.keyboard("ada@example.com");
      await expect.element(email).toHaveValue("ada@example.com");
    });

    test("a control whose owner keeps its value goes on showing that value", async () => {
      await mount("controlled");
      const name = page.getByRole("textbox", { name: "Project name" });
      await name.click();
      await userEvent.keyboard(" draft");
      await expect.element(name).toHaveValue(KEPT);
      const off = page.getByRole("switch", { name: "Off" });
      await page.getByText("Off").click();
      await expect.element(off).not.toBeChecked();
      await userEvent.keyboard(" ");
      await expect.element(off).not.toBeChecked();
    });

    // A reset sets each field to its default value: the `value` attribute of an input, the
    // text of a text area, the `checked` attribute of a checkbox or a radio. A library that
    // writes only the value leaves them empty, and a reset would clear the fields without
    // telling their owners. (React writes the `checked` attribute only at first, so a control
    // changed since then goes back to its first state; these controls do not change.)
    test("a form's reset leaves each control showing the value its owner gives it", async () => {
      await mount("controlled");
      const email = page.getByRole("textbox", { name: "Email" });
      await email.click();
      await userEvent.keyboard("ada@example.com");
      await expect.element(email).toHaveValue("ada@example.com");
      await page.getByRole("button", { name: "Reset" }).click();
      await expect.element(email).toHaveValue("ada@example.com");
      await expect.element(page.getByRole("textbox", { name: "Project name" })).toHaveValue(KEPT);
      await expect.element(page.getByRole("textbox", { name: "Notes" })).toHaveValue(KEPT_NOTES);
      await expect.element(page.getByRole("switch", { name: "Off" })).not.toBeChecked();
      await expect.element(page.getByRole("checkbox", { name: "On" })).toBeChecked();
      await expect.element(page.getByRole("radio", { name: "Express" })).toBeChecked();
    });
  });

  describe("Switch and Checkbox", () => {
    test("a press on the label toggles the control", async () => {
      await mount("selection");
      const notifications = page.getByRole("switch", { name: "Notifications" });
      const remember = page.getByRole("checkbox", { name: "Remember me" });
      await expect.element(notifications).toBeChecked();
      await page.getByText("Notifications").click();
      await expect.element(notifications).not.toBeChecked();
      await expect.element(remember).toBeChecked();
      await page.getByText("Remember me").click();
      await expect.element(remember).not.toBeChecked();
    });

    test("Space toggles the focused control, and Tab passes over a disabled one", async () => {
      await mount("selection");
      const notifications = page.getByRole("switch", { name: "Notifications" });
      const remember = page.getByRole("checkbox", { name: "Remember me" });
      await userEvent.tab();
      await expect.element(notifications).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect.element(notifications).not.toBeChecked();
      await userEvent.tab();
      await expect.element(remember).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect.element(remember).not.toBeChecked();
    });

    test("a disabled control keeps its state", async () => {
      await mount("selection");
      const locked = page.getByRole("switch", { name: "Locked" });
      await expect.element(locked).toBeDisabled();
      // Forced: without it, the click waits for the control to become enabled.
      await page.getByText("Locked").click({ force: true });
      await expect.element(locked).toBeChecked();
      await expect.element(page.getByRole("checkbox", { name: "Unchecked" })).toBeDisabled();
    });
  });

  describe("RadioGroup", () => {
    test("the group is named by its legend and the chosen option is checked", async () => {
      await mount("radio-group");
      const delivery = page.getByRole("radiogroup", { name: "Delivery" });
      await expect.element(delivery).toBeVisible();
      await expect.element(delivery.getByRole("radio", { name: "Standard" })).toBeChecked();
      await expect.element(delivery.getByRole("radio", { name: "Express" })).not.toBeChecked();
    });

    test("the arrow keys move the choice", async () => {
      await mount("radio-group");
      const radio = (name: string) => page.getByRole("radio", { name });
      await userEvent.tab();
      await expect.element(radio("Standard")).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect.element(radio("Express")).toHaveFocus();
      await expect.element(radio("Express")).toBeChecked();
      await expect.element(radio("Standard")).not.toBeChecked();
      await userEvent.keyboard("{ArrowDown}");
      await expect.element(radio("Pick up in a store")).toBeChecked();
      await userEvent.keyboard("{ArrowUp}");
      await expect.element(radio("Express")).toBeChecked();
    });

    test("Tab leaves the group in one step, and a choice clears the error", async () => {
      await mount("radio-group");
      await expect.element(page.getByText(SIZE_ERROR)).toBeVisible();
      await userEvent.tab();
      await userEvent.tab();
      const small = page.getByRole("radio", { name: "Small" });
      await expect.element(small).toHaveFocus();
      await userEvent.keyboard(" ");
      await expect.element(small).toBeChecked();
      await expect.element(page.getByText(SIZE_ERROR)).not.toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    test("the selected tab is marked, and a press selects another", async () => {
      await mount("tabs");
      const list = page.getByRole("tablist", { name: "Workspace pages" });
      await expect
        .element(list.getByRole("tab", { name: "Overview" }))
        .toHaveAttribute("aria-selected", "true");
      await list.getByRole("tab", { name: "Members" }).click();
      await expect
        .element(list.getByRole("tab", { name: "Members" }))
        .toHaveAttribute("aria-selected", "true");
      await expect
        .element(list.getByRole("tab", { name: "Overview" }))
        .toHaveAttribute("aria-selected", "false");
      // The row may leave the panels to the app, but a tab must not point at a panel that is
      // not there.
      const dangling = list
        .getByRole("tab")
        .elements()
        .map((tab) => tab.getAttribute("aria-controls"))
        .filter((id) => id !== null && document.getElementById(id) === null);
      expect(dangling).toEqual([]);
    });

    test("the arrow keys, Home and End move the selection", async () => {
      await mount("tabs");
      const tab = (name: string) => page.getByRole("tab", { name });
      await userEvent.tab();
      await expect.element(tab("Overview")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect.element(tab("Activity")).toHaveFocus();
      await expect.element(tab("Activity")).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{End}");
      await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{Home}");
      await expect.element(tab("Overview")).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{ArrowLeft}");
      await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Menu", () => {
    test("the trigger opens the menu and reports that it is open", async () => {
      await mount("menu");
      const trigger = page.getByRole("button", { name: "Actions" });
      await expect.element(trigger).toBeVisible();
      // `true` and `menu` both say that the control opens a menu.
      expect(trigger.element().getAttribute("aria-haspopup")).toMatch(/^(true|menu)$/);
      await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
      const button = trigger.element();
      await trigger.click();
      // Named by the Menu's `label`, not by its trigger.
      const menu = page.getByRole("menu", { name: "Report actions" });
      await expect.element(menu).toBeVisible();
      await expect.element(button).toHaveAttribute("aria-expanded", "true");
      await expect
        .element(menu.getByRole("menuitem", { name: "Share" }))
        .toHaveAttribute("aria-disabled", "true");
    });

    test("the arrow keys pass over a disabled item, and Escape returns focus", async () => {
      await mount("menu");
      const trigger = page.getByRole("button", { name: "Actions" });
      const item = (name: string) => page.getByRole("menuitem", { name });
      await userEvent.tab();
      await expect.element(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.poll(() => isFocused(item("Rename"))).toBe(true);
      await userEvent.keyboard("{ArrowDown}");
      await expect.poll(() => isFocused(item("Duplicate"))).toBe(true);
      await userEvent.keyboard("{ArrowDown}");
      await expect.poll(() => isFocused(item("Delete"))).toBe(true);
      await userEvent.keyboard("{Escape}");
      await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
      await expect.element(trigger).toHaveFocus();
    });

    test("choosing an item runs it, closes the menu and returns focus", async () => {
      await mount("menu");
      const trigger = page.getByRole("button", { name: "Actions" });
      await trigger.click();
      await page.getByRole("menuitem", { name: "Duplicate" }).click();
      await expect.element(page.getByText("Chose Duplicate.")).toBeVisible();
      await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
      await expect.element(trigger).toHaveFocus();
    });
  });

  describe("Select", () => {
    test("a press opens the list, and choosing an option shows it in the field", async () => {
      await mount("select");
      const plan = selectField("Plan");
      await expect.element(plan).toHaveTextContent("Team");
      await expect.element(plan).toHaveAttribute("aria-haspopup", "listbox");
      const field = plan.element();
      await plan.click();
      const list = page.getByRole("listbox");
      await expect.element(list).toBeVisible();
      await expect.element(field).toHaveAttribute("aria-expanded", "true");
      // Named by its label alone, as the field shows it, and described by its help line.
      const team = list.getByRole("option", { name: "Team", exact: true });
      await expect.element(team).toHaveAttribute("aria-selected", "true");
      await expect.element(team).toHaveAccessibleDescription("Up to 20 people");
      await list.getByRole("option", { name: "Business", exact: true }).click();
      await expect.element(list).not.toBeInTheDocument();
      await expect.element(plan).toHaveTextContent("Business");
      await expect.element(plan).toHaveFocus();
    });

    test("the keyboard opens the list, typing jumps to an option and Enter chooses it", async () => {
      await mount("select");
      const country = selectField("Country");
      await expect.element(country).toHaveTextContent(COUNTRY_PLACEHOLDER);
      await userEvent.tab();
      await userEvent.tab();
      await expect.element(country).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect.element(page.getByRole("listbox")).toBeVisible();
      await userEvent.keyboard("j");
      await expect.poll(() => isFocused(page.getByRole("option", { name: "Japan" }))).toBe(true);
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
      await expect.element(country).toHaveTextContent("Japan");
    });

    test("Escape closes the list without choosing", async () => {
      await mount("select");
      const plan = selectField("Plan");
      await plan.click();
      await expect.element(page.getByRole("listbox")).toBeVisible();
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Escape}");
      await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
      await expect.element(plan).toHaveTextContent("Team");
      await expect.element(plan).toHaveFocus();
    });
  });

  describe("DatePicker", () => {
    test("a press opens the month of the chosen day, and choosing a day shows it", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      await expect.element(due).toHaveTextContent("Mar 10, 2026");
      await expect.element(due).toHaveAttribute("aria-haspopup", "dialog");
      await expect.element(due).toHaveAttribute("aria-expanded", "false");
      const field = due.element();
      await due.click();
      const grid = page.getByRole("grid");
      await expect.element(grid).toBeVisible();
      await expect.element(grid).toHaveAccessibleName(/March 2026/);
      const dialog = page.getByRole("dialog", { name: "Due date" });
      await expect.element(dialog).toBeVisible();
      expect(field.getAttribute("aria-expanded")).toBe("true");
      // Named by what the page shows alone: a name of the toolkit's own would be in English.
      expect(field.hasAttribute("aria-label")).toBe(false);
      expect(dialog.element().hasAttribute("aria-label")).toBe(false);
      await expect
        .element(page.getByRole("gridcell", { name: "March 10, 2026", exact: false }))
        .toHaveAttribute("aria-selected", "true");
      await day("March 20, 2026").click();
      await expect.element(grid).not.toBeInTheDocument();
      await expect.element(due).toHaveTextContent("Mar 20, 2026");
      await expect.element(due).toHaveFocus();
    });

    test("the arrow keys, Page Up and Down, Home and End move the focused day", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      await userEvent.tab();
      await expect.element(due).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("grid")).toBeVisible();
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{ArrowRight}");
      await expect.poll(focusedDay).toMatch(/March 11, 2026/);
      await userEvent.keyboard("{ArrowDown}");
      await expect.poll(focusedDay).toMatch(/March 18, 2026/);
      await userEvent.keyboard("{ArrowLeft}");
      await expect.poll(focusedDay).toMatch(/March 17, 2026/);
      await userEvent.keyboard("{ArrowUp}");
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{PageDown}");
      await expect.poll(focusedDay).toMatch(/April 10, 2026/);
      await expect.element(page.getByRole("grid")).toHaveAccessibleName(/April 2026/);
      await userEvent.keyboard("{PageUp}");
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{End}");
      await expect.poll(focusedDay).toMatch(/March 31, 2026/);
      await userEvent.keyboard("{Home}");
      // The first day of the month, held at the minimum.
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(due).toHaveTextContent("Mar 6, 2026");
      await expect.element(due).toHaveFocus();
    });

    test("days before the minimum cannot be chosen, and Escape closes without choosing", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      await due.click();
      await expect
        .element(page.getByRole("gridcell", { name: "March 4, 2026", exact: false }))
        .toHaveAttribute("aria-disabled", "true");
      // Forced: without it, the click waits for the day to take presses.
      await day("March 4, 2026").click({ force: true });
      await expect.element(page.getByRole("grid")).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(due).toHaveTextContent("Mar 10, 2026");
      await expect.element(due).toHaveFocus();
    });

    test("the error describes the field until a day is chosen, and a disabled one stays shut", async () => {
      await mount("date-picker");
      const start = dateField("Start date");
      await expect.element(start).toHaveTextContent(START_PLACEHOLDER);
      await expect.element(start).toHaveAccessibleDescription(START_ERROR);
      await start.click();
      await expect.element(page.getByRole("grid")).toBeVisible();
      // Today, whatever day the checks run on.
      await expect.poll(focusedDay).not.toBeNull();
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(page.getByText(START_ERROR)).not.toBeInTheDocument();
      await expect.element(start).not.toHaveTextContent(START_PLACEHOLDER);
      await expect.element(dateField("Locked")).toBeDisabled();
    });

    test("Tab stays in the open calendar, and the page behind is hidden from assistive technology", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      const behind = dateField("Start date").element();
      await due.click();
      const calendar = page.getByRole("dialog");
      await expect.element(calendar).toBeVisible();
      await expect.poll(() => holdsFocus(calendar)).toBe(true);
      for (let step = 0; step < 4; step++) {
        await userEvent.tab();
        expect(holdsFocus(calendar)).toBe(true);
      }
      await userEvent.tab({ shift: true });
      expect(holdsFocus(calendar)).toBe(true);
      expect(hiddenFromAssistiveTechnology(behind)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await expect.element(calendar).not.toBeInTheDocument();
      await expect.poll(() => hiddenFromAssistiveTechnology(behind)).toBe(false);
      await expect.element(due).toHaveFocus();
    });

    test("a month button disabled at min or max hands the focus to the focused day", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      await due.click();
      const calendar = page.getByRole("dialog");
      const next = calendar.getByRole("button", { name: "Next month" });
      const previous = calendar.getByRole("button", { name: "Previous month" });
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      // From the day to the one month button that can be pressed in March.
      await userEvent.tab();
      await expect.element(next).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("grid")).toHaveAccessibleName(/April 2026/);
      await expect.element(next).toBeDisabled();
      await expect.poll(focusedDay).toMatch(/April 10, 2026/);
      await previous.click();
      await expect.element(page.getByRole("grid")).toHaveAccessibleName(/March 2026/);
      await expect.element(previous).toBeDisabled();
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.tab();
      expect(holdsFocus(calendar)).toBe(true);
    });

    test("moves past min or max stop at them", async () => {
      await mount("date-picker");
      const due = dateField("Due date");
      await due.click();
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{ArrowUp}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{ArrowLeft}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{PageUp}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{PageDown}");
      await expect.poll(focusedDay).toMatch(/April 5, 2026/);
      await userEvent.keyboard("{PageDown}");
      await expect.poll(focusedDay).toMatch(/April 20, 2026/);
      await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
    });

    test("with nothing chosen, each opening starts on today, held between min and max", async () => {
      await onDay(new Date(2026, 10, 14, 12), async (setNow) => {
        await mount("date-picker");
        const review = dateField("Review date");
        const grid = page.getByRole("grid");
        await review.click();
        await expect.element(grid).toHaveAccessibleName(/April 2026/);
        await expect.poll(focusedDay).toMatch(/April 20, 2026/);
        await userEvent.keyboard("{Escape}");
        await expect.element(grid).not.toBeInTheDocument();
        setNow(new Date(2026, 0, 2, 12));
        await review.click();
        await expect.element(grid).toHaveAccessibleName(/March 2026/);
        await expect.poll(focusedDay).toMatch(/March 5, 2026/);
        await userEvent.keyboard("{Escape}");
        await expect.element(grid).not.toBeInTheDocument();
        setNow(new Date(2026, 2, 20, 12));
        await review.click();
        await expect.poll(focusedDay).toMatch(/March 20, 2026/);
        await expect
          .element(page.getByRole("gridcell", { name: "March 20, 2026", exact: false }))
          .toHaveAttribute("aria-current", "date");
      });
    });
  });

  describe("DateRangePicker", () => {
    test("a press opens the start's month and shows the range, its ends named", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      await expect.element(stay).toHaveTextContent("Mar 10 – 14, 2026");
      await expect.element(stay).toHaveAttribute("aria-haspopup", "dialog");
      await stay.click();
      const grid = page.getByRole("grid");
      await expect.element(grid).toHaveAccessibleName("March 2026");
      await expect.element(grid).toHaveAttribute("aria-multiselectable", "true");
      await expect.element(page.getByRole("dialog", { name: "Stay" })).toBeVisible();
      expect(selectedDays()).toEqual([10, 11, 12, 13, 14]);
      await expect.element(rangeCell("Check-in, Tuesday, March 10, 2026")).toBeVisible();
      await expect.element(rangeCell("Check-out, Saturday, March 14, 2026")).toBeVisible();
      await expect.element(page.getByText("Check-in: Mar 10, 2026")).toBeVisible();
      await expect.element(page.getByText("Check-out: Mar 14, 2026")).toBeVisible();
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
    });

    test("the first press sets the start, a hover previews the range, the second press ends it", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      const field = stay.element();
      await stay.click();
      const grid = page.getByRole("grid");
      await rangeDay("March 20, 2026").click();
      // The calendar stays, with the start alone; the field keeps the range until the end.
      await expect.element(grid).toBeVisible();
      expect(selectedDays()).toEqual([20]);
      await expect.element(rangeCell("Check-in, Friday, March 20, 2026")).toBeVisible();
      await expect.element(page.getByText("Check-out: –")).toBeVisible();
      expect(field.textContent).toMatch(/Mar 10\s–\s14, 2026/);
      await userEvent.hover(rangeDay("March 25, 2026"));
      await expect.poll(() => selectedDays()).toEqual([20, 21, 22, 23, 24, 25]);
      // A day before the start previews nothing: a press there starts again.
      await userEvent.hover(rangeDay("March 16, 2026"));
      await expect.poll(() => selectedDays()).toEqual([20]);
      await userEvent.hover(rangeDay("March 25, 2026"));
      await expect.poll(() => selectedDays()).toEqual([20, 21, 22, 23, 24, 25]);
      await rangeDay("March 25, 2026").click();
      await expect.element(grid).not.toBeInTheDocument();
      await expect.element(stay).toHaveTextContent("Mar 20 – 25, 2026");
      await expect.element(stay).toHaveFocus();
    });

    test("a press before the start starts again from there", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      await stay.click();
      await rangeDay("March 20, 2026").click();
      await rangeDay("March 15, 2026").click();
      await expect.element(page.getByRole("grid")).toBeVisible();
      expect(selectedDays()).toEqual([15]);
      await expect.element(rangeCell("Check-in, Sunday, March 15, 2026")).toBeVisible();
      await rangeDay("March 18, 2026").click();
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(stay).toHaveTextContent("Mar 15 – 18, 2026");
    });

    test("an end shorter than minLength or longer than maxLength cannot be chosen", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      await stay.click();
      // Over the whole range, a press starts a new one.
      await rangeDay("March 10, 2026").click();
      expect(selectedDays()).toEqual([10]);
      // The start itself and one night are too short, fifteen nights too long.
      for (const name of [
        "Check-in, Tuesday, March 10, 2026",
        "March 11, 2026",
        "March 25, 2026",
      ]) {
        await expect.element(rangeCell(name)).toHaveAttribute("aria-disabled", "true");
      }
      for (const name of ["March 12, 2026", "March 24, 2026"]) {
        await expect.element(rangeCell(name)).not.toHaveAttribute("aria-disabled", "true");
      }
      // Forced: without it, the click waits for the day to take presses.
      for (const name of ["March 10, 2026", "March 11, 2026", "March 25, 2026"]) {
        await rangeDay(name).click({ force: true });
      }
      await expect.element(page.getByRole("grid")).toBeVisible();
      expect(selectedDays()).toEqual([10]);
      await rangeDay("March 12, 2026").click();
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(stay).toHaveTextContent("Mar 10 – 12, 2026");
    });

    test("without a minimum length, the same day twice is a range of one day", async () => {
      await onDay(new Date(2026, 10, 16, 12), async () => {
        await mount("date-range-picker");
        const leave = dateField("Leave");
        await expect.element(leave).toHaveTextContent(LEAVE_PLACEHOLDER);
        await expect.element(leave).toHaveAccessibleDescription(LEAVE_ERROR);
        await leave.click();
        await expect.poll(focusedDay).toMatch(/November 16, 2026/);
        await userEvent.keyboard("{Enter}");
        // The focus moves on from the start, as after any start; back to it.
        await expect.poll(focusedDay).toMatch(/November 17, 2026/);
        await userEvent.keyboard("{ArrowLeft}");
        await expect.poll(focusedDay).toBe("Start, Monday, November 16, 2026");
        await userEvent.keyboard("{Enter}");
        await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
        await expect.element(leave).toHaveTextContent("Nov 16, 2026");
        await expect.element(page.getByText(LEAVE_ERROR)).not.toBeInTheDocument();
        await expect.element(dateField("Locked range")).toBeDisabled();
      });
    });

    test("Enter sets the start, the keys preview the end, and Enter ends the range", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      await userEvent.tab();
      await expect.element(stay).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{ArrowDown}");
      await expect.poll(focusedDay).toMatch(/March 17, 2026/);
      await userEvent.keyboard("{Enter}");
      // The focus moves on to the next day, and the preview with it.
      await expect.poll(focusedDay).toMatch(/March 18, 2026/);
      await expect.poll(() => selectedDays()).toEqual([17, 18]);
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      await expect.poll(focusedDay).toMatch(/March 20, 2026/);
      await expect.poll(() => selectedDays()).toEqual([17, 18, 19, 20]);
      await userEvent.keyboard("{PageDown}");
      await expect.element(page.getByRole("grid")).toHaveAccessibleName("April 2026");
      await expect.poll(focusedDay).toMatch(/April 20, 2026/);
      await userEvent.keyboard("{PageUp}");
      await expect.poll(focusedDay).toMatch(/March 20, 2026/);
      await userEvent.keyboard("{Enter}");
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
      await expect.element(stay).toHaveTextContent("Mar 17 – 20, 2026");
      await expect.element(stay).toHaveFocus();
    });

    test("the keys move as in a DatePicker, and stop at min and max", async () => {
      await mount("date-range-picker");
      await dateField("Stay").click();
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{ArrowUp}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{ArrowLeft}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{End}");
      await expect.poll(focusedDay).toMatch(/March 31, 2026/);
      await userEvent.keyboard("{Home}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await userEvent.keyboard("{PageDown}");
      await expect.poll(focusedDay).toMatch(/April 5, 2026/);
      await userEvent.keyboard("{PageDown}");
      await expect.poll(focusedDay).toMatch(/April 20, 2026/);
      await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
      await expect.poll(focusedDay).toMatch(/March 5, 2026/);
      await expect.element(rangeCell("March 4, 2026")).toHaveAttribute("aria-disabled", "true");
    });

    test("Escape drops a start alone, and the range opens again as it was", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      const grid = page.getByRole("grid");
      await stay.click();
      await rangeDay("March 20, 2026").click();
      await userEvent.keyboard("{Escape}");
      await expect.element(grid).not.toBeInTheDocument();
      await expect.element(stay).toHaveTextContent("Mar 10 – 14, 2026");
      await expect.element(stay).toHaveFocus();
      await stay.click();
      expect(selectedDays()).toEqual([10, 11, 12, 13, 14]);
      // Over the whole range a hover previews nothing: the next press starts anew.
      await userEvent.hover(rangeDay("March 25, 2026"));
      await expect.poll(() => selectedDays()).toEqual([10, 11, 12, 13, 14]);
      await rangeDay("March 25, 2026").click();
      await expect.element(grid).toBeVisible();
      expect(selectedDays()).toEqual([25]);
      await userEvent.keyboard("{Escape}");
      await expect.element(grid).not.toBeInTheDocument();
      // The same with the keyboard, whose preview is gone too.
      await userEvent.keyboard("{Enter}");
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      await userEvent.keyboard("{ArrowDown}{Enter}");
      await expect.poll(() => selectedDays()).toEqual([17, 18]);
      await userEvent.keyboard("{Escape}");
      await expect.element(grid).not.toBeInTheDocument();
      await expect.element(stay).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.poll(focusedDay).toMatch(/March 10, 2026/);
      expect(selectedDays()).toEqual([10, 11, 12, 13, 14]);
    });

    test("Tab stays in the open calendar, and the page behind is hidden from assistive technology", async () => {
      await mount("date-range-picker");
      const stay = dateField("Stay");
      const behind = dateField("Other field").element();
      await stay.click();
      const calendar = page.getByRole("dialog");
      await expect.poll(() => holdsFocus(calendar)).toBe(true);
      for (let step = 0; step < 4; step++) {
        await userEvent.tab();
        expect(holdsFocus(calendar)).toBe(true);
      }
      expect(hiddenFromAssistiveTechnology(behind)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await expect.element(calendar).not.toBeInTheDocument();
      await expect.element(stay).toHaveFocus();
    });

    test("where the window is wide, two months: each its own grid, a range across both", async () => {
      await wide(async () => {
        await mount("date-range-picker");
        const stay = dateField("Stay");
        await stay.click();
        await expect.poll(gridNames).toEqual(["March 2026", "April 2026"]);
        await rangeDay("March 28, 2026").click();
        await userEvent.hover(rangeDay("April 3, 2026"));
        await expect.poll(() => selectedDays("April 2026")).toEqual([1, 2, 3]);
        expect(selectedDays("March 2026")).toEqual([28, 29, 30, 31]);
        await rangeDay("April 3, 2026").click();
        await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
        await expect.element(stay).toHaveTextContent("Mar 28 – Apr 3, 2026");
        await stay.click();
        await expect.poll(focusedDay).toMatch(/March 28, 2026/);
        expect(selectedDays("March 2026")).toEqual([28, 29, 30, 31]);
        expect(selectedDays("April 2026")).toEqual([1, 2, 3]);
      });
    });

    test("with two months, Page Down moves a month and a month button both months", async () => {
      await onDay(new Date(2026, 10, 16, 12), async () => {
        await wide(async () => {
          await mount("date-range-picker");
          await dateField("Leave").click();
          await expect.poll(gridNames).toEqual(["November 2026", "December 2026"]);
          await expect.poll(focusedDay).toMatch(/November 16, 2026/);
          await userEvent.keyboard("{PageDown}");
          await expect.poll(focusedDay).toMatch(/December 16, 2026/);
          expect(gridNames()).toEqual(["November 2026", "December 2026"]);
          await userEvent.keyboard("{PageDown}");
          await expect.poll(focusedDay).toMatch(/January 16, 2027/);
          await expect.poll(gridNames).toEqual(["January 2027", "February 2027"]);
          await page.getByRole("button", { name: "Next month" }).click();
          await expect.poll(gridNames).toEqual(["March 2027", "April 2027"]);
        });
      });
    });
  });

  describe("Dialog", () => {
    test("focus moves in and stays in, and Escape closes it and returns focus", async () => {
      await mount("dialog");
      const opener = page.getByRole("button", { name: "Delete the report" });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: CONFIRM.title });
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog).toHaveAccessibleDescription(CONFIRM.description);
      await expect.poll(() => holdsFocus(dialog)).toBe(true);
      for (let step = 0; step < 4; step++) {
        await userEvent.tab();
        expect(holdsFocus(dialog)).toBe(true);
      }
      await userEvent.keyboard("{Escape}");
      await expect.element(dialog).not.toBeInTheDocument();
      await expect.element(opener).toHaveFocus();
    });

    test("the page behind is hidden from assistive technology while it is open", async () => {
      await mount("dialog");
      const opener = page.getByRole("button", { name: "Delete the report" });
      const ask = page.getByRole("button", { name: "Ask" });
      const behind = ask.element();
      await opener.click();
      await expect.element(page.getByRole("dialog")).toBeVisible();
      expect(hiddenFromAssistiveTechnology(behind)).toBe(true);
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
      expect(hiddenFromAssistiveTechnology(ask.element())).toBe(false);
      await expect.element(opener).toHaveFocus();
    });

    test("a dialog that is not dismissible ignores Escape and closes on its action", async () => {
      await mount("dialog");
      const opener = page.getByRole("button", { name: "Ask" });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: QUESTION.title });
      await expect.element(dialog).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await wait(100);
      await expect.element(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Keep" }).click();
      await expect.element(dialog).not.toBeInTheDocument();
      await expect.element(opener).toHaveFocus();
    });
  });

  describe("Slider", () => {
    test("each arrow key moves one step, and Home and End go to the ends", async () => {
      await mount("slider");
      const volume = page.getByRole("slider", { name: "Volume" });
      expect(sliderValue(volume)).toBe("60");
      await userEvent.tab();
      await expect.element(volume).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect.poll(() => sliderValue(volume)).toBe("61");
      await userEvent.keyboard("{ArrowUp}");
      await expect.poll(() => sliderValue(volume)).toBe("62");
      await userEvent.keyboard("{ArrowLeft}");
      await expect.poll(() => sliderValue(volume)).toBe("61");
      await userEvent.keyboard("{End}");
      await expect.poll(() => sliderValue(volume)).toBe("100");
      await userEvent.keyboard("{Home}");
      await expect.poll(() => sliderValue(volume)).toBe("0");
    });

    test("the value snaps to the step, and a disabled slider takes no focus", async () => {
      await mount("slider");
      const fontSize = page.getByRole("slider", { name: "Font size" });
      await userEvent.tab();
      await userEvent.tab();
      await expect.element(fontSize).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect.poll(() => sliderValue(fontSize)).toBe("18");
      await userEvent.keyboard("{End}");
      await expect.poll(() => sliderValue(fontSize)).toBe("24");
      await userEvent.tab();
      expect(holdsFocus(page.getByRole("slider", { name: "Balance" }))).toBe(false);
      expect(sliderValue(page.getByRole("slider", { name: "Balance" }))).toBe("30");
    });
  });

  describe("Accordion", () => {
    test("each title reports whether its body is open, and points at it", async () => {
      await mount("accordion");
      const seats = page.getByRole("button", { name: QUESTIONS[1].title });
      const cancel = page.getByRole("button", { name: QUESTIONS[0].title });
      await expect.element(seats).toHaveAttribute("aria-expanded", "true");
      await expect.element(cancel).toHaveAttribute("aria-expanded", "false");
      await expect.element(page.getByText(QUESTIONS[1].content)).toBeVisible();
      await expect.element(page.getByText(QUESTIONS[0].content)).not.toBeVisible();
      const panel = document.getElementById(seats.element().getAttribute("aria-controls") ?? "");
      expect(panel?.textContent).toContain(QUESTIONS[1].content);
    });

    test("opening one item closes the other, unless several may be open", async () => {
      await mount("accordion");
      const button = (name: string) => page.getByRole("button", { name });
      await button(QUESTIONS[0].title).click();
      await expect.element(button(QUESTIONS[0].title)).toHaveAttribute("aria-expanded", "true");
      await expect.element(page.getByText(QUESTIONS[0].content)).toBeVisible();
      await expect.element(button(QUESTIONS[1].title)).toHaveAttribute("aria-expanded", "false");
      await button("Privacy").click();
      await expect.element(button("Privacy")).toHaveAttribute("aria-expanded", "true");
      await expect.element(button("Notifications")).toHaveAttribute("aria-expanded", "true");
    });

    test("Enter and Space toggle the focused item", async () => {
      await mount("accordion");
      const cancel = page.getByRole("button", { name: QUESTIONS[0].title });
      await userEvent.tab();
      await expect.element(cancel).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect.element(cancel).toHaveAttribute("aria-expanded", "true");
      await userEvent.keyboard(" ");
      await expect.element(cancel).toHaveAttribute("aria-expanded", "false");
    });

    test("a click with no press before it toggles an item that does not have focus", async () => {
      await mount("accordion");
      const cancel = page.getByRole("button", { name: QUESTIONS[0].title });
      const title = cancel.element();
      expect(holdsFocus(cancel)).toBe(false);
      // As from a script, a voice command or other assistive technology.
      if (title instanceof HTMLElement) title.click();
      await expect.element(cancel).toHaveAttribute("aria-expanded", "true");
      await expect.element(page.getByText(QUESTIONS[0].content)).toBeVisible();
    });
  });

  describe("Tooltip", () => {
    test("keyboard focus shows it at once, it describes the control, and Escape hides it", async () => {
      await mount("tooltip");
      const search = page.getByRole("button", { name: "Search" });
      await userEvent.tab();
      await expect.element(search).toHaveFocus();
      const tooltip = page.getByRole("tooltip");
      await expect.element(tooltip).toBeVisible();
      await expect.element(tooltip).toMatchTextContent(/^Search\s*⌘K$/);
      await expect.element(search).toHaveAccessibleDescription(/Search/);
      await userEvent.keyboard("{Escape}");
      await expect.element(tooltip).not.toBeInTheDocument();
      await expect.element(search).toHaveFocus();
    });

    test("the pointer resting on the control shows it, and leaving hides it", async () => {
      await mount("tooltip");
      // A person's pointer crosses the page before it reaches a control, and a tooltip may
      // wait for the pointer to move before it shows for a hover.
      await page.getByRole("button", { name: "Search" }).hover();
      await page.getByRole("button", { name: "Export" }).hover();
      const tooltip = page.getByRole("tooltip", { name: "Export as a spreadsheet" });
      await expect.element(tooltip, { timeout: 3000 }).toBeVisible();
      await userEvent.unhover(page.getByRole("button", { name: "Export" }));
      await expect.element(tooltip).not.toBeInTheDocument();
    });
  });

  describe("Defaults", () => {
    test("a component takes what the closest Defaults gives, and its own props win", async () => {
      await mount("defaults");
      const classes = (name: string) =>
        page.getByRole("button", { name }).element().className.split(/\s+/);
      expect(classes("Save")).toEqual(
        expect.arrayContaining(["acme-button--primary", "acme-button--lg"]),
      );
      expect(classes("Skip")).toEqual(
        expect.arrayContaining(["acme-button--ghost", "acme-button--lg"]),
      );
      expect(classes("Nested")).toEqual(
        expect.arrayContaining(["acme-button--primary", "acme-button--sm"]),
      );
      expect(classes("Outside")).toEqual(
        expect.arrayContaining(["acme-button--secondary", "acme-button--md"]),
      );
      expect(classes("Retry")).not.toContain("acme-button--primary");
      expect(classes("Retry")).not.toContain("acme-button--lg");
      expect(page.getByText("Live").element().closest(".acme-badge")?.className).toMatch(
        /badge-success/,
      );
      // A large spinner is as tall as the large icon.
      const spinner = page.getByRole("status", { name: "Loading" }).element();
      expect(spinner.closest(".acme-spinner")?.getBoundingClientRect().height).toBe(
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--acme-size-spinner-lg"),
        ),
      );
    });
  });

  describe("Root parts", () => {
    test("every component's root element has its root part and the class the app gives it", async () => {
      await mount("parts");
      const rooted = (name: string) => {
        const elements = document.querySelectorAll(`.app-${name}`);
        expect(elements, `.app-${name}`).toHaveLength(1);
        expect(elements[0]?.classList.contains(`acme-${name}`), `.app-${name}`).toBe(true);
      };
      const opened = new Set(["menu", "tooltip", "dialog"]);
      for (const name of PART_NAMES) if (!opened.has(name)) rooted(name);
      // A toast's root is its surface, not the region across the bottom of the window that it
      // rises in, which is in the top layer as a popover.
      const toast = document.querySelector(".app-toast");
      expect(toast?.hasAttribute("popover")).toBe(false);
      expect(toast?.parentElement?.closest("[popover]")).not.toBeNull();
      await page.getByRole("button", { name: "Export" }).hover();
      await expect.element(page.getByRole("tooltip"), { timeout: 3000 }).toBeVisible();
      rooted("tooltip");
      await page.getByRole("button", { name: "Options" }).click();
      await expect.element(page.getByRole("menu")).toBeVisible();
      rooted("menu");
      await userEvent.keyboard("{Escape}");
      await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
      await page.getByRole("button", { name: "Open the dialog" }).click();
      await expect.element(page.getByRole("dialog")).toBeVisible();
      rooted("dialog");
    });
  });

  describe("Toast", () => {
    test("it is announced, and its action runs and closes it", async () => {
      await mount("toast");
      await page.getByRole("button", { name: "Delete a draft" }).click();
      await expect.element(page.getByRole("status")).toMatchTextContent(TOAST.message);
      await expect.element(page.getByText("The draft is deleted.")).toBeVisible();
      await page.getByRole("button", { name: "Undo" }).click();
      await expect.element(page.getByText(TOAST.message)).not.toBeInTheDocument();
      await expect.element(page.getByText("The draft is there.")).toBeVisible();
    });

    test("it leaves on its own, but not while the pointer rests on it", async () => {
      await mount("toast");
      await page.getByRole("button", { name: "Delete a draft" }).click();
      const message = page.getByText(TOAST.message);
      await message.hover();
      await wait(TOAST.duration * 1.5);
      await expect.element(message).toBeVisible();
      await userEvent.unhover(message);
      await expect.element(message, { timeout: TOAST.duration * 3 }).not.toBeInTheDocument();
    });
  });
}
