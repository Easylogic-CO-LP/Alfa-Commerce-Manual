---
sidebar_position: 4
title: Payments and shipments
description: The two ledgers that write an order's payments and parcels, what they guarantee, and which base class method a plugin uses for each task.
---

# Payments and shipments

<AlfaVersion verified="2.3.0" />

An order's payments and its parcels are each written by one class, called a **ledger**. A plugin never calls a
ledger. It calls methods of the base class it extends, and the base class calls the ledger for it.

This page says what the ledgers guarantee and points to the method for each task. The methods themselves are
documented on [Payment plugins](../plugins/payment-plugins.md) and [Shipping plugins](../plugins/shipment-plugins.md).

## What it does

| Ledger | What it writes | The door for a plugin |
|---|---|---|
| `PaymentLedger` (`administrator/src/Service/Order/PaymentLedger.php`) | Payments, refunds, authorizations, reversals and chargebacks of an order (table `#__alfa_order_payments`) | The payment base class, `PaymentsPlugin` |
| `ShipmentLedger` (`administrator/src/Service/Order/ShipmentLedger.php`) | The parcels of an order and the order lines in each (table `#__alfa_order_shipments`) | The shipping base class, `ShipmentsPlugin` |

Both ledgers are **core's own**. Alfa's order screen and the REST API call them. No plugin that ships with Alfa
does.

:::warning The rule
The comment at the top of `PaymentsPlugin` states it: the base class is the supported payment API. A gateway never
calls `PaymentLedger` and never reads or writes `#__alfa_order_payments` itself. If the base class lacks something
you need, that is a request to Alfa Commerce, not a reason to query the table.

This manual applies the same rule to shipping plugins and `ShipmentLedger`. The code states the rule for payments
only. A comment in `ShipmentsPlugin` still mentions calling `ShipmentLedger` directly for batch work. Such a call
records no plugin on the row, the standard shipping plugin does not make it, and this manual does not document it.
:::

## When it is used

Every time a payment or a parcel is created, changed or deleted: by a plugin at placement, by a provider's or a
carrier's callback, by staff on the order screen.

## What a ledger guarantees

| Guarantee | In plain words |
|---|---|
| **One place writes** | Every payment row and every parcel row goes through its ledger, so the same checks run and the same entry is written to the order's History, whoever asked. |
| **The plugin of record** | A row created through a base class records the plugin that wrote it. Later changes, deletes and line assignments made through a base class work only on a row recorded as that plugin's. See [The plugin of record](../plugins/overview.md#the-plugin-of-record). |
| **A row is settled once** | A change can be made conditional on the row's current status. Of two requests that confirm the same payment or the same delivery, exactly one writes. |
| **Money stays inside the order** | A refund cannot exceed what the order can still give back, or what is left on the payment it refunds. A payment cannot take the order past its total, counting what the shop still holds, so money a customer's bank took back, or a part refunded, is owed again and may be paid again. A refusal is told to staff in plain words, never to the shopper. |
| **Status automation** | When a change gives a payment or a parcel a new status, and the method's settings name an order status for it (`status_on_<status>`), Alfa moves the order. The move is recorded in the same save as the row and carried out after that save is final. A new row never moves the order. |
| **The refund block** | While a provider's report of a refund that the books do not hold is open on an order, no new refund may start on it. Staff resolve the report first. |
| **A parcel's charge is consistent** | A taxed shipping charge must name its tax rate. Shipping is charged once per order. A cancelled or returned parcel does not count in the order's total. |

How the order moves is described on [Orders](./orders.md#transition).

## What you must provide

Extend the base class of your plugin type and call its methods. Nothing else.

### I want to, for a payment plugin

| I want to | Use | Documented at |
|---|---|---|
| Know how much to charge | `amountToCollect($order)` | [The verbs](../plugins/payment-plugin-money.md#the-verbs) |
| Record a new payment attempt | `payment($order)->pending()->save()` | [Recording and settling a payment](../plugins/payment-plugin-money.md#recording-and-settling-a-payment) |
| Change a payment row | `paymentUpdate($paymentId)` and the builder | [Recording and settling a payment](../plugins/payment-plugin-money.md#recording-and-settling-a-payment) |
| Mark a payment paid when the provider confirms, once | `paymentUpdate($id)->expectStatus(...)->completed()` written with `settleAttempt()` | [The verbs](../plugins/payment-plugin-money.md#the-verbs), [Callbacks arrive twice](../plugins/payment-plugin-money.md#callbacks-arrive-twice) |
| Close an attempt nobody will pay | `supersedeAttempt($paymentId, $reason)` | [The verbs](../plugins/payment-plugin-money.md#the-verbs) |
| Find my own rows on an order | `gatewayPayments()`, `latestPendingPayment()`, `gatewayPaymentByReference()` | [Reading](../plugins/payment-plugin-money.md#reading) |
| Know whether the order is settled | `orderBalance($orderId)` | [Reading](../plugins/payment-plugin-money.md#reading) |
| Know what may still be refunded | `refundableNow()`, `refundableRemainder()`, `refundFormMaximum()` | [Before the refund](../plugins/payment-plugin-money.md#before-the-refund-what-may-be-refunded) |
| Refund when my method has no provider | `refundPayment($paymentId, $amount, $options)` | [A refund with no provider](../plugins/payment-plugin-money.md#a-refund-with-no-provider) |
| Refund through a provider | `reserveRefund()`, then `settleRefund()`, `holdRefund()` or `releaseRefund()` | [A refund through a provider](../plugins/payment-plugin-money.md#a-refund-through-a-provider) |
| Tell Alfa about a refund made outside the shop | `unbookedProviderRefunds($paymentId)` | [Telling Alfa about refunds it does not hold](../plugins/payment-plugin-money.md#telling-alfa-about-refunds-it-does-not-hold) |
| Record a chargeback, or a refund that did not stand | `recordChargeback()`, `recordReversal()` | [The verbs](../plugins/payment-plugin-money.md#the-verbs) |
| Move the order when a payment changes | Nothing in code. The method's settings `status_on_<status>` do it. | [The order's status](../plugins/payment-plugin-money.md#the-orders-status) |
| Move the order at a moment the settings cannot express | `orderTransition($orderId)->to($statusId)->save()` | [The verbs](../plugins/payment-plugin-money.md#the-verbs) |

### I want to, for a shipping plugin

| I want to | Use | Documented at |
|---|---|---|
| Record a new parcel | `shipment($order)->pending()->withAllItems()->cost(...)->save()` | [Starting a write](../plugins/shipment-plugins.md#starting-a-write), [What you chain on the builder](../plugins/shipment-plugins.md#what-you-chain-on-the-builder) |
| Change a parcel: status, tracking number, carrier | `shipmentUpdate($shipmentId)` and the builder | [Tracking and status](../plugins/shipment-plugins.md#tracking-and-status) |
| Change a parcel when the carrier confirms, once | `settleAttempt($write, $orderId, $expected, $reference)` | [Tracking and status](../plugins/shipment-plugins.md#tracking-and-status) |
| Split an order over several parcels | `withItems([...])`, `assignShipmentItems()` | [Lines and several parcels](../plugins/shipment-plugins.md#lines-and-several-parcels) |
| Keep my own facts on a parcel | `pluginData([...])` on the builder | [Facts of your own on a parcel](../plugins/shipment-plugins.md#facts-of-your-own-on-a-parcel) |
| Read or delete a parcel | `getShipment()`, `getShipmentsByOrder()`, `deleteShipment()` | [Lines and several parcels](../plugins/shipment-plugins.md#lines-and-several-parcels) |
| Know what a save checks | | [What save() guarantees and what it refuses](../plugins/shipment-plugins.md#what-save-guarantees-and-what-it-refuses) |
| Move the order when a parcel is delivered | Nothing in code. The method's settings `status_on_<status>` do it. | [A parcel's status can move the order](../plugins/shipment-plugins.md#a-parcels-status-can-move-the-order) |

## What happens next

The ledger checks the write, saves the row with its entry in the order's History, and records any move of the order
as [background work](../reference/glossary.md#background-work). After the save is final, the order moves, and the
move's own follow-up work runs: stock, documents, the status e-mail, `onOrderStatusChange`.

### Paying an order again

A payment that failed, that the buyer cancelled at the provider, or that the shop released leaves the order owing
money. While it does, the order's confirmation page and the customer's order e-mail show **Pay now**. The link carries
the order's id and its payment token (`PaymentToken`, an HMAC of the order id keyed with the order's secret; the secret
itself never travels) and opens the existing payment step of the same order: nothing is placed again, so there is no
second order, stock movement or order e-mail. For an order of a customer account, the customer logs in first.

Pay now is offered, and the link works, only while all of this holds; it is checked on every use of the link, under the
order's lock, and again just before the provider is asked:

| The order | Otherwise the buyer reads |
|---|---|
| is there and not in the trash | "This payment link is not valid." |
| still owes money | "This order has nothing left to pay." |
| is neither in the cancelled nor in the completed family of statuses | "This order can no longer be paid." |
| holds no payment authorised at a provider | "A payment of this order is still being processed. Please check again later." |
| has no refund that is not settled | "This order cannot be paid while a refund of it is in progress." |
| has a published payment method whose plugin is enabled, other than core's Standard method | "This order cannot be paid online. Please contact the shop." |

The gateway decides what the attempt is: it opens a new one or carries the earlier one on (see
[Payment plugins](../plugins/payment-plugins.md)).

## A payment method's fee

A payment method can charge a fee, such as a cash on delivery fee. Its **Fee** tab (and the REST resource
`v1/alfa/paymentmethods`) holds four settings:

| Setting | What it means |
|---|---|
| Fixed fee (`fee_amount`) | An amount in the order's currency. `0` for none. |
| Fee percentage (`fee_percent`) | A percentage of the order total before the fee: the goods after their discounts, the shipping after its rules and the other charges. `0` for none, at most 100. |
| Fee entered (`fee_entry_mode`) | Tax included (the customer pays the figures with the tax inside; the percentage is taken of the total with tax) or tax excluded (the tax is added on top; the percentage is taken of the total without tax). Tax included by default. |
| Fee taxes (`fee_taxes`) | The tax rules the fee is taxed with. Each rule's places, customer groups and dates decide whether it applies, at the delivery destination, as for a shipping method's taxes. None: the fee is untaxed. |

The fee is the fixed amount plus the percentage, the percentage rounded once to the currency's decimals. It is
worked out like a shipping method's price: read through the entry mode and taxed with the rules, so its net, its tax
and its gross are exact and add up. Fixed 2.00 with tax included at 24% is 1.61 + 0.39; 3% of a total of 25.00
without tax, plus 1.50, entered without tax at 24%, is 2.25 + 0.54 = 2.79.

Where the fee appears:

- **Before the choice.** The checkout's payment list and the order builder print each method's fee beside its name
  ("Fee: 2,00 €"), the figure the totals would carry.
- **In the totals.** The chosen method's fee is its own line, "Payment fee (method name)", after the plugins' charges.
  It is a charge like theirs (code `payment_fee`; see [How the cart is added up](./cart-and-checkout.md#how-the-cart-is-added-up)),
  so the shopper pays it and the gateway is asked for a total that includes it.
- **On the order.** Placement totals the order with the fee of the method the submission names and freezes it in
  `#__alfa_order_contributions`. A later change of the order's lines by staff does not work it out again.
- **On the documents and in the e-mails**, as the order's other charges: its own line at its rate.
- **In the REST API**, in the order's `contributions` with its code, amounts, tax and rate. See
  [Orders](../api/orders.md).

An order with nothing to pay before the fee is charged none, so a free order or a request for an offer stays free.
Orders made without the cart (a renewal, an order created over the REST API in one call) carry no fee: they state
their amounts themselves.

## Shipping restrictions per category

A shipping method has two lists of categories on its edit screen (and in `v1/alfa/shipmentmethods`):

| List | What it means |
|---|---|
| Categories (`categories`) | The categories the method serves only. "Every category" (`0`) is no limit. |
| Categories not delivered (`excluded_categories`) | The categories the method does not deliver. None by default. |

A category on either list covers its subcategories, at every depth; a payment method's Categories list reads the same
way. A line of the cart is refused by a method when none of its product's categories lies inside the first list, or
when any of them lies inside the second: the exclusion wins, so "only Furniture, except Outdoor furniture" is two
lists. A product to download is not shipped and is not judged. A method that refuses one line is not offered.

The rule is read in one place, `MethodCategoryScope` (`site/src/Service/Cart/`), so every path agrees:

- **The checkout** does not offer the method and says why under the offered methods: "Courier X does not deliver
  Sofa A, Lamp B." It says so only for a method that the customer group, the user and the destination would have
  offered, so the shopper is never told about a method they could not have had. `CartOffersView::shipmentRefusals`
  holds the sentences by method id.
- **The order builder** shows the same sentences in its shipping section.
- **Placement** refuses a method that is not offered, as it always does.
- **The shipments ledger** refuses a parcel of such a method that carries such a line: on the order screen, through
  `POST v1/alfa/orders/:id/shipments` with its `items`, in an order created over the REST API in one call (its parcel
  carries the order's lines; the create answers 409 and no order is made), and when a parcel is moved to another
  method or given other lines (`PATCH v1/alfa/orders/:id/shipments/:shipmentId`). The reason is "Courier X does not
  deliver Sofa A; nothing was written." A product to download on the parcel is not judged, as at the checkout.
  Parcels already written are not judged again, and a parcel that carries no lines is not judged.

## What can go wrong

| What you see | The usual cause |
|---|---|
| `save()` returns `false` on a row you did not create | The row is recorded as another plugin's, or as no plugin's |
| `save()` returns `false` on a new row | The order's method is not a method of your plugin |
| A payment is marked paid twice, or the order's e-mail is sent twice | The change was not written with `settleAttempt()` |
| The order did not move after `save()` | The row was new (a new row never moves the order), or the method's settings name no status. Inside a lock or a transaction of your own, the order moves after it ends. |
| A refund is refused though money is left | The refund block holds: an unresolved report of a provider refund is open on the order |
| A row you wrote with your own SQL is not counted, or breaks a total | The ledger was bypassed. Do not write these tables. |

## Not documented yet

- The ledgers' own public methods. They are core's own and are not an API for extensions.
- Recording a payment or a parcel from an extension that is not the order's payment or shipping plugin.
- The locks `OrderMoneyLock` and `ShipmentBookingLock` are described on [Orders](./orders.md#the-two-locks).
