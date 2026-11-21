<script setup lang="ts">
// Stands for a person or a team by a picture, or by their initials when there is none.
// Assistive technology gets the full name either way. The small size has room for one letter.
import {
  type AvatarBaseProps,
  avatarClass,
  avatarInitials,
  classes,
  pictureClass,
  rootPart,
} from "@acme/ui-core";
import { useDefaults } from "./defaults.ts";
import { usePicture } from "./picture.ts";

export type { AvatarSize } from "@acme/ui-core";

export type AvatarProps = AvatarBaseProps;

const { name, src, size } = defineProps<AvatarProps>();
const options = useDefaults("Avatar", () => ({ size }));
// The picture has no name of its own: the name is on the avatar itself, and a second one
// would be read twice.
const picture = usePicture(() => src);
</script>

<template>
  <span
    role="img"
    :aria-label="name"
    :class="classes(rootPart('Avatar'), avatarClass(options.size))"
  >
    {{ avatarInitials(name, options.size)
    }}<img
      v-if="picture.loaded.value !== false && src"
      :src="src"
      alt=""
      aria-hidden="true"
      :class="pictureClass(picture.loaded.value === true)"
      @load="picture.onLoad(src)"
      @error="picture.onError(src)"
    />
  </span>
</template>
