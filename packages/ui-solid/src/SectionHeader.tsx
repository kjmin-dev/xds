import { SECTION_HEADER_PARTS, type SectionHeaderBaseProps } from "@acme/ui-core";
import { dynamic } from "@solidjs/web";
import { Show } from "solid-js";
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
export function SectionHeader(props: SectionHeaderProps) {
  const Heading = dynamic(() => `h${props.level ?? 2}` as const);
  return (
    <div class={SECTION_HEADER_PARTS.root}>
      <div class={SECTION_HEADER_PARTS.lead}>
        <Show when={props.icon}>
          {(icon) => (
            <span class={SECTION_HEADER_PARTS.icon}>
              <Icon name={icon()} size="md" />
            </span>
          )}
        </Show>
        <div class={SECTION_HEADER_PARTS.text}>
          <Heading class={SECTION_HEADER_PARTS.title}>{props.title}</Heading>
          <Show when={props.description}>
            {(description) => <p class={SECTION_HEADER_PARTS.description}>{description()}</p>}
          </Show>
        </div>
      </div>
      <Show when={props.action}>
        {(action) => (
          <span class={SECTION_HEADER_PARTS.action}>
            <Button variant="ghost" size="sm" onPress={() => action().onPress()}>
              {action().label}
              <Icon name="chevron-right" size="sm" class={SECTION_HEADER_PARTS.chevron} />
            </Button>
          </span>
        )}
      </Show>
    </div>
  );
}
