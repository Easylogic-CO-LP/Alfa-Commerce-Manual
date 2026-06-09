---
sidebar_position: 3
title: PHPStan
---

# PHPStan

PHPStan analyses PHP code without running it. It catches bugs like undefined methods, wrong types, and logic errors.

## What It Catches

```php
// Method doesn't exist
$order->getTotel();
// Error: Method getTotel() not found. Did you mean getTotal()?

// Undefined variable
return $price * $taxRate;
// Error: Variable $taxRate might not be defined

// Wrong comparison
if ($status = 'active') {
// Error: Assignment in condition. Did you mean ==?
```

## Configuration

The config lives in `phpstan.neon`:
- **Level 5** over the PHP source directories (templates, layouts and language files are excluded).
- **Resolves Joomla against the latest release.** CI downloads the latest Joomla into `./joomla` each run, and
  `scanDirectories: [joomla]` makes PHPStan aware of the `Joomla\CMS\*` / `Joomla\*` framework classes the component
  extends (the repo has **no** Composer dependencies). A small `bootstrapFiles` stub declares `_JEXEC` / the `JPATH_*` constants.
- **Curated `ignoreErrors`** for Joomla's interface→concrete typing — methods that exist on the concrete runtime class
  (`SiteApplication`, `ListModel`, `DatabaseDriver`, …) but not on the interface the type-hint declares. These are false
  positives, not bugs.
- **A baseline** (`phpstan-baseline.neon`) snapshots the genuine pre-existing findings so CI stays green and only **new**
  regressions get flagged. Chip away at it and regenerate over time.

> Docblock `@since` tags are normalised to `1.0.0` project-wide (the earlier mixed values were copy-paste artefacts).

## Running Locally

PHPStan needs a Joomla tree to resolve framework classes, so fetch one first:

```bash
# 1. Populate ./joomla (CI does this automatically)
scripts/phpstan-fetch-joomla.sh

# 2. Run analysis
phpstan analyse --configuration=phpstan.neon --memory-limit=1G
```

## On GitHub

PHPStan errors appear as **inline annotations** on the PR's Files Changed tab. Each annotation shows:
- The line number
- What the problem is
- Sometimes a fix suggestion

PHPStan does **not** auto-fix — you must fix issues manually and push again.
