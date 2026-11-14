import { SECTION_HEADER_PARTS, type SectionHeaderBaseProps } from "@acme/ui-core";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";

export type SectionHeaderProps = SectionHeaderBaseProps & {
  /** A link-like action at the end, such as "See all". */
  action?: { label: string; onPress: () => void };
};

/**
 * The title row of a group of content. The title is a heading at `level`; the action is a quiet
 * button with a chevron at its end edge, which points the other way in a right-to-left layout.
 */
export function SectionHeader({ title, description, icon, action, level = 2 }: SectionHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div className={SECTION_HEADER_PARTS.root}>
      <div className={SECTION_HEADER_PARTS.lead}>
        {icon && (
          <span className={SECTION_HEADER_PARTS.icon}>
            <Icon name={icon} size="md" />
          </span>
        )}
        <div className={SECTION_HEADER_PARTS.text}>
          <Heading className={SECTION_HEADER_PARTS.title}>{title}</Heading>
          {description && <p className={SECTION_HEADER_PARTS.description}>{description}</p>}
        </div>
      </div>
      {action && (
        <span className={SECTION_HEADER_PARTS.action}>
          <Button variant="ghost" size="sm" onPress={action.onPress}>
            {action.label}
            <Icon name="chevron-right" size="sm" className={SECTION_HEADER_PARTS.chevron} />
          </Button>
        </span>
      )}
    </div>
  );
}
