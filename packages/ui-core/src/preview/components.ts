// The props of every web component as a screen passes them, whatever the framework: the
// shared props of ui-core, and the slots and callbacks each library adds to them. `N` is what
// the framework draws, such as React's ReactNode or Solid's Element. A preview names a
// component by its key here, and a renderer proves that its library takes these props. `N`
// appears only as a prop of the component itself, never inside a list item or an object: see
// model.ts.

import type { AccordionBaseProps, AccordionItemBase } from "../accordion.ts";
import type { AvatarStackBaseProps } from "../avatar-stack.ts";
import type { AvatarBaseProps } from "../avatar.ts";
import type { BadgeBaseProps } from "../badge.ts";
import type { BannerBaseProps } from "../banner.ts";
import type { ButtonBaseProps, IconButtonBaseProps } from "../button.ts";
import type { CardBaseProps } from "../card.ts";
import type { CheckboxBaseProps } from "../checkbox.ts";
import type { ChipBarBaseProps } from "../chip-bar.ts";
import type { ChipBaseProps } from "../chip.ts";
import type { CountBadgeBaseProps } from "../count-badge.ts";
import type { DialogBaseProps } from "../dialog.ts";
import type { EmptyStateBaseProps } from "../empty-state.ts";
import type { IconBaseProps } from "../icon.ts";
import type { ListRowBaseProps } from "../list-row.ts";
import type { MediaCardBaseProps } from "../media-card.ts";
import type { MenuBaseProps } from "../menu.ts";
import type { ProgressBarBaseProps } from "../progress-bar.ts";
import type { RadioGroupBaseProps } from "../radio-group.ts";
import type { SectionHeaderBaseProps } from "../section-header.ts";
import type { SegmentedControlBaseProps } from "../segmented-control.ts";
import type { SelectBaseProps } from "../select.ts";
import type { SidebarBaseProps } from "../sidebar.ts";
import type { SkeletonBaseProps } from "../skeleton.ts";
import type { SliderBaseProps } from "../slider.ts";
import type { SpinnerBaseProps } from "../spinner.ts";
import type { SwitchBaseProps } from "../switch.ts";
import type { TabsBaseProps } from "../tabs.ts";
import type { SearchFieldBaseProps, TextFieldBaseProps } from "../text-field.ts";
import type { TextBaseProps } from "../text.ts";
import type { ThumbnailBaseProps } from "../thumbnail.ts";
import type { ToastBaseProps } from "../toast.ts";
import type { TooltipBaseProps } from "../tooltip.ts";

/** A small action drawn as a link or a button, such as a banner's "Try again". */
type Action = { label: string; onPress: () => void };

/**
 * The props that an `onChange` controls: a component has at most one of them, and its
 * `onChange` gives that prop's next value. A Vue or Svelte library names its model the same
 * (`defineModel("checked")`, `checked = $bindable()`), so a renderer can pair the two.
 */
export type Controlled = "value" | "checked" | "expanded";

export interface Components<N> {
  Accordion: AccordionBaseProps & {
    items: readonly (AccordionItemBase & { content: string })[];
    onChange: (expanded: string[]) => void;
  };
  Avatar: AvatarBaseProps;
  AvatarStack: AvatarStackBaseProps;
  Badge: BadgeBaseProps & { children: N };
  Banner: BannerBaseProps & { action?: Action; onDismiss?: () => void; children: N };
  Button: ButtonBaseProps & { onPress?: () => void; children?: N };
  Card: CardBaseProps & {
    actions?: N;
    media?: N;
    onPress?: () => void;
    class?: string;
    children?: N;
  };
  Checkbox: CheckboxBaseProps & { onChange: (checked: boolean) => void };
  Chip: ChipBaseProps & { onPress?: () => void };
  ChipBar: ChipBarBaseProps & { children: N };
  CountBadge: CountBadgeBaseProps & { children?: N };
  Dialog: DialogBaseProps & { onClose: () => void; actions?: N; children?: N };
  Divider: Record<never, never>;
  EmptyState: EmptyStateBaseProps & { action?: N };
  Icon: IconBaseProps & { class?: string };
  IconButton: IconButtonBaseProps & { onPress?: () => void };
  ListRow: ListRowBaseProps & { leading?: N; trailing?: N; onPress?: () => void };
  MediaCard: MediaCardBaseProps & { leading?: N; action?: N; onPress?: () => void };
  Menu: MenuBaseProps & { trigger: N };
  ProgressBar: ProgressBarBaseProps;
  RadioGroup: RadioGroupBaseProps & { onChange: (value: string) => void };
  SearchField: SearchFieldBaseProps & {
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
  };
  SectionHeader: SectionHeaderBaseProps & { action?: Action };
  SegmentedControl: SegmentedControlBaseProps<string> & { onChange: (value: string) => void };
  Select: SelectBaseProps & { onChange: (value: string) => void };
  Sidebar: SidebarBaseProps & { onChange: (value: string) => void; header?: N; footer?: N };
  Skeleton: SkeletonBaseProps;
  Slider: SliderBaseProps & { onChange: (value: number) => void };
  Spinner: SpinnerBaseProps;
  Switch: SwitchBaseProps & { onChange: (checked: boolean) => void };
  Tabs: TabsBaseProps<string> & { onChange: (value: string) => void };
  Text: TextBaseProps & { as?: keyof HTMLElementTagNameMap; class?: string; children: N };
  TextField: TextFieldBaseProps & {
    onChange: (value: string) => void;
    leading?: N;
    trailing?: N;
  };
  Thumbnail: ThumbnailBaseProps;
  Toast: ToastBaseProps & { onClose: () => void };
  Tooltip: TooltipBaseProps & { children: N };
}

export type ComponentName = keyof Components<unknown>;

/**
 * The props of component `N` that a library component lacks, given the names of the props it
 * takes, or `never` when it takes them all. A renderer requires `never` for every component: a
 * props type admits more than it names, so its library could otherwise lack a prop the data
 * passes, which would then be dropped without a word.
 */
export type Lacking<N extends ComponentName, Taken extends PropertyKey> = Exclude<
  keyof Components<unknown>[N],
  Taken
>;
