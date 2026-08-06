# SynPro Consulting Website — Chat Handoff Template

> Use this as the opening message of every new Claude chat session in this project.
> Fill in all fields marked `<...>` before pasting.
> Do not skip sections — each restores context that is lost between chats.

---

## MANDATORY READING — DO THIS FIRST

Before responding to anything in this session, read the following project files in full:

1. `CLAUDE.md`
2. `RUNBOOK.md`
3. `PROJECT_CONTEXT.md`
4. `CLAUDE_HISTORY.md`
5. `PROMPT_TEMPLATE.md`

These are the canonical source of truth. Do not rely on training data or prior chat memory for
any project-specific fact — read the files.

**When generating any Claude Code prompt in this session: read `PROMPT_TEMPLATE.md` before
writing a single section. Every prompt must comply with the mandatory nine-section structure and
carry the model-declaration header. This is non-negotiable.**

---

## CURRENT SYSTEM STATE

| Item | Value |
|---|---|
| Last PR merged | `<#n>` |
| Last Jira key | `<SWEB-XX>` |
| Blocking CI checks | `<list, or "none — CI not yet established">` |
| Live site state | `<what a visitor currently sees>` |
| Contact form | `<not built / live at form.synproconsulting.co>` |
| Production URL | https://synproconsulting.co |
| Pages origin URL | https://synproconsulting.github.io/synpro-website/ |
| Repo | synproconsulting/synpro-website |
| Jira project / board | SWEB / 100 |

> **No staging environment. `main` is production.**

---

## SPRINT STATE

| Sprint | Status | Fix Version | Native Sprint |
|---|---|---|---|
| Sprint `<last>` | Closed | `<id>` | `<id>` |
| Sprint `<next>` | `<Not started / In progress>` | `<id or TBD>` | `<id or TBD>` |

---

## WHAT WAS COMPLETED IN THE PREVIOUS SESSION

PRs merged: `<#n>`

Key deliverables:
- `<one line per major item>`

Bugs fixed:
- `<SWEB-XX: one-line description>`

---

## OPEN BUGS / CARRY-FORWARD ITEMS

| # | Description | Jira | Target sprint |
|---|---|---|---|
| 1 | `<description>` | `<SWEB-XX or not yet logged>` | Sprint `<n>` |

If none: `None — clean state entering this session.`

---

## WHAT NEEDS TO HAPPEN THIS SESSION

1. `<first task>`
2. `<second task>`

---

## KEY DECISIONS CONFIRMED PREVIOUSLY (not yet in a canonical doc)

> Decisions recorded as ADs in `PROJECT_CONTEXT.md` do not need repeating — only decisions not
> yet committed to a file.

- `<decision>`

If none: `None — all decisions are reflected in the canonical docs.`

---

## BACKLOG (do not implement)

- Analytics and the cookie/privacy notice it would require
- Blog or case-study content collection
- Multi-language content
- Any second dynamic surface beyond the contact form (AD-1)
- `<add new deferrals here>`

---

## STANDING INSTRUCTIONS FOR THIS SESSION

- Read `PROMPT_TEMPLATE.md` before generating any Claude Code prompt — no exceptions.
- Every prompt carries the model-declaration header: `claude-sonnet-5`.
- Section 6 (canonical docs update) is always included — docs travel in the same PR as the code.
- No scope is implemented without my explicit confirmation first.
- Do not proceed to the next sprint until I confirm live-site testing on the current one is
  complete.
- Do not implement anything in the backlog above.
- Last Jira key entering this session: `<SWEB-XX>` — all new tickets start after this.
- **Remember there is no staging.** Any change that could take the site down is verified on the
  `github.io` origin URL before the custom domain follows.

---

## AT SESSION CLOSE

- Re-upload any canonical doc changed by this session's PRs to the Claude Project.
- Confirm the post-flight sync ran.
- Confirm `https://synproconsulting.co` loads correctly in a fresh window.

---

*Template version: created 2026-08-06 at project bootstrap.*
*Keep this file in the Claude Project so it is available in every new chat.*
