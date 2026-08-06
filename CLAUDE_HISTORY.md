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

*Next entry: Sprint 1.*
