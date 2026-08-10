# SynPro Consulting Website — Operational Runbook

> This file is the single source of truth for **how** to do operational tasks — not what to build.
> Load it alongside `CLAUDE.md` at the start of every session.
>
> Seeded with hard-won procedural knowledge carried across from the Fracttal PRM programme
> (Sprints 1–26). Items marked *(carried)* were learned on that project and cost real time there;
> they are not theoretical.

---

## 1. Pre-Sprint Session Startup

Every Claude Code session starts with this sequence — no exceptions:

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git status
git checkout main
git reset --hard origin/main
git clean -fd --exclude=Documentation/
claude --dangerously-skip-permissions
```

**Why `--dangerously-skip-permissions`:** without it, Claude Code stops and prompts for
permission on every shell command, breaking autonomous execution.

**Why the hard reset rather than `git pull`:** *(carried)* `git pull` does not remove untracked
files or locally-modified tracked files left by a prior session. Claude Code reads the canonical
docs from the local filesystem — a dirty tree means it operates on a stale picture and produces
confidently wrong results.

**Never run bare `git clean -fd`.** *(carried)* `Documentation/` is untracked but canonical. A
bare clean deletes the sprint prompt currently being executed.

### If `git clean` fails with permission denied *(carried)*

Observed on Fracttal PRM after long-running sessions accumulated agent scratch directories that
Windows had locked. Symptom: `git clean` reports permission denied on directories such as
`.claude/` or stale per-sprint scratch folders, and the working tree can never be made clean.

Root cause: directories created by a prior session carry ownership/ACLs the current shell cannot
remove, and silently-failing post-flight syncs let them accumulate over many sprints.

Resolution — from an **elevated** Command Prompt, take ownership before cleaning:

```cmd
takeown /f "<blocked-directory>" /r /d y
icacls "<blocked-directory>" /grant "%USERNAME%":F /t
attrib -r -s -h "<blocked-directory>\*.*" /s /d
```

Then re-run the standard clean. **Prevention is the post-flight sync** — run it every session and
these never accumulate.

---

## 2. Post-Flight Sync

After the final PR merges and the closeout report prints, before exiting:

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

Not optional. A session that skips it corrupts the next session's pre-flight read.

---

## 3. Verifying the Live Site

**`main` is production.** After any merge, confirm the deploy actually landed before considering
the ticket done.

### Standard post-merge check

1. Watch the Pages deploy job in the Actions run for the merge commit — it must complete, not
   just start.
2. Load `https://synproconsulting.co` in a fresh/private window. Browser and CDN caching will
   otherwise show you the previous build and give a false pass.
3. Confirm the change is visible and that navigation, the logo, and the footer still render.
4. Confirm HTTPS is still enforced and the certificate is valid for the apex domain.

### If the custom domain stops working after a deploy

Almost always a missing `CNAME` in the build artifact. Check the published artifact (not the repo
root) contains `CNAME` with the single line `synproconsulting.co`. Restore it to the static
passthrough directory (`public/CNAME`) and redeploy. See `CLAUDE.md` Hard Rules and AD-9.

### Verifying a risky change after merge *(replaces the origin-URL check — AD-11)*

For any change that could take the site down (build config, DNS-adjacent files, the cutover), run
all four steps. This is detection-and-rollback, not prevention: the change is already live.

**1 — Confirm the `deploy` job itself completed.** Not the run; the job. `deploy` is
`continue-on-error: true`, so a failed deploy still leaves a green run.

```powershell
$h  = @{ Authorization = "Bearer $env:PAT_TOKEN" }
$repo = 'https://api.github.com/repos/synproconsulting/synpro-website'
$sha  = git rev-parse origin/main
$run  = (Invoke-RestMethod -Headers $h "$repo/actions/runs?head_sha=$sha").workflow_runs |
          Where-Object name -eq 'CI' | Select-Object -First 1
$run.id
(Invoke-RestMethod -Headers $h "$repo/actions/runs/$($run.id)/jobs").jobs |
  Select-Object name, status, conclusion      # deploy must be completed / success
```

**2 — Byte-compare the live page against what CI built.** A local build of the merge commit is
byte-identical to the artifact (SWEB-12), so it is a valid stand-in.

```powershell
$live = (Invoke-WebRequest -UseBasicParsing 'https://synproconsulting.co/').Content
$dist = [IO.File]::ReadAllText('dist\index.html')
$live.Trim() -eq $dist.Trim()      # True => the deploy published what CI tested
```

**3 — Load the apex in a fresh/private window** and confirm it renders. Cache will otherwise show
the previous build and give a false pass. Confirm HTTPS is still enforced and `/CNAME` still returns
`synproconsulting.co`.

**4 — On any failure, roll back. Do not forward-fix production.**

```cmd
git revert --no-edit <merge-commit-sha>
git push origin main
```

> **Why not verify on `synproconsulting.github.io/synpro-website/` first?** Because it cannot
> isolate anything, and never could. With a custom domain set that URL **301-redirects to the
> apex** — verified 2026-08-08, `Location: https://synproconsulting.co/`. It is the same deployment
> and the same bytes. The instruction stood in the Hard Rules until Sprint 4 and was removed as a
> control that looked like a staging gate and was not (AD-11). Do not reintroduce it.

### Determining which deploy path is actually serving *(learned Sprint 1 / SWEB-6)*

**Do not trust `build_type` from the Pages API.** At Sprint 1 close it reported
`build_type: legacy` with `source: main/` while the GitHub Actions artifact was demonstrably what
visitors were being served. The field describes the stored setting, not the live delivery path.

The reliable check is to compare the served bytes against the build output:

```powershell
$live = (Invoke-WebRequest -UseBasicParsing 'https://synproconsulting.co/').Content
$dist = [IO.File]::ReadAllText('dist\index.html')
$live.Trim() -eq $dist.Trim()      # True  => the Actions artifact is serving
```

If that is `False`, investigate — but read the warning below before concluding the deploy failed.

> **The Windows false negative is FIXED as of Sprint 3 (SWEB-12). This comparison is trustworthy
> again.** `.gitattributes` normalises the working copy to LF and
> `build.inlineStylesheets: 'always'` pins emission, so a local build now produces `dist/index.html`
> byte-identical to the published artifact. Verified in SWEB-12: local output matched the live page
> exactly at 5102 bytes, SHA-256 `C29ACF6C…0BA63`.
>
> **The incident, retained as history.** *(SWEB-11, hit during the Sprint 2 closeout and briefly
> read as a failed deploy.)* Before the fix, `core.autocrlf=true` made the local build emit the
> stylesheet as a separate file while CI inlined it — local `dist/index.html` was **1093 bytes**
> against a live **5102**. Two correct builds that legitimately differed. See §8 for the mechanism.
> If you ever see this comparison fail again, suspect a build-shape divergence before concluding
> the deploy is stale.
>
> **The independent check is still worth knowing**, because it does not depend on build shape at
> all: request a file that exists only in the new artifact. `https://synproconsulting.co/robots.txt`
> returning 200 proved the artifact was live in Sprint 2 without any byte comparison.
>
> The root-`index.html` half of this check is historical: those files were deleted in Sprint 2
> (SWEB-9), so there is no branch-root copy left to compare against.

Also useful: `GET /repos/{owner}/{repo}/deployments?environment=github-pages` shows whether an
Actions deployment succeeded and when.

### Proving a "no visible change" deploy really is invisible

When a sprint's premise is that visitors see nothing different, prove it rather than assuming it:

1. Compare the **body markup** with whitespace normalised. Differences in inter-block whitespace,
   `<img />` vs `<img>`, and `&` vs `&amp;` are parse-identical and safe.
2. Compare the **stylesheet rule-by-rule** with whitespace stripped. Leading-zero differences
   (`.9s` vs `0.9s`) are safe. **A dropped vendor prefix is not** — see the `-webkit-background-clip`
   entry in §10.
3. Confirm `/CNAME` still returns `synproconsulting.co` over HTTP.

---

## 4. Testing the Contact Form

*Expand this section when the Worker is built.*

The form is the only dynamic surface and the only real security surface. After every Worker
deploy, verify **against the live endpoint** — not only the unit tests:

- A valid submission arrives at `info@synproconsulting.co`, from the verified sender domain, with
  every field present and the enquiry type reflected.
- Missing required fields are rejected with the documented validation response.
- The honeypot field, when filled, is rejected — and the visitor-facing response is
  indistinguishable from success (AD-8).
- Rate limiting **actually engages**: burst past the configured limit and confirm the limited
  response. *(carried — Fracttal PRM AD-46 / FPRM-460: a rate limiter was green in CI and inert in
  production for weeks because the test client presents a stable peer address while the real
  proxy chain does not. Unit tests cannot catch this class of failure.)*
- CORS: a POST from an origin outside the allowlist is rejected.

Record the exact commands used here once they exist, so the check is repeatable rather than
reinvented each sprint.

---

## 5. DNS Operations

The Namecheap zone for `synproconsulting.co` is load-bearing for company email as well as the
site. Rules:

- **Every change is additive and surgical.** Never a clean sweep, never a bulk delete.
- **Never touch** MX, SPF, DMARC, DKIM, the Microsoft `MS=` verification TXT, or the Resend
  verification records. *(carried — third-party guides routinely advise "remove existing records"
  when adding Pages A records; following that advice takes down company mail.)*
- When adding a custom domain to GitHub Pages, save the domain **in GitHub Pages settings first**,
  then add the provider records. The reverse order briefly exposes the domain to takeover.
- After DNS changes, expect the Pages settings screen to show "DNS check unsuccessful" until
  propagation completes. Enforce HTTPS stays greyed out until the certificate issues — up to
  about an hour.
- Verify infrastructure IPs against the provider's current documentation before changing them.
  Do not trust a value recalled from memory or copied from an old runbook.

---

## 6. Local Development

### Working directory

```
C:\Johan\SynPro Consulting\Website\Website Development
```

### Running the site locally

Requires **Node.js ≥ 22.12** (Astro 7.2.0's floor). Verified on Node 24.15.0 / npm 11.12.1.

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
npm install          :: first run only, or after a dependency change
npm run dev          :: dev server with hot reload
npm run build        :: production build into dist/
npm run preview      :: serve the production build
```

The three commands CI gates on, runnable locally in the same form:

```cmd
npm run build        :: must also leave dist/CNAME in place
npm run format:check :: fix with `npm run format`
npm run links        :: broken internal links in dist/ — run AFTER a build
```

`npm run links` reads `dist/`, so a stale or absent `dist/` gives a meaningless result. Always
build first.

> **`npm run links` only reaches pages something links to.** linkinator crawls outward from the
> `dist/` root. Until the cutover PR adds navigation, the content pages are unreachable from `/`
> and are **not checked** — the job passes having scanned only the placeholder's links. Check
> internal references on new pages by hand until nav exists. See the Known Issues note in
> `CLAUDE.md`.

### Presenting a build for owner review *(standing step in content sprints — SWEB-19)*

**Content sprints do not open a PR until the owner has seen the pages.** Because `main` is
production, review has to happen before merge, not after. Nothing is deployed or reachable from
the internet during this step — that is the point.

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
npm run build
npm run preview -- --host
```

`--host` also binds the LAN address the command prints, so the owner can open the same build on a
phone over the same Wi-Fi. Give them:

1. **`http://localhost:4321`** plus the **exact routes** to visit — a route with no nav pointing at
   it cannot be discovered by clicking.
2. The LAN URL for mobile review.
3. **Any interaction that will not work, stated up front.** Through Sprint 5 the contact form does
   not submit, because no Worker exists. Said in advance it is expected behaviour; discovered by
   the owner it reads as a defect.

`astro preview` daemonises — it keeps serving after the command returns. Stop it with:

```cmd
npx astro preview stop
```

Text corrections at this stage are cheap: page copy lives in `src/content/` (D7), so changing a
sentence does not touch a component.

### Screenshotting a page at a given viewport

**`chrome --headless --window-size=W,H --screenshot` is not trustworthy below 500px on Windows.**
Chrome clamps the window to a 500 CSS-px minimum. Asking for 375 produces a 375px-wide *image of a
500px-wide layout* — a crop, which makes a correct page look broken. Sprint 5 lost time to this and
briefly reported a defect that did not exist.

Confirm what actually rendered rather than trusting the flag:

```js
window.innerWidth; // reported 500 while the PNG was 375 wide
```

For any viewport under 500px, drive Chrome through the DevTools Protocol and set the viewport with
`Emulation.setDeviceMetricsOverride`, which is not subject to that floor. Node 22+ has a built-in
`WebSocket`, so this needs no dependency. `Page.captureScreenshot` with
`captureBeyondViewport: true` also gives a full-page capture, which `--screenshot` cannot.

Whatever harness is used, **have it report the viewport it actually got** and compare that against
the one requested. A clamp that is printed cannot pass unnoticed twice.

**Commit the lockfile with every dependency change.** `package.json` and `package-lock.json` are
critical files — read before modifying, never remove an existing dependency, only append.

### Running the Worker locally

*Populated when the Worker is built. Note here how to run it without a live `RESEND_API_KEY` so
form flows stay testable offline.*

### `Documentation/`

Untracked, canonical, excluded from every `git clean`. Holds each sprint's Claude Code prompt, PR
body files, and reference material. Accumulation here is intentional, not clutter.

### The repo root is not a safe parking spot for source material *(learned Sprint 2)*

The pre-flight `git clean -fd --exclude=Documentation/` **destroys every untracked file at the
repo root** at the start of every session. That is the command working as designed — it is what
guarantees a clean read surface — but it means anything dropped at the root to "look at later" is
gone at the next session boundary, without warning and without a recycle-bin copy.

Observed 2026-08-07: the first Sprint 2 pre-flight deleted `BIO_SOURCE.md`, three logo PNGs, and a
`.pptx` that had been left at the root. **Nothing was lost — originals existed in
`Website\Input Material\` and `Logo Graphics\` — but that was luck rather than design.**

There are exactly three safe places for a file inside the working directory:

1. **Tracked in git** — it survives because `git clean` only removes untracked files.
2. **Inside `Documentation/`** — the one directory every clean excludes.
3. **Listed in `.gitignore`** — `git clean -fd` without `-x` leaves ignored files alone, which is
   why `.env` survives every session.

Anything else — source copy, design asset, draft, archive — lives **outside** the working directory
entirely. Do not add per-file `--exclude=` flags to the pre-flight to protect a stray root file;
that is a one-session workaround that silently becomes permanent. Move the file instead.

---

## 7. Jira Operational Notes

### Sprint query pattern

```python
jql = f"project = SWEB AND (fixVersion = {fix_id} OR sprint = {native_id})"
```

Always dual-query. A single-field query misses tickets at closeout.

### Custom fields — SWEB actual IDs

| Field | ID | Notes |
|---|---|---|
| Sprint | `customfield_10020` | |
| Story Points | `customfield_10036` | **Not** `customfield_10016` — see below |
| Execution Order | `customfield_10071` | |

Project ID `10099`, board `100` (Scrum), Story issue type `10007`.

**Story points is `customfield_10036` on SWEB.** SWEB is company-managed, and board 100's
configured estimation field is `customfield_10036` ("Story Points"). `customfield_10016` ("Story
point estimate") is the team-managed field FPRM uses. Setting the wrong one is silent — the ticket
is created, and the board reads zero points. Confirm with:

```
GET /rest/agile/1.0/board/100/configuration   → estimation.field.fieldId
```

### Verifying a field is actually usable *(learned Sprint 1)*

**A global field context does not put a field on a screen.** At Sprint 1 setup all three fields
existed site-level with `isGlobalContext: true`, and `GET /rest/api/3/field` returned them — but
none were on the SWEB screens, so ticket creation would have silently dropped points and execution
order.

`GET /rest/api/3/field` proves only that a field exists *somewhere on the site*. The check that
matters is the create screen:

```
GET /rest/api/3/issue/createmeta/SWEB/issuetypes/10007
```

If a field is missing, add it to the screen rather than working around it:

```
GET  /rest/api/3/issuetypescreenscheme/project?projectId=10099
GET  /rest/api/3/issuetypescreenscheme/mapping?issueTypeScreenSchemeId={id}
GET  /rest/api/3/screenscheme?id={id}
GET  /rest/api/3/screens/{screenId}/tabs
POST /rest/api/3/screens/{screenId}/tabs/{tabId}/fields   { "fieldId": "customfield_10036" }
```

SWEB screens: **`10079`** (Story/Task, tab `10082`) and **`10080`** (Bug, tab `10083`). Both
already carry Story Points and Execution Order as of Sprint 1. The Bug screen matters because the
Hard Rules require a Jira bug ticket before any in-sprint fix PR.

### If Execution Order is ever unavailable

Do not invent a substitute and do not fail. Proceed without it, use Jira's native backlog ranking
(`customfield_10019`, Rank) for sequence, and record the absence in `CLAUDE.md` (Jira Configuration
table + Known Issues) and in this section.

### Sub-tasks

Never set fix version or sprint on a Sub-task directly — Jira returns 400. They inherit from the
parent.

### Ticket lifecycle

In Progress before implementation starts → leave In Progress when the PR opens → Done only on
confirmed merge. Never Done on PR open.

### Stale-ticket cleanup *(carried)*

When auditing old tickets, verify each one against the canonical docs before closing it. Never
bulk-close.

---

## 8. GitHub and CI/CD Notes

### One PR at a time

Check for open PRs via the API before opening any new one. This is a hard rule, not a preference.

### Auto-merger check names

The blocking check list for this repo is the `needs:` array on the `auto-merge` job in
`.github/workflows/ci.yml`:

```yaml
needs: [build, format, links]
```

Those three strings are job ids, and each job's `name:` is set to the same string so the GitHub
check name and the id cannot diverge. Renaming a job without updating `needs:` is the only way to
break the gate — and it breaks it in one of the two classic ways (merges on nothing / blocks
forever). Verify both after any change to either.

### `PAT_TOKEN` is required for the auto-merger

`auto-merge` authenticates with `secrets.PAT_TOKEN` — a classic PAT with `repo` + `workflow`
scope, set under Settings → Secrets and variables → Actions.

**The built-in `GITHUB_TOKEN` cannot substitute for it.** Pushes made with `GITHUB_TOKEN` do not
trigger further workflow runs, so a merge to `main` would never fire the `deploy` job. The job
fails fast with an explicit message if the secret is unset, rather than surfacing an opaque 401.

### Verify a CI control is live, not just green *(learned Sprint 1)*

A check that passes while inspecting nothing is worse than no check — it reports safety it is not
providing. In Sprint 1 the link checker reported *"Successfully scanned 0 links"* and exited 0
because its skip regex matched the crawl root. Fully green, entirely inert. This is the FPRM-460
rate-limiter failure in a new costume.

**Negative-test every control you add.** For the link checker specifically:

```cmd
:: POSITIVE — expect "scanned 5 links" and exit code 0
npm run build
npm run links

:: NEGATIVE — inject a broken link into a copy of dist/ and expect exit code 1
```

The negative test injects `<a href="does-not-exist.html">` into a copy of `dist/index.html` and
confirms linkinator reports `[404]` and exits 1. If the positive test ever reports a scanned-link
count of 0, or the negative test exits 0, the check is inert — fix it before trusting a green run.

Note the count: **5** internal links as of Sprint 3 — the crawl root (`dist`, i.e. the page
itself), `dist/logo.png`, `dist/fonts/sora-latin-var.woff2`, `dist/favicon.ico`, and
`dist/apple-touch-icon.png`. The stylesheet is **inlined** into the page, so it is not a separate
crawlable link. External URLs are skipped by `.linkinatorrc.json` on purpose, so a font-CDN outage
cannot fail a blocking check.

`robots.txt` and `og-image.png` do not affect this count — nothing links to `robots.txt`, and
`og:image` is a `<meta>` property rather than a crawlable link.

> **This count changes whenever a page, image, font, or icon is added. Re-measure; do not assume.**
> It was 2 through Sprint 2 and became 5 in Sprint 3 when the self-hosted font preload and the two
> icons landed. The authority is the CI `links` job log, not a local run.

#### Local and CI builds now agree *(SWEB-12 — supersedes the SWEB-11 guidance)*

**This divergence is fixed. The text below is retained as history because the incident it caused
is instructive, not because the condition is live.**

Through Sprint 2, `core.autocrlf=true` gave the Windows checkout CRLF line endings.
`src/layouts/BaseLayout.astro` carried 203 CRLF pairs, so its style block was 203 bytes larger on
disk locally than the LF bytes in the repo. That pushed the generated stylesheet from **4013 to
4216 bytes** — across Astro's **4096-byte** `inlineStylesheets: 'auto'` threshold:

| | Stylesheet | `dist/index.html` | Links |
|---|---|---|---|
| Local, CRLF checkout (pre-SWEB-12) | separate `_astro/index.*.css` | 1093 bytes | 3 |
| CI and production, LF | inlined | 5102 bytes | 2 |

**Sprint 3 removed both halves of the cause.** `.gitattributes` (`* text=auto eol=lf`) normalises
the working copy, and `build.inlineStylesheets: 'always'` makes emission a configuration decision
rather than a side effect of file size. Verified at the time: a local `npm run build` produced
`dist/index.html` byte-identical to the live page — 5102 bytes, SHA-256 `C29ACF6C…0BA63` — and
linkinator scanned the same count locally as in CI.

> **Note for anyone reading the Sprint 2 text.** §8 previously said *"Do not fix this — do not
> change `core.autocrlf`, add a `.gitattributes`…"*. That judgement has been **reversed by owner
> decision in SWEB-12**, and the reversal is sound: the original objection was that production
> output was already correct and should not be disturbed to fix a local-only cosmetic difference.
> `.gitattributes` does not disturb it — CI was already LF, so CI output is unchanged. Only the
> working copy moved, which is precisely what removes the trap. The standing advice that **CI is
> the authority for any byte or link count** survives unchanged and is still correct.

Applying `.gitattributes` needs a re-checkout, not just `git add --renormalize .` — renormalising
updates the index and leaves the working copy alone. Delete the tracked files and
`git checkout -- .` to force the filter to run.

### Config files read by non-Windows tools *(learned Sprint 1)*

PowerShell's `Out-File -Encoding utf8` writes a **BOM**. It broke linkinator's JSON config parse
and presented as "the config file has no effect" — a misleading symptom that cost real debugging
time. Use `[IO.File]::WriteAllText()` for any config a cross-platform tool will read.

### Build PR bodies from a file, never an inline shell string *(carried)*

In a double-quoted shell command, backticks trigger command substitution **before** the script
runs — any code spans in the body get executed and stripped, publishing a mangled PR body.
Markdown bodies always contain backticks. Use `--body-file` or a file-based PATCH.

### Drive multi-step git/PR flows through one self-guarding script *(carried)*

When tool output buffers or interleaves, do not fire steps one at a time and guess at results.
Put the whole sequence (branch create → tree/commit → ref → PR open) into a single script that
checks each step's exit/HTTP status and fails loudly, then read the log back to verify.

### Advisory job health *(carried)*

Non-blocking jobs can fail forever unnoticed — on Fracttal PRM, the SonarCloud scan fails on every
CI run and is carried as known technical debt. Check advisory job status at each sprint closeout,
or don't add the job.

---

## 9. Project File Management

### Files that must live in the Claude Project (not just chat attachments)

- `CLAUDE.md`
- `CLAUDE_HISTORY.md`
- `PROJECT_CONTEXT.md`
- `RUNBOOK.md`
- `PROMPT_TEMPLATE.md`
- `HANDOFF_TEMPLATE.md`
- `CONTENT_REQUIREMENTS.md` — the requirements document. Page content is gated on D1–D7 in it, so
  a planning session without it cannot scope a content sprint
- `SWEB_Sprint<n>_Jira_Tickets.md` — one per sprint. Owner-approved scope; `PROMPT_TEMPLATE.md`
  §5a requires Claude Code to transcribe it rather than author ticket content, so a sprint whose
  tickets document is missing from the Project cannot start
- Each sprint's Claude Code prompt

### Why this matters

Files attached to a single chat are not available in a new one. Only files uploaded to the Claude
Project persist. A file generated in chat and never uploaded is gone at the session boundary.

### Keeping copies in sync *(carried — this is the single most-missed step)*

The canonical copies live in the **GitHub repo**. The Claude Project copies are reference copies
for planning sessions. After every sprint that updates them via PR, re-upload to the Claude
Project. If they drift, planning sessions reason from a stale picture of the system.

Do this at the session boundary, as part of closeout — not "later". *(Source: FPRM `RUNBOOK.md`
§9, "Keeping Files in Sync".)*

### Citing the source when carrying a lesson across projects *(added SWEB-7)*

Much of this runbook is inherited from Fracttal PRM. When you carry a lesson, decision, or
anecdote across from another project, **cite the file it came from** — e.g. *"FPRM
`PROJECT_CONTEXT.md` §6 AD-4"* or *"FPRM `CLAUDE_HISTORY.md`, Post-Sprint 20 entry"* — so a future
session can re-verify it in one step instead of taking it on trust.

Two rules follow from SWEB-7, where three inherited claims turned out to be wrong:

1. **Read the source before writing the claim.** Do not reconstruct another project's history from
   memory. All three defects were plausible-sounding and entirely invented.
2. **Never carry a quantity you have not seen in writing.** Durations and counts ("twenty-plus
   sprints", "four PRs") are the most common fabrications and the most quotable — they propagate
   into later docs as fact. If the source states no number, state no number.

---

## 10. Known Limitations and Gotchas

| Issue | Detail | Workaround |
|---|---|---|
| No staging environment | `main` merges publish to the live public domain within about a minute | Detect and roll back: the four-step post-merge check (§3, AD-11). The `github.io` origin cannot serve as staging — it 301s to the apex |
| `CNAME` lost on build | Under an Actions deploy, the artifact is the build output, not the repo root | Keep `CNAME` in `public/` so it copies into every build (AD-9) |
| CDN/browser cache masks a deploy | The old build is served from cache after a successful deploy | Verify in a fresh/private window |
| Credentials must never be pasted in chat | Applies to the GitHub PAT, Resend key, and any provider token | Enter them directly in `.env` or the provider's secret store |
| Unit tests cannot prove a runtime control works | Rate limiting and CORS depend on the real edge request path | Verify against the live endpoint (§4) |
| A CI check can be green while inspecting nothing | The link checker scanned 0 links and passed | Negative-test every control (§8) |
| A CSS minifier can drop a vendor prefix | Lightning CSS 1.33.0 strips `-webkit-background-clip` while keeping `-webkit-text-fill-color: transparent` → invisible text. Still reproduces as of 2026-08-08 | `cssMinify: 'esbuild'`, never `true`; the `build` job asserts the pairing in `dist/` (SWEB-16) |
| Chrome cannot detect a missing `-webkit-` prefix | It supports unprefixed `background-clip: text`, so a broken build screenshots byte-identical to a good one | Assert the source pairing too; to see the defect, delete the unprefixed declaration from `dist/` and re-render (§3, SWEB-16) |
| A relative asset path breaks on nested routes | `logo.png` on `/services/` requests `/services/logo.png` | Root-absolute for every `public/` asset (SWEB-17, `PROJECT_CONTEXT.md` §3) |
| `Out-File -Encoding utf8` writes a BOM | Breaks JSON config parsing in cross-platform tools | Use `[IO.File]::WriteAllText()` (§8) |
| A global Jira field context ≠ the field being on a screen | `GET /field` lists it; ticket creation silently drops it | Verify via `createmeta` (§7) |
| Pages `build_type` lies about the active deploy path | Reported `legacy` while the Actions artifact was serving | Compare live HTML against `dist/` (§3) |
| ~~A red `pages build and deployment` run on every `main` push~~ | **Resolved 2026-08-07 (Sprint 2).** GitHub's stock Jekyll builder, failing since before Sprint 1 and never caused by sprint work; not in our `ci.yml` | Retired by the Pages source flip. Observed: `17f2433`, `4abf377`, `19fb7b8` each triggered one; `d41545e` triggered none |
| The repo root is not a safe parking spot for source material | The pre-flight `git clean -fd --exclude=Documentation/` destroys every untracked root file at the start of every session | Keep source material outside the working directory (§6) |
| ~~A Windows build is a different shape from the CI build~~ | **Resolved 2026-08-07 (SWEB-12).** `core.autocrlf=true` added 203 bytes to `BaseLayout.astro`, pushing the stylesheet over Astro's 4096-byte inlining threshold: local emitted a separate CSS file (3 links, 1093-byte page), CI inlined it (2 links, 5102-byte page) | Fixed by `.gitattributes` (`text=auto eol=lf`) + `inlineStylesheets: 'always'`. Local now byte-matches CI. CI remains the authority for any count (§8) |
| ~~§3's live-HTML-vs-`dist/` check false-negatives on Windows~~ | **Resolved 2026-08-07 (SWEB-12).** Same cause | Comparison is trustworthy again (§3). The build-shape-independent check — fetch an asset only the new artifact has — is still the better tool when in doubt |
| A `.gitattributes` change needs a re-checkout to take effect | `git add --renormalize .` updates the index but leaves the working copy on its old line endings, so the build still sees CRLF | Delete tracked files and `git checkout -- .` to force the filter (§8) |
| The link count is not a constant | It was 2 through Sprint 2 and 5 from Sprint 3 — fonts and icons are crawlable | Re-measure after adding any page, image, font, or icon; never carry the old number forward (§8) |
| DNS guidance often says "remove existing records" | Following it takes down company mail | Additive changes only (§5) |
| `chrome --window-size` under 500px silently clamps | Windows enforces a 500 CSS-px minimum, so a 375px capture is a crop of a 500px layout — correct pages look broken | Use CDP `Emulation.setDeviceMetricsOverride`, and have the harness report the viewport it actually got (§6) |
| The link checker cannot see an unlinked page | Nothing links to the content pages until cutover, so `links` passes having scanned only the placeholder | Check internal references by hand until nav exists (§6) |
| `global.css` styles bare `body` and `footer` type selectors | Those declarations leak into every page; a class selector only wins for properties it declares, so the site footer inherited `position: fixed` and vanished | Reset them in `pages.css`; expect the block to go at cutover (`PROJECT_CONTEXT.md` §3) |
| An unstyled `<a>` falls back to user-agent blue | Off-token and a contrast failure on the dark surface; shipped briefly on the 404 | Style every link explicitly (`PROJECT_CONTEXT.md` §7) |

---

*Last updated: 2026-08-09 — Sprint 5 (SWEB-19 … SWEB-24, PR #10): §6 gained two standing
procedures. **Presenting a build for owner review** — content sprints now build, run
`npm run preview -- --host`, and give the owner the exact routes plus any interaction that will
not work, before any PR opens. **Screenshotting at a given viewport** — `chrome --window-size`
clamps to a 500 CSS-px minimum on Windows, so sub-500px captures are crops of a 500px layout;
use CDP `Emulation.setDeviceMetricsOverride` and have the harness report the viewport it actually
got. Also recorded in §6 that `npm run links` cannot reach a page nothing links to, which is every
content page until cutover. Four §10 rows added.*

*Previously: 2026-08-08 — Sprint 4 (SWEB-15 … SWEB-17, PR #8): §3's "verify against the origin
URL first" was **removed and replaced** with a four-step post-merge verification — deploy job
completed by run ID, live page byte-compared against the CI artifact, apex in a fresh window,
`git revert` as rollback (AD-11). The origin URL 301-redirects to the apex (verified 2026-08-08),
so the old check isolated nothing. **§3's deploy-path determination technique was retained in
full** — it is correct and unrelated to that defect. Three §10 rows added or rewritten: the CSS
minifier row now names Lightning CSS 1.33.0 and `cssMinify: 'esbuild'`, a new row records that
Chrome cannot detect a missing `-webkit-` prefix, and a new row records the relative-path hazard.*

*Previously: 2026-08-07 — Sprint 3 (SWEB-12 … SWEB-14, PR #7): recorded that the Windows/CI
build-shape divergence is **fixed** — §3's false-negative warning and the two §10 rows are now
history rather than live conditions, and §8's "do not add a `.gitattributes`" guidance is
explicitly reversed with the reasoning. §8's expected link count corrected from **2 to 5** (the
self-hosted font preload and two icons are crawlable), with a standing note that the number moves
whenever an asset is added. Added the re-checkout gotcha: `git add --renormalize` alone does not
change the working copy.*

*Previously: 2026-08-07 — SWEB-11 (PR #6): reverted §8's link count to **2** — PR #5 changed it to
3 from a local Windows measurement, and CI is the authority. Recorded the CRLF/inlining-threshold
mechanism behind the local-vs-CI divergence in §8, warned in §3 that the live-HTML-vs-`dist/`
comparison false-negatives on a Windows checkout, and added two §10 rows.*

*Previously: 2026-08-07 — Sprint 2 (SWEB-8 … SWEB-10, PR #5): recorded the repo-root parking
hazard in §6 and §10, marked the red `pages build and deployment` row resolved in §10, and added
`CONTENT_REQUIREMENTS.md` and `SWEB_Sprint<n>_Jira_Tickets.md` to the §9 required-files list. §3's
deploy-path verification procedure was deliberately retained in full — the technique survived the
condition that produced it.*

*Previously: 2026-08-06 — SWEB-7 (PR #4): corrected the SonarCloud claim in §8 (invented duration
removed), removed an unverified FPRM claim from §9, and added §9 guidance on citing the source file
when carrying a lesson across projects.*

*Previously: 2026-08-06 — Sprint 1 (SWEB-1 … SWEB-6, PRs #1–#3): local dev commands (§6), SWEB
field IDs and screen-verification procedure (§7), auto-merger check names, `PAT_TOKEN` requirement,
the control-liveness negative test (§8), and how to determine which deploy path is actually serving
(§3).*
*Update this file whenever a new operational lesson is learned — do not let lessons live only in
chat transcripts.*
