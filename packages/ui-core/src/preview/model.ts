// What a screen of the design preview is made of, written once for every web framework, and
// the steps a renderer shares to draw it. A screen is a tree of nodes (a component of the
// library by name with its props and children, a plain element with classes, or a branch shown
// while a condition holds) and a set of named state slots with their first values. A prop or a
// text that follows the state is a function of the state; a callback is a function of the state
// and the callback's arguments that returns the slots to change. The data holds no framework
// node: a renderer in each web library draws the tree with that library's components.

import type { ComponentName, Components, Controlled } from "./components.ts";

/** The state of a screen as a renderer holds it: values by slot name. */
export type State = Readonly<Record<string, unknown>>;

/** A value, or a function of the state that gives it. */
export type Live<T, S> = T | ((state: S) => T);

/**
 * A callback: given the state and the callback's arguments, it returns the slots to change, or
 * `undefined` to change none.
 */
export type On<S, A extends readonly unknown[] = []> = (
  state: S,
  ...args: A
) => Partial<S> | undefined;

/** Something drawn in one place: text, a node, or text that follows the state. */
export type Child<S> = string | number | PreviewNode<S> | ((state: S) => string | number);

/** What a slot holds: one child, or several side by side. */
export type Slot<S> = Child<S> | readonly Child<S>[];

// A symbol marks the nodes, so that no plain object in the props, such as an option, can pass
// for one.
const NODE: unique symbol = Symbol("preview node");

// Never set: it gives a node the type of its screen's state, so that a node written for one
// state cannot be placed in a screen of another, where its functions would read slots that are
// not there.
declare const STATE: unique symbol;

type Props = Readonly<Record<string, unknown>>;

/** A component of the library, by the name it has in every web library. */
export type ComponentNode = {
  readonly [NODE]: true;
  readonly kind: "component";
  readonly name: ComponentName;
  readonly props: Props;
  readonly children: readonly Child<State>[];
};

/** A plain element, with classes and attributes. */
export type ElementNode = {
  readonly [NODE]: true;
  readonly kind: "element";
  readonly tag: keyof HTMLElementTagNameMap;
  readonly props: Props;
  readonly children: readonly Child<State>[];
};

/** `children` while `when` holds, `fallback` otherwise. */
export type ShowNode = {
  readonly [NODE]: true;
  readonly kind: "show";
  readonly when: (state: State) => boolean;
  readonly children: Slot<State>;
  readonly fallback?: Slot<State> | undefined;
};

/** A node of a screen whose state is `S`. A renderer reads every node as one of `State`. */
export type PreviewNode<S = State> = (ComponentNode | ElementNode | ShowNode) & {
  readonly [STATE]?: (state: S) => S;
};

/** The attributes an element of a screen takes. */
export type ElementProps<S> = {
  class?: Live<string, S>;
  /** CSS properties by their CSS names, such as `border-radius`. */
  style?: Readonly<Record<string, string>>;
  id?: string;
  role?: string;
  "aria-label"?: string;
  href?: string;
  src?: string;
  alt?: string;
};

/** A screen as a renderer receives it. */
export type Screen = {
  /** The first value of every state slot. */
  readonly state: State;
  readonly root: Slot<State>;
  /** Runs once the screen is on the page; what it returns runs when the screen goes. */
  readonly mount?: (() => (() => void) | undefined) | undefined;
};

// The props of the data are derived from Components, with a mark standing for the framework
// node: a slot takes children, a callback (a prop named `on` and a capital, as isCallback reads
// it) takes an On, and any other prop a Live value, an object such as a date range as a whole
// or field by field. A wrong name or a wrong value is a type error where the screen is written.
// A node is a prop of the component itself or a child, never a field of a list item or of an
// object: Svelte hands a component a node only as a snippet prop, and a snippet that draws
// components can only be written in a template.
declare const SLOT: unique symbol;
type SlotMark = { readonly [SLOT]: true };
type Args<F> = F extends (...args: infer A) => unknown ? A : never;
type Fields<P, S, Top extends boolean> = {
  [K in keyof P]: K extends `on${Capitalize<string>}`
    ? On<S, Args<NonNullable<P[K]>>>
    : Field<P[K], S, Top>;
};
type Field<T, S, Top extends boolean> = [NonNullable<T>] extends [SlotMark]
  ? Top extends true
    ? Slot<S>
    : never
  : [NonNullable<T>] extends [readonly (infer E)[]]
    ? Live<readonly Item<E, S>[], S>
    : [NonNullable<T>] extends [object]
      ? Fields<NonNullable<T>, S, false> | ((state: S) => T)
      : Live<T, S>;
type Item<E, S> = E extends object ? Fields<E, S, false> : E;

/** The props a screen gives a component, short of its children. */
export type PropsOf<N extends ComponentName, S> = Fields<
  Omit<Components<SlotMark>[N], "children">,
  S,
  true
>;
type ChildrenOf<N extends ComponentName, S> = "children" extends keyof Components<SlotMark>[N]
  ? readonly Child<S>[]
  : [];
type Bound<S, K extends keyof S, P extends Controlled> = { [_ in P]: (state: S) => S[K] } & {
  onChange: (state: S, value: S[K]) => Partial<S>;
};

/** The functions a screen is written with, for a state of type `S`. */
export type Builder<S> = {
  /** `ui.Button({ variant: "primary" }, "Save")`: a component of the library. */
  readonly ui: {
    readonly [N in ComponentName]: (
      props: PropsOf<N, S>,
      ...children: ChildrenOf<N, S>
    ) => PreviewNode<S>;
  };
  /** `el("div", { class: "flex gap-2" }, …)`: a plain element. */
  readonly el: (
    tag: keyof HTMLElementTagNameMap,
    props: ElementProps<S>,
    ...children: readonly Child<S>[]
  ) => PreviewNode<S>;
  /** `children` while `when` holds, `fallback` otherwise. */
  readonly show: (
    when: (state: S) => boolean,
    children: Slot<S>,
    fallback?: Slot<S>,
  ) => PreviewNode<S>;
  /**
   * A controlled prop and its `onChange`, both on one state slot: `bind("email")` for a field's
   * `value`, `bind("notifications", "checked")` for a switch.
   */
  readonly bind: {
    <K extends keyof S & string>(key: K): Bound<S, K, "value">;
    <K extends keyof S & string, P extends Controlled>(key: K, prop: P): Bound<S, K, P>;
  };
  /**
   * A screen: the first value of each state slot, what it draws, and what runs once it is on
   * the page.
   */
  readonly screen: (state: S, root: Slot<S>, mount?: () => (() => void) | undefined) => Screen;
};

/**
 * The functions to write a screen with. The state's type is given once here, so every function
 * of the state and every callback in the screen is checked against it.
 */
export function builder<S extends object>(): Builder<S> {
  // The data is typed for its own state; renderers read it as any state.
  const erase = <T>(value: unknown) => value as T;
  return {
    // One function for every name, so that the list of components is written only once, in
    // Components; the type of `ui` admits only those names.
    ui: new Proxy({} as Builder<S>["ui"], {
      get:
        (_, name) =>
        (props: Props, ...children: Child<S>[]): PreviewNode => ({
          [NODE]: true,
          kind: "component",
          name: name as ComponentName,
          props,
          children: erase(children),
        }),
    }),
    el: (tag, props, ...children) => ({
      [NODE]: true,
      kind: "element",
      tag,
      props: erase(props),
      children: erase(children),
    }),
    show: (when, children, fallback) => ({
      [NODE]: true,
      kind: "show",
      when: erase(when),
      children: erase(children),
      fallback: erase(fallback),
    }),
    bind: erase((key: keyof S & string, prop = "value") => ({
      [prop]: (state: S) => state[key],
      onChange: (_: S, value: unknown) => ({ [key]: value }),
    })),
    screen: (state, root, mount) => ({ state: erase(state), root: erase(root), mount }),
  };
}

// ---------------------------------------------------------------- for renderers

export function isNode(value: unknown): value is PreviewNode {
  return typeof value === "object" && value !== null && NODE in value;
}

/** Whether a prop of this name is a callback: `onPress`, `onChange`, `onSelect`. */
export const isCallback = (key: string) => /^on[A-Z]/.test(key);

const isRecord = (value: unknown): value is Props =>
  typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** What a renderer gives `resolve`: the state, a way to change it, and a way to draw a slot. */
export type Host<N> = {
  readonly state: State;
  readonly set: (patch: Partial<State>) => void;
  readonly draw: (slot: Slot<State> | undefined) => N;
};

/**
 * Calls an On with the state, and changes the slots it returns. A slot the state does not have
 * is a mistake in the data that the type of a returned object cannot always catch, so it throws
 * here, the same in every renderer, rather than being dropped by one and kept by another.
 */
function callback(on: On<State, unknown[]>, host: Host<unknown>) {
  return (...args: unknown[]) => {
    const patch = on(host.state, ...args);
    if (!patch) return;
    for (const slot of Object.keys(patch)) {
      if (!(slot in host.state)) throw new Error(`The screen has no state slot "${slot}".`);
    }
    host.set(patch);
  };
}

/**
 * The value a component gets for a prop of the data: a function of the state is called with
 * it, and what it returns is resolved in turn; a callback is bound to the state; and a node,
 * or a list with a node in it, is drawn. A value with none of these inside is returned as it
 * is, so a list of options keeps its identity from one draw to the next.
 */
export function resolve(value: unknown, key: string, host: Host<unknown>): unknown {
  if (typeof value === "function") {
    return isCallback(key)
      ? callback(value as On<State, unknown[]>, host)
      : resolve((value as (state: State) => unknown)(host.state), key, host);
  }
  if (isNode(value)) return host.draw(value);
  if (Array.isArray(value)) {
    if (value.some(isNode)) return host.draw(value as Slot<State>);
    const items = value.map((item) => resolve(item, "", host));
    return items.every((item, index) => item === value[index]) ? value : items;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).map(([name, item]) => [name, resolve(item, name, host)]);
    return entries.every(([name, item]) => item === value[name as string])
      ? value
      : Object.fromEntries(entries);
  }
  return value;
}

/**
 * Whether a prop reads nothing from the state and draws nothing. A renderer that updates in
 * place resolves such a prop once; any other it resolves again on each read, as the framework
 * does for a prop written inline.
 */
export function isStatic(value: unknown, key = ""): boolean {
  if (typeof value === "function") return isCallback(key);
  if (isNode(value)) return false;
  if (Array.isArray(value)) return value.every((item) => isStatic(item));
  if (isRecord(value)) return Object.entries(value).every(([name, item]) => isStatic(item, name));
  return true;
}
