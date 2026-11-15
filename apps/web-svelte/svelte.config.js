// Runes only: a component written in Svelte 4's syntax is an error rather than a second dialect.
// Vite and svelte-check read this file, and Vite compiles @acme/ui-svelte's components with it too.
export default { compilerOptions: { runes: true } };
