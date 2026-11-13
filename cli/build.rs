//! Packs the template into the binary.
//!
//! The template is the repository this crate lives in. Everything git would track, minus what
//! `template.json` excludes, goes into a compressed tar under `OUT_DIR`, and `src/template.rs`
//! includes that file. `xds` therefore needs no network and always scaffolds the version of the
//! template it was built from.

use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::{env, io};

use flate2::Compression;
use flate2::write::GzEncoder;
use ignore::WalkBuilder;

/// Prefixes inside the archive. `src/template.rs` splits on the same two.
const TEMPLATE_PREFIX: &str = "template";
const OVERLAY_PREFIX: &str = "overlay";

fn main() -> io::Result<()> {
    let crate_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").expect("set by cargo"));
    let root = crate_dir
        .parent()
        .expect("the crate sits in the repository")
        .to_path_buf();
    let out_dir = PathBuf::from(env::var_os("OUT_DIR").expect("set by cargo"));

    let manifest_path = root.join("template.json");
    println!("cargo:rerun-if-changed={}", manifest_path.display());
    let manifest: serde_json::Value = serde_json::from_slice(&fs::read(&manifest_path)?)
        .unwrap_or_else(|error| panic!("{}: {error}", manifest_path.display()));
    let exclude: Vec<String> = manifest["exclude"]
        .as_array()
        .expect("template.json: `exclude` is a list of paths")
        .iter()
        .map(|path| {
            path.as_str()
                .expect("template.json: `exclude` holds strings")
                .to_owned()
        })
        .collect();

    let mut archive = Archive::default();
    archive.collect(&root, TEMPLATE_PREFIX, &exclude, true)?;
    // The overlay lives inside the excluded `cli` directory, so it is walked on its own. Ignore
    // files do not apply to it: an overlay may well carry a `.gitignore` for the project.
    archive.collect(&crate_dir.join("overlay"), OVERLAY_PREFIX, &[], false)?;
    archive.write(&out_dir.join("template.tar.gz"))
}

#[derive(Default)]
struct Archive {
    /// Archive path to file on disk. Sorted, so the same tree always gives the same bytes.
    files: BTreeMap<String, PathBuf>,
}

impl Archive {
    fn collect(
        &mut self,
        root: &Path,
        prefix: &str,
        exclude: &[String],
        honor_ignore_files: bool,
    ) -> io::Result<()> {
        let mut files = BTreeSet::new();
        let mut directories = BTreeSet::new();

        let walk = WalkBuilder::new(root)
            .standard_filters(honor_ignore_files)
            // Dotfiles such as .editorconfig and .github are part of the template.
            .hidden(false)
            // Only .gitignore files decide: a source tarball has no .git directory, and a
            // developer's global ignore file should not change what ships.
            .require_git(false)
            .ignore(false)
            .git_global(false)
            .git_exclude(false)
            .parents(false)
            .filter_entry(|entry| entry.file_name() != ".git")
            .build();
        for entry in walk {
            let entry = entry.map_err(io::Error::other)?;
            let path = entry.path();
            let relative = relative_path(root, path);
            if relative.is_empty() {
                directories.insert(path.to_path_buf());
                continue;
            }
            if is_excluded(&relative, exclude) {
                continue;
            }
            let file_type = entry.file_type().expect("only stdin has no file type");
            if file_type.is_dir() {
                directories.insert(path.to_path_buf());
            } else if file_type.is_file() {
                files.insert(path.to_path_buf());
                self.files
                    .insert(format!("{prefix}/{relative}"), path.to_path_buf());
            } else {
                println!("cargo:warning=left out of the template (not a regular file): {relative}");
            }
        }

        if watch(root, root, exclude, &files, &directories)? {
            println!("cargo:rerun-if-changed={}", root.display());
        }
        Ok(())
    }

    fn write(&self, path: &Path) -> io::Result<()> {
        let encoder = GzEncoder::new(File::create(path)?, Compression::best());
        let mut tar = tar::Builder::new(encoder);
        for (name, source) in &self.files {
            let contents = fs::read(source)?;
            let mut header = tar::Header::new_gnu();
            header.set_size(contents.len() as u64);
            // The only bit that matters is "executable", for scripts such as a Gradle wrapper.
            header.set_mode(if is_executable(source)? { 0o755 } else { 0o644 });
            header.set_mtime(0);
            tar.append_data(&mut header, name, contents.as_slice())?;
        }
        tar.into_inner()?.finish()?;
        Ok(())
    }
}

/// Tells cargo what to watch. Returns true when `directory` holds nothing ignored, in which case
/// nothing was printed for it and the caller watches it as a whole.
///
/// Cargo watches a directory recursively and follows symlinks, so watching the repository root
/// would rebuild on every change under `target/` or `node_modules/`. Only directories with
/// nothing ignored inside are watched as directories; elsewhere files are watched one by one.
/// The cost: a new file placed directly in a directory that also holds ignored entries (the
/// root, a package with `node_modules`) is picked up only when another watched path changes.
fn watch(
    root: &Path,
    directory: &Path,
    exclude: &[String],
    files: &BTreeSet<PathBuf>,
    directories: &BTreeSet<PathBuf>,
) -> io::Result<bool> {
    let mut children = fs::read_dir(directory)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<io::Result<Vec<_>>>()?;
    children.sort();

    let mut clean = true;
    let mut watched = Vec::new();
    for child in children {
        if files.contains(&child) {
            watched.push(child);
        } else if directories.contains(&child) {
            if watch(root, &child, exclude, files, directories)? {
                watched.push(child);
            } else {
                clean = false;
            }
        } else if !is_excluded(&relative_path(root, &child), exclude) {
            // Ignored: build output, dependencies, .git.
            clean = false;
        }
        // An excluded path is neither watched nor a reason to give up on the directory: if the
        // directory ends up watched as a whole, a change to it costs a needless rerun.
    }
    if clean {
        return Ok(true);
    }
    for path in watched {
        println!("cargo:rerun-if-changed={}", path.display());
    }
    Ok(false)
}

fn relative_path(root: &Path, path: &Path) -> String {
    let relative = path
        .strip_prefix(root)
        .expect("the walk stays under its root");
    relative
        .components()
        .map(|part| part.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

fn is_excluded(relative: &str, exclude: &[String]) -> bool {
    exclude.iter().any(|excluded| {
        relative == excluded
            || relative
                .strip_prefix(excluded.as_str())
                .is_some_and(|rest| rest.starts_with('/'))
    })
}

#[cfg(unix)]
fn is_executable(path: &Path) -> io::Result<bool> {
    use std::os::unix::fs::PermissionsExt;
    Ok(fs::metadata(path)?.permissions().mode() & 0o111 != 0)
}

#[cfg(not(unix))]
fn is_executable(_path: &Path) -> io::Result<bool> {
    Ok(false)
}
