// Acme's web components for Svelte. Apps import from here and from nowhere else, so the parts
// underneath (Zag.js for behavior, @acme/ui-core for the classes and the stylesheet) can change
// without touching a screen.
//
// The React components are in @acme/ui, the Solid ones in @acme/ui-solid, the Vue ones in
// @acme/ui-vue, the React Native ones in @acme/ui-native, the GPUI ones in the acme-ui crate and
// the Compose ones under kotlin/ui. All of them take the same variants, sizes and tones, and draw
// them from the same design tokens.

export type { IconName, IconSize, TextTone, TextVariant } from "@acme/ui-core";
export { default as Accordion, type AccordionItem, type AccordionProps } from "./Accordion.svelte";
export { default as Avatar, type AvatarProps, type AvatarSize } from "./Avatar.svelte";
export { default as AvatarStack, type AvatarStackProps } from "./AvatarStack.svelte";
export { default as Badge, type BadgeProps, type BadgeTone } from "./Badge.svelte";
export { default as Banner, type BannerProps, type BannerTone } from "./Banner.svelte";
export {
  default as Button,
  type ButtonProps,
  type ButtonVariant,
  type ControlSize,
} from "./Button.svelte";
export { default as Card, type CardProps } from "./Card.svelte";
export { default as Checkbox, type CheckboxProps } from "./Checkbox.svelte";
export { default as Chip, type ChipProps } from "./Chip.svelte";
export { default as ChipBar, type ChipBarProps } from "./ChipBar.svelte";
export { default as CountBadge, type CountBadgeProps } from "./CountBadge.svelte";
export { default as DatePicker, type DatePickerProps, type IsoDate } from "./DatePicker.svelte";
export {
  type DateRange,
  default as DateRangePicker,
  type DateRangePickerProps,
} from "./DateRangePicker.svelte";
export { type ComponentDefaults, default as Defaults, type DefaultsProps } from "./Defaults.svelte";
export { default as Dialog, type DialogProps } from "./Dialog.svelte";
export { default as Divider, type DividerProps } from "./Divider.svelte";
export { default as EmptyState, type EmptyStateProps } from "./EmptyState.svelte";
export { default as Icon, type IconProps } from "./Icon.svelte";
export { default as IconButton, type IconButtonProps } from "./IconButton.svelte";
export { default as ListRow, type ListRowProps } from "./ListRow.svelte";
export { default as MediaCard, type MediaCardProps } from "./MediaCard.svelte";
export { default as Menu, type MenuItem, type MenuProps } from "./Menu.svelte";
export { default as ProgressBar, type ProgressBarProps } from "./ProgressBar.svelte";
export { default as RadioGroup, type RadioGroupProps, type RadioOption } from "./RadioGroup.svelte";
export type { RootProps } from "./root.ts";
export { default as SearchField, type SearchFieldProps } from "./SearchField.svelte";
export { default as SectionHeader, type SectionHeaderProps } from "./SectionHeader.svelte";
export { default as SegmentedControl, type SegmentedControlProps } from "./SegmentedControl.svelte";
export { default as Select, type SelectOption, type SelectProps } from "./Select.svelte";
export {
  default as Sidebar,
  type SidebarItem,
  type SidebarProps,
  type SidebarSection,
} from "./Sidebar.svelte";
export { default as Skeleton, type SkeletonProps } from "./Skeleton.svelte";
export { default as Slider, type SliderProps } from "./Slider.svelte";
export { default as Spinner, type SpinnerProps } from "./Spinner.svelte";
export { default as Switch, type SwitchProps } from "./Switch.svelte";
export { default as Tabs, type TabsProps } from "./Tabs.svelte";
export { default as Text, type TextProps } from "./Text.svelte";
export { default as TextField, type TextFieldProps } from "./TextField.svelte";
export { default as Thumbnail, type ThumbnailProps, type ThumbnailRatio } from "./Thumbnail.svelte";
export { default as Toast, type ToastProps } from "./Toast.svelte";
export { default as Tooltip, type TooltipProps } from "./Tooltip.svelte";
