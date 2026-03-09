---
sidebar_position: 2
title: PHP CS Fixer
---

# PHP CS Fixer

PHP CS Fixer automatically formats PHP code to follow PSR-12 standards. It runs on every PR and **commits fixes directly to your branch**.

## What It Fixes

- **Indentation** — Tabs to 4 spaces
- **Spacing** — Around operators, after keywords, in function signatures
- **Braces** — Consistent placement
- **Imports** — Sorted alphabetically, unused removed
- **Arrays** — `array()` to `[]` short syntax
- **Quotes** — Double to single when no interpolation
- **Trailing commas** — Added in multiline arrays/parameters

## Configuration

The config lives in `.php-cs-fixer.php` at the project root. It scans:

- `administrator/src/`
- `site/src/`
- `api/src/`
- `plugins/`
- `modules/`

## Running Locally

```bash
# Install
composer global require friendsofphp/php-cs-fixer

# Check what would change (dry run)
php-cs-fixer fix --config=.php-cs-fixer.php --allow-risky=yes --dry-run --diff

# Auto-fix everything
php-cs-fixer fix --config=.php-cs-fixer.php --allow-risky=yes
```

## On GitHub

When the workflow runs:
1. PHP CS Fixer finds and fixes issues
2. If changes were made, it commits them as `github-actions[bot]`
3. Commit message: `style: auto-fix code style with PHP CS Fixer`
4. **You must pull** before making more commits on the branch
