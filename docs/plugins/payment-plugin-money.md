---
title: Payments, refunds and webhooks
description: "How a payment plugin records and settles a payment, refunds it, and receives the shopper's return and the provider's callbacks."
---

# Payments, refunds and webhooks

<CreatePluginButton type="payment" />

<AlfaVersion verified="2.3.0" />

**The pages of this guide:**

- [Payment plugins](./payment-plugins.md): start here
- [Payment plugin events](./payment-plugin-events.md)
- **Payments, refunds and webhooks** (this page)
- [A complete payment plugin](./payment-plugin-example.md)

## Recording and settling a payment

A payment row is one attempt to pay. An order can hold several: a retry, a deposit and its balance. The order counts
as paid from the sum of its completed rows.

You write a row with a **builder**: an object you describe the row to, ending with `save()`.

```php
// A new row for an order. The amount is what is still to collect.
$paymentId = $this->payment($order)->pending()->transactionId($myReference)->save();

// A change to an existing row. Only what you set is written.
$this->paymentUpdate($paymentId)->cancelled()->note('Customer request')->save();
```

| Builder call | Meaning |
|---|---|
| `pending()`, `authorized()`, `completed()`, `failed()`, `cancelled()`, `refunded()` | The row's status. A new row must have one: without it `save()` throws a `RuntimeException`. |
| `amount(Money\|string\|int\|float $amount)` | The amount. Left out, a new row takes the amount still to collect. |
| `transactionId(string $id)` | Your reference first, the provider's id once it is known |
| `processedAt(string $datetime)` | When the money moved, in UTC |
| `note(string $note)`, `gatewayResponse(string $json)` | A note for staff, the provider's raw answer |
| `method(int $methodId)` | Another method of your plugin |
| `pluginData(array $data)`, `removePluginData(array $keys)` | Your own data on the row, merged key by key. Read it back with `PluginPayload::of($payment->plugin_data)->getString('key')` (`Alfa\Component\Alfa\Site\Service\Data\PluginPayload`). The rows of `$order->payments()` answer it themselves: `->pluginData()->getString('key')`. |
| `expectStatus(string $status)` | Write only if the row still has this status (see `settleAttempt()`) |
| `bookkeeping()` | Change the row without moving the order or telling the customer |
| `save()` | Writes. Returns the row's id, or `false`. |

### Why a write did not write

Every write a payment plugin makes on a buyer's visit can answer why it did not write. Ask
`saveWithVerdict()` on the builder instead of `save()`, and `settleAttemptVerdict()`,
`supersedeAttemptVerdict()` and `claimPendingAttemptVerdict()` instead of the methods without "Verdict". Each
answers a `PaymentWriteVerdict`. Decide on its `kind`, then on its `code`:

| Kind | What happened | What the buyer is told (in your words) | Retry |
|---|---|---|---|
| `VERDICT_WRITTEN` | The row is written, already as asked, or found by its reference (`existing` true). | Nothing: go on. | |
| `VERDICT_REFUSED` | A money or business rule refused it. | `REFUSAL_OPEN_ATTEMPT`: another payment of this order is still open; finish it, or contact the shop. `REFUSAL_OVER_TOTAL`: the order is covered. Any other code: the payment cannot be taken now; contact the shop. | Never: the same write is refused again. |
| `VERDICT_LOCK_NOT_TAKEN` | Another operation held the order; nothing was written. | Try again in a moment. | Now, once, the same write. |
| `VERDICT_WRITE_FAILED` | The database refused the row; nothing was written. | The payment could not be recorded; try again; contact the shop if it keeps happening. | Later, with the same reference. |
| `VERDICT_RACED` | The row left the expected status first. | Agree with the write that won. | |

A code's value never changes. Codes may be added, kinds never: handle a code you do not know as its kind. Log
`message` and `figures`; never show them to the buyer as Alfa's words.

Open an attempt in this order. First read your own open attempt (`latestPendingPayment()`): resume it, claim it
(`claimPendingAttemptVerdict()`) or close it (`supersedeAttemptVerdict()`); never close another gateway's.
Then write your pending row with a reference you mint (`saveWithVerdict()`): only `VERDICT_WRITTEN` goes on;
on `VERDICT_LOCK_NOT_TAKEN` or `VERDICT_WRITE_FAILED` no provider call was made, and you write again with the
same reference: the same reference answers the same row, never a second one. Then call the provider with an
idempotency key taken from the row. Then store the provider's id on the row; if that write is not written, the
provider object exists: never create a second one; find your row by its reference on the next visit or
notification and complete it. When a create answers `existing` true on a pending row, your provider call may have
been made already: make it safe to repeat (the provider's idempotency key from the reference) or ask the
provider by the reference before creating anything. Call these methods outside any transaction of your own: the
reference is looked up under the order's lock, and inside a transaction that has already read, that read sees the
transaction's older snapshot.

A write waits for the order's lock as long as the database server allows (its `innodb_lock_wait_timeout`, 50
seconds unless the shop changed it) before answering `VERDICT_LOCK_NOT_TAKEN`. A provider's notification must answer
within the provider's own window, often 10 seconds or less, so a notification handler bounds the wait with
`withLockWait()`: inside the work you hand it, every write of the books waits at most the seconds you give (1 to 30)
for an order another operation holds, then answers as for any lock it could not take (`VERDICT_LOCK_NOT_TAKEN`,
nothing written). Answer your provider "not accepted" (a 503) then, and its redelivery writes once the order is free:

```php
$verdict = $this->withLockWait(seconds: 8, work: fn () => $this->settleAttemptVerdict($write, $orderId, $providerId));

if ($verdict->kind === self::VERDICT_LOCK_NOT_TAKEN) {
    // 503: the provider delivers again
}
```

A bound inside a bound keeps the shorter. A bound outside 1 to 30 throws `InvalidArgumentException` and the work does
not run. Nothing else in the work, and nothing after it, waits differently: the bound applies to the order's lock alone.
Without `withLockWait()` a notification may time out at the provider before the write answers; that is safe, because
nothing of the write exists until it commits, and the provider's redelivery settles the row once, but the provider
counts each timeout as a failed delivery.

The buyer is never shown a ledger's own message: on the storefront they are written to the orders log only, and
staff read them in the back office.

A plugin that uses these methods is built for the Alfa Commerce line that has them: its manifest declares
`<alfacore min="2.3" max="2.3"/>`, and its install script's `preflight()` asks `AlfaInstallerGate::rangeRefusal()`
(see [The Alfa Commerce lines your extension is built for](./overview.md#the-alfa-commerce-lines-your-extension-is-built-for)):

```php
// In preflight(), once the gate is loaded as that section shows:
$refusal = $gate::rangeRefusal(name: 'My gateway', route: (string) $type, manifest: $parent->getManifest());
```

### The verbs

| Verb | What it does | When to use it | What it guarantees | What it refuses |
|---|---|---|---|---|
| `amountToCollect(object $order): float` | The amount your gateway should charge: the order's total less what the shop still holds (the money collected, less what went back) | Before every charge | Never negative | Nothing. `0.0` means: charge nothing and write no row. |
| `payment(object $order)` | Starts a builder for a new row | `onOrderAfterPlace`, a new attempt | The row records your plugin as its writer | `save()` answers `false` when the method is not one of your plugin's |
| `paymentUpdate(int $paymentId)` | Starts a builder for an existing row | Any change to a row | Only what you set is written | Throws `RuntimeException` when the row does not exist. Refuses a row that is not your plugin's. |
| `settleAttempt(PaymentLedger $write, int $orderId, string $reference = ''): int` | Writes a builder that has `expectStatus()` set, and tells you which of three things happened | Every time a provider confirms a payment | Of two callers, exactly one changes the row. When the books refuse money that has moved, a CRITICAL line goes to your log. A write the books refuse queues no message for the shopper; its reason is in the orders log (`com_alfa.orders`), and on an administrator or API request staff read it in plain words. | Returns `self::WRITE_OK`, `self::WRITE_RACED` (the other caller won, agree with it) or `self::WRITE_FAILED` (not in the books). `settleAttemptVerdict()` makes the same write and answers a `PaymentWriteVerdict`. |
| `claimPendingAttempt(int $paymentId, string $reference): bool` | Writes a provider reference on a pending row that has none, once | When two visits or two deliveries could both take the same attempt | Exactly one caller gets `true`. No money and no status move. | A blank reference and an id under 1 throw `InvalidArgumentException`. `false` when the row is not, or no longer, your pending attempt without a reference. A `RuntimeException` when the order cannot be locked: nothing is written and the attempt stays claimable. `claimPendingAttemptVerdict()` makes the same claim and answers a `PaymentWriteVerdict`: `VERDICT_LOCK_NOT_TAKEN` when the order could not be locked. |
| `supersedeAttempt(int $paymentId, string $reason = ''): int` | Closes a pending attempt nobody will pay | The shopper left, or started a new attempt | The order does not move and the customer is told nothing | Returns the same three `WRITE_` values. Another plugin's row is `WRITE_FAILED`. `supersedeAttemptVerdict()` makes the same close and answers a `PaymentWriteVerdict`: another plugin's row is refused with `REFUSAL_NOT_WRITER`. |
| `dispute(int $paymentId, string $reference): DisputeLedger` | Tells Alfa a card dispute's state under the provider's dispute id; its `save()` answers a `DisputeVerdict` | Every dispute word your provider sends | One case per payment and dispute id. Alfa books the money at the bank's decision, never at a hold: a loss books the disputed amount as a chargeback, a win after a loss books its return. Answer your provider with the verdict's `providerStatus()`. | Another plugin's payment; a payment that collected nothing; a payment from the wallet |
| `recordReversal(int $rowId, ?Money $amount = null, array $options = []): array` | Records that a booked refund did not stand | A refund that failed or came back at the provider | The original row is never edited. A new row names it. | Another plugin's row; a chargeback row (a chargeback follows its dispute) |
| `failCapture(int $paymentId, string $reason): PaymentWriteVerdict` | Records that a capture your provider accepted did not stand: the money did not arrive after all (a card scheme rejected the capture later). Your completed payment moves to failed; its note starts with "Capture did not stand" and your reason. | Your provider reports it, after the payment was booked completed | The order is owed the amount again (its balance and `amountToCollect()` count it). Staff are told on the order by a notice. Bookkeeping: the order's status, its e-mails and its download access do not move; nothing is refunded; staff decide what follows. Of two calls, one writes: the other is `VERDICT_RACED`. | `REFUSAL_NOT_WRITER`: another plugin's row, or a row that is not a payment. `REFUSAL_HISTORY_LOCKED`: a refund that is not failed or cancelled, or a chargeback, names the payment; keep your own staff record, the order is settled by hand. `VERDICT_RACED`: no longer completed (the same report again). |
| `deletePayment(int $id, int $orderId): bool` | Deletes a payment row | Rarely | Only your own rows | Another plugin's row, or one that records no plugin |
| `orderTransition(int $orderId)` | Moves the order to a status, in your plugin's name: `->to($statusId)->save()` | Only for a moment the method's status settings cannot express | The same steps as any status change | |

Every call above that changes or deletes a row acts only on a row your plugin wrote. Every call of the base class
that carries the contract's `@api` line is listed, with what it guarantees, on
[Calling core from an extension](./calling-core.md); `deletePayment()`, `orderTransition()`, `findOwnRowByReference()`
and `firstMethodRow()` carry none.

When the books refuse to write a payment row (`create`, a change, or a
change that expects a status), for example a payment that would take the order past what it is owed, `save()`
answers `false` or `self::WRITE_FAILED`, and on a storefront request Alfa shows the shopper nothing: tell
the shopper in your own words. On an administrator or API request staff read a plain sentence that names the order's
number. A payment cap counts what the shop still holds: money a customer's bank took back, or a part refunded, is
owed again and may be paid again.

### Reading

| Verb | Returns |
|---|---|
| `getOrder(int $orderId): ?Order` | The order, the same kind of object the events hand you |
| `orderLanguage(Order\|int $order): string` | The language tag of the order's customer, for example `el-GR` |
| `gatewayPayments(int $orderId, int\|array $methodId = 0): array` | Your plugin's payment rows on the order, newest first. Only rows of the type `payment`: refund, authorization, reversal and chargeback rows are left out. |
| `latestPendingPayment(int $orderId, int $methodId = 0): ?object` | Your newest pending attempt on the order, or `null` |
| `gatewayPaymentByReference(array $references, int $orderId = 0, int\|array $methodId = 0): ?object` | Your row of the type `payment` whose `transaction_id` is exactly one of these references, or `null` |
| `getPayment(int $id): ?object` | One payment row |
| `getPaymentsByOrder(int $orderId): array` | Every row of the order, from every plugin. Right for totals, wrong for "which attempt is mine". |
| `orderBalance(int $orderId): Money` | The order's total less what the shop still holds. Above zero: still owed. Zero: settled. Below zero: overpaid. Throws when the order does not exist. |
| `collectableNow(int $paymentId): Money` | What one of your open payments (pending or authorized) may still collect when it is settled: the order's total less what the order holds against it with this row left out (every gateway's pending, authorized and completed payments, less chargebacks and settled refunds), never below zero, in the order's currency. Zero for another gateway's row, a row that is not a payment, and a payment no longer pending or authorized. Throws `OrderCurrencyException` when the row's order does not exist or names no currency. |
| `countReferenceHolders(string $reference, array $types): int` | How many of your rows of those types hold exactly this reference. Anything but 1 proves nothing. |
| `findOwnRowByReference(string $reference, array $types): ?int` | The id of the one row of yours that holds the reference, or `null` when none or several do |
| `findLinkedRow(int $paymentId, string $type, string $reference): ?object` | The refund or chargeback row of a payment with this exact provider reference |
| `firstMethodRow(int $methodId, string $kind): ?array` | For the checkup only: a method's first settled payment (`self::FIRST_PAID`) or first refund (`self::FIRST_REFUND`), as `id`, `order`, `moment` |

**Before a capture or a charge of an open row, ask `collectableNow()`, never `orderBalance()`.** The settle of the
row checks the same rule under the order's lock, and refuses what does not fit (`REFUSAL_OPEN_ATTEMPT` while another
payment of the order is open, `REFUSAL_OVER_TOTAL` otherwise), after your provider has already taken the money.
`orderBalance()` counts completed payments only, so a capture it allows can still be refused at the settle. Capture no
more than `collectableNow()` answers, or offer no capture. It is read without the lock, so it is never a guarantee:
the settle decides.

```php
$room = $this->collectableNow(paymentId: (int) $payment->id);

if ($capture->greaterThan($room)) {
    // capture no more than $room, or tell staff why the capture is not offered
}
```

Amounts on the rows you read are `Money` objects in the order's currency. The one exception is the row
`findLinkedRow()` returns: it holds only `id`, `amount`, `transaction_status` and `transaction_id`, and its `amount`
is the stored figure, not `Money`. A reference is compared whole: letter case
and spaces count. The `$types` are `self::TYPE_PAYMENT`, `TYPE_AUTHORIZATION`, `TYPE_REFUND`, `TYPE_REVERSAL` and
`TYPE_CHARGEBACK`.

### The order's status

You never move the order yourself when a payment changes. A method's settings can name an order status for each
payment status, in fields called `status_on_<payment status>` (the Standard plugin has `status_on_completed`,
`status_on_cancelled` and `status_on_refunded`). When a row **changes** to that status, Alfa moves the order.

- A new row never moves the order, whatever its status. Write the row as pending, then change it with
  `paymentUpdate()`. `payment($order)->completed()->save()` counts in the totals but moves nothing.
- Only a row that takes money in moves the order. A refund, reversal or chargeback row does not.
- A full refund moves the order (through `status_on_refunded`). A partial refund does not.

The order moves after the payment row's save is final and Alfa's locks are released, not before
`save()` returns when your code holds a lock or a transaction of its own.

## Refunds

There are two ways to refund, and they must not be mixed.

| Your method | Use |
|---|---|
| Has no provider (cash, bank transfer): the refund moves no money through your plugin | `refundPayment()` |
| Refunds through a provider | `reserveRefund()`, then the provider, then `settleRefund()`, `holdRefund()` or `releaseRefund()` |

Never start a refund with the builder (`payment($order)->refund()...`).

**The refund block.** A provider can report a refund that Alfa's books do not hold, for example one made in the
provider's own portal. While such a report is open on an order, no new refund may start on it. Staff resolve the
report first.

### Before the refund: what may be refunded

| Verb | What it tells you | When to use it |
|---|---|---|
| `refundableNow(object $order): Money` | What the order may still give back, less everything reserved | To decide whether to offer a Refund button |
| `refundableRemainder(int $paymentId): Money` | What is left on one payment, less its reservations | To decide whether to offer a Refund button |
| `refundFormMaximum(int $paymentId): Money` | What is left on the payment, held to what the order may still refund. Zero for a payment that is not completed. | The maximum of every refund form. Use this figure and do no arithmetic of your own. |
| `bookedRefundable(int $orderId): Money` | What the books still allow to be refunded on the order, ignoring what is reserved: the money collected less everything already given back. The ceiling that money your provider already moved is booked against. | Never to decide whether a refund may start (`reserveRefund()` decides) or for the maximum of a form |
| `refundStartRefusal(object $order): ?string` | Why no refund may start on the order now (translated), or `null` | To explain the refund block to staff |
| `refundTypeFor(int $paymentId, ?Money $amount = null): string` | `self::REFUND_FULL` or `self::REFUND_PARTIAL` for a refund of this amount. `null` means all that is left. | For your log or your message. Throws when the row is not a payment of yours or the amount is not positive. |

### A refund with no provider

```php
$result = $this->refundPayment((int) $payment->id, null, ['reason' => $reason]);

if ($result['outcome'] !== self::OUTCOME_OK) {
    $event->setError($result['reason']);
}
```

`refundPayment(int $paymentId, ?Money $amount = null, array $options = []): array`

- **What it does.** Writes the refund row and, once the settled refunds cover the payment, marks the payment
  refunded. One call, decided under the order's lock.
- **The amount.** `null` is the only way to say "everything that is left". A partial refund is a positive `Money` in
  the order's currency.
- **What it guarantees.** A second call on a refunded payment writes nothing (`OUTCOME_ALREADY_REFUNDED`). The same
  provider refund reference twice writes nothing (`OUTCOME_DUPLICATE`).
- **What it refuses.** Zero or a negative amount (`OUTCOME_NOT_REFUNDABLE`), a payment of another plugin
  (`OUTCOME_REFUSED`), a start while the refund block holds (`OUTCOME_BLOCKED`).
- **What it returns.** `['outcome' => ..., 'refund_id' => int, 'reason' => string, 'amount' => float]`.

`$options`: `reason`, `transaction_id` (the provider's id of **the refund**, never the payment's),
`gateway_response`, `document` (the credit document the refund settles), and for money a provider already moved:
`gateway_moved`, `request_key`, `report_id`.

With `'gateway_moved' => true` the same verb books a refund the provider **already made** and that no reservation
covers, such as one made in the provider's portal. That money is never refused: when the books cannot take it, Alfa
keeps it on a row for staff and answers `OUTCOME_UNRECONCILED`.

### A refund through a provider

| Verb | What it does | What it guarantees | What it refuses or returns |
|---|---|---|---|
| `reserveRefund(int $paymentId, ?Money $amount = null, array $options = []): array` | Decides whether the refund may start and sets the amount aside as a pending refund row. `null` means the form's maximum. `$options`: `mark`, `reason`, `document`. | The reservation is saved before it returns, so every other start counts it. It never marks the payment refunded. | Returns `outcome`, `reservation` (its id), `key` (send it to the provider as the idempotency key), `amount` (send exactly this), `full`, `reason`. Anything but `self::OUTCOME_RESERVED` means: send nothing. |
| `settleRefund(int $reservationId, Money $amount, ?string $providerRefundId, array $options = []): array` | The provider completed the refund: books it | Booked once per provider refund id. The provider's figure is booked as it is, also above the reservation. | `OUTCOME_UNRECONCILED` when the books cannot hold it: Alfa keeps it for staff |
| `holdRefund(int $reservationId, ?string $providerRefundId, ?Money $amount = null, array $options = []): array` | The provider accepted the refund but has not completed it: it stays reserved under the provider's id | Nothing is booked yet | |
| `releaseRefund(int $reservationId, string $reason, array $options = []): array` | The provider definitely refused: gives the reserved amount back | Nothing is booked | Never use it for an unknown outcome |
| `failRefundAttempt(int $reservationId, string $providerRefundId, string $reason, array $options = []): array` | The provider failed this attempt and you will try again for the same request: the reservation keeps its amount and gets a new key | No figure moves, so the retry is never reserved twice. The same failure again is `self::OUTCOME_DUPLICATE` and writes nothing. | Returns `outcome` (`self::OUTCOME_RESERVED` when kept for the retry), `reservation`, `key` (send the retry with it), `amount` (send exactly this) and `reason`. Refuses another plugin's payment and a settled or released reservation. To give the request up instead, use `releaseRefund()`. |
| `refundReservation(int $reservationId): ?array` | Reads one reservation: `reservation`, `payment`, `order`, `amount`, `status`, `key`, `providerRefundId` | Read only | `null` when there is none |
| `reportOutcome(int $paymentId, string $reportId): ?array` | Reads what Alfa keeps for one of your provider refund reports | Read only. It never calls your plugin. | `null` when Alfa keeps none |
| `unbookedProviderRefundsOfPayment(int $paymentId): array` | Reads what Alfa concluded from your reports for one of your payments: `refunds` (they hold the refund block), `reserved` (pending, their exact amount reserves the refundable pool), `unread` (what Alfa could not read of your answer, or `null`) | Read only. It asks your `unbookedProviderRefunds()` once and never calls the provider. | The empty shape for a payment that is not yours or not a payment; never call it from `unbookedProviderRefunds()` itself. |

`settleRefund()`, `holdRefund()` and `releaseRefund()` each return
`['outcome' => ..., 'refund_id' => int, 'reason' => string, 'amount' => float]`. The outcome of a call that did its
work is `self::OUTCOME_OK` for a settle, `self::OUTCOME_RESERVED` for a hold and `self::OUTCOME_RELEASED` for a
release. `self::OUTCOME_DUPLICATE` means it was already so and nothing was written. `self::OUTCOME_RACED` and
`self::OUTCOME_FAILED` mean nothing was written and a retry may succeed. `self::OUTCOME_REFUSED` means a retry cannot
help.

The `$options` of `settleRefund()` are `final`, `gateway_response`, `reason`, `processed_at` and `report_id`. Pass
`'final' => true` when this is the last, or the only, refund your provider makes for the reservation: what the
reservation still holds beyond the provider's figure is then given back. `holdRefund()` takes `final`,
`gateway_response` and `report_id`. `releaseRefund()` takes `status` (`self::STATUS_FAILED`, the default, or
`self::STATUS_CANCELLED`), `provider_refund_id` and `gateway_response`.

```php
$reserved = $this->reserveRefund((int) $payment->id, $amountOrNull, ['reason' => $reason]);

if ($reserved['outcome'] !== self::OUTCOME_RESERVED) {
    $event->setError($reserved['reason']);

    return;
}

// Ask your provider here for exactly $reserved['amount'], with the key $reserved['key'].
// Then report the answer:
//   completed:        $this->settleRefund($reserved['reservation'], $providerAmount, $providerRefundId, ['final' => true]);
//   accepted, pending: $this->holdRefund($reserved['reservation'], $providerRefundId);
//   refused for good:  $this->releaseRefund($reserved['reservation'], $providerReason);
//   no clear answer:   report nothing. The reservation stays until a callback or staff resolve it.
```

Four rules for a gateway:

1. Call every refund verb **outside any database transaction**. Inside one, `settleRefund()`, `holdRefund()`,
   `releaseRefund()` and `refundPayment()` with `gateway_moved` answer `OUTCOME_FAILED` and write nothing, and a
   reservation is saved only when that transaction is.
2. Hold no lock and no transaction while you call the provider.
3. Sending the same request again uses the same reservation and the same key. Never reserve again for a resend.
4. Declare the buttons that start a refund with `startsRefund()` (see [Staff actions](./payment-plugins.md#staff-actions)).

Two more rules:

- When the provider reports that one attempt failed and you will try again, call
  `$this->failRefundAttempt($reserved['reservation'], $providerRefundId, $why)`, then send the retry with the answer's
  `key` and exactly its `amount`, and report the retry's outcome on the same reservation as above.
- `self::REFUND_BEYOND_PREFIX` (`beyond:`) begins the reference Alfa itself writes for a refund the provider gave no
  refund id for, beyond the request's reservation. It is never a provider's refund id: never send it to your
  provider as one.

### Telling Alfa about refunds it does not hold

`public function unbookedProviderRefunds(int $paymentId): array`

Override it when your provider can report refunds that did not start in the shop. It returns the refunds your
provider reported on this payment and that the books do not hold, oldest first, one entry per refund:

| Key | Value |
|---|---|
| `reportId` | A stable identity built only from the provider's facts: `'refund:'` and the provider's refund id, or else `'txn:'` and the id of the provider transaction that carries the refund, or else `'facts:'` and a SHA-256 of the payment reference, amount, currency and the provider's own time of the refund. The same refund always gives the same `reportId`, pending or settled. |
| `id` | The provider's refund id, or `null` |
| `amount` | A `Money` in the order's currency, or `null` when none can be derived exactly |
| `providerAmount`, `providerCurrency` | The figure and currency as the provider stated them |
| `reportedOn` | When your plugin first kept the report (`Y-m-d H:i`, site time) |
| `status` | `self::REPORT_STATUS_SETTLED` or `self::REPORT_STATUS_PENDING` |

The method only reads your own log and the books. It writes nothing and never calls the provider. A refund your
plugin started through `reserveRefund()` is never listed. The base class answers an empty list, which is right for a
method with no provider.

To read what Alfa concluded from your reports for one payment (which it holds as reserving, which as blocking), call
`$this->unbookedProviderRefundsOfPayment($paymentId)`. Never call it from `unbookedProviderRefunds()` itself: Alfa
refuses that call with a `LogicException`, reads the payment as unread, writes the error to the payments log, and the
refund block holds until the plugin is fixed.

## Return and webhook addresses

A plugin has no address of its own. Alfa provides two and finds your plugin by the `method` parameter:

| Address | Built with | Form |
|---|---|---|
| Return (the shopper's browser) | `$this->returnUrl($order, $extra)` | `index.php?option=com_alfa&task=payment.response&method=<element>` plus your `$extra` |
| Webhook (the provider's server) | `$this->webhookUrl()` | `index.php?option=com_alfa&task=payment.webhook&method=<element>` |

Both come from `HasTransportUrlsTrait`, which the base class uses. Both are absolute and use https.

- The **return address** carries only what you add. If your provider's return message names the order by itself,
  add nothing. If it does not, add the order's id and its payment token, and read them back with
  `orderFromReturnLink()`:

```php
use Alfa\Component\Alfa\Administrator\Helper\PaymentToken;

$url = $this->returnUrl($order, [
    'id_order' => $order->id(),
    'token'    => PaymentToken::for($order->id(), $order->secureKey()),
]);

// Later, in onPaymentResponse():
$order = $this->orderFromReturnLink();   // the order, or null when the link proves nothing
```

- The **webhook address** carries no order and no secret. It is one fixed address you give your provider.
  `webhookUrl('sandbox')` or `webhookUrl('live')` adds `&environment=...` so that test and live callbacks arrive at
  different addresses (see [Sandbox and live](./payment-plugins.md#sandbox-and-live)).
- Give your provider the address exactly as the setup checkup prints it (`PaymentCheckupEvent::webhookUrl()`).
- The webhook address is always the plain form: the site root, `https`, and `index.php` with the query in the table
  above, with no language and no friendly path. `$this->webhookUrl()` builds it and the setup checkup prints the
  same address, in every language of the site, and also when it is built in the administrator. The return address is
  routed like the site's other addresses.
- A POST to the plain address reaches your plugin. A GET reaches it too, without a redirect, while "System - Alfa
  Commerce Sync" is enabled with its Access set to Public: that plugin marks the request before Joomla routes it. See
  [System, console and task plugins](./system-console-task-plugins.md#the-system-plugin-that-ships-alfa-commerce-sync).
- An address in the friendly form reaches the same plugin. If your plugin compares the address registered at the
  provider with the one it builds, the two differ in text for such a registration, although both reach your plugin.

### Authenticating a callback

Alfa checks nothing about a callback except which plugin it is for. Proving that the provider sent it is your
plugin's job:

- Use **the provider's own mechanism**: its signature over the raw body, a digest, or a verification call to the
  provider.
- Never use the return link's `id_order` and `token` for a callback. That pair answers "may this browser see this
  order", and every customer holds it for their own order.
- Find the **payment row** from the provider's reference, then take the order from the row. Never start from an
  order id in the request.
- Take the amount from your row. The callback may confirm it. It never supplies it.

```php
use Alfa\Component\Alfa\Site\Service\Pricing\Money;
use Joomla\CMS\Factory;

public function onPaymentWebhook($event): void
{
    $raw    = (string) file_get_contents('php://input');
    $notice = $this->verifiedNotice($raw);

    if ($notice === null) {
        $event->setResponseCode(401);
        $event->setResponseBody('Invalid signature');

        return;
    }

    // This plugin's row with that reference, or nothing.
    $payment = $this->gatewayPaymentByReference([$notice['reference'], $notice['transactionId']]);

    if ($payment === null) {
        $event->setResponseCode(200);   // trying again will not make it known
        $event->setResponseBody('Unknown payment');

        return;
    }

    if ($payment->transaction_status !== self::STATUS_PENDING) {
        $event->setResponseCode(200);   // a repeated delivery
        $event->setResponseBody('Already processed');

        return;
    }

    $paid = Money::ofMinor($notice['amountMinor'], $payment->amount->getCurrency());

    if (!$paid->equals($payment->amount)) {
        $event->setResponseCode(200);   // settle nothing, leave it to staff
        $event->setResponseBody('Amount mismatch');

        return;
    }

    $write = $this->paymentUpdate((int) $payment->id)
        ->expectStatus(self::STATUS_PENDING)
        ->completed()
        ->transactionId($notice['transactionId'])
        ->processedAt(Factory::getDate('now', 'UTC')->toSql());

    $verdict = $this->settleAttemptVerdict($write, (int) $payment->id_order, $notice['transactionId']);

    // 200 when the payment is in the books (written, or the other delivery won); 503 otherwise, so the provider
    // delivers again.
    $status = $verdict->providerStatus();
    $event->setResponseCode($status);
    $event->setResponseBody($status === 200 ? 'OK' : 'Not accepted');
}

/**
 * Your own code: check the provider's signature over $raw and return
 * ['reference' => string, 'transactionId' => string, 'amountMinor' => int], or null.
 */
private function verifiedNotice(string $raw): ?array
{
    return null;
}
```

`settleAttemptVerdict()` writes a CRITICAL line to your log for `VERDICT_REFUSED` and `VERDICT_WRITE_FAILED` (the
money moved and the books did not: reconcile), and a WARNING for `VERDICT_LOCK_NOT_TAKEN`. Answer your provider with
the verdict's `providerStatus()`: 200 for `VERDICT_WRITTEN` and `VERDICT_RACED`, 503 for every other kind, so the
provider delivers again. For a refused write it also writes a CRITICAL line to the payments log (`com_alfa.payments`)
with the row and the reason, for a person to reconcile while the provider retries.

### Callbacks arrive twice

Providers repeat deliveries, and the callback and the shopper's return can run at the same moment. Write every
handler so that running it twice does no harm:

- open an attempt with its row first, written with a reference you minted, and call the provider only on
  `VERDICT_WRITTEN`;
- settle with `expectStatus()` and `settleAttempt()` or `settleAttemptVerdict()`, never with a plain `save()`;
- answer a write with its verdict's `providerStatus()`, and 2xx for anything else a retry cannot fix (an unknown
  reference, a type you do not handle);
- for refunds, pass the provider's refund id: the same id is booked once.
