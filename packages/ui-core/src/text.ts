// Written out in full: Tailwind only generates the classes it can find as whole strings.
const VARIANT = {
  display: "text-acme-display",
  title: "text-acme-title",
  heading: "text-acme-heading",
  body: "text-acme-body",
  "body-strong": "text-acme-body-strong",
  label: "text-acme-label",
  detail: "text-acme-detail",
  footnote: "text-acme-footnote",
} as const;

const TONE = {
  primary: "text-acme-text-primary",
  secondary: "text-acme-text-secondary",
  accent: "text-acme-text-accent",
  danger: "text-acme-status-danger",
  success: "text-acme-status-success",
  warning: "text-acme-status-warning",
  /** Takes the color of the surrounding text. */
  inherit: "",
} as const;

export type TextVariant = keyof typeof VARIANT;
export type TextTone = keyof typeof TONE;

export type TextBaseProps = {
  /** What the text is for. Sets size, weight, line height and tracking together. */
  variant?: TextVariant;
  tone?: TextTone;
};

export function textClass({ variant = "body", tone = "primary" }: TextBaseProps = {}): string {
  return `${VARIANT[variant]} ${TONE[tone]}`;
}
