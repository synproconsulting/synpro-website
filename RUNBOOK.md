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

*Populated in Sprint 1 once Astro is scaffolded — install, dev server, and production build
commands.*

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

### Custom fields

`customfield_10071` (execution order) and `customfield_10016` (story points) are site-level fields
shared with the FPRM project, but **screen configuration is per-project**. Confirm both are on the
SWEB create/edit screens before the first sprint setup — a missing field fails ticket creation
with an unhelpful 400.

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

The auto-merger's blocking check list must exactly match the job names in `ci.yml`. A drift means
either it blocks forever or merges on nothing. Verify both after any change to either.

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
| DNS guidance often says "remove existing records" | Following it takes down company mail | Additive changes only (§5) |

---

*Last updated: 2026-08-06 — created at project bootstrap, pre-Sprint-1.*
*Update this file whenever a new operational lesson is learned — do not let lessons live only in
chat transcripts.*
