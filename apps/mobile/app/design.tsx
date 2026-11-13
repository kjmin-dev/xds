// The design preview: every token and every component in every variant and state. The home
// screen links here; the web app has the same page at `/design`, and the desktop app opens it
// with `acme --design`.
//
// `/design?from=3` starts at the third section, for taking screenshots from a script, which
// cannot scroll.

import { radius, size, space, colors as tokenColors, typography } from "@acme/tokens";
import {
  Badge,
  type BadgeTone,
  Banner,
  type BannerTone,
  Button,
  type ButtonVariant,
  Card,
  type ControlSize,
  Divider,
  Spinner,
  Text,
  TextField,
  type TextVariant,
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
const COMPONENT_COLORS = /^(button|field|badge|banner)/;
const COLOR_NAMES = (Object.keys(tokenColors.light) as (keyof typeof tokenColors.light)[]).filter(
  (name) => !COMPONENT_COLORS.test(name),
);

export default function Design() {
  const colors = useColors();
  const [value, setValue] = useState("");
  const from = Number(useLocalSearchParams<{ from?: string }>().from ?? 1);

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
        </View>
      </Card>
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
  radius: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
