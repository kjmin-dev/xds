// The touch-only examples by name, apart from the examples themselves: the pages are listed on
// the server, which never loads React Native's components.
export const NATIVE_DEMO_NAMES = ["top-bar", "tab-bar", "bottom-sheet"] as const;
export type NativeDemoName = (typeof NATIVE_DEMO_NAMES)[number];
