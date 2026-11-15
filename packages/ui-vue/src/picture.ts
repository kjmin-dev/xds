// Avatar and Thumbnail draw a picture over a placeholder, and show it only once it has loaded.

import { computed, ref } from "vue";

/**
 * Follows the loading of the picture at `src()`. `loaded` is undefined while it loads, then
 * true or false. The result is remembered with the address it belongs to, so a new `src` starts
 * over without a watcher.
 *
 * A picture that is in the cache still reports its load in a later task, after the listeners
 * are attached, so no check of `complete` is needed on a page rendered in the browser.
 */
export function usePicture(src: () => string | undefined) {
  const picture = ref<{ src: string; loaded: boolean }>();
  return {
    loaded: computed(() =>
      picture.value !== undefined && picture.value.src === src() ? picture.value.loaded : undefined,
    ),
    onLoad: (address: string) => (picture.value = { src: address, loaded: true }),
    onError: (address: string) => (picture.value = { src: address, loaded: false }),
  };
}
