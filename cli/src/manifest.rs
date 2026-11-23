//! `template.json`: which paths belong to which client stack.
//!
//! The file is compiled in next to the template itself, so the two cannot disagree.

use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

use serde::Deserialize;

use crate::error::{Error, Result};

/// A target id that is never selected. `@if template` marks lines that only make sense in the
/// template repository.
pub const TEMPLATE_ONLY: &str = "template";

#[derive(Debug, Deserialize)]
pub struct Manifest {
    pub placeholder: Placeholder,
    /// The theme whose ramps `design/tokens/palette.json` holds in the template.
    #[serde(rename = "defaultTheme")]
    pub default_theme: String,
    /// Paths that stay in the template repository. `build.rs` leaves them out of the binary,
    /// so at run time only the tests look at the list.
    #[cfg_attr(not(test), expect(dead_code, reason = "only the tests read it"))]
    pub exclude: Vec<String>,
    /// Paths every project gets.
    pub common: Vec<String>,
    /// Paths several targets need, by name.
    pub shared: BTreeMap<String, Shared>,
    pub targets: Vec<Target>,
}

#[derive(Debug, Deserialize)]
pub struct Placeholder {
    pub name: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct Shared {
    pub paths: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Target {
    pub id: String,
    /// Part of a project when nobody picks: `create --yes` without `--targets` takes the default
    /// targets, and the interactive list starts with them ticked.
    #[serde(default)]
    pub default: bool,
    pub title: String,
    pub stack: String,
    pub platforms: Vec<String>,
    /// The npm workspace package of a web app that a desktop shell can run.
    pub package: Option<String>,
    #[serde(default)]
    pub wraps: Vec<String>,
    /// What its components are designed for. `differences` in the component contract may name
    /// it instead of listing clients.
    pub input: Input,
    pub paths: Vec<String>,
    /// Names of `shared` units.
    #[serde(default)]
    pub requires: Vec<String>,
    /// The kinds of generated token file this target reads (keys of `design/build.json`).
    #[serde(default)]
    pub outputs: Vec<String>,
    /// The command that formats this stack's code, if it has a formatter. `create` and `add`
    /// ask for it to be run once: a new name changes line lengths and the order of imports.
    #[serde(default)]
    pub format: Option<String>,
    /// How to start it, shown after `create` and `add`.
    #[serde(default)]
    pub run: Vec<RunCommand>,
}

/// The input device a client's components are designed for: a design distinction rather than a
/// platform one, so Compose is a touch client although it also runs on the desktop.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Input {
    Pointer,
    Touch,
}

impl Input {
    pub const ALL: [Self; 2] = [Self::Pointer, Self::Touch];

    pub const fn name(self) -> &'static str {
        match self {
            Self::Pointer => "pointer",
            Self::Touch => "touch",
        }
    }

    pub fn parse(name: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|input| input.name() == name)
    }
}

#[derive(Debug, Deserialize)]
pub struct RunCommand {
    pub command: String,
    pub description: String,
}

pub fn manifest() -> &'static Manifest {
    static MANIFEST: OnceLock<Manifest> = OnceLock::new();
    MANIFEST.get_or_init(|| {
        serde_json::from_str(include_str!("../../template.json"))
            .expect("template.json was checked by the tests")
    })
}

impl Target {
    /// `Mobile (iOS, Android)`, or just `Web` when the title already says where it runs.
    pub fn label(&self) -> String {
        let platforms = self.platforms.join(", ");
        if platforms == self.title {
            platforms
        } else {
            format!("{} ({platforms})", self.title)
        }
    }
}

impl Manifest {
    pub fn target(&self, id: &str) -> Option<&Target> {
        self.targets.iter().find(|target| target.id == id)
    }

    pub fn target_ids(&self) -> Vec<&str> {
        self.targets
            .iter()
            .map(|target| target.id.as_str())
            .collect()
    }

    pub fn default_targets(&self) -> Vec<&Target> {
        self.targets
            .iter()
            .filter(|target| target.default)
            .collect()
    }

    /// Turns ids from the command line or a project record into targets, in manifest order and
    /// without duplicates, so the same selection always renders the same project.
    pub fn select(&self, ids: &[String]) -> Result<Vec<&Target>> {
        let all = ids.iter().any(|id| id == "all");
        for id in ids {
            if id != "all" && self.target(id).is_none() {
                return Err(Error::Message(format!(
                    "There is no target \"{id}\". Targets: {}",
                    self.target_ids().join(", ")
                )));
            }
        }
        Ok(self
            .targets
            .iter()
            .filter(|target| all || ids.contains(&target.id))
            .collect())
    }

    /// Every path prefix a project with these targets is made of.
    pub fn prefixes<'a>(&'a self, targets: &[&'a Target]) -> Vec<&'a str> {
        let mut prefixes: Vec<&str> = self.common.iter().map(String::as_str).collect();
        for target in targets {
            prefixes.extend(target.paths.iter().map(String::as_str));
            for unit in &target.requires {
                // An unknown unit is a mistake in template.json, which the tests catch.
                if let Some(shared) = self.shared.get(unit) {
                    prefixes.extend(shared.paths.iter().map(String::as_str));
                }
            }
        }
        prefixes
    }

    /// The generator output kinds a project with these targets needs.
    pub fn output_kinds<'a>(targets: &[&'a Target]) -> BTreeSet<&'a str> {
        targets
            .iter()
            .flat_map(|target| target.outputs.iter().map(String::as_str))
            .collect()
    }
}

/// An existing shell keeps its recorded choice when another web app is added.
pub fn shell_wraps(
    targets: &[&Target],
    previous: &BTreeMap<String, String>,
    requested: Option<&str>,
) -> Result<BTreeMap<String, String>> {
    let mut wraps = BTreeMap::new();
    for shell in targets.iter().filter(|target| !target.wraps.is_empty()) {
        let choice = previous.get(&shell.id).map(String::as_str).or(requested);
        let web = targets
            .iter()
            .find(|target| {
                shell.wraps.contains(&target.id) && choice.is_none_or(|id| id == target.id)
            })
            .ok_or_else(|| {
                Error::Message(format!(
                    "{} needs a web app. Select one of {} or pass --wrap WEB_TARGET.",
                    shell.id,
                    shell.wraps.join(", ")
                ))
            })?;
        wraps.insert(shell.id.clone(), web.id.clone());
    }
    Ok(wraps)
}

/// Whether `path` is `prefix` itself or lies below it.
pub fn is_under(path: &str, prefix: &str) -> bool {
    path.strip_prefix(prefix)
        .is_some_and(|rest| rest.is_empty() || rest.starts_with('/'))
}
