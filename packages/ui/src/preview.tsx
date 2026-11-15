// Draws a screen of @acme/ui-core/preview (the design preview, a behavior test's scenario)
// with this library's components. The screen's state lives here; every change draws the whole
// screen again, and React keeps what did not change.

import {
  type ComponentName,
  type Components,
  type Host,
  isNode,
  type Lacking,
  resolve,
  type Screen,
  type Slot,
  type State,
} from "@acme/ui-core/preview";
import {
  type ComponentType,
  createElement,
  Fragment,
  type ReactNode,
  useEffect,
  useState,
} from "react";
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
  DatePicker,
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
  DatePicker,
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
} satisfies { [N in ComponentName]: ComponentType<Components<ReactNode>[N]> };

// `satisfies` checks the type of each prop a component takes against the data's, but lets a
// component lack one (see Lacking). This names each component that lacks any, with the props it
// lacks. The data's `class` is React's `className`.
type Taken<C> = C extends (props: infer P) => unknown
  ? keyof P | ("className" extends keyof P ? "class" : never)
  : never;
type Lacks<N extends ComponentName> = Lacking<N, Taken<(typeof COMPONENTS)[N]>>;
const _lacking: { [N in ComponentName as [Lacks<N>] extends [never] ? never : N]: Lacks<N> } = {};

// `font-size` in the data is `fontSize` in a React style; a custom property keeps its name.
const camel = (name: string) =>
  name.startsWith("--")
    ? name
    : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

export function Preview({ screen }: { screen: Screen }) {
  const [state, setState] = useState(screen.state);
  useEffect(() => screen.mount?.(), [screen]);
  const host: Host<ReactNode> = {
    state,
    set: (patch) => setState((current) => ({ ...current, ...patch })),
    draw: (slot: Slot<State> | undefined): ReactNode => {
      if (Array.isArray(slot)) return createElement(Fragment, null, ...slot.map(host.draw));
      if (typeof slot === "function") return slot(state);
      if (!isNode(slot)) return slot as ReactNode;
      if (slot.kind === "show") return host.draw(slot.when(state) ? slot.children : slot.fallback);
      const props: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(slot.props)) {
        if (key === "class") props.className = resolve(value, key, host);
        else if (key === "style") {
          props.style = Object.fromEntries(
            Object.entries(value as object).map(([name, css]) => [camel(name), css]),
          );
        } else props[key] = resolve(value, key, host);
      }
      const type =
        slot.kind === "element"
          ? slot.tag
          : (COMPONENTS[slot.name] as ComponentType<Record<string, unknown>>);
      return createElement(type, props, ...slot.children.map(host.draw));
    },
  };
  return host.draw(screen.root);
}
