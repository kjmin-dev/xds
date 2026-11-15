// A native input shows what was typed whether or not its owner took it: Svelte writes `value`
// and `checked` only when the prop changes, and `$bindable` does not undo an edit its owner
// refused. The web libraries' fields are controlled, as React's are, so a field whose owner
// keeps the old value puts it back. These do that, once the owner's update has run.

import { flushSync } from "svelte";

/** After `onChange`: puts the owner's value back into a field that did not take the edit. */
export function keepValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: () => string,
): void {
  flushSync();
  if (element.value !== value()) element.value = value();
}

/** After `onChange`: puts the owner's state back into a checkbox or radio that did not take it. */
export function keepChecked(element: HTMLInputElement, checked: () => boolean): void {
  flushSync();
  if (element.checked !== checked()) element.checked = checked();
}
