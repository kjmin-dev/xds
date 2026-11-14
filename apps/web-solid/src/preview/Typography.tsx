import { typography } from "@acme/tokens";
import { Text, type TextVariant } from "@acme/ui-solid";
import { For } from "solid-js";
import { kebab, Row } from "./shared.tsx";

const TEXT_VARIANTS = Object.keys(typography) as (keyof typeof typography)[];

export function TypographySection() {
  return (
    <For each={TEXT_VARIANTS}>
      {(name) => (
        <Row label={`${kebab(name)} ${typography[name].fontSize}`}>
          <Text variant={kebab(name) as TextVariant} as="span">
            다람쥐 헌 쳇바퀴에 타고파. The quick brown fox 123
          </Text>
        </Row>
      )}
    </For>
  );
}
