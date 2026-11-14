import {
  MEDIA_CARD_PARTS,
  type MediaCardBaseProps,
  mediaCardContentClass,
  mediaCardIds,
  mediaCardThumbnailClass,
} from "@acme/ui-core";
import { createMemo, createUniqueId, type Element, For, Show } from "solid-js";
import { Thumbnail } from "./Thumbnail.tsx";

export type MediaCardProps = MediaCardBaseProps & {
  /** Before the text in the vertical layout, such as an Avatar. */
  leading?: Element;
  /** At the end of the text: an IconButton or a Menu. It stays a control of its own. */
  action?: Element;
  /** Makes the whole card one button. */
  onPress?: () => void;
};

/**
 * A thumbnail with its title and details: a video in a feed, an article in a list.
 *
 * With `onPress` the whole card is one button with no surface at rest: under a pointer and
 * while pressed it takes the card's fills, and it has a focus ring. The button is named by the
 * title followed by the details. `action` is a separate control beside it, so pressing it does
 * not press the card.
 */
export function MediaCard(props: MediaCardProps) {
  const id = createUniqueId();
  const ids = createMemo(() => mediaCardIds(id, props.meta));
  const horizontal = () => props.layout === "horizontal";
  const pressable = () => props.onPress !== undefined;
  // On a pressable card the button says all of this, so the parts are hidden from assistive
  // technology and only the action is left beside it.
  const hidden = () => (pressable() ? "true" : undefined);
  const content = () => (
    <div class={mediaCardContentClass({ horizontal: horizontal(), pressable: pressable() })}>
      <span aria-hidden={hidden()} class={mediaCardThumbnailClass(horizontal())}>
        <Thumbnail
          src={props.src}
          alt={props.alt ?? ""}
          ratio={props.ratio}
          badge={props.badge}
          progress={props.progress}
        />
      </span>
      <div class={MEDIA_CARD_PARTS.body}>
        <Show when={!horizontal() && props.leading}>
          {(leading) => (
            <span aria-hidden={hidden()} class={MEDIA_CARD_PARTS.leading}>
              {leading()}
            </span>
          )}
        </Show>
        <span aria-hidden={hidden()} class={MEDIA_CARD_PARTS.text}>
          <span id={ids().title} class={MEDIA_CARD_PARTS.title}>
            {props.title}
          </span>
          {/* Two details may read the same, so they are told apart by their position. */}
          <For each={props.meta ?? []} keyed={false}>
            {(line, index) => (
              <span id={ids().details[index]} class={MEDIA_CARD_PARTS.meta}>
                {line()}
              </span>
            )}
          </For>
        </span>
        <Show when={props.action}>
          {(action) => <div class={MEDIA_CARD_PARTS.action}>{action()}</div>}
        </Show>
      </div>
    </div>
  );
  return (
    <Show
      when={pressable()}
      fallback={
        // A group, not a fieldset: a fieldset groups form controls, and sizes itself to its
        // content, which would undo the ellipses.
        <div role="group" aria-labelledby={ids().names} class={MEDIA_CARD_PARTS.group}>
          {content()}
        </div>
      }
    >
      <div class={MEDIA_CARD_PARTS.pressable}>
        <button
          type="button"
          onClick={() => props.onPress?.()}
          aria-labelledby={ids().names}
          class={MEDIA_CARD_PARTS.button}
        />
        {content()}
      </div>
    </Show>
  );
}
