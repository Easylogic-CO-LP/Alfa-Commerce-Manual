---
title: Payments, refunds and webhooks
description: "How a payment plugin records and settles a payment, refunds it, and receives the shopper's return and the provider's callbacks."
---

# Payments, refunds and webhooks

<AlfaVersion verified="2.2.0" />

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
| `pluginData(array $data)`, `removePluginData(array $keys)` | Your own data on the row, merged key by key. Read it through the `Payment` reader (`Alfa\Component\Alfa\Site\Service\Order\Payment`): `Payment::of($payment)->pluginData()->getString('key')`. The rows of `$order->payments()` are already such readers. |
| `expectStatus(string $status)` | Write only if the row still has this status (see `settleAttempt()`) |
| `bookkeeping()` | Change the row without moving the order or telling the customer |
| `save()` | Writes. Returns the row's id, or `false`. |

### The verbs

| Verb | What it does | When to use it | What it guarantees | What it refuses |
|---|---|---|---|---|
| `amountToCollect(object $order): float` | The amount your gateway should charge: the order's total less what is already collected | Before every charge | Never negative | Nothing. `0.0` means: charge nothing and write no row. |
| `payment(object $order)` | Starts a builder for a new row | `onOrderAfterPlace`, a new attempt | The row records your plugin as its writer | `save()` answers `false` when the method is not one of your plugin's |
| `paymentUpdate(int $paymentId)` | Starts a builder for an existing row | Any change to a row | Only what you set is written | Throws `RuntimeException` when the row does not exist. Refuses a row that is not your plugin's. |
| `settleAttempt(PaymentLedger $write, int $orderId, string $reference = ''): int` | Writes a builder that has `expectStatus()` set, and tells you which of three things happened | Every time a provider confirms a payment | Of two callers, exactly one changes the row. When the books refuse money that has moved, a CRITICAL line goes to your log. | Returns `self::WRITE_OK`, `self::WRITE_RACED` (the other caller won, agree with it) or `self::WRITE_FAILED` (not in the books) |
| `claimPendingAttempt(int $paymentId, string $reference): bool` | Writes a provider reference on a pending row that has none, once | When two visits or two deliveries could both take the same attempt | Exactly one caller gets `true`. No money and no status move. | A blank reference and an id under 1 throw `InvalidArgumentException`. `false` when the row is not, or no longer, your pending attempt without a reference. |
| `supersedeAttempt(int $paymentId, string $reason = ''): int` | Closes a pending attempt nobody will pay | The shopper left, or started a new attempt | The order does not move and the customer is told nothing | Returns the same three `WRITE_` values. Another plugin's row is `WRITE_FAILED`. |
| `recordChargeback(int $paymentId, Money $amount, array $options = []): array` | Records money the customer's bank took back | A dispute your provider reports | Never moves the order | Another plugin's payment |
| `recordReversal(int $rowId, ?Money $amount = null, array $options = []): array` | Records that a booked refund or a chargeback did not stand | A reversed refund, a dispute you won | The original row is never edited. A new row names it. | Another plugin's row |
| `deletePayment(int $id, int $orderId): bool` | Deletes a payment row | Rarely | Only your own rows | Another plugin's row, or one that records no plugin |
| `orderTransition(int $orderId)` | Moves the order to a status, in your plugin's name: `->to($statusId)->save()` | Only for a moment the method's status settings cannot express | The same steps as any status change | |

Since 2.2.0. Every call above that changes or deletes a row acts only on a row your plugin wrote.

### Reading

| Verb | Returns |
|---|---|
| `getOrder(int $orderId): ?Order` | The order, the same kind of object the events hand you |
| `orderLanguage(Order\|int $order): string` | The language tag of the order's customer, for example `el-GR` |
| `gatewayPayments(int $orderId, int\|array $methodId = 0): array` | Your plugin's payment rows on the order, newest first. Refund rows are left out. |
| `latestPendingPayment(int $orderId, int $methodId = 0): ?object` | Your newest pending attempt on the order, or `null` |
| `gatewayPaymentByReference(array $references, int $orderId = 0, int\|array $methodId = 0): ?object` | Your row whose `transaction_id` is exactly one of these references, or `null` |
| `getPayment(int $id): ?object` | One payment row |
| `getPaymentsByOrder(int $orderId): array` | Every row of the order, from every plugin. Right for totals, wrong for "which attempt is mine". |
| `orderBalance(int $orderId): Money` | Since 2.2.0. The order's total less what the shop still holds. Above zero: still owed. Zero: settled. Below zero: overpaid. Throws when the order does not exist. |
| `countReferenceHolders(string $reference, array $types): int` | Since 2.2.0. How many of your rows of those types hold exactly this reference. Anything but 1 proves nothing. |
| `findOwnRowByReference(string $reference, array $types): ?int` | Since 2.2.0. The id of the one row of yours that holds the reference, or `null` when none or several do |
| `findLinkedRow(int $paymentId, string $type, string $reference): ?object` | The refund or chargeback row of a payment with this exact provider reference |
| `firstMethodRow(int $methodId, string $kind): ?array` | Since 2.2.0. For the checkup only: a method's first settled payment (`self::FIRST_PAID`) or first refund (`self::FIRST_REFUND`), as `id`, `order`, `moment` |

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

Changed in 2.2.0. The order moves after the payment row's save is final and Alfa's locks are released, not before
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
| `refundStartRefusal(object $order): ?string` | Why no refund may start on the order now (translated), or `null` | To explain the refund block to staff |
| `refundTypeFor(int $paymentId, ?Money $amount = null): string` | Since 2.2.0. `self::REFUND_FULL` or `self::REFUND_PARTIAL` for a refund of this amount. `null` means all that is left. | For your log or your message. Throws when the row is not a payment of yours or the amount is not positive. |

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
| `refundReservation(int $reservationId): ?array` | Reads one reservation: `reservation`, `payment`, `order`, `amount`, `status`, `key`, `providerRefundId` | Read only | `null` when there is none |
| `reportOutcome(int $paymentId, string $reportId): ?array` | Reads what Alfa keeps for one of your provider refund reports | Read only. It never calls your plugin. | `null` when Alfa keeps none |

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
- Give your provider the address exactly as the setup checkup prints it (`PaymentCheckupEvent::webhookUrl()`). On a
  multilingual site with friendly addresses, the plain `index.php` form is redirected and the callback is lost.

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

    $verdict = $this->settleAttempt($write, (int) $payment->id_order, $notice['transactionId']);

    if ($verdict === self::WRITE_FAILED) {
        $event->setResponseCode(500);   // not in the books: let the provider try again
        $event->setResponseBody('Ledger rejected');

        return;
    }

    $event->setResponseCode(200);       // written, or the other delivery won
    $event->setResponseBody('OK');
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

### Callbacks arrive twice

Providers repeat deliveries, and the callback and the shopper's return can run at the same moment. Write every
handler so that running it twice does no harm:

- settle with `expectStatus()` and `settleAttempt()`, never with a plain `save()`;
- answer 2xx for what a retry cannot fix (an unknown reference, a type you do not handle), and 5xx only when a
  retry can help;
- for refunds, pass the provider's refund id: the same id is booked once.
