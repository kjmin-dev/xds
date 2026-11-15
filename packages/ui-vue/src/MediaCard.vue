<script setup lang="ts">
// A thumbnail with its title and details: a video in a feed, an article in a list.
//
// With `onPress` the whole card is one button with no surface at rest: under a pointer and
// while pressed it takes the card's fills, and it has a focus ring. The button is named by the
// title followed by the details. `action` is a separate control beside it, so pressing it does
// not press the card.
import {
  MEDIA_CARD_PARTS,
  type MediaCardBaseProps,
  mediaCardContentClass,
  mediaCardIds,
  mediaCardThumbnailClass,
} from "@acme/ui-core";
import { computed, useId } from "vue";
import Thumbnail from "./Thumbnail.vue";

export type MediaCardProps = MediaCardBaseProps & {
  /**
   * Makes the whole card one button. A prop rather than an event, since whether there is one
   * decides what is drawn.
   */
  onPress?: () => void;
};

const {
  title,
  meta,
  layout = "vertical",
  src,
  alt = "",
  ratio,
  badge,
  progress,
  onPress,
} = defineProps<MediaCardProps>();
const slots = defineSlots<{
  /** Before the text in the vertical layout, such as an Avatar. */
  leading?(): unknown;
  /** At the end of the text: an IconButton or a Menu. It stays a control of its own. */
  action?(): unknown;
}>();

const id = useId();
const ids = computed(() => mediaCardIds(id, meta));
const horizontal = computed(() => layout === "horizontal");
const pressable = computed(() => onPress !== undefined);
// On a pressable card the button says all of this, so the parts are hidden from assistive
// technology and only the action is left beside it.
const hidden = computed(() => (pressable.value ? "true" : undefined));
// A group, not a fieldset, when it is not pressable: a fieldset groups form controls, and sizes
// itself to its content, which would undo the ellipses.
const root = computed(() =>
  pressable.value
    ? { class: MEDIA_CARD_PARTS.pressable }
    : { role: "group", "aria-labelledby": ids.value.names, class: MEDIA_CARD_PARTS.group },
);
</script>

<template>
  <div v-bind="root">
    <button
      v-if="pressable"
      type="button"
      :aria-labelledby="ids.names"
      :class="MEDIA_CARD_PARTS.button"
      @click="onPress?.()"
    />
    <div :class="mediaCardContentClass({ horizontal, pressable })">
      <span :aria-hidden="hidden" :class="mediaCardThumbnailClass(horizontal)">
        <Thumbnail :src="src" :alt="alt" :ratio="ratio" :badge="badge" :progress="progress" />
      </span>
      <div :class="MEDIA_CARD_PARTS.body">
        <span
          v-if="!horizontal && slots.leading"
          :aria-hidden="hidden"
          :class="MEDIA_CARD_PARTS.leading"
        >
          <slot name="leading" />
        </span>
        <span :aria-hidden="hidden" :class="MEDIA_CARD_PARTS.text">
          <span :id="ids.title" :class="MEDIA_CARD_PARTS.title">{{ title }}</span>
          <!-- Two details may read the same, so they are told apart by their position. -->
          <span
            v-for="(line, index) in meta"
            :id="ids.details[index]"
            :key="index"
            :class="MEDIA_CARD_PARTS.meta"
          >
            {{ line }}
          </span>
        </span>
        <div v-if="slots.action" :class="MEDIA_CARD_PARTS.action"><slot name="action" /></div>
      </div>
    </div>
  </div>
</template>
