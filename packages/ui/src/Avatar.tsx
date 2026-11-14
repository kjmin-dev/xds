import { type AvatarBaseProps, avatarClass, avatarInitials, pictureClass } from "@acme/ui-core";
import { usePicture } from "./picture.ts";

export type { AvatarSize } from "@acme/ui-core";

export type AvatarProps = AvatarBaseProps;

/**
 * Stands for a person or a team by a picture, or by their initials when there is none.
 * Assistive technology gets the full name either way. The small size has room for one letter.
 */
export function Avatar({ name, src, size }: AvatarProps) {
  const picture = usePicture(src);
  return (
    <span role="img" aria-label={name} className={avatarClass(size)}>
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
