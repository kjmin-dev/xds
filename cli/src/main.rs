//! `xds` scaffolds a project from the cross-platform design system template: pick the client
//! stacks, a name and a color theme, and get a repository that holds only those.

mod commands;
mod error;
mod json;
mod manifest;
mod markers;
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
    let cli = match Cli::from_arg_matches(&command.get_matches()) {
        Ok(cli) => cli,
        Err(error) => error.exit(),
    };

    let result = match &cli.command {
        Command::List => commands::list(style),
        Command::Themes { name } => commands::themes(name.as_deref(), style),
        Command::Create(args) => commands::create(args, style),
        Command::Add(args) => commands::add(args, style),
        Command::Theme(args) => commands::theme(args, style),
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(Error::Cancelled) => {
            eprintln!("Cancelled. Nothing was written.");
            // What a shell reports for a command stopped with Ctrl-C.
            ExitCode::from(130)
        }
        Err(Error::Message(message)) => {
            eprintln!("{} {message}", style.red("error:"));
            ExitCode::FAILURE
        }
    }
}
