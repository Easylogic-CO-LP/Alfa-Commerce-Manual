---
sidebar_position: 7
title: Pricing Examples
---

# Pricing Examples

Practical code examples for working with the pricing engine, Money objects, and price display.

## Basic Money Usage

```php
use Alfa\Component\Alfa\Site\Service\Pricing\Currency;
use Alfa\Component\Alfa\Site\Service\Pricing\Money;

// Load currency from database
$currency = Currency::loadByNumber(978);    // EUR by ISO number
$currency = Currency::loadByCode('EUR');    // EUR by code
$currency = Currency::getDefault();         // Default component currency

// Create money objects
$price = Money::of(99.99, $currency);
$fromCents = Money::ofMinor(9999, $currency); // 99.99 from cents
$zero = Money::zero($currency);

// Format for display
echo $price->format();         // "99,99 €"
echo $price->format(false);    // "99,99" (without symbol)

// Arithmetic
$doubled = $price->multiply(2);              // 199.98 €
$discounted = $price->percentage(10);        // 9.999 € (10% of price)
$afterDiscount = $price->subtract($discounted);

// Comparison
$price->greaterThan(Money::of(50, $currency)); // true
$price->isPositive();                          // true
$price->isZero();                              // false

// Get raw values
$amount = $price->getAmount();      // 99.99
$cents = $price->getMinorUnits();   // 9999
```

## Currency Conversion

```php
$eur = Currency::loadByCode('EUR');
$usd = Currency::loadByCode('USD');

$priceInEur = Money::of(100, $eur);

// Convert with exchange rate
$priceInUsd = $priceInEur->convertTo($usd, 1.10);

echo $priceInEur->format(); // "100,00 €"
echo $priceInUsd->format(); // "$110.00"
```

## Money Allocation (Splitting)

```php
$currency = Currency::getDefault();
$total = Money::of(100, $currency);

// Split into 3 equal parts (handles rounding correctly)
$parts = $total->allocate(3);
// Result: [33.34, 33.33, 33.33] — no cents lost

// Split by ratios
$parts = $total->allocateByRatios([1, 2, 3]);
// Result: [16.67, 33.33, 50.00]
```

## Using the Price Computation Engine

```php
use Alfa\Component\Alfa\Site\Service\Pricing\PriceComputationEngine;
use Alfa\Component\Alfa\Site\Service\Pricing\PriceContext;

$engine = new PriceComputationEngine();

// Price tiers (quantity-based pricing)
$prices = [
    (object) ['quantity_start' => 1,  'quantity_end' => 10,   'value' => 10.00],
    (object) ['quantity_start' => 11, 'quantity_end' => 50,   'value' => 9.00],
    (object) ['quantity_start' => 51, 'quantity_end' => null,  'value' => 8.00],
];

// Discounts
$discounts = [
    (object) [
        'id' => 1,
        'name' => 'Volume Discount',
        'value' => 10,            // 10%
        'is_amount' => 0,         // 0 = percentage, 1 = fixed amount
        'apply_before_tax' => 1,  // 1 = before tax, 0 = after tax
        'behavior' => 1,          // 0 = only this, 1 = combine, 2 = sequential
    ],
];

// Taxes
$taxes = [
    (object) [
        'id' => 1,
        'name' => 'VAT',
        'value' => 24,    // 24%
        'behavior' => 1,  // 0 = only this, 1 = combine, 2 = sequential
    ],
];

// Compute
$result = $engine->compute(
    productId: 456,
    quantity: 25,
    prices: $prices,
    discounts: $discounts,
    taxes: $taxes,
    context: $context,
);

// Read results
echo $result->getTotal()->format();       // Final price
echo $result->getBasePrice()->format();   // Before discounts
echo $result->getSubtotal()->format();    // After discounts, before tax
echo $result->getTaxTotal()->format();    // Tax amount

if ($result->hasDiscount()) {
    echo "You save: " . $result->getSavingsTotal()->format();
    echo " (" . number_format($result->getSavingsPercent(), 0) . "%)";
}
```

## Discount Behavior Modes

| Value | Mode | Description |
|-------|------|-------------|
| `0` | Exclusive | Only this discount applies (highest priority wins) |
| `1` | Combine | All discounts added together, then applied once |
| `2` | Sequential | Each discount applied in order on the running total |

**Example with two 10% discounts on a 100.00 base:**

| Mode | Calculation | Result |
|------|------------|--------|
| Combine (`1`) | 100 - (10% + 10%) = 100 - 20% | 80.00 |
| Sequential (`2`) | 100 - 10% = 90, then 90 - 10% | 81.00 |

## Displaying Prices in Templates

```php title="tmpl/item.php"
<div class="price-display">
    <div class="base-price">
        Original: <del><?= $priceResult->getBasePrice()->format(); ?></del>
    </div>

    <?php if ($priceResult->hasDiscount()): ?>
        <div class="savings">
            Save <?= $priceResult->getSavingsTotal()->format(); ?>
            (<?= number_format($priceResult->getSavingsPercent(), 0); ?>%)
        </div>
    <?php endif; ?>

    <div class="final-price">
        Total: <strong><?= $priceResult->getTotal()->format(); ?></strong>
    </div>

    <div class="unit-price">
        <?= $priceResult->getPrice()->format(); ?> per item
    </div>
</div>
```

## Price in API Responses

```php
$result = $this->computePrice($productId, $quantity);

// Minimal response
$response = [
    'success' => true,
    'price' => $result->toMinimalArray(),
];
// Returns:
// {
//   "total": 99.99,
//   "formatted": "99,99 €",
//   "currency": "EUR",
//   "quantity": 1
// }

// Full response with breakdown
$response = [
    'success' => true,
    'price' => $result->toArray(),
];

// Or direct JSON
return $result->toJson();
```

## Price Breakdown (Debugging)

```php
$breakdown = $result->getBreakdown();

foreach ($breakdown->toArray()['steps'] as $step) {
    echo "{$step['description']}: {$step['amount']['formatted']} ({$step['operation']})\n";
}

// Output:
// Base Price (2 x 10,00): 20,00 € (set)
// Volume Discount (-10%): 2,00 € (subtract)
// VAT (+24%): 4,32 € (add)
// Total: 22,32 €
```

## Advanced Money Operations

```php
$currency = Currency::getDefault();

// Rounding to currency's decimal places
$price = Money::of(99.999, $currency);
$rounded = $price->round(); // 100.00

// Ensure non-negative (safe for final prices)
$negative = Money::of(-10, $currency);
$safe = $negative->nonNegative(); // 0.00

// Sum multiple amounts
$total = Money::sum($price1, $price2, $price3);
```

## Custom Currency (e.g., Cryptocurrency)

```sql
INSERT INTO #__alfa_currencies (
    name, code, number, symbol,
    decimal_place, decimal_separator, thousand_separator,
    format_pattern, state
) VALUES (
    'Bitcoin', 'BTC', 999, '₿',
    8, '.', ',',
    '{symbol} {number}', 1
);
```

```php
$btc = Currency::loadByCode('BTC');
$price = Money::of(0.00123456, $btc);
echo $price->format(); // "₿ 0.00123456" (8 decimal places)
```

## Migration from Old System

If you're migrating code from the old `PriceFormat::format()` system:

```php
// OLD (deprecated)
$formatted = PriceFormat::format($value);

// NEW (recommended)
$currency = Currency::getDefault();
$money = Money::of($value, $currency);
$formatted = $money->format();

// Or using the helper shortcut
$money = PriceFormat::createMoney($value);
$formatted = $money->format();
```

### Migration Checklist

- Replace `number_format()` calls with `Money` objects
- Replace `PriceFormat::format()` with `Money::format()`
- Update `PriceResult` usage to use Money object methods
- Remove manual currency symbol handling
- Update JSON responses to use `PriceResult::toArray()`
- Test with different currencies, discounts, taxes, and edge cases
