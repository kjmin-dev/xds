/** TextField's props in every framework, short of `onChange` and the `leading` and `trailing` slots. */
export type TextFieldBaseProps = {
  /** Always visible. A placeholder is not a label: it disappears as soon as the person types. */
  label: string;
  value: string;
  /** Help shown under the field. Replaced by `error` while there is one. */
  description?: string;
  /** What is wrong and how to fix it. Clear it when the value changes. */
  error?: string | undefined;
  placeholder?: string;
  /** A text area of `rows` lines, which scrolls beyond that. `type` does not apply to it. */
  multiline?: boolean;
  rows?: number;
  /** The field takes no more characters than this, and counts them under its end edge. */
  maxLength?: number;
  name?: string;
  type?: TextFieldType;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search";
  autoComplete?: AutoFill | (string & {});
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
};

/** The `type` of a one-line field: the input types that take typed text, and any other. */
export type TextFieldType =
  | "text"
  | "email"
  | "password"
  | "search"
  | "tel"
  | "url"
  | "number"
  | (string & {});

/** SearchField's props in every framework, short of `onChange` and `onSubmit`. */
export type SearchFieldBaseProps = {
  value: string;
  /** The accessible name. It is not shown: the search icon says what the field is for. */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** Names the control that empties the field, for assistive technology. */
  clearLabel?: string;
};
