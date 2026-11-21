<script setup lang="ts" generic="Value extends string = string">
// The top-level places of an app used with a pointer: the counterpart of TabBar on touch. Each
// row is a compact list row; the current one is selected, its title heavier and its icon
// filled, so the place does not depend on the tint alone.
//
// It is navigation named by `label`, and the current row says it is the current page.
// Collapsed, the rows keep their names, and show them in a Tooltip under a pointer and on
// keyboard focus.
import {
  classes,
  rootPart,
  SIDEBAR_PARTS,
  type SidebarBaseProps,
  sidebarClass,
  sidebarCount,
  sidebarIconClass,
  sidebarSectionClass,
  sidebarTitleClass,
  tooltipEndSide,
} from "@acme/ui-core";
import { useId } from "vue";
import Icon from "./Icon.vue";
import PlaceRow from "./PlaceRow.vue";
import SidebarRailButton from "./SidebarRailButton.vue";
import TooltipOverlay from "./TooltipOverlay.vue";

export type { SidebarItem, SidebarSection } from "@acme/ui-core";

export type SidebarProps<Value extends string = string> = Omit<SidebarBaseProps<Value>, "value">;

const value = defineModel<Value>("value", { required: true });
const { sections, label, collapsed = false } = defineProps<SidebarProps<Value>>();
const slots = defineSlots<{
  /** At the top, such as the app's name. It has to fit the rail itself while collapsed. */
  header?(): unknown;
  /** At the bottom, such as an account row. It has to fit the rail itself while collapsed. */
  footer?(): unknown;
}>();

const id = useId();
// A section has nothing but its position to tell it apart: titles are optional.
const titleId = (index: number) => `${id}-${index}`;
</script>

<template>
  <nav :aria-label="label" :class="classes(rootPart('Sidebar'), sidebarClass(collapsed))">
    <div v-if="slots.header" :class="SIDEBAR_PARTS.edge"><slot name="header" /></div>
    <!-- The places scroll when there are more than fit; the header and footer stay. -->
    <div :class="SIDEBAR_PARTS.places">
      <div
        v-for="(section, index) in sections"
        :key="index"
        :class="sidebarSectionClass(index, collapsed)"
      >
        <p v-if="section.title" :id="titleId(index)" :class="sidebarTitleClass(collapsed)">
          {{ section.title }}
        </p>
        <div v-if="collapsed && index > 0" aria-hidden="true" :class="SIDEBAR_PARTS.rule" />
        <ul
          :aria-labelledby="section.title ? titleId(index) : undefined"
          :class="SIDEBAR_PARTS.list"
        >
          <li v-for="item in section.items" :key="item.value" :class="SIDEBAR_PARTS.item">
            <TooltipOverlay v-if="collapsed" :label="item.label" :placement="tooltipEndSide()">
              <SidebarRailButton
                :label="item.label"
                :icon="item.icon"
                :selected="item.value === value"
                @press="value = item.value"
              />
            </TooltipOverlay>
            <PlaceRow
              v-else
              compact
              current="page"
              :selected="item.value === value"
              :title="item.label"
              @press="value = item.value"
            >
              <template #leading>
                <Icon
                  :name="item.icon"
                  size="md"
                  :filled="item.value === value"
                  :class="sidebarIconClass(item.value === value)"
                />
              </template>
              <template v-if="sidebarCount(item.count)" #trailing>
                <span :class="SIDEBAR_PARTS.count">{{ sidebarCount(item.count) }}</span>
              </template>
            </PlaceRow>
          </li>
        </ul>
      </div>
    </div>
    <div v-if="slots.footer" :class="SIDEBAR_PARTS.edge"><slot name="footer" /></div>
  </nav>
</template>
