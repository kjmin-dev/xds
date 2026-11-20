<!--
  @component
  Stands for a person or a team by a picture, or by their initials when there is none. Assistive
  technology gets the full name either way. The small size has room for one letter.
-->
<script module lang="ts">
  import type { AvatarBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type { AvatarSize } from "@acme/ui-core";

  export type AvatarProps = AvatarBaseProps & RootProps;
</script>

<script lang="ts">
  import { avatarClass, avatarInitials, classes, pictureClass, rootPart } from "@acme/ui-core";
  import { useDefaults } from "./defaults.svelte.ts";
  import { createPicture } from "./picture.svelte.ts";

  let { name, src, size: ownSize, class: className, style }: AvatarProps = $props();

  const defaults = useDefaults("Avatar");
  const size = $derived(ownSize ?? defaults().size);

  const picture = createPicture(() => src);
</script>

<span
  role="img"
  aria-label={name}
  class={classes(rootPart("Avatar"), avatarClass(size), className)}
  {style}
  >{avatarInitials(name, size)}{#if picture.loaded() !== false && src}
    {@const address = src}
    <!-- The name is on the avatar itself; a second one on the picture would be read twice. -->
    <img
      src={address}
      alt=""
      aria-hidden="true"
      class={pictureClass(picture.loaded() === true)}
      onload={() => picture.onLoad(address)}
      onerror={() => picture.onError(address)}
    />
  {/if}</span
>
