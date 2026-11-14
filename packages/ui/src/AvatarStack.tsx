import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
} from "@acme/ui-core";
import { Avatar } from "./Avatar.tsx";

export type AvatarStackProps = AvatarStackBaseProps;

/**
 * Several people in the room of one. Assistive technology gets one image named after
 * everyone in it, including those who did not fit.
 */
export function AvatarStack({ people, max, size, label }: AvatarStackProps) {
  const stack = avatarStack(people, max, label);
  return (
    <span role="img" aria-label={stack.name} className={avatarStackClass}>
      {stack.shown.map((person, index) => (
        // By position, not by name: two people can share a name.
        <span key={index} aria-hidden="true" className={avatarStackItemClass(size)}>
          <Avatar name={person.name} src={person.src} size={size} />
        </span>
      ))}
      {stack.rest > 0 && (
        <span aria-hidden="true" className={avatarStackRestClass(size)}>
          +{stack.rest}
        </span>
      )}
    </span>
  );
}
