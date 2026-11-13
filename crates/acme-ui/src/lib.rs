//! Acme's GPUI components and the bridge from design tokens to GPUI.
//!
//! GPUI Component supplies behavior (focus, text input, IME); this crate supplies Acme's look by
//! mapping `acme-tokens` onto it.

#![forbid(unsafe_code)]

mod components;
mod preview;
mod theme;

pub use components::{
    Badge, BadgeTone, Banner, BannerTone, ButtonVariant, ControlSize, TextField, button, card,
    divider, text,
};
pub use preview::DesignPreview;
pub use theme::{TypographyExt, color, font, init, mode, palette, set_mode};
