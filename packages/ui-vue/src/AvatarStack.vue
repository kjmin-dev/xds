<script setup lang="ts">
// Several people in the room of one. Assistive technology gets one image named after
// everyone in it, including those who did not fit.
import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
  classes,
  rootPart,
} from "@acme/ui-core";
import { computed } from "vue";
import Avatar from "./Avatar.vue";
import { useDefaults } from "./defaults.ts";

export type AvatarStackProps = AvatarStackBaseProps;

const { people, max, size, label } = defineProps<AvatarStackProps>();
const stack = computed(() => avatarStack(people, max, label));
// A size, always: the avatars are drawn at the stack's, not at an Avatar default around it.
const options = useDefaults("AvatarStack", () => ({ size }), { size: "md" });
</script>

<template>
  <span
    role="img"
    :aria-label="stack.name"
    :class="classes(rootPart('AvatarStack'), avatarStackClass)"
  >
    <span
      v-for="(person, index) in stack.shown"
      :key="index"
      aria-hidden="true"
      :class="avatarStackItemClass(options.size)"
    >
      <Avatar :name="person.name" :src="person.src" :size="options.size" />
    </span>
    <span v-if="stack.rest > 0" aria-hidden="true" :class="avatarStackRestClass(options.size)"
      >+{{ stack.rest }}</span
    >
  </span>
</template>
