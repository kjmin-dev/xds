import {
  type AvatarBaseProps,
  avatarClass,
  avatarInitials,
  classes,
  pictureClass,
  rootPart,
} from "@acme/ui-core";
import { Show } from "solid-js";
import { useDefaults } from "./Defaults.tsx";
import { createPicture } from "./picture.ts";
import type { RootProps } from "./root.ts";

export type { AvatarSize } from "@acme/ui-core";

export type AvatarProps = AvatarBaseProps & RootProps;

const ROOT = rootPart("Avatar");

/**
 * Stands for a person or a team by a picture, or by their initials when there is none.
 * Assistive technology gets the full name either way. The small size has room for one letter.
 */
export function Avatar(props: AvatarProps) {
  const defaults = useDefaults("Avatar");
  const size = () => props.size ?? defaults().size;
  const picture = createPicture(() => props.src);
  return (
    <span
      role="img"
      aria-label={props.name}
      class={classes(ROOT, avatarClass(size()), props.class)}
      style={props.style}
    >
      {avatarInitials(props.name, size())}
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
