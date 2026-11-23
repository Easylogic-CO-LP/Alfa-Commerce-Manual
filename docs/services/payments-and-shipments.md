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

The same rule holds for shipping plugins and `ShipmentLedger`, as the comment above the parcel builders in
`ShipmentsPlugin` states: a carrier writes its parcels through `shipment()`, `shipmentUpdate()`, `deleteShipment()`
and `assignShipmentItems()`, which name it as the writer. A direct `ShipmentLedger` call names no writer and skips that
check: it is core's own path, not a plugin's.
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
| Tell Alfa a card dispute's state | `dispute($paymentId, $providerDisputeId)`, its state and facts, then `save()`; answer the provider with the verdict's `providerStatus()` | [Card disputes](../plugins/payment-plugin-disputes.md) |
| Record a refund that did not stand | `recordReversal()` | [The verbs](../plugins/payment-plugin-money.md#the-verbs) |
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
money. While it does, the order's confirmation page and the customer's order e-mail show **Pay now**, and staff can
e-mail the same link from the order screen (below). The link carries
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
| has no refund that is not settled and no dispute the bank has not decided | "This order cannot be paid while a refund of it is in progress." (said for an undecided dispute too) |
| has a published payment method whose gateway is available and declares that it opens a new payment for an existing order (`supportsPayAgain()`; core's Standard method does not) | "This order cannot be paid online. Please contact the shop." |

The link leads to the order's gateway of record, whose process view opens a new attempt for what is owed (the contract
is on [Payment plugins](../plugins/payment-plugins.md#paying-an-order-again)).

### Sending the payment link

On the order screen of an order that may be paid again (the conditions above), the payments panel shows **Payment
link** with the customer's address and a **Send payment link** button. It needs the Orders permission Edit. The button
e-mails the customer Pay now, the same link as the confirmation page's; staff never pay for the customer, and nothing
on the order changes.

The message is the order e-mail's layout (the one every order e-mail reads, and the administrator template's override
of it) with the Pay now block, the order's lines, totals and payments. Its subject and its opening are its own, in the
order's language: `COM_ALFA_ORDEREMAIL_PAYLINK_SUBJECT` (`Pay for your order {order_number}`) and
`COM_ALFA_ORDEREMAIL_PAYLINK_INTRO`; a shop changes them with Joomla's language overrides (Administrator). The other
positions of the layout keep their default texts. It goes to the customer alone, at once, not as a task; it carries no
download link.

The press is checked again on the server: an order that may no longer be paid, an operator without Orders: Edit, or a
request without the form token sends nothing. What the operator reads:

| Outcome | The message |
|---|---|
| Sent | "The payment link was sent to (address)." |
| Handed to the mail server with no answer | "The payment link was handed to the mail server for (address), which did not answer: it may have been delivered." |
| Mail switched off for the site | "The payment link was not sent: sending mail is switched off for the site (Global Configuration, Send Mail: No)." |
| The order names no customer address | "The payment link was not sent: the order has no customer e-mail address." |
| The mail could not be sent | "The payment link was not sent:" and the mailer's error |
| The order may no longer be paid | "The payment link was not sent:" and the reason (the order owes nothing, its status is cancelled or completed, a payment is authorised, a refund is not settled (said for an undecided dispute too), its payment method cannot be paid again online, it is in the trash) |

A sent link, and one handed over with no answer, is written to Joomla's User Actions Log under Alfa Commerce: who sent
it, the order and the address.

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
