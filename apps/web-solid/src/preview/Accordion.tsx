import { Accordion, Text } from "@acme/ui-solid";
import { createSignal } from "solid-js";

const QUESTIONS = [
  {
    value: "cancel",
    title: "Can I cancel at any time?",
    content: "Yes. The plan stays active until the end of the period you paid for.",
  },
  {
    value: "seats",
    title: "How are seats counted?",
    description: "Guests are free",
    content: "Each person with an account in the workspace takes a seat. Guests do not.",
  },
  {
    value: "invoice",
    title: "Where do I find my invoices?",
    content: "Under Settings, then Billing. Each invoice can be downloaded as a PDF.",
  },
];
const PREFERENCES = [
  {
    value: "notifications",
    title: "Notifications",
    description: "Mentions, replies and reminders",
    content: "Choose what you hear about, and whether by email or in the app.",
  },
  {
    value: "privacy",
    title: "Privacy",
    content: "Choose who can see your profile and your activity.",
  },
  {
    value: "language",
    title: "Language and region",
    content: "The language of the app, and how dates and numbers are written.",
  },
];

export function AccordionSection() {
  const [question, setQuestion] = createSignal<string[]>(["seats"]);
  const [preferences, setPreferences] = createSignal<string[]>(["notifications", "language"]);
  return (
    <div class="grid items-start gap-8 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <Text variant="label" tone="secondary">
          One at a time
        </Text>
        <Accordion items={QUESTIONS} expanded={question()} onChange={setQuestion} />
      </div>
      <div class="flex flex-col gap-2">
        <Text variant="label" tone="secondary">
          Several at once
        </Text>
        <Accordion
          items={PREFERENCES}
          expanded={preferences()}
          onChange={setPreferences}
          multiple
        />
      </div>
    </div>
  );
}
