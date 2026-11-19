import { space } from "@acme/tokens";
import { BottomSheet, Button, Icon, TabBar, Text, TopBar, useColors } from "@acme/ui-native";
import { GlassBackdrop, GlassScene } from "@acme/ui-native/glass";
import {
  DISPLAY_FRAME_MS,
  GLASS_SCROLL_MS,
  glassFrameWindows,
  type GlassTier,
  type GlassPart,
  type GlassSheetEvent,
  type GlassMilestones,
  measurableGlassTier,
  glassOpeningWindow,
  PreviewGlassTier,
} from "@acme/ui-native/glass-preview";
import { useCallback, useMemo, useRef, useState } from "react";
import { type ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

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
  const motionStart = useSharedValue<number | null>(null);
  const done = useSharedValue(false);
  const waitUntil = useSharedValue(0);
  const intervals = useSharedValue<number[]>([]);
  const resolved = useSharedValue<GlassTier | null>(null);
  const measuring = useSharedValue<GlassTier | null>(null);
  const [mountedAt] = useState(() => performance.now());
  const milestones = useRef<GlassMilestones>({});
  const openingFrame = useSharedValue<number | null>(null);
  const openingSamples = useSharedValue<number[]>([]);
  const preview = useMemo(
    () => ({
      requested:
        tier === "solid" || tier === "blur" || tier === "native" ? (tier as GlassTier) : undefined,
      onResolve: autoscroll
        ? (actual: GlassTier, part: GlassPart) => {
            const events = milestones.current;
            if (events[part]?.tier !== actual)
              events[part] = { tier: actual, atMs: Math.round(performance.now() - mountedAt) };
            resolved.set(measurableGlassTier(initiallyOpen ? "sheet" : "bar", events));
          }
        : undefined,
      onSheetEvent:
        autoscroll && initiallyOpen
          ? (event: GlassSheetEvent) => {
              const events = milestones.current;
              if (event === "closing") {
                delete events.shownMs;
                delete events.enteredMs;
                delete events.sheet;
                start.set(null);
                openingFrame.set(null);
                openingSamples.set([]);
              } else {
                const key = event === "shown" ? "shownMs" : "enteredMs";
                events[key] ??= Math.round(performance.now() - mountedAt);
              }
              resolved.set(measurableGlassTier("sheet", events));
            }
          : undefined,
    }),
    [tier, autoscroll, resolved, initiallyOpen, mountedAt, start, openingFrame, openingSamples],
  );
  const finish = useCallback(
    (samples: number[], actual: GlassTier, opening: number[]) => {
      const result = {
        tier: actual,
        requestedTier: tier ?? "auto",
        settleMs: settle ? 2000 : 0,
        ...glassFrameWindows(samples),
        milestones: milestones.current,
        ...(initiallyOpen && { opening: glassOpeningWindow(opening) }),
      };
      const line = `XDS_GLASS_FRAMES ${JSON.stringify(result)}`;
      console.log(line);
      setReport(line);
    },
    [tier, settle, initiallyOpen],
  );
  // Start after layout, so mounting and navigation do not consume part of the 10-second run.
  useFrameCallback(({ timestamp, timeSincePreviousFrame }) => {
    const distance = content.get() - viewport.get();
    if (done.get() || viewport.get() <= 0 || distance <= 0) return;
    const first = start.get();
    const actual = resolved.get();
    if (initiallyOpen && first === null) {
      const previous = openingFrame.get();
      if (previous !== null) {
        const gap = timestamp - previous;
        openingSamples.modify((values) => {
          "worklet";
          values.push(gap);
          return values;
        });
      }
      openingFrame.set(timestamp);
    }
    if (!actual) return;
    if (first === null || actual !== measuring.get()) {
      measuring.set(actual);
      motionStart.set(null);
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
    const motion = motionStart.get();
    const delta = motion === null ? timestamp - first : timeSincePreviousFrame;
    if (delta !== null) {
      intervals.modify((values) => {
        "worklet";
        values.push(delta);
        return values;
      });
    }
    // Every tier moves by the same distance on the first command, then traverses the rest
    // over ten seconds. Include the first-command latency in the original window separately.
    const firstOffset = (distance * DISPLAY_FRAME_MS) / GLASS_SCROLL_MS;
    if (motion === null) {
      motionStart.set(timestamp);
      scrollTo(ref, 0, firstOffset, false);
      return;
    }
    const elapsed = timestamp - motion;
    const offset = firstOffset + (distance - firstOffset) * Math.min(elapsed / GLASS_SCROLL_MS, 1);
    scrollTo(ref, 0, offset, false);
    if (elapsed >= GLASS_SCROLL_MS) {
      done.set(true);
      scheduleOnRN(finish, intervals.get(), actual, openingSamples.get());
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
