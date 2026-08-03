# SynPro Website — Project Context (Detail)

> Companion to CLAUDE.md. CLAUDE.md is the session-start summary; this file holds the
> full detail the prompt template reads: endpoints, structure, ADs (full text), and
> design standards. Read both at the start of every session.

> Section numbering matches the Fracttal PRM PROJECT_CONTEXT so PROMPT_TEMPLATE.md
> Section 6 update instructions map 1:1. Sections that do not apply to a static site
> are marked **N/A (static site)** rather than removed, so the mapping stays intact.

---

## Section 1 — API Endpoints

**N/A (static site).** This project has no backend and exposes no API endpoints.

The single outbound integration is the contact form, which POSTs to a third-party
form endpoint (see AD-2). That endpoint is owned and operated by the form vendor, not
by this project. When the form is built, record here: the vendor, the endpoint URL,
the public form identifier (safe to expose), and the expected success/error responses.

_Currently: form not yet built._

---

## Section 2 — Database Schema

**N/A (static site).** No database, no migrations, no Alembic. There is no persistent
server-side state in this project. Lead submissions live in the form vendor's system,
not here.

---

## Section 3 — Component / File Structure

The site is hand-authored static files served by GitHub Pages from `main` `/root`
(AD-1). There is no framework and no build output directory.

**Current repo root:**

```
/
├── index.html          # holding page: inline CSS, Sora webfont, no build step
├── logo.png            # transparent SynPro logo (blue→green swirl mark)
├── CNAME               # contains: synproconsulting.co  (AD-3 — do not remove)
├── CLAUDE.md           # canonical
├── CLAUDE_HISTORY.md   # canonical
├── PROJECT_CONTEXT.md  # canonical (this file)
├── RUNBOOK.md          # canonical
└── PROMPT_TEMPLATE.md  # governs Claude chat as prompt author
```

**Planned structure** (to be realised across sprints — update this tree as pages land):

```
/
├── index.html          # home
├── services.html       # Facilities & Workplace Advisory
├── about.html
├── contact.html        # lead-capture form (AD-2)
├── assets/
│   ├── css/site.css    # single shared stylesheet — brand tokens as :root vars (AD-8)
│   ├── js/site.js      # small vanilla JS: mobile nav, form UX, shared-chrome includes
│   └── img/            # logo variants, og image, favicon set
├── CNAME
└── (canonical docs + template as above)
```

Shared chrome (header/footer/nav) is duplicated across pages or assembled with small
vanilla-JS includes — never a templating engine (AD-1).

---

## Section 4 — Auth / Roles

**N/A (static site).** No authentication, no roles, no sessions. The site is fully
public. The GitHub repository is public (see the secrets Hard Rule in CLAUDE.md).

---

## Section 5 — Deployment

- **Host:** GitHub Pages, repo `synproconsulting/synpro-website`, branch `main`, `/root`.
- **Custom domain:** `synproconsulting.co`, pinned by the root `CNAME` file (AD-3).
- **DNS (Namecheap):** four GitHub apex `A` records
  (`185.199.108.153` / `.109.153` / `.110.153` / `.111.153`) + `www` CNAME →
  `synproconsulting.github.io`. HTTPS enforced (GitHub-issued TLS).
- **Deploy trigger:** merge to `main` — GitHub Pages redeploys automatically. No build.
- **DNS boundary:** website DNS changes touch ONLY those five records. The domain's
  mail records (MX → Exchange Online, SPF, DKIM selector1/selector2, DMARC `p=reject`,
  the `send.contact` Resend records, autodiscover) are off-limits to this project
  (Hard Rule, CLAUDE.md).

Full operational detail, including rollback, lives in RUNBOOK.md.

---

## Section 6 — Architectural Decisions (full text)

> CLAUDE.md carries the one-line summary of each AD; the authoritative
> Decision / Why / Consequence / Do-not text lives here.

### AD-1 · Static, hand-authored site — no build step, no framework
**Decision.** The site is plain HTML/CSS/JS served directly by GitHub Pages from
`main` `/root`. No bundler, framework, `node_modules`, or Jekyll.
**Why.** Zero build means the deployed artifact is exactly what is in the repo:
nothing to break in a pipeline, instant deploys, and CI stays a lint/link/Lighthouse
check rather than a build-and-bundle.
**Consequence.** Shared markup (header/footer/nav) is duplicated across pages or
assembled with small vanilla-JS includes, not a templating engine. Any interactivity
is vanilla JS.
**Do not.** Introduce React/Vue/Svelte/Vite/Jekyll or any build tooling without a
superseding AD — it changes the Pages deployment model and the CI shape.

### AD-2 · Lead capture uses a third-party form endpoint — no backend
**Decision.** The contact / lead-capture form POSTs to a third-party endpoint
(Formspree or Web3Forms; final vendor chosen in the sprint that builds the form).
**Why.** A static site cannot process a form server-side; a third-party relay avoids
standing up and securing a backend purely to receive form submissions.
**Consequence.** The form's public identifier (e.g. a Formspree form ID) lives in the
client HTML — public-by-design and safe in a public repo. Spam mitigation is the
vendor's honeypot/captcha plus a client-side honeypot field. Submissions live in the
vendor's dashboard, not in this repo.
**Do not.** Put any secret key in the markup, and do not add a backend service to
handle the form without a superseding AD.

### AD-3 · Custom domain pinned by the repo `CNAME` file
**Decision.** `synproconsulting.co` is bound to GitHub Pages by the root `CNAME` file
plus the four apex `A` records and `www` CNAME at Namecheap.
**Why.** The `CNAME` file is the repo-side half of the custom-domain binding. Without
it, Pages reverts to the `github.io` URL and the custom-domain HTTPS certificate
breaks.
**Consequence.** Every PR must preserve `CNAME`. Site DNS changes touch only the four
`A` records and `www` CNAME — never mail records.
**Do not.** Let any tooling or GitHub UI operation strip the file; if it disappears,
restore it immediately.

### AD-4 · Jira sprints tracked via fix versions, not native Agile sprints
**Decision.** Sprints assigned via Jira's `fixVersions`; JQL dual-queries
`fixVersion = {fix_id} OR sprint = {native_id}`.
**Why / Consequence / Do not.** Carried unchanged from Fracttal PRM AD-4 — same Jira
instance and workflow. See that project's PROJECT_CONTEXT for the original rationale.

### AD-5 · All GitHub operations use the REST API
**Decision.** Branches, commits, and PRs are created via the GitHub Contents API and
Git Trees API over HTTP — no `git` binary for repo mutations.
**Why.** Keeps the Dev Agent's actions auditable and reproducible without a local
git dependency.
**Consequence.** The local `git` commands in CLAUDE.md Hard Rules are for the
human-run working-tree sync only, not for repo mutations.
**Do not.** Shell out to `git push`/`git commit` as the Dev Agent.

### AD-6 · Feature branches recreated from `main`, never updated in place
**Decision.** Before creating a branch, delete any existing branch of the same name
and recreate fresh from the latest `main` SHA.
**Why.** Guarantees clean diffs and avoids drift from stale branches.
**Do not.** Reuse or rebase an existing same-named branch.

### AD-7 · Accessibility and performance are acceptance criteria
**Decision.** Every page ticket includes semantic landmarks, alt text on all imagery,
sufficient contrast on the dark theme, keyboard-navigable interactive elements, a
`prefers-reduced-motion` path for animation, and a Lighthouse pass (perf + a11y) as a
done-check.
**Why.** A marketing site is judged on first impression and must be reachable by
everyone; the dark palette makes contrast a genuine risk.
**Consequence.** CI runs Lighthouse CI; a page failing contrast or shipping un-alt'd
images is not done.
**Do not.** Defer accessibility to "later" — it is a per-ticket gate.

### AD-8 · Brand tokens defined once as CSS custom properties
**Decision.** The palette, gradients, and type scale are declared as `:root` CSS
variables in the single shared stylesheet and referenced everywhere.
**Why.** Keeps the swirl/dark identity consistent as pages multiply; makes a future
rebrand a one-file change.
**Do not.** Hardcode raw hex values per element.

---

## Section 7 — Frontend Design Standards

**Brand tokens (canonical — declared as `:root` vars per AD-8):**

| Token | Value |
|---|---|
| Deep blue | `#00257B` / `#064DAF` |
| Forest green | `#1E8801` |
| Lime | `#A1C60C` |
| Background base | `#0a0f1c` |
| Background mid | `#111a2e` |
| Background warm top | `#16223d` |
| Ink (text) | `#eaf0fb` |
| Muted | `#8a97ad` |
| Typeface | **Sora** (400 / 500 / 600) |

**Visual language:**
- Dark background with a top-anchored radial gradient (base → mid → warm top).
- The logo's blue→green swirl is the core motif; ambient auras (blue upper-left,
  green lower-right) may frame hero sections — kept subtle.
- Dividers and accent lines use a blue→lime linear gradient.
- The tagline **FACILITIES & WORKPLACE ADVISORY** is set uppercase with wide letter-
  spacing, echoing the "CONSULTING" treatment in the logo mark.
- Generous whitespace; content weighted slightly above centre on full-height sections.

**Layout & interaction standards** (extend as pages land):
- Mobile-first; every page works from ~360px up.
- One shared header/footer treatment across all pages.
- Animations respect `prefers-reduced-motion`.
- Interactive elements are keyboard-reachable with visible focus states.
- Imagery carries meaningful `alt`; decorative imagery is `alt=""`/`aria-hidden`.

---

*Last updated: 2026-08 — initial scaffolding, pre-Sprint-1.*
