// Which clients have each component, and where they differ, as the pages say it. It is read
// from template.json (the clients, and the input each is designed for) and
// design/components.json (the contract the CLI and the MCP server read), so a page cannot claim
// a client the contract does not list, and a new target gets its column without an edit here.
//
// `generate.ts` loads it and writes the result next to the pages, for the Astro components and
// the Markdown copies, which turn it into chips, the index's table, and plain sentences.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Input = "pointer" | "touch";

export type Client = {
  id: string;
  /** The library's short name, as the pages use it: React, GPUI, Compose. */
  name: string;
  /** Where it runs, from template.json: Web; iOS, Android. */
  platforms: string[];
  input: Input;
};

export type Difference = {
  /** The clients it is about; or, with `input`, every client designed for that input. */
  clients?: string[];
  input?: Input;
  /** The option it is about, and one of its values; neither when it is the whole component. */
  option?: string;
  value?: string;
  /** only: just these clients have it. system: their platform draws it. adapts: it changes with the input. */
  kind: "only" | "system" | "adapts";
  /** Not built yet. */
  status?: "planned";
  note: string;
};

export type Availability = {
  name: string;
  slug: string;
  /** Ids of the clients that have it, in the order of template.json. */
  clients: string[];
  sources: Record<string, string>;
  differences: Difference[];
};

export type Platforms = { clients: Client[]; components: Availability[] };

// template.json names a target by its stack ("React 19, Vite, …"); the pages need one word.
const NAMES: Record<string, string> = {
  "web-react": "React",
  "web-solid": "Solid",
  "web-vue": "Vue",
  "web-svelte": "Svelte",
  "desktop-gpui": "GPUI",
  "mobile-react-native": "React Native",
  "kotlin-compose": "Compose",
};

const KINDS = ["only", "system", "adapts"];

/** Reads the clients and the contract. `slugs` gives each component's page. */
export async function loadPlatforms(root: string, slugs: Map<string, string>): Promise<Platforms> {
  const manifest = JSON.parse(await readFile(join(root, "template.json"), "utf8")) as {
    targets: { id: string; platforms: string[]; input: Input }[];
  };
  const clients = manifest.targets.map(({ id, platforms, input }) => {
    const name = NAMES[id];
    if (!name) throw new Error(`apps/docs/scripts/platforms.ts: give the target ${id} a name`);
    return { id, name, platforms, input };
  });
  const contract = JSON.parse(await readFile(join(root, "design/components.json"), "utf8")) as {
    components: {
      name: string;
      clients: Record<string, { source: string }>;
      differences?: Difference[];
    }[];
  };
  const components = contract.components.map((component) => {
    const slug = slugs.get(component.name);
    if (!slug) throw new Error(`${component.name} has no page in scripts/components.ts`);
    // `cargo test --package xds` checks the entries in full; this catches what would make a
    // page wrong rather than fail.
    for (const difference of component.differences ?? []) {
      const ids = difference.clients ?? [];
      const unknown = ids.filter((id) => !(id in component.clients));
      if (unknown.length > 0) {
        throw new Error(`${component.name}: a difference names ${unknown.join(", ")}`);
      }
      if (!KINDS.includes(difference.kind)) {
        throw new Error(`${component.name}: a difference has the kind "${difference.kind}"`);
      }
      if (ids.length === 0 && !difference.input) {
        throw new Error(`${component.name}: a difference names neither clients nor an input`);
      }
    }
    return {
      name: component.name,
      slug,
      clients: clients.filter(({ id }) => id in component.clients).map(({ id }) => id),
      sources: Object.fromEntries(
        Object.entries(component.clients).map(([id, client]) => [id, client.source]),
      ),
      differences: component.differences ?? [],
    };
  });
  for (const name of slugs.keys()) {
    if (!components.some((component) => component.name === name)) {
      throw new Error(`${name} is not in design/components.json`);
    }
  }
  return { clients, components };
}

// ---------------------------------------------------------------- words

const list = (names: string[]) =>
  names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/** Whether a difference is about this client. Planned ones change nothing yet. */
export const appliesTo = (difference: Difference, client: Client) =>
  difference.clients ? difference.clients.includes(client.id) : difference.input === client.input;

/** How a client has a component: as everywhere, with a difference, or not at all. */
export function state(
  component: Availability,
  client: Client,
): "available" | "differs" | "missing" {
  if (!component.clients.includes(client.id)) return "missing";
  const differs = component.differences.some(
    (difference) => !difference.status && appliesTo(difference, client),
  );
  return differs ? "differs" : "available";
}

/** "Every client", "Touch clients only", "Pointer clients only", or the clients by name. */
export function reach(
  platforms: Platforms,
  component: Availability,
): { label: string; badge?: string } {
  const on = platforms.clients.filter((client) => component.clients.includes(client.id));
  const off = platforms.clients.filter((client) => !component.clients.includes(client.id));
  if (off.length === 0) return { label: "Every client" };
  for (const input of ["touch", "pointer"] as const) {
    if (on.every((client) => client.input === input) && off.every((c) => c.input !== input)) {
      const word = input === "touch" ? "Touch" : "Pointer";
      return { label: `${word} clients only`, badge: word };
    }
  }
  return { label: `Only on ${list(on.map((client) => client.name))}` };
}

/** "Touch clients (React Native and Compose)", or the clients a difference names. */
function who(platforms: Platforms, difference: Difference): string {
  const names = platforms.clients
    .filter((client) => appliesTo(difference, client))
    .map((client) => client.name);
  if (difference.clients) return list(names);
  const word = difference.input === "touch" ? "Touch" : "Pointer";
  return `${word} clients (${list(names)})`;
}

function kind(platforms: Platforms, difference: Difference): string {
  switch (difference.kind) {
    case "only":
      return "Only on some clients";
    case "system":
      return "Drawn by the system";
    case "adapts": {
      const inputs = new Set(
        platforms.clients
          .filter((client) => appliesTo(difference, client))
          .map((client) => client.input),
      );
      const [input] = inputs;
      return inputs.size === 1 ? `Adapts to ${input}` : "Adapts to the client";
    }
  }
}

/**
 * A label in a pill. The period after it is not shown: it is there for screen readers and for
 * llms.txt, which would otherwise run the pill into the text after it. The Markdown copy of a
 * page unwraps the pill and writes its own punctuation.
 */
const pill = (text: string, data: string, kind = "pill") =>
  `<span class="${kind}" ${data}>${text}<span class="sr-only">.</span></span>`;

/** The line of a page's Platforms section that says which clients have the component. */
export function clientsSentence(platforms: Platforms, component: Availability): string {
  const names = (ids: (client: Client) => boolean) =>
    list(platforms.clients.filter(ids).map((client) => client.name));
  const has = (client: Client) => component.clients.includes(client.id);
  const { label } = reach(platforms, component);
  if (label === "Every client") return `**Clients:** every client: ${names(has)}.`;
  const why = label.startsWith("Only on") ? "" : ` (${label.toLowerCase()})`;
  return `**Clients:** ${names(has)}${why}. Not on ${names((client) => !has(client))}.`;
}

/** The Platforms section of a component page, in Markdown that reads the same as text. */
export function platformsSection(platforms: Platforms, component: Availability): string {
  const parts = ["## Platforms", clientsSentence(platforms, component)];
  if (component.differences.length > 0) {
    const options = component.differences.some((difference) => difference.option);
    const rows = component.differences.map((difference) => {
      const label = pill(
        `${kind(platforms, difference)}${difference.status ? ", planned" : ""}`,
        `data-kind="${difference.kind}"${difference.status ? ` data-status="${difference.status}"` : ""}`,
      );
      const option = difference.option
        ? `\`${difference.option}${difference.value ? `="${difference.value}"` : ""}\``
        : "The whole component";
      return [
        label,
        ...(options ? [option] : []),
        who(platforms, difference),
        difference.note.replaceAll("|", "\\|"),
      ];
    });
    const header = ["Difference", ...(options ? ["Option"] : []), "Where", "What changes"];
    parts.push(
      [
        `| ${header.join(" | ")} |`,
        `| ${header.map(() => "---").join(" | ")} |`,
        ...rows.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n"),
    );
  }
  parts.push("The [components index](/components/) shows every component against every client.");
  return parts.join("\n\n");
}

/** The pill in front of an option that only some clients have, or nothing. */
export function optionPill(platforms: Platforms, component: Availability, option: string): string {
  const only = component.differences.filter(
    (difference) => difference.kind === "only" && difference.option === option,
  );
  return only
    .map((difference) => {
      const value = difference.value ? `\`${difference.value}\`: ` : "";
      const planned = difference.status ? ", planned" : "";
      const text = `${value}${who(platforms, difference)} only${planned}`;
      const data = `data-kind="only"${difference.status ? ` data-status="${difference.status}"` : ""}`;
      return `${pill(text, data, "pill pill--option")} `;
    })
    .join("");
}

/** The index's table as Markdown, for the Markdown copy of the page. */
export function matrixMarkdown(platforms: Platforms): string {
  const words = { available: "Yes", differs: "Yes, differs", missing: "No" };
  const header = ["Component", ...platforms.clients.map((client) => client.name)];
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...platforms.components.map(
      (component) =>
        `| [${component.name}](/components/${component.slug}/) | ${platforms.clients
          .map((client) => words[state(component, client)])
          .join(" | ")} |`,
    ),
  ].join("\n");
}
