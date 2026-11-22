import type * as Expo from "expo";
import type * as ExpoBlur from "expo-blur";
import type * as ExpoGlassEffect from "expo-glass-effect";
import type * as ExpoLinearGradient from "expo-linear-gradient";
import {
  type ComponentRef,
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { PixelRatio, Platform, StyleSheet, View, type ViewProps } from "react-native";
import { PreviewGlassTier } from "./glassPreview.ts";
import { glassTier } from "./glassTier.ts";
import { useColors, useScheme, useTheme } from "./theme.ts";

export type Surface = "solid" | "glass";

type Settings = {
  allowed(): boolean;
  addListener(event: "change", listener: () => void): { remove(): void };
};
// The glass surfaces draw with Expo's blur, gradient and glass effect modules, which are optional
// peers: an app without them, such as a React Native app without Expo, gets the opaque material
// for its bars and sheets, and every other component as it is. Metro lets a module be missing
// from the bundle when it is required directly inside a `try`, so each one is.
let expo: typeof Expo | undefined;
let blur: typeof ExpoBlur | undefined;
let effect: typeof ExpoGlassEffect | undefined;
let gradient: typeof ExpoLinearGradient | undefined;
try {
  expo = require("expo") as typeof Expo;
} catch {}
try {
  blur = require("expo-blur") as typeof ExpoBlur;
} catch {}
try {
  effect = require("expo-glass-effect") as typeof ExpoGlassEffect;
} catch {}
try {
  gradient = require("expo-linear-gradient") as typeof ExpoLinearGradient;
} catch {}

const settings = expo?.requireOptionalNativeModule<Settings>("AcmeGlassSettings");
const subscribe = (changed: () => void) => {
  const subscription = settings?.addListener("change", changed);
  return () => subscription?.remove();
};
// The blurred material needs the blur and the gradient; without them only the opaque one is left.
const allowed = () => (blur && gradient ? (settings?.allowed() ?? false) : false);

type Target = ComponentRef<typeof View>;
const Scene = createContext<
  | {
      target: { current: Target | null };
      register: (view: Target | null) => void;
      allowed: boolean;
      topSheet?: string;
      showSheet: (id: string) => () => void;
    }
  | undefined
>(undefined);

/** Mark the scrollable page and draw its bars as siblings so an effect never samples itself. */
export function GlassScene({ children }: { children: ReactNode }) {
  const [backdrop, register] = useState<Target | null>(null);
  const [sheets, setSheets] = useState<readonly string[]>([]);
  const showSheet = useCallback((id: string) => {
    setSheets((stack) => [...stack, id]);
    return () => setSheets((stack) => stack.filter((sheet) => sheet !== id));
  }, []);
  const canBlur = useSyncExternalStore(subscribe, allowed, () => false);
  const value = useMemo(
    () => ({
      target: { current: backdrop },
      register,
      allowed: canBlur,
      topSheet: sheets.at(-1),
      showSheet,
    }),
    [backdrop, canBlur, sheets, showSheet],
  );
  return <Scene value={value}>{children}</Scene>;
}

export function GlassBackdrop(props: ViewProps) {
  const scene = useContext(Scene);
  const preview = useContext(PreviewGlassTier);
  // The solid benchmark uses a plain View: a BlurTargetView records its children into a
  // RenderNode even with no blur attached. Live power changes keep the same host and scroll state.
  const tracksBackdrop =
    scene && preview?.requested !== "solid" && Platform.OS === "android" && Platform.Version >= 33;
  const TargetView = tracksBackdrop && blur ? blur.BlurTargetView : View;
  return (
    <TargetView {...props} collapsable={false} ref={scene?.register}>
      <Scene value={undefined}>{props.children}</Scene>
    </TargetView>
  );
}

export type MaterialProps = ViewProps & { corners: number; sheet?: boolean };

/** Draws the component's children inside the system material on iOS 26. */
export function GlassMaterial({ corners, sheet, style, children, ...props }: MaterialProps) {
  const { border, glass, shadow } = useTheme();
  const scene = useContext(Scene);
  const preview = useContext(PreviewGlassTier);
  const colors = useColors();
  const scheme = useScheme();
  const id = useId();
  const showSheet = scene?.showSheet;
  useLayoutEffect(() => {
    if (Platform.OS === "ios" && sheet) return showSheet?.(id);
  }, [id, sheet, showSheet]);
  // UIKit samples everything behind this view. While a modal sheet is visible, flatten the
  // earlier materials so it samples the same dimmed, single-layer backdrop the reader sees.
  const covered = scene?.topSheet !== undefined && scene.topSheet !== id;
  const native =
    Platform.OS === "ios" &&
    effect !== undefined &&
    effect.isLiquidGlassAvailable() &&
    effect.isGlassEffectAPIAvailable();
  const tier = glassTier(
    Boolean(scene?.allowed && !covered),
    Boolean(scene?.target.current),
    native,
    preview?.requested,
  );
  useEffect(() => {
    if (!covered) preview?.onResolve?.(tier, sheet ? "sheet" : "bar");
  }, [preview, tier, covered, sheet]);
  // The capture flow checks what actually rendered, including a fallback on an older device.
  const testID = props.testID ?? (preview ? `glass-${sheet ? "sheet" : "bar"}-${tier}` : undefined);
  const geometry = sheet ? shadow.overlay : shadow.raised;
  const edge = {
    boxShadow: [
      {
        offsetX: geometry.offsetX,
        offsetY: geometry.offsetY,
        blurRadius: geometry.blur,
        spreadDistance: geometry.spread,
        color: colors.glassShadow,
      },
    ],
    borderRadius: corners,
    borderColor: colors.glassBorder,
    borderWidth: border.width.thin,
  };
  const opaque = [style, edge, { backgroundColor: colors.glassFallback }];
  // Backdrop registration and live accessibility settings select an effect after mount.
  // Keep the same UIKit contentView so controls inside the bar retain their state and focus.
  const GlassView = effect?.GlassView;
  const usesSystemHost =
    native && scene && settings && preview?.requested !== "blur" && preview?.requested !== "solid";
  if (usesSystemHost && GlassView) {
    return (
      <GlassView
        {...props}
        testID={testID}
        glassEffectStyle={tier === "native" ? "regular" : "none"}
        colorScheme={scheme}
        style={tier === "native" ? [style, { borderRadius: corners }] : opaque}
      >
        {children}
      </GlassView>
    );
  }
  // Keep the shadow and controls outside the mask. The backing alone must stop at the
  // rounded edge; clipping a host with a boxShadow makes Fabric wrap all its content.
  const BlurView = blur?.BlurView;
  const LinearGradient = gradient?.LinearGradient;
  const backingClip = corners > 0 && {
    borderRadius: Math.max(0, corners - border.width.thin),
    overflow: "hidden" as const,
  };
  return (
    <View {...props} testID={testID} style={tier === "blur" ? [style, edge] : opaque}>
      {tier === "blur" && BlurView && LinearGradient && (
        <BlurView
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, backingClip]}
          tint={scheme === "dark" ? "systemThinMaterialDark" : "systemThinMaterialLight"}
          // Android's RenderEffect accepts a radius in device pixels. UIKit controls the
          // Gaussian of its material and exposes only the intensity.
          intensity={
            Platform.OS === "android"
              ? PixelRatio.getPixelSizeForLayoutSize((glass.blur - 0.5) / 0.57735)
              : glass.blur
          }
          blurReductionFactor={1}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={scene?.target}
        >
          {sheet && Platform.OS === "android" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
          )}
          <LinearGradient
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: sheet ? colors.glassTintStrong : colors.glassTint },
            ]}
            colors={[colors.glassHighlight, "transparent"]}
            locations={[0, 0.5]}
          />
        </BlurView>
      )}
      <Fragment key="controls">{children}</Fragment>
    </View>
  );
}
