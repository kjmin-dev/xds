// tsrs type-checks and lints on the command line, and the typescript package is the version
// editors are pointed at. tsrs is built from one TypeScript commit, so when the two are different
// versions the terminal and the editor can report different errors. pnpm cannot hold them
// together, because tsrs does not depend on typescript, so this fails as soon as one of them
// moves without the other.
// @if web-svelte
import { createRequire } from "node:module";
// @endif
import { typescriptVersion, version } from "tsrs";
import typescript from "typescript/package.json" with { type: "json" };

let failed = false;

if (typescriptVersion !== typescript.version) {
  console.error(
    `tsrs ${version} ports TypeScript ${typescriptVersion}, but typescript is ${typescript.version}.\n` +
      "Move both in the catalog in pnpm-workspace.yaml: typescript to a version, and tsrs to the " +
      "release that ports that version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows " +
      "the version a release ports).",
  );
  failed = true;
}

// @if web-svelte
// svelte-check type-checks the Svelte packages with the TypeScript 7 it finds as
// @typescript/native, an alias that pnpm does not hold to typescript's version either. It looks
// from the package first and then from its own install, where pnpm's hoisted copy would hide a
// package that lost its own, so this reads the one each package resolves.
for (const dir of ["packages/ui-svelte", "apps/web-svelte"]) {
  const load = createRequire(new URL(`../${dir}/package.json`, import.meta.url));
  let native: string | undefined;
  try {
    native = (load("@typescript/native/package.json") as { version: string }).version;
  } catch {
    native = undefined;
  }
  if (native !== typescript.version) {
    console.error(
      `${dir} has @typescript/native ${native ?? "missing"}, but typescript is ${typescript.version}.\n` +
        `Give ${dir} the devDependency "@typescript/native": "catalog:", and move ` +
        "@typescript/native in the catalog in pnpm-workspace.yaml to the same version as typescript.",
    );
    failed = true;
  }
}
// @endif

if (failed) process.exit(1);
