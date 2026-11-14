// Zag's overlays listen for Escape on the document in the capture phase, before a field inside
// them sees the key, so a field cannot keep the key by stopping it. A field marks itself with
// `data-uses-escape` while Escape does something in it, such as clearing it, and every overlay
// checks for the mark.

/**
 * For the `onEscapeKeyDown` of every overlay machine: leaves Escape to a field that uses it,
 * so that Escape in a SearchField inside a Dialog clears the field and the Dialog stays.
 */
export function leaveEscapeToFields(event: KeyboardEvent): void {
  if (event.target instanceof Element && event.target.closest("[data-uses-escape]"))
    event.preventDefault();
}
