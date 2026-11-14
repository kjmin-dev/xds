import { type AvatarBaseProps, avatarClass, avatarInitials, pictureClass } from "@acme/ui-core";
import { Show } from "solid-js";
import { createPicture } from "./picture.ts";

export type { AvatarSize } from "@acme/ui-core";

export type AvatarProps = AvatarBaseProps;

/**
 * Stands for a person or a team by a picture, or by their initials when there is none.
 * Assistive technology gets the full name either way. The small size has room for one letter.
 */
export function Avatar(props: AvatarProps) {
  const picture = createPicture(() => props.src);
  return (
    <span role="img" aria-label={props.name} class={avatarClass(props.size)}>
      {avatarInitials(props.name, props.size)}
      <Show when={picture.loaded() !== false && props.src}>
        {(src) => (
          <img
            src={src()}
            // The name is on the avatar itself; a second one on the picture would be read twice.
            alt=""
            aria-hidden="true"
            class={pictureClass(picture.loaded() === true)}
            onLoad={() => picture.onLoad(src())}
            onError={() => picture.onError(src())}
          />
        )}
      </Show>
    </span>
  );
}
