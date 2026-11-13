//! The subcommands.

use std::fs;
use std::io::{IsTerminal, stdout};
use std::path::{Path, PathBuf};

use crate::error::{Context, Error, Result};
use crate::manifest::{Manifest, Target, manifest};
use crate::preview::{Layout, Preview};
use crate::prompt::{self, Choice};
use crate::rename::{self, Names};
use crate::render::{self, BUILD_CONFIG, RECORD, Record};
use crate::style::Style;
use crate::template::{File, template};
use crate::theme::{self, PALETTE_PATH, Regenerated, Source, Theme};

/// The suffix of a file written next to one that `add` did not dare to replace.
pub const MERGE_SUFFIX: &str = ".xds-new";

#[derive(Debug, Default, clap::Args)]
pub struct CreateArgs {
    /// Where to create the project
    pub directory: PathBuf,
    /// Project name: lowercase letters and digits, starting with a letter. It replaces `acme`
    #[arg(long)]
    pub name: Option<String>,
    /// Display name. It replaces `Acme` [default: the name, capitalized]
    #[arg(long)]
    pub title: Option<String>,
    /// Client stacks to include, comma separated, or `all` (see `xds list`)
    #[arg(long, value_delimiter = ',', value_name = "TARGETS")]
    pub targets: Option<Vec<String>>,
    /// Color theme (see `xds themes`)
    #[arg(long)]
    pub theme: Option<String>,
    /// Ask nothing: the name comes from the directory, every target is included, and the theme
    /// is the default, unless a flag says otherwise
    #[arg(long, short)]
    pub yes: bool,
    /// Print what would be written and write nothing
    #[arg(long)]
    pub dry_run: bool,
    /// Write into a directory that is not empty
    #[arg(long)]
    pub force: bool,
}

#[derive(Debug, Default, clap::Args)]
pub struct AddArgs {
    /// Client stacks to add (see `xds list`)
    #[arg(required = true, value_name = "TARGET")]
    pub targets: Vec<String>,
    /// The project to add them to [default: the current directory]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

#[derive(Debug, Default, clap::Args)]
pub struct ThemeArgs {
    /// The theme to apply. Without it, pick one from a list with a live preview
    pub name: Option<String>,
    /// The project to change [default: the current directory]
    #[arg(long, value_name = "DIR")]
    pub project: Option<PathBuf>,
}

fn find_theme<'a>(themes: &'a [Theme], name: &str) -> Result<&'a Theme> {
    themes
        .iter()
        .find(|theme| theme.name == name)
        .ok_or_else(|| {
            let names: Vec<&str> = themes.iter().map(|theme| theme.name.as_str()).collect();
            Error::Message(format!(
                "There is no theme \"{name}\". Themes: {}",
                names.join(", ")
            ))
        })
}

// ---------------------------------------------------------------- list, themes

pub fn list(style: Style) -> Result<()> {
    let manifest = manifest();
    let source = Source::Embedded(template());

    println!("{}", style.bold("Targets"));
    let rows: Vec<(&str, String, &str)> = manifest
        .targets
        .iter()
        .map(|target| (target.id.as_str(), target.label(), target.stack.as_str()))
        .collect();
    let id_width = rows.iter().map(|row| row.0.len()).max().unwrap_or(0);
    let platform_width = rows.iter().map(|row| row.1.len()).max().unwrap_or(0);
    for (id, platforms, stack) in rows {
        println!(
            "  {}  {platforms:<platform_width$}  {}",
            style.cyan(&format!("{id:<id_width$}")),
            style.dim(stack)
        );
    }

    println!("\n{}", style.bold("Themes"));
    let themes = source.themes()?;
    let name_width = themes
        .iter()
        .map(|theme| theme.name.len())
        .max()
        .unwrap_or(0);
    for theme in &themes {
        // The accent the theme is named after, as a swatch: the step buttons are filled with.
        let swatch = theme
            .ramp("accent")
            .get(6)
            .map(|color| style.swatch(*color))
            .unwrap_or_default();
        let gap = if swatch.is_empty() { "" } else { " " };
        let default = if theme.name == manifest.default_theme {
            " (default)"
        } else {
            ""
        };
        println!(
            "  {swatch}{gap}{}  {}{default}",
            style.cyan(&format!("{:<name_width$}", theme.name)),
            style.dim(&theme.description)
        );
    }
    Ok(())
}

pub fn themes(name: Option<&str>, style: Style) -> Result<()> {
    let source = Source::Embedded(template());
    let all = source.themes()?;
    let shown: Vec<&Theme> = match name {
        Some(name) => vec![find_theme(&all, name)?],
        None => all.iter().collect(),
    };
    // Piped output has no width; 80 columns is what the side-by-side preview is made for.
    let columns = if stdout().is_terminal() {
        prompt::terminal_size().0
    } else {
        80
    };
    let layout = Layout::fit(columns, None).unwrap_or(Layout::Compact);
    for theme in shown {
        let default = if theme.name == manifest().default_theme {
            " (default)"
        } else {
            ""
        };
        println!(
            "{}{default}  {}",
            style.bold(&theme.name),
            style.dim(&theme.description)
        );
        for line in Preview::new(&source, theme)?.lines(layout, style) {
            println!("{line}");
        }
        println!();
    }
    Ok(())
}

/// The interactive theme list. The preview below it is redrawn for the theme under the cursor.
fn pick_theme<'a>(
    style: Style,
    source: &Source<'_>,
    themes: &'a [Theme],
    initial: &str,
) -> Result<&'a Theme> {
    let previews: Vec<Preview> = themes
        .iter()
        .map(|theme| Preview::new(source, theme))
        .collect::<Result<_>>()?;
    let choices: Vec<Choice> = themes
        .iter()
        .map(|theme| Choice {
            name: theme.name.clone(),
            description: theme.description.clone(),
        })
        .collect();
    let initial = themes
        .iter()
        .position(|theme| theme.name == initial)
        .unwrap_or(0);
    let index = prompt::select(style, "Theme", &choices, initial, |index, columns, rows| {
        if !style.color {
            // The hex listing has one size; the prompt leaves it out when it does not fit.
            return previews[index].lines(Layout::SideBySide, style);
        }
        Layout::fit(columns, Some(rows))
            .map(|layout| previews[index].lines(layout, style))
            .unwrap_or_default()
    })?;
    Ok(&themes[index])
}

// ---------------------------------------------------------------- create

pub fn create(args: &CreateArgs, style: Style) -> Result<()> {
    let manifest = manifest();
    let template = template();
    let source = Source::Embedded(template);
    let themes = source.themes()?;
    let directory = args.directory.as_path();

    // Everything that can be wrong with the flags is reported before the first question.
    check_destination(directory, args.force)?;
    if let Some(name) = &args.name {
        rename::validate_name(name)?;
    }
    if let Some(title) = &args.title {
        rename::validate_title(title)?;
    }
    let flag_targets = args
        .targets
        .as_ref()
        .map(|ids| select_targets(manifest, ids))
        .transpose()?;
    let flag_theme = args
        .theme
        .as_ref()
        .map(|name| find_theme(&themes, name))
        .transpose()?;

    let interactive = !args.yes && prompt::is_interactive();
    if !interactive && !args.yes {
        let missing: Vec<&str> = [
            ("--name", args.name.is_none()),
            ("--targets", args.targets.is_none()),
        ]
        .into_iter()
        .filter_map(|(flag, missing)| missing.then_some(flag))
        .collect();
        if !missing.is_empty() {
            return Err(Error::Message(format!(
                "This is not a terminal, so there is nobody to ask. Pass {}, or --yes to take the \
                 defaults (the name of the directory, every target, the {} theme).",
                missing.join(" and "),
                manifest.default_theme
            )));
        }
    }

    let name = match &args.name {
        Some(name) => name.clone(),
        None if args.yes => rename::name_from_directory(directory).ok_or_else(|| {
            Error::Message(format!(
                "\"{}\" cannot be turned into a project name. Pass --name.",
                directory.display()
            ))
        })?,
        None => prompt::text(
            style,
            "Project name",
            "lowercase letters and digits, starting with a letter",
            &rename::name_from_directory(directory).unwrap_or_default(),
            |name| {
                rename::name_problem(name)
                    .map_or(Ok(()), |problem| Err(format!("The name {problem}.")))
            },
        )?,
    };
    let names = Names::new(&name, args.title.as_deref())?;

    let targets: Vec<&Target> = match flag_targets {
        Some(targets) => targets,
        None if args.yes => manifest.targets.iter().collect(),
        None => {
            let choices: Vec<Choice> = manifest
                .targets
                .iter()
                .map(|target| Choice {
                    name: target.id.clone(),
                    description: format!("{} - {}", target.label(), target.stack),
                })
                .collect();
            let picked = prompt::multi_select(style, "Targets", &choices, &[])?;
            picked
                .into_iter()
                .map(|index| &manifest.targets[index])
                .collect()
        }
    };

    let theme = match flag_theme {
        Some(theme) => theme,
        None if interactive => pick_theme(style, &source, &themes, &manifest.default_theme)?,
        None => find_theme(&themes, &manifest.default_theme)?,
    };

    let mut files = render::render(template, manifest, &targets, &names)?;
    // The template's palette holds the default theme, and so do its generated files. Any other
    // theme goes into the palette here and into the generated files once they are on disk.
    let palette = files
        .get_mut(PALETTE_PATH)
        .ok_or_else(|| Error::Message(format!("the template has no {PALETTE_PATH}")))?;
    let palette_text = String::from_utf8(palette.contents.clone()).context(PALETTE_PATH)?;
    let themed = !theme::is_applied(&palette_text, theme);
    if themed {
        palette.contents = theme::apply(&palette_text, theme)?.into_bytes();
    }
    files.insert(
        RECORD.to_owned(),
        Record::new(&names, &targets, &theme.name).to_file(),
    );

    let ids: Vec<&str> = targets.iter().map(|target| target.id.as_str()).collect();
    let details = |verb: &str| {
        println!(
            "{verb} {} in {}",
            style.bold(&names.title),
            directory.display()
        );
        println!("  name     {}", names.name);
        println!("  targets  {}", ids.join(", "));
        println!("  theme    {}", theme.name);
        println!("  files    {}", files.len());
    };

    if args.dry_run {
        details("Would create");
        println!();
        for path in files.keys() {
            println!("  {path}");
        }
        if themed {
            println!(
                "\nThe generated token files would then be rewritten for the {} theme.",
                theme.name
            );
        }
        println!("\n{}", style.dim("Dry run: nothing was written."));
        return Ok(());
    }

    render::write(directory, &files)?;
    details("Created");
    if themed {
        println!();
        match theme::regenerate(directory) {
            Regenerated::Done => {
                println!("Regenerated the token files for the {} theme.", theme.name);
            }
            Regenerated::Skipped(reason) => print_stale(style, &theme.name, &reason),
            Regenerated::Failed(output) => {
                return Err(Error::Message(format!(
                    "The project was written, but the generator refused the {} theme, so the \
                     generated token files still hold the {} theme:\n{output}",
                    theme.name, manifest.default_theme
                )));
            }
        }
    }
    print_next_steps(style, Some(directory), &targets);
    Ok(())
}

fn select_targets<'a>(manifest: &'a Manifest, ids: &[String]) -> Result<Vec<&'a Target>> {
    let targets = manifest.select(ids)?;
    if targets.is_empty() {
        return Err(Error::Message(format!(
            "A project needs at least one target. Targets: {}",
            manifest.target_ids().join(", ")
        )));
    }
    Ok(targets)
}

fn check_destination(directory: &Path, force: bool) -> Result<()> {
    if directory.is_file() {
        return Err(Error::Message(format!(
            "{} is a file.",
            directory.display()
        )));
    }
    let occupied = fs::read_dir(directory).is_ok_and(|mut entries| entries.next().is_some());
    if occupied && !force {
        return Err(Error::Message(format!(
            "{} is not empty. Pass --force to write into it anyway; files with the same path \
             are overwritten.",
            directory.display()
        )));
    }
    Ok(())
}

fn print_stale(style: Style, theme: &str, reason: &str) {
    println!(
        "{} The palette holds the {theme} theme, but the generated token files are stale: {reason}.",
        style.yellow("warning:")
    );
    println!("         Run `mise run tokens` in the project to regenerate them.");
}

fn print_next_steps(style: Style, directory: Option<&Path>, targets: &[&Target]) {
    println!("\n{}", style.bold("Next steps"));
    if let Some(directory) = directory.filter(|directory| *directory != Path::new(".")) {
        println!("  cd {}", directory.display());
    }
    // mise does not read a new mise.toml until it is trusted.
    println!("  mise trust");
    println!("  mise install");
    // The template is formatted for its placeholder name. Another name makes some lines too
    // long and moves some imports, which the formatters in `check` would report.
    let mut formatters: Vec<&str> = Vec::new();
    for formatter in targets.iter().filter_map(|target| target.format.as_deref()) {
        if !formatters.contains(&formatter) {
            formatters.push(formatter);
        }
    }
    for formatter in formatters {
        println!(
            "  {formatter}  {}",
            style.dim("once: the new name changes line lengths and import order")
        );
    }
    println!("  mise run check");

    let commands: Vec<_> = targets.iter().flat_map(|target| &target.run).collect();
    if commands.is_empty() {
        return;
    }
    println!("\n{}", style.bold("Run"));
    let width = commands
        .iter()
        .map(|run| run.command.len())
        .max()
        .unwrap_or(0);
    for run in commands {
        println!(
            "  {}  {}",
            style.cyan(&format!("{:<width$}", run.command)),
            style.dim(&run.description)
        );
    }
}

// ---------------------------------------------------------------- add

pub fn add(args: &AddArgs, style: Style) -> Result<()> {
    let manifest = manifest();
    let project = args.project.clone().unwrap_or_else(|| PathBuf::from("."));
    let record = Record::read(&project)?;
    let names = Names::new(&record.name, Some(&record.title))?;

    let current = manifest
        .select(&record.targets)
        .context(project.join(RECORD).display())?;
    let added: Vec<&Target> = manifest
        .select(&args.targets)?
        .into_iter()
        .filter(|target| !record.targets.contains(&target.id))
        .collect();
    if added.is_empty() {
        println!("{} already has {}.", names.title, args.targets.join(", "));
        return Ok(());
    }
    let mut ids = record.targets.clone();
    ids.extend(added.iter().map(|target| target.id.clone()));
    let wanted = manifest.select(&ids)?;

    // What the project was made of, and what it would be made of with the new targets. The
    // difference is what `add` has to bring in.
    let before = render::render(template(), manifest, &current, &names)?;
    let after = render::render(template(), manifest, &wanted, &names)?;

    let mut new_files = 0;
    let mut updated = Vec::new();
    let mut conflicts = Vec::new();
    for (path, file) in &after {
        let on_disk = fs::read(project.join(path)).ok();
        match (before.get(path), on_disk) {
            // Already what it should be.
            (_, Some(existing)) if existing == file.contents => {}
            // The new targets do not touch this file, so whatever the project did to it stays.
            (Some(old), _) if old == file => {}
            (_, None) => {
                render::write_file(&project, path, file)?;
                new_files += 1;
            }
            // Untouched since `create`: safe to replace.
            (Some(old), Some(existing)) if existing == old.contents => {
                render::write_file(&project, path, file)?;
                updated.push(path.as_str());
            }
            // The list of outputs can be merged without guessing.
            (_, Some(existing)) if path == BUILD_CONFIG => {
                if let Some(merged) = render::merge_build_config(&existing, &file.contents)? {
                    let merged = File {
                        contents: merged.into_bytes(),
                        executable: false,
                    };
                    render::write_file(&project, path, &merged)?;
                    updated.push(path.as_str());
                }
            }
            // Changed in the project. Put the new version next to it for a merge by hand.
            (_, Some(_)) => {
                render::write_file(&project, &format!("{path}{MERGE_SUFFIX}"), file)?;
                conflicts.push(path.as_str());
            }
        }
    }

    let new_record = Record::new(&names, &wanted, &record.theme);
    render::write_file(&project, RECORD, &new_record.to_file())?;

    let added_ids: Vec<&str> = added.iter().map(|target| target.id.as_str()).collect();
    println!(
        "Added {} to {}",
        style.bold(&added_ids.join(", ")),
        names.title
    );
    println!("  {new_files} new files");
    if !updated.is_empty() {
        println!("  updated: {}", updated.join(", "));
    }
    if !conflicts.is_empty() {
        println!(
            "\n{} These files were changed since the project was created, so they were left alone.",
            style.yellow("Needs a manual merge.")
        );
        println!("The version with the new targets is next to each one:");
        for path in &conflicts {
            println!("  {path}  ->  {path}{MERGE_SUFFIX}");
        }
        if record.xds != env!("CARGO_PKG_VERSION") {
            println!(
                "{}",
                style.dim(&format!(
                    "(The project was created with xds {}, and this is {}: files may differ for that reason alone.)",
                    record.xds,
                    env!("CARGO_PKG_VERSION")
                ))
            );
        }
    }

    // New kinds of generated file come from the template, which holds the default theme and the
    // template's tokens. The project's tokens may differ, so they are generated again.
    let kinds_before = render::output_kinds(&before[BUILD_CONFIG].contents)?;
    let kinds_after = render::output_kinds(&after[BUILD_CONFIG].contents)?;
    if kinds_after.iter().any(|kind| !kinds_before.contains(kind)) {
        match theme::regenerate(&project) {
            Regenerated::Done => {
                println!("\nRegenerated the token files from the project's tokens.")
            }
            Regenerated::Skipped(reason) | Regenerated::Failed(reason) => {
                println!(
                    "\n{} The new generated token files come from the template: {reason}.",
                    style.yellow("warning:")
                );
                println!(
                    "         If the project's tokens or theme were changed, run `mise run tokens` to bring them in line."
                );
            }
        }
    }

    print_next_steps(style, None, &added);
    Ok(())
}

// ---------------------------------------------------------------- theme

pub fn theme(args: &ThemeArgs, style: Style) -> Result<()> {
    let project = args.project.clone().unwrap_or_else(|| PathBuf::from("."));
    let palette_file = theme::palette_file(&project);
    if !palette_file.is_file() {
        return Err(Error::Message(format!(
            "{} has no {PALETTE_PATH}, so there is no theme to change. Use --project to point at a project.",
            project.display()
        )));
    }
    // The project's own themes and tokens: it may have added a theme or changed what a
    // semantic color points at.
    let source = Source::Project(&project);
    let themes = source.themes()?;
    let palette = source.palette()?;
    let record = Record::read(&project).ok();
    let names: Vec<&str> = themes.iter().map(|theme| theme.name.as_str()).collect();

    let chosen = match &args.name {
        Some(name) => find_theme(&themes, name)?,
        None if prompt::is_interactive() => {
            let applied = themes
                .iter()
                .find(|theme| theme::is_applied(&palette, theme));
            let initial = applied
                .map(|theme| theme.name.as_str())
                .or(record.as_ref().map(|record| record.theme.as_str()))
                .unwrap_or_default();
            pick_theme(style, &source, &themes, initial)?
        }
        None => {
            return Err(Error::Message(format!(
                "This is not a terminal, so there is no list to pick from. Name the theme: \
                 xds theme <name>. Themes: {}",
                names.join(", ")
            )));
        }
    };

    let update_record = || -> Result<()> {
        if let Some(record) = &record
            && record.theme != chosen.name
        {
            let record = Record {
                theme: chosen.name.clone(),
                ..record.clone()
            };
            render::write_file(&project, RECORD, &record.to_file())?;
        }
        Ok(())
    };

    if theme::is_applied(&palette, chosen) {
        update_record()?;
        println!("{PALETTE_PATH} already holds the {} theme.", chosen.name);
        return Ok(());
    }

    fs::write(&palette_file, theme::apply(&palette, chosen)?).context(palette_file.display())?;
    match theme::regenerate(&project) {
        Regenerated::Done => {
            println!(
                "Applied the {} theme and regenerated the token files.",
                style.bold(&chosen.name)
            );
        }
        Regenerated::Skipped(reason) => print_stale(style, &chosen.name, &reason),
        Regenerated::Failed(output) => {
            // The generator checks contrast before it writes, so the generated files are still
            // the old ones. Put the palette back to match them.
            fs::write(&palette_file, &palette).context(palette_file.display())?;
            return Err(Error::Message(format!(
                "The generator refused the {} theme, so nothing was changed:\n{output}",
                chosen.name
            )));
        }
    }
    update_record()
}
