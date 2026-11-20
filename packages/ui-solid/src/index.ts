// Acme's web components for Solid. Apps import from here and from nowhere else, so the parts
// underneath (Zag.js for behavior, @acme/ui-core for the classes and the stylesheet) can change
// without touching a screen.
//
// The React components are in @acme/ui, the Vue ones in @acme/ui-vue, the Svelte ones in
// @acme/ui-svelte, the React Native ones in @acme/ui-native, the GPUI ones in the acme-ui crate and
// the Compose ones under kotlin/ui. All of them take the same variants, sizes and tones, and draw
// them from the same design tokens.

// Every component takes `class` and `style` for its root element, which also carries the
// component's root part, `acme-` and its name in kebab case (`acme-icon-button`). `Defaults`
// gives the components inside it the options an app leaves out.

export type { IconName, IconSize, TextTone, TextVariant } from "@acme/ui-core";
export { Accordion, type AccordionItem, type AccordionProps } from "./Accordion.tsx";
export { Avatar, type AvatarProps, type AvatarSize } from "./Avatar.tsx";
export { AvatarStack, type AvatarStackProps } from "./AvatarStack.tsx";
export { Badge, type BadgeProps, type BadgeTone } from "./Badge.tsx";
export { Banner, type BannerProps, type BannerTone } from "./Banner.tsx";
export { Button, type ButtonProps, type ButtonVariant, type ControlSize } from "./Button.tsx";
export { Card, type CardProps } from "./Card.tsx";
export { Checkbox, type CheckboxProps } from "./Checkbox.tsx";
export { Chip, type ChipProps } from "./Chip.tsx";
export { ChipBar, type ChipBarProps } from "./ChipBar.tsx";
export { CountBadge, type CountBadgeProps } from "./CountBadge.tsx";
export { DatePicker, type DatePickerProps, type IsoDate } from "./DatePicker.tsx";
export { type DateRange, DateRangePicker, type DateRangePickerProps } from "./DateRangePicker.tsx";
export { type ComponentDefaults, Defaults, type DefaultsProps } from "./Defaults.tsx";
export { Dialog, type DialogProps } from "./Dialog.tsx";
export { Divider, type DividerProps } from "./Divider.tsx";
export { EmptyState, type EmptyStateProps } from "./EmptyState.tsx";
export { Icon, type IconProps } from "./Icon.tsx";
export { IconButton, type IconButtonProps } from "./IconButton.tsx";
export { ListRow, type ListRowProps } from "./ListRow.tsx";
export { MediaCard, type MediaCardProps } from "./MediaCard.tsx";
export { Menu, type MenuItem, type MenuProps } from "./Menu.tsx";
export { ProgressBar, type ProgressBarProps } from "./ProgressBar.tsx";
export { RadioGroup, type RadioGroupProps, type RadioOption } from "./RadioGroup.tsx";
export { SearchField, type SearchFieldProps } from "./SearchField.tsx";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader.tsx";
export { SegmentedControl, type SegmentedControlProps } from "./SegmentedControl.tsx";
export { Select, type SelectOption, type SelectProps } from "./Select.tsx";
export { Sidebar, type SidebarItem, type SidebarProps, type SidebarSection } from "./Sidebar.tsx";
export { Skeleton, type SkeletonProps } from "./Skeleton.tsx";
export { Slider, type SliderProps } from "./Slider.tsx";
export { Spinner, type SpinnerProps } from "./Spinner.tsx";
export { Switch, type SwitchProps } from "./Switch.tsx";
export { Tabs, type TabsProps } from "./Tabs.tsx";
export { Text, type TextProps } from "./Text.tsx";
export { TextField, type TextFieldProps } from "./TextField.tsx";
export { Thumbnail, type ThumbnailProps, type ThumbnailRatio } from "./Thumbnail.tsx";
export { Toast, type ToastProps } from "./Toast.tsx";
export { Tooltip, type TooltipProps } from "./Tooltip.tsx";
