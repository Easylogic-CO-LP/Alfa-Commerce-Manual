---
title: Card disputes
description: "How a payment plugin tells Alfa a card dispute's state with one call, what Alfa books and when, and what to answer the provider."
---

# Card disputes

<CreatePluginButton type="payment" />

<AlfaVersion verified="2.3.0" />

**The pages of this guide:**

- [Payment plugins](./payment-plugins.md): start here
- [Payment plugin events](./payment-plugin-events.md)
- [Payments, refunds and webhooks](./payment-plugin-money.md)
- **Card disputes** (this page)
- [A complete payment plugin](./payment-plugin-example.md)

A dispute starts at the customer's bank: the customer says a card payment was not theirs, the goods never came, or a
promised refund was never made. The provider tells your plugin with its own notifications. Your plugin tells Alfa
with **one call**, and Alfa keeps the case, books the money when the bank decides, tells staff and answers what to
reply to the provider. What staff see is on [Card disputes](../services/disputes.md).

## The money, in one rule

The books follow the bank's **last decision**, never the state of the case.

| The case | What Alfa books | The order reads |
|---|---|---|
| An inquiry, an open chargeback, a case under review | Nothing. A hold at the provider is not a refund. | Paid, as before. New refunds of the order wait while a chargeback is open or under review. |
| Lost (the bank decided for the customer, the shop accepted, or did not answer in time) | One chargeback row of the disputed amount, linked to the payment and the case | Owed again by that amount. The invoice is not changed. |
| Won with no earlier loss | Nothing | Paid |
| Won after a loss | A reversal of that chargeback | Paid again |
| Opened again after a decision (a second round, pre-arbitration, an appeal) | Nothing: the last decision stands until the bank decides again | As the last decision left it |
| A corrected amount after a loss | The difference: a further chargeback, or a reversal of part of one | Owed the corrected amount |

A dispute may be about part of a payment: it states its own amount, and two partial cases of one payment each book
their own. Alfa books by difference, so a repeated word, a late word or a corrected amount never books twice. Each row
it books carries Alfa's own reference `dispute:<id>:<n>`, never the provider's dispute id; the provider's id stays on
the case.

## The one call

Read the provider's dispute (or take the notification's state), find your payment row it names, then:

```php
use Alfa\Component\Alfa\Administrator\Service\Order\DisputeLedger;

// A chargeback opened (for example Stripe charge.dispute.created, status needs_response, after reading the dispute):
$verdict = $this->dispute(paymentId: (int) $payment->id, reference: 'du_1QxYz')
    ->open()
    ->amount(amount: '49.90', currency: 'EUR')
    ->reason(code: DisputeLedger::REASON_NOT_RECEIVED, text: 'product_not_received')
    ->evidenceDueBy(utc: '2026-12-04 23:59:59')
    ->fee(amount: '15.00', currency: 'EUR')
    ->providerLink(url: 'https://dashboard.stripe.com/disputes/du_1QxYz')
    ->gatewayResponse(json: $raw)
    ->save();

return $verdict->providerStatus();   // 200, or 503 so the provider sends it again
```

`$this->dispute(int $paymentId, string $reference): DisputeLedger` is the only way a payment plugin writes a dispute.
It writes as your plugin, on your own payments only. `reference` is the provider's dispute id: one per case, the same
across its rounds. It is required.

```php
// An inquiry: the bank only asks for information.
$this->dispute(paymentId: $id, reference: $ref)->inquiry()->amount(amount: '49.90', currency: 'EUR')->evidenceDueBy(utc: $due)->save();

// Evidence submitted at the provider (an open chargeback moves to under review; an inquiry stays an inquiry).
$this->dispute(paymentId: $id, reference: $ref)->evidenceSent()->save();

// Won (with the fee given back), lost, an inquiry that ended with no chargeback.
$this->dispute(paymentId: $id, reference: $ref)->won()->feeReturned(amount: '15.00', currency: 'EUR')->save();
$this->dispute(paymentId: $id, reference: $ref)->lost()->save();
$this->dispute(paymentId: $id, reference: $ref)->closed(why: DisputeLedger::CLOSED_INQUIRY_ENDED)->save();

// A second round after a decision: open() or evidenceSent() on a won or lost case.
$this->dispute(paymentId: $id, reference: $ref)->open()->evidenceDueBy(utc: $newDue)->save();

// A word that is only information (an issuer's comment): a note, nothing else changes.
$this->dispute(paymentId: $id, reference: $ref)->note(text: 'Issuer: cardholder confirms non-receipt')->save();

// A notification that carries its own time, delivered in any order.
$this->dispute(paymentId: $id, reference: $ref)->won()->asOf(utc: '2026-12-09 08:00:00')->save();
```

### The chain

| Call | What it says |
|---|---|
| `inquiry()`, `open()`, `evidenceSent(?string $utc = null)`, `won()`, `lost()`, `closed(string $why)` | The state. One word names one state. `$why` is `DisputeLedger::CLOSED_INQUIRY_ENDED` (a gateway closes only an inquiry that ended). |
| `amount(string $amount, string $currency)` | The disputed amount as the provider states it: a decimal text and an ISO 4217 code. A new case needs it. |
| `amountInOrderCurrency(string $amount)` | The amount in the order's currency, when the provider stated it in another one and you know the order's figure. Refused for a case stated in the order's currency. |
| `reason(string $code, string $text = '')` | One of `DisputeLedger::REASON_FRAUD`, `REASON_NOT_RECEIVED`, `REASON_NOT_AS_DESCRIBED`, `REASON_DUPLICATE`, `REASON_CREDIT_NOT_PROCESSED`, `REASON_CANCELLED`, `REASON_UNRECOGNISED`, `REASON_OTHER`; and the provider's own words. |
| `evidenceDueBy(?string $utc)` | The deadline, UTC `Y-m-d H:i:s`. |
| `fee(string $amount, string $currency)`, `feeReturned(string $amount, string $currency)` | The provider's fee and the part it gave back, as it states them. Shown to staff, never booked: the fee is the provider's charge to the shop, not the customer's money. |
| `providerLink(string $url)` | The https address of the case at the provider. |
| `note(string $text)` | A note on the order's timeline. |
| `asOf(string $utc)` | The provider's time of this word, UTC `Y-m-d H:i:s` (microseconds allowed). |
| `gatewayResponse(string $json)` | The provider's payload, kept for staff and support. |
| `save(): DisputeVerdict` | Writes it all in one transaction. |

A first word may come late, in a later state (`evidenceSent()`, `won()` or `lost()` on a case Alfa has not seen):
the record is made in the state the provider gives. A move the states do not allow (back to an inquiry from a
chargeback, anything out of a closed case) is refused.

### The answer and the status to give the provider

`save()` answers a `DisputeVerdict` (`kind`, `code`, `message`, `disputeId`, `existing`, `waitsForStaff`;
`isWritten()`, `isRefused()`, `isStale()`). Answer your provider with `providerStatus()`, never with a status of your
own:

| Kind | What happened | `providerStatus()` |
|---|---|---|
| `written` | Written, or already exactly as asked (`existing` true when the case was found) | 200 |
| `refused` | A rule refused it (`code` says which). Alfa has already kept a notice for staff with your word and why. | 200 |
| `stale` | Older than the word Alfa applied last (`asOf()`): nothing written | 200 |
| `lock_not_taken` | Another operation held the order: nothing written | 503 |
| `write_failed` | Nothing written; the reason is in the payments log | 503 |

The codes of a refusal: `dispute_not_collected` (not a completed or refunded payment), `dispute_wallet` (paid from the
customer's wallet), `dispute_not_own` (another plugin's payment or case), `dispute_transition` (a move the states do not
allow), `dispute_closed` (the case is closed: a later dispute is a new case), `dispute_amount` (no amount, not a
positive decimal, finer than the order's scale, more than the payment), `dispute_staff_only` (a call only staff make),
`dispute_follows_provider` (staff changing a fact the provider sets), `dispute_no_reference`, `dispute_no_currency`,
`dispute_value` (a malformed date, link, reason or fee), `dispute_missing`, `dispute_books_refused` and
`dispute_books_out_of_step` (the books could not take the booking; staff look). A code never changes; a later release
may add codes, never kinds, so handle a code you do not know as its kind.

A payment write answers its provider the same way: `PaymentWriteVerdict::providerStatus()` gives 200 when written or
raced (another delivery of the same word won) and 503 otherwise; a refused payment write is also written to the
payments log as CRITICAL.

## Repeats, order and two deliveries at once

- A case is one record per payment and provider dispute id. The same word again writes nothing new.
- Two deliveries at once queue on the order's lock: one makes the case, the other finds it.
- With `asOf()`, a word older than the one applied answers `stale`, so a late `open` never undoes a `lost`. Without
  it Alfa takes the call's own time: leave it out only when you read the provider's current state before you call.

## When the shop recorded the dispute by hand

Staff may record a dispute from the bank's letter before your notification arrives. When they typed your provider's
dispute id as its reference, your word is that record and it follows you from then on. When they did not, your word
makes a record of its own that **waits**: it books nothing, and staff answer on the order whether it is the same
dispute. Your answer is still `written` (with `waitsForStaff` true); nothing is joined by guesswork.

## What your plugin never does

It never books a chargeback or a reversal of one, never converts a currency, never builds a `Money` for a dispute,
never writes a staff record for a dispute and never decides the HTTP status by itself. It calls with nothing of its
own held: the save takes the order's lock in its own transaction. `recordReversal()` stays for refunds; a chargeback
row given to it is refused, since a chargeback follows its dispute.

## Two optional handlers

Alfa calls them on the plugin recorded on the disputed payment, by method name. A plugin without the method takes no
part and the order screen offers no button for it.

| Method | When Alfa calls it | What your plugin does |
|---|---|---|
| `public function onAlfaDisputeRefresh(DisputeRefreshEvent $event): void` | Staff press Ask the provider again | Read the case at the provider (`$event->getReference()`, `getPaymentId()`, `getOrderId()`, `getDispute()`), apply it with `$this->dispute(...)->...->save()`, then `$event->setVerdict($verdict)`, or `$event->setError('...')` in your own words |
| `public function onAlfaDisputeAccept(DisputeAcceptEvent $event): void` | Staff press Accept at the provider (an inquiry or an open chargeback) | Tell the provider the shop accepts; once it confirms, apply `->lost()` yourself. Your provider's later notification of the same loss is a repeat. |

```php
use Alfa\Component\Alfa\Administrator\Event\Payments\DisputeAcceptEvent;
use Alfa\Component\Alfa\Administrator\Event\Payments\DisputeRefreshEvent;

public function onAlfaDisputeRefresh(DisputeRefreshEvent $event): void
{
    $dispute = $this->providerClient()->readDispute($event->getReference());
    $event->setVerdict($this->dispute(paymentId: $event->getPaymentId(), reference: $event->getReference())
        ->evidenceDueBy(utc: $dispute->dueUtc)
        ->note(text: 'Read again at the provider')
        ->save());
}

public function onAlfaDisputeAccept(DisputeAcceptEvent $event): void
{
    $this->providerClient()->acceptDispute($event->getReference());
    $event->setVerdict($this->dispute(paymentId: $event->getPaymentId(), reference: $event->getReference())->lost()->save());
}
```

Alfa writes nothing itself on Accept: the money moves only when the loss is recorded.

## Mapping your provider's words

A guide, for your plugin to confirm against its provider's documentation:

| Provider word | Chain |
|---|---|
| An inquiry or request for information | `inquiry()` |
| An inquiry whose answer was sent | `evidenceSent()` (stays an inquiry) |
| An inquiry closed with no chargeback | `closed(why: DisputeLedger::CLOSED_INQUIRY_ENDED)` |
| A chargeback to answer | `open()` |
| Evidence received, the bank decides | `evidenceSent()` |
| Won, lost | `won()`, `lost()` |
| A second chargeback, pre-arbitration, an appeal | `open()` or `evidenceSent()` on the decided case |
| An issuer's comment | `note()` |
| Money withdrawn or reinstated while the case runs | No state of its own: the books move at the decision. Pass the fee if the word states it. |
| A dispute that cannot be contested (for example a direct debit return) | `lost()` |
