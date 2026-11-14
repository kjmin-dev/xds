const TONE = {
  info: {
    surface: "bg-acme-banner-info-background",
    accent: "text-acme-banner-info-accent",
    // A circled "i".
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM10.9 11h2.2v6h-2.2v-6Z",
  },
  success: {
    surface: "bg-acme-banner-success-background",
    accent: "text-acme-banner-success-accent",
    // A circled check mark.
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.7-5.5 6a1 1 0 0 1-1.5 0l-2.4-2.6 1.5-1.4 1.6 1.8 4.8-5.2 1.5 1.4Z",
  },
  warning: {
    surface: "bg-acme-banner-warning-background",
    accent: "text-acme-banner-warning-accent",
    // A triangle with "!".
    icon: "M12 2.5 1.5 20.5h21L12 2.5Zm-1.1 6.5h2.2v6h-2.2V9Zm1.1 7.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z",
  },
  danger: {
    surface: "bg-acme-banner-danger-background",
    accent: "text-acme-banner-danger-accent",
    // A circled "!".
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 5h2.2v7h-2.2V7Zm1.1 8.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z",
  },
} as const;

export type BannerTone = keyof typeof TONE;

/** Banner's props in every framework, short of its message, its action and `onDismiss`. */
export type BannerBaseProps = {
  tone?: BannerTone;
  title?: string;
  /** Names the close control for assistive technology. */
  dismissLabel?: string;
};

export function bannerClass(tone: BannerTone = "info"): string {
  return `flex items-start gap-3 rounded-acme-md p-3 text-acme-banner-text ${TONE[tone].surface}`;
}

/** The class of the tone's icon, a 24 by 24 drawing of `bannerIconPath(tone)`. */
export function bannerIconClass(tone: BannerTone = "info"): string {
  return `mt-0.5 size-acme-icon-md shrink-0 ${TONE[tone].accent}`;
}

/** Each tone has its own icon shape, so the tone does not depend on color. */
export function bannerIconPath(tone: BannerTone = "info"): string {
  return TONE[tone].icon;
}

/** Problems interrupt a screen reader; `info` and `success` wait their turn. */
export function bannerRole(tone: BannerTone = "info"): "alert" | "status" {
  return tone === "danger" || tone === "warning" ? "alert" : "status";
}

export const BANNER_PARTS = {
  /** The title, the message and the action, beside the icon. */
  body: "flex min-w-0 flex-1 flex-col gap-0.5 text-acme-detail",
  title: "text-acme-label",
  action: "mt-2",
  // Pulled into the padding, so the cross lines up with the first line of text and a
  // pointer-sized close control does not make a one-line banner taller.
  dismiss: "-m-1 flex shrink-0",
} as const;
