import { useState } from "react";
import { initials } from "./initials.ts";

// The box and the type role of the initials. AvatarStack draws its "+3" with the same pair.
export const AVATAR_SIZE = {
  sm: "size-acme-avatar-sm text-acme-footnote",
  md: "size-acme-avatar-md text-acme-label",
  lg: "size-acme-avatar-lg text-acme-body-strong",
  xl: "size-acme-avatar-xl text-acme-title",
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;

export type AvatarProps = {
  name: string;
  /** The URL of a picture. The initials show while it loads, and stay if it fails. */
  src?: string | undefined;
  size?: AvatarSize;
};

/**
 * Stands for a person or a team by a picture, or by their initials when there is none.
 * Assistive technology gets the full name either way. The small size has room for one letter.
 */
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  // Remembered with the address it belongs to, so a new `src` starts over without an effect.
  const [picture, setPicture] = useState<{ src: string; loaded: boolean }>();
  const state = picture?.src === src ? picture : undefined;
  return (
    <span
      role="img"
      aria-label={name}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-acme-avatar-background text-acme-avatar-text select-none ${AVATAR_SIZE[size]}`}
    >
      {initials(name, size === "sm" ? 1 : 2)}
      {src && state?.loaded !== false && (
        <img
          src={src}
          // The name is on the avatar itself; a second one on the picture would be read twice.
          alt=""
          aria-hidden="true"
          // Not shown until it has loaded: a picture that is half there, or broken, would
          // cover the initials with nothing.
          className={`absolute inset-0 size-full object-cover ${state?.loaded ? "" : "invisible"}`}
          // On a page rendered by a server the picture can be complete before React listens.
          ref={(image) => {
            if (image?.complete && image.naturalWidth > 0 && !state) {
              setPicture({ src, loaded: true });
            }
          }}
          onLoad={() => setPicture({ src, loaded: true })}
          onError={() => setPicture({ src, loaded: false })}
        />
      )}
    </span>
  );
}
