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

use crate::error::{Context, Error, Result};
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
    pub name: String,
    pub title: String,
    pub targets: Vec<String>,
    pub theme: String,
}

impl Record {
    pub fn new(names: &Names, targets: &[&Target], theme: &str) -> Self {
        Self {
            xds: env!("CARGO_PKG_VERSION").to_owned(),
            name: names.name.clone(),
            title: names.title.clone(),
            targets: targets.iter().map(|target| target.id.clone()).collect(),
            theme: theme.to_owned(),
        }
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
    let kinds = manifest.output_kinds(targets);
    let outputs = build_outputs(template)?;
    let is_selected = |id: &str| targets.iter().any(|target| target.id == id);
    let is_known = |id: &str| id == TEMPLATE_ONLY || manifest.target(id).is_some();

    let transform = |path: &str, file: &File| -> Result<(String, File)> {
        let mut contents = file.contents.clone();
        if let Some(text) = as_text(&contents) {
            let text = markers::apply(text, is_selected, is_known).context(path)?;
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
        files.insert(path, file);
    }
    // Laid over the project root last, so an overlay file wins over a template file.
    for (path, file) in &template.overlay {
        let (path, file) = transform(path, file)?;
        files.insert(path, file);
    }
    Ok(files)
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
    use std::os::unix::fs::PermissionsExt;
    let mut permissions = fs::metadata(path)?.permissions();
    // Readable implies executable, as `chmod +x` does under the usual umask.
    permissions.set_mode(permissions.mode() | ((permissions.mode() & 0o444) >> 2));
    fs::set_permissions(path, permissions)
}

#[cfg(not(unix))]
fn make_executable(_path: &Path) -> std::io::Result<()> {
    Ok(())
}
