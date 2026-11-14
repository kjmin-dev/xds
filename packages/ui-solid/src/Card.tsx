import { CARD_PARTS, type CardBaseProps, cardClass, cardMediaClass } from "@acme/ui-core";
import { dynamic } from "@solidjs/web";
import { children, type Element, Show } from "solid-js";

export type CardProps = CardBaseProps & {
  /** Sit across from the title. A pressable card takes none: it is one button already. */
  actions?: Element;
  /** A picture or a drawing at the top, running edge to edge above the padding. */
  media?: Element;
  /** Makes the whole card one button. Put no other control inside it then. */
  onPress?: () => void;
  class?: string;
  children?: Element;
};

/**
 * A surface that groups related content. A hairline outline and a trace of shadow lift it off
 * the page; in dark mode, where shadows barely show, the lighter fill does that. `title`
 * renders as a heading; `actions` sit across from it.
 */
export function Card(props: CardProps) {
  // Read once: each read of a JSX prop creates its nodes again.
  const media = children(() => props.media);
  const actions = children(() => props.actions);
  const body = children(() => props.children);
  const pressable = () => props.onPress !== undefined;
  // A button may hold only phrasing content, so inside one the parts are spans. Its heading
  // would not be reachable as a heading anyway: a button reads as its text.
  const Header = dynamic(() => (pressable() ? "span" : "header"));
  const Box = dynamic(() => (pressable() ? "span" : "div"));
  const Title = dynamic(() => (pressable() ? "span" : "h2"));
  const Line = dynamic(() => (pressable() ? "span" : "p"));
  const surface = () =>
    cardClass({ selected: props.selected, flush: props.flush, pressable: pressable() });
  const parts = () => (
    <>
      <Show when={media() != null}>
        <Box class={cardMediaClass(props.flush)}>{media()}</Box>
      </Show>
      <Show when={props.title || (actions() != null && !pressable())}>
        <Header class={CARD_PARTS.header}>
          <Box class={CARD_PARTS.heading}>
            <Show when={props.title}>
              {(title) => <Title class={CARD_PARTS.title}>{title()}</Title>}
            </Show>
            <Show when={props.description}>
              {(description) => <Line class={CARD_PARTS.description}>{description()}</Line>}
            </Show>
          </Box>
          <Show when={actions() != null && !pressable()}>
            <div class={CARD_PARTS.actions}>{actions()}</div>
          </Show>
        </Header>
      </Show>
      {body()}
    </>
  );
  const content = () => (
    <Show when={props.flush} fallback={parts()}>
      <Box class={CARD_PARTS.flush}>{parts()}</Box>
    </Show>
  );
  return (
    <Show
      when={pressable()}
      fallback={
        <section
          aria-current={props.selected ? "true" : undefined}
          class={[surface(), props.class]}
        >
          {content()}
        </section>
      }
    >
      <button
        type="button"
        onClick={() => props.onPress?.()}
        aria-pressed={props.selected === undefined ? undefined : props.selected ? "true" : "false"}
        class={[surface(), props.class]}
      >
        {content()}
      </button>
    </Show>
  );
}
