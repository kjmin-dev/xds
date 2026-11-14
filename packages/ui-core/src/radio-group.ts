export type RadioOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** A line of help under the label. */
  description?: string;
};

/** RadioGroup's props in every framework, short of `onChange`. */
export type RadioGroupBaseProps<Value extends string = string> = {
  /** The group's visible legend, which also names it for assistive technology. */
  label: string;
  options: readonly RadioOption<Value>[];
  /** The chosen option. Leave it out while nothing is chosen. */
  value?: Value | undefined;
  /** Disables the whole group. */
  disabled?: boolean;
  /** What is wrong and how to fix it, under the options. Clear it when the choice changes. */
  error?: string | undefined;
  /** The name the choice is submitted under with a form. */
  name?: string;
};
