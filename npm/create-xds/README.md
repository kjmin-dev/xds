# create-xds

```sh
npm create xds@latest my-app
```

This runs `xds create my-app` from [xds-cli](https://www.npmjs.com/package/xds-cli): it scaffolds a project from the [cross-platform design system template](https://github.com/kjmin-dev/xds), asking which client stacks to include, what to call the project and which color theme to use. Flags go after `--`:

```sh
npm create xds@latest my-app -- --targets web-react,desktop-gpui --theme ocean
```

See [the documentation](https://github.com/kjmin-dev/xds/blob/main/docs/cli.md).
