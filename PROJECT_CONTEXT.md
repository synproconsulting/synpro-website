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

*Populated as pages and components are built.*

Record here: the page inventory with route and purpose, the shared layout and what it owns
(head/meta, nav, footer), and each reusable component with the props it takes.

---

## 4. CI/CD Logic

### Job summary

*Populated when `ci.yml` is written in Sprint 1.*

Must record: every job, its trigger condition, whether it blocks, and what it does — matching the
table in `CLAUDE.md`. The blocking list here and the auto-merger's configured check names must be
kept identical; a drift between them means either the merger blocks forever or merges on nothing.

### Deploy

GitHub Pages, published from the build artifact on `main`. Note the `CNAME` passthrough
requirement (AD-9) wherever the build output directory is configured.

### Auto-merger

Ported from `synproconsulting/Fracttal-PRM` `.github/workflows/ci.yml`. Record any adaptation
made during the port so the two can be reconciled later if the shared pattern evolves.

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
