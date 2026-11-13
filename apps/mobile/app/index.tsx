// The first screen of the app. Replace it with your own.

import { space } from "@acme/tokens";
import { Badge, Button, Card, Text, useColors } from "@acme/ui-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const colors = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.backgroundBase }]}>
      <Text variant="display" heading>
        Acme
      </Text>
      <Card
        title="Your app starts here"
        description="This screen is apps/mobile/app/index.tsx."
        actions={<Badge tone="accent" label="React Native" />}
      >
        <Text tone="secondary">Build it from the components in @acme/ui-native.</Text>
        <Button
          variant="primary"
          label="Open the design preview"
          onPress={() => router.push("/design")}
        />
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: space[4],
    gap: space[4],
  },
});
