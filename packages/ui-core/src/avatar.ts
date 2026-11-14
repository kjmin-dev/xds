import { initials } from "./initials.ts";

// The box and the type role of the initials. AvatarStack draws its "+3" with the same pair.
export const AVATAR_SIZE = {
  sm: "size-acme-avatar-sm text-acme-footnote",
  md: "size-acme-avatar-md text-acme-label",
  lg: "size-acme-avatar-lg text-acme-body-strong",
  xl: "size-acme-avatar-xl text-acme-title",
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;

/** Avatar's props in every framework. */
export type AvatarBaseProps = {
  name: string;
  /** The URL of a picture. The initials show while it loads, and stay if it fails. */
  src?: string | undefined;
  size?: AvatarSize;
};

export function avatarClass(size: AvatarSize = "md"): string {
  return `relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-acme-avatar-background text-acme-avatar-text ${AVATAR_SIZE[size]}`;
}

/** The letters an avatar of `size` shows: the small size has room for one. */
export function avatarInitials(name: string, size: AvatarSize = "md"): string {
  return initials(name, size === "sm" ? 1 : 2);
}

/**
 * The class of a picture over a placeholder: Avatar's initials, Thumbnail's icon. It is not
 * shown until it has loaded: a picture that is half there, or broken, would cover the
 * placeholder with nothing.
 */
export function pictureClass(loaded: boolean): string {
  return loaded
    ? "absolute inset-0 size-full object-cover"
    : "invisible absolute inset-0 size-full object-cover";
}
