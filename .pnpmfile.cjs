// svelte-check reads the Svelte files with TypeScript's JavaScript API, which TypeScript 7 does
// not have, and type-checks them with TypeScript 7 (--tsgo-experimental-api). So it gets a
// TypeScript 6 of its own here, and every package of the workspace keeps TypeScript 7. Remove
// this file once svelte-check runs on TypeScript 7 alone (sveltejs/language-tools#3193, #3196).
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === "svelte-check") {
        delete pkg.peerDependencies.typescript;
        pkg.dependencies.typescript = "6.0.3";
      }
      return pkg;
    },
  },
};
