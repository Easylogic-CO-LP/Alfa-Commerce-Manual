---
sidebar_position: 11
title: SEO Analyzer
---

# SEO Analyzer

A live SEO panel embedded in the **item** and **category** editors. As you type the title, alias, meta fields, focus
keyword and content, it shows a Google-style snippet preview and a graded checklist with an overall 0–100 score. It
updates over AJAX (`SeoController::getPreview`) and renders the `seo.preview` layout.

## What it shows

- **Snippet preview** — the page title (meta title, with the site name added per Joomla's `sitename_pagetitles`
  setting) and the **real front-end URL** (resolved through the router, so it reflects the actual route). An empty alias
  is generated from the title via `OutputFilter::stringURLSafe`.

## What it checks

Each check returns a status + 0–100 score, averaged into the overall score:

| Check | Good when |
|-------|-----------|
| Title length | 30–60 chars |
| Meta description | 120–160 chars (falls back to content if empty) |
| Alias | ≤100 chars, only `[a-z0-9-_]` |
| Content length | ≥100 words (main + additional content combined) |
| Readability | avg words/sentence ≤15 easy, ≤20 moderate |
| Focus keyword | present in title (bonus at the start), meta, URL; density 0.5–2.5% |
| Robots | `index,follow` best; `noindex,nofollow` worst; "use global" when unset |

All measurement is UTF-8-aware, and content is stripped of HTML before scoring.

> Reference: `administrator/src/Controller/SeoController.php`, `administrator/layouts/seo/preview.php`.
