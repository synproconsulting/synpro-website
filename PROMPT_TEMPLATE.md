# SynPro Consulting Website — Claude Code Prompt Template

> This file defines the mandatory structure every Claude Code prompt must follow.
> **Audience: Claude chat (the prompt author).**
> It does not duplicate `CLAUDE.md` hard rules — those govern Claude Code (the Dev Agent).
> This file governs the *structure* of prompts; `CLAUDE.md` governs the *content* of sessions.

---

## Model Declaration Header (MANDATORY — before Section 1)

Every generated prompt opens with a model declaration:

```
Model: claude-sonnet-5
```

`claude-sonnet-5` is the default for all development sessions on this project. Any deviation is
a deliberate choice stated in the chat that generated the prompt, not a silent substitution.

---

## Mandatory Prompt Structure

Every prompt must contain all nine sections, in this exact order. Missing any section is a prompt
authoring error.

---

### SECTION 1 — Pre-flight sync (MANDATORY — always first)

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

Purpose: guarantees Claude Code reads current canonical docs and source files, not stale local
copies from a prior session.

---

### SECTION 2 — Zero open PRs check (MANDATORY)

```
GET https://api.github.com/repos/synproconsulting/synpro-website/pulls?state=open
If any PR is open → STOP and report. Do not proceed.
```

Purpose: enforces the one-PR-at-a-time hard rule.

---

### SECTION 3 — Read canonical docs (MANDATORY)

Instruct Claude Code to read all four canonical docs from GitHub via the Contents API before any
work:

- `CLAUDE.md`
- `RUNBOOK.md`
- `PROJECT_CONTEXT.md`
- `CLAUDE_HISTORY.md`

Purpose: restores full project context. A session that skips this operates on an incomplete
picture and produces incorrect results.

---

### SECTION 4 — Read all relevant source files (MANDATORY)

List every file that will be modified and instruct Claude Code to read each one from GitHub via
the Contents API before writing a single line.

Purpose: prevents writing against an assumed version of a file. The Contents API read is ground
truth.

---

### SECTION 5 — Implementation tasks

The actual work. Clearly scoped, one task at a time where possible. Each task specifies:

- Exact files to modify
- Exact changes to make
- What NOT to change (explicit preservation rules)
- Any boundary constraints (site build vs Worker; content vs component)

**Site-specific preservation rules that belong in almost every prompt:**

- `public/CNAME` must exist in the build output. Never delete, move, or gitignore it.
- No DNS instructions. DNS is a manual owner task, never a Claude Code task.
- `RESEND_API_KEY` never enters the repository, CI, or any committed file.

---

### SECTION 6 — Canonical docs update (MANDATORY — same PR as code)

Explicit instructions to update all four canonical docs in the same branch and same PR.

**`CLAUDE.md`:** current-state paragraph, blocking-check list if CI changed, new Hard Rules or ADs
if introduced, Known Issues if something was discovered or resolved.

**`CLAUDE_HISTORY.md`:** append an entry in the documented format — date, PRs, Jira keys, what
landed, ADs recorded, lessons.

**`PROJECT_CONTEXT.md`:** Section 1 if the endpoint changed; Section 2 if content collections
changed; Section 3 if pages/components were added; Section 4 if CI changed; Section 5 if error
handling changed; Section 6 if an AD was added; Section 7 if design standards changed.

**`RUNBOOK.md`:** operational notes if new procedures or gotchas emerged; always update the
last-updated line.

Rule: a PR that changes behaviour without updating the docs is incomplete. The auto-merger
merging the PR is the moment the docs should already be current.

---

### SECTION 7 — PR rules (MANDATORY)

Specify: branch name (`feature/`, `fix/`, or `docs/` prefix), commit message (conventional
commits), PR title, PR body contents, and the instruction to wait for CI green and auto-merger
merge.

One PR per session — all tasks in one branch and one commit. Before opening, confirm no
unintended files in the diff. **Build the PR body from a file, never an inline shell string.**

---

### SECTION 8 — Closeout report (MANDATORY)

A structured template Claude Code fills in after the PR merges. Minimum fields:

- PR number and URL
- Files changed, and what changed in each
- Docs updated — confirm each of the four
- Post-merge state
- **Live-site verification:** confirm `https://synproconsulting.co` loads correctly in a fresh
  window after the Pages deploy completes. This project has no staging; a merge is a publish.

---

### SECTION 9 — Post-flight sync (MANDATORY — always last)

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

Purpose: leaves the working tree clean and matching `origin/main`, ready for the next session.

---

## The Bootstrap Exception (Sprint 1 only)

Sections 3 and 4 instruct Claude Code to read canonical docs and source files from GitHub. On a
repo where they do not yet exist, a literal application of the template stalls or invents them.

For the bootstrap sprint only:

- **Section 3** reads whatever canonical docs exist and explicitly states that absent files are
  expected — their creation is a Section 5 task.
- **Section 4** reads the existing repo contents (the placeholder `index.html`, root `CNAME`, any
  assets) so nothing live is destroyed.
- **Section 5's first task** is committing the canonical docs and `ci.yml`, in the same PR as the
  scaffold.
- **Section 6** still applies — the docs land in that same PR, because they *are* that PR.

All nine sections remain present. This exception applies once and is never a precedent for
skipping a section later.

---

## Cross-Project Applicability

This template follows the SynPro AI-powered Virtual Development Team pattern used on Fracttal PRM
and SynPro VSDC. When scaffolding a new project, copy this file to the new repo root and update
the working directory path in Sections 1 and 9 and the repo path in Section 2.

The four canonical docs referenced in Section 6 must exist in every new project repo before the
first sprint begins — or the bootstrap exception above must be applied.

---

*Created: 2026-08-06 — adapted from the Fracttal PRM template (post-Sprint-26 revision, which
introduced the model-declaration header in PR #197).*
