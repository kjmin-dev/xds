//! Draws what a theme looks like: a small mock of real UI in light and dark mode, built from
//! the colors the semantic tokens resolve to, plus the two ramps the theme supplies.

use std::collections::BTreeMap;

use crate::error::Result;
use crate::style::{Depth, Style, background, foreground};
use crate::theme::{Mode, Resolved, Rgb, Source, Theme};

/// The tokens the preview shows, with the name the plain listing gives each.
pub const ROLES: &[(&str, &str)] = &[
    ("page", "color.background.base"),
    ("surface", "color.background.surface"),
    ("text", "color.text.primary"),
    ("secondary text", "color.text.secondary"),
    ("link", "color.text.accent"),
    ("border", "color.border.default"),
    ("primary button", "color.button.primary.background"),
    ("primary button text", "color.button.primary.text"),
    ("secondary button", "color.button.secondary.background"),
    ("secondary button text", "color.button.secondary.text"),
    ("accent badge", "color.badge.accent.background"),
    ("accent badge text", "color.badge.accent.text"),
    ("success", "color.status.success"),
    ("success tint", "color.status.success-subtle"),
    ("warning", "color.status.warning"),
    ("warning tint", "color.status.warning-subtle"),
    ("danger", "color.status.danger"),
    ("danger tint", "color.status.danger-subtle"),
    ("info", "color.status.info"),
    ("info tint", "color.status.info-subtle"),
];

/// Status badges: label, text color, background.
const STATUSES: [(&str, &str, &str); 4] = [
    (
        "Pass",
        "color.status.success",
        "color.status.success-subtle",
    ),
    (
        "Warn",
        "color.status.warning",
        "color.status.warning-subtle",
    ),
    ("Fail", "color.status.danger", "color.status.danger-subtle"),
    ("Info", "color.status.info", "color.status.info-subtle"),
];

/// Columns of one mode's panel. Two panels, a gap and a margin fit an 80-column terminal.
const PANEL: usize = 38;
/// Columns of text inside the card: the panel minus page padding, border and card padding.
const CONTENT: usize = PANEL - 8;
const GAP: &str = "  ";
const MARGIN: &str = " ";

/// Columns the side-by-side preview takes.
pub const SIDE_BY_SIDE_WIDTH: usize = MARGIN.len() + PANEL + GAP.len() + PANEL;
// The classic terminal width has to be enough for the full preview.
const _: () = assert!(SIDE_BY_SIDE_WIDTH < 80);

/// Columns the stacked and compact previews take.
pub const STACKED_WIDTH: usize = MARGIN.len() + PANEL;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Layout {
    /// Light and dark next to each other.
    SideBySide,
    /// Light above dark, for a narrow terminal.
    Stacked,
    /// One line per mode and the two ramps, for a short terminal.
    Compact,
}

impl Layout {
    /// Rows the layout takes.
    pub fn height(self) -> usize {
        match self {
            Self::SideBySide => PANEL_ROWS,
            Self::Stacked => PANEL_ROWS * 2,
            Self::Compact => 4,
        }
    }

    /// The richest layout that fits `columns`, and `rows` when the caller is limited in height.
    pub fn fit(columns: usize, rows: Option<usize>) -> Option<Self> {
        let fits = |layout: Self, width: usize| {
            // One spare column: a line that reaches the last column wraps in some terminals.
            columns > width && rows.is_none_or(|rows| rows >= layout.height())
        };
        [
            (Self::SideBySide, SIDE_BY_SIDE_WIDTH),
            (Self::Stacked, STACKED_WIDTH),
            (Self::Compact, STACKED_WIDTH),
        ]
        .into_iter()
        .find_map(|(layout, width)| fits(layout, width).then_some(layout))
    }
}

const PANEL_ROWS: usize = 13;

/// The colors of one mode, by token path.
struct Colors(BTreeMap<&'static str, Rgb>);

impl Colors {
    fn resolve(resolved: &Resolved, mode: Mode) -> Result<Self> {
        let colors = ROLES
            .iter()
            .map(|(_, token)| Ok((*token, resolved.color(mode, token)?)))
            .collect::<Result<_>>()?;
        Ok(Self(colors))
    }

    /// Only called with tokens from `ROLES`, all of which `resolve` filled in.
    fn get(&self, token: &str) -> Rgb {
        self.0[token]
    }
}

pub struct Preview {
    name: String,
    light: Colors,
    dark: Colors,
    accent: Vec<Rgb>,
    neutral: Vec<Rgb>,
}

/// A run of cells with one style.
struct Span {
    text: String,
    foreground: Rgb,
    background: Rgb,
    bold: bool,
    underline: bool,
}

/// One row of a panel. Every row ends up exactly `PANEL` cells wide.
struct Row {
    spans: Vec<Span>,
    width: usize,
}

impl Row {
    fn new() -> Self {
        Self {
            spans: Vec::new(),
            width: 0,
        }
    }

    fn text(mut self, text: &str, foreground: Rgb, background: Rgb) -> Self {
        self.width += text.chars().count();
        self.spans.push(Span {
            text: text.to_owned(),
            foreground,
            background,
            bold: false,
            underline: false,
        });
        self
    }

    fn bold(mut self) -> Self {
        if let Some(span) = self.spans.last_mut() {
            span.bold = true;
        }
        self
    }

    fn underline(mut self) -> Self {
        if let Some(span) = self.spans.last_mut() {
            span.underline = true;
        }
        self
    }

    fn fill(self, background: Rgb) -> Self {
        self.pad_to(PANEL, background)
    }

    fn pad_to(self, width: usize, background: Rgb) -> Self {
        let missing = width.saturating_sub(self.width);
        self.text(&" ".repeat(missing), background, background)
    }

    fn paint(&self, depth: Depth) -> String {
        let mut line = String::new();
        for span in &self.spans {
            line.push_str("\x1b[0;");
            if span.bold {
                line.push_str("1;");
            }
            if span.underline {
                line.push_str("4;");
            }
            line.push_str(&foreground(span.foreground, depth));
            line.push(';');
            line.push_str(&background(span.background, depth));
            line.push('m');
            line.push_str(&span.text);
        }
        line.push_str("\x1b[0m");
        line
    }
}

impl Preview {
    pub fn new(source: &Source<'_>, theme: &Theme) -> Result<Self> {
        let resolved = source.resolve(theme)?;
        Ok(Self {
            name: theme.name.clone(),
            light: Colors::resolve(&resolved, Mode::Light)?,
            dark: Colors::resolve(&resolved, Mode::Dark)?,
            accent: theme.ramp("accent"),
            neutral: theme.ramp("neutral"),
        })
    }

    fn colors(&self, mode: Mode) -> &Colors {
        match mode {
            Mode::Light => &self.light,
            Mode::Dark => &self.dark,
        }
    }

    /// The preview as lines for the terminal: colored when `style` allows it, hex values
    /// otherwise. `layout` only matters for the colored form.
    pub fn lines(&self, layout: Layout, style: Style) -> Vec<String> {
        if !style.color {
            return self.plain();
        }
        let paint = |row: &Row| row.paint(style.depth);
        match layout {
            Layout::SideBySide => {
                let (light, dark) = (self.panel(Mode::Light), self.panel(Mode::Dark));
                light
                    .iter()
                    .zip(&dark)
                    .map(|(light, dark)| format!("{MARGIN}{}{GAP}{}", paint(light), paint(dark)))
                    .collect()
            }
            Layout::Stacked => Mode::ALL
                .iter()
                .flat_map(|mode| self.panel(*mode))
                .map(|row| format!("{MARGIN}{}", paint(&row)))
                .collect(),
            Layout::Compact => {
                let mut lines: Vec<String> = Mode::ALL
                    .iter()
                    .map(|mode| format!("{MARGIN}{}", paint(&self.strip(*mode))))
                    .collect();
                // The ramps are the same in both modes; they sit on the light page color.
                let colors = self.colors(Mode::Light);
                for (label, ramp) in [("accent", &self.accent), ("neutral", &self.neutral)] {
                    lines.push(format!(
                        "{MARGIN}{}",
                        paint(&self.ramp_row(label, ramp, colors))
                    ));
                }
                lines
            }
        }
    }

    /// One mode: a page with a card on it and the two ramps below.
    fn panel(&self, mode: Mode) -> Vec<Row> {
        let colors = self.colors(mode);
        let page = colors.get("color.background.base");
        let surface = colors.get("color.background.surface");
        let border = colors.get("color.border.default");
        let text = colors.get("color.text.primary");
        let secondary = colors.get("color.text.secondary");

        let blank = || Row::new().fill(page);
        // A line of card content between the card's side borders.
        let card = |content: Row| {
            let mut row = Row::new()
                .text("  ", page, page)
                .text("│ ", border, surface);
            row.width += content.width;
            row.spans.extend(content.spans);
            row.pad_to(PANEL - 4, surface)
                .text(" │", border, surface)
                .fill(page)
        };
        let edge = |left: &str, right: &str| {
            Row::new()
                .text("  ", page, page)
                .text(
                    &format!("{left}{}{right}", "─".repeat(PANEL - 6)),
                    border,
                    surface,
                )
                .fill(page)
        };

        let mut title = Row::new()
            .text(&capitalize(&self.name), text, surface)
            .bold();
        let badge = " Accent ";
        title = title.pad_to(CONTENT - badge.len(), surface).text(
            badge,
            colors.get("color.badge.accent.text"),
            colors.get("color.badge.accent.background"),
        );

        let mut statuses = Row::new();
        for (index, (label, foreground, background)) in STATUSES.iter().enumerate() {
            if index > 0 {
                statuses = statuses.text("  ", surface, surface);
            }
            statuses = statuses.text(
                &format!(" {label} "),
                colors.get(foreground),
                colors.get(background),
            );
        }

        vec![
            Row::new()
                .text(&format!("  {}", mode.label()), secondary, page)
                .fill(page),
            edge("╭", "╮"),
            card(title),
            card(Row::new().text("Secondary text on a surface", secondary, surface)),
            card(Row::new()),
            card(self.controls(colors, surface)),
            card(Row::new().text(&"─".repeat(CONTENT), border, surface)),
            card(statuses),
            edge("╰", "╯"),
            blank(),
            self.ramp_row("accent", &self.accent, colors),
            self.ramp_row("neutral", &self.neutral, colors),
            blank(),
        ]
    }

    /// A primary button, a secondary button and a link, on `backdrop`.
    fn controls(&self, colors: &Colors, backdrop: Rgb) -> Row {
        Row::new()
            .text(
                " Primary ",
                colors.get("color.button.primary.text"),
                colors.get("color.button.primary.background"),
            )
            .bold()
            .text(" ", backdrop, backdrop)
            .text(
                " Secondary ",
                colors.get("color.button.secondary.text"),
                colors.get("color.button.secondary.background"),
            )
            .text("  ", backdrop, backdrop)
            .text("Link", colors.get("color.text.accent"), backdrop)
            .underline()
    }

    /// A whole mode on one line, for a terminal too short for the panels.
    fn strip(&self, mode: Mode) -> Row {
        let colors = self.colors(mode);
        let page = colors.get("color.background.base");
        let mut row = Row::new().text(
            &format!(" {:<6}", mode.label()),
            colors.get("color.text.secondary"),
            page,
        );
        let controls = self.controls(colors, page);
        row.width += controls.width;
        row.spans.extend(controls.spans);
        row.fill(page)
    }

    /// A ramp as a row of swatches from its lightest step to its darkest.
    fn ramp_row(&self, label: &str, ramp: &[Rgb], colors: &Colors) -> Row {
        let page = colors.get("color.background.base");
        let mut row = Row::new().text(
            &format!("  {label:<8}"),
            colors.get("color.text.secondary"),
            page,
        );
        // Two cells per step while they fit, so a swatch is roughly square.
        let room = PANEL - 2 - row.width;
        let cells = if ramp.len() * 2 <= room { "  " } else { " " };
        for step in ramp.iter().take(room / cells.len()) {
            row = row.text(cells, *step, *step);
        }
        row.fill(page)
    }

    /// The same information without color: hex values to read or copy.
    fn plain(&self) -> Vec<String> {
        let mut lines = Vec::new();
        for (label, ramp) in [("accent", &self.accent), ("neutral", &self.neutral)] {
            // Seven to a line keeps a 13-step ramp within 80 columns.
            for (index, chunk) in ramp.chunks(7).enumerate() {
                let label = if index == 0 { label } else { "" };
                let steps: Vec<String> = chunk.iter().map(|color| color.hex()).collect();
                lines.push(format!("  {label:<9}{}", steps.join(" ")));
            }
        }
        lines.push(format!("  {:<24}{:<10}{}", "", "light", "dark"));
        for (label, token) in ROLES {
            lines.push(format!(
                "  {label:<24}{:<10}{}",
                self.light.get(token).hex(),
                self.dark.get(token).hex()
            ));
        }
        lines
    }
}

fn capitalize(word: &str) -> String {
    let mut characters = word.chars();
    match characters.next() {
        Some(first) => first.to_uppercase().chain(characters).collect(),
        None => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::template::template;

    fn previews() -> Vec<Preview> {
        let source = Source::Embedded(template());
        let themes = source.themes().expect("the embedded themes parse");
        themes
            .iter()
            .map(|theme| Preview::new(&source, theme).expect("resolves"))
            .collect()
    }

    /// The number of cells a line takes once its escape sequences are removed.
    fn visible_width(line: &str) -> usize {
        let mut width = 0;
        let mut characters = line.chars();
        while let Some(character) = characters.next() {
            if character == '\x1b' {
                // Every sequence the preview writes ends in `m`.
                for next in characters.by_ref() {
                    if next == 'm' {
                        break;
                    }
                }
            } else {
                width += 1;
            }
        }
        width
    }

    #[test]
    fn every_row_of_a_panel_has_the_same_width() {
        for preview in previews() {
            for mode in Mode::ALL {
                let panel = preview.panel(mode);
                assert_eq!(panel.len(), PANEL_ROWS);
                for (index, row) in panel.iter().enumerate() {
                    assert_eq!(row.width, PANEL, "{} {mode:?} row {index}", preview.name);
                    let cells: usize = row.spans.iter().map(|span| span.text.chars().count()).sum();
                    assert_eq!(cells, PANEL, "{} {mode:?} row {index}", preview.name);
                }
            }
        }
    }

    #[test]
    fn each_layout_has_the_size_it_says() {
        let style = Style {
            color: true,
            depth: Depth::TrueColor,
        };
        for preview in previews() {
            for (layout, width) in [
                (Layout::SideBySide, SIDE_BY_SIDE_WIDTH),
                (Layout::Stacked, STACKED_WIDTH),
                (Layout::Compact, STACKED_WIDTH),
            ] {
                let lines = preview.lines(layout, style);
                assert_eq!(lines.len(), layout.height(), "{layout:?}");
                for line in &lines {
                    assert_eq!(visible_width(line), width, "{layout:?}");
                    assert!(line.ends_with("\x1b[0m"), "the line resets its colors");
                }
            }
        }
    }

    #[test]
    fn draws_with_the_resolved_colors_of_each_mode() {
        let source = Source::Embedded(template());
        let themes = source.themes().expect("the embedded themes parse");
        let ocean = themes
            .iter()
            .find(|theme| theme.name == "ocean")
            .expect("ocean exists");
        let resolved = source.resolve(ocean).expect("resolves");
        let preview = Preview::new(&source, ocean).expect("resolves");
        let text = preview
            .lines(
                Layout::SideBySide,
                Style {
                    color: true,
                    depth: Depth::TrueColor,
                },
            )
            .join("\n");
        for mode in Mode::ALL {
            let button = resolved
                .color(mode, "color.button.primary.background")
                .expect("resolves");
            let fill = format!("48;2;{};{};{}m Primary ", button.0, button.1, button.2);
            assert!(
                text.contains(&fill),
                "{mode:?}: the primary button uses the accent fill"
            );
        }
    }

    #[test]
    fn falls_back_to_hex_values_without_color() {
        for preview in previews() {
            let lines = preview.lines(Layout::SideBySide, Style::plain());
            assert!(lines.iter().all(|line| !line.contains('\x1b')));
            assert!(lines.iter().all(|line| line.chars().count() < 80));
            assert!(
                lines
                    .iter()
                    .any(|line| line.contains("primary button") && line.contains('#'))
            );
            assert_eq!(lines.len(), 4 + 1 + ROLES.len());
        }
    }

    #[test]
    fn picks_a_layout_that_fits() {
        assert_eq!(Layout::fit(80, None), Some(Layout::SideBySide));
        assert_eq!(Layout::fit(79, None), Some(Layout::Stacked));
        assert_eq!(Layout::fit(120, Some(13)), Some(Layout::SideBySide));
        assert_eq!(Layout::fit(120, Some(12)), Some(Layout::Compact));
        assert_eq!(Layout::fit(60, Some(30)), Some(Layout::Stacked));
        assert_eq!(Layout::fit(60, Some(10)), Some(Layout::Compact));
        assert_eq!(Layout::fit(30, None), None);
        assert_eq!(Layout::fit(120, Some(3)), None);
    }
}
