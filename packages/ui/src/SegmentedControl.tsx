import {
  type SegmentedControlBaseProps,
  segmentedControlClass,
  segmentedControlOptionClass,
  segmentedControlSegmentClass,
} from "@acme/ui-core";
import { useId } from "react";

export type SegmentedControlProps<Value extends string> = SegmentedControlBaseProps<Value> & {
  onChange: (value: Value) => void;
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
    <div {...aria} role="radiogroup" className={segmentedControlClass(fullWidth)}>
      {options.map((option) => (
        <label key={option.value} className={segmentedControlOptionClass(fullWidth)}>
          <input
            type="radio"
            name={name}
            value={option.value}
            className="peer sr-only"
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className={segmentedControlSegmentClass}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
