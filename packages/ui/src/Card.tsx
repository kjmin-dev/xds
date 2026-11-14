import { CARD_PARTS, type CardBaseProps, cardClass, cardMediaClass } from "@acme/ui-core";
import type { ReactNode } from "react";

export type CardProps = CardBaseProps & {
  /** Sit across from the title. A pressable card takes none: it is one button already. */
  actions?: ReactNode;
  /** A picture or a drawing at the top, running edge to edge above the padding. */
  media?: ReactNode;
  /** Makes the whole card one button. Put no other control inside it then. */
  onPress?: () => void;
  className?: string;
  children?: ReactNode;
};

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
  const surface = `${cardClass({ selected, flush, pressable: onPress !== undefined })} ${className}`;
  // A button may hold only phrasing content, so inside one the parts are spans. Its heading
  // would not be reachable as a heading anyway: a button reads as its text.
  const [Header, Box, Title, Line] = onPress
    ? (["span", "span", "span", "span"] as const)
    : (["header", "div", "h2", "p"] as const);
  const parts = (
    <>
      {media != null && <Box className={cardMediaClass(flush)}>{media}</Box>}
      {(title || (actions && !onPress)) && (
        <Header className={CARD_PARTS.header}>
          <Box className={CARD_PARTS.heading}>
            {title && <Title className={CARD_PARTS.title}>{title}</Title>}
            {description && <Line className={CARD_PARTS.description}>{description}</Line>}
          </Box>
          {actions && !onPress && <div className={CARD_PARTS.actions}>{actions}</div>}
        </Header>
      )}
      {children}
    </>
  );
  const content = flush ? <Box className={CARD_PARTS.flush}>{parts}</Box> : parts;
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
      className={surface}
    >
      {content}
    </button>
  );
}
