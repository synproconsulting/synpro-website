# SynPro Website — Project Context

> This file is the single source of truth for Claude Code and Claude chat sessions.
> Load it at the start of every session to restore full project context.

> Sprint history lives in CLAUDE_HISTORY.md (created at first sprint closeout).

---

## What This Project Is

The public marketing website for SynPro Consulting — a static, statically-hosted site presenting the firm's Facilities & Workplace Advisory practice and capturing inbound leads via a contact form. Built and maintained by the same AI-powered Virtual Development Team model used for Fracttal PRM: Claude Code as the Dev Agent, a rule-based auto-merger as the Manager Agent, and direct Jira REST API calls for sprint setup.

**Owner:** Johan Wessels — SynPro Consulting
**Started:** August 2026
**Preferred model for Claude Code development sessions:** Claude Sonnet 5 (`claude-sonnet-5`) — use this model for all development sessions unless a specific sprint's planning session explicitly selects another.

---

## Current State

**Deployed:** a single-page holding site is live at `https://synproconsulting.co`, served by GitHub Pages from repo `synproconsulting/synpro-website` (branch `main`, `/root`). It renders a dark, gradient landing page — SynPro logo (transparent PNG), the tagline **FACILITIES & WORKPLACE ADVISORY**, a blue→green divider, and a "Website coming soon" line. Custom domain wired via four GitHub apex `A` records + a `www` CNAME at Namecheap; HTTPS enforced (GitHub-issued TLS). A `CNAME` file in the repo root pins the custom domain.

**Files at repo root:** `index.html` (self-contained: inline CSS, Sora webfont via Google Fonts, no build step), `logo.png` (transparent), `CNAME` (contains `synproconsulting.co`).

**Not yet built:** the full multi-section marketing site, the contact / lead-capture form, and the supporting CI + docs scaffolding. This is the work the first sprints will deliver.

**Brand tokens (from the live page — treat as canonical):**
- Deep blue `#00257B` / `#064DAF`, forest green `#1E8801`, lime `#A1C60C`
- Dark background gradient: base `#0a0f1c`, mid `#111a2e`, warm top `#16223d`
- Ink text `#eaf0fb`, muted `#8a97ad`
- Typeface: **Sora** (400/500/600)
- Motif: the logo's blue→green swirl; auras (blue upper-left, green lower-right)

---

## Live Deployments

| Service | URL |
|---|---|
| Production site | https://synproconsulting.co |
| GitHub Pages origin | https://synproconsulting.github.io/synpro-website/ |
| Repository | https://github.com/synproconsulting/synpro-website |

> Hosting is GitHub Pages (static). There is no backend service, no database, and no Railway deployment for this project. Lead capture is handled by a third-party form endpoint (see AD-2).

---

## Hard Rules

> These rules are non-negotiable and apply to every session and every change — no exceptions.

**Never commit directly to `main`.** All changes — including single-line fixes, copy edits, and documentation updates — must go through a `feature/` or `fix/` branch, a pull request, the CI pipeline, and the auto-merger. Committing directly to `main` bypasses the audit trail and CI gates. If a direct-to-main commit is ever made by mistake, open a retroactive PR immediately.

**Never delete or alter the `CNAME` file except through a deliberate, reviewed domain change.** The repo-root `CNAME` file contains `synproconsulting.co` and is what binds GitHub Pages to the custom domain. GitHub rewrites/removes it on some UI operations; every PR must preserve it. If it goes missing, the custom domain and HTTPS break until it is restored.

**Never touch DNS mail-authentication records when changing the site.** The site's DNS lives alongside the domain's mail records at Namecheap (MX → Exchange Online, SPF, DKIM `selector1`/`selector2`, DMARC `p=reject`, the `send.contact` Resend records, autodiscover). Website changes only ever concern the four GitHub apex `A` records and the `www` CNAME. A change to the site must never add, remove, or edit any mail record. (If a site change ever appears to require a DNS edit, stop and confirm in chat first.)

**The repository is PUBLIC — never commit a secret.** No API keys, form-endpoint secrets, access tokens, analytics private keys, or credentials of any kind may enter the repo. Anything sensitive is either a public-by-design identifier (e.g. a Formspree form ID, which is safe to expose) or is injected at deploy time — never hardcoded. Before any commit that adds a config value, confirm it is safe to be world-readable.

**No build step without an explicit, reviewed decision (see AD-1).** The site is hand-authored static files served directly by GitHub Pages. Do not introduce a bundler, framework, or `node_modules`-based build (React, Vite, Jekyll, etc.) without a new AD recording the decision — a build step changes the Pages deployment model and the CI shape.

**`PAT_TOKEN`, not `GITHUB_TOKEN`, for any `workflow_dispatch`.** GitHub blocks the built-in `GITHUB_TOKEN` from dispatching workflows. Any workflow-dispatch API call must use `PAT_TOKEN`.

**Never run two Claude Code instances simultaneously on this project.** Concurrent instances produce race conditions, duplicate PRs, and split-brain Jira state.

**Claude Code is the Dev Agent — all GitHub operations go through the REST API (no `git` binary required for repo mutations); do not invoke agent scripts directly.**

**The rule-based auto-merger is the Manager Agent.** PRs merge automatically when all blocking CI checks pass. Do not invoke manager scripts directly.

**Sprint setup is performed directly via Jira API calls.** Fix-version creation, native sprint creation, ticket assignment, execution order, story points, and priority are all done via direct Jira REST calls. No PM Agent scripts.

**One PR at a time — no exceptions.** Before opening any PR, verify zero PRs are currently open via the GitHub API. If one is open, wait for it to merge.

**Before opening any fix PR for a bug found during the current sprint, create a Jira bug ticket first**, assigned to the current sprint (fix version + native sprint), referenced in the PR title as `fix(SWEB-XX): description`. No fix PR without a corresponding ticket.

**Jira ticket lifecycle:** transition to In Progress before implementation; leave In Progress when the PR opens; transition to Done only when the PR is merged to `main` and confirmed by the auto-merger. Never Done on PR open.

**Canonical docs travel in the same PR as the change that caused them.** CLAUDE.md, CLAUDE_HISTORY.md, and PROJECT_CONTEXT.md must be updated in the same branch and PR as the implementation change. If a PR changes content structure, page routes, the form, or the deployment shape, it is incomplete until the canonical docs reflect it. The only exception is a pure docs PR with no code change (e.g. adding an AD).

**When Claude Code flags a discrepancy at the end of its output, resolve it in the current PR — never defer.**

**Claude chat must follow `PROMPT_TEMPLATE.md` when generating Claude Code prompts.** That file defines the mandatory prompt structure (pre-flight sync, zero-PR check, canonical-doc reads, source-file reads, implementation, docs update, PR rules, closeout report, post-flight sync). CLAUDE.md governs Claude Code as Dev Agent; PROMPT_TEMPLATE.md governs Claude chat as prompt author.

**Every Claude Code session starts with a clean working tree pulled from `main`.** Before starting:

```cmd
cd "C:\Johan\SynPro Consulting\SynPro Website"
git fetch origin
git status
git checkout main
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

This discards untracked/modified files from a prior session and aligns exactly with `origin/main`, preserving the local-only `Documentation/` folder. `git pull` alone is insufficient — it does not remove untracked files.

**Every Claude Code session ends with a post-flight sync after the final PR merges:**

```cmd
cd "C:\Johan\SynPro Consulting\SynPro Website"
git fetch origin
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

**Never run `git clean -fd` without `--exclude=Documentation/`.** The repo-root `Documentation/` folder is untracked but canonical (RUNBOOK.md, sprint prompts, brand assets, source logos). A bare `git clean -fd` would delete it, including the prompt being executed.

---

## Key Architectural Decisions

These are conscious design choices that must not be accidentally reversed. Full Decision / Why / Consequence / Do-not text lives in PROJECT_CONTEXT.md Section 6.

### AD-1 · Static, hand-authored site — no build step, no framework
The site is plain HTML/CSS/JS served directly by GitHub Pages from `main` `/root`. No bundler, no framework, no `node_modules`, no Jekyll. **Why:** zero build means the deployed artifact is exactly what is in the repo — nothing to break in a pipeline, instant deploys, and CI stays a lint/link-check rather than a build. **Consequence:** shared markup (header/footer/nav) is duplicated across pages or assembled with small vanilla-JS includes, not a templating engine. **Do not** introduce React/Vue/Vite/Jekyll without a superseding AD.

### AD-2 · Lead capture uses a third-party form endpoint — no backend
A static site cannot process a form server-side, so the contact / lead-capture form POSTs to a third-party endpoint (Formspree or Web3Forms; final vendor chosen in the sprint that builds the form). **Why:** avoids standing up and securing a backend purely for form relay. **Consequence:** the form's public identifier (e.g. Formspree form ID) lives in the client HTML — this is public-by-design and safe in a public repo; spam mitigation is the vendor's honeypot/captcha plus a client honeypot field. **Do not** put any secret key in the markup, and do not add a backend service to handle the form without a superseding AD.

### AD-3 · Custom domain is pinned by the repo `CNAME` file
`synproconsulting.co` is bound to GitHub Pages by the root `CNAME` file plus the four apex `A` records and `www` CNAME at Namecheap. **Why:** the `CNAME` file is the repo-side half of the custom-domain binding; without it Pages reverts to the `github.io` URL and HTTPS breaks. **Consequence:** every PR must preserve `CNAME`; DNS changes for the site touch only the four `A` records and `www` CNAME, never mail records. **Do not** let any tooling strip the file.

### AD-4 · Jira sprints tracked via fix versions, not native Agile sprints
Sprints are assigned via Jira's `fixVersions` field; JQL must dual-query `fixVersion = {fix_id} OR sprint = {native_id}` to catch all tickets. (Carried from Fracttal PRM AD-4 — same Jira instance and workflow.)

### AD-5 · All GitHub operations use the REST API
Branches, commits, and PRs are created via the GitHub Contents API and Git Trees API over HTTP — no `git` binary required for repo mutations. (The local `git` commands in Hard Rules are for the human-run working-tree sync only.)

### AD-6 · Feature branches are always recreated from `main`, never updated in place
Before creating a branch, delete any existing branch of the same name and recreate fresh from the latest `main` SHA, guaranteeing clean diffs.

### AD-7 · Accessibility and performance are acceptance criteria, not afterthoughts
Every page ticket includes: semantic HTML landmarks, alt text on all imagery, sufficient colour contrast against the dark theme, keyboard-navigable interactive elements, a `prefers-reduced-motion` path for any animation, and a Lighthouse pass (performance + a11y) as a done-check. **Why:** a marketing site is judged on first impression and must be reachable by everyone; the dark palette makes contrast a real risk. **Do not** ship a page that fails contrast or ships un-alt'd images.

### AD-8 · Brand tokens are defined once as CSS custom properties
The palette, gradients, and type scale in "Current State" are declared as `:root` CSS variables in a single shared stylesheet (or shared `<style>` include) and referenced everywhere — never hardcoded per element. **Why:** keeps the swirl/dark identity consistent as pages multiply and makes a future rebrand a one-file change. **Do not** paste raw hex values into individual pages.

---

## Backlog

> Candidate work for future sprints. Not committed until assigned a fix version.

- **Site structure & shared chrome** — home, services (Facilities & Workplace Advisory), about, contact; shared header/footer/nav, mobile nav.
- **Contact / lead-capture form** (AD-2) — fields, validation, honeypot, success/error states, vendor wiring, thank-you state.
- **CI pipeline** — HTML validation, link checker, Lighthouse CI (a11y + perf), auto-merger blocking-check set.
- **Content pass** — real copy for the advisory practice; replace "coming soon" with the live home page.
- **Fracttal PRM showcase** — if the site should present the PRM/CMMS capability as a product line.
- **SEO & metadata** — titles, descriptions, Open Graph/Twitter cards, `sitemap.xml`, `robots.txt`, favicon set.
- **Analytics** — privacy-respecting analytics (no secret keys in-repo).
- **Legal** — privacy notice / cookie handling if analytics or the form collect personal data.

---

## Tools Available

- **Claude Code** — Dev Agent for all implementation
- **Atlassian Rovo MCP** — available for direct Jira management from Claude chat
- **GitHub REST API** — all repo mutations (branches, commits, PRs)

---

## Jira

- **Project key:** `SWEB` _(placeholder — confirm or create the Jira project before the first sprint; update this line and every `SWEB-XX` reference to the real key)._
- Ticket references in PR titles use conventional commits: `feat(SWEB-XX): …`, `fix(SWEB-XX): …`, `docs(SWEB-XX): …`.
