// Avatar and Thumbnail draw a picture over a placeholder, and show it only once it has loaded.

/**
 * Follows the loading of the picture at `src()`. `loaded()` is undefined while it loads, then
 * true or false. The result is remembered with the address it belongs to, so a new `src` starts
 * over without an effect.
 *
 * A picture that is in the cache still reports its load in a later task, after the handlers
 * are attached, so no check of `complete` is needed on a page rendered in the browser.
 */
export function createPicture(src: () => string | undefined) {
  let picture = $state.raw<{ src: string; loaded: boolean }>();
  const loaded = $derived(
    picture !== undefined && picture.src === src() ? picture.loaded : undefined,
  );
  return {
    loaded: () => loaded,
    onLoad: (address: string) => (picture = { src: address, loaded: true }),
    onError: (address: string) => (picture = { src: address, loaded: false }),
  };
}
