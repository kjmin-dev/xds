<!--
  @component
  Several people in the room of one. Assistive technology gets one image named after everyone in
  it, including those who did not fit.
-->
<script module lang="ts">
  import type { AvatarStackBaseProps } from "@acme/ui-core";

  export type AvatarStackProps = AvatarStackBaseProps;
</script>

<script lang="ts">
  import {
    avatarStack,
    avatarStackClass,
    avatarStackItemClass,
    avatarStackRestClass,
  } from "@acme/ui-core";
  import Avatar from "./Avatar.svelte";

  let { people, max, size, label }: AvatarStackProps = $props();

  const stack = $derived(avatarStack(people, max, label));
</script>

<span role="img" aria-label={stack.name} class={avatarStackClass}>
  {#each stack.shown as person, index (index)}
    <span aria-hidden="true" class={avatarStackItemClass(size)}>
      <Avatar name={person.name} src={person.src} {size} />
    </span>
  {/each}
  {#if stack.rest > 0}
    <span aria-hidden="true" class={avatarStackRestClass(size)}>+{stack.rest}</span>
  {/if}
</span>
