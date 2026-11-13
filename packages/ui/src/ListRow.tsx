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
        <Icon name="chevron-right" size="sm" className="text-acme-text-tertiary rtl:-scale-x-100" />
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
