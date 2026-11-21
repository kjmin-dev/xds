import {
  type AvatarBaseProps,
  avatarClass,
  avatarInitials,
  classes,
  pictureClass,
  rootPart,
} from "@acme/ui-core";
import { useDefaults } from "./Defaults.tsx";
import { usePicture } from "./picture.ts";
import type { RootProps } from "./root.ts";

export type { AvatarSize } from "@acme/ui-core";

export type AvatarProps = AvatarBaseProps & RootProps;

/**
 * Stands for a person or a team by a picture, or by their initials when there is none.
 * Assistive technology gets the full name either way. The small size has room for one letter.
 */
export function Avatar(props: AvatarProps) {
  const defaults = useDefaults("Avatar");
  const { name, src, size = defaults.size, className, style } = props;
  const picture = usePicture(src);
  return (
    <span
      role="img"
      aria-label={name}
      className={classes(rootPart("Avatar"), avatarClass(size), className)}
      style={style}
    >
      {avatarInitials(name, size)}
      {src && picture.loaded !== false && (
        <img
          src={src}
          // The name is on the avatar itself; a second one on the picture would be read twice.
          alt=""
          aria-hidden="true"
          className={pictureClass(picture.loaded === true)}
          ref={picture.ref}
          onLoad={picture.onLoad}
          onError={picture.onError}
        />
      )}
    </span>
  );
}
