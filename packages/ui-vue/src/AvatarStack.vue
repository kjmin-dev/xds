<script setup lang="ts">
// Several people in the room of one. Assistive technology gets one image named after
// everyone in it, including those who did not fit.
import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
} from "@acme/ui-core";
import { computed } from "vue";
import Avatar from "./Avatar.vue";

export type AvatarStackProps = AvatarStackBaseProps;

const { people, max, size, label } = defineProps<AvatarStackProps>();
const stack = computed(() => avatarStack(people, max, label));
</script>

<template>
  <span role="img" :aria-label="stack.name" :class="avatarStackClass">
    <span
      v-for="(person, index) in stack.shown"
      :key="index"
      aria-hidden="true"
      :class="avatarStackItemClass(size)"
    >
      <Avatar :name="person.name" :src="person.src" :size="size" />
    </span>
    <span v-if="stack.rest > 0" aria-hidden="true" :class="avatarStackRestClass(size)"
      >+{{ stack.rest }}</span
    >
  </span>
</template>
