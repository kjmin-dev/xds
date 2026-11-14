// @acme/ui-core/preview: the design preview of the web apps as data, and what a renderer needs
// to draw it. It stays out of the component entry, so an app's own screens never load it.
// README.md beside this file says how a web library draws it.

export type { ComponentName, Components, Controlled, Lacking } from "./components.ts";
export { designPreview, type DesignPreviewOptions, SECTIONS } from "./design.ts";
export {
  type Builder,
  builder,
  type Child,
  type ComponentNode,
  type ElementNode,
  type ElementProps,
  type Host,
  isNode,
  isStatic,
  type Live,
  type On,
  type PreviewNode,
  type PropsOf,
  resolve,
  type Screen,
  type ShowNode,
  type Slot,
  type State,
} from "./model.ts";
