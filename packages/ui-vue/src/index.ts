// Acme's web components for Vue. Apps import from here and from nowhere else, so the parts
// underneath (Zag.js for behavior, @acme/ui-core for the classes and the stylesheet) can change
// without touching a screen.
//
// The React components are in @acme/ui, the Solid ones in @acme/ui-solid, the Svelte ones in
// @acme/ui-svelte, the React Native ones in @acme/ui-native, the GPUI ones in the acme-ui crate and
// the Compose ones under kotlin/ui. All of them take the same variants, sizes and tones, and draw
// them from the same design tokens. Where the React components take an element, these take a slot
// of the same name (`children` is the default slot), and where they take `onChange` with `value`,
// `checked` or `expanded`, these take `v-model` of that name: `v-model:checked`.

export type { IconName, IconSize, TextTone, TextVariant } from "@acme/ui-core";
export { default as Accordion, type AccordionItem, type AccordionProps } from "./Accordion.vue";
export { default as Avatar, type AvatarProps, type AvatarSize } from "./Avatar.vue";
export { default as AvatarStack, type AvatarStackProps } from "./AvatarStack.vue";
export { default as Badge, type BadgeProps, type BadgeTone } from "./Badge.vue";
export { default as Banner, type BannerProps, type BannerTone } from "./Banner.vue";
export { default as Button, type ButtonProps } from "./Button.vue";
export type { ButtonVariant, ControlSize } from "@acme/ui-core";
export { default as Card, type CardProps } from "./Card.vue";
export { default as Checkbox, type CheckboxProps } from "./Checkbox.vue";
export { default as Chip, type ChipProps } from "./Chip.vue";
export { default as ChipBar, type ChipBarProps } from "./ChipBar.vue";
export { default as CountBadge, type CountBadgeProps } from "./CountBadge.vue";
export { default as DatePicker, type DatePickerProps, type IsoDate } from "./DatePicker.vue";
export {
  type DateRange,
  default as DateRangePicker,
  type DateRangePickerProps,
} from "./DateRangePicker.vue";
export { default as Dialog, type DialogProps } from "./Dialog.vue";
export { default as Divider } from "./Divider.vue";
export { default as EmptyState, type EmptyStateProps } from "./EmptyState.vue";
export { default as Icon, type IconProps } from "./Icon.vue";
export { default as IconButton, type IconButtonProps } from "./IconButton.vue";
export { default as ListRow, type ListRowProps } from "./ListRow.vue";
export { default as MediaCard, type MediaCardProps } from "./MediaCard.vue";
export { default as Menu, type MenuItem, type MenuProps } from "./Menu.vue";
export { default as ProgressBar, type ProgressBarProps } from "./ProgressBar.vue";
export { default as RadioGroup, type RadioGroupProps, type RadioOption } from "./RadioGroup.vue";
export { default as SearchField, type SearchFieldProps } from "./SearchField.vue";
export { default as SectionHeader, type SectionHeaderProps } from "./SectionHeader.vue";
export { default as SegmentedControl, type SegmentedControlProps } from "./SegmentedControl.vue";
export { default as Select, type SelectOption, type SelectProps } from "./Select.vue";
export {
  default as Sidebar,
  type SidebarItem,
  type SidebarProps,
  type SidebarSection,
} from "./Sidebar.vue";
export { default as Skeleton, type SkeletonProps } from "./Skeleton.vue";
export { default as Slider, type SliderProps } from "./Slider.vue";
export { default as Spinner, type SpinnerProps } from "./Spinner.vue";
export { default as Switch, type SwitchProps } from "./Switch.vue";
export { default as Tabs, type TabsProps } from "./Tabs.vue";
export { default as Text, type TextProps } from "./Text.vue";
export { default as TextField, type TextFieldProps } from "./TextField.vue";
export { default as Thumbnail, type ThumbnailProps, type ThumbnailRatio } from "./Thumbnail.vue";
export { default as Toast, type ToastProps } from "./Toast.vue";
export { default as Tooltip, type TooltipProps } from "./Tooltip.vue";
