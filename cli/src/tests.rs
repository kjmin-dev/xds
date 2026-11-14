//! Whole commands run against temporary directories, with the template that is compiled in.
//!
//! Every `create` here passes `yes`, so nothing prompts when the tests run in a terminal. What
//! needs a real process (exit codes, a missing terminal, PATH) is in `tests/cli.rs`.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;
use tempfile::TempDir;

use crate::commands::{self, AddArgs, CreateArgs, MERGE_SUFFIX, ThemeArgs};
use crate::inspect::{self, COMPONENTS_PATH, Location};
use crate::manifest::{Target, is_under, manifest};
use crate::markers;
use crate::output::Out;
use crate::rename::Names;
use crate::render::{self, BUILD_CONFIG, RECORD, Record};
use crate::template::{is_binary, template};
use crate::theme::{self, PALETTE_PATH, Source};

const WEB: &str = "web-react";
const DESKTOP: &str = "desktop-gpui";
const MOBILE: &str = "mobile-react-native";
const KOTLIN: &str = "kotlin-compose";

/// Paths that must never reach a project, whatever is selected.
const TEMPLATE_ONLY_PATHS: &[&str] = &[
    "cli",
    "npm",
    "install.sh",
    "template.json",
    "README.ko.md",
    "CONTRIBUTING.md",
    "skills",
    ".claude-plugin",
    "LICENSE",
    "docs/cli.md",
    "docs/images",
    ".github/workflows/release.yml",
    "Cargo.lock",
    "pnpm-lock.yaml",
    "mise.lock",
];

/// The files that carry `@if` blocks.
const MARKER_FILES: &[&str] = &[
    "mise.toml",
    "Cargo.toml",
    "pnpm-workspace.yaml",
    ".gitignore",
    ".gitattributes",
    ".github/workflows/ci.yml",
    "README.md",
    "AGENTS.md",
];

type Tree = BTreeMap<String, Vec<u8>>;

fn create_args(directory: &Path, targets: &[&str]) -> CreateArgs {
    CreateArgs {
        directory: directory.to_path_buf(),
        name: Some("orbit".to_owned()),
        targets: Some(targets.iter().map(|target| (*target).to_owned()).collect()),
        yes: true,
        ..CreateArgs::default()
    }
}

/// Creates a project named `orbit` with `targets` in a fresh temporary directory.
fn project(targets: &[&str]) -> (TempDir, PathBuf) {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    commands::create(&create_args(&directory, targets), Out::plain()).expect("create succeeds");
    (temp, directory)
}

fn read_tree(root: &Path) -> Tree {
    fn visit(root: &Path, directory: &Path, tree: &mut Tree) {
        for entry in fs::read_dir(directory).expect("a readable directory") {
            let path = entry.expect("a directory entry").path();
            if path.is_dir() {
                visit(root, &path, tree);
            } else {
                let relative = path.strip_prefix(root).expect("under the root");
                let relative: Vec<_> = relative
                    .components()
                    .map(|part| part.as_os_str().to_string_lossy())
                    .collect();
                tree.insert(
                    relative.join("/"),
                    fs::read(&path).expect("a readable file"),
                );
            }
        }
    }
    let mut tree = Tree::new();
    visit(root, root, &mut tree);
    tree
}

fn has_path(tree: &Tree, prefix: &str) -> bool {
    tree.keys().any(|path| is_under(path, prefix))
}

fn text(tree: &Tree, path: &str) -> String {
    let contents = tree
        .get(path)
        .unwrap_or_else(|| panic!("{path} is missing"));
    String::from_utf8(contents.clone()).unwrap_or_else(|_| panic!("{path} is not text"))
}

fn json(tree: &Tree, path: &str) -> Value {
    serde_json::from_str(&text(tree, path)).unwrap_or_else(|error| panic!("{path}: {error}"))
}

fn build_outputs(tree: &Tree) -> BTreeMap<String, String> {
    json(tree, BUILD_CONFIG)["outputs"]
        .as_object()
        .expect("outputs is an object")
        .iter()
        .map(|(kind, path)| (kind.clone(), path.as_str().expect("a path").to_owned()))
        .collect()
}

/// What holds for every project, whatever was selected.
fn assert_clean(tree: &Tree, ids: &[&str]) {
    for (path, contents) in tree {
        assert!(
            !path.to_lowercase().contains("acme"),
            "the placeholder is left in the path {path}"
        );
        if is_binary(contents) {
            continue;
        }
        let Ok(text) = std::str::from_utf8(contents) else {
            continue;
        };
        for (index, line) in text.lines().enumerate() {
            assert!(
                markers::parse(line).is_none(),
                "{path}:{}: a marker is left: {line}",
                index + 1
            );
            assert!(
                !line.to_lowercase().contains("acme"),
                "{path}:{}: the placeholder is left: {line}",
                index + 1
            );
        }
    }
    // Dropping a block must not leave a hole where it was.
    for path in MARKER_FILES.iter().filter(|path| tree.contains_key(**path)) {
        let text = text(tree, path);
        assert!(!text.contains("\n\n\n"), "{path} has a double blank line");
        assert!(
            !text.starts_with('\n') && !text.ends_with("\n\n"),
            "{path} starts or ends with a blank line"
        );
    }
    for path in TEMPLATE_ONLY_PATHS {
        assert!(!has_path(tree, path), "{path} belongs to the template only");
    }
    for common in &manifest().common {
        assert!(has_path(tree, common), "{common} is missing");
    }
    assert!(
        tree.contains_key("README.md"),
        "the project has its own README"
    );

    // The generator is told to write exactly the kinds the targets read, and those files exist.
    let targets = manifest()
        .select(&ids.iter().map(|id| (*id).to_owned()).collect::<Vec<_>>())
        .expect("known ids");
    let wanted = manifest().output_kinds(&targets);
    let outputs = build_outputs(tree);
    assert_eq!(
        outputs.keys().map(String::as_str).collect::<BTreeSet<_>>(),
        wanted
    );
    for (kind, path) in &outputs {
        assert!(
            tree.contains_key(path),
            "the {kind} output {path} is missing"
        );
    }
    // And no generated file of another kind came along.
    let names = Names::new("orbit", None).expect("a valid name");
    let all: Value =
        serde_json::from_slice(&template().files[BUILD_CONFIG].contents).expect("valid JSON");
    for (kind, path) in all["outputs"].as_object().expect("outputs is an object") {
        let path = names.apply(path.as_str().expect("a path"), &manifest().placeholder);
        assert_eq!(
            tree.contains_key(&path),
            wanted.contains(kind.as_str()),
            "{kind}: {path}"
        );
    }

    let record: Record = serde_json::from_str(&text(tree, RECORD)).expect("a valid record");
    assert_eq!(record.xds, env!("CARGO_PKG_VERSION"));
    assert_eq!(record.name, "orbit");
    assert_eq!(record.title, "Orbit");
    assert_eq!(
        record.targets,
        targets
            .iter()
            .map(|target| target.id.clone())
            .collect::<Vec<_>>()
    );
    assert_eq!(record.theme, manifest().default_theme);
}

fn assert_paths(tree: &Tree, present: &[&str], absent: &[&str]) {
    for path in present {
        assert!(has_path(tree, path), "{path} is missing");
    }
    for path in absent {
        assert!(!has_path(tree, path), "{path} should not be there");
    }
}

// ---------------------------------------------------------------- the manifest

#[test]
fn every_template_file_belongs_to_something() {
    let manifest = manifest();
    let all: Vec<&Target> = manifest.targets.iter().collect();
    let mut prefixes = manifest.prefixes(&all);
    prefixes.extend(
        manifest
            .shared
            .values()
            .flat_map(|unit| unit.paths.iter().map(String::as_str)),
    );
    let unclaimed: Vec<&String> = template()
        .files
        .keys()
        .filter(|path| !prefixes.iter().any(|prefix| is_under(path, prefix)))
        .collect();
    assert!(
        unclaimed.is_empty(),
        "template.json has to say where these go (common, a target, a shared unit) or exclude them: {unclaimed:?}"
    );
}

#[test]
fn the_manifest_is_consistent() {
    let manifest = manifest();
    let kinds: Vec<String> =
        render::output_kinds(&template().files[BUILD_CONFIG].contents).expect("outputs");
    let mut used = BTreeSet::new();
    for target in &manifest.targets {
        assert!(!target.run.is_empty(), "{} has no run command", target.id);
        for unit in &target.requires {
            assert!(
                manifest.shared.contains_key(unit),
                "{}: no shared unit {unit}",
                target.id
            );
        }
        for kind in &target.outputs {
            assert!(
                kinds.contains(kind),
                "{}: design/build.json has no {kind} output",
                target.id
            );
            used.insert(kind.clone());
        }
        for path in &target.paths {
            assert!(
                template().files.keys().any(|file| is_under(file, path)),
                "{}: nothing at {path}",
                target.id
            );
        }
    }
    assert_eq!(
        used,
        kinds.into_iter().collect(),
        "every output kind is read by some target"
    );
    for path in &manifest.exclude {
        assert!(
            !template().files.keys().any(|file| is_under(file, path)),
            "{path} was embedded"
        );
    }
    assert!(!template().overlay.is_empty());
}

#[test]
fn shared_files_are_valid_for_every_combination_of_targets() {
    let ids = manifest().target_ids();
    let names = Names::new("orbit", None).expect("a valid name");
    // Every non-empty subset of the targets.
    for mask in 1u32..(1 << ids.len()) {
        let selected: Vec<String> = ids
            .iter()
            .enumerate()
            .filter(|(bit, _)| mask & (1 << bit) != 0)
            .map(|(_, id)| (*id).to_owned())
            .collect();
        let targets = manifest().select(&selected).expect("known ids");
        let files = render::render(template(), manifest(), &targets, &names).expect("renders");
        let has = |id: &str| selected.iter().any(|selected| selected == id);
        let js = has(WEB) || has(MOBILE);

        let read = |path: &str| String::from_utf8(files[path].contents.clone()).expect("text");
        let mise: toml::Table = read("mise.toml")
            .parse()
            .unwrap_or_else(|error| panic!("{selected:?}: mise.toml: {error}"));

        let tools: BTreeSet<&str> = mise["tools"]
            .as_table()
            .expect("tools")
            .keys()
            .map(String::as_str)
            .collect();
        let mut expected_tools = BTreeSet::from(["node", "actionlint"]);
        if js {
            expected_tools.insert("pnpm");
        }
        if has(DESKTOP) {
            expected_tools.insert("rust");
        }
        if has(KOTLIN) {
            expected_tools.insert("java");
        }
        assert_eq!(tools, expected_tools, "{selected:?}");

        let roots: Vec<&str> = mise["monorepo"]["config_roots"]
            .as_array()
            .expect("config_roots")
            .iter()
            .map(|root| root.as_str().expect("a path"))
            .collect();
        let mut expected_roots = Vec::new();
        if js || has(DESKTOP) {
            expected_roots.push("apps/*");
        }
        if has(KOTLIN) {
            expected_roots.push("kotlin");
        }
        assert_eq!(roots, expected_roots, "{selected:?}");

        // `check` runs exactly the checks that exist.
        let tasks = mise["tasks"].as_table().expect("tasks");
        let checks: Vec<&str> = tasks["check"]["run"][1]["tasks"]
            .as_array()
            .expect("the parallel checks")
            .iter()
            .map(|task| task.as_str().expect("a task name"))
            .collect();
        let mut expected_checks = Vec::new();
        if js {
            expected_checks.push("check:js");
        }
        if has(DESKTOP) {
            expected_checks.extend(["check:rust", "check:desktop"]);
        }
        if has(KOTLIN) {
            expected_checks.push("//kotlin:check");
        }
        expected_checks.push("check:workflows");
        assert_eq!(checks, expected_checks, "{selected:?}");
        for check in checks.iter().filter(|check| !check.starts_with("//")) {
            assert!(
                tasks.contains_key(*check),
                "{selected:?}: {check} is not defined"
            );
        }
        for task in ["tokens", "check:generated", "theme"] {
            assert!(
                tasks[task]["run"]
                    .as_str()
                    .expect("a command")
                    .starts_with("node tools/design-build/")
            );
        }
        assert_eq!(tasks.contains_key("install"), js, "{selected:?}");
        assert!(
            !tasks.contains_key("check:cli") && !tasks.contains_key("xds"),
            "{selected:?}"
        );

        // The Rust workspace exists only for the desktop app, and never mentions the CLI.
        assert_eq!(
            files.contains_key("Cargo.toml"),
            has(DESKTOP),
            "{selected:?}"
        );
        if has(DESKTOP) {
            let cargo: toml::Table = read("Cargo.toml")
                .parse()
                .unwrap_or_else(|error| panic!("Cargo.toml: {error}"));
            let members: Vec<&str> = cargo["workspace"]["members"]
                .as_array()
                .expect("members")
                .iter()
                .map(|member| member.as_str().expect("a path"))
                .collect();
            assert_eq!(members, ["crates/*", "apps/desktop"]);
            assert!(
                !cargo["profile"]
                    .as_table()
                    .expect("profiles")
                    .contains_key("dist")
            );
        }

        // The JavaScript workspace lists only the apps that exist.
        assert_eq!(
            files.contains_key("pnpm-workspace.yaml"),
            js,
            "{selected:?}"
        );
        if js {
            let workspace = read("pnpm-workspace.yaml");
            assert_eq!(workspace.contains("- apps/web\n"), has(WEB), "{selected:?}");
            assert_eq!(
                workspace.contains("- apps/mobile\n"),
                has(MOBILE),
                "{selected:?}"
            );
        }

        // One CI job per check, and none for the CLI.
        let ci = read(".github/workflows/ci.yml");
        for (job, expected) in [
            ("  generated:\n", true),
            ("  js:\n", js),
            ("  rust:\n", has(DESKTOP)),
            ("  desktop:\n", has(DESKTOP)),
            ("  kotlin:\n", has(KOTLIN)),
            ("  cli:\n", false),
        ] {
            assert_eq!(ci.contains(job), expected, "{selected:?}: job {job:?}");
        }
        assert!(ci.ends_with("\n") && !ci.ends_with("\n\n"), "{selected:?}");
        // CI turns off mise's automatic installs, so a job has only the tools it names, and it
        // can only name tools the project pins.
        for names in ci
            .lines()
            .filter_map(|line| line.trim().strip_prefix("install_args: "))
        {
            for tool in names.split_whitespace() {
                assert!(tools.contains(tool), "{selected:?}: ci.yml installs {tool}");
            }
        }

        // The README names the selected stacks and no others.
        let readme = read("README.md");
        for (command, expected) in [
            ("mise run //web:dev", has(WEB)),
            ("mise run //desktop:dev", has(DESKTOP)),
            ("mise run //mobile:ios", has(MOBILE)),
            ("mise run //kotlin:desktop", has(KOTLIN)),
        ] {
            assert_eq!(
                readme.contains(command),
                expected,
                "{selected:?}: {command}"
            );
        }
        assert!(readme.starts_with("# Orbit\n"), "{selected:?}");

        // So does the guide for coding agents, and it points at paths that exist.
        let agents = read("AGENTS.md");
        for (path, expected) in [
            ("`packages/ui`", has(WEB)),
            ("`crates/orbit-ui`", has(DESKTOP)),
            ("`packages/ui-native`", has(MOBILE)),
            ("`kotlin/ui`", has(KOTLIN)),
            ("`packages/tokens`", js),
            ("mise run fmt", js || has(DESKTOP)),
        ] {
            assert_eq!(agents.contains(path), expected, "{selected:?}: {path}");
        }
        assert!(agents.starts_with("# Working in Orbit\n"), "{selected:?}");
        assert_eq!(read("CLAUDE.md"), "@AGENTS.md\n", "{selected:?}");

        // The component contract names the selected clients only, and files of this project.
        let components: Value = serde_json::from_str(&read(COMPONENTS_PATH)).expect("valid JSON");
        let components = components["components"].as_array().expect("a list");
        assert!(!components.is_empty(), "{selected:?}");
        let touch = has(MOBILE) || has(KOTLIN);
        assert_eq!(
            components
                .iter()
                .any(|component| component["name"] == "TabBar"),
            touch,
            "{selected:?}: TabBar"
        );
        for component in components {
            let clients = component["clients"].as_object().expect("clients");
            assert!(!clients.is_empty(), "{selected:?}: {}", component["name"]);
            for (id, client) in clients {
                assert!(has(id), "{selected:?}: {} lists {id}", component["name"]);
                let path = client["source"].as_str().expect("a path");
                assert!(files.contains_key(path), "{selected:?}: {path} is missing");
            }
        }
    }
}

// ---------------------------------------------------------------- create

#[test]
fn creates_a_web_project() {
    let (_temp, directory) = project(&[WEB]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[WEB]);
    assert_paths(
        &tree,
        &[
            "apps/web/package.json",
            "packages/ui/package.json",
            "packages/tokens/package.json",
            "packages/tokens/src/generated/theme.css",
            "packages/tokens/src/generated/tailwind.css",
            "packages/tokens/src/generated/tokens.ts",
            "package.json",
            "pnpm-workspace.yaml",
            "biome.json",
            "tsconfig.base.json",
            "tools/design-build/src/build.ts",
            "design/themes",
        ],
        &[
            "apps/desktop",
            "apps/mobile",
            "packages/ui-native",
            "crates",
            "kotlin",
            "Cargo.toml",
        ],
    );
    assert_eq!(json(&tree, "package.json")["name"], "orbit");
    assert_eq!(json(&tree, "packages/ui/package.json")["name"], "@orbit/ui");
    assert!(text(&tree, "packages/tokens/src/generated/theme.css").contains("--orbit-color-"));
    assert!(text(&tree, "mise.toml").contains("pnpm --filter @orbit/web build"));
}

#[test]
fn creates_a_desktop_project() {
    let (_temp, directory) = project(&[DESKTOP]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[DESKTOP]);
    assert_paths(
        &tree,
        &[
            "apps/desktop/Cargo.toml",
            "apps/desktop/mise.toml",
            "crates/orbit-ui/Cargo.toml",
            "crates/orbit-tokens/src/generated.rs",
            "Cargo.toml",
        ],
        &[
            "apps/web",
            "apps/mobile",
            "packages",
            "kotlin",
            "package.json",
            "pnpm-workspace.yaml",
            "biome.json",
        ],
    );
    assert!(text(&tree, "Cargo.toml").contains("orbit-ui = { path = \"crates/orbit-ui\" }"));
    assert!(text(&tree, "apps/desktop/Cargo.toml").contains("name = \"orbit-desktop\""));
    assert_eq!(
        build_outputs(&tree)["rust"],
        "crates/orbit-tokens/src/generated.rs"
    );
}

#[test]
fn creates_a_mobile_project() {
    let (_temp, directory) = project(&[MOBILE]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[MOBILE]);
    assert_paths(
        &tree,
        &[
            "apps/mobile/package.json",
            "packages/ui-native/package.json",
            "packages/tokens/src/index.ts",
            "packages/tokens/src/generated/tokens.ts",
            "package.json",
            "biome.json",
        ],
        &[
            "apps/web",
            "apps/desktop",
            "packages/ui",
            "packages/tokens/src/generated/theme.css",
            "packages/tokens/src/generated/tailwind.css",
            "crates",
            "kotlin",
            "Cargo.toml",
        ],
    );
}

#[test]
fn creates_a_kotlin_project() {
    let (_temp, directory) = project(&[KOTLIN]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[KOTLIN]);
    assert_paths(
        &tree,
        &[
            "kotlin/settings.gradle.kts",
            "kotlin/gradlew",
            "kotlin/mise.toml",
        ],
        &[
            "apps",
            "packages",
            "crates",
            "Cargo.toml",
            "package.json",
            "pnpm-workspace.yaml",
            "biome.json",
        ],
    );
    // The Kotlin package follows the name, in the path and in the generator's configuration.
    let tokens = &build_outputs(&tree)["kotlin"];
    assert!(tokens.contains("/orbit/tokens/"), "{tokens}");
    assert!(text(&tree, tokens).contains("package orbit.tokens"));
}

#[cfg(unix)]
#[test]
fn keeps_scripts_executable() {
    use std::os::unix::fs::PermissionsExt;
    let (_temp, directory) = project(&[KOTLIN]);
    let mode = fs::metadata(directory.join("kotlin/gradlew"))
        .expect("gradlew exists")
        .permissions()
        .mode();
    assert_ne!(mode & 0o111, 0, "gradlew is executable");
    let mode = fs::metadata(directory.join("mise.toml"))
        .expect("mise.toml exists")
        .permissions()
        .mode();
    assert_eq!(mode & 0o111, 0, "ordinary files are not");
}

#[test]
fn creates_a_project_with_every_target() {
    let (_temp, directory) = project(&["all"]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[WEB, DESKTOP, MOBILE, KOTLIN]);
    assert_paths(
        &tree,
        &[
            "apps/web",
            "apps/desktop",
            "apps/mobile",
            "packages/ui",
            "packages/ui-native",
            "crates/orbit-ui",
            "kotlin",
        ],
        &[],
    );
    // Nothing of the template is lost: every embedded file is there, renamed.
    let names = Names::new("orbit", None).expect("a valid name");
    for path in template().files.keys() {
        let path = names.apply(path, &manifest().placeholder);
        assert!(tree.contains_key(&path), "{path} is missing");
    }
}

#[test]
fn takes_the_name_from_the_directory_and_a_title_from_the_flag() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("Orbit-Notes");
    let args = CreateArgs {
        directory: directory.clone(),
        title: Some("Orbit Notes".to_owned()),
        targets: Some(vec![WEB.to_owned(), KOTLIN.to_owned()]),
        yes: true,
        ..CreateArgs::default()
    };
    commands::create(&args, Out::plain()).expect("create succeeds");
    let tree = read_tree(&directory);
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(
        (record.name.as_str(), record.title.as_str()),
        ("orbitnotes", "Orbit Notes")
    );
    assert!(text(&tree, "apps/web/index.html").contains("<title>Orbit Notes</title>"));
    assert_eq!(json(&tree, "package.json")["name"], "orbitnotes");
    // Where the title is part of an identifier, it loses its space.
    let kotlin: String = tree
        .iter()
        .filter(|(path, contents)| path.ends_with(".kt") && !is_binary(contents))
        .map(|(_, contents)| String::from_utf8_lossy(contents).into_owned())
        .collect();
    assert!(!kotlin.contains("Orbit NotesTheme"));
}

#[test]
fn a_dry_run_writes_nothing() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let args = CreateArgs {
        dry_run: true,
        theme: Some("ocean".to_owned()),
        ..create_args(&directory, &["all"])
    };
    commands::create(&args, Out::plain()).expect("a dry run succeeds");
    assert!(!directory.exists());
}

#[test]
fn refuses_a_directory_that_is_not_empty_unless_forced() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    fs::create_dir_all(&directory).expect("a directory");
    // An empty directory is fine.
    commands::create(
        &CreateArgs {
            dry_run: true,
            ..create_args(&directory, &[WEB])
        },
        Out::plain(),
    )
    .expect("an empty directory is accepted");

    fs::write(directory.join("notes.txt"), "mine").expect("a file");
    let error =
        commands::create(&create_args(&directory, &[WEB]), Out::plain()).expect_err("refused");
    assert!(error.to_string().contains("--force"), "{error}");
    assert_eq!(read_tree(&directory).len(), 1, "nothing was written");

    commands::create(
        &CreateArgs {
            force: true,
            ..create_args(&directory, &[WEB])
        },
        Out::plain(),
    )
    .expect("forced");
    let tree = read_tree(&directory);
    assert_eq!(text(&tree, "notes.txt"), "mine");
    assert!(tree.contains_key(RECORD));
}

#[test]
fn rejects_bad_flags_before_writing() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let cases = [
        CreateArgs {
            name: Some("My-App".to_owned()),
            ..create_args(&directory, &[WEB])
        },
        CreateArgs {
            title: Some("\"quoted\"".to_owned()),
            ..create_args(&directory, &[WEB])
        },
        CreateArgs {
            theme: Some("neon".to_owned()),
            ..create_args(&directory, &[WEB])
        },
        create_args(&directory, &["web-vue"]),
        create_args(&directory, &[]),
    ];
    for args in cases {
        assert!(commands::create(&args, Out::plain()).is_err(), "{args:?}");
        assert!(!directory.exists(), "{args:?} wrote something");
    }
    let error = commands::create(&create_args(&directory, &["web-vue"]), Out::plain())
        .expect_err("unknown");
    assert!(
        error.to_string().contains(KOTLIN),
        "the error lists the targets: {error}"
    );
}

// ---------------------------------------------------------------- add

/// The files a generator writes, which `add` may have regenerated when Node is around.
fn without_generated(mut tree: Tree) -> Tree {
    for path in build_outputs(&tree).into_values() {
        tree.remove(&path);
    }
    tree
}

fn add(directory: &Path, targets: &[&str]) {
    let args = AddArgs {
        targets: targets.iter().map(|target| (*target).to_owned()).collect(),
        project: Some(directory.to_path_buf()),
        dry_run: false,
    };
    commands::add(&args, Out::plain()).expect("add succeeds");
}

#[test]
fn adding_a_target_gives_the_project_that_create_would_have() {
    for (first, second) in [
        (WEB, DESKTOP),
        (DESKTOP, MOBILE),
        (KOTLIN, WEB),
        (MOBILE, KOTLIN),
    ] {
        let (_temp, grown) = project(&[first]);
        add(&grown, &[second]);
        let (_temp, fresh) = project(&[first, second]);

        let grown = read_tree(&grown);
        assert!(
            !grown.keys().any(|path| path.ends_with(MERGE_SUFFIX)),
            "{first} + {second}: nothing to merge"
        );
        assert_clean(&grown, &[first, second]);
        let (grown, fresh) = (
            without_generated(grown),
            without_generated(read_tree(&fresh)),
        );
        assert_eq!(
            grown.keys().collect::<Vec<_>>(),
            fresh.keys().collect::<Vec<_>>(),
            "{first} + {second}: the same files"
        );
        for (path, contents) in &fresh {
            assert!(
                &grown[path] == contents,
                "{first} + {second}: {path} differs"
            );
        }
    }
}

#[test]
fn add_leaves_a_changed_file_alone_and_puts_the_new_version_beside_it() {
    let (_temp, directory) = project(&[WEB]);
    let mise = directory.join("mise.toml");
    let edited = format!(
        "{}\n[tasks.mine]\nrun = \"echo mine\"\n",
        fs::read_to_string(&mise).expect("mise.toml")
    );
    fs::write(&mise, &edited).expect("writable");
    // A project may also move an output; the list of outputs is merged rather than replaced.
    let build = directory.join(BUILD_CONFIG);
    let moved = fs::read_to_string(&build)
        .expect("build.json")
        .replace("generated/theme.css", "generated/colors.css");
    fs::write(&build, &moved).expect("writable");

    add(&directory, &[KOTLIN]);
    let tree = read_tree(&directory);
    let (_temp, fresh) = project(&[WEB, KOTLIN]);
    let fresh = read_tree(&fresh);

    // The edited file is untouched, and what it should become is next to it.
    assert_eq!(text(&tree, "mise.toml"), edited);
    assert_eq!(
        text(&tree, &format!("mise.toml{MERGE_SUFFIX}")),
        text(&fresh, "mise.toml")
    );
    // Files nobody touched were replaced.
    for path in [".github/workflows/ci.yml", "README.md", ".gitattributes"] {
        assert_eq!(text(&tree, path), text(&fresh, path), "{path}");
        assert!(
            !tree.contains_key(&format!("{path}{MERGE_SUFFIX}")),
            "{path}"
        );
    }
    assert!(text(&tree, ".github/workflows/ci.yml").contains("  kotlin:\n"));

    let outputs = build_outputs(&tree);
    assert_eq!(
        outputs["css"], "packages/tokens/src/generated/colors.css",
        "the moved output is kept"
    );
    assert_eq!(
        outputs.get("kotlin"),
        build_outputs(&fresh).get("kotlin"),
        "the new output is added"
    );
    assert!(!tree.contains_key(&format!("{BUILD_CONFIG}{MERGE_SUFFIX}")));

    assert!(tree.contains_key("kotlin/settings.gradle.kts"));
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(record.targets, [WEB, KOTLIN]);
}

#[test]
fn add_keeps_the_theme_and_does_nothing_for_a_target_that_is_there() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let args = CreateArgs {
        theme: Some("forest".to_owned()),
        ..create_args(&directory, &[WEB, DESKTOP])
    };
    commands::create(&args, Out::plain()).expect("create succeeds");
    let before = read_tree(&directory);

    add(&directory, &[WEB]);
    assert!(read_tree(&directory) == before, "nothing changes");

    add(&directory, &[MOBILE, DESKTOP]);
    let tree = read_tree(&directory);
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(
        record.targets,
        [WEB, DESKTOP, MOBILE],
        "in the order of the manifest"
    );
    assert_eq!(record.theme, "forest");
    assert_eq!(
        tree[PALETTE_PATH], before[PALETTE_PATH],
        "the palette keeps its theme"
    );
    assert!(!tree.keys().any(|path| path.ends_with(MERGE_SUFFIX)));
}

#[test]
fn add_needs_a_project_and_a_known_target() {
    let temp = TempDir::new().expect("a temporary directory");
    let args = AddArgs {
        targets: vec![WEB.to_owned()],
        project: Some(temp.path().to_path_buf()),
        dry_run: false,
    };
    let error = commands::add(&args, Out::plain()).expect_err("not a project");
    assert!(error.to_string().contains(RECORD), "{error}");

    let (_temp, directory) = project(&[WEB]);
    let args = AddArgs {
        targets: vec!["web-vue".to_owned()],
        project: Some(directory),
        dry_run: false,
    };
    assert!(commands::add(&args, Out::plain()).is_err());
}

// ---------------------------------------------------------------- themes

fn embedded_theme(name: &str) -> theme::Theme {
    let themes = Source::Embedded(template())
        .themes()
        .expect("the embedded themes parse");
    themes
        .into_iter()
        .find(|theme| theme.name == name)
        .expect("the theme exists")
}

#[test]
fn create_with_a_theme_writes_its_ramps_into_the_palette() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let args = CreateArgs {
        theme: Some("ocean".to_owned()),
        ..create_args(&directory, &[WEB])
    };
    commands::create(&args, Out::plain()).expect("create succeeds");

    let tree = read_tree(&directory);
    let palette = text(&tree, PALETTE_PATH);
    assert!(theme::is_applied(&palette, &embedded_theme("ocean")));
    let expected = theme::apply(
        &Source::Embedded(template()).palette().expect("a palette"),
        &embedded_theme("ocean"),
    );
    assert_eq!(palette, expected.expect("applies"));
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(record.theme, "ocean");
    // With Node around, the generated files follow; `tests/cli.rs` covers the case without.
    if theme::check_node().is_ok() {
        let (_temp, default) = project(&[WEB]);
        let css = "packages/tokens/src/generated/theme.css";
        assert_ne!(
            text(&tree, css),
            text(&read_tree(&default), css),
            "the generated colors changed"
        );
        assert!(
            text(&tree, css).contains("#045ebc"),
            "the ocean accent is in the generated CSS"
        );
    }
}

#[test]
fn the_theme_command_switches_a_project_and_back() {
    let (_temp, directory) = project(&[DESKTOP]);
    let original = read_tree(&directory);
    let apply = |name: &str| {
        let args = ThemeArgs {
            name: Some(name.to_owned()),
            project: Some(directory.clone()),
            dry_run: false,
        };
        commands::theme(&args, Out::plain())
    };

    apply("plum").expect("applies");
    let tree = read_tree(&directory);
    assert!(theme::is_applied(
        &text(&tree, PALETTE_PATH),
        &embedded_theme("plum")
    ));
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(record.theme, "plum");

    // Applying it again is fine, and going back restores the palette byte for byte.
    apply("plum").expect("applies again");
    apply(&manifest().default_theme).expect("applies");
    let tree = read_tree(&directory);
    assert_eq!(text(&tree, PALETTE_PATH), text(&original, PALETTE_PATH));
    assert_eq!(text(&tree, RECORD), text(&original, RECORD));
    // The generated files are left out: whether they come back identical depends on the
    // template's own generated files being current, which `check:generated` is there for.
    assert!(
        without_generated(tree) == without_generated(original),
        "nothing else changed"
    );

    let error = apply("neon").expect_err("unknown theme");
    assert!(
        error.to_string().contains("ocean"),
        "the error lists the themes: {error}"
    );
}

#[test]
fn the_theme_command_finds_a_theme_the_project_added() {
    let (_temp, directory) = project(&[KOTLIN]);
    // A copy of ocean under a new name stands in for a theme made with make-theme.ts.
    let themes = directory.join(theme::THEMES_DIR);
    fs::copy(themes.join("ocean.json"), themes.join("lagoon.json")).expect("copied");
    let args = ThemeArgs {
        name: Some("lagoon".to_owned()),
        project: Some(directory.clone()),
        dry_run: false,
    };
    commands::theme(&args, Out::plain()).expect("applies");
    let tree = read_tree(&directory);
    assert!(theme::is_applied(
        &text(&tree, PALETTE_PATH),
        &embedded_theme("ocean")
    ));
    let record: Record = serde_json::from_str(&text(&tree, RECORD)).expect("a valid record");
    assert_eq!(record.theme, "lagoon");
}

#[test]
fn the_theme_command_needs_a_palette() {
    let temp = TempDir::new().expect("a temporary directory");
    let args = ThemeArgs {
        name: Some("ocean".to_owned()),
        project: Some(temp.path().to_path_buf()),
        dry_run: false,
    };
    let error = commands::theme(&args, Out::plain()).expect_err("not a project");
    assert!(error.to_string().contains(PALETTE_PATH), "{error}");
}

/// The CLI and `tools/design-build/src/theme.ts` are two ways to do the same thing, so they
/// have to leave the same bytes behind. Needs Node; without it the test says so and passes.
#[test]
fn applying_a_theme_matches_the_typescript_tool() {
    if let Err(reason) = theme::check_node() {
        eprintln!("skipped: {reason}");
        return;
    }
    for name in ["ocean", "sunset"] {
        let (_temp, with_node) = project(&[WEB, DESKTOP, KOTLIN]);
        let script = with_node.join("tools/design-build/src/theme.ts");
        let output = std::process::Command::new("node")
            .arg(&script)
            .arg(name)
            .output()
            .expect("node runs");
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );

        let (_temp, with_xds) = project(&[WEB, DESKTOP, KOTLIN]);
        let args = ThemeArgs {
            name: Some(name.to_owned()),
            project: Some(with_xds.clone()),
            dry_run: false,
        };
        commands::theme(&args, Out::plain()).expect("applies");

        let (mut with_node, mut with_xds) = (read_tree(&with_node), read_tree(&with_xds));
        // Only xds knows about its record.
        with_node.remove(RECORD);
        with_xds.remove(RECORD);
        assert_eq!(
            text(&with_xds, PALETTE_PATH),
            text(&with_node, PALETTE_PATH),
            "{name}: the palette"
        );
        for (path, contents) in &with_node {
            assert!(&with_xds[path] == contents, "{name}: {path} differs");
        }
        assert_eq!(with_xds.len(), with_node.len(), "{name}");
    }
}

// ---------------------------------------------------------------- tokens, components, contrast

#[test]
fn the_component_contract_matches_the_code() {
    let template = template();
    let components = inspect::load_components(&Location::Embedded).expect("a contract");
    let mut listed: BTreeMap<&str, BTreeSet<&str>> = BTreeMap::new();
    for component in &components {
        let name = component["name"].as_str().expect("a name");
        for key in ["purpose", "accessibility"] {
            assert!(component[key].is_string(), "{name}: {key}");
        }
        for (id, client) in component["clients"].as_object().expect("clients") {
            assert!(manifest().target(id).is_some(), "{name}: no target {id}");
            let path = client["source"].as_str().expect("a path");
            let symbol = client["symbol"].as_str().expect("a symbol");
            let file = template
                .files
                .get(path)
                .unwrap_or_else(|| panic!("{name}: {path} does not exist"));
            let code = String::from_utf8_lossy(&file.contents);
            assert!(code.contains(symbol), "{name}: {path} has no {symbol}");
            let target = manifest().target(id).expect("a target");
            assert!(
                target.paths.iter().any(|prefix| is_under(path, prefix)),
                "{name}: {path} is not a path of {id}"
            );
            listed.entry(id.as_str()).or_default().insert(name);
        }
    }

    // Every component a TypeScript library exports is in the contract.
    for (id, index) in [
        (WEB, "packages/ui/src/index.ts"),
        (MOBILE, "packages/ui-native/src/index.ts"),
    ] {
        let index = String::from_utf8_lossy(&template.files[index].contents).into_owned();
        for line in index.lines().filter(|line| line.starts_with("export {")) {
            let names = line
                .split_once('{')
                .and_then(|(_, rest)| rest.split_once('}'))
                .map(|(names, _)| names)
                .unwrap_or_default();
            for name in names.split(',').map(str::trim) {
                // Types and hooks are not components.
                if name.starts_with("type ") || !name.starts_with(char::is_uppercase) {
                    continue;
                }
                assert!(
                    listed[id].contains(name),
                    "{id} exports {name}, which {COMPONENTS_PATH} does not list"
                );
            }
        }
    }
}

#[test]
fn tokens_resolve_per_mode_with_their_tier() {
    let tokens = inspect::load_tokens(&Source::Embedded(template())).expect("tokens load");
    let token = |path: &str| {
        tokens
            .iter()
            .find(|token| token.path == path)
            .unwrap_or_else(|| panic!("no token {path}"))
    };
    let button = token("color.button.primary.background");
    assert_eq!(button.tier, "component");
    assert_eq!(button.aliases["light"], "color.accent.default");
    let accent = token("color.accent.default");
    assert_eq!(accent.tier, "semantic");
    assert_eq!(button.values["light"], accent.values["light"]);
    assert_eq!(button.values["dark"], accent.values["dark"]);
    assert_ne!(button.values["light"], button.values["dark"]);
    assert!(
        button.values["light"]
            .as_str()
            .expect("a hex")
            .starts_with('#')
    );

    assert_eq!(token("palette.neutral.0").tier, "palette");
    assert_eq!(token("space.4").values["value"], "16px");
    assert_eq!(token("space.4").tier, "base");
    let control = token("size.control.md");
    assert_ne!(control.values["pointer"], control.values["touch"]);
    // A composite value has its aliases followed too.
    assert_eq!(token("typography.body").values["value"]["fontSize"], "16px");
}

#[test]
fn contrast_matches_the_wcag_reference_values() {
    let ratio = inspect::contrast_ratio;
    assert!((ratio([0, 0, 0], [255, 255, 255]) - 21.0).abs() < 1e-9);
    assert!((ratio([255, 255, 255], [255, 255, 255]) - 1.0).abs() < 1e-9);
    // #767676 on white is the lightest grey that passes 4.5:1.
    assert!((ratio([0x76, 0x76, 0x76], [255, 255, 255]) - 4.54).abs() < 0.01);
}

#[test]
fn a_named_directory_without_tokens_is_not_answered_from_the_template() {
    let temp = TempDir::new().expect("a temporary directory");
    assert!(Location::find(Some(temp.path())).is_err());
}
