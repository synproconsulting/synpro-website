# SynPro Website — Sprint History

> Append-only log of what landed, session by session. Newest entries at the bottom of
> each section, or maintain a running "current session" block per PROMPT_TEMPLATE.md
> Section 6. CLAUDE.md carries the current-state summary; this file carries the trail.

---

## Pre-Sprint — Initial state (2026-08)

Recorded at scaffolding, before Sprint 1.

**Live:** single-page holding site at `https://synproconsulting.co`, served by GitHub
Pages from `synproconsulting/synpro-website` (`main` `/root`). Dark gradient landing
page — SynPro logo, tagline **FACILITIES & WORKPLACE ADVISORY**, blue→green divider,
"Website coming soon".

**Repo root:** `index.html` (self-contained, no build step), `logo.png` (transparent),
`CNAME` (`synproconsulting.co`).

**DNS (Namecheap):** four GitHub apex `A` records + `www` CNAME →
`synproconsulting.github.io`; HTTPS enforced. Mail records (MX/Exchange Online, SPF,
DKIM, DMARC `p=reject`, Resend `send.contact` records, autodiscover) present and
OFF-LIMITS to this project.

**Canonical docs created this scaffolding pass:** CLAUDE.md, PROJECT_CONTEXT.md,
CLAUDE_HISTORY.md (this file), RUNBOOK.md, PROMPT_TEMPLATE.md.

**Not yet built:** CI pipeline, shared chrome, full home page, services/about pages,
contact form (AD-2). This is Sprint 1+ work.

**Jira:** project key `SWEB` (create/confirm before Sprint 1).

**No PRs merged yet.** Sprint history proper begins at Sprint 1 closeout.

---
