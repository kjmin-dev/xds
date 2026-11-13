//! The template files that `build.rs` packed into the binary.

use std::collections::BTreeMap;
use std::io::Read;
use std::sync::OnceLock;

use flate2::read::GzDecoder;

static ARCHIVE: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/template.tar.gz"));

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct File {
    pub contents: Vec<u8>,
    pub executable: bool,
}

/// Files by path, `/`-separated and relative to the project root.
pub type Files = BTreeMap<String, File>;

#[derive(Debug, Default)]
pub struct Template {
    /// The repository as it was when the binary was built, minus what `template.json` excludes.
    pub files: Files,
    /// `cli/overlay`: files written over the project root, such as the project's own README.
    pub overlay: Files,
}

pub fn template() -> &'static Template {
    static TEMPLATE: OnceLock<Template> = OnceLock::new();
    // The archive was written by build.rs in the same build, so failing to read it is a bug in
    // this crate rather than something the person running it can act on.
    TEMPLATE.get_or_init(|| unpack(ARCHIVE).expect("the embedded template is a valid archive"))
}

fn unpack(archive: &[u8]) -> std::io::Result<Template> {
    let mut template = Template::default();
    let mut tar = tar::Archive::new(GzDecoder::new(archive));
    for entry in tar.entries()? {
        let mut entry = entry?;
        let path = entry.path()?.to_string_lossy().into_owned();
        let executable = entry.header().mode()? & 0o111 != 0;
        let mut contents = Vec::with_capacity(entry.size() as usize);
        entry.read_to_end(&mut contents)?;
        let file = File {
            contents,
            executable,
        };
        if let Some(path) = path.strip_prefix("template/") {
            template.files.insert(path.to_owned(), file);
        } else if let Some(path) = path.strip_prefix("overlay/") {
            template.overlay.insert(path.to_owned(), file);
        }
    }
    Ok(template)
}

/// Git's rule of thumb: a NUL byte near the start means the file is not text.
pub fn is_binary(contents: &[u8]) -> bool {
    contents.iter().take(8 * 1024).any(|&byte| byte == 0)
}
