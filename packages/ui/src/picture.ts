// Avatar and Thumbnail draw a picture over a placeholder, and show it only once it has loaded.

import { useState } from "react";

/**
 * Follows the loading of the picture at `src`. `loaded` is undefined while it loads, then true
 * or false. The result is remembered with the address it belongs to, so a new `src` starts
 * over without an effect. Pass the rest to the `<img>`.
 */
export function usePicture(src: string | undefined) {
  const [picture, setPicture] = useState<{ src: string; loaded: boolean }>();
  const loaded = picture !== undefined && picture.src === src ? picture.loaded : undefined;
  return {
    loaded,
    // On a page rendered by a server the picture can be complete before React listens.
    ref: (image: HTMLImageElement | null) => {
      if (src && image?.complete && image.naturalWidth > 0 && loaded === undefined) {
        setPicture({ src, loaded: true });
      }
    },
    onLoad: () => {
      if (src) setPicture({ src, loaded: true });
    },
    onError: () => {
      if (src) setPicture({ src, loaded: false });
    },
  };
}
