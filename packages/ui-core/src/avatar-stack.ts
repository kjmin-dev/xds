import { AVATAR_SIZE, type AvatarSize } from "./avatar.ts";

// Each avatar covers a quarter of the one before it. Written out in full: Tailwind only
// generates the classes it can find as whole strings.
const OVERLAP = {
  sm: "not-first:ms-[calc(var(--acme-size-avatar-sm)/-4)]",
  md: "not-first:ms-[calc(var(--acme-size-avatar-md)/-4)]",
  lg: "not-first:ms-[calc(var(--acme-size-avatar-lg)/-4)]",
  xl: "not-first:ms-[calc(var(--acme-size-avatar-xl)/-4)]",
} as const;

// The ring is in the color of the surface behind the stack, so it reads as a gap between two
// avatars. It is an outline, which takes no room: the stack is as wide as its avatars.
const RING =
  "rounded-full outline-solid outline-(length:--acme-border-width-thick) outline-acme-avatar-ring";

/** AvatarStack's props in every framework. */
export type AvatarStackBaseProps = {
  people: readonly { name: string; src?: string | undefined }[];
  /** How many avatars to draw. The rest are counted in a "+3" at the end. */
  max?: number;
  size?: AvatarSize;
  /** Replaces the list of names that assistive technology reads. */
  label?: string;
};

export const avatarStackClass = "inline-flex shrink-0 items-center";

/** The ring around each avatar of the stack. */
export function avatarStackItemClass(size: AvatarSize = "md"): string {
  return `inline-flex ${RING} ${OVERLAP[size]}`;
}

/** The "+3" after the avatars, in an avatar's box. */
export function avatarStackRestClass(size: AvatarSize = "md"): string {
  return `inline-flex select-none items-center justify-center bg-acme-avatar-overflow-background text-acme-avatar-overflow-text ${AVATAR_SIZE[size]} ${RING} ${OVERLAP[size]}`;
}

/**
 * The avatars drawn, how many people the "+3" counts, and the name of the whole stack, which
 * includes those who did not fit.
 */
export function avatarStack<Person extends { name: string }>(
  people: readonly Person[],
  max = 4,
  label?: string,
): { shown: readonly Person[]; rest: number; name: string } {
  const shown = people.slice(0, max);
  return {
    shown,
    rest: people.length - shown.length,
    name: label ?? people.map((person) => person.name).join(", "),
  };
}
