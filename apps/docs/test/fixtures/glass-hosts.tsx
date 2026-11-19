// Stand-ins for the native Expo views in the browser reconciliation test. Keep different
// element types so swapping the real UIKit host for a plain View is observable.
import type { ReactNode } from "react";
import { View } from "react-native";

const listeners = new Set<() => void>();
let allowed = true;

export function setBlurAllowed(value: boolean) {
  allowed = value;
  for (const changed of listeners) changed();
}

export const requireOptionalNativeModule = () => ({
  allowed: () => allowed,
  addListener: (_event: string, changed: () => void) => {
    listeners.add(changed);
    return { remove: () => listeners.delete(changed) };
  },
});
export const isLiquidGlassAvailable = () => true;
export const isGlassEffectAPIAvailable = () => true;
export const BlurTargetView = View;
export const BlurView = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
export const LinearGradient = () => null;
export function GlassView({
  children,
  glassEffectStyle,
  testID,
}: {
  children: ReactNode;
  glassEffectStyle: string;
  testID?: string;
}) {
  return (
    <section data-effect={glassEffectStyle} data-testid={testID}>
      {children}
    </section>
  );
}
