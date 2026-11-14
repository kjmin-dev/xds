import type { ReactNode } from "react";

export type CardProps = {
  title?: string;
  description?: string;
  /** Sit across from the title. A pressable card takes none: it is one button already. */
  actions?: ReactNode;
  /** A picture or a drawing at the top, running edge to edge above the padding. */
  media?: ReactNode;
  /** No padding and no gaps: for a card that holds a list, whose rows run edge to edge. */
  flush?: boolean;
  /** Makes the whole card one button. Put no other control inside it then. */
  onPress?: () => void;
  /**
   * Outlines the card as the current choice. Given at all on a pressable card, it also makes
   * the card a toggle that reports its state to assistive technology.
   */
  selected?: boolean;
  className?: string;
  children?: ReactNode;
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

/**
 * A surface that groups related content. A hairline outline and a trace of shadow lift it off
 * the page; in dark mode, where shadows barely show, the lighter fill does that. `title`
 * renders as a heading; `actions` sit across from it.
 */
export function Card({
  title,
  description,
  actions,
  media,
  flush = false,
  onPress,
  selected,
  className = "",
  children,
}: CardProps) {
  const surface = `relative flex flex-col rounded-acme-lg border bg-acme-background-surface shadow-acme-subtle ${selected ? SELECTED : "border-acme-border-default"} ${flush ? "" : "gap-4 p-4"} ${className}`;
  // A button may hold only phrasing content, so inside one the parts are spans. Its heading
  // would not be reachable as a heading anyway: a button reads as its text.
  const [Header, Box, Title, Line] = onPress
    ? (["span", "span", "span", "span"] as const)
    : (["header", "div", "h2", "p"] as const);
  const parts = (
    <>
      {media != null && (
        // Pulled out through the padding to the edges.
        <Box className={`flex flex-col ${CLIP_TOP} ${flush ? "" : "-mx-4 -mt-4"}`}>{media}</Box>
      )}
      {(title || (actions && !onPress)) && (
        <Header className="flex items-start justify-between gap-3">
          <Box className="flex min-w-0 flex-col gap-0.5">
            {title && <Title className="text-acme-heading text-acme-text-primary">{title}</Title>}
            {description && (
              <Line className="text-acme-detail text-acme-text-secondary">{description}</Line>
            )}
          </Box>
          {actions && !onPress && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </Header>
      )}
      {children}
    </>
  );
  const content = flush ? <Box className={`flex flex-1 flex-col ${CLIP}`}>{parts}</Box> : parts;
  if (!onPress) {
    return (
      <section {...(selected ? { "aria-current": "true" as const } : {})} className={surface}>
        {content}
      </section>
    );
  }
  return (
    <button
      type="button"
      onClick={onPress}
      {...(selected === undefined ? {} : { "aria-pressed": selected })}
      // A button is only as wide as its content unless told otherwise; a card fills its place.
      className={`w-full cursor-pointer text-start transition-colors duration-(--acme-motion-duration-fast) hover:bg-acme-card-background-hover active:bg-acme-card-background-pressed focus-visible:outline-solid focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-offset-(--acme-focus-offset) focus-visible:outline-acme-border-focus ${surface}`}
    >
      {content}
    </button>
  );
}
