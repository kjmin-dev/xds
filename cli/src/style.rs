//! Whether to color the output, and with how many colors.

use std::env;
use std::io::{IsTerminal, stdout};

use crate::theme::Rgb;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Depth {
    /// 24-bit colors: the theme preview shows the exact token values.
    TrueColor,
    /// The 256-color palette, for terminals that would misread 24-bit sequences.
    Ansi256,
}

#[derive(Debug, Clone, Copy)]
pub struct Style {
    pub color: bool,
    pub depth: Depth,
}

impl Style {
    /// `--no-color` and `NO_COLOR` turn color off. Otherwise it is on when the output is a
    /// terminal, or when `FORCE_COLOR` or `CLICOLOR_FORCE` asks for it, which is how colored
    /// output is captured into a file.
    pub fn detect(no_color: bool) -> Self {
        let set = |name: &str| env::var_os(name).is_some_and(|value| !value.is_empty());
        let forced =
            |name: &str| env::var_os(name).is_some_and(|value| !value.is_empty() && value != "0");
        let color = if no_color || set("NO_COLOR") {
            false
        } else if forced("FORCE_COLOR") || forced("CLICOLOR_FORCE") {
            true
        } else {
            stdout().is_terminal() && env::var_os("TERM").is_none_or(|term| term != "dumb")
        };
        Self {
            color: color && terminal_takes_escapes(),
            depth: detect_depth(),
        }
    }

    #[cfg(test)]
    pub fn plain() -> Self {
        Self {
            color: false,
            depth: Depth::TrueColor,
        }
    }

    fn wrap(&self, code: &str, text: &str) -> String {
        if self.color {
            format!("\x1b[{code}m{text}\x1b[0m")
        } else {
            text.to_owned()
        }
    }

    pub fn bold(&self, text: &str) -> String {
        self.wrap("1", text)
    }

    pub fn dim(&self, text: &str) -> String {
        self.wrap("2", text)
    }

    pub fn green(&self, text: &str) -> String {
        self.wrap("32", text)
    }

    pub fn yellow(&self, text: &str) -> String {
        self.wrap("33", text)
    }

    pub fn red(&self, text: &str) -> String {
        self.wrap("31", text)
    }

    pub fn cyan(&self, text: &str) -> String {
        self.wrap("36", text)
    }

    /// Two cells filled with `color`, or nothing when color is off.
    pub fn swatch(&self, color: Rgb) -> String {
        if self.color {
            format!("\x1b[{}m  \x1b[0m", background(color, self.depth))
        } else {
            String::new()
        }
    }
}

fn detect_depth() -> Depth {
    let colorterm = env::var("COLORTERM").unwrap_or_default();
    if colorterm.contains("truecolor") || colorterm.contains("24bit") {
        return Depth::TrueColor;
    }
    // Terminals that take 24-bit colors do not all say so, and the variable is often lost over
    // ssh, so 24-bit is assumed. The exception is Apple's Terminal, which for most of its life
    // has garbled 24-bit sequences: it gets 256 colors unless it announced more above.
    if env::var("TERM_PROGRAM").is_ok_and(|program| program == "Apple_Terminal") {
        return Depth::Ansi256;
    }
    Depth::TrueColor
}

/// The old Windows console prints escape sequences as text unless it is switched over first.
#[cfg(windows)]
fn terminal_takes_escapes() -> bool {
    crossterm::ansi_support::supports_ansi()
}

#[cfg(not(windows))]
fn terminal_takes_escapes() -> bool {
    true
}

/// The SGR parameters that set the text color.
pub fn foreground(color: Rgb, depth: Depth) -> String {
    match depth {
        Depth::TrueColor => format!("38;2;{};{};{}", color.0, color.1, color.2),
        Depth::Ansi256 => format!("38;5;{}", ansi256(color)),
    }
}

/// The SGR parameters that set the background color.
pub fn background(color: Rgb, depth: Depth) -> String {
    match depth {
        Depth::TrueColor => format!("48;2;{};{};{}", color.0, color.1, color.2),
        Depth::Ansi256 => format!("48;5;{}", ansi256(color)),
    }
}

/// The closest entry of the xterm 256-color palette: its 6x6x6 color cube or its gray ramp.
fn ansi256(color: Rgb) -> u8 {
    const LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];
    let nearest_level = |channel: u8| {
        (0..6u8)
            .min_by_key(|&level| channel.abs_diff(LEVELS[level as usize]))
            .expect("six levels")
    };
    let distance = |other: Rgb| {
        let square = |a: u8, b: u8| u32::from(a.abs_diff(b)).pow(2);
        square(color.0, other.0) + square(color.1, other.1) + square(color.2, other.2)
    };

    let (red, green, blue) = (
        nearest_level(color.0),
        nearest_level(color.1),
        nearest_level(color.2),
    );
    let cube = Rgb(
        LEVELS[red as usize],
        LEVELS[green as usize],
        LEVELS[blue as usize],
    );

    // The gray ramp runs from 8 to 238 in steps of 10.
    let average = (u16::from(color.0) + u16::from(color.1) + u16::from(color.2)) / 3;
    let step = (average.saturating_sub(8) / 10).min(23) as u8;
    let gray = 8 + 10 * step;

    if distance(Rgb(gray, gray, gray)) < distance(cube) {
        232 + step
    } else {
        16 + 36 * red + 6 * green + blue
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_to_the_256_color_palette() {
        assert_eq!(ansi256(Rgb(0, 0, 0)), 16);
        assert_eq!(ansi256(Rgb(255, 255, 255)), 231);
        assert_eq!(ansi256(Rgb(255, 0, 0)), 196);
        // A neutral gray lands on the gray ramp, not on a tinted cube color.
        assert_eq!(ansi256(Rgb(128, 128, 128)), 244);
    }

    #[test]
    fn leaves_text_alone_without_color() {
        let style = Style::plain();
        assert_eq!(style.bold("x"), "x");
        assert_eq!(style.swatch(Rgb(1, 2, 3)), "");
    }
}
