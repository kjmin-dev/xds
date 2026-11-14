import type { TextFieldBaseProps } from "@acme/ui-core";
import { children, createUniqueId, type Element, onSettled, Show } from "solid-js";
import { keepValue } from "./controlled.ts";

export type TextFieldProps = TextFieldBaseProps & {
  onChange: (value: string) => void;
  /**
   * Inside the box, in front of the text: an icon, a unit. It takes the placeholder's color
   * unless it sets its own.
   */
  leading?: Element;
  /** Inside the box, after the text: an icon, a unit, a small button. */
  trailing?: Element;
};

/**
 * A labelled text field, of one line or several. The label, the description and the error
 * message are tied to the input for assistive technology, and the error is announced when it
 * appears.
 *
 * An invalid field blocks its form from being submitted, so `error` has to be cleared as soon as
 * the person edits the value.
 */
export function TextField(props: TextFieldProps) {
  const id = createUniqueId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  // Read once: each read of a JSX prop creates its nodes again.
  const leading = children(() => props.leading);
  const trailing = children(() => props.trailing);
  const invalid = () => props.error !== undefined;
  let input!: HTMLInputElement | HTMLTextAreaElement;

  onSettled(() => {
    // The value is set as a property, which leaves a text area's caret after the last line,
    // and keyboard focus would then scroll to it. React renders the first value as the text
    // area's own text, with the caret before the first line.
    if (input instanceof HTMLTextAreaElement) input.setSelectionRange(0, 0);
    if (props.autoFocus) input.focus();
  });

  // The attributes the input and the text area share. `box` when the input draws the box
  // itself, which it does until something sits inside the box beside the text.
  const shared = (box: boolean) => ({
    id,
    class: box ? "text-field__input text-field__control" : "text-field__input",
    value: props.value,
    placeholder: props.placeholder,
    name: props.name,
    maxlength: props.maxLength,
    inputmode: props.inputMode,
    autocomplete: props.autoComplete,
    required: props.required,
    disabled: props.disabled,
    "aria-invalid": invalid() ? ("true" as const) : undefined,
    "aria-errormessage": invalid() ? errorId : undefined,
    "aria-describedby": invalid() ? errorId : props.description ? descriptionId : undefined,
    onInput: (event: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
      props.onChange(event.currentTarget.value);
      // While a composition is open the text belongs to the input method; it ends with
      // compositionend.
      if (!event.isComposing) keepValue(event.currentTarget, () => props.value);
    },
    onCompositionEnd: (event: CompositionEvent & { currentTarget: HTMLElement }) =>
      keepValue(event.currentTarget as HTMLInputElement, () => props.value),
  });

  const field = (box: boolean) =>
    props.multiline ? (
      <textarea ref={(element) => (input = element)} rows={props.rows ?? 3} {...shared(box)} />
    ) : (
      <input ref={(element) => (input = element)} type={props.type ?? "text"} {...shared(box)} />
    );

  return (
    <div class="text-field">
      <label for={id} class="text-field__label">
        {props.label}
      </label>
      <Show when={leading() != null || trailing() != null} fallback={field(true)}>
        <div class="text-field__control text-field__group">
          <Show when={leading()}>
            {(content) => (
              <span class="text-field__slot text-field__slot--leading">{content()}</span>
            )}
          </Show>
          {field(false)}
          <Show when={trailing()}>
            {(content) => (
              <span class="text-field__slot text-field__slot--trailing">{content()}</span>
            )}
          </Show>
        </div>
      </Show>
      {/* One line under the box: the help or the error at the start edge, the count at the
          end. The error is a live region, so it is announced when it appears. */}
      <div class="text-field__footer">
        <Show when={!invalid() && props.description}>
          <span id={descriptionId} class="text-field__description">
            {props.description}
          </span>
        </Show>
        <span id={errorId} class="text-field__error" aria-live="polite">
          {props.error}
        </span>
        <Show when={props.maxLength !== undefined}>
          <span class="ms-auto shrink-0 text-acme-footnote text-acme-text-secondary tabular-nums">
            {props.value.length}/{props.maxLength}
          </span>
        </Show>
      </div>
    </div>
  );
}
