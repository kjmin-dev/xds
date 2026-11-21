import {
  LIST_ROW_PARTS,
  type ListRowBaseProps,
  classes,
  listRowClass,
  listRowDescriptionClass,
  listRowTitleClass,
  rootPart,
} from "@acme/ui-core";
import type { ReactNode } from "react";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type ListRowProps = ListRowBaseProps &
  RootProps & {
    /** In front of the title: an avatar or an icon. */
    leading?: ReactNode;
    /** At the far end: a value, a badge or a switch. */
    trailing?: ReactNode;
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
export function PlaceRow({
  title,
  description,
  leading,
  trailing,
  chevron = false,
  selected = false,
  compact = false,
  onPress,
  disabled = false,
  current,
  className,
  style,
}: ListRowProps & { current: "true" | "page" }) {
  const row = classes(
    rootPart("ListRow"),
    listRowClass({ compact, selected, pressable: onPress !== undefined }),
    className,
  );
  const currentProps = selected ? ({ "aria-current": current } as const) : {};
  const content = (
    <>
      {leading}
      <span className={LIST_ROW_PARTS.text}>
        <span className={listRowTitleClass({ compact, selected, disabled })}>{title}</span>
        {description && <span className={listRowDescriptionClass(compact)}>{description}</span>}
      </span>
      {trailing}
      {chevron && <Icon name="chevron-right" size="sm" className={LIST_ROW_PARTS.chevron} />}
    </>
  );
  if (!onPress) {
    return (
      <div {...currentProps} className={row} style={style}>
        {content}
      </div>
    );
  }
  return (
    <button
      {...currentProps}
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={row}
      style={style}
    >
      {content}
    </button>
  );
}
