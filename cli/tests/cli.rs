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
        vec!["tokens", "--help"],
        vec!["components", "--help"],
        vec!["contrast", "--help"],
        vec!["doctor", "--help"],
        vec!["mcp", "--help"],
    ] {
        let (output, stdout, _) = run(xds().args(&arguments));
        assert!(output.status.success(), "{arguments:?}");
        assert!(stdout.contains("Usage:"), "{arguments:?}");
        assert!(stdout.contains("--no-color"), "{arguments:?}");
        assert!(stdout.contains("--json"), "{arguments:?}");
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
        "web-solid",
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
    // The default target is marked like the default theme.
    let web = stdout
        .lines()
        .find(|line| line.trim_start().starts_with("web-react "))
        .expect("a line for web-react");
    assert!(web.ends_with(" (default)"), "{web}");
    let solid = stdout
        .lines()
        .find(|line| line.trim_start().starts_with("web-solid "))
        .expect("a line for web-solid");
    assert!(!solid.ends_with(" (default)"), "{solid}");
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

fn parse(text: &str) -> serde_json::Value {
    serde_json::from_str(text).unwrap_or_else(|error| panic!("not JSON ({error}): {text}"))
}

#[test]
fn json_output_is_one_document_and_nothing_else() {
    let temp = TempDir::new().expect("a temporary directory");

    let (output, stdout, stderr) = run(xds().args(["list", "--json"]).current_dir(temp.path()));
    assert!(output.status.success(), "{stderr}");
    let list = parse(&stdout);
    // Every target of template.json, where `default` may be left out.
    let manifest = parse(include_str!("../../template.json"));
    let expected: Vec<(&serde_json::Value, bool)> = manifest["targets"]
        .as_array()
        .expect("targets")
        .iter()
        .map(|target| (&target["id"], target["default"] == true))
        .collect();
    let listed: Vec<(&serde_json::Value, bool)> = list["targets"]
        .as_array()
        .expect("targets")
        .iter()
        .map(|target| (&target["id"], target["default"].as_bool().expect("a flag")))
        .collect();
    assert_eq!(listed, expected);
    assert!(list["themes"][0]["accent"]["600"].is_string(), "{stdout}");

    let (output, stdout, _) = run(xds().args(["themes", "ocean", "--json"]));
    assert!(output.status.success());
    assert_eq!(parse(&stdout)["themes"][0]["name"], "ocean");

    // Outside a project the answers come from the template inside the binary.
    let (output, stdout, _) = run(xds()
        .args(["tokens", "button.primary", "--json"])
        .current_dir(temp.path()));
    assert!(output.status.success());
    let tokens = parse(&stdout);
    assert_eq!(tokens["source"], "template");
    assert_eq!(
        tokens["tokens"][0]["path"],
        "color.button.primary.background"
    );
    assert_eq!(tokens["tokens"][0]["values"]["light"], "#4f46e5");

    let (output, stdout, _) = run(xds()
        .args([
            "components",
            "button",
            "--client",
            "web-react",
            "--code",
            "--json",
        ])
        .current_dir(temp.path()));
    assert!(output.status.success());
    let client = &parse(&stdout)["component"]["clients"]["web-react"];
    assert_eq!(client["source"], "packages/ui/src/Button.tsx");
    assert!(
        client["code"]
            .as_str()
            .expect("code")
            .contains("export function Button")
    );
}

#[test]
fn json_create_reports_the_files_and_reads_the_project_afterwards() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let create = |dry_run: bool| {
        let mut command = xds();
        command.arg("create").arg(&directory).args([
            "--name",
            "orbit",
            "--targets",
            "web-react",
            "--json",
        ]);
        if dry_run {
            command.arg("--dry-run");
        }
        run(&mut command)
    };

    let (output, stdout, stderr) = create(true);
    assert!(output.status.success(), "{stderr}");
    let planned = parse(&stdout);
    assert_eq!(planned["dryRun"], true);
    assert!(is_empty(&directory));

    let (output, stdout, stderr) = create(false);
    assert!(output.status.success(), "{stderr}");
    let created = parse(&stdout);
    assert_eq!(created["dryRun"], false);
    assert_eq!(created["files"], planned["files"]);
    assert_eq!(created["targets"][0], "web-react");
    assert_eq!(created["nextSteps"][0], "mise trust");

    // In the project the same commands read the project's own files.
    let (output, stdout, _) = run(xds().args(["components", "--json"]).current_dir(&directory));
    assert!(output.status.success());
    let components = parse(&stdout);
    assert_eq!(components["source"], "project");
    let names: Vec<&str> = components["components"]
        .as_array()
        .expect("components")
        .iter()
        .filter_map(|component| component["name"].as_str())
        .collect();
    assert!(
        names.contains(&"Button") && !names.contains(&"TabBar"),
        "{names:?}"
    );

    let (output, stdout, stderr) = run(xds().args(["doctor", "--json"]).current_dir(&directory));
    let report = parse(&stdout);
    assert_eq!(
        output.status.success(),
        report["ok"] == true,
        "{stdout}{stderr}"
    );
    let record = &report["checks"][0];
    assert_eq!(record["name"], "record");
    assert_eq!(record["status"], "ok", "{stdout}");

    let (output, stdout, _) = run(xds()
        .args(["add", "kotlin-compose", "--json"])
        .current_dir(&directory));
    assert!(output.status.success());
    let added = parse(&stdout);
    assert_eq!(added["added"][0], "kotlin-compose");
    assert!(added["newFiles"].as_u64().expect("a count") > 0);
}

#[test]
fn json_errors_go_to_stderr_with_the_documented_exit_codes() {
    // A failure.
    let (output, stdout, stderr) = run(xds().args(["themes", "nope", "--json"]));
    assert_eq!(output.status.code(), Some(1));
    assert!(stdout.is_empty(), "{stdout}");
    let error = parse(&stderr);
    assert_eq!(error["error"]["kind"], "error");
    assert!(
        error["error"]["message"]
            .as_str()
            .expect("a message")
            .contains("nope")
    );

    // Wrong arguments.
    let (output, stdout, stderr) = run(xds().args(["contrast", "#fff", "--json"]));
    assert_eq!(output.status.code(), Some(2));
    assert!(stdout.is_empty(), "{stdout}");
    assert_eq!(parse(&stderr)["error"]["kind"], "usage");

    // A check that did not pass is a result, not an error: stdout, and exit 1.
    let (output, stdout, stderr) =
        run(xds().args(["contrast", "#84848f", "#ffffff", "--min", "4.5", "--json"]));
    assert_eq!(output.status.code(), Some(1));
    assert!(stderr.is_empty(), "{stderr}");
    let result = parse(&stdout);
    assert_eq!(result["ok"], false);
    assert_eq!(result["results"][0]["ratio"], 3.69);
    assert_eq!(result["results"][0]["passes"]["ui"], true);

    // Tokens are measured in both modes.
    let (output, stdout, _) = run(xds().args([
        "contrast",
        "text.secondary",
        "background.surface",
        "--min",
        "4.5",
        "--json",
    ]));
    assert!(output.status.success());
    let result = parse(&stdout);
    assert_eq!(result["results"][0]["mode"], "light");
    assert_eq!(result["results"][1]["mode"], "dark");
}

/// Talks to `xds mcp` the way a client does: one JSON-RPC message per line on stdin, and the
/// answers read back from stdout.
#[test]
fn mcp_serves_the_tools_over_stdio() {
    use std::io::{BufRead, BufReader, Write};

    let temp = TempDir::new().expect("a temporary directory");
    let mut child = xds()
        .arg("mcp")
        .current_dir(temp.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .expect("xds mcp starts");
    let mut stdin = child.stdin.take().expect("stdin");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout"));
    let mut send = |message: serde_json::Value| {
        writeln!(stdin, "{message}").expect("xds mcp reads");
        stdin.flush().expect("flushes");
    };
    let mut answer = |id: u64| -> serde_json::Value {
        loop {
            let mut line = String::new();
            assert!(
                stdout.read_line(&mut line).expect("a line") > 0,
                "xds mcp hung up"
            );
            let message = parse(&line);
            if message["id"] == id {
                return message;
            }
        }
    };
    let call = |id: u64, name: &str, arguments: serde_json::Value| {
        serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "method": "tools/call",
            "params": { "name": name, "arguments": arguments },
        })
    };
    // The text of a tool result, parsed: every tool answers with the command's JSON.
    let result = |message: &serde_json::Value| -> serde_json::Value {
        assert_eq!(message["result"]["isError"], false, "{message}");
        parse(
            message["result"]["content"][0]["text"]
                .as_str()
                .expect("text"),
        )
    };

    send(serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2025-11-25",
            "capabilities": {},
            "clientInfo": { "name": "test", "version": "0" },
        },
    }));
    let hello = answer(1);
    assert_eq!(hello["result"]["serverInfo"]["name"], "xds", "{hello}");
    send(serde_json::json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));

    send(serde_json::json!({ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }));
    let listed = answer(2);
    let mut names: Vec<&str> = listed["result"]["tools"]
        .as_array()
        .expect("tools")
        .iter()
        .filter_map(|tool| tool["name"].as_str())
        .collect();
    names.sort_unstable();
    assert_eq!(
        names,
        [
            "add",
            "component",
            "components",
            "contrast",
            "create",
            "doctor",
            "list",
            "theme",
            "tokens"
        ]
    );

    send(call(
        3,
        "tokens",
        serde_json::json!({ "query": "button.primary.text" }),
    ));
    let tokens = result(&answer(3));
    assert_eq!(tokens["source"], "template");
    assert_eq!(tokens["tokens"][0]["values"]["light"], "#ffffff");

    send(call(
        4,
        "component",
        serde_json::json!({ "name": "Switch", "client": "web-react", "code": true }),
    ));
    let component = result(&answer(4));
    assert!(
        component["component"]["clients"]["web-react"]["code"]
            .as_str()
            .expect("code")
            .contains("role=\"switch\"")
    );

    // A tool that writes does nothing until it is told to.
    let directory = temp.path().join("project");
    let arguments = |write: bool| {
        serde_json::json!({
            "directory": directory,
            "name": "orbit",
            "targets": ["kotlin-compose"],
            "write": write,
        })
    };
    send(call(5, "create", arguments(false)));
    assert_eq!(result(&answer(5))["dryRun"], true);
    assert!(is_empty(&directory));
    send(call(6, "create", arguments(true)));
    assert_eq!(result(&answer(6))["dryRun"], false);
    assert!(directory.join(".xds.json").is_file());

    send(call(
        7,
        "theme",
        serde_json::json!({ "name": "ocean", "project": directory }),
    ));
    let themed = result(&answer(7));
    assert_eq!(themed["dryRun"], true);
    assert_eq!(themed["changed"], true);
    send(call(
        8,
        "add",
        serde_json::json!({ "targets": ["web-react"], "project": directory }),
    ));
    let added = result(&answer(8));
    assert_eq!(added["dryRun"], true);
    assert!(!directory.join("apps/web").exists());
    let record = std::fs::read_to_string(directory.join(".xds.json")).expect("a record");
    assert!(
        record.contains("\"indigo\"") && !record.contains("web-react"),
        "{record}"
    );

    // A mistake comes back as a tool error, not as a dead server.
    send(call(
        9,
        "theme",
        serde_json::json!({ "name": "nope", "project": directory }),
    ));
    let failed = answer(9);
    assert_eq!(failed["result"]["isError"], true, "{failed}");

    drop(stdin);
    assert!(child.wait().expect("xds mcp exits").success());
}
