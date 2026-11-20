//! Run the token build's contrast checker on a theme without applying it to the project.

use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

use serde::Deserialize;
use serde_json::{Value, json};
use tempfile::{TempDir, tempdir};

use crate::error::{Context, Error, Result};
use crate::inspect::Location;
use crate::output::Out;
use crate::{render, say, template, theme};

#[derive(Debug, clap::Args)]
pub struct Args {
    /// A full theme, overrides on a preset, or an accent and neutral palette file
    file: PathBuf,
    /// The project to read tokens from [default: the current directory, or the embedded template]
    #[arg(long)]
    project: Option<PathBuf>,
}

#[derive(Deserialize)]
struct Report {
    version: String,
    ok: bool,
    failures: Vec<String>,
}

#[derive(Debug, clap::Args)]
pub struct ExportArgs {
    /// A full theme, overrides on a preset, or an accent and neutral palette file
    file: PathBuf,
    /// What the page names the theme with, in `data-<prefix>-theme` [default: the file's name]
    #[arg(long)]
    name: Option<String>,
    /// Where to write the stylesheet [default: standard output]
    #[arg(long, short)]
    out: Option<PathBuf>,
    /// The project to read tokens from [default: the current directory, or the embedded template]
    #[arg(long)]
    project: Option<PathBuf>,
}

#[derive(Deserialize)]
struct Export {
    version: String,
    ok: bool,
    failures: Vec<String>,
    css: Option<String>,
}

/// The token tools in a temporary directory, and the directory holding the design data.
struct Checker {
    work: TempDir,
    location: Location,
}

impl Checker {
    fn new(project: Option<&Path>) -> Result<Self> {
        let location = Location::find(project)?;
        theme::check_node()?;
        let work = tempdir().context("creating a temporary directory for the theme checker")?;
        // The binary supplies the code even when the user points at another project's data.
        let template = template::template();
        for file in [
            "package.json",
            "src/model.ts",
            "src/themes.ts",
            "src/contrast.ts",
            "src/theme-contract.ts",
            "src/check-theme.ts",
            "src/emit.ts",
            "src/icons.ts",
            "src/export-theme.ts",
        ] {
            let path = format!("{SCRIPT_DIR}/{file}");
            render::write_file(work.path(), &path, &template.files[&path])?;
        }
        if let Location::Embedded = location {
            for (path, file) in &template.files {
                if path == "design/theme-contract.json"
                    || path.starts_with("design/tokens/")
                    || path.starts_with("design/themes/")
                {
                    render::write_file(work.path(), path, file)?;
                }
            }
        }
        Ok(Self { work, location })
    }

    fn root(&self) -> &Path {
        match &self.location {
            Location::Project(root) => root.as_path(),
            Location::Embedded => self.work.path(),
        }
    }

    fn run(&self, script: &str, arguments: &[&OsStr]) -> Result<Output> {
        Command::new("node")
            .arg(self.work.path().join(SCRIPT_DIR).join("src").join(script))
            .arg(self.root())
            .args(arguments)
            .stdin(Stdio::null())
            .output()
            .context("running the theme checker")
    }
}

const SCRIPT_DIR: &str = "tools/design-build";

/// The checker's JSON, or the error it printed instead.
fn report<T: for<'a> Deserialize<'a>>(file: &Path, output: &Output) -> Result<T> {
    if output.stdout.is_empty() {
        return Err(format!(
            "{}: {}",
            file.display(),
            String::from_utf8_lossy(&output.stderr).trim()
        )
        .into());
    }
    serde_json::from_slice(&output.stdout).context("reading the theme check result")
}

pub fn run(args: &Args, out: Out) -> Result<Value> {
    let checker = Checker::new(args.project.as_deref())?;
    let version = env!("CARGO_PKG_VERSION");
    let output = checker.run(
        "check-theme.ts",
        &[args.file.as_os_str(), OsStr::new(version)],
    )?;
    let report: Report = report(&args.file, &output)?;
    if output.status.success() != report.ok {
        return Err("the theme checker exited with an inconsistent result".into());
    }
    let result = json!({ "source": checker.location.label(), "version": report.version, "ok": report.ok, "failures": report.failures });
    if report.ok {
        say!(
            out,
            "{} passes all contrast checks in light and dark mode (contract {}).",
            args.file.display(),
            report.version
        );
        Ok(result)
    } else {
        for failure in &report.failures {
            say!(out, "{failure}");
        }
        Err(Error::Failed(result))
    }
}

/// The name a theme gets from its file: `Brand Theme.json` is `brand-theme`.
fn default_name(file: &Path) -> String {
    let stem = file.file_stem().unwrap_or_default().to_string_lossy();
    let mut name = String::new();
    for character in stem.chars() {
        if character.is_ascii_alphanumeric() {
            name.push(character.to_ascii_lowercase());
        } else if !name.is_empty() && !name.ends_with('-') {
            name.push('-');
        }
    }
    name.trim_end_matches('-').to_owned()
}

/// Checks a theme as `check-theme` does and, when it passes, writes it as a stylesheet: every
/// token as a custom property on the elements that carry `data-<prefix>-theme="<name>"`.
pub fn export(args: &ExportArgs, out: Out) -> Result<Value> {
    let name = args
        .name
        .clone()
        .unwrap_or_else(|| default_name(&args.file));
    let valid = name.starts_with(|first: char| first.is_ascii_lowercase())
        && name.chars().all(|character| {
            character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
        });
    if !valid {
        return Err(format!(
            "a theme name is lowercase letters, digits and hyphens, starting with a letter: \"{name}\". Give one with --name."
        )
        .into());
    }
    let checker = Checker::new(args.project.as_deref())?;
    // A project's custom properties carry its own name, and its styles sit in no layer. Outside
    // one, the stylesheet is for the published web library: its names and its cascade layer.
    let (prefix, layer) = match &checker.location {
        Location::Project(root) => match render::Record::read(root) {
            Ok(record) => (record.name, String::new()),
            // This repository itself: the placeholder name.
            Err(_) => ("acme".to_owned(), String::new()),
        },
        Location::Embedded => ("xds".to_owned(), "xds.theme".to_owned()),
    };
    let version = env!("CARGO_PKG_VERSION");
    let output = checker.run(
        "export-theme.ts",
        &[
            args.file.as_os_str(),
            OsStr::new(version),
            OsStr::new(&name),
            OsStr::new(&prefix),
            OsStr::new(&layer),
        ],
    )?;
    let export: Export = report(&args.file, &output)?;
    if output.status.success() != export.ok {
        return Err("the theme checker exited with an inconsistent result".into());
    }
    let mut result = json!({ "source": checker.location.label(), "version": export.version, "ok": export.ok, "failures": export.failures, "name": name });
    let Some(css) = export.css.filter(|_| export.ok) else {
        for failure in &export.failures {
            say!(out, "{failure}");
        }
        return Err(Error::Failed(result));
    };
    match &args.out {
        Some(path) => {
            fs::write(path, &css).context(format!("writing {}", path.display()))?;
            result["out"] = json!(path);
            say!(
                out,
                "Wrote {}: set data-{prefix}-theme=\"{name}\" on an element to apply it.",
                path.display()
            );
        }
        None if out.json => result["css"] = json!(css),
        None => print!("{css}"),
    }
    Ok(result)
}
