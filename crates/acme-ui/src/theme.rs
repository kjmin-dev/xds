use std::sync::OnceLock;

use acme_tokens as tokens;
use gpui_kit::component::{Theme, ThemeMode};
use gpui_kit::{
    App, Font, FontWeight, Hsla, Rgba, SharedString, Styled, WindowAppearance, font as font_family,
    px,
};

/// GPUI's name for the platform's UI font, San Francisco on macOS. GPUI Component draws in it
/// unless told otherwise.
const SYSTEM_UI_FONT: &str = ".SystemUIFont";

/// The family the components draw text in, picked by [`init`].
///
/// GPUI takes one family, not a CSS list, and when that family is missing it draws its own
/// fallback (Helvetica on macOS) at regular weight, whatever weight was asked for. So [`init`]
/// walks the token list once, as a browser does, and keeps the first family GPUI draws itself. It
/// lives in a static because [`font`] has no `App` to read it from.
static FONT_FAMILY: OnceLock<SharedString> = OnceLock::new();

/// Converts a token color into GPUI's color type.
pub fn color(color: tokens::Color) -> Hsla {
    Rgba {
        r: f32::from(color.r) / 255.0,
        g: f32::from(color.g) / 255.0,
        b: f32::from(color.b) / 255.0,
        a: color.a,
    }
    .into()
}

/// The UI typeface at a token weight.
pub fn font(weight: f32) -> Font {
    Font {
        weight: gpui_weight(weight),
        ..font_family(font_family_name())
    }
}

/// Applies a text role: size, weight and line height together.
pub trait TypographyExt: Styled + Sized {
    fn typography(self, style: tokens::Typography) -> Self {
        self.text_size(px(style.size))
            .font_weight(gpui_weight(style.weight))
            .line_height(px(style.line_height_px()))
    }
}

impl<T: Styled> TypographyExt for T {}

fn font_family_name() -> SharedString {
    FONT_FAMILY
        .get()
        .cloned()
        .unwrap_or_else(|| SYSTEM_UI_FONT.into())
}

/// The weight to ask GPUI for to draw a token weight.
///
/// On Apple platforms GPUI rates a face by Core Text's weight, converted with a table that puts
/// Medium at 530 rather than 500. For 500 it tries lighter faces first, as CSS matching does, so
/// Medium would draw as Regular. A request just above 500 draws Medium, which is what a browser
/// draws for 500. Regular, Semibold and Bold convert exactly.
fn gpui_weight(weight: f32) -> FontWeight {
    if cfg!(target_vendor = "apple") && weight == FontWeight::MEDIUM.0 {
        FontWeight(FontWeight::MEDIUM.0 + 1.0)
    } else {
        FontWeight(weight)
    }
}

/// Sets up GPUI Component and applies Acme's tokens to its theme. Call once, before opening
/// any window. The app starts in the system's appearance; [`set_mode`] overrides it.
pub fn init(cx: &mut App) {
    gpui_kit::init(cx);
    FONT_FAMILY
        .get_or_init(|| first_drawn(tokens::FONT_FAMILY_SANS, |family| draws(cx, family)).into());
    let mode = match cx.window_appearance() {
        WindowAppearance::Dark | WindowAppearance::VibrantDark => tokens::Mode::Dark,
        WindowAppearance::Light | WindowAppearance::VibrantLight => tokens::Mode::Light,
    };
    set_mode(mode, cx);
}

/// The first family of a CSS `font-family` list that `draws` says GPUI draws itself, under
/// GPUI's name. CSS's names for the platform's UI font become GPUI's, and CSS's generic families,
/// which name no font, are passed over. When none is drawn, the platform's UI font is.
fn first_drawn(families: &[&'static str], draws: impl Fn(&str) -> bool) -> &'static str {
    families
        .iter()
        .filter_map(|&family| match family {
            "-apple-system" | "BlinkMacSystemFont" | "system-ui" | "ui-sans-serif" => {
                Some(SYSTEM_UI_FONT)
            }
            "sans-serif" | "serif" | "monospace" | "cursive" | "fantasy" | "ui-serif"
            | "ui-monospace" | "ui-rounded" | "math" | "emoji" | "fangsong" => None,
            family => Some(family),
        })
        .find(|&family| draws(family))
        .unwrap_or(SYSTEM_UI_FONT)
}

/// Whether GPUI draws `family` itself rather than its fallback. A missing family resolves to the
/// fallback's font, which the text system then names by the fallback's family.
fn draws(cx: &App, family: &str) -> bool {
    let text_system = cx.text_system();
    let id = text_system.resolve_font(&font_family(family.to_owned()));
    text_system
        .get_font_for_id(id)
        .is_some_and(|font| font.family == *family)
}

/// The color mode the components draw in.
pub fn mode(cx: &App) -> tokens::Mode {
    if Theme::global(cx).is_dark() {
        tokens::Mode::Dark
    } else {
        tokens::Mode::Light
    }
}

/// The color tokens for the current mode.
pub fn palette(cx: &App) -> &'static tokens::Colors {
    tokens::colors(mode(cx))
}

/// Switches every component to light or dark.
pub fn set_mode(mode: tokens::Mode, cx: &mut App) {
    let theme_mode = match mode {
        tokens::Mode::Light => ThemeMode::Light,
        tokens::Mode::Dark => ThemeMode::Dark,
    };
    Theme::change(theme_mode, None, cx);

    let c = tokens::colors(mode);
    let theme = Theme::global_mut(cx);

    // GPUI Component paints this color under every window's root. Each view paints its own
    // background instead, so a window with a translucent or blurred backdrop keeps it.
    theme.tokens.background = gpui_kit::gpui::transparent_black().into();

    theme.font_family = font_family_name();
    theme.font_size = px(tokens::TYPOGRAPHY_BODY.size);
    theme.radius = px(tokens::RADIUS_MD);
    theme.radius_lg = px(tokens::RADIUS_LG);

    // GPUI Component keeps every color twice: as a plain color, and in `tokens` as a paint,
    // which is what most components draw with. Both are set, so nothing reads a stale default.
    macro_rules! paint {
        ($($field:ident = $token:expr;)+) => {$(
            let value = color($token);
            theme.$field = value;
            theme.tokens.$field = value.into();
        )+};
    }
    paint! {
        // Text and lines.
        foreground = c.text_primary;
        muted = c.control_default;
        muted_foreground = c.text_secondary;
        border = c.border_default;
        input = c.field_border;
        ring = c.border_focus;
        caret = c.text_primary;
        link = c.text_accent;
        link_hover = c.text_accent;
        link_active = c.text_accent;
        popover = c.background_raised;
        popover_foreground = c.text_primary;

        // Buttons, under both of the names GPUI Component has for each role.
        primary = c.button_primary_background;
        primary_hover = c.button_primary_background_hover;
        primary_active = c.button_primary_background_pressed;
        primary_foreground = c.button_primary_text;
        button_primary = c.button_primary_background;
        button_primary_hover = c.button_primary_background_hover;
        button_primary_active = c.button_primary_background_pressed;
        button_primary_foreground = c.button_primary_text;

        secondary = c.button_secondary_background;
        secondary_hover = c.button_secondary_background_hover;
        secondary_active = c.button_secondary_background_pressed;
        secondary_foreground = c.button_secondary_text;
        button_secondary = c.button_secondary_background;
        button_secondary_hover = c.button_secondary_background_hover;
        button_secondary_active = c.button_secondary_background_pressed;
        button_secondary_foreground = c.button_secondary_text;

        danger = c.button_danger_background;
        danger_hover = c.button_danger_background_hover;
        danger_active = c.button_danger_background_pressed;
        danger_foreground = c.button_danger_text;
        button_danger = c.button_danger_background;
        button_danger_hover = c.button_danger_background_hover;
        button_danger_active = c.button_danger_background_pressed;
        button_danger_foreground = c.button_danger_text;

        // What a ghost button and a hovered list row fill with.
        accent = c.button_ghost_background_hover;
        accent_foreground = c.button_ghost_text;

        // The switch and the checkbox. A checked checkbox takes `primary`, set above.
        switch = c.switch_track;
        switch_thumb = c.switch_thumb;

        success = c.status_success;
        success_foreground = c.background_base;
        warning = c.status_warning;
        warning_foreground = c.background_base;
        info = c.status_info;
        info_foreground = c.background_base;
    }
}

#[cfg(test)]
mod tests {
    use super::{SYSTEM_UI_FONT, first_drawn, gpui_weight};

    const FAMILIES: &[&str] = &[
        "Pretendard Variable",
        "Pretendard",
        "-apple-system",
        "system-ui",
        "Helvetica Neue",
        "sans-serif",
    ];

    #[test]
    fn takes_the_first_family_gpui_draws() {
        let drawn = |family: &str| family == "Pretendard" || family == "Helvetica Neue";
        assert_eq!(first_drawn(FAMILIES, drawn), "Pretendard");
        assert_eq!(
            first_drawn(FAMILIES, |family| family == "Helvetica Neue"),
            "Helvetica Neue"
        );
    }

    #[test]
    fn names_the_platform_font_as_gpui_does() {
        let drawn = |family: &str| family == SYSTEM_UI_FONT || family == "Helvetica Neue";
        assert_eq!(first_drawn(FAMILIES, drawn), SYSTEM_UI_FONT);
    }

    #[test]
    fn passes_over_generic_families() {
        let drawn = |family: &str| {
            assert_ne!(family, "sans-serif");
            false
        };
        assert_eq!(first_drawn(FAMILIES, drawn), SYSTEM_UI_FONT);
    }

    #[test]
    fn asks_for_medium_between_500_and_what_gpui_rates_it_on_apple_platforms() {
        let medium = gpui_weight(500.0).0;
        if cfg!(target_vendor = "apple") {
            assert!(medium > 500.0 && medium < 530.0);
        } else {
            assert_eq!(medium, 500.0);
        }
        for weight in [400.0, 600.0, 700.0] {
            assert_eq!(gpui_weight(weight).0, weight);
        }
    }
}
