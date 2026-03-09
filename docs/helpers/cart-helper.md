---
sidebar_position: 1
title: CartHelper
---

# CartHelper

`Alfa\Component\Alfa\Site\Helper\CartHelper` manages all shopping cart operations.

**Location:** `site/src/Helper/CartHelper.php`

## Usage

```php
use Alfa\Component\Alfa\Site\Helper\CartHelper;

$cart = new CartHelper($cartId);
```

## Methods

### addToCart($itemId, $quantity)
Add an item to the cart or update its quantity.

### clearCart($clearOnlyItems = false)
Empty the cart. Pass `true` to keep the cart header and only clear items.

### updateShipment($shipmentMethodId)
Select a shipping method for the cart.

### updatePayment($paymentMethodId)
Select a payment method for the cart.

## Totals (all return Money objects)

| Method | Returns |
|--------|---------|
| `getTotal()` | Items total (tax included) |
| `getTotalExcl()` | Items total (tax excluded) |
| `getTotalItems()` | Count of unique items |
| `getTotalQuantity()` | Sum of all quantities |
| `getDiscountTotal()` | Total discount saved |
| `getTaxTotal()` | Total tax amount |
| `getShipmentTotal()` | Shipping cost (tax included) |
| `getShipmentTotalExcl()` | Shipping cost (tax excluded) |
| `getGrandTotal()` | Items + shipping (tax included) |
| `getGrandTotalExcl()` | Items + shipping (tax excluded) |

## Plugin Events

```php
$cart->addEventsToShipments(); // Fire onCartView for shipment plugins
$cart->addEventsToPayments();  // Fire onCartView for payment plugins
```
