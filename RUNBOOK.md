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

### Verifying against the origin URL first

For any change that could take the site down, verify on
`https://synproconsulting.github.io/synpro-website/` before letting the custom domain follow.

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

If that is `False`, compare against the repo-root `index.html` instead — a `True` there means a
legacy branch build has taken over and republished the root. The two candidate sources differ
substantially in size, so the comparison is never ambiguous.

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

**Commit the lockfile with every dependency change.** `package.json` and `package-lock.json` are
critical files — read before modifying, never remove an existing dependency, only append.

### Running the Worker locally

*Populated when the Worker is built. Note here how to run it without a live `RESEND_API_KEY` so
form flows stay testable offline.*

### `Documentation/`

Untracked, canonical, excluded from every `git clean`. Holds each sprint's Claude Code prompt, PR
body files, and reference material. Accumulation here is intentional, not clutter.

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
:: POSITIVE — expect "scanned 2 links" and exit code 0
npm run build
npm run links

:: NEGATIVE — inject a broken link into a copy of dist/ and expect exit code 1
```

The negative test injects `<a href="does-not-exist.html">` into a copy of `dist/index.html` and
confirms linkinator reports `[404]` and exits 1. If the positive test ever reports a scanned-link
count of 0, or the negative test exits 0, the check is inert — fix it before trusting a green run.

Note the count: **2** internal links (the page and `logo.png`). External URLs are skipped by
`.linkinatorrc.json` on purpose, so a Google Fonts outage cannot fail a blocking check.

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

Non-blocking jobs can fail forever unnoticed — on Fracttal PRM, SonarCloud failed on every run for
twenty-plus sprints. Check advisory job status at each sprint closeout, or don't add the job.

---

## 9. Project File Management

### Files that must live in the Claude Project (not just chat attachments)

- `CLAUDE.md`
- `CLAUDE_HISTORY.md`
- `PROJECT_CONTEXT.md`
- `RUNBOOK.md`
- `PROMPT_TEMPLATE.md`
- `HANDOFF_TEMPLATE.md`
- The requirements document
- Each phase's Jira ticket document
- Each sprint's Claude Code prompt

### Why this matters

Files attached to a single chat are not available in a new one. Only files uploaded to the Claude
Project persist. A file generated in chat and never uploaded is gone at the session boundary.

### Keeping copies in sync *(carried — this is the single most-missed step)*

The canonical copies live in the **GitHub repo**. The Claude Project copies are reference copies
for planning sessions. After every sprint that updates them via PR, re-upload to the Claude
Project. On Fracttal PRM the project-knowledge copies routinely ran several PRs behind the repo,
which meant planning sessions reasoned from a stale picture of the system.

Do this at the session boundary, as part of closeout — not "later".

---

## 10. Known Limitations and Gotchas

| Issue | Detail | Workaround |
|---|---|---|
| No staging environment | `main` merges publish to the live public domain within about a minute | Verify on the `github.io` origin URL before the custom domain follows |
| `CNAME` lost on build | Under an Actions deploy, the artifact is the build output, not the repo root | Keep `CNAME` in `public/` so it copies into every build (AD-9) |
| CDN/browser cache masks a deploy | The old build is served from cache after a successful deploy | Verify in a fresh/private window |
| Credentials must never be pasted in chat | Applies to the GitHub PAT, Resend key, and any provider token | Enter them directly in `.env` or the provider's secret store |
| Unit tests cannot prove a runtime control works | Rate limiting and CORS depend on the real edge request path | Verify against the live endpoint (§4) |
| A CI check can be green while inspecting nothing | The link checker scanned 0 links and passed | Negative-test every control (§8) |
| A CSS minifier can drop a vendor prefix | `-webkit-background-clip` stripped while `-webkit-text-fill-color: transparent` was kept → invisible text | `cssMinify: false`; diff rendered output, not source |
| `Out-File -Encoding utf8` writes a BOM | Breaks JSON config parsing in cross-platform tools | Use `[IO.File]::WriteAllText()` (§8) |
| A global Jira field context ≠ the field being on a screen | `GET /field` lists it; ticket creation silently drops it | Verify via `createmeta` (§7) |
| Pages `build_type` lies about the active deploy path | Reported `legacy` while the Actions artifact was serving | Compare live HTML against `dist/` (§3) |
| DNS guidance often says "remove existing records" | Following it takes down company mail | Additive changes only (§5) |

---

*Last updated: 2026-08-06 — Sprint 1 (SWEB-1 … SWEB-6, PRs #1 and #2): local dev commands (§6),
SWEB field IDs and screen-verification procedure (§7), auto-merger check names, `PAT_TOKEN`
requirement, the control-liveness negative test (§8), and how to determine which deploy path is
actually serving (§3).*
*Update this file whenever a new operational lesson is learned — do not let lessons live only in
chat transcripts.*
