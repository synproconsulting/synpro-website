/**
 * Content collections  (SWEB-19)
 *
 * D7: page copy lives in Markdown under src/content/ so text can be edited without
 * touching a component. PROJECT_CONTEXT.md §2 documents the shape; this file is the
 * executable copy of it.
 *
 * THREE COLLECTIONS, BECAUSE THE CONTENT IS GENUINELY THREE SHAPES.
 *
 *   pages      one entry per route. Shared metadata plus the blocks that page needs.
 *   practices  the two Services practice areas. Ordering and grouping only.
 *   offerings  the six Services offerings. Repeating structure, so it is data.
 *
 * Flattening offerings into `pages` would have meant six near-identical frontmatter
 * blocks inside one file; the schema follows the copy rather than the other way round.
 *
 * WHERE PROSE LIVES — the one rule to know before editing.
 *
 *   Markdown BODY   continuous prose that needs inline formatting (italics, bold,
 *                   links). Rendered through Astro's Markdown pipeline.
 *   FRONTMATTER     short discrete strings and structured/spec data. Rendered as
 *                   plain text — Markdown syntax in these fields will NOT render.
 *
 * Every field below was checked against the drafts: no frontmatter string in this
 * sprint's copy needs inline formatting. Prose that does (the journal title on About,
 * the italicised "why" on Services) lives in a body.
 */

import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Per-route <title> and meta description (SWEB-24). Drafted, not owner-approved. */
const seo = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
});

/** A call to action. `label` is button text; no href — nothing links out yet (AD-10). */
const cta = z.object({
  heading: z.string().optional(),
  body: z.string(),
  label: z.string(),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: seo.extend({
    /** The page H1. */
    title: z.string(),
    /** Lead paragraphs under the H1. */
    intro: z.array(z.string()).optional(),
    cta: cta.optional(),

    // ---- Home only (SWEB-23) ----------------------------------------------
    hero: z
      .object({
        headline: z.string(),
        body: z.string(),
        ctaLabel: z.string(),
      })
      .optional(),
    /** The credibility bar. Exactly four items per the draft. */
    credibility: z.array(z.object({ figure: z.string(), text: z.string() })).optional(),
    practicesIntro: z.string().optional(),
    /** Two practice cards. They deliberately do not link anywhere yet. */
    practiceCards: z
      .array(z.object({ title: z.string(), body: z.string(), ctaLabel: z.string() }))
      .optional(),
    /** Short standalone prose blocks, in render order. */
    sections: z
      .array(
        z.object({
          heading: z.string(),
          paragraphs: z.array(z.string()),
          ctaLabel: z.string().optional(),
        }),
      )
      .optional(),

    // ---- Services only (SWEB-20) ------------------------------------------
    /** The independence disclosure. The most consequential content on the page. */
    independence: z.object({ heading: z.string(), paragraphs: z.array(z.string()) }).optional(),

    // ---- Contact only (SWEB-22) -------------------------------------------
    /**
     * Both copy AND specification. The enquiry values and the success/failure strings
     * are the source of truth for the Worker built in a later sprint — the Worker
     * validates against exactly these. Do not reword them to suit the UI.
     */
    form: z
      .object({
        fields: z.array(
          z.object({
            name: z.string(),
            label: z.string(),
            placeholder: z.string().optional(),
            type: z.enum(['text', 'email', 'select', 'textarea']),
            required: z.boolean(),
          }),
        ),
        /** Exactly four permitted values. Any other value is rejected server-side. */
        enquiryTypes: z.array(z.string()).length(4),
        submitLabel: z.string(),
        /** Shape-identical by AD-8 — an observer must not infer the outcome. */
        messages: z.object({ success: z.string(), failure: z.string() }),
        validation: z.object({
          nameEmpty: z.string(),
          emailEmpty: z.string(),
          emailMalformed: z.string(),
          enquiryEmpty: z.string(),
          messageEmpty: z.string(),
          messageTooLong: z.string(),
        }),
        /** No limit was specified in the draft; the Worker will need one. */
        messageMaxLength: z.number(),
      })
      .optional(),
    email: z.string().optional(),
    linkedin: z.object({ label: z.string(), href: z.string().url() }).optional(),
  }),
});

const practices = defineCollection({
  loader: glob({ base: './src/content/practices', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    /** Render order on /services. */
    order: z.number(),
  }),
});

const offerings = defineCollection({
  loader: glob({ base: './src/content/offerings', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Render order within the whole page, matching the draft's 1–6 numbering. */
    order: z.number(),
    practice: reference('practices'),
    /** The "What you get" list. */
    deliverables: z.array(z.string()),
    /** The "Who it's for" line. */
    whoFor: z.string(),
    /** Offering 5's conflict-of-interest note. Only one offering carries one. */
    note: z.string().optional(),
  }),
});

export const collections = { pages, practices, offerings };
