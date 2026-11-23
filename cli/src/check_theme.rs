//! Run the token build's contrast checker on a theme without applying it to the project.

use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

use serde::Deserialize;
use serde_json::{Value, json};
use tempfile::{TempDir, tempdir};

use crate::error::{Context as _, Error, Result};
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
    /// The theme's name: what a page names it with, in `data-<prefix>-theme`, and the Kotlin
    /// value's, `<Name>Theme` [default: the file's name]
    #[arg(long)]
    name: Option<String>,
    /// What to write: a stylesheet for the web, a Kotlin file for the Compose components, or a
    /// TypeScript module for the React Native components
    #[arg(long, value_enum, default_value_t = Format::Css)]
    format: Format,
    /// The Kotlin file's package, with `--format compose` [default: `<prefix>.themes`]
    #[arg(long)]
    package: Option<String>,
    /// Where to write it [default: standard output]
    #[arg(long, short)]
    out: Option<PathBuf>,
    /// The project to read tokens from [default: the current directory, or the embedded template]
    #[arg(long)]
    project: Option<PathBuf>,
}

/// The kinds of file `export-theme` writes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
pub enum Format {
    /// A stylesheet that sets every token as a custom property
    Css,
    /// A Kotlin file with the theme as a value for the theme composable
    Compose,
    /// A TypeScript module with the theme as a value for the theme provider
    ReactNative,
}

impl Format {
    /// The format's name, as the token tool takes it.
    const fn field_format(self) -> &'static str {
        match self {
            Self::Css => "css",
            Self::Compose => "compose",
            Self::ReactNative => "react-native",
        }
    }

    /// The field of the JSON result that holds what was written.
    const fn field(self) -> &'static str {
        match self {
            Self::Css => "css",
            Self::Compose => "kotlin",
            Self::ReactNative => "typescript",
        }
    }
}

#[derive(Deserialize)]
struct Export {
    version: String,
    ok: bool,
    failures: Vec<String>,
    output: Option<String>,
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
        if matches!(location, Location::Embedded) {
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

/// Checks a theme as `check-theme` does and, when it passes, writes it for a client: as a
/// stylesheet that sets every token as a custom property on the elements that carry
/// `data-<prefix>-theme="<name>"`, or as a Kotlin value for the Compose theme composable.
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
    if args.package.is_some() && args.format != Format::Compose {
        return Err(
            "--package names the Kotlin file's package: use it with --format compose".into(),
        );
    }
    let checker = Checker::new(args.project.as_deref())?;
    // A project's custom properties and packages carry its own name, and its styles sit in no
    // layer. Outside one, the file is for the published library: its names and its cascade layer.
    let (prefix, layer, title) = match &checker.location {
        Location::Project(root) => match render::Record::read(root) {
            Ok(record) => {
                let title = theme_identifier(&record.name, &record.title);
                (record.name, String::new(), title)
            }
            // This repository itself: the placeholder name.
            Err(_) => ("acme".to_owned(), String::new(), "Acme".to_owned()),
        },
        Location::Embedded => ("xds".to_owned(), "xds.theme".to_owned(), "Xds".to_owned()),
    };
    let package = args
        .package
        .clone()
        .unwrap_or_else(|| format!("{prefix}.themes"));
    let tokens = format!("{prefix}.tokens");
    // The module that exports `Theme`: the published library's, or the project's own tokens.
    let module = match &checker.location {
        Location::Embedded => "@xds/react-native".to_owned(),
        Location::Project(_) => format!("@{prefix}/tokens"),
    };
    let (first, second) = match args.format {
        Format::Css => (prefix.as_str(), layer.as_str()),
        Format::Compose => (package.as_str(), tokens.as_str()),
        Format::ReactNative => (module.as_str(), ""),
    };
    let version = env!("CARGO_PKG_VERSION");
    let output = checker.run(
        "export-theme.ts",
        &[
            args.file.as_os_str(),
            OsStr::new(version),
            OsStr::new(&name),
            OsStr::new(args.format.field_format()),
            OsStr::new(first),
            OsStr::new(second),
        ],
    )?;
    let export: Export = report(&args.file, &output)?;
    if output.status.success() != export.ok {
        return Err("the theme checker exited with an inconsistent result".into());
    }
    let mut result = json!({ "source": checker.location.label(), "version": export.version, "ok": export.ok, "failures": export.failures, "name": name });
    let Some(text) = export.output.filter(|_| export.ok) else {
        for failure in &export.failures {
            say!(out, "{failure}");
        }
        return Err(Error::Failed(result));
    };
    match &args.out {
        Some(path) => {
            fs::write(path, &text).context(format!("writing {}", path.display()))?;
            result["out"] = json!(path);
            match args.format {
                Format::Css => say!(
                    out,
                    "Wrote {}: set data-{prefix}-theme=\"{name}\" on an element to apply it.",
                    path.display()
                ),
                Format::Compose => say!(
                    out,
                    "Wrote {}: pass {package}.{value} to {title}Theme(theme = {value}) to apply it.",
                    path.display(),
                    value = kotlin_value(&name),
                ),
                Format::ReactNative => say!(
                    out,
                    "Wrote {}: pass {value} to <{title}Theme theme={{{value}}}> to apply it.",
                    path.display(),
                    value = typescript_value(&name),
                ),
            }
        }
        None if out.json => result[args.format.field()] = json!(text),
        None => print!("{text}"),
    }
    Ok(result)
}

/// The Kotlin value a theme of this name is written as, as the token tool names it: `brand` is
/// `BrandTheme`, and a hyphen between two digits stays, as `_`: `v1-2` is `V1_2Theme`.
fn kotlin_value(name: &str) -> String {
    let characters: Vec<char> = name.chars().collect();
    let mut value = String::new();
    let mut upper = true;
    for (index, &character) in characters.iter().enumerate() {
        let digits = index > 0
            && characters[index - 1].is_ascii_digit()
            && characters.get(index + 1).is_some_and(char::is_ascii_digit);
        if character == '-' && digits {
            value.push('_');
        } else if character == '-' {
            upper = true;
        } else if upper {
            value.push(character.to_ascii_uppercase());
            upper = false;
        } else {
            value.push(character);
        }
    }
    value.push_str("Theme");
    value
}

/// The TypeScript value a theme of this name is written as, as the token tool names it:
/// `brand` is `brandTheme`, and a hyphen between two digits stays, as `_`: `v1-2` is `v1_2Theme`.
fn typescript_value(name: &str) -> String {
    let pascal = kotlin_value(name);
    let mut characters = pascal.chars();
    match characters.next() {
        Some(first) => format!("{}{}", first.to_ascii_lowercase(), characters.as_str()),
        None => pascal,
    }
}

/// The project's theme composable without its `Theme`: `Orbit` for `OrbitTheme`.
fn theme_identifier(name: &str, title: &str) -> String {
    crate::rename::Names::new(name, Some(title)).map_or_else(
        |_| crate::rename::capitalize(name),
        |names| names.identifier().to_owned(),
    )
}

#[cfg(test)]
mod tests {
    use super::{kotlin_value, typescript_value};

    #[test]
    fn a_theme_is_written_as_a_kotlin_value_named_as_the_token_tool_names_it() {
        assert_eq!(kotlin_value("brand"), "BrandTheme");
        assert_eq!(kotlin_value("brand-theme"), "BrandThemeTheme");
        assert_eq!(kotlin_value("checkout-2"), "Checkout2Theme");
        assert_eq!(kotlin_value("v1-2"), "V1_2Theme");
        assert_eq!(typescript_value("brand-theme"), "brandThemeTheme");
        assert_eq!(typescript_value("v1-2"), "v1_2Theme");
    }
}
