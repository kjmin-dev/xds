import { Select, Slider } from "@acme/ui-solid";
import { createSignal } from "solid-js";
import { openOnLoad } from "./open.ts";

const PLANS = [
  { value: "free", label: "Free", description: "Up to 3 projects" },
  { value: "team", label: "Team", description: "Up to 20 people" },
  { value: "business", label: "Business", description: "Single sign-on and audit logs" },
  { value: "enterprise", label: "Enterprise", description: "A contract of your own" },
] as const;
const COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "Japan",
  "Korea",
  "Mexico",
  "Spain",
  "United Kingdom",
  "United States",
].map((name) => ({ value: name.toLowerCase().replace(/ /g, "-"), label: name }));
const TIME_ZONES = [
  { value: "utc", label: "Coordinated Universal Time" },
  { value: "seoul", label: "Seoul" },
  { value: "berlin", label: "Berlin" },
];

export function ControlsSection() {
  const [plan, setPlan] = createSignal<(typeof PLANS)[number]["value"]>("team");
  const [country, setCountry] = createSignal<string>();
  const [timeZone, setTimeZone] = createSignal<string>();
  const [volume, setVolume] = createSignal(60);
  const [fontSize, setFontSize] = createSignal(16);
  let select!: HTMLDivElement;
  openOnLoad("select", () => select);
  return (
    <>
      <div class="grid gap-4 sm:grid-cols-2">
        <div ref={(element) => (select = element)}>
          <Select
            label="Plan"
            options={PLANS}
            value={plan()}
            onChange={setPlan}
            description="Change it at any time."
          />
        </div>
        <Select
          label="Country"
          placeholder="Choose a country"
          options={COUNTRIES}
          value={country()}
          onChange={setCountry}
        />
        <Select
          label="Time zone"
          placeholder="Choose a time zone"
          options={TIME_ZONES}
          value={timeZone()}
          onChange={setTimeZone}
          error={timeZone() === undefined ? "Choose a time zone for the reminders." : undefined}
        />
        <Select
          label="Currency"
          options={[{ value: "eur", label: "Euro" }]}
          value="eur"
          onChange={() => {}}
          disabled
        />
      </div>
      <div class="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Slider label="Volume" value={volume()} onChange={setVolume} showValue />
        <Slider
          label="Font size"
          min={12}
          max={24}
          step={2}
          value={fontSize()}
          onChange={setFontSize}
          showValue
        />
        <Slider label="Brightness" value={volume()} onChange={setVolume} />
        <Slider label="Balance, locked" value={30} onChange={() => {}} disabled showValue />
      </div>
    </>
  );
}
