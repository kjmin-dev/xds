// The sections of the design preview, in the order of the React preview's. Each is a file in
// this directory; the shell in ../DesignPreview.tsx gives each its heading and its anchor
// (`/design#text-fields`).

import type { Component } from "solid-js";
import { AccordionSection } from "./Accordion.tsx";
import { BadgesSection } from "./Badges.tsx";
import { BannersSection } from "./Banners.tsx";
import { ButtonsSection } from "./Buttons.tsx";
import { CardSection } from "./Card.tsx";
import { ChipsSection } from "./Chips.tsx";
import { ColorsSection } from "./Colors.tsx";
import { ControlsSection } from "./Controls.tsx";
import { DialogSection } from "./Dialog.tsx";
import { EmptyStateSection } from "./EmptyState.tsx";
import { IconsSection } from "./Icons.tsx";
import { ListSection } from "./List.tsx";
import { MediaSection } from "./Media.tsx";
import { MenuSection } from "./Menu.tsx";
import { SelectionSection } from "./Selection.tsx";
import { SidebarSection } from "./Sidebar.tsx";
import { SkeletonSection } from "./Skeleton.tsx";
import { SpaceRadiusSizeSection } from "./SpaceRadiusSize.tsx";
import { TabsSection } from "./Tabs.tsx";
import { TextFieldsSection } from "./TextFields.tsx";
import { ToastSection } from "./Toast.tsx";
import { TypographySection } from "./Typography.tsx";

export const SECTIONS: readonly { title: string; Content: Component }[] = [
  { title: "Colors", Content: ColorsSection },
  { title: "Typography", Content: TypographySection },
  { title: "Space, radius, size", Content: SpaceRadiusSizeSection },
  { title: "Icons", Content: IconsSection },
  { title: "Buttons", Content: ButtonsSection },
  { title: "Text fields", Content: TextFieldsSection },
  { title: "Selection", Content: SelectionSection },
  { title: "Controls", Content: ControlsSection },
  { title: "Chips", Content: ChipsSection },
  { title: "Tabs", Content: TabsSection },
  { title: "Badges", Content: BadgesSection },
  { title: "Banners", Content: BannersSection },
  { title: "Card", Content: CardSection },
  { title: "Media", Content: MediaSection },
  { title: "List", Content: ListSection },
  { title: "Sidebar", Content: SidebarSection },
  { title: "Accordion", Content: AccordionSection },
  { title: "Menu", Content: MenuSection },
  { title: "Dialog", Content: DialogSection },
  { title: "Toast", Content: ToastSection },
  { title: "Skeleton", Content: SkeletonSection },
  { title: "Empty state", Content: EmptyStateSection },
];
