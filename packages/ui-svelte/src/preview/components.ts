import type { ComponentName, Components, Lacking } from "@acme/ui-core/preview";
import type { Component, Snippet } from "svelte";
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
} from "../index.ts";

/**
 * Every component the data can name, each taking the props the data gives it, with a snippet
 * for each node. They are imported by name: a namespace import of the entry would put every
 * component in the chunk that the app's own screens load too.
 */
export const COMPONENTS = {
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
} satisfies { [N in ComponentName]: Component<Components<Snippet>[N]> };

// `satisfies` checks the type of each prop a component takes against the data's, but lets a
// component lack one (see Lacking). This names each component that lacks any, with the props it
// lacks.
type Taken<C> = C extends Component<infer P> ? keyof P : never;
type Lacks<N extends ComponentName> = Lacking<N, Taken<(typeof COMPONENTS)[N]>>;
({}) satisfies { [N in ComponentName as [Lacks<N>] extends [never] ? never : N]: Lacks<N> };
