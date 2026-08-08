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
      // MUST stay 'esbuild'. Not `true`, and never 'lightningcss'  (SWEB-16).
      //
      // `true` is not a neutral "on" here: it resolves to Astro 7.2.0's default CSS
      // minifier, which is Lightning CSS. Lightning CSS 1.33.0 DROPS
      // `-webkit-background-clip: text` while KEEPING `-webkit-text-fill-color:
      // transparent`. On any engine that still needs the prefix for
      // `background-clip: text`, the clip never applies but the fill stays
      // transparent — so the gradient "coming soon" renders as an invisible bar.
      // That is the Sprint 1 defect, and SWEB-16 confirmed it still reproduces on
      // the current toolchain rather than trusting the Sprint 1 memory.
      //
      // esbuild keeps the prefixed and unprefixed declarations together, so it
      // minifies without the defect. Measured on this page (SWEB-16):
      //
      //   cssMinify        inlined CSS   -webkit-background-clip   renders
      //   false             16,017 B     kept                      correct
      //   'esbuild'          5,895 B     kept                      correct
      //   true/lightningcss  5,724 B     STRIPPED                  INVISIBLE
      //
      // The extra 171 bytes Lightning CSS would save is the entire upside, against
      // a text-invisible regression. Verified by screenshot at four viewports on a
      // normal engine and on a simulated prefix-requiring engine: esbuild output is
      // pixel-identical to the unminified baseline in all eight captures.
      //
      // This is enforced, not remembered: the `build` job in .github/workflows/ci.yml
      // fails if dist/ ever contains `-webkit-text-fill-color` without a matching
      // `-webkit-background-clip`. Flipping this value to `true` will fail CI.
      //
      // REVISIT when Lightning CSS emits `-webkit-background-clip` alongside the
      // unprefixed property — falsifiable, unlike the old "if the CSS pipeline
      // changes". See PROJECT_CONTEXT.md §4 for the test that decides it.
      cssMinify: 'esbuild',
    },
  },
});
