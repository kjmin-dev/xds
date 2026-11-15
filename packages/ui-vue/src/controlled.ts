// A native input shows what was typed whether or not its owner took it: Vue writes `value` and
// `checked` only when the model changes, and a model whose owner keeps the old value does not
// change. The web libraries' fields are controlled, as React's are, so a field whose owner
// keeps the old value puts it back. These do that, once the owner's update has been drawn.

import { nextTick } from "vue";

/** After the model's update: puts the owner's value back into a field that did not take it. */
export function keepValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: () => string,
): void {
  void nextTick(() => {
    if (element.value !== value()) element.value = value();
  });
}

/** After the model's update: puts the owner's state back into a checkbox or radio. */
export function keepChecked(element: HTMLInputElement, checked: () => boolean): void {
  void nextTick(() => {
    if (element.checked !== checked()) element.checked = checked();
  });
}
