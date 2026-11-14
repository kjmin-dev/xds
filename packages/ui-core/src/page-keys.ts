/**
 * Where PageDown (`direction` 1) or PageUp (-1) moves the highlight of a Menu or a Select's
 * list, as a native list box moves it: about a page on, where a page is the height of `list`
 * (the element that scrolls), or to the last or the first row when the list does not scroll.
 * `rows` selects the rows the highlight can be on. Returns the `data-value` of the row, which
 * the machine highlights by.
 */
export function pageTarget(list: HTMLElement, rows: string, direction: 1 | -1): string | undefined {
  const all = [...list.querySelectorAll<HTMLElement>(rows)];
  const current = all.find((row) => row.hasAttribute("data-highlighted"));
  let target = direction === 1 ? all.at(-1) : all[0];
  if (current !== undefined && list.scrollHeight > list.clientHeight) {
    const top = (row: HTMLElement) => row.getBoundingClientRect().top;
    const limit = top(current) + direction * list.clientHeight;
    // The furthest row that starts no more than a page away.
    const within = all.filter((row) => (direction === 1 ? top(row) <= limit : top(row) >= limit));
    target = (direction === 1 ? within.at(-1) : within[0]) ?? target;
  }
  return target?.dataset.value;
}

/**
 * For the keydown handler of an open Menu or Select list, ahead of Zag's, which skips a key
 * that was already handled. Tab stays in the list, which holds the focus until a choice,
 * Escape or a press outside closes it: Zag would close it and let the focus move on. PageDown
 * and PageUp move the highlight by `pageTarget`, as Zag has no page keys; `highlight` takes
 * the `data-value` of the row.
 */
export function keepListKeys(
  event: { key: string; preventDefault(): void },
  list: HTMLElement | null | undefined,
  rows: string,
  highlight: (value: string) => void,
): void {
  if (event.key === "Tab") event.preventDefault();
  if ((event.key === "PageDown" || event.key === "PageUp") && list) {
    event.preventDefault();
    const value = pageTarget(list, rows, event.key === "PageDown" ? 1 : -1);
    if (value !== undefined) highlight(value);
  }
}
