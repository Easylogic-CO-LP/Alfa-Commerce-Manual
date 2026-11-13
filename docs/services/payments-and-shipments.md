---
sidebar_position: 4
title: Payments and shipments
description: The two ledgers that write an order's payments and parcels in 2.2.0, what they guarantee, and which base class method a plugin uses for each task.
---

# Payments and shipments

<AlfaVersion verified="2.2.0" />

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
| **The plugin of record** | Since 2.2.0 a row created through a base class records the plugin that wrote it. Later changes, deletes and line assignments made through a base class work only on a row recorded as that plugin's. See [The plugin of record](../plugins/overview.md#the-plugin-of-record). |
| **A row is settled once** | A change can be made conditional on the row's current status. Of two requests that confirm the same payment or the same delivery, exactly one writes. |
| **Money stays inside the order** | A payment cannot exceed the order's total. A refund cannot exceed what the order can still give back, or what is left on the payment it refunds. |
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

## What can go wrong

| What you see | The usual cause |
|---|---|
| `save()` returns `false` on a row you did not create | The row is recorded as another plugin's, or as no plugin's |
| `save()` returns `false` on a new row | The order's method is not a method of your plugin |
| A payment is marked paid twice, or the order's e-mail is sent twice | The change was not written with `settleAttempt()` |
| The order did not move after `save()` | The row was new (a new row never moves the order), or the method's settings name no status. Inside a lock or a transaction of your own, the order moves after it ends. |
| A refund is refused though money is left | The refund block holds: an unresolved report of a provider refund is open on the order |
| A row you wrote with your own SQL is not counted, or breaks a total | The ledger was bypassed. Do not write these tables. |

## Changed in 2.2.0

- **Changed in 2.2.0.** `OrderPaymentHelper` and `OrderShipmentHelper` no longer exist. `PaymentLedger` and
  `ShipmentLedger` replaced them, and plugins reach them only through the base classes.
- **Changed in 2.2.0.** Each row records the plugin that wrote it, and a base class changes only its own plugin's
  rows.
- **Changed in 2.2.0.** The order moves after the row's save is final, as recorded background work.
- **Changed in 2.2.0.** A parcel has no tracking link column and its builder has no `trackingUrl()`. A taxed charge
  must name its tax rate.

## Not documented yet

- The ledgers' own public methods. They are core's own and are not an API for extensions.
- Recording a payment or a parcel from an extension that is not the order's payment or shipping plugin.
- The locks `OrderMoneyLock` and `ShipmentBookingLock` are described on [Orders](./orders.md#the-two-locks).
