<script setup lang="ts">
// The title row of a group of content. The title is a heading at `level`; the action is a quiet
// button with a chevron at its end edge, which points the other way in a right-to-left layout.
import {
  classes,
  rootPart,
  SECTION_HEADER_PARTS,
  type SectionHeaderBaseProps,
} from "@acme/ui-core";
import Button from "./Button.vue";
import Icon from "./Icon.vue";

export type SectionHeaderProps = SectionHeaderBaseProps & {
  /** A link-like action at the end, such as "See all". */
  action?: { label: string; onPress: () => void };
};

const { title, description, icon, level = 2, action } = defineProps<SectionHeaderProps>();
</script>

<template>
  <div :class="classes(rootPart('SectionHeader'), SECTION_HEADER_PARTS.root)">
    <div :class="SECTION_HEADER_PARTS.lead">
      <span v-if="icon" :class="SECTION_HEADER_PARTS.icon"><Icon :name="icon" size="md" /></span>
      <div :class="SECTION_HEADER_PARTS.text">
        <component :is="`h${level}`" :class="SECTION_HEADER_PARTS.title">{{ title }}</component>
        <p v-if="description" :class="SECTION_HEADER_PARTS.description">{{ description }}</p>
      </div>
    </div>
    <span v-if="action" :class="SECTION_HEADER_PARTS.action">
      <Button variant="ghost" size="sm" @press="action.onPress()">
        {{ action.label
        }}<Icon name="chevron-right" size="sm" :class="SECTION_HEADER_PARTS.chevron" />
      </Button>
    </span>
  </div>
</template>
