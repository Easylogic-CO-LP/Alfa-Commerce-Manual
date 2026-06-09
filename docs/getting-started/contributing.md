---
sidebar_position: 3
title: Contributing
---

# Contributing

For the complete contribution guide, see [CONTRIBUTING.md](https://github.com/Easylogic-CO-LP/Alfa-Commerce/blob/main/CONTRIBUTING.md) on GitHub.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/Alfa-Commerce.git
cd Alfa-Commerce

# 2. Create a branch from developer
git checkout developer
git checkout -b feature/my-feature

# 3. Make changes, commit, push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# 4. Open a Pull Request targeting "developer" branch
```

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases only |
| `developer` | Active development — create branches from here |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

## Exporting your changes for a PR

If you developed on a live install rather than the repo, use **Components → Alfa Commerce → Tools → Export package**
to turn that install back into the source-repo layout:

- It reads `alfa.xml` as the source of truth and reassembles every declared file (component, plugins, modules, media,
  languages) into the flat `site` / `administrator` / `api` repo structure — so the ZIP diffs cleanly for a PR.
- **`&changed=1` (changed-only)** exports just the files that differ from the official release, for a minimal PR.
- **Bundled `libraries/` are excluded** (a live install can't reproduce an installable library folder), so the export
  is a **source / PR artifact**, not a guaranteed-installable ZIP — add library folders from the repo by hand to test it.
- Before exporting a structural change, create the artifacts it needs: `sql/updates/mysql/<version>.sql`, the
  removed-files list `files/removed/<version>.json`, and the `alfa.xml` version bump (the Tools screen reminds you).

## Automated Checks

Every Pull Request triggers automated checks:

1. **PHP CS Fixer** — auto-fixes code style and commits fixes to your branch (on PRs only)
2. **PHPStan** — reports PHP bugs as inline annotations
3. **Claude AI Review** — AI code review with inline suggestions
4. **Security scans** — CodeQL, secret-scanning, and dependency/vulnerability checks

**Wait for every check to finish — and read the Claude review — before merging**, on both the feature→`developer`
and `developer`→`main` PRs. That pipeline exists to catch regressions before they land.

See the [CI/CD & Tooling](/docs/tooling/workflows) section for details on each check.

## Coding Standards

- **PHP**: PSR-12 (enforced by PHP CS Fixer)
- **Indentation**: 4 spaces (not tabs)
- **Strings**: Single quotes unless interpolation is needed
- **Arrays**: Short syntax `[]`
- **Database**: Always use Joomla's `DatabaseDriver` — never raw SQL
- **Input**: Always sanitize with Joomla's `InputFilter`
