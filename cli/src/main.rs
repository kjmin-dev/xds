//! `xds` scaffolds a project from the cross-platform design system template: pick the client
//! stacks, a name and a color theme, and get a repository that holds only those.

mod commands;
mod error;
mod inspect;
mod json;
mod manifest;
mod markers;
mod output;
mod preview;
mod prompt;
mod rename;
mod render;
mod style;
mod template;
mod theme;

#[cfg(test)]
mod tests;

use std::process::ExitCode;

use clap::{ColorChoice, CommandFactory, FromArgMatches, Parser, Subcommand};

use crate::commands::{AddArgs, CreateArgs, ThemeArgs};
use crate::error::Error;
use crate::inspect::{ComponentsArgs, ContrastArgs, DoctorArgs, TokensArgs};
use crate::output::{Out, exit};
use crate::style::Style;

#[derive(Debug, Parser)]
#[command(
    name = "xds",
    version,
    about = "Scaffolds a project from the cross-platform design system template.",
    after_help = "Docs: https://github.com/kjmin-dev/xds/blob/main/docs/cli.md",
    propagate_version = true
)]
struct Cli {
    /// Print without colors (also: the NO_COLOR environment variable)
    #[arg(long, global = true)]
    no_color: bool,
    /// Print the result as JSON on stdout, and errors as JSON on stderr. Never asks anything
    #[arg(long, global = true)]
    json: bool,
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// List the client stacks and the color themes
    List,
    /// Show a color preview of every theme, or of one
    Themes {
        /// The theme to show
        name: Option<String>,
    },
    /// Create a project. On a terminal, anything not given as a flag is asked
    Create(CreateArgs),
    /// Add client stacks to a project created earlier
    Add(AddArgs),
    /// Apply a color theme to a project
    Theme(ThemeArgs),
    /// Show the design tokens with their values in each mode
    Tokens(TokensArgs),
    /// List the components, or describe one: its options and where it is on each client
    Components(ComponentsArgs),
    /// Measure the WCAG contrast between two colors or color tokens
    Contrast(ContrastArgs),
    /// Check a project: its record, its tokens, and whether the generated files are current
    Doctor(DoctorArgs),
}

fn main() -> ExitCode {
    prompt::install_panic_hook();

    // Looked for by hand as well, so that help and usage errors, which clap prints while it
    // parses, already follow the flag.
    let no_color = std::env::args_os().any(|argument| argument == "--no-color");
    let style = Style::detect(no_color);
    let command = Cli::command().color(if style.color {
        ColorChoice::Auto
    } else {
        ColorChoice::Never
    });
    // The same for `--json`: a usage error is then reported as JSON too.
    let json = std::env::args_os().any(|argument| argument == "--json");
    let matches = match command.try_get_matches() {
        Ok(matches) => matches,
        Err(error) if json && error.use_stderr() => {
            let message = error.render().to_string();
            eprintln!("{}", output::error_json("usage", message.trim()));
            return ExitCode::from(exit::USAGE);
        }
        Err(error) => error.exit(),
    };
    let cli = match Cli::from_arg_matches(&matches) {
        Ok(cli) => cli,
        Err(error) => error.exit(),
    };
    let out = Out::new(style, cli.json);

    let result = match &cli.command {
        Command::List => commands::list(out),
        Command::Themes { name } => commands::themes(name.as_deref(), out),
        Command::Create(args) => commands::create(args, out),
        Command::Add(args) => commands::add(args, out),
        Command::Theme(args) => commands::theme(args, out),
        Command::Tokens(args) => inspect::tokens(args, out),
        Command::Components(args) => inspect::components(args, out),
        Command::Contrast(args) => inspect::contrast(args, out),
        Command::Doctor(args) => inspect::doctor(args, out),
    };
    match result {
        Ok(value) => {
            if out.json {
                output::print_json(&value);
            }
            ExitCode::from(exit::OK)
        }
        // The command has said what it found; with --json that is the result.
        Err(Error::Failed(value)) => {
            if out.json {
                output::print_json(&value);
            }
            ExitCode::from(exit::FAILURE)
        }
        Err(error) if out.json => {
            eprintln!(
                "{}",
                output::error_json(output::error_kind(&error), &error.to_string())
            );
            ExitCode::from(match error {
                Error::Cancelled => exit::CANCELLED,
                _ => exit::FAILURE,
            })
        }
        Err(Error::Cancelled) => {
            eprintln!("Cancelled. Nothing was written.");
            ExitCode::from(exit::CANCELLED)
        }
        Err(error) => {
            eprintln!("{} {error}", style.red("error:"));
            ExitCode::from(exit::FAILURE)
        }
    }
}
