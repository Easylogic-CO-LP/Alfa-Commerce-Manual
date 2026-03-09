---
sidebar_position: 5
title: Cart System
---

# Cart System

The cart system manages shopping carts for both logged-in users and guests. All cart logic lives in `CartHelper` (`site/src/Helper/CartHelper.php`).

## Cart Data Structure

```
Cart
├── id
├── id_customer (Joomla user ID, or null for guest)
├── recognize_key (cryptographic hash for guest identification)
├── id_payment (selected payment method)
├── id_shipment (selected shipping method)
├── id_user_info_delivery (delivery address)
├── id_user_info_invoice (invoice address)
└── items[]
    └── CartItem
        ├── id_cart
        ├── id_item (product ID)
        ├── quantity
        ├── added (timestamp)
        └── data: Item (full product with PriceResult)
```

## Core Operations

### Adding Items

```php
$cart = new CartHelper($cartId);
$cart->addToCart($itemId, $quantity);
```

What happens internally:
1. Creates a `recognize_key` cookie if the user is a guest (cryptographic hash)
2. Creates a new cart record if none exists
3. Validates stock availability (respects `stock_action` setting)
4. Enforces quantity rules (`quantity_min`, `quantity_max`, `quantity_step`)
5. Inserts or updates `#__alfa_cart_items`

### Updating Selections

```php
$cart->updateShipment($shipmentMethodId);
$cart->updatePayment($paymentMethodId);
```

### Clearing Cart

```php
$cart->clearCart();                  // Clear items + cart header
$cart->clearCart($clearOnlyItems);  // Clear items, keep cart
```

## Price Calculation

Cart items are priced using the **cart** pricing intent, which means quantities from the actual cart are used:

```
1. Query cart metadata from #__alfa_cart_items
2. Use ItemsModel with PricingIntent::cart($quantities)
3. PriceContext::fromSession() auto-detects currency, user, groups, location
4. Each item gets a PriceResult object attached
```

## Cart Totals

All totals return `Money` objects for currency-safe arithmetic:

| Method | Description |
|--------|-------------|
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

## Shipping Cost Calculation

Shipping costs are calculated by dispatching the `onCalculateShippingCost` event to the selected shipment plugin:

```
CartHelper
  → Create CalculateShippingCostEvent
    → Dispatch to active shipment plugin
      → Plugin calculates cost (zone-based, API-based, etc.)
        → Plugin calls $event->setShippingCost($cost)
  → CartHelper reads $event->getShippingCost()
```

## Plugin Integration

The cart fires events for both payment and shipment plugins to render their UI:

```php
// Shipment plugins get to render their cart UI
$cart->addEventsToShipments();

// Payment plugins get to render their cart UI
$cart->addEventsToPayments();
```

Each plugin receives the cart object and its method configuration, and sets a layout template to render.

## Guest vs. Logged-In

| Behavior | Guest | Logged-In |
|----------|-------|-----------|
| Identification | `recognize_key` cookie | `id_customer` (user ID) |
| Cart persistence | Until cookie expires | Permanent |
| Pricing | Default user group | User's assigned groups |
| Addresses | Entered at checkout | Can save/reuse |

## Stock Validation

The cart respects the component's `stock_action` setting:

| Value | Behavior |
|-------|----------|
| `0` | No action — allow adding out-of-stock items |
| `1` | Show notification when stock is low |
| `2` | Prevent adding when out of stock |
