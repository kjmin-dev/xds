---
title: Hosting this site
description: How to build and deploy the documentation site and the web design preview, and serve them from your own domain.
---

This documentation site is an [Astro Starlight](https://starlight.astro.build) project located in `apps/docs`. It only lives in the template repository; `xds create` never copies it into a generated project.

Next to it, this repository deploys the web app in `apps/web` so that the documentation can link to its design preview at `/design`. Generated projects get the web app but not the deployment: `template.json` excludes `apps/web/wrangler.jsonc` and the workflow that deploys it.

| Site | Address | Source | Workflow |
| --- | --- | --- | --- |
| Documentation | `https://xds.studiocyf.app` | `apps/docs` | `.github/workflows/docs.yml` |
| Design preview | `https://preview.xds.studiocyf.app/design` | `apps/web` | `.github/workflows/preview.yml` |

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

The sidebar and the page of every web component link to the design preview, at the address in the `PREVIEW_SITE` environment variable. When the variable is unset, the links point to the web app's dev server (`mise run //web:dev`). When it is set to an empty string, as it is in a deployment from a repository without a `PREVIEW_SITE` variable, the site has no links to the preview. The build fails if a component names a section that the design preview does not have.

## Deploy to Cloudflare Workers

`apps/docs/wrangler.jsonc` and `apps/web/wrangler.jsonc` deploy each app's `dist` directory as static assets. Because no Worker script runs, requests do not count toward the free plan's daily limit.

To deploy from your machine, build first, then run the deploy task. Wrangler uses the account you logged in to with `wrangler login`.

```sh
mise run check:docs && mise run deploy:docs
mise run //web:build && mise run deploy:preview
```

The workflows in `.github/workflows/docs.yml` and `.github/workflows/preview.yml` do not run until you configure them:

1. Create a Cloudflare API token as described in [The API token](#the-api-token).
2. In the repository settings, create an environment named `cloudflare`. Under its deployment branches, allow only `main`. Add the token as the environment secret `CLOUDFLARE_API_TOKEN` and your account ID as the environment secret `CLOUDFLARE_ACCOUNT_ID`. Use environment secrets, not repository secrets, so that only a run on `main` can read them.
3. Set the repository variables `DOCS_SITE` and `PREVIEW_SITE` to the addresses of the two sites, such as `https://xds.example.com` and `https://preview.xds.example.com`. Canonical links, the sitemap, `llms.txt`, and the links between the two sites are built from these values.
4. Run the "Docs" and "Preview" workflows manually from the Actions tab.
5. To deploy automatically on every push to `main`, set the repository variables `DOCS_DEPLOY` and `PREVIEW_DEPLOY` to `true`.

### The API token

Cloudflare cannot limit a token to one Worker. A token that can deploy these two sites can replace every Worker in the account, so give it only the permissions the deployment needs:

| Scope | Permission | Resources |
| --- | --- | --- |
| Account | Workers Scripts: Edit | Only the account that holds the sites |
| Zone | Workers Routes: Edit | Only the zone of the sites' hostnames |

The "Edit Cloudflare Workers" template also works, but it adds access to KV, R2, and Pages, which the deployment never uses. Set an expiry date, and replace the token when it expires.

### How the workflows protect the token

The repository is public, so the workflows assume that anyone can read them and open a pull request.

- No deployment workflow runs for a pull request, and GitHub never passes secrets to a pull request from a fork.
- The secrets belong to the `cloudflare` environment, which accepts only runs on `main`. A workflow changed on another branch cannot read them.
- Each workflow builds in one job and deploys in another. The build job runs the code of every dependency and has no secret. The deploy job has the token, and runs only Wrangler on the files the build job uploaded.
- Wrangler is a dependency of `tools/deploy`, so `pnpm-lock.yaml` pins it and everything it depends on by checksum. The deploy job installs it with `--frozen-lockfile --ignore-scripts` and restores no tool cache.
- Every action is pinned to a commit. `.github/dependabot.yml` proposes newer commits once a month.
- The account ID is a secret only so that GitHub masks it in the public logs. Neither `wrangler.jsonc` file contains it.

Never commit `.wrangler/` or `.dev.vars`: the first names your Cloudflare account, and the second holds local secrets. Both are in `.gitignore`.

## Use a domain of your own

Each `wrangler.jsonc` attaches its site to one hostname as a Workers Custom Domain: `xds.studiocyf.app` for the documentation and `preview.xds.studiocyf.app` for the design preview. On deploy, Cloudflare creates the DNS record and a certificate for each hostname.

- The domain must be a zone in the same Cloudflare account, and the hostnames must not already have a CNAME record. Do not create DNS records for them yourself.
- Each hostname gets its own certificate, so a hostname two levels below the zone, such as `preview.xds.example.com`, works without Advanced Certificate Manager. Universal SSL covers only one level of subdomain, and browsers open `.app` domains only over HTTPS.
- Both files set `workers_dev` and `preview_urls` to `false`, so each site has only one address and nothing is published under the account's `workers.dev` subdomain.

In a fork, replace each `pattern` with a hostname in your own zone, and update `DOCS_SITE` and `PREVIEW_SITE` to match. To use the `workers.dev` addresses instead, remove the `routes` entries and set `workers_dev` to `true`. The sites are then served at `xds-docs.<your-subdomain>.workers.dev` and `xds-preview.<your-subdomain>.workers.dev`.

The documentation site also serves the installer script:

```sh
curl -fsSL https://xds.studiocyf.app/install.sh | sh
```

## GitHub Pages instead

You can also host the site for free on GitHub Pages, which does not require your domain's DNS to be on Cloudflare. Build the site with `mise run //docs:build`, upload `apps/docs/dist` using `actions/upload-pages-artifact`, and deploy it with `actions/deploy-pages`. To use a custom subdomain, add the domain in the repository's Pages settings and create a CNAME record pointing to `kjmin-dev.github.io`. Note that GitHub Pages ignores the `_headers` file, so `/install.sh` is served with whatever content type GitHub assigns.
