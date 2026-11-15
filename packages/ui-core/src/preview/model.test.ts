import assert from "node:assert/strict";
import { test } from "node:test";
import { builder, type Host, isCallback, isNode, isStatic, resolve, type State } from "./model.ts";

type S = { chosen: string; liked: boolean; email: string };
const { ui, bind } = builder<S>();

/** A host that records what is written and draws a component node as its name. */
function host(state: State = { chosen: "", liked: false, email: "ada@example.com" }) {
  const writes: Partial<State>[] = [];
  const draw = (slot: unknown): unknown =>
    Array.isArray(slot)
      ? slot.map(draw)
      : isNode(slot) && slot.kind === "component"
        ? `<${slot.name}>`
        : slot;
  const drawn: Host<unknown> = { state, set: (patch) => writes.push(patch), draw };
  return { host: drawn, writes };
}

/** The props of a component node, as a renderer reads them. */
const props = (node: unknown) => {
  assert.ok(isNode(node) && node.kind === "component");
  return node.props;
};

test("a prop that follows the state is called with it", () => {
  const { host: h } = host();
  const { selected } = props(ui.Button({ selected: (state) => !state.liked }, "Like"));
  assert.equal(resolve(selected, "selected", h), true);
});

test("a callback writes the slots it returns, and nothing when it returns nothing", () => {
  const { host: h, writes } = host();
  const { onPress } = props(ui.Button({ onPress: (state) => ({ liked: !state.liked }) }, "Like"));
  (resolve(onPress, "onPress", h) as () => void)();
  assert.deepEqual(writes, [{ liked: true }]);
  const keep = props(ui.Button({ onPress: () => undefined }, "Keep")).onPress;
  (resolve(keep, "onPress", h) as () => void)();
  assert.equal(writes.length, 1);
});

test("a callback that returns a slot the state does not have throws", () => {
  const { host: h, writes } = host();
  // The type of a returned object lets an unknown key through beside a known one.
  const { onPress } = props(ui.Button({ onPress: () => ({ liked: true, likd: true }) }, "Like"));
  assert.throws(() => (resolve(onPress, "onPress", h) as () => void)(), /"likd"/);
  assert.equal(writes.length, 0);
});

test("what a function of the state returns is resolved in turn", () => {
  const { host: h, writes } = host();
  const { items } = props(
    ui.Menu({
      label: "Actions",
      trigger: ui.Button({}, "Actions"),
      items: (state) => [{ label: state.email, onSelect: () => ({ chosen: "Rename" }) }],
    }),
  );
  const [item] = resolve(items, "items", h) as { label: string; onSelect: () => void }[];
  assert.equal(item?.label, "ada@example.com");
  item?.onSelect();
  assert.deepEqual(writes, [{ chosen: "Rename" }]);
});

test("a node, or a list with one in it, is drawn", () => {
  const { host: h } = host();
  const { trailing } = props(
    ui.TextField({ label: "Search", ...bind("email"), trailing: ui.Icon({ name: "search" }) }),
  );
  assert.equal(resolve(trailing, "trailing", h), "<Icon>");
  const dialog = props(
    ui.Dialog({
      open: true,
      onClose: () => undefined,
      title: "Delete?",
      actions: [ui.Button({}, "Cancel"), ui.Button({ variant: "danger" }, "Delete")],
    }),
  );
  assert.deepEqual(resolve(dialog.actions, "actions", h), ["<Button>", "<Button>"]);
});

test("a value with nothing to resolve inside keeps its identity", () => {
  const { host: h } = host();
  const options = [
    { value: "free", label: "Free" },
    { value: "team", label: "Team" },
  ];
  assert.equal(resolve(options, "options", h), options);
  const action = { label: "Undo", onPress: () => undefined };
  assert.notEqual(resolve(action, "action", h), action);
});

test("bind gives a controlled prop and its onChange on one slot", () => {
  const { host: h, writes } = host();
  const { value, onChange } = props(ui.TextField({ label: "Email", ...bind("email") }));
  assert.equal(resolve(value, "value", h), "ada@example.com");
  (resolve(onChange, "onChange", h) as (value: string) => void)("grace@example.com");
  assert.deepEqual(writes, [{ email: "grace@example.com" }]);
});

test("a prop is static when it reads no state and draws nothing", () => {
  assert.equal(isStatic("primary"), true);
  assert.equal(isStatic([{ value: "free", label: "Free" }]), true);
  assert.equal(
    isStatic(() => undefined, "onPress"),
    true,
  );
  assert.equal(isStatic({ label: "Undo", onPress: () => undefined }), true);
  assert.equal(
    isStatic((state: S) => state.liked, "selected"),
    false,
  );
  assert.equal(isStatic(ui.Icon({ name: "search" })), false);
  assert.equal(isStatic([ui.Button({}, "Cancel")]), false);
  assert.equal(isStatic({ label: (state: S) => state.email, onPress: () => undefined }), false);
});

test("a callback is a prop named `on` and a capital", () => {
  assert.equal(isCallback("onPress"), true);
  assert.equal(isCallback("onChange"), true);
  assert.equal(isCallback("one"), false);
  assert.equal(isCallback("only"), false);
});
