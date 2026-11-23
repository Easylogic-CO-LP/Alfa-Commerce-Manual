---
title: Payment plugin events
description: "Every event a payment plugin receives: when it fires, what it is given and what it must do."
---

# Payment plugin events

<CreatePluginButton type="payment" />

<AlfaVersion verified="2.3.0" />

**The pages of this guide:**

- [Payment plugins](./payment-plugins.md): start here
- **Payment plugin events** (this page)
- [Payments, refunds and webhooks](./payment-plugin-money.md)
- [Card disputes](./payment-plugin-disputes.md)
- [A complete payment plugin](./payment-plugin-example.md)

The nineteen events under this page's headings are each addressed to one plugin, on its public method of the event's
name. Which plugin depends on the event: the plugin of an offered method, the plugin recorded on the order, the plugin
recorded on the payment row, or the plugin named in the address. If that plugin cannot be used, Alfa never asks
another one:

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

**What you are expected to do.** Ask the event for a place and set your layout there:
`$event->paymentMethods()->setLayout('<file in tmpl, without .php>')->setData([...])`. Alfa draws the method itself
first: its image, its title and its description. Your layout adds only what is yours below them (a "pay in
instalments" note, for example), never a logo, the title or the description. With nothing to add, draw nothing. The
other places are `title()` (beside the item's title) and `nearAddToCart()`. Each place returns a builder with
`setLayout()` and `setData()`; the layout belongs to your plugin unless you name another with `setPluginType()` and
`setPluginName()`. The event has no layout of its own. Change nothing on the item.

**What happens next.** Alfa draws your layout in the place you asked for: under the method in the payment methods
area, beside the title, or next to the add to cart button.

**If you are missing or you fail.** Alfa still draws the method's image, title and description, nothing of yours is
added, a thrown error is written to Joomla's log (category `com_alfa`), and the page is shown.

## onCartViewAssets

Event class: `CartViewAssetsEvent`. Optional.

**When it fires.** Once per plugin while the cart page, or the administrator's order builder, is built as HTML for a
cart that holds something. It fires for every plugin that owns a published method, whether the cart offers that method
now or not. It never fires inside a JSON answer.

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

**If you are missing or you fail.** Nothing is declared, the failure is logged as a warning (category `com_alfa.cart`),
and the page is shown. With Joomla's Debug System on, the error is thrown instead of logged.

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

**What you are expected to do.** Draw your panel through the event's place:
`$event->paymentMethods()->setLayout('default_cart_view')->setData([...])`. Pass only what the layout prints. The
layout must be markup and `data-` attributes only: a script declared or printed there is lost the first time the
block arrives as JSON. Declare scripts in `onCartViewAssets`. With nothing to add, draw nothing.

Every offered method is asked, and every panel drawn is shown under its own method, the chosen one and the others. A
panel that belongs to the chosen method only, such as a card form or a "you will be sent to the provider" note, checks
`$event->getMethod()->isSelected()` first and draws nothing for the others.

```php
public function onCartView($event): void
{
    if (!$event->getMethod()->isSelected()) {
        return;
    }

    $event->paymentMethods()->setLayout('default_cart_view')->setData([
        'method' => $event->getMethod(),
    ]);
}
```

**What happens next.** Alfa draws your layout under the method in the cart, after the method's radio, image, title
and description.

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
`id()`, `total()`, `currency()`, `paymentMethodId()`.

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
opens that page. The page opens only the order the shopper placed in this
browser session, one a payment plugin stated with `authenticatedReturnFor()` (see
[onPaymentResponse](#onpaymentresponse)), or one whose Pay now address the buyer opened while it may still be paid
(see [Payment plugins](./payment-plugins.md#what-happens-next-the-life-of-a-payment)). Any other order is refused
before it is read.

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
| `$event->orderProcess()->setLayout(...)->setData([...])` | Sees your layout on the process page: a form that posts to the provider, or a "payment was cancelled" message with a retry button |

**What happens next.** As in the table. A redirect uses the code you set with `setRedirectCode()`, or 303.

**If you are missing or you fail.** The page shows a neutral line with the order's number and a link to try again.
It does not move on to the completed page, because that would read as a payment taken.

## onOrderCompleteView

Event class: `OrderCompleteViewEvent`. You must write this method.

**When it fires.** When the order completed page is shown.

**Who receives it.** One plugin: the plugin recorded on the order.

**What you are given.** `getOrder()` (an `Order` object) and `getMethod()` (the method record, or `null` when the
method no longer exists).

**What you are expected to do.** Add your part through the event's place, such as bank details for a transfer:
`$event->orderComplete()->setLayout('default_order_completed')->setData([...])`. With nothing to add, draw nothing.
You may redirect with `setRedirectUrl()` instead.

**What happens next.** Alfa draws your layout on the completed page, and on the order's page in the customer's
account.

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

Everything else you read from the request yourself. The request is untrusted: anyone can type the address.

**What you are expected to do.** Find the order yourself, from your provider's own signed data or with
`orderFromReturnLink()`. Decide where the shopper goes and call `setRedirectUrl()`:
`$this->getCompletePageUrl()` when the payment succeeded, `$this->getProcessPageUrl()` with a flag of your own
(for example `&mygateway_result=cancelled`) when it did not. This event has no page and no layout: it can only
redirect, so always set a redirect. Never mark a payment paid because the shopper came back. Settle only what your
provider has proved.

What the session's order needs from you:

- **State the order whose return you authenticated.** Once the return is authenticated for an order (your
  provider's signature or digest, or its own answer naming the attempt), call
  `$this->authenticatedReturnFor($orderId)` before you redirect. Call it in whatever session the return arrives, a
  fresh one included, and whatever the payment's result: paid, failed, or cancelled by the buyer. Never call it
  before the return is authenticated. A valid signed return link (`orderFromReturnLink()`) grants the same right, so
  a return it authenticates may be stated too.
- **Send a failed or cancelled return to the process page** (`getProcessPageUrl()` with a flag of your own), which
  asks your plugin again and offers the retry. The completed page draws no retry of yours: it shows Pay now while the
  order may still be paid, which leads back to the process page.
- **Do not write `com_alfa.order_id` yourself.** The process page and the completed page open only an order the
  shopper placed in this session, one your plugin stated this way, or one whose Pay now address the buyer opened. An
  order id written without that mark is refused.
- **If you set no redirect**, the shopper is sent to the cart with the message that the result of the payment could
  not be confirmed there. Set a redirect all the same: only you know where the shopper belongs.

**What happens next.** Alfa redirects the shopper to the address you set. A plain `index.php?...` address of this
site is turned into a friendly address for you.

**If you are missing or you fail.** If the plugin is unavailable, the shopper sees the home page with the message
that the payment method for this return could not be identified. If your plugin has no `onPaymentResponse`, the
shopper is sent to the cart. An error your method throws reaches Joomla's error page. A
return that your plugin did not state through `authenticatedReturnFor()`, arriving in another session, sends the
shopper to the cart with a neutral message: "This page could not open the order. If you have completed a payment,
your order is recorded and its confirmation e-mail has the details." Nothing of the order is shown.

## onPaymentWebhook

Event class: `PaymentWebhookEvent`. Optional. Write it when your provider calls the shop server to server.

**When it fires.** When your provider's server calls your webhook address. There is no shopper, no session and no
page.

**Who receives it.** One plugin: the plugin named by `method=<element>` in the address.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getMethod()` | Your plugin's element |
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
| `addStep(string $title, string $status, string $help = '', string $detail = '')` | Adds a step. `$status` is `PaymentCheckupEvent::DONE`, `TODO`, `FAILED`, `MANUAL` or `UNAVAILABLE`. In `$help`, `{webhook}` and `{return}` are replaced by this site's addresses. `{webhook}` is the plain address, the one your plugin's `$this->webhookUrl()` builds for the card's set. |
| `setLastChecked(string)` | One line shown beside the button |
| `webhookUrl()`, `returnUrl()` | Your addresses in the form a provider can reach. `webhookUrl()` names the card's set (sandbox or live) when the card has one. `webhookUrl()` is the plain address of [Return and webhook addresses](./payment-plugin-money.md#return-and-webhook-addresses), and `returnUrl()` is the return address in the form a buyer's browser reaches without a redirect. |

**What you are expected to do.** Add your setup steps in order. A checkup only reads: it never moves money and never
changes the method.

**What happens next.** Alfa draws the steps on the method's settings page.

**If you are missing or you fail.** Staff see one notice in place of the steps, and a thrown error is logged
(category `com_alfa.payments`).

## onPaymentStoreReference and onPaymentChargeReference

Event classes: `StoreReferenceEvent` and `ChargeReferenceEvent` (`ChargeReferenceEvent::NAME` is
`onPaymentChargeReference`). Optional. They are for a gateway that can charge a saved card or mandate without the
shopper present, and that says so by returning `true` from `supportsRecurring()`.

**When they fire.** Alfa Commerce itself sends neither: an extension that bills again (a subscriptions extension)
sends them to the gateway of the stored credential, through `AlfaPluginHelper::bootSingle()`, `declares()` and
`dispatchTo()`.

**Who receives them.** One plugin: the gateway that stored the reference.

**What you are given.**

| Event | Getters | Setters |
|---|---|---|
| `StoreReferenceEvent` | `getOrder()`, `getPayment()` (the completed payment row) | `setReference(array $reference, string $label = '', ?string $expiresAt = null)` |
| `ChargeReferenceEvent` | `getOrder()`, `getAmount()` (`Money`), `getCurrencyCode()`, `getReference()` (the array you stored), `getOperation()`, and `getAttempt()`, the attempt's number from 1: the same number for the same attempt sent again, a new number for a new attempt | Exactly one of `setSuccess(string $transactionId, int $paymentId)`, `setPending(string $reference, string $reason, int $paymentId)`, `setFailure(string $error, string $decline = ChargeReferenceEvent::DECLINE_NOW)`, `setNotSent(string $reason, string $why = ChargeReferenceEvent::NOT_SENT_RETRY)` |

**What you are expected to do.** In the first, hand back whatever you need to charge again later. You do not store
it.

In the second, the attempt's payment row is yours, written before the provider is called, as a checkout payment's is.
The caller books nothing: it reads the row your answer names.

1. **An earlier attempt unresolved.** When an earlier attempt of this order is still unresolved (your own pending row
   of the order under another reference, which `latestPendingPayment()` answers, or one your provider still holds),
   book nothing and send nothing: answer `setNotSent($why, ChargeReferenceEvent::NOT_SENT_EARLIER_UNRESOLVED)`.
2. **Book the attempt.** `$verdict = $this->chargeAttempt($event)->saveWithVerdict();` writes a pending payment of
   your gateway for `getAmount()`, its reference `renewalReference()` of the order, the credential and the attempt's
   number. The same attempt sent again answers the same row and writes nothing new. Only `VERDICT_WRITTEN` goes on to
   the provider:

   | The verdict | Your answer |
   |---|---|
   | `VERDICT_LOCK_NOT_TAKEN`, `VERDICT_WRITE_FAILED` | `setNotSent($why)`: nothing was sent; the same attempt may be sent again |
   | `VERDICT_REFUSED` with `REFUSAL_OPEN_ATTEMPT` | `setNotSent($why, ChargeReferenceEvent::NOT_SENT_EARLIER_UNRESOLVED)` |
   | `VERDICT_REFUSED` with any other code (`REFUSAL_OVER_TOTAL`: the order is covered; `REFUSAL_REFERENCE_TAKEN`: this attempt's row is already closed, so its number is spent) | `setFailure($why, ChargeReferenceEvent::DECLINE_CONFIGURATION)` |

3. **Call the provider** with the row's reference as the merchant reference and the idempotency key. A provider that
   cannot take it as it is may be sent a form made from it alone; your webhook and Reconcile still find the row by the
   row's own reference, or by the provider's id once you write it on the row.
4. **Settle your row and answer**, naming it (`$verdict->rowId`):

| Answer | When | Your row |
|---|---|---|
| `setSuccess($transactionId, $paymentId)` | The provider confirmed this charge as taken, for exactly the amount and currency asked | Settled completed with the provider's id (`settleAttemptVerdict()`); the method's `status_on_completed` moves the order |
| `setPending($reference, $reason, $paymentId)` | The request may have reached the provider and you hold no definite answer: a timeout or dropped connection after sending, HTTP 0 or 5xx, an unreadable body, a status the provider calls pending, or a "success" whose amount, currency or identity does not match what was asked | Stays pending. `$reference` is what your webhook and Reconcile find it by: the provider's id when it gave one (write it on the row), else the row's reference. They settle it later with `settleAttempt()`, `->expectStatus(self::STATUS_PENDING)` and `->completed()` or `->failed()`. The caller never charges that attempt again. |
| `setFailure($error, $decline)` | The provider definitely refused, or you refused to send. No money moved; the attempt is spent. | Closed failed first |
| `setNotSent($reason, $why)` | Nothing reached the provider; no money moved | `NOT_SENT_RETRY` (the default): left pending as it is; the caller sends the same attempt again, with the same number, and finds it. `NOT_SENT_EARLIER_UNRESOLVED`: you booked nothing. |

`setSuccess()` and `setPending()` without a row (an id under 1) throw `InvalidArgumentException`. A failure's kind
says when the caller may try a new attempt:

| Kind | Meaning |
|---|---|
| `DECLINE_NOW` (the default) | Declined for now: insufficient funds, a generic decline. A new attempt may follow later. |
| `DECLINE_FINAL` | Declined for good: a stolen card, a closed account, a revoked mandate, an expired card. No new attempt until the customer gives a new credential. |
| `DECLINE_AUTHENTICATE` | The customer must confirm the payment (the bank asks for authentication). |
| `DECLINE_NEW_CREDENTIAL` | The customer must give a new credential. |
| `DECLINE_CONFIGURATION` | The method's settings, the currency or its scale, a credential of the other credential set, or the order's books refuse it. No new attempt until staff act. |

An unknown kind or reason throws `InvalidArgumentException`. The event keeps exactly one answer: a later answer
replaces an earlier one whole, except that neither a failure nor a not-sent answer ever replaces a success or a pending
answer. The caller reads `getOutcome()` (`OUTCOME_SUCCESS`, `OUTCOME_PENDING`, `OUTCOME_FAILURE`,
`OUTCOME_NOT_SENT`), `getPaymentId()`, `getTransactionId()`, `getPendingReference()`, `getDecline()`,
`getNotSentReason()` and `getError()` (the reason of a failure or of a not-sent answer).

```php
public function onPaymentChargeReference(ChargeReferenceEvent $event): void
{
    $verdict = $this->chargeAttempt($event)->saveWithVerdict();

    if ($verdict->kind === self::VERDICT_REFUSED && $verdict->code === self::REFUSAL_OPEN_ATTEMPT) {
        $event->setNotSent('An earlier attempt of this order is unresolved.', ChargeReferenceEvent::NOT_SENT_EARLIER_UNRESOLVED);

        return;
    }

    if ($verdict->kind === self::VERDICT_REFUSED) {
        $event->setFailure('The books refuse this charge (' . $verdict->code . ').', ChargeReferenceEvent::DECLINE_CONFIGURATION);

        return;
    }

    if ($verdict->kind !== self::VERDICT_WRITTEN) {
        $event->setNotSent('The attempt could not be recorded yet.');

        return;
    }

    // ...call the provider with the row's reference, settle the row, then answer naming $verdict->rowId
}
```

**What happens next.** The caller keeps the reference from the first event. For a charge it reads your answer and the
row it names; the method's status settings move the order when the row completes.

**If you are missing or you fail.** For a charge, a handler that throws or does not answer is treated as an unknown
outcome: the caller never charges again and asks an operator to review, or asks you first with `onPaymentChargeQuery`.
A gateway without `supportsRecurring()` answering `true` is never asked: a renewal on its method is not charged, and
its order stays owed, for the customer to pay and staff to collect.

**Whether a method may renew.** `renewalsAllowed(int $methodId)` (final, public) answers `true` only when your gateway
can renew (`supportsRecurring()`), the method is published, and its settings allow it (`methodAllowsRenewals()`). An
unpublished, archived or trashed method, another gateway's method, or none, answers `false`. A caller that is not a
payment plugin asks it through `AlfaPluginHelper::get()->invoke($plugin, 'renewalsAllowed', $methodId)`, and reads a
method's state itself with `MethodState::of(MethodState::PAYMENT, $methodId)` (`PUBLISHED`, `UNPUBLISHED`,
`ARCHIVED`, `TRASHED` or `MISSING`; `MethodState::SHIPMENT` for a shipping method).

**Asking for a stored credential.** Right before it creates its checkout order, a gateway that can charge stored
credentials asks whether the order needs one, for every plugin that listens:

```php
$intent = AlfaPluginHelper::get()->dispatch(new StoredCredentialIntentEvent(StoredCredentialIntentEvent::NAME, ['order' => $order]));

if ($intent->isRequired()) {
    // ask the provider to keep the card or mandate, with the customer's consent
}
```

`StoredCredentialIntentEvent::NAME` is `onPaymentCredentialIntent`. A plugin that sells something recurring answers
`setRequired()` when the order qualifies; with no listener the answer is `false`.

## onPaymentChargeQuery

Event class: `ChargeQueryEvent` (`ChargeQueryEvent::NAME` is `onPaymentChargeQuery`). Optional, for a gateway that
answers `onPaymentChargeReference`.

**When it fires.** When the caller of a charge does not know an attempt's outcome (your handler threw or answered
nothing) and asks before it sends the attempt again.

**Who receives it.** One plugin: the gateway of the stored credential, on its public method `onPaymentChargeQuery`. A
gateway without the method cannot be asked; the caller leaves the attempt to staff.

**What you are given.** `getOrder()`, `getReference()` (the stored credential), `getAttempt()` and `getAmount()`
(`Money`): what the charge carried. Each is required; a question without one, or with one of the wrong kind, throws
`InvalidArgumentException` when it is made.

**What you are expected to do.** Find the attempt at your provider by what you keyed the request on (the order, the
credential, the attempt and its amount; your Reconcile lookup) and answer exactly one of `setSuccess($transactionId)`
(the provider holds it as charged), `setPending($reference, $reason)` (still unresolved), `setFailure($error,
$decline)` (held as refused, with the kinds above), or `setNotSent($reason)` (the provider has no record of it: the
same attempt may be sent again). Charge nothing and write nothing.

**What happens next.** The caller acts on your answer: a charge your provider holds is not sent again.

**If you are missing or you fail.** A thrown error leaves the attempt to staff.

## onAlfaDisputeRefresh and onAlfaDisputeAccept

Event classes: `DisputeRefreshEvent` and `DisputeAcceptEvent` (their `NAME` is `onAlfaDisputeRefresh` and
`onAlfaDisputeAccept`). Optional.

**When they fire.** When staff press **Ask the provider again** (refresh) or **Accept at the provider** (accept) on a
dispute's card on the order screen. Both are offered only for a case that carries the provider's dispute id. Accept is
offered while the case is an inquiry or open, and is sent once staff have typed that id to confirm.

**Who receives them.** One plugin: the plugin recorded on the disputed payment. A plugin without the method takes no
part, and the card offers no button for it.

**What you are given.**

| Getter or setter | Meaning |
|---|---|
| `getDispute()` | The record: `id`, `id_order`, `id_payment`, `reference`, `state`, `stage`, `amount`, `stated_amount`, `stated_currency`, `evidence_due_by` |
| `getReference()`, `getPaymentId()`, `getOrderId()` | The provider's dispute id, the disputed payment, its order |
| `setVerdict(DisputeVerdict $verdict)` | Your answer: the verdict your own `$this->dispute(...)->...->save()` answered |
| `setError(string $sentence)` | Your answer when the provider could not be asked or refused, in your own words for staff |

**What you are expected to do.** Refresh: read the case at your provider and apply it with
`$this->dispute($paymentId, $reference)`. Accept: tell your provider the shop accepts and, once it confirms, record
the loss yourself with `->lost()->save()`; your provider's later notification of the same loss is then a repeat and
writes nothing new. Answer with one of the two setters.

**What happens next.** Staff read that the dispute was saved, or why your verdict was refused, or your sentence. Alfa
records in the User Actions Log that staff asked. It writes nothing of the dispute itself on Accept: the money moves
only when the loss is recorded. See
[Card disputes](./payment-plugin-disputes.md#two-optional-handlers).

**If you are missing or you fail.** Without the method, or while your plugin is unavailable, the card offers no
button for it. A thrown error is written to the payments log (category `com_alfa.payments`, a warning naming the
dispute and the event), and staff read that the provider could not be asked, nothing was saved, and the reason is in
the payments log. A handler that answers neither shows "The payment provider gave no answer; nothing was saved."
Nothing of the dispute is written in either case.

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
none of its data is touched. A thrown error, or a transaction left open, is reported as a failure. A transaction you
leave open is rolled back, and everything you deferred until a commit inside it is discarded with it.
