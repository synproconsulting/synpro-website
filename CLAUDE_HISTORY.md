# SynPro Consulting Website — Session & Sprint History

> Append-only record of what each session and sprint delivered.
> Written in the **same PR** as the change it records — never as a follow-up.
> `CLAUDE.md` holds current state; this file holds how it got there.

---

## Entry Format

Every entry uses this shape. Do not abbreviate it — the value of this file is that a future
session can reconstruct the project's state at any point without reading the diff history.

```
## Sprint <n> — <Theme>  ·  <YYYY-MM-DD>

**PRs merged:** #<n> (+ #<n> if a hotfix folded in)
**Fix version / native sprint:** <id> / <id>
**Jira keys:** SWEB-<first> … SWEB-<last>
**Blocking CI checks at close:** <list>
**Live site state at close:** <what a visitor sees / what changed for them>

### What landed
- <one line per deliverable, with its Jira key>

### ADs recorded
- <AD-n · title>  — or "None"

### Lessons
1. <what went wrong or was learned, stated so it prevents a recurrence>
```

---

## Pre-Sprint-1 — Project Bootstrap · 2026-08-06

**PRs merged:** *(none yet)*
**Jira keys:** *(none yet — SWEB project created, empty)*

### Starting state inherited, not built

The domain and a placeholder page were already live before this project's first sprint. Recorded
here because a future session reading only the sprint log would otherwise assume Sprint 1 created
them:

- `synproconsulting.co` registered at Namecheap, DNS configured with the four GitHub Pages apex
  A records (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and a `www` CNAME to
  `synproconsulting.github.io.`
- The prior Namecheap URL Redirect record (`@` → `www`) was removed — it was the source of the
  apex-domain timeout and conflicted with the A records.
- GitHub Pages enabled on `synproconsulting/synpro-website`, deploying from `main` branch root.
  GitHub auto-committed a `CNAME` file to the repo root when the custom domain was saved.
- TLS certificate issued; Enforce HTTPS enabled.
- A single-page dark placeholder (logo + "coming soon") is what visitors currently see.
- Resend sender domain `contact.synproconsulting.co` already verified from the Fracttal PRM
  programme — reusable here with no additional DNS work.

### Decisions taken at bootstrap
- Hosting stays on GitHub Pages. Moving to Cloudflare Pages or Netlify was considered and
  rejected: it would buy one function endpoint at the cost of repointing apex DNS on a domain
  whose mail records were newly stabilised.
- Framework: Astro — component reuse and Markdown content without shipping client JavaScript.
- Contact form: Cloudflare Worker calling Resend, chosen over a third-party form service so that
  enquiries send from the already-verified SynPro domain and the enquiry-type field can route.
- Control Centre integration: explicitly out of scope. This project is managed from Jira and
  GitHub directly.

### Lessons carried in from the Fracttal PRM programme
1. **A runtime control that passes CI can be completely inert in production.** FPRM's rate
   limiter was green in CI for weeks while never engaging in production, because CI's test client
   presents a stable peer address and the real proxy chain does not. Any control on the form
   endpoint must be exercised against the live URL.
2. **Docs that do not travel with the PR go stale immediately.** FPRM needed a catch-up
   reconciliation session after four PRs shipped without doc updates. The rule exists because it
   was learned the expensive way.
3. **Build PR bodies from a file.** Inline shell strings containing backticks trigger command
   substitution and publish a mangled PR body.
4. **Drive multi-step git/PR flows through one self-guarding script** that checks each step's
   exit status and fails loudly, rather than firing steps individually and guessing at results
   from buffered console output.

---

## Sprint 1 — Bootstrap: Astro Scaffold, CI Pipeline, Actions Deploy  ·  2026-08-06

**PRs merged:** #1
**Fix version / native sprint:** `11066` / `1039`
**Jira keys:** SWEB-1 … SWEB-5
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Unchanged. A visitor sees exactly the placeholder they saw before —
same logo, tagline, divider, "coming soon" wording, colours, and animations. Pages is still
serving the `main` branch root; the Actions deploy path is built but not yet switched on.

### What landed
- **SWEB-1** — Astro `7.2.0` scaffold authored directly (no interactive `npm create astro`):
  `package.json`, `astro.config.mjs`, `.gitignore`, `src/{pages,layouts,components}/`, `public/`,
  Prettier + `prettier-plugin-astro`, and a committed `package-lock.json`.
- **SWEB-2** — Placeholder rebuilt as `BaseLayout.astro` + `index.astro`. `logo.png` and `CNAME`
  copied into `public/`. Root copies deliberately retained.
- **SWEB-3** — `.github/workflows/ci.yml` with three blocking jobs and the Fracttal PRM
  auto-merger ported across, gating on `[build, format, links]`.
- **SWEB-4** — Pages deploy job wired (artifact upload, `github-pages` environment, `pages: write`
  / `id-token: write`, `main`-only, `continue-on-error`). The source switch itself is an
  outstanding manual owner action.
- **SWEB-5** — `README.md` added.

### ADs recorded
None. No new architectural decision was made — Sprint 1 implemented AD-1, AD-2, AD-3, AD-6, and
AD-9 as already written. AD-9 in particular moved from stated intent to enforced invariant via the
`build` job's `dist/CNAME` assertion.

### Lessons
1. **A global field context does not put a Jira field on a screen.** All three custom fields
   (`Sprint`, `Story Points`, `Execution Order`) existed site-level with `isGlobalContext: true`,
   and `GET /rest/api/3/field` happily returned them — yet ticket creation would have silently
   dropped points and execution order, because none were on the SWEB screens. Verify with
   `GET /rest/api/3/issue/createmeta/{key}/issuetypes/{id}`, which reflects the actual screen.
2. **The inherited field ID was wrong for this project.** `CLAUDE.md` carried
   `customfield_10016` from FPRM; board 100 actually estimates on `customfield_10036`. Company-
   managed and team-managed projects use different story-point fields. Read the board's
   `configuration` endpoint rather than inheriting an ID from a sibling project.
3. **A link checker can pass while scanning nothing.** The first linkinator configuration reported
   "Successfully scanned 0 links" and exited 0 — fully green, entirely inert. Cause: linkinator
   serves a local directory over `127.0.0.1`, so a skip pattern written as
   `^https?://(?!localhost)` matched the root itself and skipped the whole crawl. This is the
   FPRM-460 failure mode in a new costume. **Negative-test every control**: break something on
   purpose and confirm the check goes red. Both tests are recorded in `RUNBOOK.md` §8.
4. **A CSS minifier can silently delete a vendor prefix and make text invisible.** Lightning CSS
   dropped `-webkit-background-clip: text` while keeping `-webkit-text-fill-color: transparent`,
   which would have rendered the gradient "coming soon" text invisible on older engines. On a
   sprint whose whole premise was "zero visible change", the build tool was the thing about to
   change what a visitor sees. Diff the rendered output against the original, not just the source.
5. **PowerShell's `Out-File -Encoding utf8` writes a BOM**, which broke linkinator's JSON config
   parse and produced a misleading "config has no effect" symptom. Use
   `[IO.File]::WriteAllText()` for any config file a non-Windows tool will read.

---

*Next entry: Sprint 2.*
