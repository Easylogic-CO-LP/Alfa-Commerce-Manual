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
- **Level 5** analysis
- Scans all PHP source directories
- Excludes templates, layouts, and language files
- Ignores Joomla dynamic property patterns

## Running Locally

```bash
# Install
composer global require phpstan/phpstan

# Run analysis
phpstan analyse --configuration=phpstan.neon --memory-limit=512M
```

## On GitHub

PHPStan errors appear as **inline annotations** on the PR's Files Changed tab. Each annotation shows:
- The line number
- What the problem is
- Sometimes a fix suggestion

PHPStan does **not** auto-fix — you must fix issues manually and push again.
