/**
 * Link check with an explicit route list  (SWEB-30)
 *
 * THE PROBLEM THIS SOLVES. `linkinator ./dist` crawls outward from `/`. Nothing links
 * to the content pages — deliberately, because there is no navigation until the cutover
 * PR (AD-10) — so the crawl reached the placeholder and stopped. It passed having
 * scanned 5 links and would not have failed on a broken reference anywhere else. That
 * is the project's fifth green-but-inert control.
 *
 * THE FIX. Every built HTML file is enumerated from `dist/` and handed to linkinator as
 * an explicit starting point. The route list is DERIVED FROM THE BUILD, not hand-typed,
 * so a page added in a later sprint is covered the day it exists and the list cannot
 * drift out of step with the site.
 *
 * The site itself gains nothing: no navigation is added. The checker gets the routes.
 *
 * Exits non-zero on any broken link, so the `links` job stays blocking (AD-6 — a
 * non-blocking check fails silently forever).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { LinkChecker } from 'linkinator';

const DIST = 'dist';
const config = JSON.parse(readFileSync('.linkinatorrc.json', 'utf8'));

/** Every .html file in dist/, as a site-root-relative URL path. */
function routes(dir = DIST) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...routes(full));
    } else if (name.endsWith('.html')) {
      const rel = relative(DIST, full).split(sep).join('/');
      // index.html is served at its directory root; keep the directory form so the
      // checked URL matches the one a visitor actually requests.
      out.push('/' + rel.replace(/(^|\/)index\.html$/, '$1'));
    }
  }
  return out;
}

const paths = routes().sort();
if (paths.length === 0) {
  console.error('No HTML found in dist/. Run `npm run build` first.');
  process.exit(1);
}

console.log(`Checking ${paths.length} route(s) derived from the build:`);
for (const p of paths) console.log(`  ${p}`);

// `path` takes several starting points; `serverRoot` serves dist/ over http so each is
// fetched exactly as a visitor would request it, rather than as a file:// path.
const result = await new LinkChecker().check({
  path: paths,
  serverRoot: DIST,
  recurse: config.recurse ?? true,
  linksToSkip: config.skip ?? [],
});

const broken = result.links.filter((link) => link.state === 'BROKEN');
const skipped = result.links.filter((link) => link.state === 'SKIPPED').length;

console.log(
  `\nScanned ${result.links.length} links across ${paths.length} route(s) ` +
    `(${skipped} skipped as external).`,
);

if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s):`);
  for (const link of broken) {
    console.error(`  ${link.status ?? '???'}  ${link.url}`);
    if (link.parent) console.error(`         referenced by ${link.parent}`);
  }
  process.exit(1);
}

console.log('No broken links.');
