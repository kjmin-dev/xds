import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export type ListRowProps = {
  title: string;
  description?: string;
  /** In front of the title: an avatar or an icon. */
  leading?: ReactNode;
  /** At the far end: a value, a badge or a switch. */
  trailing?: ReactNode;
  /** Draws a chevron at the far end, for a row that leads somewhere else. */
  chevron?: boolean;
  /** The row that is the current choice, such as the open page in a sidebar. */
  selected?: boolean;
  /** A shorter row with smaller text, for dense lists such as a sidebar or a menu. */
  compact?: boolean;
  /** Makes the whole row a button. Do not put another control in `trailing` then. */
  onPress?: () => void;
  disabled?: boolean;
};

// The selected title is heavier, so the choice does not depend on the tint alone.
const TITLE = {
  regular: { rest: "text-acme-body", selected: "text-acme-body-strong" },
  compact: { rest: "text-acme-detail", selected: "text-acme-label" },
} as const;

/** One line of a list or a settings screen. Separate rows with a Divider. */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  selected = false,
  compact = false,
  onPress,
  disabled = false,
}: ListRowProps) {
  const row = `flex w-full items-center gap-3 px-4 text-start ${compact ? "min-h-acme-list-row-compact py-1" : "min-h-acme-list-row py-2"} ${selected ? "bg-acme-list-row-background-selected" : ""}`;
  const current = selected ? ({ "aria-current": "true" } as const) : {};
  const content = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`${TITLE[compact ? "compact" : "regular"][selected ? "selected" : "rest"]} ${disabled ? "text-acme-text-secondary" : "text-acme-text-primary"}`}
        >
          {title}
        </span>
        {description && (
          <span
            className={`text-acme-text-secondary ${compact ? "text-acme-footnote" : "text-acme-detail"}`}
          >
            {description}
          </span>
        )}
      </span>
      {trailing}
      {chevron && (
        <Icon name="chevron-right" size="sm" className="text-acme-text-tertiary rtl:-scale-x-100" />
      )}
    </>
  );
  if (!onPress) {
    return (
      <div {...current} className={row}>
        {content}
      </div>
    );
  }
  return (
    <button
      {...current}
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={`${row} cursor-pointer transition-colors duration-(--acme-motion-duration-fast) ${selected ? "hover:bg-acme-list-row-background-selected-hover active:bg-acme-list-row-background-selected-hover disabled:hover:bg-acme-list-row-background-selected" : "hover:bg-acme-list-row-background-hover active:bg-acme-list-row-background-pressed disabled:hover:bg-transparent"} focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:-outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus disabled:cursor-not-allowed`}
    >
      {content}
    </button>
  );
}
