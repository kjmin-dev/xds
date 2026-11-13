//! The built binary, run the way a script or CI would run it: no terminal on either end.

use std::path::Path;
use std::process::{Command, Output, Stdio};

use tempfile::TempDir;

fn xds() -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_xds"));
    command
        .stdin(Stdio::null())
        .env_remove("NO_COLOR")
        .env_remove("FORCE_COLOR")
        .env_remove("CLICOLOR_FORCE");
    command
}

fn run(command: &mut Command) -> (Output, String, String) {
    let output = command.output().expect("xds starts");
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    (output, stdout, stderr)
}

fn is_empty(directory: &Path) -> bool {
    !directory.exists() || directory.read_dir().expect("a directory").next().is_none()
}

#[test]
fn prints_its_version() {
    let (output, stdout, _) = run(xds().arg("--version"));
    assert!(output.status.success());
    assert_eq!(stdout.trim(), format!("xds {}", env!("CARGO_PKG_VERSION")));
}

#[test]
fn every_command_has_help() {
    for arguments in [
        vec!["--help"],
        vec!["list", "--help"],
        vec!["themes", "--help"],
        vec!["create", "--help"],
        vec!["add", "--help"],
        vec!["theme", "--help"],
    ] {
        let (output, stdout, _) = run(xds().args(&arguments));
        assert!(output.status.success(), "{arguments:?}");
        assert!(stdout.contains("Usage:"), "{arguments:?}");
        assert!(stdout.contains("--no-color"), "{arguments:?}");
    }
    let (_, stdout, _) = run(xds().args(["create", "--help"]));
    for flag in [
        "--name",
        "--title",
        "--targets",
        "--theme",
        "--yes",
        "--dry-run",
        "--force",
    ] {
        assert!(stdout.contains(flag), "{flag}");
    }
}

#[test]
fn lists_targets_and_themes_without_color_when_piped() {
    let (output, stdout, _) = run(xds().arg("list"));
    assert!(output.status.success());
    for expected in [
        "web-react",
        "desktop-gpui",
        "mobile-react-native",
        "kotlin-compose",
        "indigo",
        "ocean",
        "(default)",
    ] {
        assert!(stdout.contains(expected), "{expected}");
    }
    assert!(
        !stdout.contains('\x1b'),
        "piped output has no escape sequences"
    );
}

#[test]
fn create_without_a_terminal_names_the_missing_flags() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");

    let (output, _, stderr) = run(xds().arg("create").arg(&directory));
    assert_eq!(output.status.code(), Some(1));
    assert!(
        stderr.contains("--name") && stderr.contains("--targets"),
        "{stderr}"
    );
    assert!(stderr.contains("--yes"), "{stderr}");
    assert!(is_empty(&directory));

    let (output, _, stderr) = run(xds()
        .arg("create")
        .arg(&directory)
        .args(["--name", "orbit"]));
    assert_eq!(output.status.code(), Some(1));
    assert!(
        stderr.contains("--targets") && !stderr.contains("--name"),
        "{stderr}"
    );
    assert!(is_empty(&directory));

    // With both, nothing is asked: the theme has a default.
    let (output, stdout, stderr) = run(xds().arg("create").arg(&directory).args([
        "--name",
        "orbit",
        "--targets",
        "web-react,desktop-gpui",
    ]));
    assert!(output.status.success(), "{stderr}");
    assert!(
        stdout.contains("mise install") && stdout.contains("mise run check"),
        "{stdout}"
    );
    assert!(
        stdout.contains("mise run //web:dev") && stdout.contains("mise run //desktop:dev"),
        "{stdout}"
    );
    assert!(!stdout.contains("//mobile"), "{stdout}");
    // Both stacks are formatted by the same command, which is asked for once.
    assert_eq!(stdout.matches("mise run fmt").count(), 1, "{stdout}");
    assert!(directory.join(".xds.json").is_file());
}

#[test]
fn a_dry_run_lists_the_files_and_writes_nothing() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let (output, stdout, _) = run(xds().arg("create").arg(&directory).args([
        "--name",
        "orbit",
        "--targets",
        "all",
        "--dry-run",
    ]));
    assert!(output.status.success());
    assert!(
        stdout.contains("  crates/orbit-ui/Cargo.toml\n"),
        "{stdout}"
    );
    assert!(stdout.contains("  .xds.json\n"), "{stdout}");
    assert!(stdout.contains("nothing was written"), "{stdout}");
    assert!(is_empty(&directory));
}

#[test]
fn says_the_generated_files_are_stale_when_node_is_missing() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    // An empty directory as PATH: there is no `node` to find.
    let (output, stdout, stderr) = run(xds()
        .env("PATH", temp.path())
        .arg("create")
        .arg(&directory)
        .args([
            "--name",
            "orbit",
            "--targets",
            "web-react",
            "--theme",
            "ocean",
        ]));
    assert!(output.status.success(), "{stderr}");
    assert!(
        stdout.contains("stale") && stdout.contains("mise run tokens"),
        "{stdout}"
    );

    // The same for `theme`, and the palette is changed all the same.
    let before = std::fs::read(directory.join("design/tokens/palette.json")).expect("a palette");
    let (output, stdout, stderr) = run(xds()
        .env("PATH", temp.path())
        .args(["theme", "plum", "--project"])
        .arg(&directory));
    assert!(output.status.success(), "{stderr}");
    assert!(
        stdout.contains("stale") && stdout.contains("mise run tokens"),
        "{stdout}"
    );
    assert_ne!(
        std::fs::read(directory.join("design/tokens/palette.json")).expect("a palette"),
        before
    );
}

#[test]
fn theme_without_a_terminal_needs_a_name() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let (output, stdout, stderr) = run(xds().arg("create").arg(&directory).args([
        "--name",
        "orbit",
        "--targets",
        "kotlin-compose",
    ]));
    assert!(output.status.success(), "{stderr}");
    assert!(
        !stdout.contains("mise run fmt"),
        "the Kotlin stack has no formatter: {stdout}"
    );

    let (output, _, stderr) = run(xds().arg("theme").arg("--project").arg(&directory));
    assert_eq!(output.status.code(), Some(1));
    assert!(
        stderr.contains("xds theme <name>") && stderr.contains("ocean"),
        "{stderr}"
    );
}

#[test]
fn themes_prints_colors_only_when_asked() {
    let (output, stdout, _) = run(xds().args(["themes", "ocean"]));
    assert!(output.status.success());
    assert!(!stdout.contains('\x1b'));
    assert!(
        stdout.contains("#045ebc"),
        "the plain form lists hex values: {stdout}"
    );

    let (_, stdout, _) = run(xds()
        .args(["themes", "ocean"])
        .env("FORCE_COLOR", "1")
        .env("COLORTERM", "truecolor"));
    assert!(
        stdout.contains("\x1b[0;1;38;2;"),
        "24-bit colors when forced"
    );
    assert!(stdout.contains("Light") && stdout.contains("Dark"));

    for arguments in [
        vec!["themes", "ocean", "--no-color"],
        vec!["--no-color", "themes", "ocean"],
    ] {
        let (_, stdout, _) = run(xds().args(&arguments).env("FORCE_COLOR", "1"));
        assert!(!stdout.contains('\x1b'), "{arguments:?}: --no-color wins");
    }
    let (_, stdout, _) = run(xds()
        .args(["themes", "ocean"])
        .env("FORCE_COLOR", "1")
        .env("NO_COLOR", "1"));
    assert!(!stdout.contains('\x1b'), "NO_COLOR wins");

    let (output, _, stderr) = run(xds().args(["themes", "neon"]));
    assert_eq!(output.status.code(), Some(1));
    assert!(stderr.contains("There is no theme"), "{stderr}");
}

#[test]
fn rejects_a_name_that_would_not_work() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let (output, _, stderr) =
        run(xds()
            .arg("create")
            .arg(&directory)
            .args(["--name", "My-App", "--targets", "all"]));
    assert_eq!(output.status.code(), Some(1));
    assert!(stderr.contains("lowercase"), "{stderr}");
    assert!(is_empty(&directory));
}
