---
sidebar_position: 6
title: Order System
---

# Order System

The order system handles the complete lifecycle from checkout to fulfillment. Order placement is an atomic transaction with event-driven plugin integration.

## Order Placement Flow

All order placement logic lives in `OrderPlaceHelper` (`site/src/Helper/OrderPlaceHelper.php`):

```
1. validateOrderPrerequisites()
   ├── Cart is not empty
   ├── Payment method is valid
   └── Shipment method is valid

2. triggerBeforePlaceEvents()
   ├── onOrderBeforePlace → payment plugin validates
   └── onOrderBeforePlace → shipment plugin validates

3. BEGIN DATABASE TRANSACTION
   ├── saveUserInfo()         → #__alfa_user_info
   ├── saveOrder()            → #__alfa_orders
   ├── saveOrderItems()       → #__alfa_order_items (with PriceResult data)
   ├── deductStock()          → Update #__alfa_items.stock (if status requires)
   └── createOrderHistory()   → #__alfa_order_activity_log
   COMMIT (or ROLLBACK on any error)

4. loadOrderModel()           → Reload complete order object

5. triggerAfterPlaceEvents()
   ├── onOrderAfterPlace → payment plugin creates payment record
   └── onOrderAfterPlace → shipment plugin creates shipment record

6. clearCart()                → Empty shopping cart
```

### Key Design Decisions

- **Atomic transactions** — If any step fails, the entire order is rolled back
- **Dynamic default status** — The default order status is read from the database, not hardcoded
- **Stock deduction** — Respects the default status's `stock_operation` flag
- **Price snapshot** — Order items store the exact prices at the time of purchase
- **Comprehensive logging** — Every order event is logged to the activity log

## Order Data Structure

```
Order
├── id, reference
├── id_user, id_cart
├── id_currency, conversion_rate
├── id_payment_method, payment_method_name (snapshot)
├── id_shipment_method, shipment_method_name (snapshot)
├── id_order_status
├── total_shipping_tax_incl, total_shipping_tax_excl
├── total_paid_tax_incl, total_paid_tax_excl
├── ip_address, customer_note
├── created, modified
│
├── items[]                    → Order line items
│   ├── id_item, quantity
│   ├── item_name, item_sku (snapshots)
│   ├── unit_price_tax_incl, unit_price_tax_excl
│   ├── total_price_tax_incl, total_price_tax_excl
│   ├── unit_discount, total_discount
│   └── tax_rate, tax_amount
│
├── payments[]                 → Payment records
│   ├── amount, id_currency
│   ├── payment_type (payment/refund/authorization)
│   ├── transaction_status (pending/authorized/completed/failed/cancelled/refunded)
│   ├── transaction_id (gateway reference)
│   └── gateway_response (raw JSON)
│
├── shipments[]                → Shipment records
│   ├── shipping_cost_tax_incl, shipping_cost_tax_excl
│   ├── tracking_number, carrier_name
│   ├── status (pending/shipped/delivered/cancelled/on_hold/returned)
│   └── shipped, delivered (timestamps)
│
└── activity_log[]             → Audit trail
    ├── event (e.g., 'order.created')
    ├── id_order_status, status_name
    ├── summary, context (JSON)
    └── id_employee, created
```

## Order Totals

Order totals are always **computed from items**, never stored as static columns:

```
total_paid_real = SUM(payments.amount)
                  WHERE payment_type = 'payment'
                  AND transaction_status = 'completed'

Payment status:
  'paid'    → total_paid_real >= order total
  'partial' → 0 < total_paid_real < order total
  'unpaid'  → total_paid_real = 0
```

## Stock Management

Stock deduction is controlled by the order status's `stock_operation` flag:

```php
// In OrderPlaceHelper
$defaultStatus = OrderStockHelper::getDefaultOrderStatus();
if ($defaultStatus->stock_operation == 0) {
    // Deduct stock
    OrderStockHelper::deductOrderStock($orderId);
}
```

| `stock_operation` | Meaning |
|-------------------|---------|
| `0` | Deduct stock when order enters this status |
| `1` | Do not deduct stock |

## Order Status Transitions

Order statuses are fully customizable in the admin panel. Each status has:
- A name and color
- A `stock_operation` flag
- Optional email notification templates

Common flow:
```
New → Processing → Shipped → Delivered
         └── Cancelled
         └── On Hold → Processing
```

## Activity Log

Every significant order event is logged to `#__alfa_order_activity_log`:

```php
OrderHelper::logActivity($orderId, [
    'event' => 'order.created',
    'id_order_status' => $statusId,
    'status_name' => 'New',
    'summary' => 'Order placed by customer',
    'context' => json_encode(['ip' => $ip, 'total' => $total]),
]);
```

The activity log powers the order timeline in the admin panel, showing every status change, payment, shipment, and admin action.
