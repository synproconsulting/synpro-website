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

**PRs merged:** #1, #2, #3 (#2 and #3 are both SWEB-6 corrections)
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

## Sprint 2 — Foundations and Housekeeping  ·  2026-08-07

**PRs merged:** #5, #6 (SWEB-11 hotfix, folded in)
**Fix version / native sprint:** `11099` / `1072`
**Jira keys:** SWEB-8 … SWEB-11
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Visually unchanged. A visitor sees the same placeholder — same logo,
tagline, divider, "coming soon" wording, colours, and animations — and the delivery path did not
change either: `synproconsulting.co` continues to serve the Actions artifact. Two things are new
but invisible on the page. `https://synproconsulting.co/robots.txt` now returns a disallow-all
directive, so the site is closed to crawlers until the cutover (AD-10). And the legacy branch-root
`index.html`, `logo.png`, and `CNAME` are gone — the custom domain and HTTPS survived their
removal, verified on the `github.io` origin URL first and then on the apex.

### What landed

- **SWEB-8** — `public/robots.txt` added, disallowing all user agents from all paths. It sits in
  the static passthrough so it is copied verbatim into `dist/` on every build, exactly as `CNAME`
  is under AD-9. No sitemap integration was added; a sitemap advertising disallowed routes would
  contradict the lockout. AD-10 recorded in `PROJECT_CONTEXT.md` §6 and summarised in `CLAUDE.md`.
- **SWEB-9** — Legacy branch-root `index.html`, `logo.png`, and `CNAME` deleted. Gated on the Pages
  API reporting `build_type: workflow`, which it did. Both root files were confirmed byte-identical
  to their `public/` counterparts by blob SHA before removal (`CNAME` `b35b949d`, `logo.png`
  `4e38674d`), so the deletion could not lose content. `CNAME` now exists in exactly one place, as
  AD-9 always intended.
- **SWEB-10** — Canonical docs reconciled with post-flip reality. The Pages-setting contradiction
  and the failing legacy Jekyll builder were both moved from live Known Issues to a new **Resolved**
  subsection in `CLAUDE.md`, in the past tense. `PROJECT_CONTEXT.md` §4's disagreement block was
  replaced by the durable lesson it produced. `RUNBOOK.md` gained the repo-root parking hazard
  (§6 and §10) and two entries in the §9 required-files list. The Sprint 1 PR-number error in this
  file was corrected against the API. A further change to `RUNBOOK.md` §8's expected link count was
  wrong and was reverted by SWEB-11 (PR #6) — see lesson 6.

### ADs recorded

- **AD-10 · The site is crawler-locked until the cutover PR.** `public/robots.txt` disallows every
  user agent for the duration of the build programme, and is lifted **only** in the cutover PR, in
  the same commit that publishes the nav and the real Home page.

### Lessons

1. **The canonical docs disagreed with each other about a fact both of them recorded.**
   `CLAUDE_HISTORY.md` said Sprint 1 merged PRs #1 and #2; `RUNBOOK.md`'s footer said #1–#3. The
   API settled it: **four PRs have ever merged — #1, #2, #3, #4** — of which #1–#3 were Sprint 1
   (`#2` and `#3` both SWEB-6 corrections) and `#4` was SWEB-7. `RUNBOOK.md` was right and
   `CLAUDE_HISTORY.md` was wrong, having omitted #3. This file exists so a future session can
   reconstruct state *without* reading diffs, which is exactly what makes a wrong number in it a
   defect rather than a cosmetic issue. Two docs recording the same fact independently is how the
   disagreement became visible at all — but only an API query could resolve it.
2. **A one-off `git clean` exclusion is a signal to move the file, not to keep the flag.** The
   first Sprint 2 pre-flight carried `--exclude=files.zip` to protect an untracked archive. The
   archive turned out to hold six stale duplicates of docs already tracked in the repo — nothing
   worth protecting. The same clean deleted `BIO_SOURCE.md`, three logo PNGs, and a `.pptx` from
   the repo root; originals existed elsewhere, so nothing was lost, but by luck rather than design.
   Recorded in `RUNBOOK.md` §6: source material lives outside the working directory, and the only
   safe places inside it are tracked, `Documentation/`, or `.gitignore`.
3. **A sprint can be blocked by a missing input rather than a missing capability.** The first
   attempt at this sprint stopped at the Section 1 gate because
   `Documentation\SWEB_Sprint2_Jira_Tickets.md` had not been saved into `Documentation/`. The gate
   worked as designed — the alternative was Claude Code authoring ticket content it was explicitly
   told to transcribe. `PROMPT_TEMPLATE.md` §5a is what made this a clean stop instead of six
   invented tickets.
4. **Retire a resolved Known Issue by rewriting it, not by deleting it.** Both the Pages-setting
   contradiction and the failing legacy builder cost real diagnostic time. Deleting them outright
   would leave a future session that encounters a trace of either — an old log, a stale comment —
   with no record that the question was already settled. They were moved to a **Resolved**
   subsection with the evidence that closed them, and the *lesson* each produced was kept in the
   live docs: `build_type` still does not tell you which deploy path is serving.
5. **Verify a retirement, do not assume it.** The claim "the source flip retires the legacy Jekyll
   builder" was a prediction in the Sprint 1 docs. It was checked before being written as fact:
   pushes to `main` for `17f2433`, `4abf377`, and `19fb7b8` each triggered a red
   `pages build and deployment` run, and the next push (`d41545e`) triggered none. That is the
   observation the past-tense rewrite rests on — Sprint 1 lesson 6 applied to Sprint 1's own text.
6. **Measure in the environment that governs, not the one you happen to be in. (Corrected by
   SWEB-11 — see below.)** This sprint changed `RUNBOOK.md` §8's expected link count from **2** to
   **3**, on the strength of a local `npm run links` run, and wrote a note calling the original 2
   wrong. **The original 2 was right.** CI — whose `links` job is the blocking check, and which runs
   against the published artifact — scans 2. The local 3 came from a Windows-only build artifact:
   `core.autocrlf=true` adds 203 bytes to `BaseLayout.astro`, pushing the stylesheet from 4013 to
   4216 bytes, across Astro's 4096-byte `inlineStylesheets: 'auto'` threshold, so it is emitted as a
   separate crawlable file locally and inlined in CI.

   The lesson is not "re-measure stale numbers" — that instinct was right, and the number genuinely
   was worth checking. The lesson is that **a measurement is only evidence about the environment it
   was taken in.** A blocking CI check's expected value has exactly one authority: the CI job log.
   Confirming the local number against `31219473015`'s `links` log before editing would have cost
   one API call and prevented the defect.

   This is the SWEB-7 failure shape reached by a different route: SWEB-7's quantities were
   fabricated from memory, this one was measured honestly and attributed to the wrong environment.
   Both end as a specific, plausible, wrong number in a doc that is read as ground truth. Fixed in
   PR #6.
7. **A local `format:check` failure is not automatically a defect.** Running it on Windows flags
   six files — including four this sprint never touched — because `core.autocrlf=true` gives the
   working tree CRLF while the repo stores LF and Prettier defaults to `endOfLine: "lf"`. CI runs
   on Linux and is green. The practical rule that follows: **never build a commit from the Windows
   working tree's bytes.** This sprint's blobs were pushed from LF content fetched via the Contents
   API, not read off disk, which is what kept the diff to real changes instead of a whole-file
   line-ending rewrite.

---

## Sprint 2 Hotfix — Link Count Reverted  ·  2026-08-07

**PRs merged:** #6
**Fix version / native sprint:** `11099` / `1072` (folded into the Sprint 2 release)
**Jira keys:** SWEB-11 (Bug)
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Unchanged. Docs-only PR — no file under `src/`, `public/`, or
`.github/` was touched, and no behaviour changed.

### Why this existed

PR #5 changed `RUNBOOK.md` §8's expected link-checker count from 2 to 3 and asserted the original
was wrong. It was not. The 3 was measured from a local Windows build; CI — the environment whose
`links` job is the blocking check — scans 2, per the job log for run `31219473015`.

### Root cause

`core.autocrlf=true` gives the Windows working tree CRLF line endings. `BaseLayout.astro` carries
203 CRLF pairs, so its `<style>` block is 203 bytes larger locally than the LF bytes in the repo.
That moves the generated stylesheet from 4013 to 4216 bytes, across Astro's 4096-byte
`inlineStylesheets: 'auto'` threshold:

| | Stylesheet | `dist/index.html` | Links |
|---|---|---|---|
| Local (CRLF) | separate `_astro/index.*.css` | 1093 B | 3 |
| CI / production (LF) | inlined | 5102 B | 2 |

Proven by converting `BaseLayout.astro` to LF locally and rebuilding — output became 5102 bytes,
stylesheet inlined, 2 links scanned. The file was restored immediately afterwards.

### What was fixed

- `RUNBOOK.md` §8 — count reverted to **2**, with the CI job log named as the authority and the
  CRLF/threshold mechanism recorded so the divergence is explainable rather than surprising.
- `RUNBOOK.md` §3 — warning added that the live-HTML-vs-`dist/` deploy check **false-negatives on a
  Windows checkout**, with two reliable alternatives. This was not theoretical: it fired during the
  Sprint 2 closeout and was briefly read as a failed deploy.
- `RUNBOOK.md` §10 — two rows added.
- `CLAUDE_HISTORY.md` — Sprint 2 lesson 6 rewritten.

Nothing under `src/`, `public/`, or `.github/` was changed, and the repo's line endings were left
alone. The repo correctly stores LF; only the local working copy differs, which is Git behaving as
configured.

### ADs recorded

None. No architectural decision changed — a measurement was attributed to the wrong environment.

### Lessons

1. **A blocking CI check's expected values belong to CI.** Any number a runbook gives for build
   output, artifact size, or scanned-link count should cite the job log it came from. One API call
   against `31219473015` would have prevented this.
2. **"Local build ≠ CI build" is a class of bug, not a one-off.** Line endings, Node version, and
   lockfile drift can each change build *shape* rather than just formatting. This one changed
   whether a stylesheet was a separate HTTP resource — visible in the link count, the page size,
   and the deploy-verification procedure. Worth suspecting first whenever local and production
   disagree in a way that looks like a failed deploy.
3. **The verification step is what caught it.** The Section 8 closeout requires comparing the live
   page against the build. That comparison failing is what surfaced both the false negative *and*
   the wrong number committed minutes earlier in the same session.

---

## Sprint 3 — Design System  ·  2026-08-07

**PRs merged:** #7
**Fix version / native sprint:** `11100` / `1073`
**Jira keys:** SWEB-12 … SWEB-14
**Blocking CI checks at close:** `build`, `format`, `links`
**Live site state at close:** Visually unchanged, and this time proven rather than asserted — the
rendered page is **pixel-identical** to the pre-sprint build at 1920×1080, 1280×800, 768×1024, and
375×812. Underneath it is a different site: the typeface is served from our own origin instead of a
third-party CDN, all styling comes from a token layer, and the page now carries a favicon, an
Apple touch icon, and an Open Graph card. `dist/index.html` grew from 5102 to 18705 bytes, entirely
from the inlined token stylesheet and the new `<head>` metadata.

> **This sprint ran across two sessions.** The first was cut off by an API error partway through
> SWEB-13, leaving the work uncommitted with no branch and no PR. The second session resumed from
> that working tree. See lesson 1.

### What landed

- **SWEB-12** — `.gitattributes` (`* text=auto eol=lf`, plus explicit `binary` for images, fonts
  and archives) and an explicit `build.inlineStylesheets: 'always'`. Together these remove both
  causes of the Sprint 2 local-vs-CI divergence. Proof: after re-checkout, a local `npm run build`
  produced `dist/index.html` **byte-identical to the live page** — 5102 bytes, SHA-256
  `C29ACF6C…0BA63` — where the same command had previously produced 1093 bytes.
- **SWEB-13** — `src/styles/{tokens,fonts,global}.css`. The brand palette sampled from the logo,
  kept deliberately separate from the placeholder's own `--ui-*` colours; surfaces, text, a fluid
  type scale, spacing, breakpoints, content max-width, motion, and focus tokens. Sora self-hosted
  as a single variable `.woff2` with its OFL licence beside it. `BaseLayout.astro` and
  `index.astro` refactored to consume tokens with no hardcoded colour, font, or spacing left.
- **SWEB-14** — `favicon.ico` (16/32/48), `apple-touch-icon.png` (180×180), `og-image.png`
  (1200×630), and the `<head>` wiring for all three plus a canonical link.

### ADs recorded

None. Sprint 3 implemented existing decisions rather than making new ones: AD-9's passthrough
pattern now carries fonts and icons as well as `CNAME`, and AD-10's lockout was left untouched.
The two substantive build decisions — `inlineStylesheets: 'always'` and the `.gitattributes`
policy — are recorded in `PROJECT_CONTEXT.md` §4 as build configuration, not as architectural
decisions, because either can be reversed without changing the shape of the system.

### Lessons

1. **The standard pre-flight sync is destructive to uncommitted work, and a resumed session must
   verify state instead of resetting it.** `git reset --hard origin/main` followed by
   `git clean -fd` is safe only because a normal session starts with nothing to lose. After the
   first session died mid-sprint, running it would have destroyed `.gitattributes`, `public/fonts/`,
   `src/styles/`, and both modified files — the entire body of SWEB-12 and SWEB-13. The resume
   replaced the sync with five explicit checks: HEAD equals `origin/main`, the modified and
   untracked file list matches expectation, no feature branch exists locally or remotely, the
   tickets document is present, and zero PRs are open. **A guarantee can be satisfied by
   verification as well as by reset**, and when the two conflict, verification is the one that does
   not lose work.
2. **A prior session's reported results are hearsay until reproduced — but they can be promoted to
   evidence rather than simply re-run.** The interrupted session left a `dist_before` directory it
   claimed was the baseline. Rather than trust it or rebuild from scratch, its SHA-256 was compared
   against the live site: identical, which *proves* it is `origin/main`'s published build. That
   converted an untrusted artefact into a verified one in a single command.
3. **Two fixes the first session had identified but not applied were still outstanding — and one of
   them was a wrong number.** `tokens.css` carried contrast ratios that were plausible estimates
   (15.85, 7.53, 16.44) rather than computed values (14.39, 6.94, 16.72). This is the SWEB-11
   failure mode surviving into a third sprint: numbers written into a canonical artefact before
   anyone measured them. Recomputed and corrected. **An interrupted session's half-finished
   intentions are exactly where unverified claims hide.**
4. **A verification grep must not be able to match its own explanation.** SWEB-13's acceptance
   criterion is "no font-CDN reference in `dist/`", checked by grepping for the two hostnames.
   Because the stylesheet is inlined into every page, naming those hostnames in a source comment
   made the check report a hit forever. The comment was reworded to describe them without spelling
   them. **A check that always fires is worth exactly as much as one that never does** — the
   Sprint 1 link checker that scanned zero links is the same failure from the other direction.
5. **Cropping to "artwork bounds" was the wrong instruction for the favicon, and following it
   literally would have shipped mush.** The tickets document described the source as a 1036×1036
   canvas with artwork at 0–1023 and a 12px gutter. Measured, it is 1024×1024 with the artwork at
   (233, 102)–(1005, 966) — and it is a *stacked lockup*: spiral above "SynPro" above "CONSULTING".
   Cropping to full artwork bounds would have squeezed three stacked elements into 16 pixels. The
   favicon was cropped to the **spiral alone**, found by locating the empty alpha rows between the
   elements, and verified legible at 16px and 32px on both light and dark. **Measure the asset;
   do not take its geometry from the ticket.**
6. **"No visible change" is worth proving with pixels, not bytes.** `dist/index.html` grew by 3.6×,
   so a byte comparison would have said nothing useful. Rendering the before and after in headless
   Chromium and differencing the images gave a real answer — zero differing pixels at four
   viewports, including 375×812 where the `clamp()` type scales resolve differently. The token
   refactor touched every rule on the page; nothing else would have caught a one-pixel drift.
7. **A canonical doc can forbid the thing the next sprint is chartered to do.** `RUNBOOK.md` §8 said
   in as many words: *"Do not fix this. Do not change `core.autocrlf`, add a `.gitattributes`…"* —
   written by the session that diagnosed SWEB-11 and judged the divergence not worth touching.
   SWEB-12 is that fix, owner-approved. The guidance was **explicitly reversed in the doc with the
   reasoning recorded**, not quietly contradicted, because the original judgement was defensible:
   it objected to disturbing correct production output, and `.gitattributes` does not disturb it —
   CI was already LF. **When new work contradicts standing written guidance, rewrite the guidance
   in the same PR and say why.**

---

*Next entry: Sprint 4.*
