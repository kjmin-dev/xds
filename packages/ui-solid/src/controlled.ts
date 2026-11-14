// A native input shows what was typed whether or not the parent took it: Solid writes `value`
// and `checked` only when the prop changes. The React library's fields are controlled, so a
// field whose parent keeps the old value puts it back. These do the same, once the parent's
// update has run.

import { flush } from "solid-js";

/** After `onChange`: puts the parent's value back into a field that did not take the edit. */
export function keepValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: () => string,
): void {
  flush();
  if (element.value !== value()) element.value = value();
}

/** After `onChange`: puts the parent's state back into a checkbox or radio that did not take it. */
export function keepChecked(element: HTMLInputElement, checked: () => boolean): void {
  flush();
  if (element.checked !== checked()) element.checked = checked();
}
