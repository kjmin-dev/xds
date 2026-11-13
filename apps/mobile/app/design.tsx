// The design preview: every token and every component in every variant and state. The home
// screen links here; the web app has the same page at `/design`, and the desktop app opens it
// with `acme --design`.
//
// `/design?from=3` starts at the third section and `/design?sheet=1` opens the bottom sheet,
// for taking screenshots from a script, which can neither scroll nor tap.

import { radius, size, space, colors as tokenColors, typography } from "@acme/tokens";
import {
  Avatar,
  Badge,
  type BadgeTone,
  Banner,
  type BannerTone,
  BottomSheet,
  Button,
  type ButtonVariant,
  Card,
  Checkbox,
  type ControlSize,
  Divider,
  ListRow,
  ProgressBar,
  SegmentedControl,
  Spinner,
  Switch,
  TabBar,
  Text,
  TextField,
  type TextVariant,
  TopBar,
  useColors,
} from "@acme/ui-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { type ReactNode, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ControlSize[] = ["sm", "md", "lg"];
const BADGE_TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger"];
const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];
const TEXT_VARIANTS: TextVariant[] = [
  "display",
  "title",
  "heading",
  "body",
  "body-strong",
  "label",
  "detail",
  "footnote",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title" heading>
        {title}
      </Text>
      {children}
    </View>
  );
}

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`);

/** Semantic colors by group. Component colors are shown by the components that use them. */
const COMPONENT_COLORS =
  /^(button|field|badge|banner|switch|checkbox|segmented|avatar|progress|listRow|topBar|tabBar|sheet)/;

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

/** Tab icons are plain shapes here. An app brings its own icon set. */
const TABS = [
  {
    key: "home",
    label: "Home",
    icon: (color: string) => (
      <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: color }} />
    ),
  },
  {
    key: "search",
    label: "Search",
    icon: (color: string) => (
      <View
        style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: color }}
      />
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (color: string) => (
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color }} />
    ),
  },
] as const;
const COLOR_NAMES = (Object.keys(tokenColors.light) as (keyof typeof tokenColors.light)[]).filter(
  (name) => !COMPONENT_COLORS.test(name),
);

export default function Design() {
  const colors = useColors();
  const [value, setValue] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("week");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("home");
  const params = useLocalSearchParams<{ from?: string; sheet?: string }>();
  const from = Number(params.from ?? 1);
  const [sheet, setSheet] = useState(params.sheet === "1");

  const sections = [
    <Section key="colors" title="Colors">
      <View style={styles.swatches}>
        {COLOR_NAMES.map((name) => (
          <View key={name} style={styles.swatch}>
            <View
              style={[
                styles.chip,
                { backgroundColor: colors[name], borderColor: colors.borderDefault },
              ]}
            />
            <Text variant="footnote" tone="secondary" style={styles.swatchName}>
              {kebab(name)}
            </Text>
          </View>
        ))}
      </View>
    </Section>,

    <Section key="text" title="Typography">
      {TEXT_VARIANTS.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant} · 다람쥐 헌 쳇바퀴 Quick fox 123
        </Text>
      ))}
    </Section>,

    <Section key="sizes" title="Space, radius, size">
      <View style={styles.row}>
        {Object.entries(space).map(([name, points]) => (
          <View key={name} style={styles.sample}>
            <View
              style={{ width: points, height: points, backgroundColor: colors.accentDefault }}
            />
            <Text variant="footnote" tone="secondary">
              {name}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {Object.entries(radius).map(([name, points]) => (
          <View
            key={name}
            style={[styles.radius, { borderRadius: points, borderColor: colors.borderStrong }]}
          >
            <Text variant="footnote" tone="secondary">
              {name}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="detail" tone="secondary">
        Body {typography.body.fontSize}/{typography.body.lineHeight}. Control heights: touch{" "}
        {size.touch.controlSm}/{size.touch.controlMd}/{size.touch.controlLg}, pointer{" "}
        {size.pointer.controlSm}/{size.pointer.controlMd}/{size.pointer.controlLg}. The mobile app
        uses the touch sizes.
      </Text>
    </Section>,

    <Section key="buttons" title="Buttons">
      {VARIANTS.map((variant) => (
        <View key={variant} style={styles.row}>
          {SIZES.map((buttonSize) => (
            <Button key={buttonSize} variant={variant} size={buttonSize} label="Save" />
          ))}
          <Button variant={variant} label="Off" disabled />
          <Button variant={variant} label="Saving" loading />
        </View>
      ))}
      <Button variant="primary" label="Full width" fullWidth />
    </Section>,

    <Section key="fields" title="Text fields">
      <TextField
        label="Email"
        placeholder="name@example.com"
        description="We send the sign-in code to this address."
        value={value}
        onChange={setValue}
      />
      <TextField
        label="Sign-in code"
        value="12345"
        onChange={() => {}}
        error="That code is wrong or has expired."
      />
      <TextField label="Organization" value="Acme Inc." onChange={() => {}} disabled />
    </Section>,

    <Section key="selection" title="Selection">
      <View style={styles.row}>
        <Switch checked={notifications} onChange={setNotifications} label="Notifications" />
        <Switch checked={false} onChange={() => {}} label="Off" />
        <Switch checked onChange={() => {}} label="Locked" disabled />
      </View>
      <View style={styles.row}>
        <Checkbox checked={agreed} onChange={setAgreed} label="Remember me" />
        <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
        <Checkbox checked onChange={() => {}} label="Locked" disabled />
      </View>
      <SegmentedControl
        options={VIEWS}
        value={view}
        onChange={setView}
        accessibilityLabel="Calendar view"
      />
      <SegmentedControl
        options={VIEWS}
        value={view}
        onChange={setView}
        accessibilityLabel="Calendar view"
        fullWidth
      />
    </Section>,

    <Section key="badges" title="Badges">
      <View style={styles.row}>
        {BADGE_TONES.map((tone) => (
          <Badge key={tone} tone={tone} label={tone} />
        ))}
      </View>
      <View style={styles.row}>
        <Badge tone="success" label="Online" dot />
        <Badge tone="warning" label="Connecting" dot />
        <Badge tone="danger" label="Offline" dot />
      </View>
    </Section>,

    <Section key="banners" title="Banners">
      {BANNER_TONES.map((tone) => (
        <Banner key={tone} tone={tone} title={tone}>
          Your changes are saved on this device.
        </Banner>
      ))}
    </Section>,

    <Section key="card" title="Card">
      <Card
        title="Weekly report"
        description="Updated a few minutes ago."
        actions={<Badge tone="success" label="Online" dot />}
      >
        <Text tone="secondary">A card groups related content.</Text>
        <Divider />
        <View style={styles.row}>
          <Spinner size="sm" />
          <Spinner label="Loading" />
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" size="lg" />
        </View>
        <ProgressBar value={0.6} label="Upload" />
      </Card>
    </Section>,

    <Section key="list" title="List">
      <Card flush>
        <ListRow
          leading={<Avatar name="Ada Lovelace" />}
          title="Ada Lovelace"
          description="ada@example.com"
          trailing={<Badge tone="accent" label="Owner" />}
        />
        <Divider />
        <ListRow
          title="Notifications"
          description="Mentions and replies"
          trailing={
            <Switch
              checked={notifications}
              onChange={setNotifications}
              accessibilityLabel="Notifications"
            />
          }
        />
        <Divider />
        <ListRow
          title="Language"
          trailing={<Text tone="secondary">English</Text>}
          chevron
          onPress={() => {}}
        />
        <Divider />
        <ListRow
          title="Storage"
          description="Unavailable offline"
          chevron
          onPress={() => {}}
          disabled
        />
      </Card>
    </Section>,

    <Section key="navigation" title="Navigation">
      <View style={[styles.frame, { borderColor: colors.borderDefault }]}>
        <TopBar
          title="Settings"
          onBack={() => {}}
          trailing={<Button variant="ghost" size="sm" label="Edit" />}
        />
        <View style={styles.frameBody}>
          <Button label="Open a bottom sheet" onPress={() => setSheet(true)} />
        </View>
        <View style={styles.frameBar}>
          <TabBar items={TABS} value={tab} onChange={setTab} />
        </View>
      </View>
    </Section>,
  ];

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.backgroundBase }}
    >
      {/* The one screen with a navigation bar: it gives the way back to the app. */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Design system",
          headerBackTitle: "App",
          headerStyle: { backgroundColor: colors.backgroundBase },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.page}>{sections.slice(from - 1)}</ScrollView>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Share report">
        <Text tone="secondary">A sheet holds a short task and leaves the screen behind it.</Text>
        <Button variant="primary" label="Copy link" fullWidth onPress={() => setSheet(false)} />
        <Button label="Cancel" fullWidth onPress={() => setSheet(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: space[4],
    gap: space[8],
  },
  section: {
    gap: space[3],
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space[2],
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: space[2],
  },
  swatch: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  swatchName: {
    flex: 1,
  },
  chip: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  sample: {
    alignItems: "center",
    gap: space[1],
  },
  // A small stand-in for a screen, to show the bars where they belong.
  frame: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  // The tab bar floats: it keeps a margin from the edges of the screen.
  frameBar: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  frameBody: {
    alignItems: "center",
    padding: space[6],
  },
  radius: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
