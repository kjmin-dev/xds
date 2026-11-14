/** ListRow's props in every framework, short of `leading`, `trailing` and `onPress`. */
export type ListRowBaseProps = {
  title: string;
  description?: string;
  /** Draws a chevron at the far end, for a row that leads somewhere else. */
  chevron?: boolean;
  /** The row that is the current choice, such as the open page in a sidebar. */
  selected?: boolean;
  /** A shorter row with smaller text, for dense lists such as a sidebar or a menu. */
  compact?: boolean;
  disabled?: boolean;
};

// The selected title is heavier, so the choice does not depend on the tint alone.
const TITLE = {
  regular: { rest: "text-acme-body", selected: "text-acme-body-strong" },
  compact: { rest: "text-acme-detail", selected: "text-acme-label" },
} as const;

/**
 * The fills and the focus ring of a pressable row, at rest and selected. A collapsed Sidebar
 * draws its icon-only rows with them too. The ring is inside the row, where a list that clips
 * its rows still shows it.
 */
export const PRESSABLE_ROW = {
  rest: "hover:bg-acme-list-row-background-hover active:bg-acme-list-row-background-pressed disabled:hover:bg-transparent",
  selected:
    "hover:bg-acme-list-row-background-selected-hover active:bg-acme-list-row-background-selected-hover disabled:hover:bg-acme-list-row-background-selected",
  focus:
    "focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:-outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus",
} as const;

/** The row: a `div`, or a `button` with `pressable`. */
export function listRowClass(options: {
  compact?: boolean | undefined;
  selected?: boolean | undefined;
  pressable?: boolean | undefined;
}): string {
  const { compact = false, selected = false, pressable = false } = options;
  const row = `flex w-full items-center gap-3 px-4 text-start ${compact ? "min-h-acme-list-row-compact py-1" : "min-h-acme-list-row py-2"}${selected ? " bg-acme-list-row-background-selected" : ""}`;
  if (!pressable) return row;
  return `${row} cursor-pointer transition-colors duration-(--acme-motion-duration-fast) ${selected ? PRESSABLE_ROW.selected : PRESSABLE_ROW.rest} ${PRESSABLE_ROW.focus} disabled:cursor-not-allowed`;
}

export function listRowTitleClass(options: {
  compact?: boolean | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
}): string {
  const { compact = false, selected = false, disabled = false } = options;
  return `${TITLE[compact ? "compact" : "regular"][selected ? "selected" : "rest"]} ${disabled ? "text-acme-text-secondary" : "text-acme-text-primary"}`;
}

export function listRowDescriptionClass(compact = false): string {
  return `text-acme-text-secondary ${compact ? "text-acme-footnote" : "text-acme-detail"}`;
}

export const LIST_ROW_PARTS = {
  /** The title and the description, between `leading` and `trailing`. */
  text: "flex min-w-0 flex-1 flex-col gap-0.5",
  /** It points onward, so it mirrors in a right-to-left layout. */
  chevron: "text-acme-text-tertiary rtl:-scale-x-100",
} as const;
