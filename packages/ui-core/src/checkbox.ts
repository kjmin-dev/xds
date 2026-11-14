import { PEER_FOCUS } from "./switch.ts";

export { switchClass as checkboxClass, switchLabelClass as checkboxLabelClass } from "./switch.ts";

/** Checkbox's props in every framework, short of `onChange`. */
export type CheckboxBaseProps = {
  checked: boolean;
  /** Shown beside the box. Pressing it toggles too. */
  label?: string;
  /** Names the checkbox for assistive technology when there is no visible label. */
  "aria-label"?: string;
  name?: string;
  disabled?: boolean;
};

/**
 * The box, drawn beside the hidden input. The outline is what makes an empty box visible; a
 * filled one does not need it.
 */
export const checkboxBoxClass = `flex size-acme-checkbox shrink-0 items-center justify-center rounded-acme-sm border-2 border-acme-checkbox-border text-acme-checkbox-mark peer-checked:border-0 peer-checked:bg-acme-checkbox-background-checked peer-disabled:border-0 peer-disabled:bg-acme-checkbox-disabled-background peer-disabled:text-acme-checkbox-disabled-mark *:opacity-0 peer-checked:*:opacity-100 ${PEER_FOCUS}`;

/** The check mark inside the box: a 16 by 16 path, `CHECKBOX_MARK`. */
export const checkboxMarkClass = "size-3/4";

/** The path of the check mark, in a `0 0 16 16` view box. */
export const CHECKBOX_MARK = "m3.5 8.5 3 3 6-7";
