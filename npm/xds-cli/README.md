# xds-cli

`xds` scaffolds a project from the [cross-platform design system template](https://github.com/kjmin-dev/xds): one set of design tokens, a component library per client, and a small app wired to each. You pick the client stacks, a name and a color theme.

```sh
npm install --global xds-cli
xds create my-app
```

Or without installing:

```sh
npx xds-cli create my-app
npm create xds@latest my-app
```

`xds list` shows the stacks and themes, and `xds themes` previews the themes in the terminal. See [the documentation](https://github.com/kjmin-dev/xds/blob/main/docs/cli.md) for every command.

This package is a launcher. The binary comes from the platform package that matches your machine (`xds-cli-darwin-arm64`, `xds-cli-darwin-x64`, `xds-cli-linux-arm64`, `xds-cli-linux-x64`, `xds-cli-win32-x64`), which npm installs as an optional dependency.
