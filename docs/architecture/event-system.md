---
sidebar_position: 3
title: Event System
---

# Event System

Alfa Commerce uses Joomla's event dispatcher to enable plugins to hook into every stage of the eCommerce lifecycle. This is the primary extension mechanism — plugins never modify core code, they listen for events.

## How Events Work

```
Core Code (e.g., CartHelper)
  → Creates Event object
    → Dispatches via Joomla EventDispatcher
      → All registered plugins receive the event
        → Plugins modify event data (set layout, calculate cost, etc.)
  → Core reads modified event data
```

## Event Categories

### Payment Events

| Event | When | Purpose |
|-------|------|---------|
| `onCartView` | Cart page renders | Show payment method UI |
| `onItemView` | Product page renders | Show payment info |
| `onOrderBeforePlace` | Before order is saved | Validate payment prerequisites |
| `onOrderAfterPlace` | After order is committed | Create initial payment record |
| `onOrderProcessView` | Order processing page | Redirect to gateway or show instructions |
| `onOrderCompleteView` | Order completion page | Show confirmation message |
| `onPaymentResponse` | Gateway webhook callback | Update payment status |
| `onGetActions` | Admin order edit | Register action buttons |
| `onExecuteAction` | Admin clicks action | Handle the action |

### Shipment Events

| Event | When | Purpose |
|-------|------|---------|
| `onCartView` | Cart page renders | Show shipping method UI |
| `onItemView` | Product page renders | Show shipping info |
| `onCalculateShippingCost` | Cart totals computed | Calculate shipping cost |
| `onOrderBeforePlace` | Before order is saved | Validate shipment prerequisites |
| `onOrderAfterPlace` | After order is committed | Create initial shipment record |
| `onGetActions` | Admin order edit | Register action buttons |
| `onExecuteAction` | Admin clicks action | Handle the action |

### Custom Field Events

| Event | When | Purpose |
|-------|------|---------|
| `onPrepareField` | Field renders | Generate field HTML |
| `onBeforePrepareField` | Before field renders | Pre-processing |
| `onAfterPrepareField` | After field renders | Post-processing |
| `onGetTypes` | Field type listing | Register field types |

### Admin Order Events

| Event | When | Purpose |
|-------|------|---------|
| `AdminOrderViewEvent` | Order edit view loads | Inject plugin UI |
| `AdminOrderPrepareFormEvent` | Order form prepares | Modify form fields |
| `AdminOrderAfterSaveEvent` | Order saved in admin | Post-save logic |
| `AdminOrderDeleteEvent` | Order deleted | Cleanup plugin data |

## Event Class Hierarchy

```
Joomla\Event\AbstractImmutableEvent
  └── GeneralEvent (abstract base)
        ├── PaymentsLayoutEvent
        │     ├── PaymentResponseEvent
        │     └── PaymentsFormEvent
        ├── ShipmentsLayoutEvent
        │     └── CalculateShippingCostEvent
        ├── FormEvent
        └── FieldsEvent
```

## Working with Events

### Reading Event Data (in a plugin)

```php
public function onCartView($event): void
{
    $cart = $event->getCart();       // Cart object
    $method = $event->getMethod();  // Payment/shipment method record
}
```

### Setting Event Results

```php
// Set a template to render
$event->setLayout('default_cart_view');
$event->setLayoutData(['method' => $method, 'cart' => $cart]);

// Set a calculated value
$event->setShippingCost(12.50);
$event->setShippingCostTaxExcl(10.00);

// Set a redirect
$event->setRedirectUrl('https://payment-gateway.com/checkout');
$event->setRedirectCode(303);

// Set an error
$event->setError('Payment validation failed');

// Set a success message and refresh the UI
$event->setMessage('Payment marked as completed');
$event->setRefresh(true);
```

## Event Dispatching Timeline (Order Placement)

```
1. Customer clicks "Place Order"
   │
2. validateOrderPrerequisites()
   │
3. ──→ onOrderBeforePlace (payment plugin validates)
   ──→ onOrderBeforePlace (shipment plugin validates)
   │
4. BEGIN TRANSACTION
   ├── Save user info
   ├── Save order
   ├── Save order items
   ├── Deduct stock (if status requires)
   └── Create activity log
   COMMIT
   │
5. ──→ onOrderAfterPlace (payment plugin creates payment record)
   ──→ onOrderAfterPlace (shipment plugin creates shipment record)
   │
6. Clear cart
   │
7. ──→ onOrderProcessView (payment plugin: redirect to gateway or show instructions)
   │
8. [Customer pays at gateway]
   │
9. ──→ onPaymentResponse (payment plugin: update payment status)
   │
10. ──→ onOrderCompleteView (payment plugin: show confirmation)
```
