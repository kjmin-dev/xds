//! Interactive prompts: a line of text, a multi-select and a single-select with a preview.
//!
//! Each prompt redraws its few lines in place and leaves one summary line behind. The terminal
//! is put into raw mode while a prompt is open and always put back, also when the prompt is
//! cancelled or the program panics.

use std::io::{self, IsTerminal, Write, stdin, stdout};
use std::sync::atomic::{AtomicBool, Ordering};

use crossterm::cursor::{Hide, MoveToColumn, MoveUp, Show};
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use crossterm::terminal::{self, BeginSynchronizedUpdate, Clear, ClearType, EndSynchronizedUpdate};
use crossterm::{execute, queue};

use crate::error::{Error, Result};
use crate::style::Style;

/// Whether there is a person to ask: both ends have to be a terminal.
pub fn is_interactive() -> bool {
    stdin().is_terminal() && stdout().is_terminal()
}

/// The terminal size as (columns, rows), or the classic 80x24 when it cannot be read.
pub fn terminal_size() -> (usize, usize) {
    terminal::size().map_or((80, 24), |(columns, rows)| {
        (usize::from(columns), usize::from(rows))
    })
}

static RAW: AtomicBool = AtomicBool::new(false);

/// Raw mode for as long as the value lives.
struct RawMode;

impl RawMode {
    fn enter() -> io::Result<Self> {
        terminal::enable_raw_mode()?;
        RAW.store(true, Ordering::SeqCst);
        execute!(stdout(), Hide)?;
        Ok(Self)
    }
}

impl Drop for RawMode {
    fn drop(&mut self) {
        restore_terminal();
    }
}

/// Leaves raw mode and shows the cursor again. Also called from the panic hook: the release
/// build aborts on panic, which skips destructors, and a shell left in raw mode is unusable.
pub fn restore_terminal() {
    if RAW.swap(false, Ordering::SeqCst) {
        let _ = execute!(stdout(), Show);
        let _ = terminal::disable_raw_mode();
    }
}

/// The lines a prompt has on screen, so the next draw can replace them.
struct Frame {
    drawn: u16,
}

impl Frame {
    fn new() -> Self {
        Self { drawn: 0 }
    }

    fn draw(&mut self, lines: &[String]) -> io::Result<()> {
        let mut out = stdout().lock();
        // Without this the terminal may show the frame half drawn. Terminals that do not know
        // the sequence ignore it.
        queue!(out, BeginSynchronizedUpdate)?;
        if self.drawn > 0 {
            queue!(out, MoveUp(self.drawn))?;
        }
        queue!(out, MoveToColumn(0))?;
        for line in lines {
            // Raw mode does not turn `\n` into a new line at column 0.
            write!(out, "{line}")?;
            queue!(out, Clear(ClearType::UntilNewLine))?;
            write!(out, "\r\n")?;
        }
        queue!(out, Clear(ClearType::FromCursorDown), EndSynchronizedUpdate)?;
        self.drawn = u16::try_from(lines.len()).unwrap_or(u16::MAX);
        out.flush()
    }
}

enum Key {
    Up,
    Down,
    Enter,
    Cancel,
    Backspace,
    Char(char),
    Other,
}

fn read_key() -> io::Result<Key> {
    loop {
        let Event::Key(KeyEvent {
            code,
            modifiers,
            kind,
            ..
        }) = event::read()?
        else {
            // A resize: redraw with the new size.
            return Ok(Key::Other);
        };
        // Windows also reports the release of a key.
        if kind == KeyEventKind::Release {
            continue;
        }
        let control = modifiers.contains(KeyModifiers::CONTROL);
        return Ok(match code {
            // Raw mode turns off the terminal's own Ctrl-C handling, so it arrives as a key.
            KeyCode::Char('c' | 'd') if control => Key::Cancel,
            KeyCode::Esc => Key::Cancel,
            KeyCode::Up => Key::Up,
            KeyCode::Down => Key::Down,
            KeyCode::Char('p') if control => Key::Up,
            KeyCode::Char('n') if control => Key::Down,
            KeyCode::Enter => Key::Enter,
            KeyCode::Backspace => Key::Backspace,
            KeyCode::Char(character) if !control => Key::Char(character),
            _ => Key::Other,
        });
    }
}

/// Cuts `text` to at most `width` cells. Prompt lines must not wrap: the redraw moves the
/// cursor up by the number of lines it printed.
fn fit(text: &str, width: usize) -> String {
    if text.chars().count() <= width {
        return text.to_owned();
    }
    let mut cut: String = text.chars().take(width.saturating_sub(1)).collect();
    cut.push('…');
    cut
}

fn summary(style: Style, label: &str, value: &str) -> String {
    format!("{} {} {value}", style.green("+"), style.bold(label))
}

/// Runs a prompt: draws, reacts to keys until `step` returns a value, then replaces the prompt
/// with a one-line summary.
fn run<T>(
    style: Style,
    label: &str,
    mut lines: impl FnMut() -> Vec<String>,
    mut step: impl FnMut(Key) -> Option<(T, String)>,
) -> Result<T> {
    let raw = RawMode::enter()?;
    let mut frame = Frame::new();
    let outcome = loop {
        frame.draw(&lines())?;
        match read_key()? {
            Key::Cancel => break None,
            key => {
                if let Some(done) = step(key) {
                    break Some(done);
                }
            }
        }
    };
    let last = match &outcome {
        Some((_, value)) => summary(style, label, value),
        None => format!("{} {}", style.red("x"), style.bold(label)),
    };
    frame.draw(&[last])?;
    drop(raw);
    outcome.map(|(value, _)| value).ok_or(Error::Cancelled)
}

/// Asks for one line of text. `validate` returns what is wrong with the text, if anything.
pub fn text(
    style: Style,
    label: &str,
    hint: &str,
    initial: &str,
    validate: impl Fn(&str) -> std::result::Result<(), String>,
) -> Result<String> {
    let (columns, _) = terminal_size();
    let value = std::cell::RefCell::new(initial.to_owned());
    let problem = std::cell::RefCell::new(None::<String>);
    run(
        style,
        label,
        || {
            let mut lines = vec![
                format!(
                    "{} {}",
                    style.bold(label),
                    style.dim(&fit(hint, columns.saturating_sub(label.len() + 2)))
                ),
                format!("{} {}{}", style.cyan(">"), value.borrow(), style.dim("_")),
            ];
            if let Some(problem) = problem.borrow().as_ref() {
                lines.push(style.yellow(&fit(problem, columns.saturating_sub(1))));
            }
            lines
        },
        |key| {
            match key {
                Key::Enter => match validate(&value.borrow()) {
                    Ok(()) => return Some((value.borrow().clone(), value.borrow().clone())),
                    Err(message) => *problem.borrow_mut() = Some(message),
                },
                Key::Backspace => {
                    value.borrow_mut().pop();
                    *problem.borrow_mut() = None;
                }
                Key::Char(character) if !character.is_control() => {
                    value.borrow_mut().push(character);
                    *problem.borrow_mut() = None;
                }
                _ => {}
            }
            None
        },
    )
}

pub struct Choice {
    pub name: String,
    pub description: String,
}

fn choice_line(
    style: Style,
    choice: &Choice,
    name_width: usize,
    current: bool,
    mark: &str,
    columns: usize,
) -> String {
    let pointer = if current {
        style.cyan(">")
    } else {
        " ".to_owned()
    };
    let name = format!("{:<name_width$}", choice.name);
    let name = if current { style.bold(&name) } else { name };
    let used = 2 + mark.chars().count() + name_width + 2;
    let description = fit(&choice.description, columns.saturating_sub(used + 1));
    format!("{pointer} {mark}{name}  {}", style.dim(&description))
}

fn name_width(choices: &[Choice]) -> usize {
    choices
        .iter()
        .map(|choice| choice.name.chars().count())
        .max()
        .unwrap_or(0)
}

fn step_cursor(cursor: &mut usize, count: usize, key: &Key) -> bool {
    match key {
        Key::Up | Key::Char('k') => *cursor = (*cursor + count - 1) % count,
        Key::Down | Key::Char('j') => *cursor = (*cursor + 1) % count,
        _ => return false,
    }
    true
}

/// Asks for one or more of `choices`. Returns their indexes, in the order of the list.
pub fn multi_select(
    style: Style,
    label: &str,
    choices: &[Choice],
    preselected: &[usize],
) -> Result<Vec<usize>> {
    let (columns, _) = terminal_size();
    let width = name_width(choices);
    let state = std::cell::RefCell::new((0usize, vec![false; choices.len()], false));
    for index in preselected {
        state.borrow_mut().1[*index] = true;
    }
    run(
        style,
        label,
        || {
            let state = state.borrow();
            let (cursor, picked, nagging) = &*state;
            let hint = "up/down to move, space to toggle, a for all, enter to confirm";
            let mut lines = vec![format!(
                "{} {}",
                style.bold(label),
                style.dim(&fit(hint, columns.saturating_sub(label.len() + 2)))
            )];
            for (index, choice) in choices.iter().enumerate() {
                let mark = if picked[index] { "[x] " } else { "[ ] " };
                lines.push(choice_line(
                    style,
                    choice,
                    width,
                    index == *cursor,
                    mark,
                    columns,
                ));
            }
            if *nagging {
                lines.push(style.yellow("Pick at least one with space."));
            }
            lines
        },
        |key| {
            let mut state = state.borrow_mut();
            let (cursor, picked, nagging) = &mut *state;
            if step_cursor(cursor, choices.len(), &key) {
                return None;
            }
            match key {
                Key::Char(' ') => {
                    picked[*cursor] = !picked[*cursor];
                    *nagging = false;
                }
                Key::Char('a') => {
                    let all = picked.iter().all(|picked| *picked);
                    picked.iter_mut().for_each(|picked| *picked = !all);
                    *nagging = false;
                }
                Key::Enter => {
                    let indexes: Vec<usize> =
                        (0..choices.len()).filter(|index| picked[*index]).collect();
                    if indexes.is_empty() {
                        *nagging = true;
                    } else {
                        let names: Vec<&str> = indexes
                            .iter()
                            .map(|index| choices[*index].name.as_str())
                            .collect();
                        return Some((indexes, names.join(", ")));
                    }
                }
                _ => {}
            }
            None
        },
    )
}

/// Asks for one of `choices`. `preview` is called with the index under the cursor and the room
/// left below the list, as (columns, rows), every time the cursor moves; the lines it returns
/// are drawn under the list.
pub fn select(
    style: Style,
    label: &str,
    choices: &[Choice],
    initial: usize,
    preview: impl Fn(usize, usize, usize) -> Vec<String>,
) -> Result<usize> {
    let width = name_width(choices);
    let cursor = std::cell::Cell::new(initial.min(choices.len().saturating_sub(1)));
    run(
        style,
        label,
        || {
            // Read on every draw, so the preview follows a resized window.
            let (columns, rows) = terminal_size();
            let hint = "up/down or j/k to move, enter to choose, esc to cancel";
            let mut lines = vec![format!(
                "{} {}",
                style.bold(label),
                style.dim(&fit(hint, columns.saturating_sub(label.len() + 2)))
            )];
            for (index, choice) in choices.iter().enumerate() {
                lines.push(choice_line(
                    style,
                    choice,
                    width,
                    index == cursor.get(),
                    "",
                    columns,
                ));
            }
            // One row for the blank line above the preview and one for the cursor below it:
            // a frame taller than the window would scroll, and the redraw would lose its place.
            let room = rows.saturating_sub(lines.len() + 2);
            let preview = preview(cursor.get(), columns, room);
            if !preview.is_empty() && preview.len() <= room {
                lines.push(String::new());
                lines.extend(preview);
            }
            lines
        },
        |key| {
            let mut position = cursor.get();
            if step_cursor(&mut position, choices.len(), &key) {
                cursor.set(position);
                return None;
            }
            matches!(key, Key::Enter).then(|| (cursor.get(), choices[cursor.get()].name.clone()))
        },
    )
}

/// Makes a panic put the terminal back before it reports itself.
pub fn install_panic_hook() {
    let default = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        restore_terminal();
        default(info);
    }));
}
