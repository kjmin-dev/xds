//! Writes JSON the way the project's other tools do, so a file `xds` rewrites does not show up
//! as reformatted.

use std::io;

use serde::Serialize;
use serde_json::Value;
use serde_json::ser::{Formatter, PrettyFormatter, Serializer};

/// The layout of `JSON.stringify(value, null, 2)` plus a final newline, which is what
/// `tools/design-build` writes: every array and object spread over lines, and whole numbers
/// without a fraction (`1`, where serde_json alone would keep `1.0`).
pub fn stringify(value: &Value) -> String {
    let mut bytes = Vec::new();
    let formatter = JavaScript(PrettyFormatter::with_indent(b"  "));
    value
        .serialize(&mut Serializer::with_formatter(&mut bytes, formatter))
        .expect("writing JSON to memory cannot fail");
    bytes.push(b'\n');
    String::from_utf8(bytes).expect("serde_json writes UTF-8")
}

/// Pretty printing, except that numbers are written as JavaScript writes them.
struct JavaScript<'a>(PrettyFormatter<'a>);

impl Formatter for JavaScript<'_> {
    fn write_f64<W: ?Sized + io::Write>(&mut self, writer: &mut W, value: f64) -> io::Result<()> {
        // Below 2^53 a whole f64 is an exact integer, and JavaScript prints it as one.
        if value.fract() == 0.0 && value.abs() < 9_007_199_254_740_992.0 {
            write!(writer, "{}", value as i64)
        } else {
            self.0.write_f64(writer, value)
        }
    }

    fn begin_array<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.begin_array(writer)
    }

    fn end_array<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.end_array(writer)
    }

    fn begin_array_value<W: ?Sized + io::Write>(
        &mut self,
        writer: &mut W,
        first: bool,
    ) -> io::Result<()> {
        self.0.begin_array_value(writer, first)
    }

    fn end_array_value<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.end_array_value(writer)
    }

    fn begin_object<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.begin_object(writer)
    }

    fn end_object<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.end_object(writer)
    }

    fn begin_object_key<W: ?Sized + io::Write>(
        &mut self,
        writer: &mut W,
        first: bool,
    ) -> io::Result<()> {
        self.0.begin_object_key(writer, first)
    }

    fn begin_object_value<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.begin_object_value(writer)
    }

    fn end_object_value<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.0.end_object_value(writer)
    }
}

/// The width oxfmt formats to, the `printWidth` in the template's `.oxfmtrc.jsonc`.
const LINE_WIDTH: usize = 100;

/// The layout oxfmt gives a JSON file it did not see before: objects spread over lines, and an
/// array on one line when it fits. Files that `xds` writes into a project with a JavaScript
/// workspace are checked by `oxfmt --check` there, so they have to come out already formatted.
pub fn format(value: &Value) -> String {
    let mut output = String::new();
    write_value(&mut output, value, 0, 0, 0);
    output.push('\n');
    output
}

/// `used` is how many columns of the current line are taken before the value starts, and
/// `after` how many follow it: one for a comma, none for the last member.
fn write_value(output: &mut String, value: &Value, indent: usize, used: usize, after: usize) {
    let pad = "  ".repeat(indent + 1);
    match value {
        Value::Object(members) if !members.is_empty() => {
            output.push_str("{\n");
            for (index, (key, member)) in members.iter().enumerate() {
                let key = Value::String(key.clone()).to_string();
                output.push_str(&pad);
                output.push_str(&key);
                output.push_str(": ");
                let last = index + 1 == members.len();
                write_value(
                    output,
                    member,
                    indent + 1,
                    pad.len() + key.len() + 2,
                    usize::from(!last),
                );
                output.push_str(if last { "\n" } else { ",\n" });
            }
            output.push_str(&"  ".repeat(indent));
            output.push('}');
        }
        Value::Array(items) if !items.is_empty() => {
            let flat = items
                .iter()
                .all(|item| !item.is_object() && !item.is_array());
            let one_line = format!(
                "[{}]",
                items
                    .iter()
                    .map(Value::to_string)
                    .collect::<Vec<_>>()
                    .join(", ")
            );
            if flat && used + one_line.len() + after <= LINE_WIDTH {
                output.push_str(&one_line);
                return;
            }
            output.push_str("[\n");
            for (index, item) in items.iter().enumerate() {
                output.push_str(&pad);
                let last = index + 1 == items.len();
                write_value(output, item, indent + 1, pad.len(), usize::from(!last));
                output.push_str(if last { "\n" } else { ",\n" });
            }
            output.push_str(&"  ".repeat(indent));
            output.push(']');
        }
        scalar_or_empty => output.push_str(&scalar_or_empty.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn stringify_matches_javascript() {
        let value: Value = serde_json::from_str(
            r##"{"b": {"components": [1.0, 0.9608, 0.0], "hex": "#fff"}, "a": [], "é": "—", "n": 12}"##,
        )
        .expect("valid JSON");
        // What `JSON.stringify(value, null, 2) + "\n"` prints for the same input.
        let expected = "{\n  \"b\": {\n    \"components\": [\n      1,\n      0.9608,\n      0\n    ],\n    \"hex\": \"#fff\"\n  },\n  \"a\": [],\n  \"é\": \"—\",\n  \"n\": 12\n}\n";
        assert_eq!(stringify(&value), expected);
    }

    #[test]
    fn format_keeps_a_short_array_on_one_line() {
        let value =
            json!({ "name": "orbit", "targets": ["web-react", "desktop-gpui"], "empty": {} });
        assert_eq!(
            format(&value),
            "{\n  \"name\": \"orbit\",\n  \"targets\": [\"web-react\", \"desktop-gpui\"],\n  \"empty\": {}\n}\n"
        );
    }

    #[test]
    fn format_breaks_an_array_that_does_not_fit() {
        let long: Vec<String> = (0..12)
            .map(|index| format!("target-number-{index}"))
            .collect();
        let text = format(&json!({ "targets": long }));
        assert!(text.starts_with("{\n  \"targets\": [\n    \"target-number-0\",\n"));
        assert!(text.lines().all(|line| line.len() <= LINE_WIDTH));
    }

    /// oxfmt keeps an array on one line when the line, with its comma if it has one, is at
    /// most `LINE_WIDTH` columns.
    #[test]
    fn format_fills_the_line_exactly() {
        // `  "a": ["…"]` is 11 columns around the string.
        let fits = "x".repeat(LINE_WIDTH - 11);
        let last = format(&json!({ "a": [fits] }));
        assert!(last.contains(&format!("  \"a\": [\"{fits}\"]\n")), "{last}");
        let followed = format(&json!({ "a": [fits], "b": 1 }));
        assert!(followed.contains("  \"a\": [\n"), "{followed}");
        let shorter = &fits[1..];
        let followed = format(&json!({ "a": [shorter], "b": 1 }));
        assert!(
            followed.contains(&format!("  \"a\": [\"{shorter}\"],\n")),
            "{followed}"
        );
    }
}
