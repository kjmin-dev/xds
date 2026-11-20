//! Run the token build's contrast checker on a theme without applying it to the project.

use std::path::PathBuf;
use std::process::{Command, Stdio};

use serde::Deserialize;
use serde_json::{Value, json};
use tempfile::tempdir;

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

pub fn run(args: &Args, out: Out) -> Result<Value> {
    let location = Location::find(args.project.as_deref())?;
    theme::check_node()?;
    let work = tempdir().context("creating a temporary directory for the theme checker")?;
    // The binary supplies the code even when the user points at another project's data.
    let template = template::template();
    let script_dir = "tools/design-build";
    for file in [
        "package.json",
        "src/model.ts",
        "src/themes.ts",
        "src/contrast.ts",
        "src/theme-contract.ts",
        "src/check-theme.ts",
    ] {
        let path = format!("{script_dir}/{file}");
        render::write_file(work.path(), &path, &template.files[&path])?;
    }
    let root = match &location {
        Location::Project(root) => root.as_path(),
        Location::Embedded => {
            for (path, file) in &template.files {
                if path == "design/theme-contract.json"
                    || path.starts_with("design/tokens/")
                    || path.starts_with("design/themes/")
                {
                    render::write_file(work.path(), path, file)?;
                }
            }
            work.path()
        }
    };
    let output = Command::new("node")
        .arg(work.path().join(script_dir).join("src/check-theme.ts"))
        .arg(root)
        .arg(&args.file)
        .arg(env!("CARGO_PKG_VERSION"))
        .stdin(Stdio::null())
        .output()
        .context("running the theme checker")?;
    if output.stdout.is_empty() {
        return Err(format!(
            "{}: {}",
            args.file.display(),
            String::from_utf8_lossy(&output.stderr).trim()
        )
        .into());
    }
    let report: Report =
        serde_json::from_slice(&output.stdout).context("reading the theme check result")?;
    if output.status.success() != report.ok {
        return Err("the theme checker exited with an inconsistent result".into());
    }
    let result = json!({ "source": location.label(), "version": report.version, "ok": report.ok, "failures": report.failures });
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
