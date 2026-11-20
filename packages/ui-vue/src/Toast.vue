<script setup lang="ts">
// A short message about what just happened, which leaves on its own. It sits at the bottom
// center of the window, above everything else, and is announced politely without taking
// focus. The time does not run while the pointer is over it or focus is inside it.
//
// Do not put the only way to do something in a toast: it is gone in a few seconds.
import { motion } from "@acme/tokens";
import { rootPart, TOAST_PARTS, type ToastBaseProps } from "@acme/ui-core";
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watchEffect } from "vue";

export type ToastProps = ToastBaseProps;

// The app's class and style go on the toast itself, not on the region across the bottom of the
// window that it rises in.
defineOptions({ inheritAttrs: false });
const { open, message, action, duration = motion.duration.toast } = defineProps<ToastProps>();
const emit = defineEmits<{
  /** When the time is up and after the action. Set `open` to false in it. */
  close: [];
}>();

const region = useTemplateRef<HTMLDivElement>("region");
// Vue's types for the DOM do not list `popover` yet.
const popover: Record<string, string> = { popover: "manual" };
// The toast the pointer is over and the one focus is in. A toast that closed under the pointer
// gets no event to say that the pointer left, so only one still in the page counts.
const hovered = ref<Element>();
const focused = ref<Element>();
const inPage = (toast: Element | undefined) => toast?.isConnected === true;

// The region is in the top layer for as long as the component is mounted, empty or not: a
// screen reader only announces what is added to a region it already knows.
onMounted(() => region.value?.showPopover?.());
onBeforeUnmount(() => region.value?.hidePopover?.());

watchEffect((onCleanup) => {
  if (!open || inPage(hovered.value) || inPage(focused.value) || duration <= 0) return;
  const timer = setTimeout(() => emit("close"), duration);
  onCleanup(() => clearTimeout(timer));
});

function press(run: () => void) {
  run();
  emit("close");
}
</script>

<template>
  <div ref="region" v-bind="popover" role="status" :class="TOAST_PARTS.region">
    <!-- Hover and focus only pause the timer; the action inside is a real button. -->
    <div
      v-if="open"
      :class="[rootPart('Toast'), TOAST_PARTS.toast, $attrs.class]"
      :style="$attrs.style"
      @pointerenter="hovered = $event.currentTarget as Element"
      @pointerleave="hovered = undefined"
      @focusin="focused = $event.currentTarget as Element"
      @focusout="focused = undefined"
    >
      <span :class="TOAST_PARTS.message">{{ message }}</span>
      <button
        v-if="action"
        type="button"
        :class="TOAST_PARTS.action"
        @click="press(action.onPress)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>
