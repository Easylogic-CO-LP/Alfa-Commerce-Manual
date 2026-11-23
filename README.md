# Alfa Commerce Manual

The developer manual of [Alfa Commerce](https://github.com/Easylogic-CO-LP/Alfa-Commerce), published at
[manual.alfacommerce.gr](https://manual.alfacommerce.gr). It is built with [Docusaurus](https://docusaurus.io/).

## Working on it

Node.js 20 or newer.

```bash
npm ci          # install the dependencies
npm start       # local preview with live reload
npm run build   # the production build, into build/
```

Run `npm run build` before opening a pull request. The build fails on a broken internal link.

## Where things are

| Path | What it holds |
|---|---|
| `docs/` | The pages, in Markdown |
| `sidebars.ts` | The order of the pages in the sidebar |
| `docusaurus.config.ts` | Site settings |
| `src/components/AlfaVersion.tsx` | The marker of the release a page was last checked against; it prints nothing |
| `scripts/plugin-templates.mjs`, `src/data/pluginTemplates.json` | The plugin generator's templates, made from the example pages before every start and build |
| `src/pages/index.tsx` | The landing page |
| `static/` | Images and other static files |

## Versions

The manual documents the current Alfa Commerce release. Each page records the release it was last checked against,
with `<AlfaVersion verified="2.3.0" />` under its title; nothing is printed. Change a page's value only when the whole
page has been checked against that release's code.

A change to an example plugin's page changes the plugin generator's templates: `npm run build` (or `npm start`) writes
`src/data/pluginTemplates.json` again, and the change to it is committed with the page.

## Publishing

A push to `main` builds the site and uploads it to manual.alfacommerce.gr (`.github/workflows/deploy.yml`). Changes
reach the site by merging a pull request; nothing is copied to the server by hand.
