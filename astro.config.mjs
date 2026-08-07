// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical origin for generated absolute URLs. The site is served from this
  // custom domain via GitHub Pages; see public/CNAME and AD-9 in PROJECT_CONTEXT.md.
  site: 'https://synproconsulting.co',

  vite: {
    build: {
      // CSS minification is disabled deliberately. The default minifier drops
      // `-webkit-background-clip: text` while keeping `-webkit-text-fill-color:
      // transparent`, which renders the gradient "coming soon" text invisible on
      // any engine without unprefixed `background-clip: text`. The stylesheet is
      // ~2.5 kB, so the saving is not worth a visible regression.
      cssMinify: false,
    },
  },
});
