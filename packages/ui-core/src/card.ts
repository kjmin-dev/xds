/** Card's props in every framework, short of `onPress`, its content, `actions` and `media`. */
export type CardBaseProps = {
  title?: string;
  description?: string;
  /** No padding and no gaps: for a card that holds a list, whose rows run edge to edge. */
  flush?: boolean;
  /**
   * Outlines the card as the current choice. Given at all on a pressable card, it also makes
   * the card a toggle that reports its state to assistive technology.
   */
  selected?: boolean;
};

// The selected outline is thicker than the hairline, so the state does not depend on its
// color. It is a layer over the hairline and over the content: a thicker border would move the
// content, an outline is what the focus ring uses, and anything under the content would be
// covered by `media`.
const SELECTED =
  "border-acme-card-border-selected after:pointer-events-none after:absolute after:-inset-(--acme-border-width-thin) after:rounded-acme-lg after:border-(length:--acme-border-width-thick) after:border-acme-card-border-selected";

// What runs to the edges is clipped to the inside of the hairline. The card itself clips
// nothing, or it would cut off the selected outline and the focus rings of what it holds.
const CLIP = "overflow-hidden rounded-[calc(var(--acme-radius-lg)-var(--acme-border-width-thin))]";
const CLIP_TOP =
  "overflow-hidden rounded-t-[calc(var(--acme-radius-lg)-var(--acme-border-width-thin))]";

// A button is only as wide as its content unless told otherwise; a card fills its place.
const PRESSABLE =
  "w-full cursor-pointer text-start transition-colors duration-(--acme-motion-duration-fast) hover:bg-acme-card-background-hover active:bg-acme-card-background-pressed focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus";

/** The surface: a `section`, or a `button` with `pressable`. */
export function cardClass(options: {
  selected?: boolean | undefined;
  flush?: boolean | undefined;
  pressable?: boolean | undefined;
}): string {
  const { selected = false, flush = false, pressable = false } = options;
  const surface = `relative flex flex-col rounded-acme-lg border bg-acme-background-surface shadow-acme-subtle ${selected ? SELECTED : "border-acme-border-default"}${flush ? "" : " gap-4 p-4"}`;
  return pressable ? `${PRESSABLE} ${surface}` : surface;
}

/** The box of `media`, pulled out through the padding to the edges. */
export function cardMediaClass(flush = false): string {
  return flush ? `flex flex-col ${CLIP_TOP}` : `flex flex-col ${CLIP_TOP} -mx-4 -mt-4`;
}

export const CARD_PARTS = {
  /** Around everything in a `flush` card. */
  flush: `flex flex-1 flex-col ${CLIP}`,
  header: "flex items-start justify-between gap-3",
  heading: "flex min-w-0 flex-col gap-0.5",
  title: "text-acme-heading text-acme-text-primary",
  description: "text-acme-detail text-acme-text-secondary",
  actions: "flex shrink-0 items-center gap-2",
} as const;
