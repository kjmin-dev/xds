/** CountBadge's props in every framework, short of the child it sits on. */
export type CountBadgeBaseProps = {
  /** Zero or less draws no badge. */
  count: number;
  /** The largest number shown. A larger count reads "99+". */
  max?: number;
  /**
   * Says what is counted, such as "3 unread notifications". Without it assistive technology
   * reads the number alone.
   */
  label?: string;
};

/** The badge, laid out inline or, with `onChild`, on the top end corner of a child. */
export function countBadgeClass(onChild: boolean): string {
  // Pushed out from the corner by a quarter of its own height, so it overlaps the corner
  // instead of covering the child. `end` follows the layout direction.
  return onChild
    ? "absolute end-[calc(var(--acme-size-count-badge)/-4)] top-[calc(var(--acme-size-count-badge)/-4)] inline-flex h-acme-count-badge min-w-acme-count-badge shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full bg-acme-badge-count-background px-1 text-acme-badge-count-text text-acme-footnote"
    : "inline-flex h-acme-count-badge min-w-acme-count-badge shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full bg-acme-badge-count-background px-1 text-acme-badge-count-text text-acme-footnote";
}

/** The box around a child that a badge sits on. */
export const countBadgeAnchorClass = "relative inline-flex w-fit shrink-0";

/** What the badge reads: the count, or "99+" past `max`. */
export function countBadgeText(count: number, max = 99): string {
  return count > max ? `${max}+` : String(count);
}
