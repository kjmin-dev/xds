<script setup lang="ts">
// A message about the whole view or a section of it. Each tone has its own icon shape, so the
// tone does not depend on color. Problems (`warning`, `danger`) interrupt a screen reader;
// `info` and `success` wait their turn.
import {
  BANNER_PARTS,
  type BannerBaseProps,
  bannerClass,
  bannerIconClass,
  bannerIconPath,
  bannerRole,
  classes,
  rootPart,
} from "@acme/ui-core";
import Button from "./Button.vue";
import { useDefaults } from "./defaults.ts";
import IconButton from "./IconButton.vue";

export type { BannerTone } from "@acme/ui-core";

export type BannerProps = BannerBaseProps & {
  /** What the person can do about the message. Drawn under it as a small secondary button. */
  action?: { label: string; onPress: () => void };
  /**
   * Shows a close control. The banner does not hide itself: the handler decides what happens
   * to it. A prop rather than an event, since whether there is one decides what is drawn.
   */
  onDismiss?: () => void;
};

const { tone, title, dismissLabel = "Dismiss", action, onDismiss } = defineProps<BannerProps>();
defineSlots<{ default(): unknown }>();
const options = useDefaults("Banner", () => ({ tone }));
</script>

<template>
  <div
    :role="bannerRole(options.tone)"
    :class="classes(rootPart('Banner'), bannerClass(options.tone))"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" :class="bannerIconClass(options.tone)">
      <path fill="currentColor" :d="bannerIconPath(options.tone)" />
    </svg>
    <div :class="BANNER_PARTS.body">
      <p v-if="title" :class="BANNER_PARTS.title">{{ title }}</p>
      <div><slot /></div>
      <div v-if="action" :class="BANNER_PARTS.action">
        <Button variant="secondary" size="sm" @press="action.onPress()">{{ action.label }}</Button>
      </div>
    </div>
    <div v-if="onDismiss" :class="BANNER_PARTS.dismiss">
      <IconButton icon="x" :label="dismissLabel" variant="ghost" size="sm" @press="onDismiss()" />
    </div>
  </div>
</template>
