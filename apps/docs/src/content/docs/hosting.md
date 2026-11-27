---
title: Hosting this site
description: Build and deploy the documentation site and web design preview on Cloudflare Workers or GitHub Pages.
---

This documentation site is an [Astro Starlight](https://starlight.astro.build) project in `apps/docs`. It lives only in the template repository; `xds create` never copies it into generated projects.

Alongside it, the repository deploys the React web app in `apps/web` so the docs can link to its live design preview at `/design`. Generated projects include `apps/web` without the deployment config (`template.json` excludes `apps/web/wrangler.jsonc` and `.github/workflows/preview.yml`).

| Site | Address | Source | Workflow |
| --- | --- | --- | --- |
| Documentation | `https://xds.studiocyf.app` | `apps/docs` | `.github/workflows/docs.yml` |
| Design preview | `https://preview.xds.studiocyf.app/design` | `apps/web` | `.github/workflows/preview.yml` |

## Build

```sh
mise run //docs:dev      # http://localhost:4321
mise run //docs:build    # writes apps/docs/dist
```

Both commands run `scripts/generate.ts` first to sync pages whose sources live elsewhere in the repository:

| Pages | Source |
| --- | --- |
| CLI, Design system | `docs/cli.md`, `docs/design-system.md` |
| Tokens | `design/tokens`, `design/themes` |
| Components | `apps/docs/scripts/components.ts` |
| `/install.sh` | `install.sh` |

The build also outputs `/llms.txt`, `/llms-full.txt`, and `/llms-small.txt`, plus a plain Markdown version of every English page with `.md` replacing the trailing slash (for example, `/components/button.md`).

Each component page starts with a live example. Web components render directly from `packages/ui` via `src/demos/index.tsx` at `/demo/<name>/`. Touch-only components (`TopBar`, `TabBar`, and `BottomSheet`) have no web implementation, so they render a small screen built with `@acme/ui-native` via [react-native-web](https://necolas.github.io/react-native-web/) at `/demo-native/<name>/`, framed at phone dimensions so bottom sheets stay contained inside the frame. `scripts/react-native-web.ts` configures Vite to match Metro's web module resolution, and `pnpm --filter @acme/docs test` verifies tab order, roles, selection, focus trapping, and shadows in headless Google Chrome. The frame tracks the site's color mode rather than the OS preference through `ColorSchemeOverride` from `@acme/ui-native/scheme`.

The sidebar and web component pages link to the design preview using the `PREVIEW_SITE` environment variable. When `PREVIEW_SITE` is unset, links point to the local dev server (`mise run //web:dev`). When set to an empty string (such as in a fork without `PREVIEW_SITE` configured), preview links are omitted. The build fails if a component references a preview section that does not exist.

## Deploy to Cloudflare Workers

`apps/docs/wrangler.jsonc` and `apps/web/wrangler.jsonc` serve each app's `dist` directory as static assets. Because no Worker script executes on requests, traffic does not count against the free plan's daily Worker limit.

To deploy locally, build first and run the deploy task. Wrangler uses the account from `wrangler login`:

```sh
mise run check:docs && mise run deploy:docs
mise run //web:build && mise run deploy:preview
```

The GitHub Actions workflows in `.github/workflows/docs.yml` and `.github/workflows/preview.yml` stay inactive until configured:

1. Create a Cloudflare API token as described in [The API token](#the-api-token).
2. In repository settings, create an environment named `cloudflare` restricted to the `main` branch. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as environment secrets (not repository secrets) so only runs on `main` can access them.
3. Set repository variables `DOCS_SITE` and `PREVIEW_SITE` to your site URLs (for example, `https://xds.example.com` and `https://preview.xds.example.com`). Canonical links, the sitemap, `llms.txt`, and cross-site links derive from these values.
4. Trigger the "Docs" and "Preview" workflows manually from the Actions tab.
5. To deploy automatically on every push to `main`, set repository variables `DOCS_DEPLOY` and `PREVIEW_DEPLOY` to `true`.

### The API token

Cloudflare API tokens cannot be scoped to a single Worker—a token that can deploy these sites can overwrite any Worker in the account. Restrict it to the minimum permissions required:

| Scope | Permission | Resources |
| --- | --- | --- |
| Account | Workers Scripts: Edit | Only the account that hosts the sites |
| Zone | Workers Routes: Edit | Only the zone for the site hostnames |

The "Edit Cloudflare Workers" template works too, but it grants access to KV, R2, and Pages that these deployments do not use. Set an expiration date and rotate the token before it expires.

### How the workflows protect the token

Because the repository is public, the workflows assume anyone can inspect them and open pull requests:

- Deployment workflows never run on pull requests, and GitHub does not expose secrets to fork PRs.
- Secrets live in the `cloudflare` environment, which only allows deployments from `main`.
- Build and deploy run in separate jobs. The build job runs dependency code without access to secrets; the deploy job holds the token and only runs Wrangler against the uploaded artifact.
- Wrangler is pinned in `tools/deploy` and locked by checksum in `pnpm-lock.yaml`. The deploy job installs it with `--frozen-lockfile --ignore-scripts` and disables tool caching.
- Every GitHub Action is pinned to a commit SHA, updated monthly by `.github/dependabot.yml`.
- `CLOUDFLARE_ACCOUNT_ID` is stored as a secret solely so GitHub masks it in public logs; neither `wrangler.jsonc` embeds it.

Do not commit `.wrangler/` or `.dev.vars`—`.wrangler/` stores account metadata and `.dev.vars` holds local secrets. Both are listed in `.gitignore`.

## Use a custom domain

Each `wrangler.jsonc` binds its site to a Workers Custom Domain (`xds.studiocyf.app` for docs, `preview.xds.studiocyf.app` for the design preview). Cloudflare provisions the DNS record and TLS certificate automatically on deploy.

- The domain must be a zone in the same Cloudflare account, and neither hostname may already have a CNAME record. Do not create DNS records manually.
- Custom Domains issue a dedicated certificate per hostname, so nested subdomains like `preview.xds.example.com` work without Advanced Certificate Manager. (Universal SSL only covers one subdomain level, and browsers enforce HTTPS on `.app` domains.)
- Both configs set `workers_dev` and `preview_urls` to `false` so each site has a single canonical URL and nothing is exposed on `workers.dev`.

In a fork, replace each `pattern` with a hostname in your zone and update `DOCS_SITE` and `PREVIEW_SITE` to match. To use `workers.dev` URLs instead, remove the `routes` entries and set `workers_dev` to `true`; the sites will be served at `xds-docs.<your-subdomain>.workers.dev` and `xds-preview.<your-subdomain>.workers.dev`.

The documentation site also serves the CLI installer script:

```sh
curl -fsSL https://xds.studiocyf.app/install.sh | sh
```

## GitHub Pages

You can host the site on GitHub Pages instead, without moving DNS to Cloudflare. Build with `mise run //docs:build`, upload `apps/docs/dist` using `actions/upload-pages-artifact`, and deploy with `actions/deploy-pages`. For a custom subdomain, configure it in the repository's Pages settings and point a CNAME record to `kjmin-dev.github.io`. Note that GitHub Pages ignores `_headers`, so `/install.sh` uses GitHub's default content type and static assets inherit its 10-minute cache lifetime instead of immutable caching.
