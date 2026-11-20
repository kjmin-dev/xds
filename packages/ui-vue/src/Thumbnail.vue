<script setup lang="ts">
// A picture in a fixed shape, for a video, an article or a product. It fills the width it is
// given and takes its height from `ratio`, and crops the picture to fill it.
import {
  classes,
  pictureClass,
  rootPart,
  THUMBNAIL_PARTS,
  type ThumbnailBaseProps,
  thumbnailBadgeClass,
  thumbnailClass,
  thumbnailWatched,
} from "@acme/ui-core";
import { computed } from "vue";
import Badge from "./Badge.vue";
import { useDefaults } from "./defaults.ts";
import Icon from "./Icon.vue";
import { usePicture } from "./picture.ts";

export type { ThumbnailRatio } from "@acme/ui-core";

export type ThumbnailProps = ThumbnailBaseProps;

const { src, alt, ratio, badge, progress } = defineProps<ThumbnailProps>();
const options = useDefaults("Thumbnail", () => ({ ratio }));
const picture = usePicture(() => src);
const watched = computed(() => thumbnailWatched(progress));
</script>

<template>
  <span :class="classes(rootPart('Thumbnail'), thumbnailClass(options.ratio))">
    <!-- The placeholder is the picture's stand-in for assistive technology too, so the
         description is on the box that always shows, not on the picture that may not. -->
    <span
      :class="THUMBNAIL_PARTS.placeholder"
      :role="alt ? 'img' : undefined"
      :aria-label="alt || undefined"
      :aria-hidden="alt ? undefined : 'true'"
    >
      <Icon v-if="picture.loaded.value !== true" name="image" size="lg" />
      <img
        v-if="picture.loaded.value !== false && src"
        :src="src"
        alt=""
        aria-hidden="true"
        :class="pictureClass(picture.loaded.value === true)"
        @load="picture.onLoad(src)"
        @error="picture.onError(src)"
      />
    </span>
    <span v-if="badge" :class="thumbnailBadgeClass(watched)">
      <Badge tone="overlay">{{ badge }}</Badge>
    </span>
    <!-- Decoration: what was watched is for the eye, and a list that needs it said says it in
         words. -->
    <span v-if="watched > 0" aria-hidden="true" :class="THUMBNAIL_PARTS.track">
      <span :class="THUMBNAIL_PARTS.fill" :style="{ width: `${watched * 100}%` }" />
    </span>
  </span>
</template>
