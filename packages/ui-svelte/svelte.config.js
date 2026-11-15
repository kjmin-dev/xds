// Runes only: a component written in Svelte 4's syntax is an error rather than a second dialect.
// Vite and svelte-check read this file. An app that builds this package's components compiles
// them with its own svelte.config.js.
export default { compilerOptions: { runes: true } };
