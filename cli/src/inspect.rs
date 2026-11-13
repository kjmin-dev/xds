//! The commands that answer questions about a design system without changing it: `tokens`,
//! `components`, `contrast` and `doctor`. Each reads the project it is run in, or the template
//! inside the binary when it is run anywhere else.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde_json::{Map, Value, json};

use crate::error::{Context, Error, Result};
use crate::manifest::manifest;
use crate::output::Out;
use crate::render::{RECORD, Record};
use crate::say;
use crate::template::template;
use crate::theme::{self, PALETTE_PATH, Source};

/// The component contract, in a project and in the template.
pub const COMPONENTS_PATH: &str = "design/components.json";
const GENERATOR: &str = "tools/design-build/src/build.ts";

/// The color groups screens may use. Every other group under `color` belongs to one component.
const SEMANTIC_GROUPS: [&str; 9] = [
    "background",
    "text",
    "border",
    "accent",
    "control",
    "danger",
    "status",
    "overlay",
    "scrim",
];

/// Where the design files are: a directory that holds them, or the template in the binary.
#[derive(Debug, Clone)]
pub enum Location {
    Project(PathBuf),
    Embedded,
}

impl Location {
    /// `project` when it holds design tokens, the embedded template otherwise. A directory that
    /// was named and holds none is an error: the answer would be about something else.
    pub fn find(project: Option<&Path>) -> Result<Self> {
        let directory = project.unwrap_or(Path::new("."));
        if theme::palette_file(directory).is_file() {
            return Ok(Self::Project(directory.to_path_buf()));
        }
        match project {
            Some(named) => Err(Error::Message(format!(
                "{} has no {PALETTE_PATH}.",
                named.display()
            ))),
            None => Ok(Self::Embedded),
        }
    }

    pub fn source(&self) -> Source<'_> {
        match self {
            Self::Project(directory) => Source::Project(directory),
            Self::Embedded => Source::Embedded(template()),
        }
    }

    /// `project` or `template`, for the `source` field of a result.
    pub fn label(&self) -> &'static str {
        match self {
            Self::Project(_) => "project",
            Self::Embedded => "template",
        }
    }

    fn describe(&self) -> String {
        match self {
            Self::Project(directory) if directory == Path::new(".") => "this project".to_owned(),
            Self::Project(directory) => directory.display().to_string(),
            Self::Embedded => "the template inside xds".to_owned(),
        }
    }
}

// ---------------------------------------------------------------- tokens

/// The token files, and the name each gives the values it holds. Files that say the same
/// thing for a different mode or input device share their token paths.
const TOKEN_FILES: [(&str, &str); 6] = [
    ("design/tokens/base.json", "value"),
    (PALETTE_PATH, "value"),
    ("design/tokens/color.light.json", "light"),
    ("design/tokens/color.dark.json", "dark"),
    ("design/tokens/size.pointer.json", "pointer"),
    ("design/tokens/size.touch.json", "touch"),
];

#[derive(Debug, Clone)]
struct Raw {
    value: Value,
    kind: Option<String>,
    description: Option<String>,
}

type RawTokens = BTreeMap<String, Raw>;

fn flatten(node: &Value, path: &mut Vec<String>, kind: Option<&str>, tokens: &mut RawTokens) {
    let Value::Object(members) = node else { return };
    let kind = members.get("$type").and_then(Value::as_str).or(kind);
    if let Some(value) = members.get("$value") {
        tokens.insert(
            path.join("."),
            Raw {
                value: value.clone(),
                kind: kind.map(str::to_owned),
                description: members
                    .get("$description")
                    .and_then(Value::as_str)
                    .map(str::to_owned),
            },
        );
        return;
    }
    for (key, member) in members {
        if !key.starts_with('$') {
            path.push(key.clone());
            flatten(member, path, kind, tokens);
            path.pop();
        }
    }
}

/// One token, with the value it has in each mode or for each input device.
#[derive(Debug, Clone)]
pub struct Token {
    pub path: String,
    pub kind: Option<String>,
    pub tier: &'static str,
    pub description: Option<String>,
    /// `light` and `dark`, `pointer` and `touch`, or `value` alone. Aliases are followed.
    pub values: Map<String, Value>,
    /// The token each value points at, where it is an alias.
    pub aliases: Map<String, Value>,
}

impl Token {
    fn to_json(&self) -> Value {
        let mut token = Map::new();
        token.insert("path".to_owned(), self.path.clone().into());
        if let Some(kind) = &self.kind {
            token.insert("type".to_owned(), kind.clone().into());
        }
        token.insert("tier".to_owned(), self.tier.into());
        if let Some(description) = &self.description {
            token.insert("description".to_owned(), description.clone().into());
        }
        token.insert("values".to_owned(), self.values.clone().into());
        if !self.aliases.is_empty() {
            token.insert("aliases".to_owned(), self.aliases.clone().into());
        }
        token.into()
    }
}

fn tier(path: &str) -> &'static str {
    let mut parts = path.split('.');
    match (parts.next(), parts.next()) {
        (Some("palette"), _) => "palette",
        (Some("color"), Some(group)) if SEMANTIC_GROUPS.contains(&group) => "semantic",
        (Some("color"), _) => "component",
        _ => "base",
    }
}

fn alias_target(value: &Value) -> Option<&str> {
    value.as_str()?.strip_prefix('{')?.strip_suffix('}')
}

/// A value as a person would write it: `#4f46e5`, `16px`, `120ms`. Aliases are followed, also
/// inside composite values such as a text style.
fn resolve(value: &Value, tokens: &RawTokens, depth: usize) -> Result<Value> {
    if depth > 32 {
        return Err("the aliases refer to each other".into());
    }
    if let Some(target) = alias_target(value) {
        let token = tokens
            .get(target)
            .ok_or_else(|| Error::Message(format!("there is no token {target}")))?;
        return resolve(&token.value, tokens, depth + 1);
    }
    match value {
        Value::Object(members) => {
            if let Some(hex) = members.get("hex").and_then(Value::as_str) {
                let alpha = members.get("alpha").and_then(Value::as_f64).unwrap_or(1.0);
                return Ok(if alpha < 1.0 {
                    format!("{hex} at {}%", (alpha * 100.0).round()).into()
                } else {
                    hex.into()
                });
            }
            if let (Some(number), Some(unit)) = (
                members.get("value").and_then(Value::as_f64),
                members.get("unit").and_then(Value::as_str),
            ) {
                return Ok(format!("{number}{unit}").into());
            }
            members
                .iter()
                .map(|(key, member)| Ok((key.clone(), resolve(member, tokens, depth + 1)?)))
                .collect::<Result<Map<_, _>>>()
                .map(Value::Object)
        }
        Value::Array(items) => items
            .iter()
            .map(|item| resolve(item, tokens, depth + 1))
            .collect::<Result<Vec<_>>>()
            .map(Value::Array),
        scalar => Ok(scalar.clone()),
    }
}

/// Every token of `source`, in the order of the files and of the tokens in them.
pub fn load_tokens(source: &Source<'_>) -> Result<Vec<Token>> {
    let mut files = Vec::new();
    for (path, name) in TOKEN_FILES {
        let document: Value = serde_json::from_str(&source.read(path)?).context(path)?;
        let mut tokens = RawTokens::new();
        flatten(&document, &mut Vec::new(), None, &mut tokens);
        files.push((name, document, tokens));
    }
    // What an alias can point at from any file: the base tokens and the palette.
    let mut shared = RawTokens::new();
    for (_, _, tokens) in &files[..2] {
        shared.extend(tokens.clone());
    }

    let mut order: Vec<String> = Vec::new();
    let mut found: BTreeMap<String, Token> = BTreeMap::new();
    for (name, document, tokens) in &files {
        let mut scope = shared.clone();
        scope.extend(tokens.clone());
        // serde_json keeps the order of the file, which the map of tokens by path does not.
        let mut paths = Vec::new();
        collect_paths(document, &mut Vec::new(), &mut paths);
        for path in paths {
            let raw = &tokens[&path];
            let value = resolve(&raw.value, &scope, 0).context(&path)?;
            let token = found.entry(path.clone()).or_insert_with(|| {
                order.push(path.clone());
                Token {
                    tier: tier(&path),
                    path: path.clone(),
                    kind: raw.kind.clone(),
                    description: raw.description.clone(),
                    values: Map::new(),
                    aliases: Map::new(),
                }
            });
            token.values.insert((*name).to_owned(), value);
            if let Some(target) = alias_target(&raw.value) {
                token.aliases.insert((*name).to_owned(), target.into());
            }
        }
    }
    Ok(order
        .into_iter()
        .filter_map(|path| found.remove(&path))
        .collect())
}

fn collect_paths(node: &Value, path: &mut Vec<String>, paths: &mut Vec<String>) {
    let Value::Object(members) = node else { return };
    if members.contains_key("$value") {
        paths.push(path.join("."));
        return;
    }
    for (key, member) in members {
        if !key.starts_with('$') {
            path.push(key.clone());
            collect_paths(member, path, paths);
            path.pop();
        }
    }
}

#[derive(Debug, Default, clap::Args)]
pub struct TokensArgs {
    /// Show only the tokens whose path contains this, such as `button` or `color.text`
    pub query: Option<String>,
    /// Show only one tier: palette, semantic, component or base
    #[arg(long, value_name = "TIER")]
    pub tier: Option<String>,
    /// The project to read [default: the current directory, or the template inside xds]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

fn show(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Array(items) => items.iter().map(show).collect::<Vec<_>>().join(", "),
        Value::Object(members) => members
            .iter()
            .map(|(key, member)| format!("{key} {}", show(member)))
            .collect::<Vec<_>>()
            .join(", "),
        other => other.to_string(),
    }
}

pub fn tokens(args: &TokensArgs, out: Out) -> Result<Value> {
    const TIERS: [&str; 4] = ["palette", "semantic", "component", "base"];
    if let Some(tier) = &args.tier
        && !TIERS.contains(&tier.as_str())
    {
        return Err(Error::Message(format!(
            "There is no tier \"{tier}\". Tiers: {}",
            TIERS.join(", ")
        )));
    }
    let location = Location::find(args.project.as_deref())?;
    let query = args.query.as_deref().map(str::to_lowercase);
    let tokens: Vec<Token> = load_tokens(&location.source())?
        .into_iter()
        .filter(|token| {
            query
                .as_ref()
                .is_none_or(|query| token.path.to_lowercase().contains(query))
                && args.tier.as_ref().is_none_or(|tier| token.tier == tier)
        })
        .collect();

    let style = out.style;
    let width = tokens
        .iter()
        .map(|token| token.path.len())
        .max()
        .unwrap_or(0);
    for token in &tokens {
        let values: Vec<String> = token
            .values
            .iter()
            .map(|(name, value)| {
                let shown = show(value);
                match token.aliases.get(name).and_then(Value::as_str) {
                    Some(alias) => format!("{shown} {}", style.dim(&format!("({alias})"))),
                    None => shown,
                }
            })
            .collect();
        let names: Vec<&String> = token.values.keys().collect();
        let line = if names.len() == 1 || values.windows(2).all(|pair| pair[0] == pair[1]) {
            values[0].clone()
        } else {
            names
                .iter()
                .zip(&values)
                .map(|(name, value)| format!("{} {value}", style.dim(name)))
                .collect::<Vec<_>>()
                .join("   ")
        };
        say!(
            out,
            "{}  {line}",
            style.cyan(&format!("{:<width$}", token.path))
        );
    }
    say!(
        out,
        "{}",
        style.dim(&format!(
            "{} tokens from {}",
            tokens.len(),
            location.describe()
        ))
    );
    Ok(json!({
        "source": location.label(),
        "tokens": tokens.iter().map(Token::to_json).collect::<Vec<_>>(),
    }))
}

// ---------------------------------------------------------------- components

#[derive(Debug, Default, clap::Args)]
pub struct ComponentsArgs {
    /// The component to describe, such as `Button`. Without it, list them all
    pub name: Option<String>,
    /// Include the source of the component on each client
    #[arg(long)]
    pub code: bool,
    /// Show only this client (see `xds list`)
    #[arg(long, value_name = "TARGET")]
    pub client: Option<String>,
    /// The project to read [default: the current directory, or the template inside xds]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

/// The components of `location`, as the array in `design/components.json`.
pub fn load_components(location: &Location) -> Result<Vec<Value>> {
    let text = location.source().read(COMPONENTS_PATH)?;
    let document: Value = serde_json::from_str(&text).context(COMPONENTS_PATH)?;
    match document.get("components") {
        Some(Value::Array(components)) => Ok(components.clone()),
        _ => Err(Error::Message(format!(
            "{COMPONENTS_PATH} has no list of components"
        ))),
    }
}

fn clients(component: &Value) -> Vec<&String> {
    component["clients"]
        .as_object()
        .map(|clients| clients.keys().collect())
        .unwrap_or_default()
}

pub fn components(args: &ComponentsArgs, out: Out) -> Result<Value> {
    let style = out.style;
    let location = Location::find(args.project.as_deref())?;
    if let Some(client) = &args.client
        && manifest().target(client).is_none()
    {
        return Err(Error::Message(format!(
            "There is no target \"{client}\". Targets: {}",
            manifest().target_ids().join(", ")
        )));
    }
    let mut all = load_components(&location)?;
    if let Some(client) = &args.client {
        for component in &mut all {
            if let Some(Value::Object(clients)) = component.get_mut("clients") {
                clients.retain(|id, _| id == client);
            }
        }
        all.retain(|component| !clients(component).is_empty());
    }

    let Some(name) = &args.name else {
        let width = all
            .iter()
            .filter_map(|component| component["name"].as_str())
            .map(str::len)
            .max()
            .unwrap_or(0);
        for component in &all {
            let name = component["name"].as_str().unwrap_or_default();
            say!(
                out,
                "{}  {}",
                style.cyan(&format!("{name:<width$}")),
                component["purpose"].as_str().unwrap_or_default()
            );
            let ids: Vec<&str> = clients(component).into_iter().map(String::as_str).collect();
            say!(out, "{:width$}  {}", "", style.dim(&ids.join(", ")));
        }
        say!(
            out,
            "{}",
            style.dim(&format!(
                "{} components from {}. `xds components <name>` describes one.",
                all.len(),
                location.describe()
            ))
        );
        return Ok(json!({ "source": location.label(), "components": all }));
    };

    let mut component = all
        .into_iter()
        .find(|component| {
            component["name"]
                .as_str()
                .is_some_and(|candidate| candidate.eq_ignore_ascii_case(name))
        })
        .ok_or_else(|| {
            Error::Message(format!(
                "There is no component \"{name}\" in {}. `xds components` lists them.",
                location.describe()
            ))
        })?;
    if args.code {
        let source = location.source();
        if let Some(Value::Object(clients)) = component.get_mut("clients") {
            for client in clients.values_mut() {
                let path = client["source"].as_str().unwrap_or_default().to_owned();
                let code = source.read(&path)?;
                if let Value::Object(client) = client {
                    client.insert("code".to_owned(), code.into());
                }
            }
        }
    }

    say!(
        out,
        "{}",
        style.bold(component["name"].as_str().unwrap_or_default())
    );
    say!(out, "{}", component["purpose"].as_str().unwrap_or_default());
    if let Some(Value::Object(options)) = component.get("options") {
        for (option, values) in options {
            say!(
                out,
                "  {}  {}",
                style.cyan(&format!("{option:<8}")),
                show(values)
            );
        }
    }
    for (label, key) in [("states", "states"), ("tokens", "tokens")] {
        if component[key]
            .as_array()
            .is_some_and(|items| !items.is_empty())
        {
            say!(
                out,
                "  {}  {}",
                style.cyan(&format!("{label:<8}")),
                show(&component[key])
            );
        }
    }
    say!(
        out,
        "  {}  {}",
        style.cyan("a11y    "),
        component["accessibility"].as_str().unwrap_or_default()
    );
    say!(out);
    if let Some(Value::Object(clients)) = component.get("clients") {
        let width = clients.keys().map(String::len).max().unwrap_or(0);
        for (id, client) in clients {
            say!(
                out,
                "  {}  {}  {}",
                style.cyan(&format!("{id:<width$}")),
                client["source"].as_str().unwrap_or_default(),
                style.dim(client["symbol"].as_str().unwrap_or_default())
            );
        }
        if args.code {
            for (id, client) in clients {
                say!(
                    out,
                    "\n{}",
                    style.bold(&format!(
                        "--- {id}: {}",
                        client["source"].as_str().unwrap_or_default()
                    ))
                );
                say!(out, "{}", client["code"].as_str().unwrap_or_default());
            }
        }
    }
    Ok(json!({ "source": location.label(), "component": component }))
}

// ---------------------------------------------------------------- contrast

#[derive(Debug, Default, clap::Args)]
pub struct ContrastArgs {
    /// The text or mark: a hex color (`#4f46e5`) or a color token (`text.secondary`)
    pub foreground: String,
    /// What it is drawn on: a hex color or a color token (`background.surface`)
    pub background: String,
    /// Fail (exit 1) when a ratio is below this: 4.5 for text, 3 for large text and UI parts
    #[arg(long, value_name = "RATIO")]
    pub min: Option<f64>,
    /// The project to read tokens from [default: the current directory, or the template]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

fn parse_hex(text: &str) -> Option<[u8; 3]> {
    let digits = text.strip_prefix('#')?;
    let expanded: String = match digits.len() {
        3 => digits.chars().flat_map(|digit| [digit, digit]).collect(),
        6 => digits.to_owned(),
        _ => return None,
    };
    let channel = |index: usize| u8::from_str_radix(expanded.get(index..index + 2)?, 16).ok();
    Some([channel(0)?, channel(2)?, channel(4)?])
}

fn hex([red, green, blue]: [u8; 3]) -> String {
    format!("#{red:02x}{green:02x}{blue:02x}")
}

/// WCAG 2 relative luminance.
fn luminance(color: [u8; 3]) -> f64 {
    let linear = |channel: u8| {
        let value = f64::from(channel) / 255.0;
        if value <= 0.04045 {
            value / 12.92
        } else {
            ((value + 0.055) / 1.055).powf(2.4)
        }
    };
    0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2])
}

/// WCAG 2 contrast ratio, from 1 to 21.
pub fn contrast_ratio(first: [u8; 3], second: [u8; 3]) -> f64 {
    let (first, second) = (luminance(first), luminance(second));
    (first.max(second) + 0.05) / (first.min(second) + 0.05)
}

/// One side of a pairing: the same color in every mode, or a token with a color per mode.
enum Side {
    Fixed([u8; 3]),
    Token {
        path: String,
        light: [u8; 3],
        dark: [u8; 3],
    },
}

impl Side {
    fn parse(input: &str, tokens: &[Token]) -> Result<Self> {
        if input.starts_with('#') {
            return parse_hex(input).map(Self::Fixed).ok_or_else(|| {
                Error::Message(format!("\"{input}\" is not a hex color such as #4f46e5."))
            });
        }
        let token = tokens
            .iter()
            .find(|token| token.path == input)
            .or_else(|| {
                let path = format!("color.{input}");
                tokens.iter().find(|token| token.path == path)
            })
            .ok_or_else(|| {
                Error::Message(format!(
                    "There is no color token \"{input}\". `xds tokens color` lists them; a hex color starts with #."
                ))
            })?;
        let color = |name: &str| -> Result<[u8; 3]> {
            let value = token
                .values
                .get(name)
                .or_else(|| token.values.get("value"))
                .and_then(Value::as_str)
                .ok_or_else(|| Error::Message(format!("{} is not a color.", token.path)))?;
            parse_hex(value).ok_or_else(|| {
                Error::Message(format!(
                    "{} is {value}: a translucent color has no contrast of its own. Composite it over what is behind it and pass the hex.",
                    token.path
                ))
            })
        };
        Ok(Self::Token {
            path: token.path.clone(),
            light: color("light")?,
            dark: color("dark")?,
        })
    }

    fn color(&self, dark: bool) -> [u8; 3] {
        match self {
            Self::Fixed(color) => *color,
            Self::Token {
                light,
                dark: in_dark,
                ..
            } => {
                if dark {
                    *in_dark
                } else {
                    *light
                }
            }
        }
    }

    fn name(&self) -> String {
        match self {
            Self::Fixed(color) => hex(*color),
            Self::Token { path, .. } => path.clone(),
        }
    }
}

pub fn contrast(args: &ContrastArgs, out: Out) -> Result<Value> {
    let style = out.style;
    let uses_tokens = !(args.foreground.starts_with('#') && args.background.starts_with('#'));
    let tokens = if uses_tokens {
        load_tokens(&Location::find(args.project.as_deref())?.source())?
    } else {
        Vec::new()
    };
    let foreground = Side::parse(&args.foreground, &tokens)?;
    let background = Side::parse(&args.background, &tokens)?;

    // Two hex colors are the same in both modes, so there is one answer.
    let modes: &[(Option<&str>, bool)] = if uses_tokens {
        &[(Some("light"), false), (Some("dark"), true)]
    } else {
        &[(None, false)]
    };
    let mut results = Vec::new();
    let mut passed = true;
    say!(
        out,
        "{} on {}",
        style.bold(&foreground.name()),
        style.bold(&background.name())
    );
    for (mode, dark) in modes {
        let (text, surface) = (foreground.color(*dark), background.color(*dark));
        // Rounded down, as WCAG compares: 4.499 is not 4.5.
        let ratio = (contrast_ratio(text, surface) * 100.0).floor() / 100.0;
        let meets = |minimum: f64| ratio >= minimum;
        if let Some(minimum) = args.min {
            passed &= meets(minimum);
        }
        let verdict = |label: &str, minimum: f64| {
            let mark = if meets(minimum) {
                style.green("pass")
            } else {
                style.red("fail")
            };
            format!("{label} {mark}")
        };
        say!(
            out,
            "  {}{}  {}  {}:1   {}   {}   {}",
            mode.map(|mode| format!("{mode:<6}")).unwrap_or_default(),
            hex(text),
            hex(surface),
            style.bold(&format!("{ratio:.2}")),
            verdict("text 4.5", 4.5),
            verdict("large text and UI 3", 3.0),
            verdict("AAA text 7", 7.0),
        );
        results.push(json!({
            "mode": mode,
            "foreground": hex(text),
            "background": hex(surface),
            "ratio": ratio,
            "passes": {
                "text": meets(4.5),
                "largeText": meets(3.0),
                "ui": meets(3.0),
                "textAAA": meets(7.0),
                "largeTextAAA": meets(4.5),
            },
        }));
    }
    let result = json!({
        "foreground": foreground.name(),
        "background": background.name(),
        "minimum": args.min,
        "ok": passed,
        "results": results,
    });
    if passed {
        Ok(result)
    } else {
        say!(
            out,
            "{} below {}:1",
            style.red("fail:"),
            args.min.unwrap_or_default()
        );
        Err(Error::Failed(result))
    }
}

// ---------------------------------------------------------------- doctor

#[derive(Debug, Default, clap::Args)]
pub struct DoctorArgs {
    /// The project to check [default: the current directory]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

struct Check {
    name: &'static str,
    /// `ok`, `warning`, `failed` or `skipped`.
    status: &'static str,
    detail: String,
}

pub fn doctor(args: &DoctorArgs, out: Out) -> Result<Value> {
    let style = out.style;
    let project = args.project.clone().unwrap_or_else(|| PathBuf::from("."));
    let mut checks: Vec<Check> = Vec::new();
    let mut check = |name: &'static str, status: &'static str, detail: String| {
        checks.push(Check {
            name,
            status,
            detail,
        });
    };

    // The record.
    let record = Record::read(&project);
    match &record {
        Ok(record) => match manifest().select(&record.targets) {
            Ok(_) => check(
                "record",
                "ok",
                format!(
                    "{RECORD}: {} with {}, made by xds {}",
                    record.name,
                    record.targets.join(", "),
                    record.xds
                ),
            ),
            Err(error) => check("record", "failed", format!("{RECORD}: {error}")),
        },
        Err(_) if project.join("template.json").is_file() => check(
            "record",
            "ok",
            "a checkout of the template, which has no record".to_owned(),
        ),
        Err(error) if project.join(RECORD).is_file() => {
            check("record", "failed", error.to_string());
        }
        Err(_) => check(
            "record",
            "warning",
            format!("no {RECORD}: `xds add` and the theme record will not work here"),
        ),
    }

    // The tokens and the theme they hold.
    let palette_file = theme::palette_file(&project);
    if !palette_file.is_file() {
        check(
            "tokens",
            "failed",
            format!("{} has no {PALETTE_PATH}", project.display()),
        );
    } else {
        let source = Source::Project(&project);
        match load_tokens(&source) {
            Ok(tokens) => check("tokens", "ok", format!("{} tokens load", tokens.len())),
            Err(error) => check("tokens", "failed", error.to_string()),
        }
        match (source.themes(), source.palette()) {
            (Ok(themes), Ok(palette)) => {
                let applied = themes
                    .iter()
                    .find(|theme| theme::is_applied(&palette, theme));
                let recorded = record.as_ref().ok().map(|record| record.theme.as_str());
                match (applied, recorded) {
                    (Some(theme), Some(recorded)) if theme.name != recorded => check(
                        "theme",
                        "warning",
                        format!(
                            "the palette holds {}, but {RECORD} says {recorded}: run `xds theme {}`",
                            theme.name, theme.name
                        ),
                    ),
                    (Some(theme), _) => {
                        check("theme", "ok", format!("the palette holds {}", theme.name));
                    }
                    (None, _) => check(
                        "theme",
                        "warning",
                        "the accent and neutral ramps match no theme in design/themes".to_owned(),
                    ),
                }
            }
            (Err(error), _) | (_, Err(error)) => check("theme", "failed", error.to_string()),
        }

        // The component contract points at files that exist.
        match load_components(&Location::Project(project.clone())) {
            Ok(components) => {
                let missing: Vec<String> = components
                    .iter()
                    .filter_map(|component| component["clients"].as_object())
                    .flat_map(|clients| clients.values())
                    .filter_map(|client| client["source"].as_str())
                    .filter(|path| !project.join(path).is_file())
                    .map(str::to_owned)
                    .collect();
                if missing.is_empty() {
                    check(
                        "components",
                        "ok",
                        format!("{} components, every source file exists", components.len()),
                    );
                } else {
                    check(
                        "components",
                        "failed",
                        format!(
                            "{COMPONENTS_PATH} names files that do not exist: {}",
                            missing.join(", ")
                        ),
                    );
                }
            }
            Err(error) => check("components", "warning", error.to_string()),
        }

        // Node, and with it whether the generated files are current.
        match theme::check_node() {
            Err(reason) => {
                check("node", "warning", reason);
                check(
                    "generated",
                    "skipped",
                    "needs Node to compare the generated files with the tokens".to_owned(),
                );
            }
            Ok(()) => {
                check("node", "ok", "node can run the token generator".to_owned());
                let script = project.join(GENERATOR);
                match Command::new("node")
                    .arg(&script)
                    .arg("--check")
                    .stdin(Stdio::null())
                    .output()
                {
                    Ok(output) if output.status.success() => check(
                        "generated",
                        "ok",
                        "the generated token files match the tokens".to_owned(),
                    ),
                    Ok(output) => {
                        let mut text = String::from_utf8_lossy(&output.stderr).into_owned();
                        text.push_str(&String::from_utf8_lossy(&output.stdout));
                        check(
                            "generated",
                            "failed",
                            format!("run `mise run tokens`. The generator said: {}", text.trim()),
                        );
                    }
                    Err(error) => check(
                        "generated",
                        "skipped",
                        format!("{} could not be started: {error}", script.display()),
                    ),
                }
            }
        }
    }

    let width = checks
        .iter()
        .map(|check| check.name.len())
        .max()
        .unwrap_or(0);
    for check in &checks {
        let status = match check.status {
            "ok" => style.green("ok     "),
            "warning" => style.yellow("warning"),
            "failed" => style.red("failed "),
            _ => style.dim("skipped"),
        };
        say!(out, "{status}  {:<width$}  {}", check.name, check.detail);
    }
    let healthy = checks.iter().all(|check| check.status != "failed");
    let result = json!({
        "project": project.display().to_string(),
        "ok": healthy,
        "checks": checks
            .iter()
            .map(|check| json!({ "name": check.name, "status": check.status, "detail": check.detail }))
            .collect::<Vec<_>>(),
    });
    if healthy {
        Ok(result)
    } else {
        Err(Error::Failed(result))
    }
}
