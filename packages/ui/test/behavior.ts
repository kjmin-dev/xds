// How the interactive components behave, checked the way a person meets them: through roles,
// accessible names, ARIA state, the keyboard and the pointer. Nothing here knows which
// framework drew the component, so every web component library runs the same checks: it mounts
// each scenario of scenarios.ts with its own components and calls describeBehavior.

import { describe, expect, test } from "vitest";
import { type Locator, page, userEvent } from "vitest/browser";
import {
  CONFIRM,
  COUNTRY_PLACEHOLDER,
  QUESTION,
  QUESTIONS,
  type Scenario,
  SIZE_ERROR,
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

// A modal hides the rest of the page with `inert` or with aria-hidden; either takes it out of
// the accessibility tree.
const hiddenFromAssistiveTechnology = (locator: Locator) =>
  locator.element().closest('[inert], [aria-hidden="true"]') !== null;

// React Aria makes the field of a select a button that opens a list box, the ARIA pattern for
// a select-only combobox makes it a combobox. Both are named by the label.
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

export function describeBehavior(mount: Mount) {
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
      await trigger.click();
      // Not found by its name: React Aria names the menu after its trigger with
      // aria-labelledby, which takes precedence over the aria-label that the Menu's `label` sets.
      const menu = page.getByRole("menu");
      await expect.element(menu).toBeVisible();
      await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
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
      await expect.element(item("Rename")).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect.element(item("Duplicate")).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect.element(item("Delete")).toHaveFocus();
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
      await plan.click();
      const list = page.getByRole("listbox");
      await expect.element(list).toBeVisible();
      await expect.element(plan).toHaveAttribute("aria-expanded", "true");
      // Not exact: React Aria names an option by all of its text, the description included.
      await expect
        .element(list.getByRole("option", { name: "Team", exact: false }))
        .toHaveAttribute("aria-selected", "true");
      await list.getByRole("option", { name: "Business", exact: false }).click();
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
      await expect.element(page.getByRole("option", { name: "Japan" })).toHaveFocus();
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
      await opener.click();
      await expect.element(page.getByRole("dialog")).toBeVisible();
      expect(hiddenFromAssistiveTechnology(page.getByRole("button", { name: "Ask" }))).toBe(true);
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
      expect(hiddenFromAssistiveTechnology(page.getByRole("button", { name: "Ask" }))).toBe(false);
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
      // A person's pointer crosses the page before it reaches a control. React Aria does not
      // show a tooltip for a hover that no pointer movement came before.
      await page.getByRole("button", { name: "Search" }).hover();
      await page.getByRole("button", { name: "Export" }).hover();
      const tooltip = page.getByRole("tooltip", { name: "Export as a spreadsheet" });
      await expect.element(tooltip, { timeout: 3000 }).toBeVisible();
      await userEvent.unhover(page.getByRole("button", { name: "Export" }));
      await expect.element(tooltip).not.toBeInTheDocument();
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
