/**
 * Where PageDown (`direction` 1) or PageUp (-1) moves the highlight of a Menu or a Select's
 * list, as in the React library: about a page on, where a page is the height of `list` (the
 * element that scrolls), or to the last or the first row when the list does not scroll.
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
