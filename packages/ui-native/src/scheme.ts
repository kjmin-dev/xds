import { createContext } from "react";

/**
 * A color scheme that wins over the system's, for every component inside it. A documentation
 * page that draws the components in a browser follows its own light/dark switch rather than the
 * operating system's, and a preview can show both schemes side by side.
 *
 * It is on the `@acme/ui-native/scheme` subpath rather than the main entry, which exports only
 * components, their types and hooks: an app follows the system and has no use for it.
 */
export const ColorSchemeOverride = createContext<"light" | "dark" | undefined>(undefined);
