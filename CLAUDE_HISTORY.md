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
2. **An unticketed session still needs a docs-sync follow-up.** FPRM's "Post-Sprint 20 UX &
   Workflow Fixes" (PRs #128–#163, closed 2026-05-22) ran with no Jira ticket, driven by direct
   browser testing of the Sprint 20 deliverables; the owner opted to run polish interactively and
   reconcile docs in a follow-up sweep. Its own recorded lesson: skipping Jira during a polish run
   is fine when the owner is driving the punch list, but the four canonical docs still need a
   single reconciliation PR at the end.
3. **Build PR bodies from a file.** Inline shell strings containing backticks trigger command
   substitution and publish a mangled PR body.
4. **Drive multi-step git/PR flows through one self-guarding script** that checks each step's
   exit status and fails loudly, rather than firing steps individually and guessing at results
   from buffered console output.

---

## Sprint 1 — Bootstrap: Astro Scaffold, CI Pipeline, Actions Deploy  ·  2026-08-06

**PRs merged:** #1, #2 (SWEB-6 correction)
**Fix version / native sprint:** `11066` / `1039`
**Jira keys:** SWEB-1 … SWEB-6
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Visually unchanged — a visitor sees exactly the placeholder they saw
before: same logo, tagline, divider, "coming soon" wording, colours, and animations. **The delivery
path did change, unexpectedly.** The `deploy` job succeeded on the first merge and
`synproconsulting.co` is now served from the Astro build artifact rather than the `main` branch
root. The Pages API still reports `build_type: legacy` / `source: main/`, so the stored setting and
the serving reality disagree; the owner action to set Source = "GitHub Actions" is still open, and
the root `index.html` / `logo.png` / `CNAME` must stay until it is done. GitHub's stock
`pages build and deployment` workflow also fails on every push to `main` — **pre-existing, failing
on the untouched pre-sprint commit `0a91a1c` before any sprint work landed**, and harmless because
it never produces an artifact.

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
6. **A predicted failure was written into the docs as fact, and was wrong (SWEB-6).** Sprint 1
   asserted in `ci.yml`, `CLAUDE.md`, and `PROJECT_CONTEXT.md` that the `deploy` job would fail
   until a manual Pages source switch. It succeeded on the first run and took over serving
   production. **Do not document a prediction in the present tense.** State what was observed, and
   if something must be predicted, mark it as a prediction and verify it at closeout.
7. **`build_type` does not tell you which deploy path is serving.** The Pages API reported
   `legacy` / `source: main/` while the Actions artifact was demonstrably live. The reliable check
   is to fetch the live HTML and compare it against `dist/` — the two candidate sources produce
   different byte counts, so the comparison is unambiguous.
8. **"Zero visible change" needs to be proven, not assumed.** The live page was verified byte-wise
   against the build and rule-by-rule against the original stylesheet. That check is what caught
   the two would-be regressions (lessons 3 and 4) and what confirmed this deploy-path change was
   invisible to visitors.

---

## Docs Correction — Canonical Doc Defects from Bootstrap  ·  2026-08-06

**PRs merged:** #4
**Fix version / native sprint:** `11066` / `1039` (folded into the Sprint 1 release)
**Jira keys:** SWEB-7 (Bug)
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Unchanged. Docs-only PR — no file under `src/`, `public/`, or
`.github/` was touched, and no behaviour changed.

### Why this existed

Three factual defects were found in the canonical docs. **All three originated in bootstrap
authoring, not in Sprint 1 execution** — they were written into the docs before Sprint 1 began and
were carried forward untouched. Each was a claim about the sibling Fracttal PRM project, asserted
without reading FPRM's files.

### What was wrong

1. **AD-4 was inverted.** Ours said sprints are tracked via fix versions **AND** native Agile
   sprints, presenting both as co-equal mechanisms. FPRM `PROJECT_CONTEXT.md` §6 actually reads
   *"tracked via fix versions, **not** native Agile sprints"* — fix versions are the mechanism, and
   the dual JQL query is a *consequence* of that choice, not a second mechanism. Restated in
   `PROJECT_CONTEXT.md` §6 and `CLAUDE.md`, with a note that SWEB populates both fields so tickets
   also land on board 100.
2. **An invented duration.** "SonarCloud failed on every run for twenty-plus sprints." FPRM states
   only that the scan fails on every CI run and is non-blocking. No duration appears anywhere in
   FPRM's docs; "twenty-plus sprints" was fabricated. Removed from `PROJECT_CONTEXT.md` §6 and
   `RUNBOOK.md` §8. The substantive lesson — advisory jobs can fail unnoticed, so review them at
   closeout — is correct and was kept.
3. **A fabricated event.** "FPRM needed a catch-up reconciliation session after four PRs shipped
   without doc updates." No such event exists. The only "four PRs" references in FPRM's history are
   about the auto-merger merging four PRs quickly. Replaced with the real, verified event: FPRM's
   *Post-Sprint 20 UX & Workflow Fixes* (PRs #128–#163, closed 2026-05-22) — an unticketed session
   driven by direct browser testing, which needed a single docs reconciliation PR at the end.

Also in this PR: `PROMPT_TEMPLATE.md` §5 gained subsection 5a requiring that any prompt creating
Jira tickets reference an owner-approved `SWEB_Sprint<n>_Jira_Tickets.md` and that Claude Code
transcribe it rather than author ticket content. Sprint 1 is recorded there as a known deviation,
not a precedent.

### ADs recorded
None. AD-4 was corrected, not replaced — its number and meaning are unchanged from FPRM's original.

### Lessons
1. **Claims about project history must be verified against the source files before being written
   into a canonical doc.** These docs are read at the start of every session and presented as
   ground truth, so a fabricated claim does not stay contained — it is quoted forward as fact. All
   three defects were plausible, specific, and completely invented.
2. **Fabrications cluster in quantities.** Two of the three defects were numbers — "twenty-plus
   sprints", "four PRs". Numbers are the most quotable part of a claim and the most likely to be
   confabulated when reconstructing from memory. If the source states no number, state no number.
3. **The correction prompt was right to say "do not trust the corrections on their authority".**
   Verifying rather than transcribing caught two things the prompt itself got wrong — see the note
   below.
4. **One claim survived scrutiny, and that matters too.** "A rate limiter was green in CI and inert
   in production for weeks" was checked against FPRM: AD-44 shipped 2026-06-02, the fix (AD-46 /
   FPRM-460) merged 2026-06-19 — roughly 17 days inert. Supported, so it was left alone. Verifying
   a claim and finding it sound is a real outcome; the goal is accuracy, not deletion.

### Correction-prompt inaccuracies found during verification
- The prompt implied FPRM's `PROMPT_TEMPLATE.md` carries the tickets-document requirement. It does
  not — FPRM's §5 lists only files/changes/preservation/boundary constraints. The *practice* is
  real and evidenced elsewhere (`FPRM_Phase<n>_Jira_Tickets.md` in FPRM `RUNBOOK.md` §9), but the
  requirement is a genuine addition to both projects' templates, not a gap unique to SWEB.
- The prompt cited `FPRM_Sprint25_Jira_Tickets.md`. FPRM's tickets documents are **phase**-based
  (`FPRM_Phase1..4_Jira_Tickets.md`); only the *prompts* are sprint-based. That exact filename
  appears nowhere in FPRM's canonical docs and could not be verified — FPRM's `Documentation/` is
  untracked and not in the repo.

---

*Next entry: Sprint 2.*
