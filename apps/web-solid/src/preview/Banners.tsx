import { Banner, type BannerTone, Button } from "@acme/ui-solid";
import { createSignal, For, Show } from "solid-js";

const BANNER_TONES: BannerTone[] = ["info", "success", "warning", "danger"];

export function BannersSection() {
  const [dismissed, setDismissed] = createSignal(false);
  return (
    <>
      <For each={BANNER_TONES}>
        {(tone) => (
          <Banner tone={tone} title={tone}>
            Your changes are saved on this device. They sync when you are back online.
          </Banner>
        )}
      </For>
      <Show
        when={!dismissed()}
        fallback={
          <Button size="sm" onPress={() => setDismissed(false)}>
            Show the dismissed banner again
          </Button>
        }
      >
        <Banner
          tone="warning"
          title="Your trial ends in three days"
          action={{ label: "Choose a plan", onPress: () => {} }}
          onDismiss={() => setDismissed(true)}
        >
          After that the workspace becomes read-only until a plan is chosen.
        </Banner>
      </Show>
      <Banner tone="info" onDismiss={() => {}} dismissLabel="Dismiss the update notice">
        A new version is available.
      </Banner>
      <Banner tone="danger" action={{ label: "Try again", onPress: () => {} }}>
        The report could not be sent.
      </Banner>
    </>
  );
}
