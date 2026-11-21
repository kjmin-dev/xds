<script setup lang="ts">
// A list of actions that opens from a control. Choosing an item calls its `onSelect` and
// closes the menu; a press outside or Escape closes it too, and focus goes back to the
// trigger.
//
// The trigger reports that it opens a menu and whether the menu is open. The arrow keys move
// the highlight and Enter chooses.
import { space } from "@acme/tokens";
import {
  firstMenuValue,
  keepListKeys,
  layoutRect,
  leaveEscapeToFields,
  type MenuBaseProps,
  menuItemClass,
  opensOnPress,
} from "@acme/ui-core";
import * as menu from "@zag-js/menu";
import { mergeProps, normalizeProps, useMachine } from "@zag-js/vue";
import { computed, useId, useTemplateRef } from "vue";
import Icon from "./Icon.vue";
import { useModalPopover } from "./modal-popover.ts";
import { usePresence } from "./presence.ts";
import { type TriggerProps, TriggerScope } from "./trigger.ts";

export type { MenuItem } from "@acme/ui-core";

export type MenuProps = MenuBaseProps;

// The app's class and style go on the menu itself: the root is the trigger and a Teleport, with
// no element of the menu's own.
defineOptions({ inheritAttrs: false });
const { label, items, align = "start" } = defineProps<MenuProps>();
defineSlots<{
  /** The control that opens the menu: a Button or an IconButton. */
  trigger(): unknown;
}>();

const id = useId();
const service = useMachine(
  menu.machine,
  computed((): menu.Props => ({
    id,
    "aria-label": label,
    positioning: {
      placement: `bottom-${align}`,
      gutter: space[1],
      getAnchorRect: (anchor) => (anchor instanceof HTMLElement ? layoutRect(anchor) : null),
    },
    onSelect: (details) => {
      // The values are positions, because two items may have the same label.
      const item = items[Number(details.value)];
      if (item && item !== "separator") item.onSelect();
    },
    onEscapeKeyDown: leaveEscapeToFields,
    // The arrow keys go round from the last item to the first, as in a native menu.
    loopFocus: true,
  })),
);
const api = computed(() => menu.connect(service, normalizeProps));

// Whether the last press on the trigger opened the menu, which its click must then not do.
let pressOpened = false;
const trigger = computed(() => {
  // Zag's handler for a press is left out: it keeps the press from focusing the trigger, so
  // the focus would reach the menu, and come back to the trigger as the menu closes, only
  // from a script, which the browser marks with the keyboard ring.
  const { onPointerdown: _onPointerdown, ...rest } = api.value.getTriggerProps() as TriggerProps;
  return mergeProps(rest, {
    // Added to the control's own class; the trigger looks pressed while its menu is open.
    class: "acme-menu__trigger",
    // A mouse opens the menu as its button goes down; touch and pen open it on the click, as
    // Zag does.
    onPointerdown: (event: PointerEvent) => {
      pressOpened = opensOnPress(event) && !api.value.open;
      if (pressOpened) api.value.setOpen(true);
    },
    onClick: (event: MouseEvent) => {
      // A click with no pointer behind it comes from a screen reader or a script.
      const pointer = event.detail !== 0;
      // The press opened the menu already. This handler runs before Zag's, which skips a
      // handled click. Not told by the click's pointer type: a browser may send the click as a
      // plain mouse event.
      if (pressOpened && pointer) {
        pressOpened = false;
        event.preventDefault();
        return;
      }
      if (pointer) return;
      // After the machine has opened the menu.
      requestAnimationFrame(() => {
        if (!api.value.open) return;
        const first = firstMenuValue(items);
        if (first !== undefined) api.value.setHighlightedValue(first);
      });
    },
  }) as TriggerProps;
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
const content = computed(() =>
  mergeProps(api.value.getContentProps(), {
    // This handler runs before Zag's.
    onKeydown: (event: KeyboardEvent) =>
      keepListKeys(event, surface.value, ".acme-menu__item:not([data-disabled])", (value) =>
        api.value.setHighlightedValue(value),
      ),
  }),
);
</script>

<template>
  <TriggerScope :trigger="trigger"><slot name="trigger" /></TriggerScope>
  <Teleport to="body">
    <!-- Nothing inside opens an overlay from a control outside it. -->
    <TriggerScope :trigger="null">
      <!-- Takes a press outside, which then only closes the menu. The focus stays in the menu
           until the menu hands it back to the trigger. -->
      <div v-if="api.open" class="acme-menu__underlay" @mousedown.prevent />
      <div ref="positioner" v-bind="api.getPositionerProps()" class="acme-menu__positioner">
        <!-- Shown until its exit animation ends; Zag would hide it as it closes. -->
        <div
          v-bind="content"
          ref="surface"
          :hidden="!present"
          class="acme-menu"
          :class="$attrs.class"
          :style="$attrs.style"
        >
          <template v-for="(item, index) in items" :key="index">
            <div
              v-if="item === 'separator'"
              v-bind="api.getSeparatorProps()"
              class="acme-menu__separator"
            />
            <div
              v-else
              v-bind="api.getItemProps({ value: String(index), disabled: item.disabled })"
              :class="menuItemClass(item.danger)"
            >
              <Icon v-if="item.icon" :name="item.icon" size="sm" class="acme-menu__item-icon" />
              <span class="flex-1">{{ item.label }}</span>
              <!-- Named, so a screen reader hears the state that the check shows. -->
              <Icon v-if="item.selected" name="check" size="sm" label="Selected" />
            </div>
          </template>
        </div>
      </div>
    </TriggerScope>
  </Teleport>
</template>
