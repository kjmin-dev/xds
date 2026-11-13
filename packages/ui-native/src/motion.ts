import { motion } from "@acme/tokens";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";

/** Whether the person asked the system for less motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (current) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      current = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

type Spring = { stiffness: number; damping: number };

/**
 * A spring token as React Native takes it. The token's damping is a ratio, where 1 does not
 * overshoot; React Native wants the coefficient, which for a mass of 1 is `2 × ratio × √stiffness`.
 */
export function spring({ stiffness, damping }: Spring) {
  return { stiffness, damping: 2 * damping * Math.sqrt(stiffness), mass: 1, useNativeDriver: true };
}

/**
 * Moves a value to `target` on a spring, or at once when the person asked for less motion.
 * Returns the animated value.
 */
export function useSpring(target: number, token: Spring = motion.spring.default): Animated.Value {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(target)).current;
  useEffect(() => {
    if (reduced) {
      value.setValue(target);
      return;
    }
    const animation = Animated.spring(value, { toValue: target, ...spring(token) });
    animation.start();
    return () => animation.stop();
  }, [reduced, target, token, value]);
  return value;
}
