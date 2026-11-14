// What the web component libraries share, whatever their framework: the props that
// hold no framework nodes, the class recipes of the components, pure helpers, and the steps
// on the DOM that Zag leaves to each library, such as waiting for an overlay's exit animation.
// Its stylesheet, @acme/ui-core/styles.css, draws every component the recipes name.
//
// Nothing here may import a framework. A library takes a component's `<Name>BaseProps`, adds
// its own slots and callbacks, and gets its classes from the recipe, so every framework draws
// the component from one copy of its classes.

export {
  ACCORDION_PARTS,
  type AccordionBaseProps,
  type AccordionItemBase,
  focusTitleOnClick,
  setPanelOpen,
} from "./accordion.ts";
export { afterAnimations } from "./animation.ts";
export {
  AVATAR_SIZE,
  type AvatarBaseProps,
  type AvatarSize,
  avatarClass,
  avatarInitials,
  pictureClass,
} from "./avatar.ts";
export {
  type AvatarStackBaseProps,
  avatarStack,
  avatarStackClass,
  avatarStackItemClass,
  avatarStackRestClass,
} from "./avatar-stack.ts";
export { type BadgeBaseProps, type BadgeTone, badgeClass, badgeDotClass } from "./badge.ts";
export {
  BANNER_PARTS,
  type BannerBaseProps,
  type BannerTone,
  bannerClass,
  bannerIconClass,
  bannerIconPath,
  bannerRole,
} from "./banner.ts";
export {
  BUTTON_ICON,
  type ButtonBaseProps,
  type ButtonVariant,
  buttonClass,
  type ControlSize,
  ICON_BUTTON_BOX,
  type IconButtonBaseProps,
  isHeld,
} from "./button.ts";
export { CARD_PARTS, type CardBaseProps, cardClass, cardMediaClass } from "./card.ts";
export {
  CHECKBOX_MARK,
  type CheckboxBaseProps,
  checkboxBoxClass,
  checkboxClass,
  checkboxLabelClass,
  checkboxMarkClass,
} from "./checkbox.ts";
export { type ChipBaseProps, chipClass, chipIcon } from "./chip.ts";
export { type ChipBarBaseProps, chipBarClass } from "./chip-bar.ts";
export {
  type CountBadgeBaseProps,
  countBadgeAnchorClass,
  countBadgeClass,
  countBadgeText,
} from "./count-badge.ts";
export type { DialogBaseProps } from "./dialog.ts";
export { dividerClass } from "./divider.ts";
export { EMPTY_STATE_PARTS, type EmptyStateBaseProps } from "./empty-state.ts";
export { leaveEscapeToFields } from "./escape.ts";
export { focusWithoutRing } from "./focus.ts";
export { type IconBaseProps, type IconName, type IconSize, iconClass } from "./icon.ts";
export { initials } from "./initials.ts";
export {
  LIST_ROW_PARTS,
  type ListRowBaseProps,
  listRowClass,
  listRowDescriptionClass,
  listRowTitleClass,
  PRESSABLE_ROW,
} from "./list-row.ts";
export {
  MEDIA_CARD_PARTS,
  type MediaCardBaseProps,
  type MediaCardLayout,
  mediaCardContentClass,
  mediaCardIds,
  mediaCardThumbnailClass,
} from "./media-card.ts";
export {
  firstMenuValue,
  layoutRect,
  type MenuBaseProps,
  type MenuItem,
  menuItemClass,
  opensOnPress,
} from "./menu.ts";
export { keepListKeys, pageTarget } from "./page-keys.ts";
export {
  type ProgressBarBaseProps,
  progressBarClass,
  progressBarFillClass,
  progressPercent,
} from "./progress-bar.ts";
export type { RadioGroupBaseProps, RadioOption } from "./radio-group.ts";
export { SECTION_HEADER_PARTS, type SectionHeaderBaseProps } from "./section-header.ts";
export {
  type SegmentedControlBaseProps,
  segmentedControlClass,
  segmentedControlOptionClass,
  segmentedControlSegmentClass,
} from "./segmented-control.ts";
export { type SelectBaseProps, type SelectOption, selectOptionIds } from "./select.ts";
export {
  SIDEBAR_PARTS,
  type SidebarBaseProps,
  type SidebarItem,
  type SidebarSection,
  sidebarClass,
  sidebarCount,
  sidebarIconClass,
  sidebarRailButtonClass,
  sidebarSectionClass,
  sidebarTitleClass,
} from "./sidebar.ts";
export {
  type SkeletonBaseProps,
  type SkeletonShape,
  skeletonClass,
  skeletonSize,
} from "./skeleton.ts";
export {
  focusThumbOnPress,
  type SliderBaseProps,
  sliderArrowValue,
  sliderPageSize,
  sliderValueText,
} from "./slider.ts";
export { type SpinnerBaseProps, type SpinnerSize, spinnerClass } from "./spinner.ts";
export {
  PEER_FOCUS,
  type SwitchBaseProps,
  switchClass,
  switchLabelClass,
  switchThumbClass,
  switchTrackClass,
} from "./switch.ts";
export { type TabsBaseProps, tabStopIndex, tabsClass } from "./tabs.ts";
export { type TextBaseProps, type TextTone, type TextVariant, textClass } from "./text.ts";
export type { SearchFieldBaseProps, TextFieldBaseProps, TextFieldType } from "./text-field.ts";
export {
  THUMBNAIL_PARTS,
  type ThumbnailBaseProps,
  type ThumbnailRatio,
  thumbnailBadgeClass,
  thumbnailClass,
  thumbnailWatched,
} from "./thumbnail.ts";
export { TOAST_PARTS, type ToastAction, type ToastBaseProps } from "./toast.ts";
export { type TooltipBaseProps, tooltipEndSide } from "./tooltip.ts";
