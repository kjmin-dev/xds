<script setup lang="ts">
// A field for choosing one day. Closed, it looks like a Select: the chosen day in the locale's
// medium form, or the placeholder. Pressed, it opens a calendar of one month under itself, on
// the chosen day, or on today while none is. A press on a day, or Enter on the focused one,
// sets the value as `YYYY-MM-DD` and closes the calendar; Escape or a press outside closes it
// without a choice.
//
// The field is a button that says it opens a dialog and whether it is open. In the calendar the
// arrow keys move a day or a week, Page Up and Page Down a month (a year with Shift), and Home
// and End to the first and the last day of the month, never past `min` or `max`. Tab goes round
// the month buttons and the focused day. The chosen day is selected for assistive technology,
// and today is the current date.
import {
  DATE_PICKER_NAV_CLASS,
  type DatePickerBaseProps,
  datePickerContentAttrs,
  datePickerIds,
  datePickerLocale,
  datePickerMachineProps,
  datePickerTriggerAttrs,
  focusOpeningDay,
  formatDay,
  type IsoDate,
  keepCalendarFocus,
  keepDayFocused,
} from "@acme/ui-core";
import * as datePicker from "@zag-js/date-picker";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef, watch } from "vue";
import Icon from "./Icon.vue";
import { useModalPopover } from "./modal-popover.ts";
import { usePresence } from "./presence.ts";

export type { IsoDate } from "@acme/ui-core";

export type DatePickerProps = DatePickerBaseProps;

type ClickHandler = (event: MouseEvent) => void;

// Not destructured: the helpers of @acme/ui-core take the props whole. `v-model:value`, written
// out rather than with defineModel, as Select's is: the value may be left out, but a choice is
// never undefined.
const props = defineProps<DatePickerProps>();
const emit = defineEmits<{ "update:value": [value: IsoDate] }>();

const id = useId();
const ids = datePickerIds(id);
const locale = datePickerLocale();
const service = useMachine(
  datePicker.machine,
  computed(() =>
    datePickerMachineProps(props, {
      id,
      locale,
      onChange: (value) => emit("update:value", value),
    }),
  ),
);
const api = computed(() => datePicker.connect(service, normalizeProps));
const invalid = computed(() => props.error !== undefined);
// Spread over Zag's, so that `aria-label: undefined` takes Zag's English name away, which
// mergeProps would keep.
const trigger = computed(() => {
  const zag = api.value.getTriggerProps();
  return {
    ...zag,
    ...datePickerTriggerAttrs(props, ids),
    onClick: (event: MouseEvent) => {
      focusOpeningDay(api.value, props);
      (zag.onClick as ClickHandler | undefined)?.(event);
    },
  };
});
const positioner = useTemplateRef<HTMLDivElement>("positioner");
const surface = useTemplateRef<HTMLDivElement>("surface");
useModalPopover(
  () => api.value.open,
  () => positioner.value,
);
const present = usePresence(
  () => api.value.open,
  () => [surface.value],
);
const content = computed(() => ({
  ...api.value.getContentProps(),
  ...datePickerContentAttrs(ids),
  onKeydown: (event: KeyboardEvent) => keepCalendarFocus(event, surface.value),
}));
// Once the calendar is drawn: a move held at `min` or `max` into another month shows that
// month only now.
watch(
  [
    () => api.value.open,
    () => api.value.focusedValue.toString(),
    () => api.value.visibleRange.start.toString(),
  ],
  () => keepDayFocused(api.value.open, surface.value),
  { flush: "post" },
);
</script>

<template>
  <div v-bind="api.getRootProps()" class="acme-date-picker">
    <!-- A span: the field is a button, which a <label> cannot point at. -->
    <span :id="ids.label" class="acme-date-picker__label">{{ label }}</span>
    <!-- What Zag places the calendar against. -->
    <div v-bind="api.getControlProps()" class="acme-date-picker__control">
      <button v-bind="trigger" type="button" class="acme-date-picker__trigger">
        <span :id="ids.value" class="acme-date-picker__value">
          {{ value === undefined ? placeholder : formatDay(value, locale) }}
        </span>
        <Icon name="calendar" size="sm" class="text-acme-field-placeholder" />
      </button>
    </div>
    <!-- One line under the box: the help, or the error in its place. -->
    <div v-if="invalid || description" class="acme-date-picker__footer">
      <span v-if="invalid" :id="ids.error" class="acme-date-picker__error">{{ error }}</span>
      <span v-else :id="ids.description" class="acme-date-picker__description">
        {{ description }}
      </span>
    </div>
    <!-- What a form submits. Zag gives the name to its text input, which is not drawn. -->
    <input v-if="name !== undefined" type="hidden" :name="name" :value="value ?? ''" />
    <Teleport to="body">
      <!-- Takes a press outside, which then only closes the calendar. The focus stays in the
           calendar until it hands it back to the field. -->
      <div v-if="api.open" class="acme-date-picker__underlay" @mousedown.prevent />
      <div ref="positioner" v-bind="api.getPositionerProps()" class="acme-date-picker__positioner">
        <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
        <div v-bind="content" ref="surface" :hidden="!present" class="acme-date-picker__content">
          <div class="acme-date-picker__header">
            <button
              v-bind="api.getPreviousTriggerProps()"
              type="button"
              :class="DATE_PICKER_NAV_CLASS"
            >
              <Icon name="chevron-left" size="sm" />
            </button>
            <span v-bind="api.getRangeTextProps()" class="acme-date-picker__heading">
              {{ api.visibleRangeText.start }}
            </span>
            <button v-bind="api.getNextTriggerProps()" type="button" :class="DATE_PICKER_NAV_CLASS">
              <Icon name="chevron-right" size="sm" />
            </button>
          </div>
          <table v-bind="api.getTableProps({ view: 'day' })" class="acme-date-picker__grid">
            <thead v-bind="api.getTableHeadProps({ view: 'day' })">
              <tr v-bind="api.getTableRowProps({ view: 'day' })">
                <th
                  v-for="weekDay in api.weekDays"
                  :key="weekDay.long"
                  scope="col"
                  class="acme-date-picker__weekday"
                >
                  {{ weekDay.narrow }}
                </th>
              </tr>
            </thead>
            <tbody v-bind="api.getTableBodyProps({ view: 'day' })">
              <!-- Keyed by the day, not by the object: Zag hands out new dates on every change,
                   and a cell made anew would drop the focus it holds when a move is held at
                   `min` or `max`. -->
              <tr
                v-for="week in api.weeks"
                :key="week[0]?.toString()"
                v-bind="api.getTableRowProps({ view: 'day' })"
              >
                <td
                  v-for="date in week"
                  :key="date.toString()"
                  v-bind="api.getDayTableCellProps({ value: date })"
                  class="acme-date-picker__cell"
                >
                  <div
                    v-bind="api.getDayTableCellTriggerProps({ value: date })"
                    class="acme-date-picker__day"
                  >
                    {{ date.day }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Teleport>
  </div>
</template>
