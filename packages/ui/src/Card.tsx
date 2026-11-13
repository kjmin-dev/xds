import type { ReactNode } from "react";

/**
 * A surface that groups related content. A hairline outline and a trace of shadow lift it off
 * the page; in dark mode, where shadows barely show, the lighter fill does that. `title`
 * renders as a heading; `actions` sit across from it.
 */
export function Card({
  title,
  description,
  actions,
  flush = false,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  /** No padding and no gaps: for a card that holds a list, whose rows run edge to edge. */
  flush?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-acme-lg border border-acme-border-default bg-acme-background-surface shadow-acme-subtle ${flush ? "overflow-hidden" : "gap-4 p-4"} ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <h2 className="text-acme-heading text-acme-text-primary">{title}</h2>}
            {description && (
              <p className="text-acme-detail text-acme-text-secondary">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
