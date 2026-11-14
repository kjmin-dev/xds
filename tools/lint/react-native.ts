// An oxlint JS plugin for the React Native code. React Native throws at runtime when a string is
// rendered outside a <Text>, and the type checker cannot see it: a JSX child is any ReactNode.
// It is written here rather than taken from eslint-plugin-react-native, whose peer dependency
// would install ESLint itself.

type Node = {
  type: string;
  parent?: Node;
  value?: unknown;
  name?: Node | string;
  object?: Node;
  property?: Node;
  openingElement?: Node;
};

type Context = {
  options: unknown[];
  report(descriptor: { node: Node; message: string }): void;
};

/** `Text`, `Animated.Text`: the name of a JSX element as written. */
function elementName(element: Node): string {
  const parts: string[] = [];
  let name = element.openingElement?.name;
  while (typeof name === "object" && name.type === "JSXMemberExpression") {
    if (typeof name.property?.name === "string") parts.unshift(name.property.name);
    name = name.object;
  }
  if (typeof name === "object" && typeof name.name === "string") parts.unshift(name.name);
  return parts.join(".");
}

function insideText(node: Node, allowed: readonly string[]): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "JSXElement" && allowed.includes(elementName(current))) return true;
  }
  return false;
}

const noRawText = {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { skip: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
  },
  create(context: Context) {
    const options = (context.options[0] ?? {}) as { skip?: string[] };
    const allowed = ["Text", "Animated.Text", ...(options.skip ?? [])];
    const check = (node: Node, text: string) => {
      // Indentation between elements is not rendered.
      if (text.trim() === "" && /[\n\r]/.test(text)) return;
      if (insideText(node, allowed)) return;
      context.report({
        node,
        message: `Raw text (${text.trim() || "whitespace"}) must be inside a <Text>.`,
      });
    };
    const isChild = (node: Node) =>
      node.parent?.type === "JSXExpressionContainer" && node.parent.parent?.type !== "JSXAttribute";
    return {
      JSXText(node: Node) {
        check(node, String(node.value));
      },
      Literal(node: Node) {
        if (typeof node.value === "string" && isChild(node)) check(node, node.value);
      },
      TemplateLiteral(node: Node) {
        if (isChild(node)) check(node, "template literal");
      },
    };
  },
};

export default {
  meta: { name: "react-native" },
  rules: { "no-raw-text": noRawText },
};
