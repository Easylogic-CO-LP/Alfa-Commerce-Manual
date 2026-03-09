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

## Automated Checks

Every Pull Request triggers four automated checks:

1. **PHP CS Fixer** — Auto-fixes code style and commits fixes to your branch
2. **PHPStan** — Reports PHP bugs as inline annotations
3. **Claude AI Review** — AI code review with suggestions
4. **Security Scan** — Vulnerability and secret detection

See the [CI/CD & Tooling](/docs/tooling/workflows) section for details on each check.

## Coding Standards

- **PHP**: PSR-12 (enforced by PHP CS Fixer)
- **Indentation**: 4 spaces (not tabs)
- **Strings**: Single quotes unless interpolation is needed
- **Arrays**: Short syntax `[]`
- **Database**: Always use Joomla's `DatabaseDriver` — never raw SQL
- **Input**: Always sanitize with Joomla's `InputFilter`
