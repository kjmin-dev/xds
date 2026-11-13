import { initials } from "./initials.ts";

const SIZE = {
  sm: "size-acme-avatar-sm text-acme-footnote",
  md: "size-acme-avatar-md text-acme-label",
  lg: "size-acme-avatar-lg text-acme-body-strong",
} as const;

export type AvatarSize = keyof typeof SIZE;

/**
 * Stands for a person or a team by their initials. Assistive technology gets the full name.
 * The small size has room for one letter.
 */
export function Avatar({ name, size = "md" }: { name: string; size?: AvatarSize }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-acme-avatar-background text-acme-avatar-text ${SIZE[size]}`}
    >
      {initials(name, size === "sm" ? 1 : 2)}
    </span>
  );
}
