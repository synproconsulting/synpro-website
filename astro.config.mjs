// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical origin for generated absolute URLs. The site is served from this
  // custom domain via GitHub Pages; see public/CNAME and AD-9 in PROJECT_CONTEXT.md.
  site: 'https://synproconsulting.co',

  build: {
    // Set explicitly (SWEB-12). The default is 'auto', which inlines a stylesheet
    // only while it stays under ~4 kB — so output STRUCTURE changed as a side effect
    // of stylesheet size. That is what produced the SWEB-11 defect: the same commit
    // built to a 5102-byte page with the CSS inlined in CI, and a 1093-byte page with
    // a separate .css file locally, purely because CRLF line endings pushed the
    // stylesheet 120 bytes over the threshold.
    //
    // 'always' is chosen because it reproduces what production already serves, which
    // is what lets SWEB-12 prove itself inert by byte-identical output. SWEB-13 grows
    // the stylesheet well past 4 kB, so under 'auto' the flip would have happened
    // silently in the same PR that also changed the CSS — two changes at once, and no
    // way to attribute a diff to either.
    //
    // TRADE-OFF, recorded rather than discovered later: inlining costs cross-page
    // caching. With one route that is free. Once a second route exists, a shared
    // stylesheet is duplicated into every page instead of being fetched and cached
    // once, and 'never' becomes the better choice. Revisit when routes are added —
    // see PROJECT_CONTEXT.md §2.
    inlineStylesheets: 'always',
  },

  vite: {
    build: {
      // CSS minification is disabled deliberately. The default minifier drops
      // `-webkit-background-clip: text` while keeping `-webkit-text-fill-color:
      // transparent`, which renders the gradient "coming soon" text invisible on
      // any engine without unprefixed `background-clip: text`.
      //
      // REVISIT CONDITION MET, REVISIT DEFERRED (SWEB-13). The recorded condition
      // for reopening this was a change to the CSS pipeline, and Sprint 3 is that
      // change: the stylesheet moved into src/styles/ and grew from ~2.5 kB to
      // roughly 12 kB, so the saving is no longer negligible. The owner deferred
      // the revisit to Sprint 4 rather than change the CSS pipeline and re-enable
      // minification in the same PR — Sprint 3's whole proof is byte-identical
      // rendering, and re-enabling the minifier here would have destroyed it.
      //
      // Sprint 4 must test whether the -webkit-background-clip regression still
      // reproduces on the current Lightning CSS, then either re-enable with a
      // guard or re-record this decision with fresh evidence. This is a deferred
      // decision, not an oversight.
      cssMinify: false,
    },
  },
});
