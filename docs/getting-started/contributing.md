---
sidebar_position: 4
title: Contributing
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Contributing

How to propose a change to Alfa Commerce — from a one-line fix to a new feature — and turn it into a pull request. For how the codebase is organized, see [Project Structure](./project-structure).

## Prerequisites

| You'll need | Notes |
|-------------|-------|
| **PHP 8.2+** | Matches the component's runtime requirement |
| **Joomla 6 or 7** | A local install for testing (XAMPP, WAMP, MAMP, Laravel Herd, …) |
| **Git + a GitHub account** | Direct branch (team) or fork-and-PR (external) |
| **GitHub Desktop** *(optional)* | The no-terminal path below |

## Branches

| Branch | Use |
|--------|-----|
| `main` | Stable releases. **Never** commit or PR directly. |
| `developer` | Active development. **Base every branch here, and target it with PRs.** |
| `feat/*` | New features — e.g. `feat/free-shipping-threshold` |
| `fix/*` | Bug fixes — e.g. `fix/cart-total-rounding` |

Release flow: `feat/*` / `fix/*` branches merge into **`developer`**, then a maintainer merges **`developer`** into **`main`** to cut a release.

## Before you commit: structural changes

If your change adds or alters structure, do these **first** — the package export only ships what's declared in the manifest:

- **Added a plugin, module, or library?** Declare it in `alfa.xml` (under `<plugins>`, `<modules>`, or `<libraries>`). The export only includes what's declared, so an undeclared extension is silently left out of the package and won't install.
- **Changed the database?** Put your `ALTER` / `CREATE` statements in a new `sql/updates/mysql/<new-version>.sql` **and** add the same statements to `sql/install.mysql.utf8.sql` (so fresh installs get them). Always use the `#__` table prefix — Joomla swaps in the site's real prefix — never your install's literal prefix. On update, Joomla runs every update file newer than the site's installed schema.
- **Deleted or moved a file?** List the old paths in `files/removed/<new-version>.json`, shaped `{"files":[…],"folders":[…]}` with root-relative paths. Joomla never deletes files dropped between versions on its own.
- **Bump the version.** Set `<version>` in `alfa.xml` to the new number (matching the file names above) and add a `changelog.xml` entry — the version bump is what triggers the update SQL and the file cleanup.

:::tip
The backend **Tools → Contributing** screen runs these checks for you (manifest-vs-disk drift, missing release artifacts, version-bump reminders) and provides the package-export download described below.
:::

## Step by step

<Tabs>
<TabItem value="desktop" label="GitHub Desktop (easiest)" default>

No terminal needed.

<details>
<summary>Outside contributor (no push access)? — fork steps</summary>

Fork the repo on GitHub, then in Desktop clone **your** fork instead of step 1 — when asked *"How are you planning to use this fork?"*, choose **To contribute to the parent project**. Steps 2–8 are unchanged; your pull request targets the parent's `developer`.

</details>

1. **Clone (one-time).** *File → Clone repository* → on the **GitHub.com** tab pick `Easylogic-CO-LP/Alfa-Commerce`, choose a local folder, **Clone**.
2. **Branch off `developer`.** Click **Current Branch** → select `developer` → **Fetch origin**. Then **Current Branch → New Branch**, name it `feat/short-description`, base it on `developer`, **Create Branch** → **Publish branch**.
3. **Get your changed files in.** Do the [structural-changes](#before-you-commit-structural-changes) steps if relevant, then download your changes from **Tools → Contributing** (see the [Package Export Tool](../tooling/export-package)) and extract the zip **over** the repo folder. Extracting only adds/overwrites — so **delete any files you removed** by hand; the **Changes** tab then shows them as deletions. Don't delete a file just because it isn't in your install (the repo keeps things your install doesn't have, e.g. other-language files).
4. **Review.** The **Changes** tab lists every file — green = added, yellow = modified, red = removed. Click one to see its diff.
5. **Commit.** Bottom-left, fill the **Summary** (short, imperative — "Add…", "Fix…") and optional Description, then **Commit to feat/short-description**.
6. **Catch up to `developer`.** **Current Branch → Choose a branch to merge into…** → `developer` → merge. Resolve any conflicts now, not inside the PR.
7. **Push.** Click **Push origin**.
8. **Open the PR.** **Preview Pull Request** → confirm **base: `developer`** (never `main`) → **Create Pull Request**. Add a concise title and a description: what changed, why, and how to test it (link an issue with `Closes #123`).

</TabItem>
<TabItem value="cli" label="Git commands">

<details>
<summary>Outside contributor (no push access)? — fork steps</summary>

Fork on GitHub, then adjust steps 1, 2 and 6:

```bash
# 1 — clone your fork and add the upstream remote
git clone https://github.com/YOUR-USERNAME/Alfa-Commerce.git
cd Alfa-Commerce
git remote add upstream https://github.com/Easylogic-CO-LP/Alfa-Commerce.git

# 2 — branch off the upstream developer
git fetch upstream
git checkout -b feat/short-description upstream/developer

# 6 — catch up from upstream
git fetch upstream && git merge upstream/developer
```

Steps 3–5 and 7 are unchanged; your push goes to your fork. In step 8, open the PR from your fork into `Easylogic-CO-LP/Alfa-Commerce:developer`.

</details>

```bash
# 1. Clone (one-time)
git clone https://github.com/Easylogic-CO-LP/Alfa-Commerce.git
cd Alfa-Commerce

# 2. Branch off developer
git checkout developer
git pull
git checkout -b feat/short-description        # or fix/short-description

# 3. Do the structural-changes steps, then bring your changed files in
#    (e.g. the Tools -> Contributing package export, extracted over the repo).
#    Extracting only adds/overwrites — remove files you deleted yourself:
git rm path/to/old-file

# 4. Review what changed
git status
git diff

# 5. Commit (short, imperative)
git add -A
git commit -m "Add free-shipping threshold to cart"

# 6. Catch up to developer before the PR
git fetch origin
git merge origin/developer

# 7. Push
git push -u origin feat/short-description
```

8. **Open the PR** on GitHub (*Compare & pull request*): set **base: `developer`** (switch it from `main` — never target `main`), a concise title, and a description (what/why/how to test; `Closes #123`).

</TabItem>
</Tabs>

:::caution Libraries aren't in the export
The package export skips everything under `libraries/` (a library's `script.php` only exists at install time, so it can't be recovered from a live site). If you changed a library, copy those files into the repo's `libraries/` by hand and commit them — otherwise they're dropped from your PR.
:::

## Coding standards

PHP CS Fixer enforces formatting automatically, so focus on substance.

- **PHP** — PSR-12; 4-space indent; short array syntax `[]`; single quotes unless interpolating; type-hinted parameters and returns; all database access via Joomla's `DatabaseDriver` (never raw SQL); sanitise input with `InputFilter`. Keep `tmpl/` and `layouts/` presentation-only.
- **JavaScript** — `const` / `let` (never `var`), single quotes, semicolons.

Full conventions and namespaces live in [Project Structure](./project-structure).

## Automated checks

Every Pull Request runs **PHP CS Fixer**, **PHPStan**, the **Claude AI reviewer**, and **security scans** (CodeQL, secret-scanning, dependency checks). Wait for every check to pass — and read the Claude review — before a PR is merged. What each does and how to run them locally: [CI/CD & Tooling](../tooling/workflows).

## Opening a pull request

Before you open a PR, confirm:

- [ ] Branched from `developer` and targeting `developer`.
- [ ] One focused change — unrelated edits split out.
- [ ] Structural change? Declared in `alfa.xml`; a DB change has the migration **and** the install-schema update **and** a version bump; deleted files listed in `files/removed/`.
- [ ] User-facing strings use `Text::_()` with keys defined in the `.ini`.
- [ ] Ran the component locally and confirmed it works.

## Getting help

- **Found a bug?** Open an issue with steps to reproduce.
- **Have a feature idea?** Open an issue with the `enhancement` label.
- **Question on a PR?** Mention `@claude` for an automated review, or tag a maintainer.
- **Contact:** info@easylogic.gr · [easylogic.gr](https://easylogic.gr)
