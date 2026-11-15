<script setup lang="ts">
// A surface that groups related content. A hairline outline and a trace of shadow lift it off
// the page; in dark mode, where shadows barely show, the lighter fill does that. `title`
// renders as a heading; `actions` sit across from it.
import { CARD_PARTS, type CardBaseProps, cardClass, cardMediaClass } from "@acme/ui-core";
import { computed } from "vue";
import { Wrap } from "./wrap.ts";

export type CardProps = CardBaseProps & {
  /**
   * Makes the whole card one button. Put no other control inside it then. A prop rather than
   * an event, since whether there is one decides what is drawn.
   */
  onPress?: () => void;
};

const {
  title,
  description,
  flush = false,
  // Undefined unless given, so that only a toggle says whether it is pressed.
  selected = undefined,
  onPress,
} = defineProps<CardProps>();
const slots = defineSlots<{
  /** Sit across from the title. A pressable card takes none: it is one button already. */
  actions?(): unknown;
  /** A picture or a drawing at the top, running edge to edge above the padding. */
  media?(): unknown;
  default?(): unknown;
}>();

const pressable = computed(() => onPress !== undefined);
// A button may hold only phrasing content, so inside one the parts are spans. Its heading
// would not be reachable as a heading anyway: a button reads as its text.
const tags = computed(() =>
  pressable.value
    ? { header: "span", box: "span", title: "span", line: "span" }
    : { header: "header", box: "div", title: "h2", line: "p" },
);
const surface = computed(() =>
  pressable.value
    ? {
        type: "button",
        "aria-pressed": selected === undefined ? undefined : selected ? "true" : "false",
        onClick: () => onPress?.(),
      }
    : { "aria-current": selected ? "true" : undefined },
);
</script>

<template>
  <component
    :is="pressable ? 'button' : 'section'"
    v-bind="surface"
    :class="cardClass({ selected, flush, pressable })"
  >
    <Wrap :when="flush" :tag="tags.box" :wrapper="CARD_PARTS.flush">
      <component :is="tags.box" v-if="slots.media" :class="cardMediaClass(flush)">
        <slot name="media" />
      </component>
      <component
        :is="tags.header"
        v-if="title || (slots.actions && !pressable)"
        :class="CARD_PARTS.header"
      >
        <component :is="tags.box" :class="CARD_PARTS.heading">
          <component :is="tags.title" v-if="title" :class="CARD_PARTS.title">{{ title }}</component>
          <component :is="tags.line" v-if="description" :class="CARD_PARTS.description">
            {{ description }}
          </component>
        </component>
        <div v-if="slots.actions && !pressable" :class="CARD_PARTS.actions">
          <slot name="actions" />
        </div>
      </component>
      <slot />
    </Wrap>
  </component>
</template>
