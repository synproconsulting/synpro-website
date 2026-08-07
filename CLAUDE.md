# SynPro Consulting Website — Project Context

> This file is the single source of truth for Claude Code and Claude chat sessions.
> Load it at the start of every session to restore full project context.
>
> Sprint history lives in `CLAUDE_HISTORY.md`. Operational procedure lives in `RUNBOOK.md`.
> Deep implementation reference lives in `PROJECT_CONTEXT.md`. Prompt structure is governed
> by `PROMPT_TEMPLATE.md`.

---

## What This Project Is

The public marketing website for SynPro Consulting at **https://synproconsulting.co**. A static
site with exactly one dynamic surface: a contact form that delivers an enquiry email to
`info@synproconsulting.co`.

Built and maintained by the SynPro AI-powered Virtual Development Team pattern — Claude chat
for planning and prompt authoring, Claude Code as the Dev Agent, a rule-based auto-merger in
`ci.yml` as the Manager Agent, and direct Jira REST API calls for sprint setup.

**Owner:** Johan Wessels — SynPro Consulting
**Started:** August 2026

**Current state:** Sprint 1 complete. The build pipeline is established. The same single-page
placeholder (logo + "coming soon") a visitor saw before Sprint 1 is still what they see — it is
now produced by an Astro build rather than served as a raw file. `package.json`, `astro.config.mjs`,
`src/`, `public/`, and `.github/workflows/ci.yml` all exist; three blocking CI checks (`build`,
`format`, `links`) gate a ported rule-based auto-merger. DNS is configured at Namecheap (four
GitHub Pages apex A records + `www` CNAME) and TLS is issued.

**Pages source has not yet been switched.** GitHub Pages is still on `build_type: legacy`,
deploying from the `main` branch root. The Actions `deploy` job is written, wired, and
non-blocking — it will fail on every run until the owner flips Settings → Pages → Source to
"GitHub Actions". Until that flip, the root `index.html`, `logo.png`, and `CNAME` are what serve
the live site and must not be deleted.

---

## Live Deployment

| Surface | URL |
|---|---|
| Production site | https://synproconsulting.co |
| GitHub Pages origin | https://synproconsulting.github.io/synpro-website/ |
| Contact form endpoint | `form.synproconsulting.co` *(Cloudflare Worker — not yet created)* |

> There is no staging environment. **`main` is production.** A merge to `main` publishes to the
> live public domain within roughly a minute. See the Hard Rules below.

---

## Hard Rules

> These rules are non-negotiable and apply to every session and every change — no exceptions.

**`main` is production — there is no staging.** Unlike the sibling Fracttal PRM and SynPro VSDC
projects, a merge here publishes directly to a live public domain under the company's own name.
Every PR must build green before merge, and any change that could take the site down (build
config, DNS-adjacent files, the placeholder cutover) must be verified on the
`synproconsulting.github.io/synpro-website/` origin URL before the custom domain follows it.

**Never commit directly to `main`.** All changes — including single-line fixes, content edits,
and documentation updates — must go through a `feature/`, `fix/`, or `docs/` branch, a pull
request, the CI pipeline, and the auto-merger. If a direct-to-main commit is ever made by
mistake, open a retroactive PR immediately.

**One PR at a time — no exceptions.** Before opening any PR, verify zero PRs are currently open
via the GitHub API. If any PR is open, wait for it to merge.

**Every Claude Code session must start with a clean working tree pulled from main.** Before
running `claude --dangerously-skip-permissions`, execute in order:

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git status
git checkout main
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

`git pull origin main` alone is **not** sufficient — it does not remove untracked files left by
a prior session.

**Every Claude Code session must end with a post-flight sync after the final PR merges.**

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

The post-flight sync is not optional — a session that ends without it leaves stale files that
corrupt the next session's pre-flight read.

**Never run `git clean -fd` without `--exclude=Documentation/`.** The repo-root `Documentation/`
folder is untracked but canonical — it holds every sprint's Claude Code prompt, PR body files,
and reference material. A bare `git clean -fd` deletes all of it, including the prompt currently
being executed.

**`CNAME` must survive every build.** GitHub Pages resolves the custom domain from a `CNAME` file
in the *published artifact*. Once the site builds via GitHub Actions, the published artifact is
the build output directory — not the repo root. `CNAME` must live in the framework's static
passthrough directory (e.g. `public/CNAME`) so it is copied into every build. If `CNAME` is
absent from the artifact, `synproconsulting.co` silently reverts to unconfigured and the site
goes down. Never delete it, never move it out of the passthrough directory.

**Never touch mail-related DNS records.** The Namecheap zone for `synproconsulting.co` carries
MX, SPF, DMARC, DKIM, the Microsoft `MS=` verification TXT, and the Resend verification records.
Company email and the contact form both depend on them. Any DNS change is additive and
surgical — never a clean sweep, never a bulk delete.

**Canonical docs must travel in the same PR as the code change that caused them.** `CLAUDE.md`,
`CLAUDE_HISTORY.md`, `PROJECT_CONTEXT.md`, and `RUNBOOK.md` must be updated in the same branch
and same PR as the implementation change. No deferred docs PRs. A PR that changes behaviour,
structure, or configuration is incomplete until the four canonical docs reflect it. The only
exception is a pure docs PR with no accompanying code change.

**Claude chat must follow `PROMPT_TEMPLATE.md` when generating Claude Code prompts.** That file
defines the mandatory nine-section structure every prompt must contain. It governs Claude chat
as prompt author; this file governs Claude Code as Dev Agent. Different audiences — no
duplication.

**Every generated Claude Code prompt must declare its model in the header.** Default:
`claude-sonnet-5`.

**The contact-form secret never enters the repository.** `RESEND_API_KEY` lives only in the
Cloudflare Worker's secret store. It must never appear in client-side code, in a committed
file, in a CI variable visible to the static build, or in any chat interface.

**Runtime controls on the form endpoint must be verified live, not only in CI.** Rate limiting,
CORS enforcement, and honeypot rejection all depend on the real request path through Cloudflare's
edge. A control can pass its unit tests and be completely inert in production. After any change
to the Worker deploys, exercise the control against the live endpoint before marking the ticket
Done. (Carried from Fracttal PRM AD-46 / FPRM-460, where a rate limiter was green in CI and
never engaged in production for weeks.)

**Never run two Claude Code instances simultaneously on this project.** Concurrent instances
produce race conditions, duplicate PRs, and split-brain Jira state.

**Claude Code is the Dev Agent.** It implements all tickets directly. No agent scripts are
invoked programmatically.

**The rule-based auto-merger is the Manager Agent.** PRs merge automatically when all blocking
CI checks pass. Do not invoke manager agent scripts directly.

**Sprint setup is performed directly via Jira REST API calls from Claude Code** — fix version
creation, native sprint creation, ticket creation, execution order, story points, priority.

**Jira ticket lifecycle: transition to In Progress before starting implementation.** Leave In
Progress when the PR is opened. Transition to Done only when the PR is merged to `main` and
confirmed by the auto-merger. Never transition to Done on PR open.

**Before opening any fix PR for a bug discovered during the current sprint, create a Jira bug
ticket first.** Assign it to the current sprint (fix version + native sprint). Reference the key
in the PR title: `fix(SWEB-XX): description`.

**When Claude Code flags a discrepancy at the end of its output, resolve it in the current
action — never defer to a follow-up.**

**`package.json` and the lockfile are critical files.** Read existing content before modifying.
Never remove an existing dependency — only append. Commit the lockfile with every dependency
change.

---

## Key Architectural Decisions

Full Decision / Why / Consequence / Do-not text lives in `PROJECT_CONTEXT.md` Section 6.
Inherited decisions carried from the Fracttal PRM programme are noted as such.

### AD-1 · Static site, single dynamic surface
The site is statically generated and served from a CDN. Exactly one dynamic capability exists:
the contact form. No database, no authentication, no server-side session state. Any proposal
that introduces a second dynamic surface is a scope decision requiring explicit confirmation,
not an implementation detail.

### AD-2 · All GitHub operations use the REST API — no git CLI for repo mutations
*(Inherited — Fracttal PRM AD-2.)* Branches, commits, trees, and PRs are created via the GitHub
Contents and Git Trees APIs over HTTP. The local git CLI is used only for the pre-flight and
post-flight working-tree sync.

### AD-3 · Feature branches are always recreated from `main`, never updated in place
*(Inherited — Fracttal PRM AD-3.)* Delete any existing branch of the same name and recreate from
the latest `main` SHA, guaranteeing clean diffs.

### AD-4 · Jira sprints are tracked via fix versions AND native Agile sprints
*(Inherited — Fracttal PRM AD-4.)* Both are set on every Story. JQL must dual-query
`fixVersion = {fix_id} OR sprint = {native_id}` to catch all tickets.

### AD-5 · Sub-tasks inherit fix version and sprint from their parent
*(Inherited — Fracttal PRM AD-10.)* Setting them on the Sub-task issue itself returns HTTP 400.
The dual-query still surfaces subtasks via parent membership.

### AD-6 · Non-blocking CI jobs run with `continue-on-error: true`
*(Inherited — Fracttal PRM AD-7.)* Only the blocking check list gates the auto-merger. Advisory
jobs (performance/accessibility audits, deploy) must never block a merge — but must also never be
allowed to fail silently forever. See the Known Issues note on SonarCloud in the Fracttal PRM
docs for the failure mode this guards against.

### AD-7 · Email delivery is Resend over HTTPS; SMTP is never used
*(Inherited — Fracttal PRM AD-47.)* The contact form posts to the Cloudflare Worker, which calls
`POST https://api.resend.com/emails` with a Bearer `RESEND_API_KEY`. The verified sender domain
is `contact.synproconsulting.co`; the destination is `info@synproconsulting.co`. Never introduce
`smtplib`, an SMTP client, or `SMTP_*` configuration in any form.

### AD-8 · The form endpoint never returns an error that reveals delivery state
*(Adapted from Fracttal PRM AD-13, "email notifications never raise".)* A transport failure to
Resend is logged and surfaced to the visitor as a generic failure message — never as an upstream
error, status code, or provider detail. The visitor-facing response is the same shape whether
delivery succeeded, was rate-limited, or was rejected as spam.

### AD-9 · `CNAME` is a build artifact, not a repo-root file
Once the site builds via Actions, `CNAME` lives in the static passthrough directory and is
published with every build. See the matching Hard Rule.

---

## Repository

- **GitHub org:** `synproconsulting`
- **Repo:** `synpro-website`
- **Default branch:** `main`
- **Branch naming:** `feature/sweb-{ticket}-{slug}`, `fix/sweb-{ticket}-{slug}`, or
  `docs/sweb-{ticket}-{slug}`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Site framework | Astro `7.2.0` (pinned exactly; requires Node ≥ 22.12) |
| Hosting | GitHub Pages — custom domain `synproconsulting.co` |
| DNS / registrar | Namecheap |
| Contact form endpoint | Cloudflare Worker *(to be created)* |
| Email delivery | Resend HTTPS API — sender domain `contact.synproconsulting.co` |
| Task tracking | Jira Cloud — `synproconsulting.atlassian.net`, project key `SWEB` (board 100) |
| Source control | GitHub — `synproconsulting/synpro-website` |
| CI/CD | GitHub Actions |

> **Not used on this project:** Railway, PostgreSQL, Alembic, FastAPI, the shared Control Centre.
> The Control Centre integration is deliberately out of scope — this project is managed directly
> from Jira and GitHub.

---

## Project Structure (actual — as of Sprint 1)

```
synpro-website/
├── src/
│   ├── pages/
│   │   └── index.astro       # The placeholder page — the site's only route
│   ├── layouts/
│   │   └── BaseLayout.astro  # Page shell: head, global stylesheet, <slot />
│   └── components/           # Empty (.gitkeep) — populated as sections are built
├── public/                   # Static passthrough — copied verbatim into dist/
│   ├── CNAME                 # CRITICAL — custom domain; must survive every build
│   └── logo.png
├── .github/
│   └── workflows/
│       └── ci.yml            # build, format, links, deploy, auto-merge
├── astro.config.mjs
├── package.json
├── package-lock.json
├── .prettierrc.json
├── .prettierignore
├── .linkinatorrc.json        # Link-checker config — skips external URLs
├── .gitignore
├── CLAUDE.md
├── CLAUDE_HISTORY.md
├── PROJECT_CONTEXT.md
├── RUNBOOK.md
├── PROMPT_TEMPLATE.md
├── HANDOFF_TEMPLATE.md
├── README.md
│
├── index.html                # LEGACY ROOT COPIES — still what Pages serves.
├── logo.png                  # Do not delete until the Pages source flip is
└── CNAME                     # verified. Removal is a Sprint 2 task.
```

> Not yet created: `src/content/` (content collections) and `worker/` (the Cloudflare Worker
> contact-form endpoint). Both arrive in the sprint that takes them.

> `Documentation/` sits at the repo root, is untracked, and is canonical. Never `git clean` it.

---

## Jira Configuration

| Setting | Value |
|---|---|
| Site | `synproconsulting.atlassian.net` |
| Project key | `SWEB` |
| Project ID | `10099` (company-managed / classic) |
| Jira board ID | `100` (Scrum) |
| Story issue type ID | `10007` |
| Sprint field | `customfield_10020` |
| Story points field | **`customfield_10036`** ("Story Points") |
| Execution order field | `customfield_10071` |
| Sprint fix version IDs | Sprint 1 → `11066` |
| Native sprint IDs | Sprint 1 → `1039` |

> **Story points is `customfield_10036`, not `customfield_10016`.** SWEB is a company-managed
> project and board 100's configured estimation field is `customfield_10036` ("Story Points").
> `customfield_10016` ("Story point estimate") is the team-managed equivalent used by FPRM and is
> **not** the field this board estimates on. Setting it would leave the board reading zero points.
>
> All three fields existed site-level with global contexts but were **absent from the SWEB
> screens** at Sprint 1 setup — field context and screen membership are different things, and a
> global context does not put a field on a screen. `customfield_10036` and `customfield_10071`
> were added to screen `10079` (Story/Task, tab `10082`) and screen `10080` (Bug, tab `10083`).
> Verify with `GET /rest/api/3/issue/createmeta/SWEB/issuetypes/10007`, not with
> `GET /rest/api/3/field` — the latter only proves the field exists somewhere on the site.

**Sprint query pattern:**
```python
jql = f"project = SWEB AND (fixVersion = {fix_id} OR sprint = {native_id})"
```

> These two custom field IDs are site-level and shared with the FPRM project, but screen
> configuration is per-project. Confirm both are on the SWEB create/edit screens before the first
> sprint setup — a missing field fails the ticket create with a cryptic 400.

---

## CI/CD Pipeline

Blocking and non-blocking jobs are defined in `.github/workflows/ci.yml`. The auto-merger's
blocking check list must exactly match the jobs marked blocking below — **if the list is empty or
stale, the auto-merger merges on nothing.**

| Job ID | What it does | Blocking? |
|---|---|---|
| `build` | `npm ci`, `npm run build`, then asserts `dist/CNAME` exists and equals `synproconsulting.co`; uploads `dist/` as an artifact | **Yes** |
| `format` | `prettier --check` across `src/` and the root config files | **Yes** |
| `links` | Downloads the `build` artifact and runs linkinator over it; internal links only | **Yes** |
| `deploy` | Publishes the artifact to GitHub Pages (`main` only, `continue-on-error: true`) | No |
| `auto-merge` | `needs: [build, format, links]` — squash-merges the PR (non-`main` only) | n/a |

> The blocking check list **is** the `needs:` array on the `auto-merge` job: `[build, format, links]`.
> There is no separately configured check-name list to drift out of sync — renaming a job id is the
> only way to break the gate, and doing so without updating `needs:` makes the merger either merge
> on nothing or block forever.
>
> Jobs not yet present: worker tests (no Worker) and the accessibility/performance audit.

> **Porting note:** the rule-based auto-merger job is carried over from
> `synproconsulting/Fracttal-PRM` `.github/workflows/ci.yml`. Read that file before writing this
> one; adapt the blocking check names to the jobs above. Do not write a new auto-merger from
> scratch.

---

## Secrets and Environment

| Secret | Where it lives | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Provided automatically by Actions | Pages deploy |
| `RESEND_API_KEY` | Cloudflare Worker secret store **only** | Email delivery |
| Classic GitHub PAT | Local `.env` only | Claude Code branch/PR operations |

The existing classic PAT (repo + workflow scope) used for Fracttal PRM works across every repo in
the `synproconsulting` org. No new token is required.

**Never paste any credential into a chat interface.** Tokens go directly into `.env` or the
provider's secret store, edited manually.

---

## Key Conventions

- **Commit format:** `feat(sweb-XX): description` (conventional commits)
- **PR title format:** `feat(SWEB-XX): description` / `fix(SWEB-XX): description`
- **Story points:** Fibonacci — 1, 2, 3, 5, 8 (max 8 per story)
- **Execution order:** `customfield_10071` — determines implementation sequence
- **Acceptance criteria:** written in Atlassian Document Format in Jira descriptions
- **PR bodies:** always built from a file (`--body-file`), never an inline shell string

---

## Known Issues / Technical Debt

*None yet — this section is populated as the project runs. Active items only; historical
follow-ups live in `CLAUDE_HISTORY.md`.*

- **Cloudflare Worker not yet created.** The contact form has no endpoint. Until the sprint that
  takes it, the site has no working contact path.
- **Repo is public.** GitHub Pages on a free plan requires it. Nothing in these docs is sensitive, but every future commit is world-readable — never commit a secret, an internal contact, or client-identifying material.
- **Pages source still on branch-root deploy.** The `deploy` job is expected to fail on every run
  until the owner switches Settings → Pages → Source to "GitHub Actions". It is
  `continue-on-error: true`, so it cannot block a merge — but per AD-6 that also means it can stay
  red unnoticed. Re-check it at the next closeout.
- **Root `index.html`, `logo.png`, and `CNAME` are duplicated in `public/`.** Both copies exist
  deliberately: Pages still serves the root, so deleting it would take the site down. Removing the
  root duplicates is a **Sprint 2 task**, to be done only after the source flip is verified on the
  `github.io` origin URL.
- **CSS minification is disabled** (`vite.build.cssMinify: false` in `astro.config.mjs`). The
  default minifier strips `-webkit-background-clip: text` while retaining
  `-webkit-text-fill-color: transparent`, which renders the gradient "coming soon" text invisible
  on engines without unprefixed `background-clip`. Revisit only with a browserslist-driven
  Lightning CSS target, and re-verify that rule renders before re-enabling.

---

## Backlog (do not implement without explicit scope confirmation)

- Analytics and the cookie/privacy notice it would require
- Blog or case-study content collection
- Multi-language content
- Any second dynamic surface (see AD-1)

---

## Tools Available

- **Claude Code** — Dev Agent for all implementation
- **Atlassian Rovo MCP** — available for direct Jira management from Claude chat

---

*Created: 2026-08-06 — project bootstrap, pre-Sprint-1.*
