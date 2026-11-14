import { useId } from "react";
import { PEER_FOCUS } from "./Switch.tsx";

export type SegmentedControlProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Says what is being chosen, for assistive technology. */
  "aria-label": string;
  /** Stretches to the width of its container. */
  fullWidth?: boolean;
};

/**
 * A choice between a few views or modes, all visible at once. The selected segment is outlined
 * as well as filled, so the choice does not depend on telling two greys apart.
 *
 * It is a group of native radio buttons, so the arrow keys move between segments.
 */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
  ...aria
}: SegmentedControlProps<Value>) {
  const name = useId();
  return (
    <div
      {...aria}
      role="radiogroup"
      className={`h-acme-control-md rounded-acme-md bg-acme-segmented-track p-0.5 ${fullWidth ? "flex w-full" : "inline-flex w-fit"}`}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`relative flex cursor-pointer ${fullWidth ? "flex-1" : ""}`}
        >
          <input
            type="radio"
            name={name}
            className="peer sr-only"
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {/* The border is there on every segment, transparent until selected, so selecting
              does not move the text. */}
          <span
            className={`flex w-full items-center justify-center whitespace-nowrap rounded-[calc(var(--acme-radius-md)-2px)] border border-transparent px-4 text-acme-label text-acme-segmented-text peer-checked:border-acme-segmented-selected-border peer-checked:bg-acme-segmented-selected-background peer-checked:text-acme-segmented-selected-text peer-checked:shadow-acme-subtle ${PEER_FOCUS}`}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
