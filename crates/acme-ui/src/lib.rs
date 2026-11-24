//! Acme's GPUI components and the bridge from design tokens to GPUI.
//!
//! GPUI Component supplies behavior (focus, text input, IME); this crate supplies Acme's look by
//! mapping `acme-tokens` onto it. The components draw with the theme registered with the app
//! ([`init`], [`set_theme`]) and take the defaults registered with it ([`set_defaults`]).

#![forbid(unsafe_code)]

mod components;
mod controls;
mod date_picker;
mod date_range_picker;
mod defaults;
mod navigation;
mod overlays;
mod preview;
mod theme;

pub use components::{
    Badge, BadgeTone, Banner, BannerTone, Button, ButtonVariant, Card, ControlSize, CountBadge,
    EmptyState, MediaCard, MediaCardLayout, SearchField, SectionHeader, Text, TextField, TextTone,
    TextVariant, Thumbnail, ThumbnailRatio, button, card, divider, icon_button, text,
};
pub use controls::{
    Accordion, AccordionItem, Avatar, AvatarSize, AvatarStack, Chip, ChipBar, IconElement,
    IconSize, ListRow, Person, ProgressBar, RadioGroup, RadioOption, SegmentedControl, Skeleton,
    SkeletonShape, Slider, Spinner, SpinnerSize, TabItem, Tabs, checkbox, icon, icon_filled,
    initials, spinner, switch,
};
pub use date_picker::DatePicker;
pub use date_range_picker::{DateRange, DateRangePicker};
pub use defaults::{
    AvatarDefaults, AvatarStackDefaults, BadgeDefaults, BannerDefaults, ButtonDefaults, Defaults,
    IconButtonDefaults, IconDefaults, MediaCardDefaults, SkeletonDefaults, SpinnerDefaults,
    TextDefaults, ThumbnailDefaults, defaults, set_defaults,
};
pub use navigation::{Sidebar, SidebarItem, SidebarSection};
pub use overlays::{
    Dialog, Menu, MenuAlign, MenuItem, Select, SelectOption, Toast, Tooltip, TooltipPlacement,
    tooltip,
};
pub use preview::{DesignPreview, PreviewOverlay};
pub use theme::{TypographyExt, color, font, init, mode, palette, set_mode, set_theme, theme};

/// The date a [`DatePicker`] and a [`DateRangePicker`] take and give, so an app needs no chrono of its own.
pub use chrono::NaiveDate;

/// The design tokens: the [`Theme`](tokens::Theme) type, the default theme and the icons, so an
/// app needs no dependency of its own on the tokens crate.
pub use acme_tokens as tokens;

/// The GPUI Kit these components are built for. GPUI keeps no compatibility between its
/// releases, so the components take and give GPUI's types of exactly this release; an app that
/// reaches GPUI through this path is always on it.
pub use gpui_kit;
