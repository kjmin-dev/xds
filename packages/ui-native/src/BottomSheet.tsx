import { motion, radius, shadow, space } from "@acme/tokens";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "./motion.ts";
import { Text } from "./Text.tsx";
import { useColors } from "./theme.ts";

export type BottomSheetProps = {
  open: boolean;
  /** Called when the person dismisses the sheet: a tap outside, a drag down, the back button. */
  onClose: () => void;
  title?: string;
  /** What a screen reader says for the area outside the sheet. */
  closeLabel?: string;
  children: ReactNode;
};

/**
 * A panel that slides up over the screen for a short task or a set of choices, and leaves the
 * screen behind it in place. It floats: a margin separates it from the screen edges, and all
 * four corners are rounded.
 *
 * A drag down anywhere on it, a button included, moves it with the finger: past a quarter of
 * its height, or on a flick, it closes, and otherwise it goes back. A press on a button is still
 * a press. A control that keeps its drags, as a slider does, keeps them here too, and so does a
 * list that scrolls.
 */
export function BottomSheet(props: BottomSheetProps) {
  return <Sheet {...props} tall={false} />;
}

/**
 * A BottomSheet that takes most of the screen's height whatever its content's, for a list that
 * scrolls inside it: the content's column fills what the title leaves, so give the list
 * `flex: 1`. As in a Menu's sheet, a list that scrolls keeps the drags that start on it, and the
 * sheet is dragged by its handle, its title and what is around the list.
 */
export function TallSheet(props: BottomSheetProps) {
  return <Sheet {...props} tall />;
}

function Sheet({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  tall,
}: BottomSheetProps & { tall: boolean }) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // 0 is fully open, 1 fully off screen. The modal stays mounted until the way out has played.
  const progress = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(windowHeight);

  // Each drag that let go asking to close counts here, so that the effect below runs again
  // even when the owner keeps the sheet open, and puts it back in place.
  const [releases, setReleases] = useState(0);

  useEffect(() => {
    if (open) setMounted(true);
    const [x1, y1, x2, y2] = open ? motion.easing.enter : motion.easing.exit;
    Animated.timing(progress, {
      toValue: open ? 0 : 1,
      // With less motion asked for, the sheet appears in place instead of sliding.
      duration: reduced ? 0 : motion.duration.slow,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, progress, reduced, releases]);

  const bottom = Math.max(insets.bottom, space[2]);
  // A tall sheet stops short of the status bar, with the margin it keeps from the other edges.
  const tallHeight = Math.min(
    windowHeight * TALL_SHARE,
    windowHeight - insets.top - space[2] - bottom,
  );
  // How far the sheet moves from open to gone, which a drag divides to move `progress`.
  const travel = height + insets.bottom + space[4];
  // The responder is created once, so it reads what changes through refs.
  const latest = useRef({ travel, height, reduced, onClose });
  latest.current = { travel, height, reduced, onClose };
  const drag = useRef({
    // Where `progress` was when the sheet took the gesture: it may still be rising.
    from: 0,
    // Whether the gesture moves the sheet: unknown until the finger has gone DRAG_SLOP.
    down: undefined as boolean | undefined,
    // Whether the sheet has seen the gesture move since it was granted.
    moved: false,
  }).current;
  const pan = useRef(
    PanResponder.create({
      // The Modal around the sheet takes every touch nothing inside it takes, and then never
      // asks inside again while the finger moves, so the sheet takes the touch as it starts.
      // A control or a list in the sheet takes its own first, being deeper.
      onStartShouldSetPanResponder: () => {
        drag.down = undefined;
        return true;
      },
      // A drag that starts on a control (a button, a row) moves the sheet once it is plainly
      // a drag down. A list that scrolls keeps its own (see MenuList).
      onMoveShouldSetPanResponder: (_, gesture) => {
        const down = isDragDown(gesture);
        if (down) drag.down = true;
        return down;
      },
      // A drag the sheet took from a control is the sheet's alone. A touch it took as it started
      // may be on a scroll view the owner put in the sheet, which it leaves free to scroll.
      onShouldBlockNativeResponder: () => drag.down === true,
      // React Native grants before it asks the current responder to let go, so this may run for
      // a gesture the sheet then does not get: what the sheet does waits for the first move.
      onPanResponderGrant: () => {
        drag.moved = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (!drag.moved) {
          drag.moved = true;
          drag.from = 0;
          progress.stopAnimation((value) => {
            drag.from = value;
          });
        }
        if (drag.down === undefined && Math.hypot(gesture.dx, gesture.dy) > DRAG_SLOP)
          drag.down = isDragDown(gesture);
        if (!drag.down) return;
        const { travel } = latest.current;
        progress.setValue(clamp(drag.from + Math.max(0, gesture.dy) / travel));
      },
      // Once the sheet moves with the finger, nothing else takes the gesture from it.
      onPanResponderTerminationRequest: () => drag.down !== true,
      onPanResponderRelease: (_, gesture) => {
        if (!drag.down) return;
        // A quarter of the way down, or a quick flick, is a decision to close.
        const { height, reduced, onClose } = latest.current;
        if (gesture.dy > height / 4 || gesture.vy > FLICK) {
          setReleases((count) => count + 1);
          onClose();
        } else {
          settle(progress, reduced);
        }
      },
      onPanResponderTerminate: () => {
        if (drag.down) settle(progress, latest.current.reduced);
      },
    }),
  ).current;

  if (!mounted) return null;
  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.scrim,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        <Pressable
          role="button"
          aria-label={closeLabel}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        // React Native 0.88 turns `aria-modal` into VoiceOver's modal flag on a Pressable only,
        // not on a View, so the sheet keeps the older prop.
        accessibilityViewIsModal
        {...pan.panHandlers}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          {
            bottom,
            ...(tall && { height: tallHeight }),
            backgroundColor: colors.sheetBackground,
            transform: [
              {
                // Far enough to clear the margin below it as well.
                translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }),
              },
            ],
          },
        ]}
      >
        <View style={styles.grip}>
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
        </View>
        <View style={[styles.content, tall && styles.fill]}>
          {title && (
            <Text variant="heading" heading>
              {title}
            </Text>
          )}
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

/**
 * The responder handlers for a View inside a list in a sheet, around what the list scrolls. The
 * sheet around the list moves with any drag down, a drag that starts on a row included. A list
 * that `scrolls` keeps the drags that start on it instead, even at its top: Android's scroll view
 * takes them for itself before the sheet could ask, and both systems then agree.
 */
export function useListDrags(scrolls: () => boolean) {
  // The handlers are made once, so they call the latest `scrolls`.
  const latest = useRef(scrolls);
  latest.current = scrolls;
  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current(),
      onMoveShouldSetPanResponder: (_, gesture) =>
        latest.current() && Math.abs(gesture.dy) > DRAG_SLOP,
      onPanResponderTerminationRequest: () => !latest.current(),
      // The scroll view scrolls by itself; this only keeps the drag from the sheet.
      onShouldBlockNativeResponder: () => false,
    }),
  ).current.panHandlers;
}

/** How much of the screen's height a TallSheet takes, as Compose's tall sheet does. */
const TALL_SHARE = 0.9;

/** How far a finger goes before the sheet decides whether it is being dragged, in points. */
export const DRAG_SLOP = 8;
/** A release faster than this, in points per millisecond, closes the sheet however far it went. */
const FLICK = 1;

type Gesture = { dx: number; dy: number };

/** Whether a gesture is a drag down: past the slop, and more down than sideways. */
export function isDragDown({ dx, dy }: Gesture) {
  return dy > DRAG_SLOP && dy > Math.abs(dx);
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Puts a sheet a drag moved back in place. */
function settle(progress: Animated.Value, reduced: boolean) {
  const [x1, y1, x2, y2] = motion.easing.standard;
  Animated.timing(progress, {
    toValue: 0,
    duration: reduced ? 0 : motion.duration.fast,
    easing: Easing.bezier(x1, y1, x2, y2),
    useNativeDriver: true,
  }).start();
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: space[2],
    right: space[2],
    borderRadius: radius.xl,
    // The whole shadow in one object: react-native-web builds a box-shadow from each on its own.
    shadowColor: shadow.overlay.color,
    shadowOffset: { width: shadow.overlay.offsetX, height: shadow.overlay.offsetY },
    shadowRadius: shadow.overlay.blur,
    shadowOpacity: 1,
    elevation: 16,
  },
  // The handle shows where to grab; the whole sheet can be dragged.
  grip: {
    alignItems: "center",
    paddingTop: space[2],
    paddingBottom: space[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
  },
  content: {
    gap: space[4],
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  fill: {
    flex: 1,
  },
});
