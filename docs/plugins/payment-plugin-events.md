---
title: Payment plugin events
description: "Every event a payment plugin receives in Alfa Commerce 2.2.0: when it fires, what it is given and what it must do."
---

# Payment plugin events

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Payment plugins](./payment-plugins.md): start here
- **Payment plugin events** (this page)
- [Payments, refunds and webhooks](./payment-plugin-money.md)
- [A complete payment plugin](./payment-plugin-example.md)

All sixteen events of `PaymentsPlugin::TARGETED_EVENTS` are addressed to one plugin. Which plugin depends on the
event: the plugin of an offered method, the plugin recorded on the order, the plugin recorded on the payment row, or
the plugin named in the address. If that plugin cannot be used, Alfa never asks another one:

| What was asked | What Alfa does when your plugin is unavailable |
|---|---|
| A new order with one of your methods | Refuses the order before anything is saved |
| The item page or the cart | Does not offer your method and draws nothing for it. The page is shown. |
| An order page (process or completed) | Shows a neutral line in place of your part and changes nothing |
| The shopper's return | Shows an error message and sends the shopper to the shop's home page |
| A provider's callback | Answers "503 Service Unavailable" with `Retry-After: 600`, and raises one alert for staff |
| A staff action, or deleting an order | Refuses it, names the plugin as Extensions: Plugins does, and says how to restore it |

The event classes are in the namespace `Alfa\Component\Alfa\Administrator\Event\Payments`, except `ClearDataEvent`.

:::warning Keep the parameter untyped where the base class declares the method
The base classes declare `onItemView`, `onCartView`, `onCartViewAssets`, `onOrderProcessView`, `onOrderCompleteView`,
`onGetActions`, `onExecuteAction` and `onAdminOrderDelete` with an untyped `$event`. PHP does not let a child class
narrow a parameter, so write `($event)` for these eight. A class name before `$event` there stops your plugin from
loading. The other events are yours to type.
:::

## onItemView

Event class: `ItemViewEvent`. You must write this method.

**When it fires.** While the item page is built, once for each payment method of the item that is set to show on
the item page.

**Who receives it.** One plugin: the plugin of that method.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getItem()` | The item being shown |
| `getMethod()` | The method's record: `id`, `name`, `description`, and `params` already decoded to an array |

**What you are expected to do.** Call `setLayout('<file in tmpl, without .php>')` and `setLayoutData([...])`. To draw
somewhere else on the page, ask for a place and set its layout: `paymentMethods()` (the default place),
`title()` (beside the item's title) or `nearAddToCart()`; each returns a builder with `setLayout()` and `setData()`.
Change nothing on the item.

**What happens next.** Alfa draws your layout in the payment methods area of the item page.

**If you are missing or you fail.** Nothing is drawn for your method, the error is written to Joomla's log (category
`com_alfa`), and the page is shown.

## onCartViewAssets

Event class: `CartViewAssetsEvent`. Optional.

**When it fires.** Once per plugin while the cart page, or the administrator's order builder, is built as HTML. It
fires for every plugin that owns a published method, whether the cart offers that method now or not. It never fires
inside a JSON answer.

**Who receives it.** One plugin at a time: each plugin that owns a published payment method.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getWebAssetManager()` | Joomla's asset manager, to declare your script and stylesheet |
| `getDocument()` | The page being built, for `addScriptOptions()` |
| `getMethods()` | Your published methods, keyed by id, each a `Method` object (see [Method settings](./payment-plugins.md#method-settings)) |
| `getKind()` | `'payment'` |
| `getRequest()` | The kind, the methods and the document as one `CartAssetsRequest` object (`->kind`, `->methods`, `->document`) |

**What you are expected to do.** Declare the scripts and styles your cart panel needs. Name only dependencies from a
registry file you add here, or Alfa's own.

**What happens next.** Your assets are in the page's head before the shopper's first click.

**If you are missing or you fail.** Nothing is declared, the failure is logged, and the page is shown.

## onCartView

Event class: `CartViewEvent`. You must write this method.

**When it fires.** Once for each offered method, every time the cart is worked out. That includes the JSON answers
that replace the methods block after the shopper changes something.

**Who receives it.** One plugin: the plugin of that offered method.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getMethod()` | The method as a `Method` object: `id()`, `name()`, `description()`, `isSelected()`, `params()`, `param('key', $default)` |
| `getCart()` | The cart as it is now, read only. It cannot change the cart. |
| `getRequest()` | Both of the above as one `MethodViewRequest` object (`->method`, `->cart`) |

**What you are expected to do.** Call `setLayout()` and `setLayoutData()`. Pass only what the layout prints. The
layout must be markup and `data-` attributes only: a script declared or printed there is lost the first time the
block arrives as JSON. Declare scripts in `onCartViewAssets`.

**What happens next.** Alfa draws your layout beside the method in the cart.

**If you are missing or you fail.** Your markup is left out and the failure is logged as a warning (category
`com_alfa.cart`). The method stays offered and the cart is shown. With Joomla's Debug System on, the error is thrown
instead of logged.

## onOrderBeforePlace

Event class: `OrderBeforePlaceEvent`. Optional.

**When it fires.** When the shopper (or staff) places an order with one of your methods, before anything is saved.

**Who receives it.** One plugin: the plugin of the chosen payment method.

**What you are given.** `getContext()` returns a `PlacementEventContext` with read only values: `cartId`, `lines`,
`customerId` (0 for a guest) and `shipmentMethodId`. The cart itself cannot be reached or replaced.

**What you are expected to do.** Check what you need. To refuse the order, throw an exception.

**What happens next.** If you return normally, Alfa saves the order.

**If you are missing or you fail.** The order is refused and nothing is saved. A thrown error is written to Joomla's
log (category `com_alfa.orders`).

## onOrderAfterPlace

Event class: `OrderAfterPlaceEvent`. Optional, but this is where almost every gateway starts.

**When it fires.** Once per order, right after the order's save is final. The shipment row does not exist yet.

**Who receives it.** One plugin: the plugin of the order's payment method.

**What you are given.** `getOrder()` returns the order as an `Order` object. Read it with methods, not properties:
`id()`, `reference()`, `total()`, `currency()`, `paymentMethodId()`.

**What you are expected to do.** Record the first payment attempt, as pending:

```php
public function onOrderAfterPlace($event): void
{
    $order = $event->getOrder();

    // Only an order this plugin takes.
    if ($this->getPaymentMethod(orderId: $order->id()) === null) {
        return;
    }

    // Nothing left to collect: write no row.
    if ($this->amountToCollect($order) <= 0.000001) {
        return;
    }

    $paymentId = $this->payment($order)->pending()->save();
}
```

Do not throw: the order is already saved.

**What happens next.** The shopper is sent to the order process page, where `onOrderProcessView` fires.

**If you are missing or you fail.** The order stays. No payment row is written, and the failure is written to
Joomla's log (category `com_alfa.orders`), as critical when your method threw.

## onOrderProcessView

Event class: `OrderProcessViewEvent`. You must write this method.

**When it fires.** When the order process page is shown, right after placement, and again each time the shopper
opens that page.

**Who receives it.** One plugin: the plugin recorded on the order.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getOrder()` | The order, as an `Order` object |
| `getMethod()` | The order's method record (`params` decoded to an array), or `null` |

**What you are expected to do.** One of three things:

| You do | The shopper |
|---|---|
| Nothing | Goes straight to the completed page. Right for an offline method, and when there is nothing to collect. |
| `setRedirectUrl($url)` | Is sent to that address, for example the provider's payment page |
| `setLayout()` and `setLayoutData()` | Sees your layout on the process page: a form that posts to the provider, or a "payment was cancelled" message with a retry button |

**What happens next.** As in the table. A redirect uses the code you set with `setRedirectCode()`, or 303.

**If you are missing or you fail.** The page shows a neutral line with the order's number and a link to try again.
It does not move on to the completed page, because that would read as a payment taken.

## onOrderCompleteView

Event class: `OrderCompleteViewEvent`. You must write this method.

**When it fires.** When the order completed page is shown.

**Who receives it.** One plugin: the plugin recorded on the order.

**What you are given.** `getOrder()` (an `Order` object) and `getMethod()` (the method record, or `null` when the
method no longer exists).

**What you are expected to do.** Call `setLayout()` and `setLayoutData()` to add your part, such as bank details for
a transfer. You may redirect with `setRedirectUrl()` instead.

**What happens next.** Alfa draws your layout on the completed page.

**If you are missing or you fail.** The page is shown without your part, with a neutral line. It never states a
payment the order does not hold.

## onPaymentResponse

Event class: `PaymentResponseEvent`. Optional. Write it when your provider sends the shopper back to the shop.

**When it fires.** When the shopper's browser arrives at your return address (see
[Return and webhook addresses](./payment-plugin-money.md#return-and-webhook-addresses)).

**Who receives it.** One plugin: the plugin named by `method=<element>` in the address.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getMethod()` | Your plugin's element, as the address named it |
| `getOrder()` | Always `null` in 2.2.0. Alfa does not load an order from an untrusted address. |

Everything else you read from the request yourself. The request is untrusted: anyone can type the address.

**What you are expected to do.** Find the order yourself, from your provider's own signed data or with
`orderFromReturnLink()`. Decide where the shopper goes and call `setRedirectUrl()`:
`$this->getCompletePageUrl()` when the payment succeeded, `$this->getProcessPageUrl()` with a flag of your own
(for example `&mygateway_result=cancelled`) when it did not. This event has no page and no layout: it can only
redirect, so always set a redirect. Never mark a payment paid because the shopper came back. Settle only what your
provider has proved.

**What happens next.** Alfa redirects the shopper to the address you set. A plain `index.php?...` address of this
site is turned into a friendly address for you.

**If you are missing or you fail.** If the plugin is unavailable, the shopper sees an error message and the home
page. If your plugin has no `onPaymentResponse`, the shopper is sent to the cart. An error your method throws reaches
Joomla's error page.

## onPaymentWebhook

Event class: `PaymentWebhookEvent`. Optional. Write it when your provider calls the shop server to server.

**When it fires.** When your provider's server calls your webhook address. There is no shopper, no session and no
page.

**Who receives it.** One plugin: the plugin named by `method=<element>` in the address.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getMethod()` | Your plugin's element |
| `getOrder()` | Always `null` in 2.2.0 |
| `setResponseCode(int)` | The HTTP status answered to the provider. Default 200. |
| `setResponseBody(string)` | The body. Default `OK`. Plain machine text, never translated. |
| `setContentType(string)` | Default `text/plain; charset=utf-8` |
| `setJsonResponse(array $payload, int $code = 200)` | Sets code, body and content type in one call |

**What you are expected to do.** In this order: read the raw body, prove the provider sent it, find your payment row
by the provider's reference, check the amount against that row, settle once, answer. A full example is under
[Authenticating a callback](./payment-plugin-money.md#authenticating-a-callback).

**What happens next.** Alfa sends your code, body and content type to the provider and ends the request.

**If you are missing or you fail.**

| Situation | Alfa answers the provider |
|---|---|
| The plugin is disabled, missing, not loaded for a guest, or fails to start, and a method of the shop uses it | 503 with `Retry-After: 600`, an alert for staff, a warning in the log (category `com_alfa.plugins`) |
| Your method throws an error | 500, and the error is logged, so the provider tries again |
| Your plugin has no `onPaymentWebhook`, the element in the address is not a valid name, or the plugin cannot be used and no method of the shop uses it | 404 |

A callback that was not processed is never answered with a 2xx code.

## onGetActions

Event class: `GetPaymentActionsEvent`. Optional. The base class registers no buttons.

**When it fires.** When the administrator's order page draws the action buttons of a payment row.

**Who receives it.** One plugin: the plugin recorded on that payment row.

**What you are given.**

| Getter | Meaning |
|---|---|
| `getPayment()` | The payment row, with among others `id`, `payment_type`, `transaction_status`, `transaction_id`, `payment_method_type` and `amount` |
| `getOrder()` | The order, as an `Order` object |
| `add(string $id, string $label)` | Adds a button and returns a `PluginAction` to describe it |

**What you are expected to do.** Add only the buttons that make sense for the row's status. See
[Staff actions](./payment-plugins.md#staff-actions).

**What happens next.** Alfa draws the buttons, highest `priority()` first.

**If you are missing or you fail.** No buttons are offered. When the plugin is unavailable, the order page says so
at its top and in the row's Actions cell.

## onExecuteAction

Event class: `ExecutePaymentActionEvent`. Optional. The base class answers "Unknown action".

**When it fires.** When staff press one of your buttons, or a button of your action page.

**Who receives it.** One plugin: the plugin recorded on the payment row.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getAction()` | The id of the button pressed |
| `getPayment()` | The payment row. `amount` is a `Money` object and `params` is the method record. |
| `getOrder()` | The order, as an `Order` object |
| `getData()` | Always an empty array for payments. Read posted values from the request input. |
| `setMessage(string)` | A success message for staff |
| `setError(string)` | Marks the action failed and sets the message |
| `setRefresh(bool)` | Reload the order page afterwards |
| `setRedirectUrl(string)` | Send staff to another address. Overrides the reload. |
| `setLayout(string)`, `setLayoutData(array)` | Draw one of your layouts on the action page (details, a form) |
| `addButton(string $label, array $opts = [])` | A footer button on the action page. `$opts`: `action` (run another action of this payment), `data`, `reload`, `class` |

**What you are expected to do.** Do the work through the base class, then report with `setMessage()` or
`setError()`.

**What happens next.** Staff see your message, your layout, or the reloaded order page.

**If you are missing or you fail.** Before your plugin runs, Alfa refuses the request when the plugin is
unavailable, when the button is no longer offered for the row, when an action that changes something is not a POST
with an unused one-time key, or when the refund block holds for an action that starts a refund. An error your method
throws is yours: catch what you can explain and report it with `setError()`.

## onAdminOrderDelete

Event class: `AdminOrderDeleteEvent`. Optional. The base class allows the deletion.

**When it fires.** When staff delete an order, once for each payment row of the order that records your plugin.
Rows that record a reversal, a chargeback or store credit are not asked about.

**Who receives it.** One plugin: the plugin recorded on the payment row.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getOrder()` | The order, as an `Order` object |
| `getMethod()` | In this event, the **payment row**, not the method |
| `setResult(bool)` | `false` refuses the deletion. The default is `true`. |

**What you are expected to do.** Call `setResult(false)` when the order must stay, for example while it holds money
you captured.

**What happens next.** If no plugin refuses, the order is deleted.

**If you are missing or you fail.** While your plugin is unavailable its answer cannot be asked, so the order is not
deleted and staff are told which plugin to restore.

## onPaymentCheckup

Event class: `PaymentCheckupEvent`. Optional.

**When it fires.** When the settings page of one of your methods draws its setup checkup, and when staff press
"Check connection" there. The checkup appears where your `params.xml` places a field of type `paymentcheckup`.

**Who receives it.** One plugin: the plugin of that method.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getMethodId()` | The method's id |
| `getParams()` | The method's **saved** settings, as a Joomla `Registry` |
| `getVariant()` | `'sandbox'`, `'live'` or `'general'` (the `variant` attribute of the field) |
| `isInUse()` | Whether this variant is the one new payments use. Always `false` for `'general'`. |
| `isCheck()` | `true` only when staff pressed "Check connection". Call your provider only then. |
| `offerCheck()` | Shows the "Check connection" button |
| `addStep(string $title, string $status, string $help = '', string $detail = '')` | Adds a step. `$status` is `PaymentCheckupEvent::DONE`, `TODO`, `FAILED`, `MANUAL` or `UNAVAILABLE`. In `$help`, `{webhook}` and `{return}` are replaced by this site's addresses. |
| `setLastChecked(string)` | One line shown beside the button |
| `webhookUrl()`, `returnUrl()` | Your addresses in the form a provider can reach |

**What you are expected to do.** Add your setup steps in order. A checkup only reads: it never moves money and never
changes the method.

**What happens next.** Alfa draws the steps on the method's settings page.

**If you are missing or you fail.** Staff see one notice in place of the steps, and a thrown error is logged
(category `com_alfa.payments`).

## onPaymentStoreReference and onPaymentChargeReference

Event classes: `StoreReferenceEvent` and `ChargeReferenceEvent`. Optional. They are for a gateway that can charge a
saved card or mandate without the shopper present, and that says so by returning `true` from `supportsRecurring()`.

**When they fire.** The core repository of 2.2.0 defines both events and their contract, but contains no code that
sends them. See [Not documented yet](./payment-plugins.md#not-documented-yet).

**Who receives them.** One plugin.

**What you are given.**

| Event | Getters | Setters |
|---|---|---|
| `StoreReferenceEvent` | `getOrder()`, `getPayment()` (the completed payment row) | `setReference(array $reference, string $label = '', ?string $expiresAt = null)` |
| `ChargeReferenceEvent` | `getOrder()`, `getAmount()` (`Money`), `getCurrencyCode()`, `getReference()` (the array you stored), `getOperation()` | Exactly one of `setSuccess(string $transactionId)`, `setFailure(string $error)`, `setPending(string $reference, string $reason)` |

**What you are expected to do.** In the first, hand back whatever you need to charge again later. You do not store
it. In the second, charge the amount against the stored reference and answer exactly once: success when the provider
confirmed this charge, failure when you know no money moved, pending whenever the request may have reached the
provider and you hold no definite answer. Never throw, and never return without answering.

**What happens next.** The caller keeps the reference, and writes the payment row for a charge.

**If you are missing or you fail.** For a charge, a handler that throws or does not answer is treated as an unknown
outcome: nothing is booked and nothing is charged again.

## onClearData

Event class: `Alfa\Component\Alfa\Administrator\Event\Tools\ClearDataEvent`. Optional.

**When it fires.** When staff run Clear Data, or "Remove extension and its data", for your plugin under Tools >
Extensions, or run Clear everything.

**Who receives it.** One plugin: yours. It can be called while your plugin is disabled.

**What you are given.** `getSource()`: `ClearDataEvent::CLEAR_DATA`, `REMOVE_WITH_DATA` or `CLEAR_EVERYTHING`.

**What you are expected to do.** Remove the data your plugin owns. Report with `setMessage()` (what was removed) or
`setError()` (what may remain and why), both already translated. Leave no database transaction open.

**What happens next.** Staff see your line on the result page.

**If you are missing or you fail.** A plugin without this method is shown as "Automatic Clear Data not supported" and
none of its data is touched. A thrown error, or a transaction left open, is reported as a failure.
