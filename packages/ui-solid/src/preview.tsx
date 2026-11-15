// Draws a screen of @acme/ui-core/preview (the design preview, a behavior test's scenario)
// with this library's components. Each state slot is a signal, and the props and children are
// handed over as Solid's compiler hands over those written in JSX: a value that reads the
// state or holds nodes is a getter, read again where the component reads it, so a change
// updates only what reads the slot.

import {
  type ComponentName,
  type Components,
  type ComponentNode,
  type ElementNode,
  type Host,
  isNode,
  isStatic,
  type Lacking,
  resolve,
  type Screen,
  type Slot,
  type State,
} from "@acme/ui-core/preview";
import { dynamic, memo } from "@solidjs/web";
import {
  type Component,
  createComponent,
  createSignal,
  type Element,
  onSettled,
  Show,
  untrack,
} from "solid-js";
import {
  Accordion,
  Avatar,
  AvatarStack,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  Chip,
  ChipBar,
  CountBadge,
  Dialog,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  ListRow,
  MediaCard,
  Menu,
  ProgressBar,
  RadioGroup,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Select,
  Sidebar,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  Text,
  TextField,
  Thumbnail,
  Toast,
  Tooltip,
} from "./index.ts";

export { designPreview } from "@acme/ui-core/preview";

// Every component the data can name, each taking the props the data gives it. They are
// imported by name: a namespace import of the entry would put every component in the chunk
// that the app's own screens load too.
const COMPONENTS = {
  Accordion,
  Avatar,
  AvatarStack,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  Chip,
  ChipBar,
  CountBadge,
  Dialog,
  Divider,
  EmptyState,
  Icon,
  IconButton,
  ListRow,
  MediaCard,
  Menu,
  ProgressBar,
  RadioGroup,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Select,
  Sidebar,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  Text,
  TextField,
  Thumbnail,
  Toast,
  Tooltip,
} satisfies { [N in ComponentName]: Component<Components<Element>[N]> };

// `satisfies` checks the type of each prop a component takes against the data's, but lets a
// component lack one (see Lacking). This names each component that lacks any, with the props it
// lacks.
type Taken<C> = C extends (props: infer P) => unknown ? keyof P : never;
type Lacks<N extends ComponentName> = Lacking<N, Taken<(typeof COMPONENTS)[N]>>;
const _lacking: { [N in ComponentName as [Lacks<N>] extends [never] ? never : N]: Lacks<N> } = {};

type Props = Record<string, unknown>;

export function Preview(props: { screen: Screen }): Element {
  const screen = untrack(() => props.screen);
  const state: Props = {};
  const writes = new Map<string, (value: unknown) => void>();
  for (const [key, first] of Object.entries(screen.state)) {
    // Named, so that Solid's warnings in development say which slot they are about.
    const [read, write] = createSignal<unknown>(first, { name: key });
    Object.defineProperty(state, key, { get: read, enumerable: true });
    // The function form, since a value that is a function would be taken for an update.
    writes.set(key, (value) => write(() => value));
  }

  const host: Host<Element> = {
    state,
    set: (patch) => {
      for (const [key, value] of Object.entries(patch)) writes.get(key)?.(value);
    },
    draw: (slot: Slot<State> | undefined): Element => {
      // Text that follows the state, among other children, is a memo, which Solid updates in
      // place. Alone, it is read by the getter that draws it.
      if (Array.isArray(slot)) {
        return slot.map((child) =>
          typeof child === "function" ? (memo(() => child(state)) as Element) : host.draw(child),
        );
      }
      if (typeof slot === "function") return slot(state);
      if (!isNode(slot)) return slot;
      if (slot.kind === "show") {
        return createComponent(Show as Component<Props>, {
          get when() {
            return slot.when(state);
          },
          get children() {
            return host.draw(slot.children);
          },
          get fallback() {
            return host.draw(slot.fallback);
          },
        });
      }
      const type =
        slot.kind === "element"
          ? (dynamic(() => slot.tag, { static: true }) as Component<Props>)
          : (COMPONENTS[slot.name] as Component<Props>);
      return createComponent(type, propsOf(slot));
    },
  };

  const propsOf = ({ props: given, children }: ComponentNode | ElementNode) => {
    const props: Props = {};
    const read = (key: string, get: () => unknown) =>
      Object.defineProperty(props, key, { get, enumerable: true });
    for (const [key, value] of Object.entries(given)) {
      if (isStatic(value, key)) props[key] = resolve(value, key, host);
      else read(key, () => resolve(value, key, host));
    }
    if (children.length === 0) return props;
    const content = children.length === 1 ? children[0] : children;
    if (children.every((child) => isStatic(child))) props.children = content;
    else read("children", () => host.draw(content));
    return props;
  };

  onSettled(() => screen.mount?.());
  return host.draw(screen.root);
}
