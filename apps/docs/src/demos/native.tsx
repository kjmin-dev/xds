// The live examples of the touch-only components: the real components from @acme/ui-native,
// drawn in the browser by react-native-web. Each one is a small screen of an app, shown by
// `/demo-native/<name>/`, which a component page embeds in a frame shaped like a phone. The
// frame's page is the phone's screen, so the bottom sheet covers that screen and not the page.

import { space } from "@acme/tokens";
import {
  BottomSheet,
  Button,
  Icon,
  ListRow,
  TabBar,
  Text,
  TopBar,
  useColors,
} from "@acme/ui-native";
import { ColorSchemeOverride } from "@acme/ui-native/scheme";
import { type ReactNode, useEffect, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaFrameContext, SafeAreaInsetsContext } from "react-native-safe-area-context";
import type { NativeDemoName } from "./native-names.ts";

// A browser has no safe area, so a phone's is given: an iPhone's, around the status bar and the
// home indicator. The bars and the sheet then keep the distance from the edges they keep there.
const INSETS = { top: 47, left: 0, right: 0, bottom: 34 };

const TABS = [
  { key: "home", label: "Home", icon: (c: string) => <Icon name="house" size="lg" color={c} /> },
  {
    key: "search",
    label: "Search",
    icon: (c: string) => <Icon name="search" size="lg" color={c} />,
  },
  {
    key: "profile",
    label: "Profile",
    icon: (c: string) => <Icon name="user" size="lg" color={c} />,
  },
] as const;

function Screen({ children, bar }: { children: ReactNode; bar?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundBase }]}>
      <View style={{ height: INSETS.top }} />
      {children}
      {bar && <View style={styles.bar}>{bar}</View>}
    </View>
  );
}

function Rows({ titles }: { titles: readonly string[] }) {
  return (
    <ScrollView contentContainerStyle={styles.rows}>
      {titles.map((title) => (
        <ListRow key={title} title={title} chevron onPress={() => {}} />
      ))}
    </ScrollView>
  );
}

const SETTINGS = ["Notifications", "Privacy", "Appearance", "Storage", "About"];

function TopBarDemo() {
  return (
    <Screen>
      <TopBar
        title="Settings"
        onBack={() => {}}
        trailing={<Button variant="ghost" size="sm" label="Edit" />}
      />
      <Rows titles={SETTINGS} />
    </Screen>
  );
}

const PLACES: Record<(typeof TABS)[number]["key"], string[]> = {
  home: ["Inbox", "Today", "Upcoming"],
  search: ["Recent searches", "Saved searches"],
  profile: ["Account", "Notifications", "Privacy"],
};

function TabBarDemo() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("home");
  return (
    <Screen bar={<TabBar items={TABS} value={tab} onChange={setTab} />}>
      <TopBar title={TABS.find((item) => item.key === tab)?.label ?? ""} />
      <Rows titles={PLACES[tab]} />
    </Screen>
  );
}

function BottomSheetDemo() {
  // `?open=1` opens it at once, for a picture of the open sheet.
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).get("open") === "1");
  return (
    <Screen>
      <TopBar title="Report" />
      <View style={styles.body}>
        <Text tone="secondary">Quarterly numbers, shared with the team.</Text>
        <Button variant="primary" label="Share" onPress={() => setOpen(true)} />
      </View>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Share report">
        <Text tone="secondary">A sheet holds a short task and leaves the screen behind it.</Text>
        <Button variant="primary" label="Copy link" fullWidth onPress={() => setOpen(false)} />
        <Button label="Cancel" fullWidth onPress={() => setOpen(false)} />
      </BottomSheet>
    </Screen>
  );
}

const DEMOS: Record<NativeDemoName, () => ReactNode> = {
  "top-bar": TopBarDemo,
  "tab-bar": TabBarDemo,
  "bottom-sheet": BottomSheetDemo,
};

/**
 * The mode the docs site is in, which the frame's page copies to its own root. On the web,
 * React Native's useColorScheme follows the operating system, and a reader can set the site to
 * the other mode.
 */
function useSiteScheme(): "light" | "dark" {
  const read = () => {
    const theme = document.documentElement.dataset.theme;
    if (theme === "light" || theme === "dark") return theme;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [scheme, setScheme] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setScheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return scheme;
}

export function NativeDemo({ name }: { name: NativeDemoName }) {
  const Example = DEMOS[name];
  const scheme = useSiteScheme();
  const { width, height } = useWindowDimensions();
  return (
    <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width, height }}>
      <SafeAreaInsetsContext.Provider value={INSETS}>
        <ColorSchemeOverride.Provider value={scheme}>
          <View style={StyleSheet.absoluteFill}>
            <Example />
          </View>
        </ColorSchemeOverride.Provider>
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  rows: { paddingVertical: space[2] },
  body: { gap: space[4], padding: space[4] },
  // Floating over the content, as the TabBar asks: a margin at the sides and above the home
  // indicator.
  bar: { position: "absolute", left: space[4], right: space[4], bottom: INSETS.bottom },
});
