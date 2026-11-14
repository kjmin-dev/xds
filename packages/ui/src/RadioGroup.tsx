import { Description, FieldError, RadioGroup as HeroRadioGroup, Label, Radio } from "@heroui/react";
import { useId } from "react";

export type RadioOption<Value extends string = string> = {
  value: Value;
  label: string;
  /** A line of help under the label. */
  description?: string;
};

export type RadioGroupProps<Value extends string = string> = {
  /** The group's visible legend, which also names it for assistive technology. */
  label: string;
  options: readonly RadioOption<Value>[];
  /** The chosen option. Leave it out while nothing is chosen. */
  value?: Value | undefined;
  onChange: (value: Value) => void;
  /** Disables the whole group. */
  disabled?: boolean;
  /** What is wrong and how to fix it, under the options. Clear it when the choice changes. */
  error?: string | undefined;
  /** The name the choice is submitted under with a form. */
  name?: string;
};

// The circle sits on the first line of the label, however many lines the label wraps to. `1lh`
// is the height of that line; on a touch screen the circle may be the taller of the two.
const CIRCLE_LINE = "flex h-[max(1lh,var(--acme-size-radio))] shrink-0 items-center";

// A thin ring at rest, a thick one around a dot when chosen. A disabled circle is filled
// instead of outlined, like a disabled checkbox. The whole group is enabled or disabled, so
// the two sets are picked here rather than left to compete as variants. The focus ring goes
// around the circle, as it does around a checkbox's box.
const CIRCLE = {
  enabled: {
    circle:
      "border-(length:--acme-border-width-thin) border-acme-radio-border group-data-selected:border-(length:--acme-border-width-thick) group-data-selected:border-acme-radio-border-checked group-data-focus-visible:outline-solid group-data-focus-visible:outline-(length:--acme-focus-width) group-data-focus-visible:outline-offset-(--acme-focus-offset) group-data-focus-visible:outline-acme-border-focus",
    dot: "bg-acme-radio-dot",
    text: "text-acme-text-primary",
  },
  disabled: {
    circle: "bg-acme-radio-disabled-background",
    dot: "bg-acme-radio-disabled-dot",
    text: "text-acme-text-disabled",
  },
} as const;

/**
 * One choice among a few, applied later with the form it belongs to. For a choice that takes
 * effect at once among two to four options, a SegmentedControl is the usual pick.
 *
 * The chosen option has a dot and a thicker ring, so the choice does not depend on color. The
 * options are native radio buttons, hidden and drawn beside, in a group named by the legend:
 * the arrow keys move between them, and the error is tied to the group and announced.
 */
export function RadioGroup<Value extends string = string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error,
  name,
}: RadioGroupProps<Value>) {
  const id = useId();
  const look = CIRCLE[disabled ? "disabled" : "enabled"];
  return (
    <HeroRadioGroup
      // React Aria treats an undefined value as uncontrolled and would keep a choice of its own.
      value={value ?? null}
      onChange={(next) => onChange(next as Value)}
      isDisabled={disabled}
      isInvalid={error !== undefined}
      className="flex flex-col"
      {...(name ? { name } : {})}
    >
      {/* HeroUI fades a disabled label; it is recolored instead, like the options. */}
      <Label className={`mb-1 ${disabled ? "text-acme-text-disabled opacity-100" : ""}`}>
        {label}
      </Label>
      <div className="flex flex-col gap-2">
        {options.map((option, index) => (
          <Radio
            key={option.value}
            value={option.value}
            // The description is inside the pressable row, so the row's text would name the
            // radio together with it. The label alone names it; the description describes it.
            aria-labelledby={`${id}-${index}`}
            // HeroUI spaces its radios apart and fades a disabled one; the column spaces them
            // here, and a disabled option is recolored.
            className="mt-0 opacity-100"
          >
            <Radio.Content className="group flex min-h-acme-target-min w-fit cursor-pointer items-center data-disabled:cursor-not-allowed">
              <span className="flex items-start gap-2 text-acme-body">
                <span className={CIRCLE_LINE}>
                  <span
                    className={`flex size-acme-radio items-center justify-center rounded-full ${look.circle}`}
                  >
                    <span
                      // Half of the whole circle, ring included, not of the space inside it.
                      className={`hidden size-[calc(var(--acme-size-radio)/2)] rounded-full group-data-selected:block ${look.dot}`}
                    />
                  </span>
                </span>
                <span className="flex min-w-0 flex-col">
                  <span id={`${id}-${index}`} className={look.text}>
                    {option.label}
                  </span>
                  {option.description && (
                    <Description
                      className={`opacity-100 ${disabled ? "text-acme-text-disabled" : ""}`}
                    >
                      {option.description}
                    </Description>
                  )}
                </span>
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </div>
      {/* The region is there before the error is, so that the error is announced when it
          appears. Empty, it takes no room. */}
      <div aria-live="polite">
        <FieldError className="mt-1">{error}</FieldError>
      </div>
    </HeroRadioGroup>
  );
}
