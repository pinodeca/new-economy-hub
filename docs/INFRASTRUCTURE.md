# Infrastructure

Operational reference for hosting, deployment, and domains — the stuff that
lives outside this repo (in Azure and Namecheap) and would otherwise have
to be reverse-engineered months from now. Update this file whenever any of
it changes. See `docs/DECISIONS.md` for the reasoning behind being on
Azure/static export at all.

## Azure

- **Subscription**: "New Economy Hub" (`deff0a20-5ca3-4d6d-a2bb-f9d5ac2dea8a`),
  a personal (non-Microsoft-corporate) subscription owned by the founder
  (`giuseppe.decandia@gmail.com`). Deliberately not the founder's
  Microsoft-corporate Azure login — see chat history from 2026-09-07 for
  why (corporate dev/test subscriptions aren't an appropriate place for a
  personal public site).
- **Resource group**: `rg-new-economy-hub`, West US 2.
- **Static Web App**: `new-economy-hub`, Free tier, West US 2.
  - Default hostname: `ashy-stone-09563381e.6.azurestaticapps.net` — this
    is the actual routing target every custom domain's DNS record points
    at. It won't change unless the resource is deleted and recreated.
  - GitHub-integrated: deploys automatically on every push to `main` via
    `.github/workflows/azure-static-web-apps-ashy-stone-09563381e.yml`.
    Also builds a temporary preview environment for every open PR
    (torn down automatically when the PR closes/merges) — see that
    workflow's `close_pull_request_job`.
  - **Free tier caps concurrent PR preview environments at 3** (plus the
    `default`/production one). A 4th simultaneously open PR's deploy job
    fails outright with `BadRequest: ... already has the maximum number
    of staging environments` — confirmed 2026-09-08 when 4 research PRs
    were opened back to back. The PR's own `build` check (lint/typecheck)
    is unaffected and can still pass/merge; only the preview link is
    missing until an existing PR closes/merges and frees a slot. Check
    current usage with `az staticwebapp environment list -n
    new-economy-hub -g rg-new-economy-hub`. Worth remembering when
    running a batch of research PRs concurrently — either keep at most 3
    open at a time, or accept that later ones won't get a preview until
    an earlier one merges (their content/build is still fine either way).
  - The workflow's `azure_static_web_apps_api_token` is a GitHub Actions
    secret Azure generated and pushed to the repo automatically; not
    something to regenerate manually unless the resource itself changes.

## Domains

Both domains are registered at **Namecheap**, in the founder's own
Namecheap account (`giuseppe.decandia@gmail.com`) — not tied to the Azure
subscription or any Microsoft account. DNS is managed there too
(Namecheap's Advanced DNS), not Azure DNS.

### neweconomyhub.net — primary domain

DNS records (Namecheap → Domain List → neweconomyhub.net → Advanced DNS):

| Type | Host | Value |
|---|---|---|
| ALIAS Record | `@` | `ashy-stone-09563381e.6.azurestaticapps.net` |
| CNAME Record | `www` | `ashy-stone-09563381e.6.azurestaticapps.net.` |

Both are registered as custom domains on the Static Web App (Azure Portal
→ the `new-economy-hub` app → Custom domains), which is what actually
provisions the free managed TLS certificates for each. The apex domain
(`@`) had to use `ALIAS` rather than `CNAME` because DNS doesn't allow a
CNAME at the zone root — apex validation went through Azure's
`dns-txt-token` method (a one-time TXT record proving ownership, since
removed — it's not needed once status shows `Ready`); the `www` subdomain
used the simpler `cname-delegation` method.

**Gotcha already hit**: Namecheap auto-creates a default "parked domain"
setup on every new domain — a `CNAME www → parkingpage.namecheap.com` paired
with a `URL Redirect Record @ → http://www.<domain>/`. That pair has to be
deleted before adding the real ALIAS record, or the two conflict and
resolution flickers unpredictably between Namecheap's parking page and the
real site depending on which a given DNS resolver has cached.

### new-economy-hub.net — hyphenated variant, redirects to the primary

Registered defensively so nobody else can grab the hyphenated spelling.
Not a second copy of the site — it redirects to the primary domain via
Namecheap's own URL forwarding feature, entirely at the registrar level
(never touches Azure):

| Type | Host | Value |
|---|---|---|
| URL Redirect Record | `@` | `https://neweconomyhub.net/` |

**Known limitation**: this redirect only serves plain HTTP. `http://new-economy-hub.net`
correctly 302s to `https://neweconomyhub.net/`, but `https://new-economy-hub.net`
times out — Namecheap's free URL-forwarding service doesn't terminate TLS
for it. Since browsers increasingly default to HTTPS first, this can look
"broken" even though the record is configured correctly (confirmed via
`curl` on 2026-09-08). If this becomes annoying in practice, the fix is to
stop using Namecheap's redirect and instead add `new-economy-hub.net` as a
real custom domain on the Static Web App (same ALIAS pattern as the
primary domain gets), which would get it a proper Azure-managed cert —
at the cost of it then serving the site directly rather than redirecting,
which would need a canonical-URL tag added to avoid duplicate-content SEO
concerns. Not done yet; low priority since this domain is defensive/typo
insurance, not meant to be typed directly.
