# SynPro Website — Runbook

> Operational reference for deploying, maintaining, and recovering the site.
> Read at session start alongside the other canonical docs. Update the last-updated
> line on every PR that changes operational behaviour.

---

## Deployment

- **Host:** GitHub Pages, repo `synproconsulting/synpro-website`, branch `main`, `/root`.
- **How a deploy happens:** merge to `main`. GitHub Pages rebuilds and republishes
  automatically within ~1–2 minutes. There is **no build step** (AD-1) — the served
  site is exactly the files on `main`.
- **Verify a deploy:** load `https://synproconsulting.co` and hard-refresh
  (Ctrl/Cmd+Shift+R). The `github.io` origin
  (`https://synproconsulting.github.io/synpro-website/`) serves the same content and
  can be used to isolate DNS/cert issues from content issues.

## Custom domain & TLS

- The root **`CNAME`** file contains `synproconsulting.co` and binds Pages to the
  custom domain (AD-3). **If it is ever removed, the domain drops to the `github.io`
  URL and HTTPS breaks.** Restore it by re-adding a `CNAME` file containing exactly
  `synproconsulting.co` and committing via PR.
- **TLS** is GitHub-issued and auto-renewing. "Enforce HTTPS" is on in repo
  Settings → Pages. A freshly (re)issued cert can take up to an hour to propagate; a
  transient cert warning right after a domain change is normal.

## DNS (Namecheap — Advanced DNS)

**Website records (the ONLY records this project may touch):**

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | synproconsulting.github.io |

**OFF-LIMITS — mail & domain infrastructure (never edited for a site change):**
MX → `synproconsulting-co.mail.protection.outlook.com`; SPF
(`v=spf1 include:spf.protection.outlook.com -all`); DMARC `p=reject;sp=reject`; DKIM
`selector1`/`selector2` CNAMEs; the `send.contact` Resend SPF + MX and
`resend._domainkey.contact`; `autodiscover` CNAME; the `MS=` verification TXT.

> If a site change ever appears to need a DNS edit beyond the five website records
> above, STOP and confirm in chat first.

**Verify DNS:**
```
nslookup synproconsulting.co 8.8.8.8            # expect the four 185.199.x.x A records
nslookup -type=CNAME www.synproconsulting.co 8.8.8.8
```

## Rollback

- **Bad content merged to `main`:** open a `fix/` branch that reverts the offending
  change (via the GitHub REST API, per AD-5), PR it, let CI + auto-merger merge. Pages
  redeploys the reverted state automatically. There is no separate "deploy rollback" —
  the site state always equals `main`.
- **Site down but DNS/cert fine:** check repo Settings → Pages shows the build green;
  a failed Pages build leaves the previous version live.
- **Domain unreachable / cert error after a change:** confirm the `CNAME` file still
  exists on `main` and the four `A` records + `www` CNAME are intact at Namecheap.

## Contact form (once built — AD-2)

- Submissions are delivered by the third-party form vendor (Formspree/Web3Forms) to
  the configured destination inbox, not stored in this repo.
- The public form ID in the markup is safe to expose. No secret belongs in the repo.
- If the form stops delivering, check the vendor dashboard first (quota, spam,
  destination address), then the client-side POST target in the page markup.

## Secrets

- The repository is **public**. No secrets in the repo, ever (CLAUDE.md Hard Rule).
  Any credential (analytics private key, deploy PAT, etc.) lives only in GitHub Actions
  secrets or the vendor dashboard — never in tracked files.

---

*Last updated: 2026-08 — initial scaffolding, pre-Sprint-1.*
