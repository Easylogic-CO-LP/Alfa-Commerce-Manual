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
| `onPaymentResponse` | Customer returns from the gateway | Verify payment, then **redirect** to the result page (redirect-only — no layout) |
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

## Capability tiers

Events fall into three capability tiers, so a plugin hook can only do what its stage
actually supports:

| Tier | Base class | Can | Example hooks |
|------|-----------|-----|---------------|
| **Data** | `GeneralEvent` | the subject only | `onOrderBeforePlace`, `onOrderAfterPlace`, `onCalculateShippingCost`, `onAdminOrderAfterSave` |
| **Redirect** | `RedirectEvent` | `setRedirectUrl()` | `onPaymentResponse` |
| **View** | `LayoutEvent` | `setLayout()` **+** `setRedirectUrl()` | `onCartView`, `onItemView`, `onOrderProcessView`, `onOrderCompleteView`, admin order views |

**Rule of thumb:** redirect and layout belong to the presentation/navigation layer — the
HtmlView-rendered hooks (which render inline *or* redirect away) and the gateway-return
controller (`onPaymentResponse`, redirect-only, no view). Everything fired from
plugin/helper logic outside a view is a pure **data** hook and has neither capability —
calling `setRedirectUrl()` or `setLayout()` on it is an error.

## Event Class Hierarchy

```
Joomla\CMS\Event\AbstractImmutableEvent
  └── GeneralEvent ............ data only (the subject)
        └── RedirectEvent ..... + setRedirectUrl() / setRedirectCode()
              └── LayoutEvent .. + setLayout() / setLayoutData()
```

Each domain has thin bases extending those tiers:

```
GeneralEvent  →  PaymentsEvent / ShipmentsEvent           (data:     onOrderAfterPlace, onOrderBeforePlace, onCalculateShippingCost …)
RedirectEvent →  PaymentsRedirectEvent / ShipmentsRedirectEvent   (redirect: onPaymentResponse)
LayoutEvent   →  PaymentsLayoutEvent / ShipmentsLayoutEvent       (view:     onCartView, onItemView, onOrderProcessView, onOrderCompleteView …)
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

The available setters depend on the event's [tier](#capability-tiers): `setLayout()` exists
only on **view** events, and `setRedirectUrl()` only on **view** and **redirect** events. Data
events expose neither. The `setError()` / `setMessage()` / `setRefresh()` / shipping-cost setters
below belong to specific events (the admin **action** events and `onCalculateShippingCost`) — not to
every event.

```php
// Set a template to render (view events only)
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
7. ──→ onOrderProcessView (payment plugin: redirect to the gateway, OR render the gateway form inline)
   │
8. [Customer pays at the gateway]
   │
9. Gateway returns the customer → PaymentController (task=payment.response)
   ──→ onPaymentResponse (verify payment; REDIRECT-ONLY — no layout here)
        • success     → redirect to the complete page → onOrderCompleteView renders confirmation
        • cancel/error → redirect to the process page (&<plugin>_result=…) → onOrderProcessView renders it
   │
   (a server webhook — task=plugin.trigger&…&func=notify, no session — may also confirm payment out-of-band)
```
