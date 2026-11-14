import {
  LIST_ROW_PARTS,
  type ListRowBaseProps,
  listRowClass,
  listRowDescriptionClass,
  listRowTitleClass,
} from "@acme/ui-core";
import { type Element, Show } from "solid-js";
import { Icon } from "./Icon.tsx";

export type ListRowProps = ListRowBaseProps & {
  /** In front of the title: an avatar or an icon. */
  leading?: Element;
  /** At the far end: a value, a badge or a switch. */
  trailing?: Element;
  /** Makes the whole row a button. Do not put another control in `trailing` then. */
  onPress?: () => void;
};

/** One line of a list or a settings screen. Separate rows with a Divider. */
export function ListRow(props: ListRowProps) {
  return <PlaceRow {...props} current="true" />;
}

/**
 * A ListRow that says what kind of current item its selected state is. A Sidebar's rows are the
 * places of an app, so its selected row is the current page. Only for this package's own
 * components: the index does not export it.
 */
export function PlaceRow(props: ListRowProps & { current: "true" | "page" }) {
  const pressable = () => props.onPress !== undefined;
  const current = () => (props.selected ? props.current : undefined);
  const row = () =>
    listRowClass({ compact: props.compact, selected: props.selected, pressable: pressable() });
  const content = () => (
    <>
      {props.leading}
      <span class={LIST_ROW_PARTS.text}>
        <span
          class={listRowTitleClass({
            compact: props.compact,
            selected: props.selected,
            disabled: props.disabled,
          })}
        >
          {props.title}
        </span>
        <Show when={props.description}>
          {(description) => (
            <span class={listRowDescriptionClass(props.compact)}>{description()}</span>
          )}
        </Show>
      </span>
      {props.trailing}
      <Show when={props.chevron}>
        <Icon name="chevron-right" size="sm" class={LIST_ROW_PARTS.chevron} />
      </Show>
    </>
  );
  return (
    <Show
      when={pressable()}
      fallback={
        <div aria-current={current()} class={row()}>
          {content()}
        </div>
      }
    >
      <button
        aria-current={current()}
        type="button"
        disabled={props.disabled}
        onClick={() => props.onPress?.()}
        class={row()}
      >
        {content()}
      </button>
    </Show>
  );
}
