//! Replaces the template's placeholder name with the project's, in file contents and in paths.

use crate::error::{Error, Result};
use crate::manifest::Placeholder;

/// Words that cannot be a Kotlin or Java package segment, plus directory names cargo reserves
/// for itself in `target/`. The name becomes `com.example.<name>` and a binary called `<name>`.
const RESERVED: &[&str] = &[
    "abstract",
    "as",
    "assert",
    "boolean",
    "break",
    "build",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "deps",
    "do",
    "double",
    "else",
    "enum",
    "examples",
    "extends",
    "false",
    "final",
    "finally",
    "float",
    "for",
    "fun",
    "goto",
    "if",
    "implements",
    "import",
    "in",
    "incremental",
    "instanceof",
    "int",
    "interface",
    "is",
    "long",
    "native",
    "new",
    "null",
    "object",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "strictfp",
    "super",
    "switch",
    "synchronized",
    "test",
    "this",
    "throw",
    "throws",
    "transient",
    "true",
    "try",
    "typealias",
    "typeof",
    "val",
    "var",
    "void",
    "volatile",
    "when",
    "while",
];

const MAX_NAME: usize = 40;
const MAX_TITLE: usize = 60;

/// The project's name in each form the template uses.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Names {
    /// `orbit`: crate names, the npm scope, a Kotlin package segment, CSS variable prefixes.
    pub name: String,
    /// `Orbit Notes`: what people read.
    pub title: String,
    /// `OrbitNotes`: the title where it is part of an identifier, as in `OrbitNotesTheme`.
    identifier: String,
}

impl Names {
    pub fn new(name: &str, title: Option<&str>) -> Result<Self> {
        validate_name(name)?;
        let default_title = capitalize(name);
        let title = title.unwrap_or(&default_title).to_owned();
        validate_title(&title)?;
        let mut identifier: String = title
            .split(|character: char| !character.is_ascii_alphanumeric())
            .map(capitalize)
            .collect();
        // A title in another script, or one that starts with a digit, leaves nothing usable.
        if !identifier.starts_with(|first: char| first.is_ascii_alphabetic()) {
            identifier = default_title;
        }
        Ok(Self {
            name: name.to_owned(),
            title,
            identifier,
        })
    }

    /// Replaces the three spellings of the placeholder: `acme`, `ACME` and `Acme`.
    pub fn apply(&self, text: &str, placeholder: &Placeholder) -> String {
        let upper_from = placeholder.name.to_uppercase();
        let upper_to = self.name.to_uppercase();
        let mut output = String::with_capacity(text.len());
        let mut rest = text;
        // One pass, so a replacement is never itself rewritten.
        while let Some(character) = rest.chars().next() {
            if rest.starts_with(&placeholder.name) {
                output.push_str(&self.name);
                rest = &rest[placeholder.name.len()..];
            } else if rest.starts_with(&upper_from) {
                output.push_str(&upper_to);
                rest = &rest[upper_from.len()..];
            } else if rest.starts_with(&placeholder.title) {
                let after = &rest[placeholder.title.len()..];
                // `AcmeTheme` has to stay one identifier, whatever the title looks like.
                let in_identifier =
                    output.ends_with(is_identifier_part) || after.starts_with(is_identifier_part);
                output.push_str(if in_identifier {
                    &self.identifier
                } else {
                    &self.title
                });
                rest = after;
            } else {
                output.push(character);
                rest = &rest[character.len_utf8()..];
            }
        }
        output
    }
}

fn is_identifier_part(character: char) -> bool {
    character.is_ascii_alphanumeric() || character == '_'
}

fn capitalize(word: &str) -> String {
    let mut characters = word.chars();
    match characters.next() {
        Some(first) => first.to_uppercase().chain(characters).collect(),
        None => String::new(),
    }
}

/// What is wrong with `name`, or `None` when it can be used.
pub fn name_problem(name: &str) -> Option<&'static str> {
    let allowed = |character: char| character.is_ascii_lowercase() || character.is_ascii_digit();
    Some(if name.is_empty() {
        "is empty"
    } else if !name.starts_with(|first: char| first.is_ascii_lowercase()) {
        "has to start with a lowercase letter"
    } else if !name.chars().all(allowed) {
        "may only hold lowercase letters and digits"
    } else if name.len() > MAX_NAME {
        "is longer than 40 characters"
    } else if RESERVED.contains(&name) {
        "is a reserved word in Kotlin, Java or cargo"
    } else {
        return None;
    })
}

pub fn validate_name(name: &str) -> Result<()> {
    match name_problem(name) {
        None => Ok(()),
        Some(problem) => Err(Error::Message(format!(
            "The name \"{name}\" {problem}. It becomes a crate name, an npm scope and a Kotlin \
             package segment, so use lowercase letters and digits, starting with a letter."
        ))),
    }
}

/// The title is pasted into string literals, JSX text and HTML, so it is kept to characters
/// that mean nothing special in any of them.
pub fn validate_title(title: &str) -> Result<()> {
    let allowed = |character: char| character.is_alphanumeric() || " -_.".contains(character);
    let problem = if !title.starts_with(char::is_alphanumeric) {
        "has to start with a letter or a digit"
    } else if !title.chars().all(allowed) {
        "may only hold letters, digits, spaces, and - _ ."
    } else if title.ends_with(' ') {
        "ends with a space"
    } else if title.chars().count() > MAX_TITLE {
        "is longer than 60 characters"
    } else {
        return Ok(());
    };
    Err(Error::Message(format!("The title \"{title}\" {problem}.")))
}

/// A name to offer for a project in `directory`: its last component, reduced to what a name may
/// hold. `None` when nothing valid is left.
pub fn name_from_directory(directory: &std::path::Path) -> Option<String> {
    // A relative path such as `.` has no file name until it is made absolute.
    let absolute = std::path::absolute(directory).ok()?;
    let base = absolute.file_name()?.to_string_lossy().to_lowercase();
    let name: String = base
        .chars()
        .filter(|character| character.is_ascii_lowercase() || character.is_ascii_digit())
        .skip_while(char::is_ascii_digit)
        .take(MAX_NAME)
        .collect();
    validate_name(&name).is_ok().then_some(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn placeholder() -> Placeholder {
        Placeholder {
            name: "acme".to_owned(),
            title: "Acme".to_owned(),
        }
    }

    #[test]
    fn accepts_lowercase_letters_and_digits() {
        for name in ["orbit", "a", "app2", "x1y2z3"] {
            assert!(validate_name(name).is_ok(), "{name}");
        }
    }

    #[test]
    fn rejects_names_that_would_not_work_everywhere() {
        let too_long = "a".repeat(41);
        for name in [
            "", "Orbit", "2fast", "my-app", "my_app", "my app", "café", "class", "test", &too_long,
        ] {
            assert!(validate_name(name).is_err(), "{name}");
        }
    }

    #[test]
    fn title_defaults_to_the_capitalized_name() {
        let names = Names::new("orbit", None).expect("a valid name");
        assert_eq!(names.title, "Orbit");
    }

    #[test]
    fn rejects_titles_that_would_break_a_string_literal() {
        for title in [
            "",
            " Orbit",
            "Orbit ",
            "Orbit \"Notes\"",
            "A&B",
            "<b>",
            "it's",
            "a\\b",
        ] {
            assert!(validate_title(title).is_err(), "{title}");
        }
        for title in ["Orbit", "Orbit Notes", "말문", "Orbit 2.0", "Hi-Fi_App"] {
            assert!(validate_title(title).is_ok(), "{title}");
        }
    }

    #[test]
    fn replaces_all_three_spellings() {
        let names = Names::new("orbit", None).expect("a valid name");
        let text = "@acme/ui --acme-color ACME_HOME \"Acme\" crates/acme-ui com.example.acme";
        assert_eq!(
            names.apply(text, &placeholder()),
            "@orbit/ui --orbit-color ORBIT_HOME \"Orbit\" crates/orbit-ui com.example.orbit"
        );
    }

    #[test]
    fn keeps_identifiers_whole_when_the_title_has_spaces() {
        let names = Names::new("orbit", Some("Orbit Notes")).expect("a valid name and title");
        assert_eq!(
            names.apply("fun AcmeTheme() // Acme's theme, \"Acme\"", &placeholder()),
            "fun OrbitNotesTheme() // Orbit Notes's theme, \"Orbit Notes\""
        );
    }

    #[test]
    fn falls_back_to_the_name_when_the_title_has_no_ascii_letters() {
        let names = Names::new("malmoon", Some("말문")).expect("a valid name and title");
        assert_eq!(
            names.apply("AcmeTheme <title>Acme</title>", &placeholder()),
            "MalmoonTheme <title>말문</title>"
        );
    }

    #[test]
    fn does_not_rewrite_its_own_output() {
        // A name that contains the placeholder, and a title that contains its upper-case form.
        let names = Names::new("acmeco", Some("ACME Co")).expect("a valid name and title");
        assert_eq!(
            names.apply("acme Acme ACME", &placeholder()),
            "acmeco ACME Co ACMECO"
        );
    }

    #[test]
    fn derives_a_name_from_a_directory() {
        use std::path::Path;
        assert_eq!(
            name_from_directory(Path::new("/tmp/My-App 2")),
            Some("myapp2".to_owned())
        );
        assert_eq!(name_from_directory(Path::new("/tmp/123")), None);
        assert_eq!(
            name_from_directory(Path::new("/tmp/42orbit")),
            Some("orbit".to_owned())
        );
    }
}
