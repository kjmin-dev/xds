//! Conditional blocks in files that several stacks share.
//!
//! ```toml
//! # @if js-workspace
//! pnpm = "12.19.0"
//! # @endif
//! # @if desktop-gpui
//! rust = "1.99.1"
//! # @endif
//! ```
//!
//! The lines between the two markers are kept when any of the listed names is selected. A name
//! is a target id, or a shared unit of `template.json`, which is selected when any selected
//! target requires it. A block that is there for what several targets share names the unit, so
//! a target added later that requires it gets the block without a change to the marker. The
//! marker lines themselves never reach a project. Blocks nest. A marker is a whole line holding
//! nothing but a comment, so the file stays valid in the template repository, where every block
//! is simply present.

use crate::error::{Error, Result};

/// Comment syntaxes a marker may be written in: what opens the comment and what closes it.
/// To use markers in another kind of file, add its comment syntax here.
const COMMENTS: &[(&str, &str)] = &[("#", ""), ("//", ""), ("<!--", "-->"), ("/*", "*/")];

#[derive(Debug, PartialEq, Eq)]
pub enum Marker<'a> {
    If(Vec<&'a str>),
    EndIf,
}

/// Reads a line as a marker, or returns `None` for any other line.
pub fn parse(line: &str) -> Option<Marker<'_>> {
    let line = line.trim();
    let body = COMMENTS
        .iter()
        .find_map(|(open, close)| Some(line.strip_prefix(open)?.strip_suffix(close)?.trim()))?;
    if body == "@endif" {
        return Some(Marker::EndIf);
    }
    let names = body.strip_prefix("@if")?;
    // `@iffy` is not a marker, and an `@if` without names is a mistake that `apply` reports.
    if !names.is_empty() && !names.starts_with(char::is_whitespace) {
        return None;
    }
    Some(Marker::If(names.split_whitespace().collect()))
}

/// Keeps or drops each block of `text`. `is_selected` answers for one name in a marker, and
/// `is_known` says whether the name exists at all, so that a typo in a marker is an error
/// instead of a block that silently never appears.
pub fn apply(
    text: &str,
    is_selected: impl Fn(&str) -> bool,
    is_known: impl Fn(&str) -> bool,
) -> Result<String> {
    if !text.contains("@if") && !text.contains("@endif") {
        return Ok(text.to_owned());
    }

    let mut output = String::with_capacity(text.len());
    // One entry per open block: whether its lines are kept, given the blocks around it.
    let mut open: Vec<bool> = Vec::new();
    // True right after lines were removed. A blank line that would now sit next to another blank
    // line, or at the start or end of the file, goes too: otherwise every dropped block would
    // leave a double blank line behind.
    let mut seam = false;
    let mut last_blank = true;

    for (index, line) in text.split_inclusive('\n').enumerate() {
        let number = index + 1;
        match parse(line) {
            Some(Marker::If(names)) => {
                if names.is_empty() {
                    return Err(Error::Message(format!(
                        "line {number}: @if needs a target or a shared unit"
                    )));
                }
                if let Some(unknown) = names.iter().find(|name| !is_known(name)) {
                    return Err(Error::Message(format!(
                        "line {number}: @if names \"{unknown}\", which is neither a target nor a \
                         shared unit"
                    )));
                }
                let kept = open.last().copied().unwrap_or(true);
                open.push(kept && names.iter().any(|name| is_selected(name)));
                seam = true;
            }
            Some(Marker::EndIf) => {
                if open.pop().is_none() {
                    return Err(Error::Message(format!(
                        "line {number}: @endif without an @if"
                    )));
                }
                seam = true;
            }
            None if !open.last().copied().unwrap_or(true) => seam = true,
            None => {
                let blank = line.trim().is_empty();
                if blank && seam && last_blank {
                    continue;
                }
                output.push_str(line);
                last_blank = blank;
                seam = seam && blank;
            }
        }
    }
    if !open.is_empty() {
        return Err(Error::Message(
            "an @if is never closed by an @endif".to_owned(),
        ));
    }
    if seam {
        // Blank lines left at the end by a block that was dropped there.
        let kept = output.trim_end_matches(['\n', '\r']).len();
        let newline = if output[kept..].starts_with("\r\n") {
            "\r\n"
        } else {
            "\n"
        };
        if output.len() > kept {
            output.truncate(kept);
            output.push_str(newline);
        }
    }
    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn render(text: &str, selected: &[&str]) -> String {
        apply(
            text,
            |id| selected.contains(&id),
            |id| ["a", "b", "template"].contains(&id),
        )
        .expect("the markers are well formed")
    }

    #[test]
    fn reads_markers_in_every_comment_syntax() {
        assert_eq!(parse("# @if a b"), Some(Marker::If(vec!["a", "b"])));
        assert_eq!(parse("  // @if a"), Some(Marker::If(vec!["a"])));
        assert_eq!(parse("<!-- @if a -->"), Some(Marker::If(vec!["a"])));
        assert_eq!(parse("/* @endif */"), Some(Marker::EndIf));
        assert_eq!(parse("    # @endif\r\n"), Some(Marker::EndIf));
        assert_eq!(parse("#@endif"), Some(Marker::EndIf));
    }

    #[test]
    fn leaves_other_lines_alone() {
        assert_eq!(parse("pnpm = \"1\" # @if a"), None);
        assert_eq!(parse("# see @if in the docs"), None);
        assert_eq!(parse("# @iffy"), None);
        assert_eq!(parse("@if a"), None);
        let text = "a = 1\n# a comment\n";
        assert_eq!(render(text, &[]), text);
    }

    #[test]
    fn keeps_a_block_when_any_listed_target_is_selected() {
        let text = "one\n# @if a b\ntwo\n# @endif\nthree\n";
        assert_eq!(render(text, &["b"]), "one\ntwo\nthree\n");
        assert_eq!(render(text, &[]), "one\nthree\n");
    }

    #[test]
    fn nests() {
        let text = "# @if a\nouter\n# @if b\ninner\n# @endif\n# @endif\n";
        assert_eq!(render(text, &["a", "b"]), "outer\ninner\n");
        assert_eq!(render(text, &["a"]), "outer\n");
        // The inner block is selected, but the block around it is not.
        assert_eq!(render(text, &["b"]), "");
    }

    #[test]
    fn works_between_the_items_of_a_list() {
        let text = "members = [\n  \"crates/*\",\n  # @if template\n  \"cli\",\n  # @endif\n]\n";
        assert_eq!(render(text, &[]), "members = [\n  \"crates/*\",\n]\n");
    }

    #[test]
    fn does_not_leave_double_blank_lines() {
        let inside = "one\n\n# @if a\ntwo\n\n# @endif\nthree\n";
        assert_eq!(render(inside, &["a"]), "one\n\ntwo\n\nthree\n");
        assert_eq!(render(inside, &[]), "one\n\nthree\n");

        let outside = "one\n\n# @if a\ntwo\n# @endif\n\nthree\n";
        assert_eq!(render(outside, &["a"]), "one\n\ntwo\n\nthree\n");
        assert_eq!(render(outside, &[]), "one\n\nthree\n");
    }

    #[test]
    fn trims_what_a_dropped_block_leaves_at_either_end() {
        assert_eq!(render("one\n\n# @if a\ntwo\n# @endif\n", &[]), "one\n");
        assert_eq!(render("# @if a\none\n# @endif\n\ntwo\n", &[]), "two\n");
    }

    #[test]
    fn rejects_markers_that_do_not_pair_up_or_name_no_target() {
        let known = |id: &str| id == "a";
        assert!(apply("# @if a\n", |_| true, known).is_err());
        assert!(apply("# @endif\n", |_| true, known).is_err());
        assert!(apply("# @if\n# @endif\n", |_| true, known).is_err());
        assert!(apply("# @if typo\n# @endif\n", |_| true, known).is_err());
    }
}
