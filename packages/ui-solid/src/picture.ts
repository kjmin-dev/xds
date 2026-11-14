// Avatar and Thumbnail draw a picture over a placeholder, and show it only once it has loaded.

import { type Accessor, createSignal } from "solid-js";

/**
 * Follows the loading of the picture at `src()`. `loaded()` is undefined while it loads, then
 * true or false. The result is remembered with the address it belongs to, so a new `src` starts
 * over without an effect.
 *
 * A picture that is in the cache still reports its load in a later task, after the handlers
 * are attached, so no check of `complete` is needed on a page rendered in the browser.
 */
export function createPicture(src: Accessor<string | undefined>) {
  const [picture, setPicture] = createSignal<{ src: string; loaded: boolean }>();
  const loaded = () => {
    const current = picture();
    return current !== undefined && current.src === src() ? current.loaded : undefined;
  };
  return {
    loaded,
    onLoad: (address: string) => setPicture({ src: address, loaded: true }),
    onError: (address: string) => setPicture({ src: address, loaded: false }),
  };
}
