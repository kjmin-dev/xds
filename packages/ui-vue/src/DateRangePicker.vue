<script setup lang="ts">
// A field for choosing a range of days, a start and an end, as for a stay. Closed, it looks like
// a DatePicker and shows both days in the locale's medium form ("Mar 10 – 14, 2026"), or the
// placeholder. Pressed, it opens a calendar under itself, two months side by side where the
// window has room and one where it does not, on the start's month, or on today's while nothing
// is chosen.
//
// The first day pressed starts the range, and the band previews it to the day under the pointer
// or the keyboard's focus. The second ends it, if the days between are at least `minLength` and
// at most `maxLength`, which leave the other days unavailable meanwhile: the range becomes the
// value and the calendar closes. A day before the start starts again from there. Escape or a
// press outside closes the calendar without a change.
//
// The keys are DatePicker's, and Page Up and Page Down move a month whether one or two are
// shown. Each month is a grid named by its month; every day of the range is selected, and the
// two ends are named by `startLabel` and `endLabel` before the day.
import {
  DATE_PICKER_NAV_CLASS,
  type DateRange,
  type DateRangePickerBaseProps,
  dateRangeMachineProps,
  datePickerContentAttrs,
  datePickerIds,
  datePickerLocale,
  datePickerTriggerAttrs,
  endRangeChoiceOnClose,
  focusOpeningDay,
  formatRange,
  keepCalendarFocus,
  keepDayFocused,
  keepRangePreview,
  type RangeDraft,
  type RangeMonth,
  rangeDayClick,
  rangeGridKeyDown,
  rangeMonths,
  rangeMonthViews,
  rangeSummary,
  shownRange,
} from "@acme/ui-core";
import * as datePicker from "@zag-js/date-picker";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, ref, shallowRef, useId, useTemplateRef, watch } from "vue";
import Icon from "./Icon.vue";
import { useModalPopover } from "./modal-popover.ts";
import { usePresence } from "./presence.ts";

export type { DateRange } from "@acme/ui-core";

export type DateRangePickerProps = DateRangePickerBaseProps;

type Handler<E> = (event: E) => void;
type DateValue = RangeMonth["visibleRange"]["start"];

// Not destructured: the helpers of @acme/ui-core take the props whole. `v-model:value`, written
// out rather than with defineModel, as DatePicker's is: the value may be left out, but a choice
// is never undefined.
const props = defineProps<DateRangePickerProps>();
const emit = defineEmits<{ "update:value": [value: DateRange] }>();

const id = useId();
const ids = datePickerIds(id);
const locale = datePickerLocale();
// A start alone while the end is chosen; null while the calendar shows the chosen range.
const draft = shallowRef<RangeDraft | null>(null);
const months = ref(1);
const shown = computed(() => shownRange(props.value, draft.value));
const service = useMachine(
  datePicker.machine,
  computed(() =>
    dateRangeMachineProps(props, shown.value, {
      id,
      locale,
      months: months.value,
      onDraft: (next) => (draft.value = next),
      onChange: (value) => emit("update:value", value),
    }),
  ),
);
const api = computed(() => datePicker.connect(service, normalizeProps));
const invalid = computed(() => props.error !== undefined);
const summary = computed(() => rangeSummary(shown.value, props, locale));
const views = computed(() => rangeMonthViews(api.value, months.value));
// Spread over Zag's, so that `aria-label: undefined` takes Zag's English name away, which
// mergeProps would keep.
const trigger = computed(() => {
  const zag = api.value.getTriggerProps();
  return {
    ...zag,
    ...datePickerTriggerAttrs(props, ids),
    onClick: (event: MouseEvent) => {
      if (!api.value.open) months.value = rangeMonths();
      focusOpeningDay(api.value, { ...props, value: props.value?.start });
      (zag.onClick as Handler<MouseEvent> | undefined)?.(event);
    },
  };
});
const table = (view: RangeMonth) => {
  const zag = api.value.getTableProps({ view: "day", id: view.table.id });
  return {
    ...zag,
    ...view.table,
    onKeydown: (event: KeyboardEvent) =>
      rangeGridKeyDown(
        event,
        api.value,
        shown.value,
        props,
        zag.onKeydown as Handler<KeyboardEvent> | undefined,
      ),
  };
};
const day = (view: RangeMonth, date: DateValue) => {
  const zag = api.value.getDayTableCellTriggerProps({
    value: date,
    visibleRange: view.visibleRange,
  });
  return {
    ...zag,
    onClick: (event: MouseEvent) =>
      rangeDayClick(
        event,
        api.value,
        shown.value,
        props,
        date,
        view.visibleRange,
        zag.onClick as Handler<MouseEvent> | undefined,
      ),
  };
};
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
watch(
  () => api.value.open,
  (open) => endRangeChoiceOnClose(service, open),
  { flush: "post" },
);
watch(
  () => api.value.focusedValue.toString(),
  () => keepRangePreview(service, shown.value, api.value.open),
  { flush: "post" },
);
</script>

<template>
  <div v-bind="api.getRootProps()" class="acme-date-picker acme-date-range-picker">
    <!-- A span: the field is a button, which a <label> cannot point at. -->
    <span :id="ids.label" class="acme-date-picker__label">{{ label }}</span>
    <!-- What Zag places the calendar against. -->
    <div v-bind="api.getControlProps()" class="acme-date-picker__control">
      <button v-bind="trigger" type="button" class="acme-date-picker__trigger">
        <span :id="ids.value" class="acme-date-picker__value">
          {{ value === undefined ? placeholder : formatRange(value, locale) }}
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
    <!-- What a form submits. Zag gives the names to its text inputs, which are not drawn. -->
    <input
      v-if="startName !== undefined"
      type="hidden"
      :name="startName"
      :value="value?.start ?? ''"
    />
    <input v-if="endName !== undefined" type="hidden" :name="endName" :value="value?.end ?? ''" />
    <Teleport to="body">
      <!-- Takes a press outside, which then only closes the calendar. The focus stays in the
           calendar until it hands it back to the field. -->
      <div v-if="api.open" class="acme-date-picker__underlay" @mousedown.prevent />
      <div ref="positioner" v-bind="api.getPositionerProps()" class="acme-date-picker__positioner">
        <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
        <div
          v-bind="content"
          ref="surface"
          :hidden="!present"
          class="acme-date-picker__content acme-date-range-picker__content"
        >
          <div class="acme-date-range-picker__summary" aria-live="polite">
            <span>{{ summary.start }}</span>
            <span>{{ summary.end }}</span>
          </div>
          <div class="acme-date-range-picker__months">
            <div v-for="view in views" :key="view.index" class="acme-date-range-picker__month">
              <div class="acme-date-picker__header">
                <button
                  v-if="view.index === 0"
                  v-bind="api.getPreviousTriggerProps()"
                  type="button"
                  :class="DATE_PICKER_NAV_CLASS"
                >
                  <Icon name="chevron-left" size="sm" />
                </button>
                <span v-else class="acme-date-range-picker__nav-space" />
                <span v-bind="api.getRangeTextProps()" class="acme-date-picker__heading">
                  {{ view.name }}
                </span>
                <button
                  v-if="view.index === months - 1"
                  v-bind="api.getNextTriggerProps()"
                  type="button"
                  :class="DATE_PICKER_NAV_CLASS"
                >
                  <Icon name="chevron-right" size="sm" />
                </button>
                <span v-else class="acme-date-range-picker__nav-space" />
              </div>
              <table v-bind="table(view)" class="acme-date-picker__grid">
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
                  <!-- Keyed by the day, as in DatePicker: a cell made anew would drop the focus
                       it holds when a move is held at `min` or `max`. -->
                  <tr
                    v-for="week in view.weeks"
                    :key="week[0]?.toString()"
                    v-bind="api.getTableRowProps({ view: 'day' })"
                  >
                    <td
                      v-for="date in week"
                      :key="date.toString()"
                      v-bind="
                        api.getDayTableCellProps({ value: date, visibleRange: view.visibleRange })
                      "
                      class="acme-date-picker__cell"
                    >
                      <div v-bind="day(view, date)" class="acme-date-picker__day">
                        {{ date.day }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
