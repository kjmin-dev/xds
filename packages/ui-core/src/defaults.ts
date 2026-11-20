import type { AvatarSize } from "./avatar.ts";
import type { BadgeTone } from "./badge.ts";
import type { BannerTone } from "./banner.ts";
import type { ButtonVariant, ControlSize } from "./button.ts";
import type { IconSize } from "./icon.ts";
import type { MediaCardLayout } from "./media-card.ts";
import type { SkeletonShape } from "./skeleton.ts";
import type { SpinnerSize } from "./spinner.ts";
import type { TextTone, TextVariant } from "./text.ts";
import type { ThumbnailRatio } from "./thumbnail.ts";

/**
 * The options an app may give a component's default for, by component: each one the component
 * contract lists as a set of values (a variant, a size, a tone, a shape, a ratio or a layout).
 * `defaults.test.ts` holds this to design/components.json.
 */
export const DEFAULT_OPTIONS = {
  Avatar: ["size"],
  AvatarStack: ["size"],
  Badge: ["tone"],
  Banner: ["tone"],
  Button: ["variant", "size"],
  Icon: ["size"],
  IconButton: ["variant", "size"],
  MediaCard: ["layout"],
  Skeleton: ["shape"],
  Spinner: ["size"],
  Text: ["variant", "tone"],
  Thumbnail: ["ratio"],
} as const;

/**
 * Layer 6 of the library's customization: what each component takes when the app passes
 * nothing for an option. A library's `Defaults` provider holds one; a provider inside another
 * takes the outer one's defaults and replaces those it names, option by option.
 */
export type ComponentDefaults = {
  Avatar?: { size?: AvatarSize };
  AvatarStack?: { size?: AvatarSize };
  Badge?: { tone?: BadgeTone };
  Banner?: { tone?: BannerTone };
  Button?: { variant?: ButtonVariant; size?: ControlSize };
  Icon?: { size?: IconSize };
  IconButton?: { variant?: ButtonVariant; size?: ControlSize };
  MediaCard?: { layout?: MediaCardLayout };
  Skeleton?: { shape?: SkeletonShape };
  Spinner?: { size?: SpinnerSize };
  Text?: { variant?: TextVariant; tone?: TextTone };
  Thumbnail?: { ratio?: ThumbnailRatio };
};

// The type and the list name the same options, so neither can gain one alone.
type Listed = { [N in keyof typeof DEFAULT_OPTIONS]: (typeof DEFAULT_OPTIONS)[N][number] };
type Typed = { [N in keyof ComponentDefaults]-?: keyof NonNullable<ComponentDefaults[N]> };
({}) as Listed satisfies Typed;
({}) as Typed satisfies Listed;

export type DefaultedComponent = keyof ComponentDefaults;

/** The defaults inside a provider: the outer ones, with what the inner one names replaced. */
export function mergeDefaults(
  outer: ComponentDefaults | undefined,
  inner: ComponentDefaults | undefined,
): ComponentDefaults {
  if (!outer) return inner ?? {};
  if (!inner) return outer;
  const merged: Record<string, object> = { ...outer };
  for (const [name, options] of Object.entries(inner)) {
    if (options) merged[name] = { ...merged[name], ...options };
  }
  return merged as ComponentDefaults;
}
