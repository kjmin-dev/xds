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
    #[cfg_attr(not(test), expect(dead_code))]
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
    pub title: String,
    pub stack: String,
    pub platforms: Vec<String>,
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
    pub fn output_kinds<'a>(&self, targets: &[&'a Target]) -> BTreeSet<&'a str> {
        targets
            .iter()
            .flat_map(|target| target.outputs.iter().map(String::as_str))
            .collect()
    }
}

/// Whether `path` is `prefix` itself or lies below it.
pub fn is_under(path: &str, prefix: &str) -> bool {
    path.strip_prefix(prefix)
        .is_some_and(|rest| rest.is_empty() || rest.starts_with('/'))
}
