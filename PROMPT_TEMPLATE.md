# SynPro Website — Claude Code Prompt Template

> This file defines the mandatory structure every Claude Code prompt must follow.
> Audience: Claude chat (the prompt author).
> It does not duplicate CLAUDE.md hard rules — those govern Claude Code (the Dev Agent).
> This file governs the *structure* of prompts; CLAUDE.md governs the *content* of sessions.

---

## Mandatory Prompt Structure

Every Claude Code prompt generated for this project must contain all of the following sections in this exact order. Missing any section is a prompt authoring error.

---

### Prompt header — Model declaration (MANDATORY — top of every prompt)

Every generated Claude Code prompt must declare the model explicitly in a header line at the very top, before Section 1, e.g.:

```
# Model: Claude Sonnet 5 (claude-sonnet-5) · <one-line PR summary>
```

**Claude Sonnet 5 (`claude-sonnet-5`) is the default development model for this project.** Every prompt defaults to Sonnet 5 unless a specific sprint's planning session explicitly selects a different model — in which case name that model in the header instead. Never omit the model header.

---

### SECTION 1 — Pre-flight sync (MANDATORY — always first)

Every prompt must open with:

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

Purpose: guarantees Claude Code reads the current canonical docs and source files, not stale local copies from a prior session.

---

### SECTION 2 — Zero open PRs check (MANDATORY)

Every prompt must verify zero open PRs before any work:

```
GET https://api.github.com/repos/synproconsulting/synpro-website/pulls?state=open
If any PR is open → STOP and report. Do not proceed.
```

Purpose: enforces the one-PR-at-a-time hard rule (CLAUDE.md).

---

### SECTION 3 — Read canonical docs (MANDATORY)

Every prompt must instruct Claude Code to read all four canonical docs from GitHub via the Contents API before any work:

- `CLAUDE.md`
- `RUNBOOK.md`
- `PROJECT_CONTEXT.md`
- `CLAUDE_HISTORY.md`

Purpose: restores full project context. A session that skips this step operates on an incomplete picture and produces incorrect results.

---

### SECTION 4 — Read all relevant source files (MANDATORY)

Every prompt must list every source file that will be modified and instruct Claude Code to read each one from GitHub via the Contents API before writing a single line of code.

Purpose: prevents Claude Code from writing against a stale or assumed version of a file. The Contents API read is the ground truth.

---

### SECTION 5 — Implementation tasks

The actual work. Clearly scoped. One task at a time where possible. Each task must specify:

- Exact files to modify
- Exact changes to make
- What NOT to change (explicit preservation rules — always including the `CNAME` file, AD-3)
- Any static-site constraints (no build step per AD-1; no secrets in a public repo)

---

### SECTION 6 — Canonical docs update (MANDATORY — same PR as code)

Every prompt must include explicit instructions to update all four canonical docs in the same branch and same PR as the code change.

Minimum updates required in every PR:

**CLAUDE.md:**
- Update "Last PR merged" / current-state paragraph
- Add any new Hard Rules or ADs if introduced in this session

**CLAUDE_HISTORY.md:**
- Append a new session entry or extend the current session entry
- Record: date, last PR, what landed

**PROJECT_CONTEXT.md:**
- Update Section 3 (Component / File Structure) if pages/files added
- Update Section 5 (Deployment) if the deploy/DNS shape changed
- Update Section 6 (ADs) if new ADs added
- Update Section 7 (Frontend Design Standards) if design tokens/standards changed
- Update Section 1 (API Endpoints) when the contact-form endpoint is wired (AD-2)

**RUNBOOK.md:**
- Add operational notes if new patterns or behaviours require operational awareness
- Update the last-updated line always

Rule: a PR that changes behaviour without updating the docs is incomplete. The auto-merger merging the PR is the moment the docs should already be current.

---

### SECTION 7 — PR rules (MANDATORY)

Every prompt must specify:

- Branch name (`feature/`, `fix/`, or `docs/` prefix)
- Commit message (conventional commits format, e.g. `feat(SWEB-XX): …`)
- PR title
- PR body contents (what to confirm before opening — including that `CNAME` is preserved and no secret entered the diff)
- Instruction to wait for CI green and auto-merger merge

One PR per session — all tasks in one branch and one commit. Before opening: confirm no unintended files in diff and that `CNAME` is intact.

---

### SECTION 8 — Closeout report (MANDATORY)

Every prompt must end with a structured closeout report template that Claude Code fills in after the PR merges. Minimum fields:

- PR number and URL
- Files changed (list each)
- What changed in each file
- Docs updated (confirm each of the four canonical docs)
- Post-merge state: last PR; confirm site loads at `https://synproconsulting.co`; confirm `CNAME` present on `main`

---

### SECTION 9 — Post-flight sync (MANDATORY — always last)

Every prompt must close with:

```cmd
cd "C:\Johan\SynPro Consulting\Website\Website Development"
git fetch origin
git reset --hard origin/main
git clean -fd --exclude=Documentation/
```

Purpose: leaves the local working tree in a clean state matching `origin/main` exactly, ready for the next session.

---

## Cross-Project Applicability

This template applies to all projects built with the SynPro AI-powered Virtual Development Team pattern. When scaffolding a new project, copy this file to the new repo root and update the working directory path in Sections 1 and 9, and the repo slug in Sections 2 and 4.

The four canonical docs referenced in Section 6 must also exist in every new project repo before the first sprint begins:

- `CLAUDE.md`
- `CLAUDE_HISTORY.md`
- `PROJECT_CONTEXT.md`
- `RUNBOOK.md`

---

*Created: 2026-08 — SynPro Website scaffolding, adapted from the Fracttal PRM template (2026-05-26).*
*Applies to: all Claude Code prompt sessions on this project.*
