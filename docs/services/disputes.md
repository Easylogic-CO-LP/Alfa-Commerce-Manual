---
sidebar_position: 5
title: Card disputes
description: "What a card dispute is for a shop, what Alfa shows and books at each step, the order screen's acts, the e-mails, the refund block and the reconcile."
---

# Card disputes

<AlfaVersion verified="2.3.0" />

## What a dispute is

A dispute starts at the customer's bank, not at the shop. The customer tells their bank that a card payment was not
theirs, that the goods never came, that they were not as described, or that a promised refund was never made. The bank
claims the money back from the shop's payment provider through the card network.

- An **inquiry**: the bank only asks for information. No money moves. A good answer, or the bank letting it go, ends it.
- A **chargeback**: the bank claims the money. Most providers take the disputed amount out of the shop's balance at
  once, often with a fee, and hold it until the bank decides.

The shop answers by a deadline with evidence (the order and invoice, the tracking and signed delivery, the messages,
the terms the customer accepted), at the provider's page or by letter to the bank, or accepts the dispute. The bank
decides: **won** for the shop, **lost** for the customer. Some networks allow a second round after a decision.

## What Alfa keeps and what it books

Each dispute is a record beside the disputed payment: its state (inquiry, open, under review, won, lost, closed), the
bank's last decision, the round, the deadline, the disputed amount (in the order's currency, and as the provider
states it), the reason, when evidence was sent, the fee and the part given back, the provider's reference and link,
and who made the record. The record holds no money.

The order's money follows the bank's last decision, never the state:

- While the bank decides (an inquiry, an open chargeback, a case under review) the payment stays paid and the order
  reads as before. A hold at the provider is not a refund. The order's card shows "Disputed 49.90, undecided".
- **Lost**: Alfa books a chargeback of the disputed amount, linked to the payment and the dispute. The order reads
  owed again by that amount. The invoice is not changed: a credit note is a separate step, as always.
- **Won**: nothing is booked. Won after a loss: the chargeback is reversed and the order reads paid again.
- A case opened again after a decision keeps that decision until the bank decides again.
- A corrected amount after a loss books the difference. A dispute about part of a payment books only its part.
- No order status, document, entitlement or customer e-mail moves at any step.

The dashboard's takings drop at a loss and come back at a win after a loss, not while the case is open. The
provider's fee is shown on the card and in the REST API and never booked: it is the provider's charge to the shop.

## The order screen

An order with a dispute shows a **Disputes** section after its payments, one card per case: the state and the round,
"Answer by 4 December 2026 (in 6 days)" or "Overdue since ...", the payment and the disputed amount, the reason, when
evidence was sent, the fee, the provider's reference (linked to the case at the provider), who made the record, what
the books hold for it, and the question to answer when the record waits for staff.

| Action | Offered on | What it does |
|---|---|---|
| Record a dispute | A completed or refunded payment row (not one paid from the wallet) | Records an inquiry or a chargeback from the bank's letter or the provider's page: amount (prefilled with the payment's), reason, the provider's words, the provider's reference, answer by, fee, note |
| Mark evidence sent | An inquiry or an open chargeback | Stamps the time; an open chargeback moves to under review |
| Close with the outcome | An undecided case; won and lost to correct | Won, lost, an inquiry that ended, or recorded in error (a record made by hand). On a record made by hand a loss takes its final amount. |
| Reopen | A won or lost case | A new round with its deadline; the last decision stands |
| Change | A record made by hand | Its amount, reason, reference, deadline and fee |
| Same dispute as #7 / A different dispute | A provider's record that waits for that answer | Joins the provider's record to the one made by hand, or books it as a case of its own |
| Type the amount in the order's currency | A lost case stated in another currency | The figure that left the shop's account; saving it books the loss |
| Ask the provider again, Accept at the provider | When the payment's plugin offers them | Asks the provider; the plugin applies its answer |

Each action opens the action page of the disputed payment (right: Orders: Edit). A refused submission comes back with
what was typed and the reason. An amount is read as every money field is: exactly, in the order's money, a comma taken
as the decimal point; "5,000" on a two-place order is refused as a thousands separator, never read as 5,00. Every staff act is in Joomla's User Actions Log; every step, staff's and the provider's,
is on the order's History.

The orders list has a **Dispute** filter (undecided, a state, an answer due within seven days) and a **Disputed**
badge on an order with an undecided case.

## Telling staff

- **The bell**: one notice per dispute, re-said at each step: "Dispute on order 1234: answer by 4 December", "Dispute
  on order 1234 lost". It comes back while the case needs staff (no evidence sent yet, or a question to answer).
- **The e-mail**: to the shop's address (Options, General, Store e-mail) when a dispute is recorded or first reported,
  and at its outcome, with the link to the order. With no store address the bell carries everything. A failed e-mail
  is retried and can be resent under Tools, Tasks.
- **The reminder**: three days before a deadline, while the case is an inquiry or open and no evidence is marked sent,
  a reminder e-mail goes to the store address (none without one; the bell notice already names the deadline). A moved
  deadline moves the reminder; evidence marked sent or a decision means none is sent.
- **The customer** gets no e-mail about a dispute: they started it with their bank.

## Refunds while a dispute is open

While the order has a chargeback that is open or under review, a new refund of the order waits: the bank may give the
customer the money back, and a refund now would return it twice. The order screen's refund actions, the REST refund
verb and a credit note paid into the customer's credit all say so, naming the dispute. An inquiry does not block a
refund (a refund is a usual answer to one). Money a provider already moved is still booked. The decision lifts the block.

## A record by hand and the provider's word

Staff may record a dispute before the provider's notification arrives. Copy the dispute's id from the provider's page
into the record's reference, and the provider's notifications join that record. Without it, the provider's
notification makes a record of its own that waits: it books nothing, and the bell and both cards ask "Is this the same
dispute as #7?". **Same dispute** keeps one case (the record made by hand takes the provider's reference and follows
the provider); **A different dispute** books the provider's record by its state. Nothing is joined by guesswork.

## Deleting

A disputed payment cannot be deleted, and keeps its amount, type and order. An order with an undecided dispute cannot
be deleted or put in the trash; once the dispute is decided it can, and its dispute records go with its delete.

## Disputes recorded before this release

On an update, every chargeback recorded before disputes were kept becomes a dispute record of what stands after its
reversals: lost while any of it stands, won when it was reversed in full, marked "From a chargeback recorded before
disputes were kept". A partly reversed one is noted on the order's History. Staff may reopen one that was still running.

## For developers

- A payment plugin tells Alfa a dispute's state with one call: [Card disputes for payment plugins](../plugins/payment-plugin-disputes.md).
- The REST API: [Orders](../api/orders.md#card-disputes).
- Other extensions hear `onAlfaDisputeChanged` after every change: [Order and cart events](../events/order-and-cart-events.md#onalfadisputechanged).
- Integrators take the topic `order.dispute` of outgoing notifications: [Outgoing notifications](../api/notifications.md).
