// Layer 6 of the library's customization (docs/library.md): the variant, size, tone, shape,
// ratio or layout a component takes when the app passes none. The web libraries' and Compose's
// `Defaults` do the same, for the same components and options.

import { createContext, createElement, type ReactNode, useContext, useMemo } from "react";
import type { AvatarSize } from "./Avatar.tsx";
import type { BadgeTone } from "./Badge.tsx";
import type { BannerTone } from "./Banner.tsx";
import type { ButtonVariant } from "./Button.tsx";
import type { IconSize } from "./Icon.tsx";
import type { MediaCardProps } from "./MediaCard.tsx";
import type { SkeletonProps } from "./Skeleton.tsx";
import type { SpinnerSize } from "./Spinner.tsx";
import type { TextTone, TextVariant } from "./Text.tsx";
import type { ControlSize } from "./theme.ts";
import type { ThumbnailRatio } from "./Thumbnail.tsx";

/**
 * The options an app may give a component's default for, by component: each one the component
 * contract lists as a set of values. `defaults.test.ts` holds this to design/components.json.
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

/** What each component takes when the app passes nothing for an option. */
export type ComponentDefaults = {
  Avatar?: { size?: AvatarSize };
  AvatarStack?: { size?: AvatarSize };
  Badge?: { tone?: BadgeTone };
  Banner?: { tone?: BannerTone };
  Button?: { variant?: ButtonVariant; size?: ControlSize };
  Icon?: { size?: IconSize };
  IconButton?: { variant?: ButtonVariant; size?: ControlSize };
  MediaCard?: { layout?: NonNullable<MediaCardProps["layout"]> };
  Skeleton?: { shape?: NonNullable<SkeletonProps["shape"]> };
  Spinner?: { size?: SpinnerSize };
  Text?: { variant?: TextVariant; tone?: TextTone };
  Thumbnail?: { ratio?: ThumbnailRatio };
};

// The type and the list name the same options, so neither can gain one alone.
type Listed = { [N in keyof typeof DEFAULT_OPTIONS]: (typeof DEFAULT_OPTIONS)[N][number] };
type Typed = { [N in keyof ComponentDefaults]-?: keyof NonNullable<ComponentDefaults[N]> };
({}) as Listed satisfies Typed;
({}) as Typed satisfies Listed;

/** The defaults inside a provider: the outer ones, with what the inner one names replaced. */
export function mergeDefaults(
  outer: ComponentDefaults,
  inner: ComponentDefaults | undefined,
): ComponentDefaults {
  if (!inner) return outer;
  const merged: Record<string, object> = { ...outer };
  for (const [name, options] of Object.entries(inner)) {
    if (options) merged[name] = { ...merged[name], ...options };
  }
  return merged as ComponentDefaults;
}

const DefaultsContext = createContext<ComponentDefaults>({});

/**
 * Gives the components inside it a default for their variant, size, tone, shape, ratio or
 * layout: `<Defaults value={{ Button: { size: "lg" } }}>`. A value the app passes to a component
 * wins. One inside another replaces only the options it names. The parts a component draws
 * itself, such as a banner's action, keep their own options.
 */
export function Defaults({ value, children }: { value: ComponentDefaults; children?: ReactNode }) {
  const outer = useContext(DefaultsContext);
  const merged = useMemo(() => mergeDefaults(outer, value), [outer, value]);
  return createElement(DefaultsContext, { value: merged }, children);
}

/** The defaults the closest `Defaults` gives a component, or none. */
export function useDefaults<N extends keyof ComponentDefaults>(
  name: N,
): NonNullable<ComponentDefaults[N]> {
  return useContext(DefaultsContext)[name] ?? {};
}
