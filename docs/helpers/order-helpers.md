---
sidebar_position: 5
title: Order Helpers
---

# Order Helpers

Four admin helpers cover the order's items, totals, stock and statuses. All prices are `Money` objects.

## OrderHelper

Line items + product search for the admin order screen.

```php
OrderHelper::getOrder($orderId);                          // raw #__alfa_orders row
OrderHelper::getOrderItems($orderId, $currency = null);   // items with Money prices
OrderHelper::setOrderItems($orderId, $data, $currency = null); // save (insert/update/delete + stock diff)
OrderHelper::buildOrderPriceContext($orderId);            // PriceContext from the order's customer
OrderHelper::searchProducts($term, $context, $limit = 20);
OrderHelper::getProductById($productId, $context, $quantity = 1);
```

`setOrderItems()` indexes lines by **row PK** (same product can appear on multiple lines), reconciles stock per product,
and preserves protected fields (refunds, tax, shipping, discounts). Product search uses the **order's customer context**
(their group + currency), so prices match what that customer sees. (Activity logging is `OrderModel::logOrderActivity()`.)

## OrderTotalHelper

The **single source of truth** for totals — `#__alfa_orders` has no total columns; everything is computed.

```php
OrderTotalHelper::computeFromArrays($items, $shipments, $discounts); // from loaded data (no queries)
OrderTotalHelper::getOrderTotal($orderId, $order = null);            // grand total (tax incl)
OrderTotalHelper::getBreakdown($orderId, $order = null);             // full breakdown object
```

Formula: `grand_total = items + shipping − discounts`. Discounts are stored tax-exclusive, so the tax-inclusive amount
is approximated with the items' average tax multiplier.

## OrderStockHelper

The **only** class that writes `#__alfa_items.stock`.

```php
OrderStockHelper::getDefaultOrderStatus();                 // initial status for new orders
OrderStockHelper::shouldDeductStock($statusId);            // true when stock_operation = 0
OrderStockHelper::handleStatusTransition($orderId, $oldStatusId, $newStatusId);
OrderStockHelper::deductOrderStock($orderId) / ::restoreOrderStock($orderId);
OrderStockHelper::adjustProductStock($productId, $diff);
```

Only products with `manage_stock = 1` are touched; stock may go **negative** (backorder — warns, never blocks). A
status's `stock_operation` governs direction (`0` = out of stock, `1` = in stock); `handleStatusTransition()` acts only
on a real `0↔1` change and logs `stock.deducted` / `stock.restored`.

## OrderStatusHelper

Semantic role lookups over `#__alfa_orders_statuses` (statuses are user-defined, so code asks by role, not id). Memoised
per request.

```php
OrderStatusHelper::getInitialId();      // singleton "new order" status
OrderStatusHelper::getCancelledIds();   // int[] — cancelled family
OrderStatusHelper::getCompletedIds();   // int[] — completed family
OrderStatusHelper::isCancelled($statusId) / ::isCompleted($statusId) / ::isInitial($statusId);
OrderStatusHelper::clearCache();        // after writing the statuses table
```

`is_initial` is a singleton; `is_cancelled` / `is_completed` are multi-row families.
