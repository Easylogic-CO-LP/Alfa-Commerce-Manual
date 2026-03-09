---
sidebar_position: 4
title: Pricing Engine
---

# Pricing Engine

The pricing engine is the heart of Alfa Commerce. It calculates prices based on four dimensions: **currency**, **user group**, **location**, and **quantity** — applying discounts and taxes automatically.

## Calculation Pipeline

```
PricingIntent (catalog/cart/checkout/quote)
  → PriceContext (currency, user, groups, location)
    → PriceCalculator
      → Load base price from #__alfa_items_prices
      → Load applicable discounts (scoped by category, group, place)
      → Calculate discounted price
      → Load applicable taxes (scoped by category, group, place)
      → Calculate tax amount
        → PriceResult (immutable value object)
```

## Pricing Intent

`PricingIntent` defines the calculation scope — how quantities are interpreted:

```php
use Alfa\Component\Alfa\Site\Service\Pricing\PricingIntent;

// Product listing — uses product's minimum order quantity
PricingIntent::catalog();

// Shopping cart — uses actual cart quantities
PricingIntent::cart(['item_123' => 3, 'item_456' => 1]);

// Checkout confirmation
PricingIntent::checkout($quantities);

// Custom quote with override quantity
PricingIntent::quote($quantities, $minQuantity);
```

## Price Context

`PriceContext` represents the visitor's four pricing dimensions:

```php
use Alfa\Component\Alfa\Site\Service\Pricing\PriceContext;

// Auto-detect from current session
$context = PriceContext::fromSession();

// Manual construction for indexing
$context = PriceContext::forIndex($currencyId, $placeId, $usergroupId);

// Fluent modification
$context = $context
    ->withCurrency(1)
    ->withLocation(42)
    ->withUserGroups([0, 5])
    ->withUserId(100);
```

## Price Result

`PriceResult` is an immutable value object containing all calculated prices:

### Total Amounts (price x quantity)

| Method | Description |
|--------|-------------|
| `getBaseTotal()` | Original price x qty |
| `getSubtotal()` | After discounts, before tax |
| `getTaxTotal()` | Total tax amount |
| `getTotal()` | Final price customer pays |

### Unit Prices (per item)

| Method | Description |
|--------|-------------|
| `getBasePrice()` | Original price per unit |
| `getSubtotalPrice()` | After discounts, before tax, per unit |
| `getTaxPrice()` | Tax per unit |
| `getPrice()` | Final price per unit |

### Savings & Discounts

| Method | Description |
|--------|-------------|
| `getSavingsTotal()` | Total discount amount |
| `getSavingsPrice()` | Discount per unit |
| `getSavingsPercent()` | Discount percentage |
| `hasDiscount()` | Boolean — has any discount |

### Taxes

| Method | Description |
|--------|-------------|
| `getTaxes()` | TaxSummary object |

## Money Value Object

All monetary values are `Money` objects — immutable, currency-aware, with safe arithmetic:

```php
use Alfa\Component\Alfa\Site\Service\Pricing\Money;

// Creation
$price = Money::of(19.99, $currency);       // From major units
$price = Money::ofMinor(1999, $currency);   // From cents
$price = Money::zero($currency);             // Zero
$price = Money::parse("$1,234.56", $currency);

// Arithmetic
$total = $price->multiply(3);
$discounted = $price->subtract($discount);
$withTax = $price->add($tax);
$perUnit = $total->divide(3);

// Comparison
$price->isPositive();
$price->isZero();
$price->compareTo($other);

// Formatting
echo $price->format(); // "€19.99"

// Aggregation
$sum = Money::sum($price1, $price2, $price3);
```

## Discount & Tax Scoping

Both discounts and taxes use the same three-dimension scoping system:

```
Discount/Tax Rule
  ├── Categories: [Electronics, Clothing] or [0] = all
  ├── User Groups: [Wholesale, VIP] or [0] = all
  └── Places: [Greece, Cyprus] or [0] = all
```

A rule applies to a product if **all three dimensions match**:
- Product is in a matching category (or rule applies to all categories)
- Current user is in a matching group (or rule applies to all groups)
- Current location matches (or rule applies to all locations)

## Price Index

For fast catalog filtering, `PriceIndexSyncService` maintains a denormalized index:

```php
use Alfa\Component\Alfa\Administrator\Service\PriceIndexSyncService;

// After saving an item
PriceIndexSyncService::syncItem($itemId);

// After changing a discount
PriceIndexSyncService::syncByDiscount($discountId);

// After changing a tax rule
PriceIndexSyncService::syncByTax($taxId);

// Full rebuild
PriceIndexSyncService::syncAll();
```

The index stores pre-computed prices for every (currency, place, usergroup) combination, enabling SQL-level price range filtering without runtime calculation.
