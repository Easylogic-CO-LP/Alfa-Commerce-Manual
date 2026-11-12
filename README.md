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
| `docusaurus.config.ts` | Site settings, and the Alfa Commerce release the manual documents (`customFields.alfaVersion`) |
| `src/components/AlfaVersion.tsx` | The version line under each page's title |
| `src/pages/index.tsx` | The landing page |
| `static/` | Images and other static files |

## Versions

The manual documents one Alfa Commerce release, set once in `docusaurus.config.ts`. Each page states the release it
was last checked against, with `<AlfaVersion verified="2.2.0" />` under its title. Change a page's value only when
the page has been checked against that release's code.

## Publishing

A push to `main` builds the site and uploads it to manual.alfacommerce.gr (`.github/workflows/deploy.yml`). Changes
reach the site by merging a pull request; nothing is copied to the server by hand.
