---
sidebar_position: 6
title: Pricing
---

# Pricing

The pricing engine calculates a price across four dimensions — **currency**, **user group**, **location**, and
**quantity** — applying scoped discounts and taxes automatically. All money is returned as immutable `Money` objects.

```
PricingIntent (catalog / cart / checkout / quote)
  → PriceContext (currency, user, groups, location)
    → base price (#__alfa_items_prices, by quantity tier)
    → − discounts (scoped) → + taxes (scoped)
      → PriceResult (immutable)
```

## Computing a price

```php
use Alfa\Component\Alfa\Site\Service\Pricing\{PricingIntent, PriceContext};

$intent  = PricingIntent::cart(['item_123' => 3]);   // catalog() · cart($qty) · checkout($qty) · quote($qty, $min)
$context = PriceContext::fromSession();               // or ::forIndex($currencyId, $placeId, $usergroupId)
```

`PriceContext` is fluent: `->withCurrency(1)->withLocation(42)->withUserGroups([0,5])->withUserId(100)`.

### PriceResult

Immutable value object — totals (× quantity) and unit prices, all `Money`:

| Total | Unit | Meaning |
|-------|------|---------|
| `getBaseTotal()` | `getBasePrice()` | original |
| `getSubtotal()` | `getSubtotalPrice()` | after discounts, before tax |
| `getTaxTotal()` | `getTaxPrice()` | tax |
| `getTotal()` | `getPrice()` | final |

Plus `getSavingsTotal()` / `getSavingsPercent()` / `hasDiscount()`, and `toArray()` / `toMinimalArray()` / `toJson()`
for API responses.

## Money

```php
use Alfa\Component\Alfa\Site\Service\Pricing\{Money, Currency};

$c = Currency::getDefault();                  // or ::loadByCode('EUR') / ::loadByNumber(978)
$p = Money::of(19.99, $c);                    // ::ofMinor(1999,$c) · ::zero($c)
$p->multiply(3)->subtract($d)->add($tax);     // safe arithmetic (immutable)
$p->allocate(3);                              // split with no lost cents
echo $p->format();                            // "19,99 €"  (format(false) = no symbol)
```

## Discount & tax scoping

Both use the same three-dimension scope — a rule applies only if **all three** match (or are set to *all*, value `0`):

```
Categories: [Electronics] or [0]=all   ·   User Groups: [VIP] or [0]=all   ·   Places: [Greece] or [0]=all
```

**Behavior** when several apply: `0` exclusive (highest wins) · `1` combine (summed, applied once) · `2` sequential
(applied in order on the running total). Two 10% discounts on 100: combine → 80.00, sequential → 81.00.

## Price index

`PriceIndexSyncService` keeps a denormalized index (pre-computed price per currency/place/usergroup) so the catalog can
filter by price in SQL. The component syncs it automatically on item save and discount/tax change; call it manually only
for bulk data work:

```php
PriceIndexSyncService::syncItem($itemId);   // ::syncByDiscount($id) · ::syncByTax($id) · ::syncAll()
```

## Displaying prices — PriceSettings

`Alfa\Component\Alfa\Site\Helper\PriceSettings` controls which price components are visible, **per user group**. It
resolves user-group settings first (JSON in `#__alfa_usergroups.prices_display`, gated by `prices_enable = 1`), then
falls back to the component config.

```php
use Alfa\Component\Alfa\Site\Helper\PriceSettings;

$settings = PriceSettings::get();        // current user (or ::get($userId) / ::global())
PriceSettings::minimal();                // final price only · compact() · full()
PriceSettings::only('final', 'base');    // or ::except('tax')
PriceSettings::make()->show('base')->show('discount', false)->hide('tax')->get();
```

Visibility fields (each a `_show` + optional `_show_label`): `base_price`, `base_price_with_discounts`,
`discount_amount`, `tax_amount`, `base_price_with_tax` ("was" price), `final_price`, and `price_breakdown_show`.

## In a template

```php
<del><?= $priceResult->getBasePrice()->format(); ?></del>
<?php if ($priceResult->hasDiscount()): ?>
  Save <?= $priceResult->getSavingsTotal()->format(); ?> (<?= number_format($priceResult->getSavingsPercent(), 0); ?>%)
<?php endif; ?>
<strong><?= $priceResult->getTotal()->format(); ?></strong>
```
