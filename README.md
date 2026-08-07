# synpro-website

The public marketing website for **SynPro Consulting** — facilities and workplace advisory.

**Live:** https://synproconsulting.co

A statically generated site with exactly one planned dynamic surface: a contact form that
delivers an enquiry email. No database, no authentication, no server-side session state.

## Tech stack

| Layer | Technology |
| --- | --- |
| Site framework | [Astro](https://astro.build) 7.2.0 |
| Hosting | GitHub Pages, custom domain `synproconsulting.co` |
| CI/CD | GitHub Actions |
| Contact form endpoint | Cloudflare Worker *(not yet created)* |
| Email delivery | Resend HTTPS API *(not yet wired up)* |

## Local development

Requires Node.js 22.12 or newer.

```bash
npm install        # install dependencies
npm run dev        # dev server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run format     # apply Prettier formatting
npm run format:check   # verify formatting (blocking in CI)
npm run links      # check the built output for broken internal links (blocking in CI)
```

## Deployment

`main` is production — **there is no staging environment.** A merge to `main` publishes to the
live public domain within roughly a minute.

Changes reach the site through a `feature/`, `fix/`, or `docs/` branch and a pull request. CI runs
three blocking checks — `build`, `format`, and `links` — and a rule-based auto-merger merges the PR
once all three pass. The `deploy` job then publishes `dist/` to GitHub Pages.

> `public/CNAME` binds the custom domain and is copied into every build. The `build` job asserts it
> is present in `dist/` and contains the right hostname; if it ever goes missing the custom domain
> silently reverts to unconfigured. Do not remove or relocate it.

## Documentation

The canonical project documentation lives alongside this file:

- [`CLAUDE.md`](CLAUDE.md) — project context, hard rules, architectural decisions
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — deep implementation reference
- [`RUNBOOK.md`](RUNBOOK.md) — operational procedure
- [`CLAUDE_HISTORY.md`](CLAUDE_HISTORY.md) — sprint history
