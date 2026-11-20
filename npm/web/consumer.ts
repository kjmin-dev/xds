// The web library's external consumer check: what must pass before the web packages join a
// release (docs/library.md, L1).
//
//   node npm/web/consumer.ts [--frameworks react,solid,vue,svelte] [--skip-build]
//
// For each framework it packs the packages built by build.ts, installs them with npm into a new
// app outside this repository, with Vite and the framework's own Vite plugin and nothing of
// xds's tooling (no Tailwind CSS, no token build), and draws the design preview there from the
// package's `./preview`, once with the finished stylesheet and once in an app with Tailwind CSS
// of its own, which takes the unbuilt one. It then compares each page, pixel by pixel in the Google Chrome
// installed on the machine, with the same framework's app in a project that `xds create` makes
// from this repository under the name `xds`, as the published packages are named: every section
// and every overlay, at a desktop and a phone width, in both color modes. Once with the default
// theme, and once with a custom theme (consumer/brand.json), which the library app applies with
// the stylesheet `xds export-theme` writes, and the scaffolded app with its token build.
//
// `--xds <binary>` names the CLI to scaffold with; by default it is built from this repository.

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import type * as Vite from "vite";
import type { InlineConfig, ViteDevServer } from "vite";
import {
  capture,
  compareCaptures,
  THEMES,
  type Tolerance,
  WIDTHS,
} from "../../packages/ui-core/scripts/preview-capture.ts";
import { emitCss, emitThemeCss } from "../../tools/design-build/src/emit.ts";
import { readContract, themeModel } from "../../tools/design-build/src/theme-contract.ts";
import type { Framework } from "./build.ts";

const root = resolve(import.meta.dirname, "../..");
const here = import.meta.dirname;
const { values: options } = parseArgs({
  options: {
    frameworks: { type: "string", default: "react,solid,vue,svelte" },
    "skip-build": { type: "boolean", default: false },
    xds: { type: "string" },
  },
});
const frameworks = options.frameworks.split(",") as Framework[];
const dist = join(root, "npm/dist/web");
const work = join(tmpdir(), "xds-consumer");
const out = join(tmpdir(), "xds-consumer-compare");

/**
 * A few pixels at the edge of a rounded control are drawn a shade apart from one page to the
 * other with no style of theirs different. Anything more is a difference: a color off by more,
 * or a shade off across a larger area, as a rounded color would be.
 */
const TOLERANCE: Tolerance = { delta: 8, pixels: 16 };

/** The scaffolded app each framework's package is compared with, and its target. */
const SCAFFOLDED: Record<Framework, { dir: string; target: string }> = {
  react: { dir: "apps/web", target: "web-react" },
  solid: { dir: "apps/web-solid", target: "web-solid" },
  vue: { dir: "apps/web-vue", target: "web-vue" },
  svelte: { dir: "apps/web-svelte", target: "web-svelte" },
};

/** What an app of each framework installs beside the package, from this repository's catalog. */
async function frameworkPackages(framework: Framework) {
  const catalog = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  const pin = (name: string) => {
    const match = catalog.match(new RegExp(`^\\s+"?${name.replace("/", "\\/")}"?:\\s*(\\S+)`, "m"));
    if (!match?.[1]) throw new Error(`the catalog has no ${name}`);
    return match[1];
  };
  const app = JSON.parse(
    await readFile(join(root, SCAFFOLDED[framework].dir, "package.json"), "utf8"),
  ) as {
    devDependencies: Record<string, string>;
  };
  const vite = app.devDependencies.vite ?? "^8.3.8";
  switch (framework) {
    case "react":
      return {
        dependencies: { react: pin("react"), "react-dom": pin("react-dom") },
        devDependencies: {
          vite,
          "@vitejs/plugin-react": app.devDependencies["@vitejs/plugin-react"] ?? "",
        },
        overrides: {},
      };
    case "solid":
      return {
        dependencies: { "solid-js": pin("solid-js"), "@solidjs/web": pin("@solidjs/web") },
        devDependencies: { vite, "@solidjs/vite-plugin": pin("@solidjs/vite-plugin") },
        // As in pnpm-workspace.yaml: Solid 2's prerelease packages must be the same version.
        overrides: { "@solidjs/compiler": pin("solid-js"), "@solidjs/signals": pin("solid-js") },
      };
    case "vue":
      return {
        dependencies: { vue: pin("vue") },
        devDependencies: {
          vite,
          "@vitejs/plugin-vue": catalog.match(/"@vitejs\/plugin-vue":\s*(\S+)/)?.[1] ?? "",
        },
        overrides: {},
      };
    case "svelte":
      return {
        dependencies: { svelte: pin("svelte") },
        devDependencies: {
          vite,
          "@sveltejs/vite-plugin-svelte": pin("@sveltejs/vite-plugin-svelte"),
        },
        overrides: {},
      };
  }
}

/** The app's entry, which draws the design preview at `/design`. */
const MAIN: Record<Framework, [file: string, source: string]> = {
  react: [
    "main.jsx",
    `import { createRoot } from "react-dom/client";
import { designPreview, Preview } from "@xds/react/preview";
import "./styles.js";

createRoot(document.getElementById("root")).render(<Preview screen={designPreview()} />);
`,
  ],
  solid: [
    "main.jsx",
    `import { render } from "@solidjs/web";
import { designPreview, Preview } from "@xds/solid/preview";
import "./styles.js";

render(() => <Preview screen={designPreview()} />, document.getElementById("root"));
`,
  ],
  vue: [
    "main.js",
    `import { createApp, h } from "vue";
import { designPreview, Preview } from "@xds/vue/preview";
import "./styles.js";

createApp({ render: () => h(Preview, { screen: designPreview() }) }).mount("#root");
`,
  ],
  svelte: [
    "main.js",
    `import { mount } from "svelte";
import { designPreview, Preview } from "@xds/svelte/preview";
import "./styles.js";

mount(Preview, { target: document.getElementById("root"), props: { screen: designPreview() } });
`,
  ],
};

const VITE_CONFIG: Record<Framework, string> = {
  react: `import react from "@vitejs/plugin-react";\nexport default { plugins: [react()] };\n`,
  solid: `import solid from "@solidjs/vite-plugin";\nexport default { plugins: [solid()] };\n`,
  vue: `import vue from "@vitejs/plugin-vue";\nexport default { plugins: [vue()] };\n`,
  svelte: `import { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default { plugins: [svelte()] };\n`,
};

/** A page that sets the color mode as the scaffolded apps do, and the theme the same way. */
const INDEX = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>xds consumer</title>
    <script>
      const query = new URLSearchParams(location.search);
      document.documentElement.dataset.theme =
        query.get("theme") ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      if (query.get("xds-theme")) document.documentElement.dataset.xdsTheme = query.get("xds-theme");
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/MAIN"></script>
  </body>
</html>
`;

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, { cwd, stdio: ["ignore", "inherit", "inherit"] });
}

/** Packs each built package, as npm would publish it. */
async function pack(): Promise<Record<string, string>> {
  const tarballs: Record<string, string> = {};
  const destination = join(work, "tarballs");
  await mkdir(destination, { recursive: true });
  for (const key of ["tokens", "core", "react", "solid", "vue", "svelte"]) {
    const output = execFileSync(
      "npm",
      ["pack", join(dist, key), "--pack-destination", destination, "--json"],
      { encoding: "utf8" },
    );
    const [packed] = JSON.parse(output) as { name: string; filename: string }[];
    if (!packed) throw new Error(`npm pack ${key} printed nothing`);
    tarballs[packed.name] = join(destination, packed.filename);
  }
  return tarballs;
}

/**
 * A new app with nothing but the framework, Vite and the packed packages, which takes the
 * finished stylesheet. With `tailwind`, an app with Tailwind CSS of its own instead, which takes
 * the unbuilt one.
 */
async function consumerApp(
  framework: Framework,
  tarballs: Record<string, string>,
  brand: string,
  tailwind: boolean,
) {
  const dir = join(work, tailwind ? `${framework}-tailwind` : framework);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, "src"), { recursive: true });
  const { dependencies, devDependencies, overrides } = await frameworkPackages(framework);
  if (tailwind) {
    const scaffolded = JSON.parse(
      await readFile(join(root, SCAFFOLDED[framework].dir, "package.json"), "utf8"),
    ) as { devDependencies: Record<string, string> };
    for (const name of ["tailwindcss", "@tailwindcss/vite"]) {
      const version = scaffolded.devDependencies[name];
      if (!version) throw new Error(`${SCAFFOLDED[framework].dir} has no ${name}`);
      Object.assign(devDependencies, { [name]: version });
    }
  }
  const own = (name: string) => `file:${tarballs[name]}`;
  // The packages depend on each other by version, which no registry has yet: npm takes the packed
  // ones instead.
  const library = {
    "@xds/core": own("@xds/core"),
    "@xds/tokens": own("@xds/tokens"),
  };
  await writeFile(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: `xds-consumer-${framework}`,
        private: true,
        type: "module",
        dependencies: {
          ...dependencies,
          [`@xds/${framework}`]: own(`@xds/${framework}`),
          ...library,
        },
        devDependencies,
        overrides: { ...overrides, ...library },
      },
      null,
      2,
    )}\n`,
  );
  const [main, source] = MAIN[framework];
  await writeFile(join(dir, "index.html"), INDEX.replace("MAIN", main));
  await writeFile(join(dir, "src", main), source);
  await writeFile(
    join(dir, "src/styles.js"),
    (tailwind
      ? ['import "./app.css";']
      : [`import "@xds/${framework}/styles.css";`, `import "@xds/${framework}/page.css";`]
    )
      .concat(['import "./brand.css";', ""])
      .join("\n"),
  );
  if (tailwind) {
    await writeFile(
      join(dir, "src/app.css"),
      [
        `@import "@xds/${framework}/tailwind.css";`,
        '@import "tailwindcss";',
        `@import "@xds/${framework}/page.css";`,
        "",
      ].join("\n"),
    );
  }
  await writeFile(join(dir, "src/brand.css"), brand);
  await writeFile(
    join(dir, "vite.config.js"),
    tailwind
      ? VITE_CONFIG[framework]
          .replace(
            "export default {",
            'import tailwindcss from "@tailwindcss/vite";\nexport default {',
          )
          .replace("()] };", "(), tailwindcss()] };")
      : VITE_CONFIG[framework],
  );
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], dir);
  return dir;
}

async function listen(server: ViteDevServer, servers: ViteDevServer[]) {
  servers.push(await server.listen());
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("a dev server has no port");
  return `http://localhost:${address.port}`;
}

if (!options["skip-build"]) run("node", [join(here, "build.ts")], root);
await rm(work, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await mkdir(work, { recursive: true });

// The custom theme: for the library, the stylesheet `xds export-theme` writes outside a
// project; for the scaffolded app, the token file its build writes for the same theme.
const themeFile = join(here, "consumer/brand.json");
const contract = await readContract(root);
const model = await themeModel(root, JSON.parse(await readFile(themeFile, "utf8")), contract);
const brand = emitThemeCss(model, {
  name: "brand",
  source: "brand.json",
  prefix: "xds",
  layer: "xds.theme",
});
const scaffoldTheme = join(work, "brand-theme.css");
// What the scaffold's token build writes for the theme, under the scaffold's name.
await writeFile(scaffoldTheme, emitCss(model).replaceAll("acme", "xds"));

// The scaffolded apps, named as the packages are.
let xds = options.xds;
if (!xds) {
  run("cargo", ["build", "--quiet", "--package", "xds"], root);
  xds = join(root, "target/debug/xds");
}
const scaffold = join(work, "scaffold");
const targets = frameworks.map((framework) => SCAFFOLDED[framework].target).join(",");
run(xds, ["create", scaffold, "--name", "xds", "--targets", targets, "--yes"], work);
run("pnpm", ["install", "--silent"], scaffold);

/** A dev server of the project's own Vite, as `pnpm dev` in the app would start it. */
async function devServer(dir: string, config: InlineConfig = {}) {
  const vite = (await import(
    pathToFileURL(createRequire(join(dir, "package.json")).resolve("vite")).href
  )) as typeof Vite;
  return vite.createServer({ root: dir, server: { port: 0 }, logLevel: "error", ...config });
}

const tarballs = await pack();
const servers: ViteDevServer[] = [];
const browser = await chromium.launch({ channel: "chrome" });
let differences = 0;
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const compare = await browser.newPage();
  for (const framework of frameworks) {
    const finished = await listen(
      await devServer(await consumerApp(framework, tarballs, brand, false)),
      servers,
    );
    const unbuilt = await listen(
      await devServer(await consumerApp(framework, tarballs, brand, true)),
      servers,
    );
    const app = join(scaffold, SCAFFOLDED[framework].dir);
    const scaffolded = await listen(await devServer(app), servers);
    const branded = await listen(
      await devServer(app, { resolve: { alias: { "@xds/tokens/theme.css": scaffoldTheme } } }),
      servers,
    );
    for (const [label, library, reference, query] of [
      ["default theme", finished, scaffolded, ""],
      ["custom theme", finished, branded, "&xds-theme=brand"],
      ["with Tailwind", unbuilt, scaffolded, ""],
      ["with Tailwind, custom theme", unbuilt, branded, "&xds-theme=brand"],
    ] as const) {
      for (const width of WIDTHS) {
        for (const theme of THEMES) {
          const both = async (tab = page) =>
            [
              { name: "scaffold", shots: await capture(tab, reference, width, theme) },
              { name: "library", shots: await capture(tab, library, width, theme, query) },
            ] as const;
          const where = join(out, framework, label.replaceAll(/\W+/g, "-"), `${width}-${theme}`);
          const title = `${framework}, ${label}, ${width} ${theme}:`;
          let [first, other] = await both();
          // A picture may decode, or a frame rasterize, a moment later in one capture than in
          // the other, which changes a few pixels at an edge. A real difference is drawn again.
          if ((await compareCaptures(compare, first, other, where, title, true, TOLERANCE)) > 0) {
            const tab = await browser.newPage({ deviceScaleFactor: 1 });
            [first, other] = await both(tab);
            await tab.close();
            differences += await compareCaptures(
              compare,
              first,
              other,
              where,
              title,
              false,
              TOLERANCE,
            );
          }
        }
      }
    }
    await Promise.all(servers.splice(0).map((server) => server.close()));
    console.log(`${framework}: compared`);
  }
} finally {
  await browser.close();
  await Promise.all(servers.map((server) => server.close()));
}
console.log(
  differences === 0
    ? `The packages of ${frameworks.join(", ")} draw the design preview as the scaffolded apps do, with either stylesheet, with the default theme and a custom one.`
    : `${differences} captures differ. Both sides of each are in ${out}.`,
);
process.exitCode = differences === 0 ? 0 : 1;
