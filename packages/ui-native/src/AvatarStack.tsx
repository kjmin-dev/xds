import { border, radius } from "@acme/tokens";
import { StyleSheet, Text, View } from "react-native";
import { AVATAR_SIZE, AVATAR_TEXT, Avatar, type AvatarSize } from "./Avatar.tsx";
import { useColors } from "./theme.ts";

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
};

const RING = border.width.thick;

/**
 * Several people in the room of one: their avatars in a row, each lapping over the one before
 * it. A screen reader hears one image named after everyone, not an avatar at a time.
 */
export function AvatarStack({ people, max = 4, size = "md", label }: AvatarStackProps) {
  const colors = useColors();
  const diameter = AVATAR_SIZE[size];
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
      marginStart: -RING - (index > 0 ? overlap : 0),
    },
  ];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? people.map((person) => person.name).join(", ")}
      // Sized outright, so the stack neither stretches across a column nor needs an alignment
      // of its own in a row: the first circle whole, and what shows of each one after it.
      style={{
        width: circles > 0 ? diameter + (circles - 1) * (diameter - overlap) : 0,
        height: diameter,
      }}
    >
      <View
        // Each avatar is an image of its own; inside the stack they would be heard twice.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
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
                style={[AVATAR_TEXT[size], { color: colors.avatarOverflowText }]}
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  ring: {
    margin: -RING,
    borderWidth: RING,
    borderRadius: radius.full,
  },
  more: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
});
