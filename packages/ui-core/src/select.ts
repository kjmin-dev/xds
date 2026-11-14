export type SelectOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** A line of help under the label, in the list only. */
  description?: string;
};

/** Select's props in every framework, short of `onChange`. */
export type SelectBaseProps<Value extends string = string> = {
  /** Always visible, like a TextField's. */
  label: string;
  options: readonly SelectOption<Value>[];
  /** The chosen option. Leave it out while nothing is chosen. */
  value?: Value | undefined;
  /** Shown in the field while nothing is chosen. */
  placeholder?: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the choice changes. */
  error?: string | undefined;
  /** The name the choice is submitted under with a form. */
  name?: string;
  disabled?: boolean;
};

/**
 * The ids of the label and the help line of the option at `index`, under the Select's own id.
 * The option is named by its label alone, as the field shows it, and described by the help.
 */
export function selectOptionIds(id: string, index: number) {
  const label = `${id}-option-${index}`;
  return { label, description: `${label}-description` };
}
