//! How a command reports: text for a person, or one JSON document for a program.

use serde_json::{Value, json};

use crate::error::Error;
use crate::style::Style;

/// Exit codes. They are part of the interface: scripts and agents branch on them.
pub mod exit {
    /// The command did what it was asked.
    pub const OK: u8 = 0;
    /// The command failed, or a check it ran did not pass (`doctor`, `contrast --min`).
    pub const FAILURE: u8 = 1;
    /// The arguments were wrong. This is the code clap uses.
    pub const USAGE: u8 = 2;
    /// A prompt was cancelled with Esc or Ctrl-C: what a shell reports for Ctrl-C.
    pub const CANCELLED: u8 = 130;
}

#[derive(Debug, Clone, Copy)]
pub struct Out {
    pub style: Style,
    /// With `--json` the text is left out and the command's result is printed as JSON instead.
    pub json: bool,
}

impl Out {
    pub fn new(style: Style, json: bool) -> Self {
        Self { style, json }
    }

    #[cfg(test)]
    pub fn plain() -> Self {
        Self::new(Style::plain(), false)
    }
}

/// Prints a line for a person. Says nothing with `--json`, where stdout holds the result alone.
#[macro_export]
macro_rules! say {
    ($out:expr) => {
        if !$out.json {
            println!();
        }
    };
    ($out:expr, $($argument:tt)*) => {
        if !$out.json {
            println!($($argument)*);
        }
    };
}

/// The result of a command, as it is printed with `--json`.
pub fn print_json(value: &Value) {
    println!(
        "{}",
        serde_json::to_string_pretty(value).expect("a JSON value can be written")
    );
}

/// An error as `--json` prints it on stderr: `{"error": {"kind": ..., "message": ...}}`.
pub fn error_json(kind: &str, message: &str) -> Value {
    json!({ "error": { "kind": kind, "message": message } })
}

pub fn error_kind(error: &Error) -> &'static str {
    match error {
        Error::Message(_) => "error",
        Error::Cancelled => "cancelled",
        Error::Failed(_) => "failed",
    }
}
