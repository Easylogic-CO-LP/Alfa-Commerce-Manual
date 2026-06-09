---
sidebar_position: 4
title: OrderShipmentHelper
---

# OrderShipmentHelper

`Alfa\Component\Alfa\Administrator\Helper\OrderShipmentHelper` provides a fluent builder for creating and managing shipment records.

**Location:** `administrator/src/Helper/OrderShipmentHelper.php`

## Fluent Builder — Create

```php
$id = OrderShipmentHelper::for($order)
    ->pending()
    ->withAllItems()
    ->cost(12.50, 10.00)  // tax incl, tax excl
    ->trackingNumber('TRACK123')
    ->carrier('My Carrier')
    ->save();
```

## Fluent Builder — Update

```php
OrderShipmentHelper::load($id)->shipped()->trackingNumber('NEW123')->save();
OrderShipmentHelper::load($id)->delivered()->save();
OrderShipmentHelper::load($id)->cancelled()->save();
```

## Builder Methods

| Method | Description |
|--------|-------------|
| `->pending()` | Status: pending |
| `->shipped()` | Status: shipped (auto-sets timestamp) |
| `->delivered()` | Status: delivered (auto-sets timestamps) |
| `->cancelled()` | Status: cancelled |
| `->onHold()` | Status: on_hold |
| `->returned()` | Status: returned |
| `->withAllItems()` | Assign all order items |
| `->withItems([...])` | Assign specific item IDs |
| `->withNoItems()` | No items assigned |
| `->cost($incl, $excl)` | Shipping cost |
| `->trackingNumber($num)` | Tracking number |
| `->trackingUrl($url)` | Tracking URL |
| `->carrier($name)` | Carrier name |
| `->weight($kg)` | Total weight |
| `->save()` | Persist to database |

## Static CRUD

```php
OrderShipmentHelper::create($data);
OrderShipmentHelper::update($id, $data);
OrderShipmentHelper::delete($id, $orderId);
OrderShipmentHelper::get($id);
OrderShipmentHelper::getByOrder($orderId);
OrderShipmentHelper::assignItems($shipmentId, $orderId, [101, 102]);
```

## Status Constants

```php
OrderShipmentHelper::STATUS_PENDING
OrderShipmentHelper::STATUS_SHIPPED
OrderShipmentHelper::STATUS_DELIVERED
OrderShipmentHelper::STATUS_CANCELLED
OrderShipmentHelper::STATUS_ON_HOLD
OrderShipmentHelper::STATUS_RETURNED
```
