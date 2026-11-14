//! Whole commands run against temporary directories, with the template that is compiled in.
//!
//! Every `create` here passes `yes`, so nothing prompts when the tests run in a terminal. What
//! needs a real process (exit codes, a missing terminal, PATH) is in `tests/cli.rs`.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::num::NonZeroUsize;
use std::panic;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

use serde_json::Value;
use tempfile::TempDir;

use crate::commands::{self, AddArgs, CreateArgs, MERGE_SUFFIX, ThemeArgs};
use crate::inspect::{self, COMPONENTS_PATH, Location};
use crate::manifest::{TEMPLATE_ONLY, Target, is_under, manifest};
use crate::markers;
use crate::output::Out;
use crate::rename::Names;
use crate::render::{self, BUILD_CONFIG, RECORD, Record};
use crate::template::{File, Files, Template, is_binary, template};
use crate::theme::{self, PALETTE_PATH, Source};

const WEB: &str = "web-react";
const SOLID: &str = "web-solid";
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
    ".oxfmtrc.jsonc",
    ".oxlintrc.jsonc",
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

/// Parses the JSONC that the oxfmt and oxlint configurations are written in: comments on lines
/// of their own, and a comma after the last member, which is what lets an `@if` block end a
/// list. Commas inside strings are not expected there.
fn jsonc(text: &str, what: &str) -> Value {
    let code: Vec<char> = text
        .lines()
        .filter(|line| !line.trim_start().starts_with("//"))
        .flat_map(|line| line.chars().chain(['\n']))
        .collect();
    let mut plain = String::with_capacity(code.len());
    for (index, &character) in code.iter().enumerate() {
        let next = code[index + 1..].iter().find(|next| !next.is_whitespace());
        if character == ',' && matches!(next, Some('}' | ']')) {
            continue;
        }
        plain.push(character);
    }
    serde_json::from_str(&plain).unwrap_or_else(|error| panic!("{what}: {error}"))
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
    // `create --yes` would otherwise make a project without a target.
    assert!(
        !manifest.default_targets().is_empty(),
        "at least one target is a default"
    );
    // A marker name has to mean one thing: a target id, a shared unit, or the template.
    for unit in manifest.shared.keys() {
        assert!(
            manifest.target(unit).is_none(),
            "{unit} is a target and a unit"
        );
        assert_ne!(unit, TEMPLATE_ONLY);
    }
    assert!(manifest.target(TEMPLATE_ONLY).is_none());
}

#[test]
fn shared_files_are_valid_for_every_combination_of_targets() {
    let ids = manifest().target_ids();
    let names = Names::new("orbit", None).expect("a valid name");
    // The template's component contract, which each project's is cut down from.
    let contract: Value =
        serde_json::from_slice(&template().files[COMPONENTS_PATH].contents).expect("valid JSON");
    let check = |selected: &Vec<String>| {
        let targets = manifest().select(selected).expect("known ids");
        let files = render::render(template(), manifest(), &targets, &names).expect("renders");
        let has = |id: &str| selected.iter().any(|selected| selected == id);
        // What follows from template.json is read from it, so that a new target which requires
        // the JavaScript workspace needs expectations for what is its own, and nothing more.
        let requires = |unit: &str| {
            targets
                .iter()
                .any(|target| target.requires.iter().any(|required| required == unit))
        };
        let js = requires("js-workspace");
        let apps: BTreeSet<&str> = targets
            .iter()
            .flat_map(|target| &target.paths)
            .map(String::as_str)
            .filter(|path| is_under(path, "apps"))
            .collect();
        let formatted = targets.iter().any(|target| target.format.is_some());

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
        if !apps.is_empty() {
            expected_roots.push("apps/*");
        }
        if has(KOTLIN) {
            expected_roots.push("kotlin");
        }
        assert_eq!(roots, expected_roots, "{selected:?}");
        // Each app has an alias, for `mise run //web:dev`.
        let aliases: BTreeSet<&str> = mise["monorepo"]
            .get("path_aliases")
            .and_then(toml::Value::as_table)
            .map(|aliases| {
                aliases
                    .values()
                    .map(|path| path.as_str().expect("a path"))
                    .collect()
            })
            .unwrap_or_default();
        assert_eq!(aliases, apps, "{selected:?}");

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
        // The `format` command that `create` asks for has to exist.
        assert_eq!(tasks.contains_key("fmt"), formatted, "{selected:?}");
        assert!(
            !tasks.contains_key("check:cli") && !tasks.contains_key("xds"),
            "{selected:?}"
        );

        // The Rust workspace exists only for the targets that require it, and never mentions
        // the CLI.
        assert_eq!(
            files.contains_key("Cargo.toml"),
            requires("rust-workspace"),
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
            let js_targets = manifest()
                .targets
                .iter()
                .filter(|target| target.requires.iter().any(|unit| unit == "js-workspace"));
            for target in js_targets {
                for app in target.paths.iter().filter(|path| is_under(path, "apps")) {
                    assert_eq!(
                        workspace.contains(&format!("- {app}\n")),
                        has(&target.id),
                        "{selected:?}: {app}"
                    );
                }
            }

            // The formatter and linter configurations parse, and each override names files
            // that the project has: a glob that matches nothing is silently ignored, oxlint
            // fails on a missing plugin, and oxfmt sorts nothing with a missing stylesheet.
            for config in [".oxfmtrc.jsonc", ".oxlintrc.jsonc"] {
                let config = jsonc(&read(config), &format!("{selected:?}: {config}"));
                for entry in config["overrides"].as_array().into_iter().flatten() {
                    for pattern in entry["files"].as_array().expect("files") {
                        let directory = pattern.as_str().expect("a glob").trim_end_matches("/**");
                        assert!(
                            files.keys().any(|path| is_under(path, directory)),
                            "{selected:?}: the override for {directory}"
                        );
                    }
                    for plugin in entry["jsPlugins"].as_array().into_iter().flatten() {
                        let path = plugin.as_str().expect("a path").trim_start_matches("./");
                        assert!(files.contains_key(path), "{selected:?}: {path}");
                    }
                    let tailwind = &entry["options"]["sortTailwindcss"];
                    if let Some(stylesheet) = tailwind["stylesheet"].as_str() {
                        let path = stylesheet.trim_start_matches("./");
                        assert!(files.contains_key(path), "{selected:?}: {path}");
                    }
                }
            }
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

        // The README names the selected stacks and no others: how to start each of them.
        let readme = read("README.md");
        for target in &manifest().targets {
            for run in &target.run {
                assert_eq!(
                    readme.contains(&run.command),
                    has(&target.id),
                    "{selected:?}: {}",
                    run.command
                );
            }
        }
        assert!(readme.starts_with("# Orbit\n"), "{selected:?}");
        assert_eq!(
            readme.contains("packages/ui-core"),
            requires("ui-core"),
            "{selected:?}"
        );

        // So does the guide for coding agents, and it points at paths that exist.
        let agents = read("AGENTS.md");
        for (path, expected) in [
            ("`packages/ui`", has(WEB)),
            ("`packages/ui-solid`", has(SOLID)),
            ("`packages/ui-core`", requires("ui-core")),
            ("`crates/orbit-ui`", has(DESKTOP)),
            ("`packages/ui-native`", has(MOBILE)),
            ("`kotlin/ui`", has(KOTLIN)),
            ("`packages/tokens`", requires("js-tokens")),
            ("mise run fmt", formatted),
        ] {
            assert_eq!(agents.contains(path), expected, "{selected:?}: {path}");
        }
        assert!(agents.starts_with("# Working in Orbit\n"), "{selected:?}");
        assert_eq!(read("CLAUDE.md"), "@AGENTS.md\n", "{selected:?}");

        // The component contract keeps the components that a selected client has, with only
        // the selected clients, and names files of this project.
        let components: Value = serde_json::from_str(&read(COMPONENTS_PATH)).expect("valid JSON");
        let components = components["components"].as_array().expect("a list");
        assert!(!components.is_empty(), "{selected:?}");
        let expected: Vec<&Value> = contract["components"]
            .as_array()
            .expect("a list")
            .iter()
            .filter(|component| {
                component["clients"]
                    .as_object()
                    .expect("clients")
                    .keys()
                    .any(|id| has(id))
            })
            .map(|component| &component["name"])
            .collect();
        assert_eq!(
            components
                .iter()
                .map(|component| &component["name"])
                .collect::<Vec<_>>(),
            expected,
            "{selected:?}"
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
    };

    // Every non-empty subset of the targets: 2^n - 1 of them, so they are spread over the cores.
    let subsets: Vec<Vec<String>> = (1u32..(1 << ids.len()))
        .map(|mask| {
            ids.iter()
                .enumerate()
                .filter(|(bit, _)| mask & (1 << bit) != 0)
                .map(|(_, id)| (*id).to_owned())
                .collect()
        })
        .collect();
    let next = AtomicUsize::new(0);
    // A failed check panics on a worker thread. It is caught there, so that the test reports
    // every subset that failed, each with its message, rather than "a scoped thread panicked".
    let failures = Mutex::new(Vec::new());
    let workers = thread::available_parallelism().map_or(1, NonZeroUsize::get);
    thread::scope(|scope| {
        for _ in 0..workers.min(subsets.len()) {
            scope.spawn(|| {
                loop {
                    let index = next.fetch_add(1, Ordering::Relaxed);
                    let Some(selected) = subsets.get(index) else {
                        break;
                    };
                    if let Err(payload) = panic::catch_unwind(|| check(selected)) {
                        let message = payload
                            .downcast_ref::<String>()
                            .map(String::as_str)
                            .or_else(|| payload.downcast_ref::<&str>().copied())
                            .unwrap_or("a panic without a message");
                        failures
                            .lock()
                            .expect("no panic while it is held")
                            .push((index, format!("{selected:?}: {message}")));
                    }
                }
            });
        }
    });
    let mut failures = failures.into_inner().expect("no panic while it was held");
    failures.sort();
    assert!(
        failures.is_empty(),
        "{} of {} combinations failed:\n{}",
        failures.len(),
        subsets.len(),
        failures
            .iter()
            .map(|(_, failure)| failure.as_str())
            .collect::<Vec<_>>()
            .join("\n")
    );
}

/// A marker can name a shared unit, which stands for every target that requires it.
#[test]
fn a_marker_may_name_a_shared_unit() {
    let names = Names::new("orbit", None).expect("a valid name");
    let with_mise = |text: &str| {
        let mut files = Files::new();
        files.insert(
            BUILD_CONFIG.to_owned(),
            template().files[BUILD_CONFIG].clone(),
        );
        let mise = File {
            contents: text.as_bytes().to_vec(),
            executable: false,
        };
        files.insert("mise.toml".to_owned(), mise);
        Template {
            files,
            overlay: Files::new(),
        }
    };

    let marked = with_mise(
        "# @if js-workspace\njs\n# @endif\n# @if rust-workspace kotlin-compose\nnative\n# @endif\n",
    );
    for target in &manifest().targets {
        let files = render::render(&marked, manifest(), &[target], &names).expect("renders");
        let requires = |unit: &str| target.requires.iter().any(|required| required == unit);
        let mut expected = String::new();
        if requires("js-workspace") {
            expected.push_str("js\n");
        }
        if requires("rust-workspace") || target.id == KOTLIN {
            expected.push_str("native\n");
        }
        assert_eq!(
            String::from_utf8_lossy(&files["mise.toml"].contents),
            expected,
            "{}",
            target.id
        );
    }

    // A unit name is checked like a target id: a typo is an error, not a block that is never
    // there.
    let typo = with_mise("# @if js-worksapce\njs\n# @endif\n");
    let error = render::render(&typo, manifest(), &[&manifest().targets[0]], &names)
        .expect_err("an unknown name");
    assert!(error.to_string().contains("js-worksapce"), "{error}");
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
            // The stylesheet and the recipes the React components draw with, and the behavior
            // checks that every web library runs.
            "packages/ui-core/src/styles/index.css",
            "packages/ui-core/src/button.ts",
            "packages/ui-core/test/behavior.ts",
            "packages/ui-core/test/scenarios.ts",
            "package.json",
            "pnpm-workspace.yaml",
            ".oxfmtrc.jsonc",
            ".oxlintrc.jsonc",
            "tsconfig.base.json",
            "tools/design-build/src/build.ts",
            "design/themes",
        ],
        &[
            "apps/desktop",
            "apps/mobile",
            "apps/web-solid",
            "packages/ui-native",
            "packages/ui-solid",
            "tools/lint",
            "crates",
            "kotlin",
            "Cargo.toml",
        ],
    );
    let lint = text(&tree, ".oxlintrc.jsonc");
    assert!(!lint.contains("react-native") && !lint.contains("\"settings\""));
    let vitest = jsonc(&lint, ".oxlintrc.jsonc")["overrides"]
        .as_array()
        .expect("overrides")
        .iter()
        .find(|entry| entry["plugins"] == serde_json::json!(["vitest"]))
        .expect("the Vitest override")["files"]
        .clone();
    assert_eq!(
        vitest,
        serde_json::json!(["packages/ui-core/test/**", "packages/ui/test/**"])
    );
    // React's classes sort against ui-core's stylesheet, as Solid's do.
    let format = jsonc(&text(&tree, ".oxfmtrc.jsonc"), ".oxfmtrc.jsonc");
    let overrides = format["overrides"].as_array().expect("overrides");
    assert_eq!(overrides.len(), 1);
    assert_eq!(
        overrides[0]["files"],
        serde_json::json!(["packages/ui-core/**", "apps/web/**", "packages/ui/**"])
    );
    assert_eq!(
        overrides[0]["options"]["sortTailwindcss"]["stylesheet"],
        "./packages/ui-core/src/styles/index.css"
    );
    // The Zag.js pins and their release-age exclusions come with the target, React's adapter
    // and none of Solid's.
    let workspace = text(&tree, "pnpm-workspace.yaml");
    assert!(workspace.contains("\"@zag-js/menu\"") && workspace.contains("\"@zag-js/react\""));
    assert!(workspace.contains("minimumReleaseAgeExclude:"));
    assert!(!workspace.contains("@zag-js/solid") && !workspace.contains("solid-js:"));
    assert_eq!(json(&tree, "package.json")["name"], "orbit");
    let library = json(&tree, "packages/ui/package.json");
    assert_eq!(library["name"], "@orbit/ui");
    assert_eq!(library["dependencies"]["@orbit/ui-core"], "workspace:*");
    assert_eq!(library["dependencies"]["@zag-js/react"], "catalog:");
    // The stylesheet an app imports is ui-core's, under the project's name.
    assert!(
        text(&tree, "packages/ui/src/styles/index.css")
            .contains("@import \"@orbit/ui-core/styles.css\";")
    );
    assert!(text(&tree, "packages/tokens/src/generated/theme.css").contains("--orbit-color-"));
    assert!(text(&tree, "mise.toml").contains("pnpm --filter @orbit/web build"));
}

#[test]
fn creates_a_solid_web_project() {
    let (_temp, directory) = project(&[SOLID]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[SOLID]);
    assert_paths(
        &tree,
        &[
            "apps/web-solid/package.json",
            "apps/web-solid/mise.toml",
            "packages/ui-solid/package.json",
            "packages/ui-core/package.json",
            "packages/ui-core/src/styles/index.css",
            "packages/tokens/src/generated/theme.css",
            "packages/tokens/src/generated/tailwind.css",
            "pnpm-workspace.yaml",
            ".oxfmtrc.jsonc",
            ".oxlintrc.jsonc",
        ],
        &[
            "apps/web",
            "packages/ui",
            "apps/mobile",
            "packages/ui-native",
            "tools/lint",
            "crates",
            "kotlin",
        ],
    );
    assert_eq!(
        json(&tree, "packages/ui-solid/package.json")["name"],
        "@orbit/ui-solid"
    );
    assert_eq!(
        json(&tree, "packages/ui-core/package.json")["name"],
        "@orbit/ui-core"
    );
    let mise = text(&tree, "mise.toml");
    assert!(mise.contains("pnpm --filter @orbit/web-solid build"));
    assert!(!mise.contains("pnpm --filter @orbit/web build"));
    // The Zag.js and Solid pins, and Zag's release-age exclusions, come with the target.
    let workspace = text(&tree, "pnpm-workspace.yaml");
    assert!(workspace.contains("\"@zag-js/menu\"") && workspace.contains("solid-js:"));
    assert!(workspace.contains("minimumReleaseAgeExclude:"));
    assert!(!workspace.contains("react:") && !workspace.contains("@zag-js/react"));
    // Solid's classes sort against ui-core's stylesheet; React's rules stay out of its lint.
    let format = jsonc(&text(&tree, ".oxfmtrc.jsonc"), ".oxfmtrc.jsonc");
    let stylesheets: Vec<&str> = format["overrides"]
        .as_array()
        .expect("overrides")
        .iter()
        .map(|entry| {
            entry["options"]["sortTailwindcss"]["stylesheet"]
                .as_str()
                .expect("a stylesheet")
        })
        .collect();
    assert_eq!(
        stylesheets,
        ["./packages/ui-core/src/styles/index.css"],
        "ui-core and the Solid app and library"
    );
    assert_eq!(
        format["overrides"][0]["files"],
        serde_json::json!([
            "packages/ui-core/**",
            "apps/web-solid/**",
            "packages/ui-solid/**"
        ])
    );
    let lint = jsonc(&text(&tree, ".oxlintrc.jsonc"), ".oxlintrc.jsonc");
    let overrides = lint["overrides"].as_array().expect("overrides");
    assert_eq!(overrides.len(), 2);
    assert_eq!(overrides[0]["plugins"], serde_json::json!(["jsx-a11y"]));
    assert_eq!(overrides[1]["plugins"], serde_json::json!(["vitest"]));
    assert_eq!(
        overrides[1]["files"],
        serde_json::json!(["packages/ui-core/test/**", "packages/ui-solid/test/**"])
    );
    assert_eq!(
        lint["settings"]["jsx-a11y"]["attributes"]["for"],
        serde_json::json!(["htmlFor", "for"])
    );
}

#[test]
fn the_web_targets_coexist() {
    let (_temp, directory) = project(&[WEB, SOLID]);
    let tree = read_tree(&directory);
    assert_clean(&tree, &[WEB, SOLID]);
    assert_paths(
        &tree,
        &[
            "apps/web/package.json",
            "packages/ui/package.json",
            "apps/web-solid/package.json",
            "packages/ui-solid/package.json",
            "packages/ui-core/package.json",
        ],
        &[],
    );
    let mise = text(&tree, "mise.toml");
    for build in [
        "pnpm --filter @orbit/web build",
        "pnpm --filter @orbit/web-solid build",
    ] {
        assert!(mise.contains(build), "{build}");
    }
    // Each app keeps its own dev server port, which it does not give up for a free one.
    for (app, port) in [("apps/web", 5173), ("apps/web-solid", 5174)] {
        let config = text(&tree, &format!("{app}/vite.config.ts"));
        assert!(
            config.contains(&format!("port: {port}, strictPort: true")),
            "{app}: {port}"
        );
    }
    // Both libraries run the behavior checks of ui-core, under the project's name.
    for library in ["packages/ui", "packages/ui-solid"] {
        let test = text(&tree, &format!("{library}/test/behavior.test.tsx"));
        assert!(
            test.contains("from \"@orbit/ui-core/test/behavior\""),
            "{library}"
        );
    }
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
            ".oxfmtrc.jsonc",
            ".oxlintrc.jsonc",
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
            ".oxfmtrc.jsonc",
            ".oxlintrc.jsonc",
            "tools/lint/react-native.ts",
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
    let lint = text(&tree, ".oxlintrc.jsonc");
    assert!(lint.contains("react-native/no-raw-text") && !lint.contains("apps/web"));
    // React Native styles have no Tailwind classes to sort.
    assert!(!text(&tree, ".oxfmtrc.jsonc").contains("sortTailwindcss"));
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
            ".oxfmtrc.jsonc",
            ".oxlintrc.jsonc",
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
    assert_clean(&tree, &manifest().target_ids());
    assert_paths(
        &tree,
        &[
            "apps/web",
            "apps/web-solid",
            "apps/desktop",
            "apps/mobile",
            "packages/ui",
            "packages/ui-core",
            "packages/ui-solid",
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
fn yes_without_targets_takes_the_default_targets() {
    let temp = TempDir::new().expect("a temporary directory");
    let directory = temp.path().join("project");
    let args = CreateArgs {
        targets: None,
        ..create_args(&directory, &[])
    };
    let result = commands::create(&args, Out::plain()).expect("create succeeds");
    let defaults: Vec<&str> = manifest()
        .default_targets()
        .iter()
        .map(|target| target.id.as_str())
        .collect();
    assert_eq!(result["targets"], serde_json::json!(defaults));

    let tree = read_tree(&directory);
    assert_clean(&tree, &defaults);
    let names = Names::new("orbit", None).expect("a valid name");
    for target in manifest().targets.iter().filter(|target| !target.default) {
        for path in &target.paths {
            let path = names.apply(path, &manifest().placeholder);
            assert!(!has_path(&tree, &path), "{path} is not a default");
        }
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
        (WEB, SOLID),
        (SOLID, MOBILE),
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
        (SOLID, "packages/ui-solid/src/index.ts"),
        (MOBILE, "packages/ui-native/src/index.ts"),
    ] {
        let index = String::from_utf8_lossy(&template.files[index].contents).into_owned();
        // An export list may run over several lines once the formatter wraps it.
        for statement in index.split("\nexport {").skip(1) {
            let names = statement
                .split_once('}')
                .map(|(names, _)| names)
                .unwrap_or_default();
            for name in names
                .split(',')
                .map(str::trim)
                .filter(|name| !name.is_empty())
            {
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
