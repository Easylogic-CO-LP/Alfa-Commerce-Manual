---
sidebar_position: 5
title: PriceSettings
---

# PriceSettings

`Alfa\Component\Alfa\Site\Helper\PriceSettings` controls which price components are visible to each user group.

**Location:** `site/src/Helper/PriceSettings.php`

## Visibility Fields (13 total)

| Field | What it controls |
|-------|-----------------|
| `base_price_show` / `_show_label` | Original price before discounts |
| `base_price_with_discounts_show` / `_show_label` | Price after discounts, before tax |
| `discount_amount_show` / `_show_label` | Discount amount |
| `tax_amount_show` / `_show_label` | Tax amount |
| `base_price_with_tax_show` / `_show_label` | "Was" price (base + tax) |
| `final_price_show` / `_show_label` | Final customer price |
| `price_breakdown_show` | Show full price breakdown |

## Resolution Order

1. **User group settings** (JSON in `#__alfa_usergroups.prices_display`, gated by `prices_enable = 1`) — highest priority
2. **Global component config** (from component parameters) — fallback

## Usage

```php
use Alfa\Component\Alfa\Site\Helper\PriceSettings;

// Current user's settings (auto-resolved)
$settings = PriceSettings::get();

// Specific user
$settings = PriceSettings::get($userId);

// Global defaults
$settings = PriceSettings::global();
```

## Presets

```php
PriceSettings::minimal();  // Final price only, no labels
PriceSettings::compact();  // All prices, no labels
PriceSettings::full();     // Everything with labels
```

## Filtering

```php
PriceSettings::only('final', 'base');   // Show only these
PriceSettings::except('tax');            // Hide these
```

## Builder

```php
$settings = PriceSettings::make()
    ->show('base')
    ->show('discount', false)  // show value, hide label
    ->hide('tax')
    ->get();
```
