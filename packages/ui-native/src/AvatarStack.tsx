import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Avatar, type AvatarSize, avatarSize, avatarText } from "./Avatar.tsx";
import { useDefaults } from "./defaults.ts";
import { themed, useColors, useControl, useTheme } from "./theme.ts";

export type AvatarStackPerson = {
  name: string;
  /** The address of a picture, as for Avatar. */
  src?: string | undefined;
};

export type AvatarStackProps = {
  people: readonly AvatarStackPerson[];
  /** How many avatars to draw. The people beyond that are counted in a last circle: "+3". */
  max?: number;
  size?: AvatarSize;
  /** What a screen reader says in place of everyone's name: "5 people are editing". */
  label?: string;
  /** Put on the component's root view, after its own style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Several people in the room of one: their avatars in a row, each lapping over the one before
 * it. A screen reader hears one image named after everyone, not an avatar at a time.
 */
export function AvatarStack({ people, max = 4, size: givenSize, label, style }: AvatarStackProps) {
  const defaults = useDefaults("AvatarStack");
  const size = givenSize ?? defaults.size ?? "md";

  const styles = useStyles();
  const colors = useColors();
  const { border, typography } = useTheme();
  // The ring around each avatar, which covers the edge of the one before it.
  const ringWidth = border.width.thick;
  const diameter = avatarSize(useControl(), size);
  const overlap = diameter / 4;
  const shown = people.slice(0, Math.max(0, max));
  const more = people.length - shown.length;
  const circles = shown.length + (more > 0 ? 1 : 0);
  // The ring is drawn around the avatar and outside its room: a negative margin as wide as the
  // ring takes it out of the layout, so the stack is as tall as one avatar and starts where one
  // would. Every circle after the first also moves back over a quarter of the one before it.
  const ring = (index: number) => [
    styles.ring,
    {
      borderColor: colors.avatarRing,
      backgroundColor: colors.avatarRing,
      marginStart: -ringWidth - (index > 0 ? overlap : 0),
    },
  ];
  return (
    <View
      accessible
      role="img"
      aria-label={label ?? people.map((person) => person.name).join(", ")}
      // Sized outright, so the stack neither stretches across a column nor needs an alignment
      // of its own in a row: the first circle whole, and what shows of each one after it.
      style={[
        {
          width: circles > 0 ? diameter + (circles - 1) * (diameter - overlap) : 0,
          height: diameter,
        },
        style,
      ]}
    >
      <View
        // Each avatar is an image of its own; inside the stack they would be heard twice.
        aria-hidden
        style={styles.row}
      >
        {shown.map((person, index) => (
          // Keyed by place: two people can share a name, and nothing else tells them apart.
          <View key={index} style={ring(index)}>
            <Avatar name={person.name} src={person.src} size={size} />
          </View>
        ))}
        {more > 0 && (
          <View style={ring(shown.length)}>
            <View
              style={[
                styles.more,
                {
                  width: diameter,
                  height: diameter,
                  backgroundColor: colors.avatarOverflowBackground,
                },
              ]}
            >
              <Text
                // Like the initials, the count stays the size the circle was made for.
                allowFontScaling={false}
                numberOfLines={1}
                style={[avatarText(typography, size), { color: colors.avatarOverflowText }]}
              >
                +{more}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = themed(({ radius, border }) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
    },
    ring: {
      margin: -border.width.thick,
      borderWidth: border.width.thick,
      borderRadius: radius.full,
    },
    more: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
    },
  }),
);
