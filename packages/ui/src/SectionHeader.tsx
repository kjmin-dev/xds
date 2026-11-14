import { Button } from "./Button.tsx";
import { Icon, type IconName } from "./Icon.tsx";

export type SectionHeaderProps = {
  title: string;
  /** A line under the title. */
  description?: string;
  /** Before the title. */
  icon?: IconName;
  /** A link-like action at the end, such as "See all". */
  action?: { label: string; onPress: () => void };
  /** The heading level in the document outline. Defaults to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

// What sits beside the title is centered on the title's first line, not on the whole block,
// so it stays put when a description is added. `1lh` in the heading's type is that line.
const TITLE_LINE = "flex h-lh shrink-0 items-center text-acme-heading";

/**
 * The title row of a group of content. The title is a heading at `level`; the action is a quiet
 * button with a chevron at its end edge, which points the other way in a right-to-left layout.
 */
export function SectionHeader({ title, description, icon, action, level = 2 }: SectionHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div className="flex items-start gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {icon && (
          <span className={`${TITLE_LINE} text-acme-text-secondary`}>
            <Icon name={icon} size="md" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading className="text-acme-heading text-acme-text-primary">{title}</Heading>
          {description && (
            <p className="text-acme-detail text-acme-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <span className={TITLE_LINE}>
          <Button variant="ghost" size="sm" onPress={action.onPress}>
            {action.label}
            {/* Button's own `iconEnd` does not mirror; this one has to, as it points onward. */}
            <Icon name="chevron-right" size="sm" className="rtl:-scale-x-100" />
          </Button>
        </span>
      )}
    </div>
  );
}
