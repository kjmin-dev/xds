/**
 * The class on the root element of every web component, `acme-` and its name in kebab case
 * (`acme-icon-button`). It is the component's stable handle for an app's own styles, beside the
 * part classes of the components drawn with a stylesheet (`acme-dialog__title`) and the state
 * attributes (`aria-*`, `data-state`). A published library names it after itself.
 */
export function rootPart(component: string): string {
  return `acme-${component.replace(/[A-Z]/g, (letter, index: number) => `${index ? "-" : ""}${letter.toLowerCase()}`)}`;
}

/** Joins the classes that are given, skipping those that are not. */
export function classes(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
