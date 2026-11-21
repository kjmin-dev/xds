import {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
  classes,
  rootPart,
} from "@acme/ui-core";
import { Avatar } from "./Avatar.tsx";
import { useDefaults } from "./Defaults.tsx";
import type { RootProps } from "./root.ts";

export type AvatarStackProps = AvatarStackBaseProps & RootProps;

/**
 * Several people in the room of one. Assistive technology gets one image named after
 * everyone in it, including those who did not fit.
 */
export function AvatarStack(props: AvatarStackProps) {
  const defaults = useDefaults("AvatarStack");
  // Settled here, so that the avatars take the stack's size and not an Avatar default.
  const { people, max, size = defaults.size ?? "md", label, className, style } = props;
  const stack = avatarStack(people, max, label);
  return (
    <span
      role="img"
      aria-label={stack.name}
      className={classes(rootPart("AvatarStack"), avatarStackClass, className)}
      style={style}
    >
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
