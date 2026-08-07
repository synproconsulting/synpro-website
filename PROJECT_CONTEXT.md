# PROJECT_CONTEXT.md — SynPro Consulting Website

> Deep implementation reference. `CLAUDE.md` holds the rules and current state; this file holds
> the detail a session needs to change something without breaking it.
>
> Updated in the **same PR** as the change it describes. Sections are numbered and stable — do
> not renumber them, as prompts reference them by number.

---

## Table of Contents

1. Endpoints
2. Content Model
3. Component & Page Structure
4. CI/CD Logic
5. Error Handling Patterns
6. Architectural Decisions
7. Design Standards
8. Appendix — Environment & DNS

---

## 1. Endpoints

The site is static. Exactly one endpoint exists.

### `POST` contact form — Cloudflare Worker

*Not yet implemented. This section is filled in by the sprint that builds it.*

Required detail once built: URL, request schema (name, company, message, enquiry type),
validation rules, response shapes for success / validation failure / rate limit / spam rejection,
CORS allowlist, rate limit key and window, honeypot mechanism, and what is logged versus what is
returned to the visitor (see AD-8 in `CLAUDE.md`).

---

## 2. Content Model

*Populated when Astro content collections are scaffolded.*

Record here: each collection, its schema, where its source copy lives, and which pages consume
it. The intent is that a content edit never requires reading component code to find out where a
string is rendered.

---

## 3. Component & Page Structure

### Page inventory

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | The placeholder page — logo, tagline, divider, "coming soon", footer |

There is exactly one route. `src/components/` exists but is empty (`.gitkeep`).

### `src/layouts/BaseLayout.astro`

The shared page shell. Owns `<html lang>`, the entire `<head>`, and `<body>`, exposing a single
default `<slot />` for page content.

| Prop | Type | Purpose |
|---|---|---|
| `title` | `string` | `<title>` text |
| `description` | `string` | `<meta name="description">` content |

It owns the head (charset, viewport, title, description, Google Fonts preconnects and the Sora
stylesheet link) and the **global stylesheet**.

**The `<style>` block is `is:global`, and this is load-bearing.** The rules target `html`, `body`,
`*`, and `@keyframes`. Astro's default scoping rewrites selectors with a hash attribute, which
would leave the universal reset and the body background applying to nothing. Do not remove
`is:global` from this block without moving those rules elsewhere first.

### `src/pages/index.astro`

Renders through `BaseLayout` and reproduces the pre-Sprint-1 placeholder exactly: the two `.aura`
gradient blobs, `main.stage` with the logo, tagline, divider, and status line, and the footer with
the JS-populated copyright year.

Two details are deliberate and easy to "fix" wrongly:

- **`<img src="logo.png">` is relative, not root-absolute.** A relative reference resolves
  correctly both on `synproconsulting.co/` and on `synproconsulting.github.io/synpro-website/`.
  Rewriting it to `/logo.png` would 404 on the origin URL — which is precisely the URL the Hard
  Rules require you to verify a risky change against.
- **The year script carries `is:inline`.** Without it Astro bundles the script and hoists it into
  `<head>` as a module. `is:inline` keeps it in place and unprocessed, matching the original.

---

## 4. CI/CD Logic

### Trigger

`push` to `feature/**`, `fix/**`, `docs/**`, and `main`, plus `workflow_dispatch`. There is no
`pull_request` trigger — the auto-merger resolves the PR from the branch name, exactly as on
Fracttal PRM. `workflow_dispatch` was added so the owner can re-run the deploy by hand after
switching the Pages source without pushing an empty commit.

Top-level `permissions: contents: read`. Only the `deploy` job widens this, for itself.
`NODE_VERSION` is set once as a workflow-level `env` so the three Node jobs cannot drift apart.

### Job summary

| Job | Trigger condition | Blocking | What it does |
|---|---|---|---|
| `build` | every run | **Yes** | `npm ci` → `npm run build` → asserts `dist/CNAME` → uploads `dist/` artifact |
| `format` | every run | **Yes** | `npm ci` → `npm run format:check` |
| `links` | every run, `needs: build` | **Yes** | downloads the `dist` artifact → `npm run links` |
| `deploy` | `github.ref == 'refs/heads/main'`, `needs: build` | No (`continue-on-error`) | `configure-pages` → `upload-pages-artifact` → `deploy-pages` |
| `auto-merge` | `github.ref != 'refs/heads/main'`, `needs: [build, format, links]` | n/a | squash-merges the open PR for the branch |

**The blocking list is the `needs:` array on `auto-merge`.** It is not a separately configured
check-name list, so it cannot silently drift; but renaming a job id without updating that array
breaks the gate in one of the two classic ways (merges on nothing / blocks forever).

`links` intentionally consumes the artifact rather than rebuilding. It therefore checks the exact
bytes that `deploy` would publish, and cannot pass against a different build than the one shipped.

### The `dist/CNAME` assertion (AD-9)

The `build` job fails if `dist/CNAME` is absent, or if its whitespace-stripped contents are not
exactly `synproconsulting.co`. This is the enforcement point for AD-9 — the invariant that would
otherwise fail silently and take the live domain down. It runs after `npm run build` and before
the artifact upload, so a bad artifact is never produced.

`public/CNAME` is 19 bytes with **no trailing newline**, byte-identical to the root `CNAME`. The
assertion strips whitespace, so a trailing newline would not fail it — but keep them identical
anyway so the two copies can be compared by hash during the Sprint 2 cleanup.

### Link checking

`linkinator@8.0.3`, pinned exactly, configured by `.linkinatorrc.json` rather than CLI flags.

The config file is not a style choice. linkinator serves the target directory over
**`127.0.0.1`**, so internal links become absolute `http://` URLs during the crawl. A skip pattern
of `^https?://` therefore skips the crawl root and the checker passes having scanned **zero
links** — green and completely inert. The working pattern excludes the loopback hosts explicitly:

```
^https?://(?!(localhost|127\.0\.0\.1|\[::1\]))
```

Passing that regex as a CLI flag was also mangled by Windows shell quoting, which is the second
reason it lives in a config file. See `RUNBOOK.md` §8 for the positive and negative tests that
prove the check is live.

### Build reproducibility

`astro.config.mjs` sets `vite.build.cssMinify: false`. The default minifier strips
`-webkit-background-clip: text` while keeping `-webkit-text-fill-color: transparent`, making the
gradient "coming soon" text invisible on engines without unprefixed `background-clip`. The
stylesheet is ~2.5 kB; the saving is not worth a visible regression. Re-enabling minification
requires a browserslist-driven Lightning CSS target **and** a visual re-check of `.status .soon`.

### Deploy

GitHub Pages, published from the `dist` artifact on `main` only.

**Currently expected to fail.** Pages is still on `build_type: legacy`, serving the `main` branch
root. `actions/deploy-pages` cannot publish until the owner switches Settings → Pages → Source to
"GitHub Actions". The job is `continue-on-error: true` so it can never block the auto-merger
(AD-6), and carries an inline comment saying so, so a future reader does not chase it as a defect.

Per AD-6's own consequence note, that also means it can sit red indefinitely. Check it at closeout.

### Auto-merger

Ported from `synproconsulting/Fracttal-PRM` `.github/workflows/ci.yml`. Adaptations made:

| Change | Reason |
|---|---|
| `needs: test` → `needs: [build, format, links]` | This repo's blocking jobs |
| Added a guard that fails loudly if `secrets.PAT_TOKEN` is empty | The secret was absent on this repo at Sprint 1; an unset token otherwise surfaces as an opaque 401 |
| Job ids given matching `name:` values | So the GitHub check name and the `needs:` id are the same string, removing any ambiguity about what "the check name" is |

Preserved unchanged: the `{sha: $GITHUB_SHA}` merge guard from FPRM-36, which makes GitHub refuse
the merge with 409 if the PR head advanced past the commit this run actually tested, and the
`exit 0` on 409 (the newer commit triggers its own run).

`PAT_TOKEN` must be a classic PAT with `repo` + `workflow` scope. The built-in `GITHUB_TOKEN`
cannot substitute for it: pushes made with `GITHUB_TOKEN` do not trigger further workflow runs, so
the merge to `main` would never fire the `deploy` job.

---

## 5. Error Handling Patterns

*Populated when the Worker is built.*

The governing principle is AD-8: the visitor-facing response never reveals delivery state or
upstream provider detail. Record the exact response bodies and status codes here so future
changes stay consistent.

---

## 6. Architectural Decisions

Full text for each AD summarised in `CLAUDE.md`. Each entry uses the four-part form below.

### AD-1 · Static site, single dynamic surface

**Decision.** The site is statically generated and CDN-served. Exactly one dynamic capability
exists: the contact form.

**Why.** A brochure site with a contact form does not need a runtime. Every dynamic surface added
is a permanent security, cost, and maintenance obligation on a property that otherwise has none.

**Consequence.** No database, no auth, no sessions. Anything requiring server state is a scope
decision, not an implementation detail.

**Do not.** Add a second dynamic endpoint without explicit scope confirmation from the owner.

### AD-2 · All GitHub operations use the REST API — no git CLI for repo mutations

*Inherited from Fracttal PRM AD-2.*

**Decision.** Branches, commits, trees, and PRs are created via the GitHub Contents and Git Trees
APIs. The local git CLI is used only for pre-flight and post-flight working-tree sync.

**Why.** Removes dependence on local git state and credential configuration for the operations
that matter.

**Consequence.** The local working tree is a read surface, not the source of truth. It must be
hard-reset at both ends of every session.

**Do not.** Push branches from the CLI — the working tree and `origin` will silently diverge.

### AD-3 · Feature branches are always recreated from `main`, never updated in place

*Inherited from Fracttal PRM AD-3.*

**Decision.** Delete any existing branch of the same name, then recreate from the latest `main`
SHA.

**Why.** Guarantees a clean diff and prevents a stale branch carrying unrelated commits.

**Do not.** Rebase or merge `main` into a feature branch — recreate it.

### AD-4 · Jira sprints tracked via fix versions AND native Agile sprints

*Inherited from Fracttal PRM AD-4.*

**Decision.** Both fields are set on every Story; JQL dual-queries them.

**Why.** Fix versions give a durable release grouping; native sprints drive the board. Neither
alone catches every ticket.

**Do not.** Query on one field only — tickets will be missed at closeout.

### AD-5 · Sub-tasks inherit fix version and sprint from their parent

*Inherited from Fracttal PRM AD-10.*

**Decision.** Never set fix version or sprint on a Sub-task issue directly.

**Why.** Jira returns HTTP 400. The dual-query surfaces subtasks via parent membership anyway.

### AD-6 · Non-blocking CI jobs run with `continue-on-error: true`

*Inherited from Fracttal PRM AD-7.*

**Decision.** Advisory jobs never gate the auto-merger.

**Why.** A quality signal that can block a merge becomes a quality signal that gets disabled.

**Consequence.** An advisory job can fail indefinitely without anyone noticing — on Fracttal PRM,
SonarCloud failed on every run for twenty-plus sprints. Review advisory job health at each sprint
closeout, or don't add the job.

### AD-7 · Email delivery is Resend over HTTPS; SMTP is never used

*Inherited from Fracttal PRM AD-47.*

**Decision.** The Worker calls `POST https://api.resend.com/emails` with a Bearer API key. Sender
domain `contact.synproconsulting.co` (already verified); destination `info@synproconsulting.co`.

**Why.** The domain is verified and in use; SMTP was proven permanently blocked on the sibling
projects' host and is a dead path generally for this pattern.

**Do not.** Introduce an SMTP client or `SMTP_*` configuration in any form.

### AD-8 · The form endpoint never reveals delivery state

*Adapted from Fracttal PRM AD-13.*

**Decision.** Transport failures are logged server-side and returned to the visitor as a generic
failure. Success, rate-limit, and spam-rejection responses are indistinguishable in shape.

**Why.** An enquiry form is an unauthenticated public endpoint. Differentiated responses give an
abuser a working oracle for tuning around the controls.

**Do not.** Return an upstream status code, provider error, or "message flagged as spam" text.

### AD-9 · `CNAME` is a build artifact, not a repo-root file

**Decision.** `CNAME` lives in the static passthrough directory (`public/`) and is published with
every build.

**Why.** GitHub Pages reads the custom domain from the published artifact. Under an
Actions-based deploy the artifact is the build output, not the repo root.

**Consequence.** If `CNAME` is missing from a build, the custom domain silently unconfigures and
the live site goes down.

**Do not.** Delete it, move it, or add it to `.gitignore`.

---

## 7. Design Standards

*Populated when the visual design is established.*

Record here: type scale, colour tokens, spacing scale, breakpoints, logo usage and clear space,
button and link treatments, and the accessibility floor (contrast ratios, focus states, reduced
motion). The intent is that a future page looks like it belongs without anyone re-deriving the
system.

> The Fracttal PRM design standards (`fp-card`, `fp-table`, its status-badge palette) are an
> internal application's system and deliberately **not** inherited here.

---

## 8. Appendix — Environment & DNS

### Secrets

| Name | Location | Notes |
|---|---|---|
| `RESEND_API_KEY` | Cloudflare Worker secret store | Never in the repo, never in CI, never in chat |
| Classic GitHub PAT | Local `.env` | Shared across the `synproconsulting` org |

### DNS — `synproconsulting.co` at Namecheap

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `synproconsulting.github.io.` |

Plus mail and verification records — MX, SPF, DMARC, DKIM, the Microsoft `MS=` TXT, and the
Resend verification records. **These are load-bearing. Never bulk-edit this zone.**

The apex A record IPs are GitHub's published Pages addresses. Verify against GitHub's current
documentation before changing them rather than trusting this table.

---

*Created: 2026-08-06 — project bootstrap, pre-Sprint-1.*
