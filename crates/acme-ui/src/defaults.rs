//! Layer 6 of the library's customization (docs/library.md): the variant, size, tone, shape,
//! ratio or layout a component takes when the app gives it none. The web libraries' `Defaults`,
//! Compose's and React Native's do the same, for the same components and options.
//!
//! GPUI has no context that reaches a part of the window and the overlays opened from it, so
//! the defaults apply to the whole app, as the theme does.

use gpui_kit::{App, Global};

use crate::{
    AvatarSize, BadgeTone, BannerTone, ButtonVariant, ControlSize, IconSize, MediaCardLayout,
    SkeletonShape, SpinnerSize, TextTone, TextVariant, ThumbnailRatio,
};

/// The defaults of an [`Avatar`](crate::Avatar).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct AvatarDefaults {
    pub size: Option<AvatarSize>,
}

/// The defaults of an [`AvatarStack`](crate::AvatarStack).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct AvatarStackDefaults {
    pub size: Option<AvatarSize>,
}

/// The defaults of a [`Badge`](crate::Badge).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BadgeDefaults {
    pub tone: Option<BadgeTone>,
}

/// The defaults of a [`Banner`](crate::Banner).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BannerDefaults {
    pub tone: Option<BannerTone>,
}

/// The defaults of a [`button`](crate::button).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ButtonDefaults {
    pub variant: Option<ButtonVariant>,
    pub size: Option<ControlSize>,
}

/// The defaults of an [`icon`](crate::icon).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct IconDefaults {
    pub size: Option<IconSize>,
}

/// The defaults of an [`icon_button`](crate::icon_button).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct IconButtonDefaults {
    pub variant: Option<ButtonVariant>,
    pub size: Option<ControlSize>,
}

/// The defaults of a [`MediaCard`](crate::MediaCard).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct MediaCardDefaults {
    pub layout: Option<MediaCardLayout>,
}

/// The defaults of a [`Skeleton`](crate::Skeleton).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct SkeletonDefaults {
    pub shape: Option<SkeletonShape>,
}

/// The defaults of a [`spinner`](crate::spinner).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct SpinnerDefaults {
    pub size: Option<SpinnerSize>,
}

/// The defaults of a [`text`](crate::text).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TextDefaults {
    pub variant: Option<TextVariant>,
    pub tone: Option<TextTone>,
}

/// The defaults of a [`Thumbnail`](crate::Thumbnail).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ThumbnailDefaults {
    pub ratio: Option<ThumbnailRatio>,
}

/// What the components take for an option they are given no value for. An option left `None`
/// keeps the component's own default. Register them with [`set_defaults`]:
///
/// ```ignore
/// set_defaults(
///     Defaults {
///         button: ButtonDefaults { size: Some(ControlSize::Lg), ..Default::default() },
///         ..Default::default()
///     },
///     cx,
/// );
/// ```
///
/// A value the app gives a component wins. The parts a component draws itself, such as a
/// banner's action, keep their own options.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Defaults {
    pub avatar: AvatarDefaults,
    pub avatar_stack: AvatarStackDefaults,
    pub badge: BadgeDefaults,
    pub banner: BannerDefaults,
    pub button: ButtonDefaults,
    pub icon: IconDefaults,
    pub icon_button: IconButtonDefaults,
    pub media_card: MediaCardDefaults,
    pub skeleton: SkeletonDefaults,
    pub spinner: SpinnerDefaults,
    pub text: TextDefaults,
    pub thumbnail: ThumbnailDefaults,
}

impl Global for Defaults {}

/// Registers the defaults the components take from the next frame on, in place of the ones
/// registered before, and redraws the windows.
pub fn set_defaults(defaults: Defaults, cx: &mut App) {
    cx.set_global(defaults);
    cx.refresh_windows();
}

/// The defaults in effect: the registered ones, or none.
pub fn defaults(cx: &App) -> Defaults {
    cx.try_global::<Defaults>().copied().unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::{
        AvatarDefaults, AvatarStackDefaults, BadgeDefaults, BannerDefaults, ButtonDefaults,
        Defaults, IconButtonDefaults, IconDefaults, MediaCardDefaults, SkeletonDefaults,
        SpinnerDefaults, TextDefaults, ThumbnailDefaults,
    };

    /// An option whose values the contract lists one by one, short of `surface`, which only the
    /// touch clients have: the web libraries' `Defaults` covers the same ones.
    const ENUMERATED: [&str; 6] = ["variant", "size", "tone", "shape", "ratio", "layout"];

    /// The options of each component in `Defaults`, by the contract's names. The pattern names
    /// every field, so a field added to `Defaults` does not compile until it is listed here.
    fn listed() -> BTreeMap<&'static str, Vec<&'static str>> {
        let Defaults {
            avatar: AvatarDefaults { size: _ },
            avatar_stack: AvatarStackDefaults { size: _ },
            badge: BadgeDefaults { tone: _ },
            banner: BannerDefaults { tone: _ },
            button:
                ButtonDefaults {
                    variant: _,
                    size: _,
                },
            icon: IconDefaults { size: _ },
            icon_button:
                IconButtonDefaults {
                    variant: _,
                    size: _,
                },
            media_card: MediaCardDefaults { layout: _ },
            skeleton: SkeletonDefaults { shape: _ },
            spinner: SpinnerDefaults { size: _ },
            text: TextDefaults {
                variant: _,
                tone: _,
            },
            thumbnail: ThumbnailDefaults { ratio: _ },
        } = Defaults::default();
        BTreeMap::from([
            ("Avatar", vec!["size"]),
            ("AvatarStack", vec!["size"]),
            ("Badge", vec!["tone"]),
            ("Banner", vec!["tone"]),
            ("Button", vec!["size", "variant"]),
            ("Icon", vec!["size"]),
            ("IconButton", vec!["size", "variant"]),
            ("MediaCard", vec!["layout"]),
            ("Skeleton", vec!["shape"]),
            ("Spinner", vec!["size"]),
            ("Text", vec!["tone", "variant"]),
            ("Thumbnail", vec!["ratio"]),
        ])
    }

    #[test]
    fn every_enumerated_option_of_a_gpui_component_can_be_given_a_default() {
        // Tests run in the crate's directory, two below the one design/ is in.
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../design/components.json");
        let contract: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(path).expect("the contract is readable"))
                .expect("the contract is JSON");
        let mut expected = BTreeMap::new();
        for component in contract["components"]
            .as_array()
            .expect("a list of components")
        {
            if component["clients"].get("desktop-gpui").is_none() {
                continue;
            }
            let mut options: Vec<&str> = ENUMERATED
                .into_iter()
                .filter(|option| component["options"][option].is_array())
                .collect();
            options.sort_unstable();
            if !options.is_empty() {
                expected.insert(component["name"].as_str().expect("a name"), options);
            }
        }
        assert_eq!(listed(), expected);
    }
}
