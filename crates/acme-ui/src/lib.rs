//! Acme's GPUI components and the bridge from design tokens to GPUI.
//!
//! GPUI Component supplies behavior (focus, text input, IME); this crate supplies Acme's look by
//! mapping `acme-tokens` onto it.

#![forbid(unsafe_code)]

mod components;
mod controls;
mod navigation;
mod overlays;
mod preview;
mod theme;

pub use components::{
    Badge, BadgeTone, Banner, BannerTone, Button, ButtonVariant, Card, ControlSize, CountBadge,
    EmptyState, MediaCard, MediaCardLayout, SearchField, SectionHeader, TextField, Thumbnail,
    ThumbnailRatio, button, card, divider, icon_button, text,
};
pub use controls::{
    Accordion, AccordionItem, Avatar, AvatarSize, AvatarStack, Chip, ChipBar, IconSize, ListRow,
    Person, ProgressBar, RadioGroup, RadioOption, SegmentedControl, Skeleton, SkeletonShape,
    Slider, SpinnerSize, TabItem, Tabs, checkbox, icon, icon_filled, initials, spinner, switch,
};
pub use navigation::{Sidebar, SidebarItem, SidebarSection};
pub use overlays::{
    Dialog, Menu, MenuAlign, MenuItem, Select, SelectOption, Toast, Tooltip, TooltipPlacement,
    tooltip,
};
pub use preview::{DesignPreview, PreviewOverlay};
pub use theme::{TypographyExt, color, font, init, mode, palette, set_mode};
