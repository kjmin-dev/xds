import type { ReactNode } from "react";

export type ListRowProps = {
  title: string;
  description?: string;
  /** In front of the title: an avatar or an icon. */
  leading?: ReactNode;
  /** At the far end: a value, a badge or a switch. */
  trailing?: ReactNode;
  /** Draws a chevron at the far end, for a row that leads somewhere else. */
  chevron?: boolean;
  /** Makes the whole row a button. Do not put another control in `trailing` then. */
  onPress?: () => void;
  disabled?: boolean;
};

const ROW = "flex min-h-acme-list-row w-full items-center gap-3 px-4 py-2 text-start";

/** One line of a list or a settings screen. Separate rows with a Divider. */
export function ListRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  onPress,
  disabled = false,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-acme-body ${disabled ? "text-acme-text-secondary" : "text-acme-text-primary"}`}
        >
          {title}
        </span>
        {description && (
          <span className="text-acme-detail text-acme-text-secondary">{description}</span>
        )}
      </span>
      {trailing}
      {chevron && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="size-acme-icon-sm shrink-0 text-acme-text-tertiary rtl:-scale-x-100"
        >
          <path
            d="m6 3.5 4.5 4.5L6 12.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </>
  );
  if (!onPress) return <div className={ROW}>{content}</div>;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={`${ROW} cursor-pointer transition-colors duration-(--acme-motion-duration-fast) hover:bg-acme-list-row-background-hover active:bg-acme-list-row-background-pressed focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:-outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      {content}
    </button>
  );
}
