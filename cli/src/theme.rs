//! Color themes, and the colors a theme ends up giving the semantic tokens.
//!
//! A theme is a file in `design/themes` that holds an accent ramp and a neutral ramp. Applying
//! one replaces those two groups in `design/tokens/palette.json`, exactly as
//! `tools/design-build/src/themes.ts` does. The semantic and component colors refer to the
//! palette by alias, so this module can also work out what a theme will look like without
//! running the generator: it follows the aliases itself.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde_json::{Map, Value};

use crate::error::{Context, Error, Result};
use crate::json;
use crate::template::Template;

pub const PALETTE_PATH: &str = "design/tokens/palette.json";
pub const THEMES_DIR: &str = "design/themes";
const GENERATOR: &str = "tools/design-build/src/build.ts";
/// The first Node release that runs TypeScript files without a flag.
const MIN_NODE: (u32, u32) = (22, 18);

/// The two ramps a theme replaces.
const RAMPS: [&str; 2] = ["accent", "neutral"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rgb(pub u8, pub u8, pub u8);

impl Rgb {
    pub fn hex(self) -> String {
        format!("#{:02x}{:02x}{:02x}", self.0, self.1, self.2)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Light,
    Dark,
}

impl Mode {
    pub const ALL: [Self; 2] = [Self::Light, Self::Dark];

    pub fn label(self) -> &'static str {
        match self {
            Self::Light => "Light",
            Self::Dark => "Dark",
        }
    }

    fn file(self) -> &'static str {
        match self {
            Self::Light => "design/tokens/color.light.json",
            Self::Dark => "design/tokens/color.dark.json",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Theme {
    pub name: String,
    pub description: String,
    /// `accent` and `neutral`, as the DTCG groups from the theme file.
    ramps: Map<String, Value>,
}

/// Where the design files are read from: the template inside the binary, or a project on disk.
pub enum Source<'a> {
    Embedded(&'a Template),
    Project(&'a Path),
}

impl Source<'_> {
    fn read(&self, path: &str) -> Result<String> {
        match self {
            Self::Embedded(template) => {
                let file = template
                    .files
                    .get(path)
                    .ok_or_else(|| Error::Message(format!("the template has no {path}")))?;
                String::from_utf8(file.contents.clone()).context(path)
            }
            Self::Project(root) => fs::read_to_string(root.join(path)).context(path),
        }
    }

    /// The names of the themes, sorted.
    fn theme_names(&self) -> Result<Vec<String>> {
        let mut names: Vec<String> = match self {
            Self::Embedded(template) => template
                .files
                .keys()
                .filter_map(|path| path.strip_prefix(THEMES_DIR)?.strip_prefix('/'))
                .filter_map(|file| file.strip_suffix(".json"))
                .map(str::to_owned)
                .collect(),
            Self::Project(root) => fs::read_dir(root.join(THEMES_DIR))
                .context(THEMES_DIR)?
                .filter_map(|entry| entry.ok()?.file_name().into_string().ok())
                .filter_map(|file| file.strip_suffix(".json").map(str::to_owned))
                .collect(),
        };
        names.sort();
        Ok(names)
    }

    pub fn themes(&self) -> Result<Vec<Theme>> {
        self.theme_names()?
            .into_iter()
            .map(|name| {
                let path = format!("{THEMES_DIR}/{name}.json");
                Theme::parse(&name, &self.read(&path)?).context(path)
            })
            .collect()
    }

    pub fn palette(&self) -> Result<String> {
        self.read(PALETTE_PATH)
    }

    /// The colors `theme` gives the tokens of this source.
    pub fn resolve(&self, theme: &Theme) -> Result<Resolved> {
        let palette = with_ramps(&self.palette()?, theme)?;
        let mut modes = Vec::new();
        for mode in Mode::ALL {
            let colors: Value =
                serde_json::from_str(&self.read(mode.file())?).context(mode.file())?;
            let mut tokens = BTreeMap::new();
            flatten(&palette, &mut Vec::new(), &mut tokens);
            flatten(&colors, &mut Vec::new(), &mut tokens);
            modes.push(tokens);
        }
        let [light, dark] = modes.try_into().expect("one set of tokens per mode");
        Ok(Resolved { light, dark })
    }
}

impl Theme {
    fn parse(name: &str, text: &str) -> Result<Self> {
        let content: Value = serde_json::from_str(text).map_err(|error| error.to_string())?;
        let mut ramps = Map::new();
        for ramp in RAMPS {
            match content.pointer(&format!("/palette/{ramp}")) {
                Some(group @ Value::Object(_)) => ramps.insert(ramp.to_owned(), group.clone()),
                _ => return Err(format!("a theme needs palette.{ramp}").into()),
            };
        }
        let description = content
            .get("$description")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned();
        Ok(Self {
            name: name.to_owned(),
            description,
            ramps,
        })
    }

    /// The steps of one ramp from light to dark, for drawing swatches.
    pub fn ramp(&self, ramp: &str) -> Vec<Rgb> {
        let Some(Value::Object(steps)) = self.ramps.get(ramp) else {
            return Vec::new();
        };
        let mut steps: Vec<(u32, Rgb)> = steps
            .iter()
            .filter_map(|(step, token)| {
                Some((step.parse().ok()?, parse_color(token.get("$value")?)?))
            })
            .collect();
        steps.sort_by_key(|(step, _)| *step);
        steps.into_iter().map(|(_, color)| color).collect()
    }
}

/// `palette.json` with the two ramps of `theme` in place, as a document.
fn with_ramps(palette: &str, theme: &Theme) -> Result<Value> {
    let mut document: Value = serde_json::from_str(palette).context(PALETTE_PATH)?;
    let group = document
        .get_mut("palette")
        .and_then(Value::as_object_mut)
        .ok_or_else(|| Error::Message(format!("{PALETTE_PATH} has no \"palette\" group")))?;
    for (ramp, steps) in &theme.ramps {
        // Assigning to an existing key keeps its position, as it does in JavaScript.
        group.insert(ramp.clone(), steps.clone());
    }
    Ok(document)
}

/// The text of `palette.json` after applying `theme`: what `themes.ts` would write.
pub fn apply(palette: &str, theme: &Theme) -> Result<String> {
    Ok(json::stringify(&with_ramps(palette, theme)?))
}

/// Whether `palette` already holds the ramps of `theme`. Compares colors rather than text, so
/// `1.0` and `1` are the same channel.
pub fn is_applied(palette: &str, theme: &Theme) -> bool {
    let Ok(document) = serde_json::from_str::<Value>(palette) else {
        return false;
    };
    RAMPS.iter().all(|ramp| {
        let current = document.pointer(&format!("/palette/{ramp}"));
        match (current, theme.ramps.get(*ramp)) {
            (Some(Value::Object(current)), Some(Value::Object(wanted))) => {
                current.len() == wanted.len()
                    && wanted.iter().all(|(step, token)| {
                        let color = |token: &Value| token.get("$value").and_then(parse_color);
                        color(token).is_some() && current.get(step).and_then(color) == color(token)
                    })
            }
            _ => false,
        }
    })
}

/// Token `$value`s by dotted path, for one color mode: the palette plus that mode's colors.
type Tokens = BTreeMap<String, Value>;

fn flatten(node: &Value, path: &mut Vec<String>, tokens: &mut Tokens) {
    let Value::Object(members) = node else { return };
    if let Some(value) = members.get("$value") {
        tokens.insert(path.join("."), value.clone());
        return;
    }
    for (key, member) in members {
        // `$type` and `$description` describe a group; they are not tokens.
        if !key.starts_with('$') {
            path.push(key.clone());
            flatten(member, path, tokens);
            path.pop();
        }
    }
}

/// A DTCG sRGB color object. The channels are rounded the way the generator rounds them.
fn parse_color(value: &Value) -> Option<Rgb> {
    let components = value.get("components")?.as_array()?;
    let channel = |index: usize| {
        let component = components.get(index)?.as_f64()?;
        (0.0..=1.0)
            .contains(&component)
            .then(|| (component * 255.0).round() as u8)
    };
    Some(Rgb(channel(0)?, channel(1)?, channel(2)?))
}

/// The tokens of both color modes with a theme's ramps in place.
pub struct Resolved {
    light: Tokens,
    dark: Tokens,
}

impl Resolved {
    /// The color of a token such as `color.button.primary.background`, following aliases:
    /// component to semantic to palette.
    pub fn color(&self, mode: Mode, path: &str) -> Result<Rgb> {
        let tokens = match mode {
            Mode::Light => &self.light,
            Mode::Dark => &self.dark,
        };
        let mut current = path;
        // Far more hops than any real chain; a loop of aliases ends here instead of hanging.
        for _ in 0..32 {
            let value = tokens.get(current).ok_or_else(|| {
                Error::Message(format!("there is no token {current} (from {path})"))
            })?;
            match value {
                Value::String(alias) => {
                    current = alias
                        .strip_prefix('{')
                        .and_then(|alias| alias.strip_suffix('}'))
                        .ok_or_else(|| {
                            Error::Message(format!("{current}: \"{alias}\" is not an alias"))
                        })?;
                }
                color => {
                    return parse_color(color)
                        .ok_or_else(|| Error::Message(format!("{current} is not an sRGB color")));
                }
            }
        }
        Err(Error::Message(format!(
            "{path}: the aliases refer to each other"
        )))
    }
}

/// What happened when the generator was asked to rewrite the platform files.
pub enum Regenerated {
    Done,
    /// No usable Node: the reason, for the message that says the files are stale.
    Skipped(String),
    /// The generator ran and refused, for example because a color pairing lost its contrast.
    Failed(String),
}

/// Runs `tools/design-build` in `project` to rewrite the generated token files.
pub fn regenerate(project: &Path) -> Regenerated {
    let script = project.join(GENERATOR);
    if !script.is_file() {
        return Regenerated::Skipped(format!("the project has no {GENERATOR}"));
    }
    if let Err(reason) = check_node() {
        return Regenerated::Skipped(reason);
    }
    // The script finds the project from its own location, so it runs from wherever xds was
    // started. That matters for version managers that pick a Node per directory: a project
    // that was written a moment ago has not been set up for them yet.
    match Command::new("node")
        .arg(script)
        .stdin(Stdio::null())
        .output()
    {
        Ok(output) if output.status.success() => Regenerated::Done,
        Ok(output) => {
            let mut text = String::from_utf8_lossy(&output.stderr).into_owned();
            text.push_str(&String::from_utf8_lossy(&output.stdout));
            Regenerated::Failed(text.trim().to_owned())
        }
        Err(error) => Regenerated::Skipped(format!("node could not be started: {error}")),
    }
}

/// Whether `node` on PATH can run the generator, or why not.
pub fn check_node() -> std::result::Result<(), String> {
    let (major, minor) = MIN_NODE;
    let needed = format!("Node {major}.{minor} or newer is needed to regenerate them");
    let output = Command::new("node")
        .arg("--version")
        .stdin(Stdio::null())
        .output()
        .map_err(|_| format!("node is not on PATH; {needed}"))?;
    let version = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    match parse_node_version(&version) {
        Some(found) if output.status.success() && found >= MIN_NODE => Ok(()),
        Some(_) if output.status.success() => Err(format!("node on PATH is {version}; {needed}")),
        // The usual way to get here: `node` is a mise shim, and mise refuses to read the
        // mise.toml of a project nobody has trusted yet.
        _ if String::from_utf8_lossy(&output.stderr).contains("mise trust") => Err(format!(
            "node comes from mise, which does not trust this project yet (run `mise trust`); {needed}"
        )),
        _ => Err(format!("`node --version` failed; {needed}")),
    }
}

fn parse_node_version(version: &str) -> Option<(u32, u32)> {
    let mut parts = version.strip_prefix('v')?.split('.');
    Some((parts.next()?.parse().ok()?, parts.next()?.parse().ok()?))
}

/// The path of the palette inside a project.
pub fn palette_file(project: &Path) -> PathBuf {
    project.join(PALETTE_PATH)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::manifest::manifest;
    use crate::preview;
    use crate::template::template;

    fn embedded() -> Source<'static> {
        Source::Embedded(template())
    }

    fn theme(name: &str) -> Theme {
        let themes = embedded().themes().expect("the embedded themes parse");
        themes
            .into_iter()
            .find(|theme| theme.name == name)
            .expect("the theme exists")
    }

    #[test]
    fn has_the_default_theme_and_more() {
        let themes = embedded().themes().expect("the embedded themes parse");
        assert!(themes.len() > 1);
        assert!(
            themes
                .iter()
                .any(|theme| theme.name == manifest().default_theme)
        );
        for theme in &themes {
            assert_eq!(theme.ramp("accent").len(), 11, "{}", theme.name);
            assert_eq!(theme.ramp("neutral").len(), 13, "{}", theme.name);
        }
    }

    #[test]
    fn the_template_palette_holds_the_default_theme() {
        let palette = embedded().palette().expect("the template has a palette");
        assert!(is_applied(&palette, &theme(&manifest().default_theme)));
        assert!(!is_applied(&palette, &theme("ocean")));
    }

    #[test]
    fn rewriting_an_untouched_palette_reproduces_it() {
        // The token files are kept in the layout JSON.stringify writes, so applying a theme
        // changes the two ramps and not one byte of formatting elsewhere.
        let palette = embedded().palette().expect("the template has a palette");
        let document: Value = serde_json::from_str(&palette).expect("valid JSON");
        assert_eq!(json::stringify(&document), palette);
        assert_eq!(
            apply(&palette, &theme(&manifest().default_theme)).expect("applies"),
            palette
        );
    }

    #[test]
    fn applying_a_theme_changes_exactly_the_two_ramps() {
        let palette = embedded().palette().expect("the template has a palette");
        let before: Value = serde_json::from_str(&palette).expect("valid JSON");
        for theme in embedded().themes().expect("the embedded themes parse") {
            let text = apply(&palette, &theme).expect("applies");
            assert!(is_applied(&text, &theme), "{}", theme.name);
            // Applying it again changes nothing.
            assert_eq!(
                apply(&text, &theme).expect("applies"),
                text,
                "{}",
                theme.name
            );

            let after: Value = serde_json::from_str(&text).expect("valid JSON");
            let groups =
                |document: &Value| document["palette"].as_object().expect("a group").clone();
            let (old, new) = (groups(&before), groups(&after));
            // Same groups in the same order.
            assert_eq!(
                old.keys().collect::<Vec<_>>(),
                new.keys().collect::<Vec<_>>()
            );
            for (key, group) in &new {
                if RAMPS.contains(&key.as_str()) {
                    assert_eq!(group, &theme.ramps[key], "{}: {key}", theme.name);
                } else {
                    assert_eq!(group, &old[key], "{}: {key} was touched", theme.name);
                }
            }

            // Nothing but those two groups changed, so the layout is the only thing left to
            // check: it is the one JSON.stringify gives the same document.
            assert_eq!(text, json::stringify(&after), "{}", theme.name);
        }
    }

    #[test]
    fn every_preview_color_resolves_for_every_theme_in_both_modes() {
        let source = embedded();
        for theme in source.themes().expect("the embedded themes parse") {
            let resolved = source.resolve(&theme).expect("resolves");
            for mode in Mode::ALL {
                for (_, token) in preview::ROLES {
                    let color = resolved.color(mode, token);
                    assert!(
                        color.is_ok(),
                        "{} {mode:?} {token}: {:?}",
                        theme.name,
                        color.err()
                    );
                }
            }
        }
    }

    #[test]
    fn follows_aliases_from_component_to_palette() {
        let source = embedded();
        let ocean = theme("ocean");
        let resolved = source.resolve(&ocean).expect("resolves");
        // button.primary.background -> accent.default -> palette.accent.600 in light mode.
        let button = resolved
            .color(Mode::Light, "color.button.primary.background")
            .expect("resolves");
        let step = resolved
            .color(Mode::Light, "palette.accent.600")
            .expect("resolves");
        assert_eq!(button, step);
        assert_eq!(button.hex(), "#045ebc");
        // The theme's ramp is what the palette now holds, and another theme gives another color.
        assert!(ocean.ramp("accent").contains(&button));
        let indigo = source.resolve(&theme("indigo")).expect("resolves");
        assert_ne!(
            indigo
                .color(Mode::Light, "color.button.primary.background")
                .expect("resolves"),
            button
        );
    }

    #[test]
    fn reports_a_missing_token_and_a_loop() {
        let mut tokens = Tokens::new();
        tokens.insert("a".to_owned(), Value::String("{b}".to_owned()));
        tokens.insert("b".to_owned(), Value::String("{a}".to_owned()));
        tokens.insert("c".to_owned(), Value::String("{missing}".to_owned()));
        let resolved = Resolved {
            light: tokens.clone(),
            dark: tokens,
        };
        assert!(resolved.color(Mode::Light, "a").is_err());
        assert!(resolved.color(Mode::Dark, "c").is_err());
    }

    #[test]
    fn reads_node_versions() {
        assert_eq!(parse_node_version("v22.18.0"), Some((22, 18)));
        assert_eq!(parse_node_version("v26.13.1"), Some((26, 13)));
        assert_eq!(parse_node_version("22.18.0"), None);
        assert!((22, 17) < MIN_NODE && (23, 0) > MIN_NODE);
    }
}
