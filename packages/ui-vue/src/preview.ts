// Draws a screen of @acme/ui-core/preview (the design preview, a behavior test's scenario)
// with this library's components. The state is one shallow reactive object. Each component of
// the screen is drawn by a small component of its own, so the render that reads a slot of the
// state is the one of the component whose props read it, and a change draws that component
// again, not the screen. A node the data gives a component goes into the slot of the prop's
// name, or into the default slot for the children, and is drawn when the component draws that
// slot. An `onChange` is the update event of the component's model.

import {
  type ComponentName,
  type ComponentNode,
  type Components,
  type Controlled,
  type Host,
  isCallback,
  isNode,
  resolve,
  type Screen,
  type Slot,
  type State,
} from "@acme/ui-core/preview";
import {
  type AllowedComponentProps,
  camelize,
  type Component,
  defineComponent,
  h,
  type InjectionKey,
  inject,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  shallowReactive,
  type VNodeChild,
} from "vue";
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

// ---------------------------------------------------------------- what the components take

// What a slot draws, standing for the node of the data in the check below.
type Drawn = VNodeChild;

// A component of a `<script setup>` is a constructor of its instance, or a function of its
// props when it is generic. Its props hold its events too, as `on` props.
type PropsOf<C> = C extends new (...args: never) => { $props: infer P }
  ? P
  : C extends (props: infer P, ...rest: never) => unknown
    ? P
    : never;
type SlotsOf<C> = C extends new (...args: never) => { $slots: infer S }
  ? S
  : C extends (...args: never) => { __ctx?: { slots: infer S } }
    ? S
    : never;
// The slots a component names, without the index signature every component's slots have.
type Named<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

// Vue puts `class` and `style` in the props' type of every component, but only a component
// with one root element passes them on: one whose template is a fragment, such as Menu or
// Tooltip, drops them with a warning. So only these components take them in the check below.
// Add a component here once the data gives it a class and its template has one root.
type Rooted = "Card" | "Icon" | "Text";

/**
 * What a component takes, under the names the data gives it: its props; its slots as props
 * that take a node, the default one as `children`; and its model's update event as `onChange`.
 */
type Taken<C, N extends ComponentName> = Omit<
  PropsOf<C>,
  `onUpdate:${string}` | keyof AllowedComponentProps
> &
  (N extends Rooted ? AllowedComponentProps : {}) & {
    [S in keyof Named<SlotsOf<C>> as S extends "default" ? "children" : S]: Drawn;
  } & {
    [
      E in keyof PropsOf<C> as E extends `onUpdate:${Controlled}` ? "onChange" : never
    ]: PropsOf<C>[E];
  };

// Vue keeps a prop under its camelized name, which is the one the component's type has:
// `aria-label` is `ariaLabel`.
type Camel<K> = K extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<Camel<Tail>>}` : K;
type Camelized<T> = { [K in keyof T as Camel<K>]: T[K] };

// The props of the data that a component does not take with the type the data passes, and
// those it requires that the data may leave out.
type Misfits<Data, Takes> =
  | {
      [K in keyof Data]-?: K extends keyof Takes
        ? Pick<Data, K> extends Pick<Takes, K>
          ? never
          : K
        : K;
    }[keyof Data]
  | {
      [K in keyof Takes]-?: K extends keyof Data ? never : {} extends Pick<Takes, K> ? never : K;
    }[keyof Takes];

// Every component the data can name. They are imported by name: a namespace import of the
// entry would put every component in the chunk that the app's own screens load too.
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
};

// The check of README step 1: each component that lacks a prop the data may pass, takes it
// with another type, or requires one the data may leave out, with the names of those props.
// It has to be empty.
type Misfit<N extends ComponentName> = Misfits<
  Camelized<Components<Drawn>[N]>,
  Taken<(typeof COMPONENTS)[N], N>
>;
({}) satisfies { [N in ComponentName as [Misfit<N>] extends [never] ? never : N]: Misfit<N> };

// ---------------------------------------------------------------- drawing

const MODELS: readonly Controlled[] = ["value", "checked", "expanded"];
// Attributes every Vue component takes on its root without declaring them.
const ATTRIBUTES = new Set(["class", "style"]);

type Props = Record<string, unknown>;
type Drawer = Host<VNodeChild> & { readonly part: (node: ComponentNode) => VNodeChild };

const HOST: InjectionKey<Drawer> = Symbol("preview host");

/** One component of the screen, drawn again when a slot that its props read changes. */
const Part = defineComponent({
  props: { node: { type: Object as PropType<ComponentNode>, required: true } },
  setup(props) {
    const host = inject(HOST);
    if (!host) throw new Error("A part of a preview is drawn outside the preview.");
    return () => host.part(props.node);
  },
});

export const Preview = defineComponent({
  props: { screen: { type: Object as PropType<Screen>, required: true } },
  setup(props) {
    // The screen is drawn once: a new one is a new Preview.
    const screen = props.screen;
    const state = shallowReactive<Props>({ ...screen.state });

    const host: Drawer = {
      state,
      set: (patch) => Object.assign(state, patch),
      draw: (slot: Slot<State> | undefined): VNodeChild => {
        if (Array.isArray(slot)) return slot.map(host.draw);
        if (typeof slot === "function") return slot(state);
        // Text, or nothing.
        if (!isNode(slot)) return slot as string | number | undefined;
        if (slot.kind === "show")
          return host.draw(slot.when(state) ? slot.children : slot.fallback);
        if (slot.kind === "component") return h(Part, { node: slot });
        const attributes: Props = {};
        for (const [key, value] of Object.entries(slot.props)) {
          attributes[key] = resolve(value, key, host);
        }
        return h(slot.tag, attributes, slot.children.map(host.draw));
      },
      part: ({ name, props: given, children }) => {
        const type = COMPONENTS[name] as Component & { props?: Props };
        const declared = new Set(Object.keys(type.props ?? {}));
        const props: Props = {};
        const slots: Record<string, () => VNodeChild> = {};
        for (const [key, value] of Object.entries(given)) {
          if (key === "onChange") {
            const model = MODELS.find((name) => declared.has(name));
            props[model ? `onUpdate:${model}` : key] = resolve(value, key, host);
          } else if (isCallback(key) || declared.has(camelize(key)) || ATTRIBUTES.has(key)) {
            props[key] = resolve(value, key, host);
          } else slots[key] = () => host.draw(value as Slot<State>);
        }
        if (children.length > 0) slots.default = () => host.draw(children);
        return h(type, props, slots);
      },
    };
    provide(HOST, host);

    let unmount: (() => void) | undefined;
    onMounted(() => (unmount = screen.mount?.()));
    onBeforeUnmount(() => unmount?.());
    return () => host.draw(screen.root);
  },
});
