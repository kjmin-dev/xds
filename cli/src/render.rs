//! Turns the template into the files of one project: the paths of the selected targets, with
//! conditional blocks resolved and the placeholder name replaced.
//!
//! Rendering is a pure function of the selection. `create` writes its result; `add` renders the
//! old and the new selection and compares, which is how it knows what a new target changes in
//! the files the targets share.

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::{Context as _, Error, Result};
use crate::inspect::COMPONENTS_PATH;
use crate::json;
use crate::manifest::{Manifest, TEMPLATE_ONLY, Target, is_under};
use crate::markers;
use crate::rename::Names;
use crate::template::{File, Files, Template, is_binary};

/// Where the generator reads which platform files to write.
pub const BUILD_CONFIG: &str = "design/build.json";
/// The record `create` leaves in a project, which `add` and `theme` read.
pub const RECORD: &str = ".xds.json";

/// What a project was made with.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Record {
    /// The version of `xds` that last wrote the project.
    pub xds: String,
    /// Older records only identified the last writer, so their creation version is unknown.
    #[serde(
        default,
        rename = "createdWith",
        skip_serializing_if = "Option::is_none"
    )]
    pub created_with: Option<String>,
    pub name: String,
    pub title: String,
    pub targets: Vec<String>,
    pub theme: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub wraps: BTreeMap<String, String>,
}

impl Record {
    pub fn new(names: &Names, targets: &[&Target], theme: &str) -> Self {
        Self {
            xds: env!("CARGO_PKG_VERSION").to_owned(),
            created_with: Some(env!("CARGO_PKG_VERSION").to_owned()),
            name: names.name.clone(),
            title: names.title.clone(),
            targets: targets.iter().map(|target| target.id.clone()).collect(),
            theme: theme.to_owned(),
            wraps: BTreeMap::new(),
        }
    }

    pub fn validated_wraps(&self, manifest: &Manifest) -> Result<BTreeMap<String, String>> {
        let targets = manifest.select(&self.targets)?;
        let resolved = crate::manifest::shell_wraps(&targets, &self.wraps, None)?;
        if resolved != self.wraps {
            return Err(Error::Message(format!(
                "{RECORD}: wraps must name each selected desktop shell and its selected web app"
            )));
        }
        Ok(resolved)
    }

    pub fn read(project: &Path) -> Result<Self> {
        let path = project.join(RECORD);
        let text = fs::read_to_string(&path).map_err(|_| {
            Error::Message(format!(
                "{} is not a project made by xds: it has no {RECORD}.",
                project.display()
            ))
        })?;
        serde_json::from_str(&text).context(path.display())
    }

    pub fn to_file(&self) -> File {
        let value = serde_json::to_value(self).expect("a record is plain data");
        File {
            contents: json::format(&value).into_bytes(),
            executable: false,
        }
    }
}

/// The files of a project with `targets`, by path. The record is not among them: it also
/// holds the theme, which rendering knows nothing about.
pub fn render(
    template: &Template,
    manifest: &Manifest,
    targets: &[&Target],
    names: &Names,
) -> Result<Files> {
    let prefixes = manifest.prefixes(targets);
    let kinds = Manifest::output_kinds(targets);
    let outputs = build_outputs(template)?;
    let is_selected = |id: &str| targets.iter().any(|target| target.id == id);
    // A marker may also name a shared unit. A block about the JavaScript workspace then follows
    // whichever targets require it, and a new target that does gets the block without its id
    // being added to every marker.
    let is_marked = |name: &str| {
        targets
            .iter()
            .any(|target| target.id == name || target.requires.iter().any(|unit| unit == name))
    };
    let is_known = |name: &str| {
        name == TEMPLATE_ONLY
            || manifest.target(name).is_some()
            || manifest.shared.contains_key(name)
    };

    let transform = |path: &str, file: &File| -> Result<(String, File)> {
        let mut contents = file.contents.clone();
        if let Some(text) = as_text(&contents) {
            let text = markers::apply(text, is_marked, is_known).context(path)?;
            contents = names.apply(&text, &manifest.placeholder).into_bytes();
        }
        let path = names.apply(path, &manifest.placeholder);
        Ok((
            path,
            File {
                contents,
                executable: file.executable,
            },
        ))
    };

    let mut files = Files::new();
    for (path, file) in &template.files {
        if !prefixes.iter().any(|prefix| is_under(path, prefix)) {
            continue;
        }
        // A generated file is only useful to a target that reads that kind of output.
        if let Some((kind, _)) = outputs.iter().find(|(_, output)| output == path)
            && !kinds.contains(kind.as_str())
        {
            continue;
        }
        let (path, mut file) = transform(path, file)?;
        if path == BUILD_CONFIG {
            file.contents =
                filter_build_config(&file.contents, |kind| kinds.contains(kind))?.into_bytes();
        }
        if path == COMPONENTS_PATH {
            file.contents = filter_components(&file.contents, manifest, is_selected)?.into_bytes();
        }
        files.insert(path, file);
    }
    // Laid over the project root last, so an overlay file wins over a template file.
    for (path, file) in &template.overlay {
        let (path, file) = transform(path, file)?;
        files.insert(path, file);
    }
    Ok(files)
}

/// The shell's web script is the only part of the template tied to a particular web app.
pub fn with_wraps(
    template: &Template,
    manifest: &Manifest,
    targets: &[&Target],
    names: &Names,
    wraps: &BTreeMap<String, String>,
) -> Result<Files> {
    let mut files = render(template, manifest, targets, names)?;
    for (shell, web) in wraps {
        let shell = manifest.target(shell).expect("validated shell");
        let directory = &shell.paths[0];
        let path = format!("{directory}/package.json");
        let file = files
            .get_mut(&path)
            .ok_or_else(|| Error::Message(format!("No {path} for {}", shell.id)))?;
        let script = |id: &str| -> Result<String> {
            let package = manifest
                .target(id)
                .and_then(|target| target.package.as_deref())
                .ok_or_else(|| Error::Message(format!("{id} has no workspace package")))?;
            Ok(format!(
                "pnpm --filter {} exec vite",
                names.apply(package, &manifest.placeholder)
            ))
        };
        let default = script(&shell.wraps[0])?;
        let chosen = script(web)?;
        let source = std::str::from_utf8(&file.contents).context(&path)?;
        let from = format!(r#""web": "{default}""#);
        if source.matches(&from).count() != 1 {
            return Err(Error::Message(format!(
                "{path} must contain exactly one web script that runs {default}"
            )));
        }
        file.contents = source
            .replacen(&from, &format!(r#""web": "{chosen}""#), 1)
            .into_bytes();
    }
    Ok(files)
}

/// The component contract with only the selected clients, and without the components that
/// none of them has, nor the differences that concern none of them. Written the way the rest of
/// `design/` is.
fn filter_components(
    contents: &[u8],
    manifest: &Manifest,
    is_selected: impl Fn(&str) -> bool,
) -> Result<String> {
    let mut document: Value = serde_json::from_slice(contents).context(COMPONENTS_PATH)?;
    let Some(Value::Array(components)) = document.get_mut("components") else {
        return Err(Error::Message(format!(
            "{COMPONENTS_PATH} has no list of components"
        )));
    };
    for component in components.iter_mut() {
        let Some(Value::Object(clients)) = component.get_mut("clients") else {
            continue;
        };
        clients.retain(|id, _| is_selected(id));
        let inputs: Vec<&str> = clients
            .keys()
            .filter_map(|id| manifest.target(id))
            .map(|target| target.input.name())
            .collect();
        let Some(Value::Array(differences)) = component.get_mut("differences") else {
            continue;
        };
        for difference in differences.iter_mut() {
            if let Some(Value::Array(ids)) = difference.get_mut("clients") {
                ids.retain(|id| id.as_str().is_some_and(&is_selected));
            }
        }
        differences.retain(|difference| {
            match (
                difference["clients"].as_array(),
                difference["input"].as_str(),
            ) {
                (Some(ids), _) => !ids.is_empty(),
                (None, Some(input)) => inputs.contains(&input),
                (None, None) => true,
            }
        });
        if differences.is_empty()
            && let Value::Object(component) = component
        {
            component.shift_remove("differences");
        }
    }
    components.retain(|component| {
        component["clients"]
            .as_object()
            .is_some_and(|clients| !clients.is_empty())
    });
    Ok(json::stringify(&document))
}

/// The contents as text, unless the file is binary and has to be copied untouched.
fn as_text(contents: &[u8]) -> Option<&str> {
    if is_binary(contents) {
        None
    } else {
        std::str::from_utf8(contents).ok()
    }
}

/// The `outputs` of the template's `design/build.json`: kind and path, in file order.
fn build_outputs(template: &Template) -> Result<Vec<(String, String)>> {
    let file = template
        .files
        .get(BUILD_CONFIG)
        .ok_or_else(|| Error::Message(format!("the template has no {BUILD_CONFIG}")))?;
    Ok(parse_outputs(&file.contents)?
        .into_iter()
        .filter_map(|(kind, path)| Some((kind, path.as_str()?.to_owned())))
        .collect())
}

fn parse_outputs(contents: &[u8]) -> Result<Map<String, Value>> {
    let config: Value = serde_json::from_slice(contents).context(BUILD_CONFIG)?;
    match config.get("outputs") {
        Some(Value::Object(outputs)) => Ok(outputs.clone()),
        _ => Err(Error::Message(format!("{BUILD_CONFIG} has no \"outputs\""))),
    }
}

/// `design/build.json` with only the output kinds `keep` accepts, in the layout the generator's
/// own tooling writes.
fn filter_build_config(contents: &[u8], keep: impl Fn(&str) -> bool) -> Result<String> {
    let mut config: Value = serde_json::from_slice(contents).context(BUILD_CONFIG)?;
    let outputs = parse_outputs(contents)?
        .into_iter()
        .filter(|(kind, _)| keep(kind))
        .collect();
    config["outputs"] = Value::Object(outputs);
    config["contractVersion"] = env!("CARGO_PKG_VERSION").into();
    Ok(json::stringify(&config))
}

/// Adds the outputs `wanted` has and `current` lacks, leaving everything else in `current`
/// as the project has it. Returns `None` when nothing is missing.
pub fn merge_build_config(current: &[u8], wanted: &[u8]) -> Result<Option<String>> {
    let mut config: Value = serde_json::from_slice(current).context(BUILD_CONFIG)?;
    let mut outputs = parse_outputs(current)?;
    let before = outputs.len();
    for (kind, path) in parse_outputs(wanted)? {
        outputs.entry(kind).or_insert(path);
    }
    if outputs.len() == before {
        return Ok(None);
    }
    config["outputs"] = Value::Object(outputs);
    Ok(Some(json::stringify(&config)))
}

/// The output kinds a rendered or on-disk `design/build.json` lists.
pub fn output_kinds(contents: &[u8]) -> Result<Vec<String>> {
    Ok(parse_outputs(contents)?.keys().cloned().collect())
}

/// Writes `files` under `root`, creating directories as needed.
pub fn write(root: &Path, files: &BTreeMap<String, File>) -> Result<()> {
    for (path, file) in files {
        write_file(root, path, file)?;
    }
    Ok(())
}

pub fn write_file(root: &Path, path: &str, file: &File) -> Result<()> {
    // Template paths use `/` on every platform.
    let target = path
        .split('/')
        .fold(root.to_path_buf(), |target, part| target.join(part));
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).context(parent.display())?;
    }
    fs::write(&target, &file.contents).context(target.display())?;
    if file.executable {
        make_executable(&target).context(target.display())?;
    }
    Ok(())
}

#[cfg(unix)]
fn make_executable(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt as _;
    let mut permissions = fs::metadata(path)?.permissions();
    // Readable implies executable, as `chmod +x` does under the usual umask.
    permissions.set_mode(permissions.mode() | ((permissions.mode() & 0o444) >> 2));
    fs::set_permissions(path, permissions)
}

#[cfg(not(unix))]
#[expect(
    clippy::missing_const_for_fn,
    clippy::unnecessary_wraps,
    reason = "the signature of the Unix function, which reads the file system and can fail"
)]
fn make_executable(_path: &Path) -> std::io::Result<()> {
    Ok(())
}
