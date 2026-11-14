import { AVATAR_SIZE, Avatar, type AvatarSize } from "./Avatar.tsx";

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

export type AvatarStackProps = {
  people: readonly { name: string; src?: string | undefined }[];
  /** How many avatars to draw. The rest are counted in a "+3" at the end. */
  max?: number;
  size?: AvatarSize;
  /** Replaces the list of names that assistive technology reads. */
  label?: string;
};

/**
 * Several people in the room of one. Assistive technology gets one image named after
 * everyone in it, including those who did not fit.
 */
export function AvatarStack({ people, max = 4, size = "md", label }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span
      role="img"
      aria-label={label ?? people.map((person) => person.name).join(", ")}
      className="inline-flex shrink-0 items-center"
    >
      {shown.map((person, index) => (
        <span
          // By position, not by name: two people can share a name.
          key={index}
          aria-hidden="true"
          className={`inline-flex ${RING} ${OVERLAP[size]}`}
        >
          <Avatar name={person.name} src={person.src} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          aria-hidden="true"
          className={`inline-flex items-center justify-center bg-acme-avatar-overflow-background text-acme-avatar-overflow-text select-none ${AVATAR_SIZE[size]} ${RING} ${OVERLAP[size]}`}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
