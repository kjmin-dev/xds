//! One error type for the whole tool: a message for the person, or a cancelled prompt.

use std::fmt;

#[derive(Debug)]
pub enum Error {
    /// Printed after `error: `, then the process exits with 1.
    Message(String),
    /// Esc or Ctrl-C in a prompt. Nothing was written; the process exits with 130.
    Cancelled,
    /// A check ran and did not pass (`doctor`, `contrast --min`). The command has already
    /// reported what it found, so only the exit code, 1, says so again. With `--json` the
    /// findings are printed on stdout like any other result.
    Failed(serde_json::Value),
}

pub type Result<T> = std::result::Result<T, Error>;

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Message(message) => formatter.write_str(message),
            Self::Cancelled => formatter.write_str("Cancelled."),
            Self::Failed(_) => formatter.write_str("A check did not pass."),
        }
    }
}

impl From<String> for Error {
    fn from(message: String) -> Self {
        Self::Message(message)
    }
}

impl From<&str> for Error {
    fn from(message: &str) -> Self {
        Self::Message(message.to_owned())
    }
}

impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Self::Message(error.to_string())
    }
}

/// Adds what was being done to an error that only says what went wrong (`No such file`).
pub trait Context<T> {
    fn context(self, what: impl fmt::Display) -> Result<T>;
}

impl<T, E: fmt::Display> Context<T> for std::result::Result<T, E> {
    fn context(self, what: impl fmt::Display) -> Result<T> {
        self.map_err(|error| Error::Message(format!("{what}: {error}")))
    }
}
