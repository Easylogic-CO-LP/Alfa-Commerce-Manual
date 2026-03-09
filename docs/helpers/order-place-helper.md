---
sidebar_position: 2
title: OrderPlaceHelper
---

# OrderPlaceHelper

`Alfa\Component\Alfa\Site\Helper\OrderPlaceHelper` handles the complete order placement flow as an atomic database transaction.

**Location:** `site/src/Helper/OrderPlaceHelper.php`

## Flow

```
1. validateOrderPrerequisites() → Cart not empty, methods valid
2. triggerBeforePlaceEvents()   → Plugins validate
3. BEGIN TRANSACTION
   ├── saveUserInfo()           → #__alfa_user_info
   ├── saveOrder()              → #__alfa_orders
   ├── saveOrderItems()         → #__alfa_order_items
   ├── deductStock()            → #__alfa_items.stock
   └── createOrderHistory()     → #__alfa_order_activity_log
   COMMIT
4. loadOrderModel()             → Reload complete order
5. triggerAfterPlaceEvents()    → Payment/shipment plugins create records
6. clearCart()                  → Empty shopping cart
```

## Key Behaviors

- **Atomic** — If any step fails, the entire order is rolled back
- **Dynamic default status** — Read from database, not hardcoded
- **Stock deduction** — Respects the status's `stock_operation` flag
- **Price snapshot** — Items store exact prices at time of purchase
