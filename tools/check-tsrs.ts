// tsrs type-checks and lints on the command line, and the typescript package is the version
// editors are pointed at. tsrs is built from one TypeScript commit, so when the two are different
// versions the terminal and the editor can report different errors. pnpm cannot hold them
// together, because tsrs does not depend on typescript, so this fails as soon as one of them
// moves without the other.
import { typescriptVersion, version } from "tsrs";
import typescript from "typescript/package.json" with { type: "json" };

if (typescriptVersion !== typescript.version) {
  console.error(
    `tsrs ${version} ports TypeScript ${typescriptVersion}, but typescript is ${typescript.version}.\n` +
      "Move both in the catalog in pnpm-workspace.yaml: typescript to a version, and tsrs to the " +
      "release that ports that version (`pnpm view tsrs@<release> tsrs.typescriptVersion` shows " +
      "the version a release ports).",
  );
  process.exit(1);
}
