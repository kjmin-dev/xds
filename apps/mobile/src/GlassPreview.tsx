import { space } from "@acme/tokens";
import { BottomSheet, Button, Icon, TabBar, Text, TopBar, useColors } from "@acme/ui-native";
import { GlassBackdrop, GlassScene } from "@acme/ui-native/glass";
import { type GlassTier, PreviewGlassTier } from "@acme/ui-native/glass-preview";
import { useCallback, useMemo, useState } from "react";
import { type ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SCROLL_MS = 10_000;
const FRAME_MS = 1000 / 120;

const tabs = [
  { key: "home", label: "Home", icon: (color: string) => <Icon name="house" color={color} /> },
  { key: "search", label: "Search", icon: (color: string) => <Icon name="search" color={color} /> },
  { key: "profile", label: "Profile", icon: (color: string) => <Icon name="user" color={color} /> },
];

type Props = {
  fullScreen?: boolean;
  tier?: string;
  autoscroll?: boolean;
  settle?: boolean;
  initiallyOpen?: boolean;
};

export function GlassPreview({
  fullScreen,
  tier,
  autoscroll = false,
  settle = false,
  initiallyOpen = false,
}: Props) {
  const colors = useColors();
  const [sheet, setSheet] = useState(initiallyOpen);
  const [tab, setTab] = useState("home");
  const ref = useAnimatedRef<ScrollView>();
  const content = useSharedValue(0);
  const viewport = useSharedValue(0);
  const [report, setReport] = useState<string>();
  const start = useSharedValue<number | null>(null);
  const done = useSharedValue(false);
  const waitUntil = useSharedValue(0);
  const intervals = useSharedValue<number[]>([]);
  const resolved = useSharedValue<GlassTier | null>(null);
  const measuring = useSharedValue<GlassTier | null>(null);
  const preview = useMemo(
    () => ({
      requested:
        tier === "solid" || tier === "blur" || tier === "native" ? (tier as GlassTier) : undefined,
      onResolve: autoscroll ? (actual: GlassTier) => resolved.set(actual) : undefined,
    }),
    [tier, autoscroll, resolved],
  );
  const finish = useCallback(
    (samples: number[], elapsedMs: number, actual: GlassTier) => {
      // Compute the distribution after scrolling. Each sample measures UI callbacks, not GPU time.
      const sorted = [...samples].sort((a, b) => a - b);
      const frames = samples.length;
      let offset = 0;
      let dropped = 0;
      const missed: [number, number][] = [];
      const bySecond = Array<number>(SCROLL_MS / 1000).fill(0);
      for (const interval of samples) {
        const slots = Math.max(0, Math.round(interval / FRAME_MS) - 1);
        if (slots > 0) {
          const second = Math.min(bySecond.length - 1, Math.floor(offset / 1000));
          bySecond[second] = (bySecond[second] ?? 0) + slots;
          dropped += slots;
          if (missed.length < 12)
            missed.push([Math.round(offset), Math.round(interval * 1000) / 1000]);
        }
        offset += interval;
      }
      const result = {
        tier: actual,
        requestedTier: tier ?? "auto",
        elapsedMs,
        frames,
        dropped,
        settleMs: settle ? 2000 : 0,
        missed,
        bySecond,
        p90Ms: sorted[Math.ceil(frames * 0.9) - 1],
        p99Ms: sorted[Math.ceil(frames * 0.99) - 1],
      };
      const line = `XDS_GLASS_FRAMES ${JSON.stringify(result)}`;
      console.log(line);
      setReport(line);
    },
    [tier, settle],
  );
  // Start after layout, so mounting and navigation do not consume part of the 10-second run.
  useFrameCallback(({ timestamp, timeSincePreviousFrame }) => {
    const distance = content.get() - viewport.get();
    if (done.get() || viewport.get() <= 0 || distance <= 0) return;
    const first = start.get();
    const actual = resolved.get();
    if (!actual) return;
    if (first === null || actual !== measuring.get()) {
      measuring.set(actual);
      intervals.set([]);
      start.set(timestamp);
      if (settle) waitUntil.set(timestamp + 2000);
      return;
    }
    if (settle && waitUntil.get() > 0) {
      if (timestamp >= waitUntil.get()) {
        start.set(timestamp);
        waitUntil.set(0);
      }
      return;
    }
    const elapsed = timestamp - first;
    if (timeSincePreviousFrame !== null) {
      intervals.modify((values) => {
        "worklet";
        values.push(timeSincePreviousFrame);
        return values;
      });
    }
    scrollTo(ref, 0, distance * Math.min(elapsed / SCROLL_MS, 1), false);
    if (elapsed >= SCROLL_MS) {
      done.set(true);
      scheduleOnRN(finish, intervals.get(), elapsed, actual);
    }
  }, autoscroll);
  const sections = [
    ["Information", colors.statusInfoSubtle],
    ["Success", colors.statusSuccessSubtle],
    ["Warning", colors.statusWarningSubtle],
    ["Review", colors.statusDangerSubtle],
  ] as const;
  return (
    <PreviewGlassTier value={preview}>
      <GlassScene>
        <View style={fullScreen ? styles.fill : styles.sample}>
          <GlassBackdrop style={styles.fill}>
            <Animated.ScrollView
              ref={ref}
              onContentSizeChange={(_, height) => {
                content.set(height);
              }}
              onLayout={({ nativeEvent }) => {
                viewport.set(nativeEvent.layout.height);
              }}
            >
              {Array.from({ length: 24 }, (_, index) => {
                const [label, color] = sections[index % sections.length] ?? sections[0];
                return (
                  <View key={index} style={[styles.row, { backgroundColor: color }]}>
                    <Text variant="heading">{label}</Text>
                    <Text>Collection {index + 1}</Text>
                  </View>
                );
              })}
            </Animated.ScrollView>
          </GlassBackdrop>
          <View style={styles.top}>
            <TopBar
              surface="glass"
              title="Collections"
              trailing={
                <Button
                  label="Details"
                  variant="secondary"
                  size="sm"
                  onPress={() => setSheet(true)}
                />
              }
            />
          </View>
          <View style={styles.bottom}>
            <TabBar surface="glass" items={tabs} value={tab} onChange={setTab} />
          </View>
          {report && (
            <View style={[styles.results, { backgroundColor: colors.backgroundSurface }]}>
              <Text variant="footnote">{report}</Text>
            </View>
          )}
          <BottomSheet
            surface="glass"
            open={sheet}
            onClose={() => setSheet(false)}
            title="Collection details"
          >
            <Text tone="secondary">These collections are available offline.</Text>
            <Button label="Done" onPress={() => setSheet(false)} />
          </BottomSheet>
        </View>
      </GlassScene>
    </PreviewGlassTier>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  sample: { height: 440 },
  row: { padding: space[4], gap: space[1] },
  results: { position: "absolute", top: "40%", left: space[3], right: space[3], padding: space[3] },
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  bottom: { position: "absolute", bottom: space[3], left: space[3], right: space[3] },
});
