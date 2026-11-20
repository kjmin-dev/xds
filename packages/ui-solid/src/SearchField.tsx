import { classes, rootPart, type SearchFieldBaseProps } from "@acme/ui-core";
import { Show } from "solid-js";
import { keepValue } from "./controlled.ts";
import { Icon } from "./Icon.tsx";
import type { RootProps } from "./root.ts";

export type SearchFieldProps = SearchFieldBaseProps &
  RootProps & {
    onChange: (value: string) => void;
    /** Called with the query on Enter, or on the search key of a software keyboard. */
    onSubmit?: (value: string) => void;
  };

const ROOT = rootPart("SearchField");

/**
 * A text field for a query: TextField's box as a pill, with a search icon in front and, while
 * there is a value, a control that clears it. Escape clears too.
 *
 * Use it to filter or search what is on the screen. For a value that is saved with a form,
 * use a TextField, which has a visible label.
 */
export function SearchField(props: SearchFieldProps) {
  let input!: HTMLInputElement;
  return (
    // TextField's block, which draws the box, and its own root part beside it.
    <div class={classes("acme-text-field", ROOT, props.class)} style={props.style}>
      <div class="acme-text-field__control acme-text-field__control--pill acme-text-field__group">
        <span class="acme-text-field__slot acme-text-field__slot--leading">
          <Icon name="search" size="sm" />
        </span>
        <input
          ref={(element) => (input = element)}
          type="text"
          class="acme-text-field__input"
          aria-label={props.label}
          enterkeyhint="search"
          placeholder={props.placeholder}
          value={props.value}
          defaultValue={props.value}
          disabled={props.disabled}
          // Escape clears only while there is something to clear; an empty field lets Escape
          // through to whatever it sits in, such as a dialog.
          data-uses-escape={props.value !== "" ? "" : undefined}
          onInput={(event) => {
            props.onChange(event.currentTarget.value);
            if (!event.isComposing) keepValue(event.currentTarget, () => props.value);
          }}
          onCompositionEnd={(event) => keepValue(event.currentTarget, () => props.value)}
          onKeyDown={(event) => {
            // While a composition is open, Enter and Escape belong to the input method.
            if (event.isComposing) return;
            if (event.key === "Enter") props.onSubmit?.(props.value);
            if (event.key === "Escape" && props.value !== "") {
              event.stopPropagation();
              props.onChange("");
            }
          }}
        />
        <Show when={props.value !== "" && !props.disabled}>
          <span class="acme-text-field__slot acme-text-field__slot--trailing">
            <button
              type="button"
              aria-label={props.clearLabel ?? "Clear"}
              onClick={() => {
                props.onChange("");
                // The control is about to disappear, and focus would be lost with it.
                input.focus();
              }}
              class="-me-1 flex size-acme-target-min cursor-pointer items-center justify-center rounded-acme-full hover:text-acme-field-text focus-visible:outline-(length:--acme-focus-width) focus-visible:outline-acme-border-focus focus-visible:outline-solid"
            >
              <Icon name="circle-x" size="sm" />
            </button>
          </span>
        </Show>
      </div>
    </div>
  );
}
