const SIZE = {
  sm: "size-acme-spinner-sm",
  md: "size-acme-spinner-md",
  lg: "size-acme-spinner-lg",
} as const;

export type SpinnerSize = keyof typeof SIZE;

export type SpinnerBaseProps = {
  size?: SpinnerSize;
  /** Announces the spinner. Leave it out next to text that already says what is happening. */
  label?: string;
};

/** The class of the spinner's ring. Its wrapper is `inline-flex shrink-0`. */
export function spinnerClass(size: SpinnerSize = "md"): string {
  // People who ask for less motion get a slow pulse instead of a spin, not a frozen ring.
  return `${SIZE[size]} animate-spin motion-reduce:animate-pulse`;
}
