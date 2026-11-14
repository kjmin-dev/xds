//! Acme's GPUI components and the bridge from design tokens to GPUI.
//!
//! GPUI Component supplies behavior (focus, text input, IME); this crate supplies Acme's look by
//! mapping `acme-tokens` onto it.

#![forbid(unsafe_code)]

mod components;
mod controls;
mod preview;
mod theme;

pub use components::{
    Badge, BadgeTone, Banner, BannerTone, Button, ButtonVariant, Card, ControlSize, CountBadge,
    TextField, button, card, divider, text,
};
pub use controls::{
    Avatar, AvatarSize, AvatarStack, IconSize, ListRow, Person, ProgressBar, SegmentedControl,
    SpinnerSize, checkbox, icon, icon_filled, initials, spinner, switch,
};
pub use preview::DesignPreview;
pub use theme::{TypographyExt, color, font, init, mode, palette, set_mode};
