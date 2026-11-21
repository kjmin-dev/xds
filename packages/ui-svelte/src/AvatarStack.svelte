<!--
  @component
  Several people in the room of one. Assistive technology gets one image named after everyone in
  it, including those who did not fit.
-->
<script module lang="ts">
  import type { AvatarStackBaseProps } from "@acme/ui-core";
  import type { RootProps } from "./root.ts";

  export type AvatarStackProps = AvatarStackBaseProps & RootProps;
</script>

<script lang="ts">
  import {
    avatarStack,
    avatarStackClass,
    avatarStackItemClass,
    avatarStackRestClass,
    classes,
    rootPart,
  } from "@acme/ui-core";
  import Avatar from "./Avatar.svelte";
  import { useDefaults } from "./defaults.svelte.ts";

  let { people, max, size: ownSize, label, class: className, style }: AvatarStackProps = $props();

  const defaults = useDefaults("AvatarStack");
  // Resolved here, built-in default included, so that the avatars take the stack's size rather
  // than an Avatar default of their own.
  const size = $derived(ownSize ?? defaults().size ?? "md");

  const stack = $derived(avatarStack(people, max, label));
</script>

<span
  role="img"
  aria-label={stack.name}
  class={classes(rootPart("AvatarStack"), avatarStackClass, className)}
  {style}
>
  {#each stack.shown as person, index (index)}
    <span aria-hidden="true" class={avatarStackItemClass(size)}>
      <Avatar name={person.name} src={person.src} {size} />
    </span>
  {/each}
  {#if stack.rest > 0}
    <span aria-hidden="true" class={avatarStackRestClass(size)}>+{stack.rest}</span>
  {/if}
</span>
