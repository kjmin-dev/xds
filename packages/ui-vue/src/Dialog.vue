<script setup lang="ts">
// A window that interrupts the screen for a confirmation or a short task. Everything behind it
// is dimmed and cannot be reached until it closes.
//
// It is a modal dialog named by its title and described by its description. Focus moves into
// it, stays inside it, and returns to where it was when it closes.
import { type DialogBaseProps, leaveEscapeToFields } from "@acme/ui-core";
import * as dialog from "@zag-js/dialog";
import { normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef } from "vue";
import { usePresence } from "./presence.ts";
import { TriggerScope } from "./trigger.ts";

export type DialogProps = DialogBaseProps;

// The app's class and style go on the dialog: the Teleport, its root, has no element of its own.
defineOptions({ inheritAttrs: false });
const { open, title, description, dismissible = true } = defineProps<DialogProps>();
const emit = defineEmits<{
  /** On Escape and on a press outside the dialog. Set `open` to false in it. */
  close: [];
}>();
const slots = defineSlots<{
  /** The body, between the description and the actions. It scrolls when it is too tall. */
  default?(): unknown;
  /** Buttons, in a row at the end edge. Put the main action last. */
  actions?(): unknown;
}>();

const id = useId();
const backdrop = useTemplateRef<HTMLDivElement>("backdrop");
const positioner = useTemplateRef<HTMLDivElement>("positioner");
const content = useTemplateRef<HTMLElement>("content");
const service = useMachine(
  dialog.machine,
  computed(() => ({
    id,
    open,
    onOpenChange: (details: dialog.OpenChangeDetails) => {
      if (!details.open) emit("close");
    },
    closeOnEscape: dismissible,
    closeOnInteractOutside: dismissible,
    onEscapeKeyDown: leaveEscapeToFields,
    // The dialog itself rather than its first field or button: a screen reader then reads the
    // title and the description first.
    initialFocusEl: () => content.value,
  })),
);
const api = computed(() => dialog.connect(service, normalizeProps));
const present = usePresence(
  () => api.value.open,
  () => [backdrop.value, positioner.value],
);
</script>

<template>
  <Teleport v-if="present" to="body">
    <!-- Nothing inside opens an overlay from a control outside it. -->
    <TriggerScope :trigger="null">
      <!-- A press on the scrim keeps the focus in the dialog: a dialog that cannot be dismissed
           stays open, and the focus would go to the page. The backdrop and the dialog stay
           shown until their exit animation ends; Zag would hide them as the dialog closes. -->
      <div
        v-bind="api.getBackdropProps()"
        ref="backdrop"
        :hidden="false"
        class="acme-dialog__backdrop"
        @mousedown.prevent
      />
      <div v-bind="api.getPositionerProps()" ref="positioner" class="acme-dialog__positioner">
        <section
          v-bind="api.getContentProps()"
          ref="content"
          :hidden="false"
          class="acme-dialog"
          :class="$attrs.class"
          :style="$attrs.style"
        >
          <h2 v-bind="api.getTitleProps()" class="acme-dialog__title">{{ title }}</h2>
          <p v-if="description" v-bind="api.getDescriptionProps()" class="acme-dialog__description">
            {{ description }}
          </p>
          <div v-if="slots.default" class="acme-dialog__body"><slot /></div>
          <div v-if="slots.actions" class="acme-dialog__actions"><slot name="actions" /></div>
        </section>
      </div>
    </TriggerScope>
  </Teleport>
</template>
