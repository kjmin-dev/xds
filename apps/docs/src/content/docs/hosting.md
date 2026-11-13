---
title: Hosting this site
description: How to build and deploy the documentation site and configure a custom domain.
---

This documentation site is an [Astro Starlight](https://starlight.astro.build) project located in `apps/docs`. It only lives in the template repository; `xds create` never copies it into a generated project.

## Build

```sh
mise run //docs:dev      # http://localhost:4321
mise run //docs:build    # writes apps/docs/dist
```

Before either command runs, `scripts/generate.ts` generates the pages whose source files live elsewhere in the repository:

| Pages | Source |
| --- | --- |
| CLI, Design system | `docs/cli.md`, `docs/design-system.md` |
| Tokens | `design/tokens`, `design/themes` |
| Components | `apps/docs/scripts/components.ts` |
| `/install.sh` | `install.sh` |

The build also generates `/llms.txt`, `/llms-full.txt`, and `/llms-small.txt`, along with a Markdown copy of every English page at the same path with `.md` replacing the trailing slash (for example, `/components/button.md`).

## Deploy to Cloudflare Workers

`apps/docs/wrangler.jsonc` is configured to deploy `dist` as static assets. Because no Worker script runs, requests do not count toward the free plan's daily limit.

The workflow in `.github/workflows/docs.yml` does not run until you configure it:

1. Create a Cloudflare API token using the "Edit Cloudflare Workers" template and save it as the repository secret `CLOUDFLARE_API_TOKEN`. Save your account ID as the secret `CLOUDFLARE_ACCOUNT_ID`.
2. Run the "Docs" workflow manually from the Actions tab. Once it finishes, the site is served at `xds-docs.<your-subdomain>.workers.dev`. Save that address (with `https://` in front) as the repository variable `DOCS_SITE`, then run the workflow again so canonical links, the sitemap, and `llms.txt` are built from it.
3. To deploy automatically on every push to `main`, set the repository variable `DOCS_DEPLOY` to `true`.

## Use a domain of your own

Your domain must be a zone in the same Cloudflare account.

1. In `apps/docs/wrangler.jsonc`, uncomment the `routes` entry and set your hostname, such as `xds.example.com`. On the next deploy, Cloudflare creates the DNS record and certificate. Make sure the hostname does not already have a CNAME record.
2. Update the `DOCS_SITE` repository variable to the new address, such as `https://xds.example.com`.

You can then run the installer script directly from your domain:

```sh
curl -fsSL https://xds.example.com/install.sh | sh
```

## GitHub Pages instead

You can also host the site for free on GitHub Pages, which does not require your domain's DNS to be on Cloudflare. Build the site with `mise run //docs:build`, upload `apps/docs/dist` using `actions/upload-pages-artifact`, and deploy it with `actions/deploy-pages`. To use a custom subdomain, add the domain in the repository's Pages settings and create a CNAME record pointing to `kjmin-dev.github.io`. Note that GitHub Pages ignores the `_headers` file, so `/install.sh` is served with whatever content type GitHub assigns.
