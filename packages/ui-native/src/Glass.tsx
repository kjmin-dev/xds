import { border, glass, shadow } from "@acme/tokens";
import { requireOptionalNativeModule } from "expo";
import { BlurTargetView, BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import {
  type ComponentRef,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { PixelRatio, Platform, StyleSheet, View, type ViewProps } from "react-native";
import { PreviewGlassTier } from "./glassPreview.ts";
import { glassTier } from "./glassTier.ts";
import { useColors, useScheme } from "./theme.ts";

export type Surface = "solid" | "glass";

type Settings = {
  allowed(): boolean;
  addListener(event: "change", listener: () => void): { remove(): void };
};
const settings = requireOptionalNativeModule<Settings>("AcmeGlassSettings");
const subscribe = (changed: () => void) => {
  const subscription = settings?.addListener("change", changed);
  return () => subscription?.remove();
};
const allowed = () => settings?.allowed() ?? false;

type Target = ComponentRef<typeof View>;
const Scene = createContext<
  | {
      target: { current: Target | null };
      register: (view: Target | null) => void;
      allowed: boolean;
    }
  | undefined
>(undefined);

/** Mark the scrollable page and draw its bars as siblings so an effect never samples itself. */
export function GlassScene({ children }: { children: ReactNode }) {
  const [backdrop, register] = useState<Target | null>(null);
  const canBlur = useSyncExternalStore(subscribe, allowed, () => false);
  const value = useMemo(
    () => ({ target: { current: backdrop }, register, allowed: canBlur }),
    [backdrop, canBlur],
  );
  return <Scene value={value}>{children}</Scene>;
}

export function GlassBackdrop(props: ViewProps) {
  const scene = useContext(Scene);
  // Keep the same host when battery saver changes so its scroll position and child state survive.
  const TargetView =
    scene && Platform.OS === "android" && Platform.Version >= 33 ? BlurTargetView : View;
  return (
    <TargetView {...props} collapsable={false} ref={scene?.register}>
      <Scene value={undefined}>{props.children}</Scene>
    </TargetView>
  );
}

export type MaterialProps = ViewProps & { corners: number; sheet?: boolean };

/** Draws the component's children inside the system material on iOS 26. */
export function GlassMaterial({ corners, sheet, style, children, ...props }: MaterialProps) {
  const scene = useContext(Scene);
  const preview = useContext(PreviewGlassTier);
  const colors = useColors();
  const scheme = useScheme();
  const native = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const tier = glassTier(
    scene?.allowed ?? false,
    Boolean(scene?.target.current),
    native,
    preview?.requested,
  );
  useEffect(() => {
    preview?.onResolve?.(tier);
  }, [preview, tier]);
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
  if (tier === "native") {
    return (
      <GlassView
        {...props}
        testID={testID}
        glassEffectStyle="regular"
        colorScheme={scheme}
        style={[style, { borderRadius: corners }]}
      >
        {children}
      </GlassView>
    );
  }
  if (tier === "solid") {
    return (
      <View
        {...props}
        testID={testID}
        style={[style, edge, { backgroundColor: colors.glassFallback }]}
      >
        {children}
      </View>
    );
  }
  return (
    <View {...props} testID={testID} style={[style, edge, styles.clip]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <BlurView
          style={StyleSheet.absoluteFill}
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
        />
        {sheet && Platform.OS === "android" && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: sheet ? colors.glassTintStrong : colors.glassTint },
          ]}
        />
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={[colors.glassHighlight, "transparent"]}
          locations={[0, 0.5]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ clip: { overflow: "hidden" } });
