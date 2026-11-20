---
title: Calling core from an extension
description: "The calls of Alfa Commerce an extension may make, what each one guarantees, the hooks a gateway or carrier overrides, and what an extension never calls."
---

# Calling core from an extension

An extension reaches Alfa Commerce in two ways: through the base class it extends (`PaymentsPlugin`,
`ShipmentsPlugin`, and the `Plugin` class under both), and through a few core classes it calls by name. This page lists
every such call that is part of the contract, with what it guarantees.

Read [How events reach a plugin](../events/how-events-reach-a-plugin.md) first for the events themselves.

## The contract

Each call on this page carries a line `@api` in its docblock, which names its guarantee in one of these words:

| Word | What it promises |
|---|---|
| DURABLE | It writes, or it throws, so that the caller's transaction rolls back with it. |
| BEST EFFORT | A failure is logged and reported to staff, never thrown into the caller. |
| READ ONLY | It writes nothing. |
| ANSWERS | It answers a value that says what happened. |
| SESSION ONLY | It writes the visitor's session and nothing else. No table is read or written. |
| HOOK | Alfa calls it and your plugin overrides it. The line says when Alfa calls it and what its default does. |

A call without that line is not part of the contract, whatever its visibility: it may change or go with any update
of Alfa Commerce. If your extension needs something no call here gives, that is a request to the Alfa Commerce
project, not a query of your own.

What else the contract covers:

- An object that a call of this page or a hook hands to your plugin is inside the contract with its own public
  methods, those declared in Alfa's code, except a method whose own docblock says otherwise: `Order::row()` is not
  for plugins, and `FieldValue::column()` is for logging and diagnosis only. The methods an event inherits from
  Joomla are Joomla's contract.
- A builder's setters and its `save()`, `saveVerdict()` and `saveWithVerdict()` are covered by the call that hands
  the builder out: `payment()`, `paymentUpdate()`, `shipment()` or `shipmentUpdate()`.
- A value your plugin makes itself is inside the contract only when this page lists it: `Order::of()`,
  `Shipment::of()`, `Money` and `Currency`, and `PluginPayload::of()`.

## Core classes an extension calls by name

These are static calls. The classes are in these namespaces:

| Class | Namespace |
|---|---|
| `OrderModel` | `Alfa\Component\Alfa\Administrator\Model` |
| `ActionLogHelper`, `AlfaHelper`, `FieldsHelper`, `MultilingualHelper`, `MysqlError`, `NotificationHelper`, `PackageHelper`, `TransactionState` | `Alfa\Component\Alfa\Administrator\Helper` |
| `EmailService`, `InstalmentTiers`, `OrderMoneyLock`, `PaymentEnvironment`, `PaymentReferenceVault`, `PaymentWriteVerdict`, `RefundMark`, `ShipmentBookingLock` | `Alfa\Component\Alfa\Administrator\Service\Order` |
| `CartResolution`, `OperatorCheckout` | `Alfa\Component\Alfa\Administrator\Service\Cart` |
| `Storage` | `Alfa\Component\Alfa\Administrator\Service\Download` |
| `AlfaInstallerGate` | `Alfa\Component\Alfa\Administrator\Service\Setup` |
| `PluginLogTable` | `Alfa\Component\Alfa\Administrator\Plugin` |
| `CartService` | `Alfa\Component\Alfa\Site\Service\Cart` |
| `PluginPayload` | `Alfa\Component\Alfa\Site\Service\Data` |
| `PlaceTree` | `Alfa\Component\Alfa\Site\Service\Place` |

### The order's history and the notification bell

| Call | What it guarantees |
|---|---|
| `OrderModel::logOrderActivityStrict($orderId, $event, $summary, $context, $entityId, $actorId, $refuseOversize)` | **DURABLE.** Writes the entry or throws, so a caller whose own write is still open rolls back with it. Call it inside your open transaction. |
| `OrderModel::logOrderActivity($orderId, $event, $summary, $context, $entityId, $actorId)` | **BEST EFFORT.** Answers the entry's id, or `null`. A lost entry is logged CRITICAL and raised as a notification; only a failure that ended the caller's transaction is thrown. For work that already happened, such as a callback or a status change. |
| `NotificationHelper::push($dedupKey, $title, $options)` | **DURABLE.** A failure to write the row, or its journal entry, reaches the caller; a listener's failure never does. Inside a transaction the notice is written after the outermost commit, and discarded on a rollback. Decide whether your work stands without the notice. |
| `NotificationHelper::clear($dedupKey, $hard = false, $historyDays = null)` | **DURABLE.** Archives the notice, or deletes it with `$hard`. Inside a transaction it joins the notice journal, as `push()` does. |
| `NotificationHelper::exists($dedupKey)`, `isOpen($dedupKey)` | **READ ONLY.** `exists()`: a row carries the key, an archived one included (the cheap check before `clear()`). `isOpen()`: a notice of the key is raised and neither dismissed nor cleared. Both count a notice of the key that is still owed. |
| `ActionLogHelper::write($extension, $languageKey, $facts, $itemId, $actor)` | **ANSWERS.** `true` when the row is written, `false` when not. Every failure, a refused argument included, is caught, logged in `com_alfa.orders` and answered `false`. A plugin reaches it through `recordActionLog()` (below). |
| `EmailService::orderNumber(Order\|stdClass $order): string` | **READ ONLY.** The number the customer knows the order by. Pass the `Order` reader you were handed: `orderNumber(order: $order)`. |

### Locks and transactions

| Call | What it guarantees |
|---|---|
| `OrderMoneyLock::run(int $orderId, callable $work): bool` | **ANSWERS.** `false` when another request holds the lock and the work did not run. Throws a `RuntimeException` when the lock cannot be taken. Re-entrant for its connection; work deferred inside runs after the release. A gateway's way to the order's money lock. |
| `ShipmentBookingLock::run(int $shipmentId, callable $work): bool` | **ANSWERS.** As `OrderMoneyLock::run()`, for the booking of one parcel. |
| `ShipmentBookingLock::name(DatabaseInterface $db, int $shipmentId): string` | **READ ONLY.** The name of the server-wide named lock of one parcel's booking on this site, `alfa.booking.<site>.<shipment id>`. The site part is a hash of the database name and the table prefix, so two sites on one server never share a lock. Read it to name or look up the lock (a line of your own log, `IS_USED_LOCK` in a diagnosis). Take and release the lock only through `run()`. |
| `TransactionState::driver(DatabaseInterface $db): DatabaseDriver` | **ANSWERS.** The same connection, as the driver whose levels `TransactionState` keeps. A connection that is not a driver is refused with a `LogicException`. Narrow a connection through it once, in your constructor, before `commitLevel()` or `rollBackLevel()`. Every connection Joomla's container hands out is a driver. |
| `TransactionState::isOpen(DatabaseDriver $db): bool` | **READ ONLY.** Whether the driver counts an open transaction or savepoint on the connection. Inside Alfa's own transaction (a hook Alfa runs while its write is open) it answers `true`: the open level is Alfa's, not yours. |
| `TransactionState::commitLevel(DatabaseDriver $db): void` | **DURABLE.** Closes the level you opened with `transactionStart(true)`. At the outermost level it commits, or throws after closing a COMMIT that failed, and the work deferred inside then runs. Below it, the savepoint is released and its work goes to the level around it, which decides. Throws when no level is open. |
| `TransactionState::rollBackLevel(DatabaseDriver $db, ?Throwable $failure = null): bool` | **ANSWERS.** Closes only the level you opened with `transactionStart(true)`: back to that level's savepoint, or the whole transaction when yours is the outermost. Two cases roll back the whole transaction, Alfa's levels included: the server already ended it (a deadlock), or the savepoint cannot be rolled back to. Work held for the levels rolled back is discarded. Answers `true` when no transaction is left on the connection: inside Alfa's transaction, `true` means Alfa's work is gone too, and you rethrow your failure, never answer a refusal. |
| `MysqlError::number(Throwable $error): int` | **READ ONLY.** The MySQL error number of a failed statement (1062 a duplicate key, 1205 a lock wait, 1213 a deadlock), 0 when the failure is not a statement's. Read it instead of parsing a message. |

### Payments

| Call | What it guarantees |
|---|---|
| `PaymentEnvironment::active($params)`, `credentials($params, $environment, $keys)`, `assert($environment)`, `fromAddress(Input $input)` | **READ ONLY.** `active()`: `LIVE` only when the saved switch is exactly 1, else `SANDBOX`. `credentials()`: one set, without its prefix, in the order of `$keys`; the other set is never read; an unknown environment or an empty key throws an `InvalidArgumentException`. `assert()`: the value, or an `InvalidArgumentException`. `fromAddress()`: the set a notification address names, compared exactly, or `null`. See [Sandbox and live](./payment-plugins.md#sandbox-and-live). |
| `PaymentReferenceVault::store($userId, $paymentMethodId, $gateway, $originOrderId, $reference, $label, $expiresAt): int` | **DURABLE.** Writes the reference and answers its row's id. For a gateway that keeps saved cards or mandates. |
| `PaymentReferenceVault::findForUser(int $userId): array` | **READ ONLY.** A customer's active references, newest first, each reference decoded. |
| `RefundMark::of(int $paymentId): int` | **READ ONLY.** The payment's refund mark: the newest refund row's id, 0 while there is none. A refund form carries it, and Alfa refuses a form drawn before a later refund, so the double submit of one form reserves once. |
| `InstalmentTiers::maxCount(array $params, Money $amount, int $ceiling): int` | **READ ONLY.** The highest instalment count the method's tiers allow for an amount. |
| `InstalmentTiers::amounts(Money $total, int $max): array` | **READ ONLY.** What one instalment costs for each count, as a disclosure. |
| `InstalmentTiers::selected(int $max): int` | **READ ONLY.** The count to show as chosen: this request's choice, else the remembered one. |
| `InstalmentTiers::remember(int $count): void` | **SESSION ONLY.** Keeps the buyer's choice for the visit to the gateway. |
| `InstalmentTiers::take(): int` | **SESSION ONLY.** Reads the remembered choice and clears it; 1 when there is none. |

### Installing an extension and keeping its files

| Call | What it guarantees |
|---|---|
| `AlfaInstallerGate::refusal(string $name, string $route, ?string $minimum = null): ?string` | **READ ONLY.** Why your installer must refuse now (Alfa Commerce missing, or older than the minimum), or `null`. See [The installer gate](./overview.md#the-installer-gate). |
| `AlfaInstallerGate::rangeRefusal(string $name, string $route, SimpleXMLElement $manifest): ?string` | **READ ONLY.** Why it must refuse now, read from the range of Alfa Commerce lines your manifest declares, or `null`. A manifest with no range is never refused. See [The Alfa Commerce lines your extension is built for](./overview.md#the-alfa-commerce-lines-your-extension-is-built-for). |
| `PluginLogTable::ofPlugin(DatabaseDriver $db, string $type, string $name): ?self` | **READ ONLY.** Your plugin's log table as its `logs.xml` declares it, or `null` when it declares none. |
| `PluginLogTable::complete(Closure $report): bool` | **ANSWERS.** Creates the table, or adds the columns and the index it lacks. Each failure is told to `$report` and the others go on; `false` only when the table cannot be created. Run it outside any transaction: inside one it refuses. For your install and update script. |
| `PackageHelper::contentHash(string $path): string\|false` | **READ ONLY.** A file's content hash as Alfa's removal of obsolete files compares it (runs of whitespace collapsed in a text file), or `false` when the file cannot be read. |
| `Storage::root(): string` | **ANSWERS.** The download store's absolute root, provisioned with deny-all guards. Throws when no root is recorded (install Alfa Commerce again). Keep your own files only in a folder named after your plugin's element under it, never a folder named with two hex characters, which is the shape of Alfa's own folders there, and clear them in your `onClearData`. Moving the store moves none of your files: they stay at the old root. |

### The shop's data

| Call | What it guarantees |
|---|---|
| `AlfaHelper::can(string $section, string $action, ?User $user = null): bool` | **READ ONLY.** Whether the user holds `alfa.<section>.<action>` on `com_alfa` (a Super User always does). The one permission check an extension's back-office screen or download asks. |
| `AlfaHelper::getOrderStatuses(): array` | **READ ONLY.** Every order status by id, active and inactive, for naming a status. |
| `OperatorCheckout::authorized(User $actor): bool` | **READ ONLY.** Whether the user may place orders on a customer's behalf (checkout authority only). Taking over a storefront shopper's cart is asked separately. |
| `CartService::ambient(): self` | **READ ONLY.** The cart service of the visitor's own cart. |
| `CartService::summary(CartResolution $mode, int $cartId = 0)` | **ANSWERS.** The lines and totals of the cart under the mode given, without offers. `CartResolution::Current` creates no cart for a visitor who has none (finding the cart may adopt a guest cart and clamp a quantity again, as every cart page does); `CartResolution::Mutable` is refused. Ask it, not `read()`, which asks every carrier for its offer. |
| `FieldsHelper::columnForField(int $fieldId): ?string` | **READ ONLY.** The checkout column a saved checkout field id names, or `null` when the field is gone or unpublished, or when the read fails. |
| `PlaceTree::countryOf(int $placeId): ?array` | **READ ONLY.** The country a place belongs to: the place at the top of its chain, as `id`, `code2` and `code3`, its ISO 3166-1 codes in capitals, published or not; `null` for 0 or an id that does not exist. `code2` and `code3` are empty when the top place carries none (a chain cut from its country by a parent that no longer exists, or a top place stored without codes), and you then have no country. The first call in a PHP process (one request on the web) reads the place table once and keeps it, so a place changed later in the same process may not be seen. A failed read of the place table throws the database's exception: `null` only ever means no such place. |
| `MultilingualHelper::resolveLangMap($map, string $lang = ''): string` | **READ ONLY.** One text from a `{language: text}` map, in the language given (an empty language is this request's), else the default language, else the first entry that is not empty. |
| `PluginPayload::of(?string $json, string $source = ''): self` | **READ ONLY.** A plugin payload read from a stored column: empty for `NULL`, `''` or `'null'`; a column that holds anything else throws. |

## The payment and shipping base classes

Your plugin calls these on `$this`. They are protected unless the row says otherwise. The base class is the whole
payment and parcel API: a gateway never calls `PaymentLedger` and never writes `#__alfa_order_payments` itself, and a
carrier never calls `ShipmentLedger`. The pages of each family show the calls at work:
[Payments, refunds and webhooks](./payment-plugin-money.md) and [Shipping plugins](./shipment-plugins.md).

### Writes and attempts

| Call | What it guarantees |
|---|---|
| `payment($order)`, `paymentUpdate($paymentId)`; on `ShipmentsPlugin`, `shipment($order)` and `shipmentUpdate($shipmentId)` | **ANSWERS.** The builder, naming your plugin as the writer: its write acts only on your own methods and rows and refuses any other. It is finished with `save()` (the row's id, or `false`), with `saveVerdict()` (`WRITE_OK`, `WRITE_RACED` or `WRITE_FAILED`; it needs `expectStatus()`, and the parcel builder's takes the expected status), or on a payment builder with `saveWithVerdict()` (a `PaymentWriteVerdict`). `paymentUpdate()` throws when the payment is not found. |
| `settleAttempt($write, ...)` on both base classes | **ANSWERS.** `WRITE_OK`, `WRITE_RACED` or `WRITE_FAILED`. Your plugin data staged on the builder is written by the same compare-and-set as the status, or not at all. It takes the builder, never an array of columns. |
| `settleAttemptVerdict(PaymentLedger $write, int $orderId, string $reference = '')` | **ANSWERS.** A `PaymentWriteVerdict` for the settle: written, raced, refused, lock not taken, or write failed. |
| `supersedeAttempt(int $paymentId, string $reason = ''): int` | **ANSWERS.** `WRITE_OK`, `WRITE_RACED` or `WRITE_FAILED`, on your own attempts only: another gateway's row is `WRITE_FAILED`. Closes an attempt nobody will pay, so that it stops holding its slice of the order's total. It is not a cancellation: no `status_on_cancelled`, no move of the order. |
| `supersedeAttemptVerdict(int $paymentId, string $reason = '')` | **ANSWERS.** A `PaymentWriteVerdict` for the close. Another gateway's row is refused with `REFUSAL_NOT_WRITER`. |
| `claimPendingAttempt(int $paymentId, string $reference): bool` | **ANSWERS.** `true` when this call claimed the attempt; `false` when the row is not, or no longer, your pending attempt without a reference. Throws an `InvalidArgumentException` for an id under 1 or a blank reference, and a `RuntimeException` when the order cannot be locked (nothing is written). |
| `claimPendingAttemptVerdict(int $paymentId, string $reference)` | **ANSWERS.** A `PaymentWriteVerdict` for the claim. Another gateway's row is refused with `REFUSAL_NOT_WRITER`. |
| `refundPayment()`, `reserveRefund()`, `settleRefund()`, `holdRefund()`, `releaseRefund()`, `failRefundAttempt()` | **ANSWERS.** An array whose `outcome` is one of the `OUTCOME_` constants of the base class, with the refund's or the reservation's id and a reason. See [Refunds](./payment-plugin-money.md#refunds). |
| `refundReservation(int $reservationId): ?array` | **READ ONLY.** The reservation, or `null`. |
| `recordChargeback(int $paymentId, Money $amount, array $options = []): array` | **ANSWERS.** `['outcome', 'row_id', 'reason', 'amount', 'reopened']`. Never capped, never flips the payment, never moves the order. Another gateway's payment is refused. |
| `recordReversal(int $rowId, ?Money $amount = null, array $options = []): array` | **ANSWERS.** As `recordChargeback()`. A new `reversal` row names the refund or the chargeback, which is never edited; a won dispute is this call on the chargeback row. Never throws; your own rows only. Answer your provider 200 on `OUTCOME_RECORDED`, `OUTCOME_DUPLICATE` and `OUTCOME_NOTHING_LEFT`, 200 and a report to staff on `OUTCOME_REFUSED`, and 503 on `OUTCOME_FAILED`, so that the provider delivers again. |
| `recordActionLog($languageKey, $facts, $itemId)` on both base classes | **ANSWERS.** As `ActionLogHelper::write()`, the row filed under `plg_<group>_<element>`. Never throws. |

A `PaymentWriteVerdict` is a value: decide on its `kind`, then on its `code`. A code's value never changes and is
never used for anything else. Codes may be added, kinds never: handle a code you do not know as its kind. See
[Why a write did not write](./payment-plugin-money.md#why-a-write-did-not-write).

### Readers

| Call | What it guarantees |
|---|---|
| `gatewayPayments(int $orderId, int\|array $methodId = 0): array` | **READ ONLY.** Only the rows your plugin wrote (by the row's own `payment_method_type`: any of your methods, deleted ones included), newest first. Throws an `OrderCurrencyException` when rows are found and their order cannot be read. |
| `gatewayPaymentByReference(array $references, int $orderId = 0, int\|array $methodId = 0): ?object` | **READ ONLY.** Scoped as `gatewayPayments()`. The reference is matched byte for byte; `null` when nothing matches; an `OrderCurrencyException` as above. |
| `latestPendingPayment(int $orderId, int $methodId = 0): ?object` | **READ ONLY.** Your newest pending row of the order, or `null`; an `OrderCurrencyException` as above. |
| `getPaymentsByOrder(int $orderId): array` | **READ ONLY.** Every payment row of the order whatever the gateway, newest first. Read it to refuse or to explain, never to pick a row to write. |
| `getPayment(int $id): ?object` | **READ ONLY.** One row by id, not scoped to your plugin: check the row's plugin before you act. Throws an `OrderCurrencyException` when the row is found and its order cannot be read. |
| `getPaymentMethod(int $orderId = 0, int $methodId = 0): ?object` | **READ ONLY.** Your plugin's method only (another plugin's answers `null`), its settings decoded. By id: that method in any state, trashed included. By order alone: the order's chosen method, while the order records your plugin. Never a fallback or a sibling method. |
| `ownMethods(bool $publishedOnly = true): array` | **READ ONLY.** Your plugin's methods only, keyed by id in ascending order. |
| `orderBalance()`, `amountToCollect()`, `bookedRefundable()`, `refundableNow()`, `refundableRemainder()`, `refundFormMaximum()`, `refundStartRefusal()`, `countReferenceHolders()`, `refundTypeFor()` | **READ ONLY.** Money or a value. `orderBalance()` is signed and never clamped; `amountToCollect()` is clamped at zero. The readers of an order throw an `InvalidArgumentException` for an id under 1, and an `OrderCurrencyException` for an order that does not exist or names no currency. |
| `reportOutcome(int $paymentId, string $reportId): ?array` | **READ ONLY.** The outcome Alfa keeps for one of your provider refund reports, or `null`. It never asks your plugin, so `unbookedProviderRefunds()` may call it. |
| `unbookedProviderRefundsOfPayment(int $paymentId): array` (final) | **READ ONLY.** The core's side of one of your payments' provider refunds, as the core reads them (`refunds`, `reserved`, `unread`). It writes nothing, takes no lock, never calls the provider, and asks your `unbookedProviderRefunds()` once. Another gateway's payment, or a row that is not a payment, answers the empty shape. Called from `unbookedProviderRefunds()` itself, it throws a `LogicException` and the core reads the payment as unread. |
| `findLinkedRow(int $paymentId, string $type, string $reference): ?object` | **READ ONLY.** The refund or chargeback row of a payment that carries exactly this reference, byte for byte. A failed or cancelled row is never returned. |
| `paymentEnvironment(object $payment): ?string` | **READ ONLY.** The set the payment's attempt recorded (`SANDBOX` or `LIVE`), or `null` when none was recorded; then no follow-up action is offered. Throws an `InvalidArgumentException` when the recorded value is neither. |
| `renewalsAllowed(int $methodId): bool` (final, public) | **READ ONLY.** Whether the gateway can renew at all (`supportsRecurring()`) and the method's settings allow it (`methodAllowsRenewals()`). Another gateway's method, or none, is `false`. |
| `ShipmentsPlugin::costFromZones()` (final, public) | **READ ONLY.** The price, or `null` when this carrier cannot carry the cart (the nearest zone decides alone). The reason is then read with `refusal()`: a key of your carrier's language namespace, or Alfa's own `REFUSAL_NEEDS_PLACE` or `REFUSAL_NEEDS_POSTCODE` for a fact the shopper has not given yet. Alfa words those two (`COM_ALFA_SHIPMENT_NEEDS_PLACE`, `COM_ALFA_SHIPMENT_NEEDS_POSTCODE`): your carrier adds no key for them and passes the refusal on with `setUnavailable($this->refusal())`. Pass the postcode as `''` while the carrier's postcode field is unanswered, and `null` when your carrier reads none. |
| `ShipmentsPlugin::amountToCollect(object $order): Money` | **READ ONLY.** What the courier collects, never negative. See [The amount to collect](./shipment-plugins.md#the-amount-to-collect). |
| `ShipmentsPlugin::getShipment(int $id): ?object`, `getShipmentsByOrder(int $orderId): array` | **READ ONLY**, and not scoped: any carrier's rows. `getShipment()`: one shipment with its method's record on `->params` (`null` there when the method is gone or cannot be read), or `null`. `getShipmentsByOrder()`: every shipment of the order, whatever the carrier. |
| `ShipmentsPlugin::packageOf(array $products): array` (final, public) | **READ ONLY.** The parcel the products make: widths summed, height and depth the largest, weight summed by quantity. |
| `ShipmentsPlugin::refusal(): string` (final, public), `refusalKey(string $reason): string` (final) | **READ ONLY.** `refusal()`: the reason key the last pricing call recorded, for `setUnavailable()`. `refusalKey()`: the reason as a key of your carrier's language namespace. |

### The order and its addresses

| Call | What it guarantees |
|---|---|
| `getOrder(int $orderId): ?Order` | **READ ONLY.** The order as the `Order` reader the events hand over; `null` when the id names nothing. |
| `orderLanguage(Order\|int $order): string` | **READ ONLY.** The order's full language tag; the site's language when the order names none. |
| `returnUrl(object $order, array $extra = []): string` | **READ ONLY.** The absolute return address, always https. It carries only `&method=`; the rest is yours to add. |
| `webhookUrl(?string $environment = null): string` | **READ ONLY.** The absolute notification address, always https. Throws an `InvalidArgumentException` for an environment other than `sandbox` or `live`. |
| `PaymentsPlugin::getProcessPageUrl()`, `getCompletePageUrl()` (public) | **READ ONLY.** The addresses of the process page and of the completion page. |
| `PaymentsPlugin::authenticatedReturnFor(int $orderId)` (final, public) | **SESSION ONLY.** Points the visitor's session at the order and its mark. Idempotent; reads no table; outside a storefront request it sets nothing; an id below 1 throws an `InvalidArgumentException`. Call it from `onPaymentResponse` once the return is authenticated, for every authentic return whatever its result. |

### The plugin's own log

These come from the `Plugin` class, so every Alfa plugin has them.

| Call | What it guarantees |
|---|---|
| `log(array $data): int` | **ANSWERS.** Inserts a row of your log table (no `id`), or changes one (an existing `id`, only the columns passed). The row's id, or 0 when it could not be written. |
| `logForMethod(int $methodId, array $data): int` | **ANSWERS.** A row about a method and no order (`id_order` 0). The row's id, or 0. |
| `loadLogs(int $orderId, int $identifierId = 0, array $filters = [], bool $asArray = true): ?array` | **READ ONLY.** The order's rows, or `null` when the table does not exist. |
| `loadMethodLogs(int $methodId, array $filters = [], int $limit = 0): array` | **READ ONLY.** The method's own rows only, newest first; empty when there are none or the read failed. |
| `logCategory(): string` | **READ ONLY.** Your plugin's own Joomla Log category (`com_alfa.payments.<element>` for a payment plugin). |
| `getLogTableName(int $prefix = 2): string`, `getLogsSchema(): ?SimpleXMLElement` | **READ ONLY.** Your log table's name; your parsed `logs.xml`, or `null`. For the layout that shows the rows. |

## What an extension never calls

| Call | Use instead |
|---|---|
| `PaymentLedger`, `ShipmentLedger` and `InventoryService` directly | The base classes' builders and verbs. A direct ledger call names no writer and skips the checks the base classes make. |
| `PaymentLedger::bookedRefundable()` | `PaymentsPlugin::bookedRefundable()` |
| `PaymentLedger::amountToCollect()` | `ShipmentsPlugin::amountToCollect()` for a carrier, `PaymentsPlugin::amountToCollect()` for a gateway |
| `PaymentLedger::claimReference()` | `claimPendingAttempt()` or `claimPendingAttemptVerdict()` |
| `PaymentLedger::supersedeAttempt()`, `recordChargeback()`, `recordReversal()`, `findLinkedRow()`, `reportOutcome()`, `failRefundAttempt()` | The `PaymentsPlugin` methods of the same names |
| `OrderModel::getItem()` for an order on a staff page | `getOrder()`, the `Order` reader the events hand over. A field the reader lacks is a request to the Alfa Commerce project, not a reason to read the model. |
| `Order::row()` | Not for plugins. `EmailService::orderNumber()` takes the `Order` reader itself. |
| `TaskAttention` | Nothing: it is Alfa's own summary of failed and held tasks, not a way to write one. |
| `Tasks::single()` | Nothing: it runs Alfa's own handlers only, and throws an `InvalidArgumentException` for a name no handler has. |

## Hooks a gateway or carrier overrides

| Hook | Its shape | When Alfa calls it |
|---|---|---|
| `PaymentsPlugin::unbookedProviderRefunds(int $paymentId): array` (public) | The refunds your provider reported that the books do not hold, oldest first, one entry per refund: `reportId`, `id`, `amount` (`Money` or `null`), `providerAmount`, `providerCurrency`, `reportedOn`, `status`. The same signature in every gateway, with no default parameters. | Alfa asks the gateway of each payment row of an order when it decides `refundStartRefusal()` and `refundableNow()`, and for the order screen's notice. See [Telling Alfa about refunds it does not hold](./payment-plugin-money.md#telling-alfa-about-refunds-it-does-not-hold). |
| `PaymentsPlugin::methodAllowsRenewals(array $params): bool` | `false` by default | Read by `renewalsAllowed()` |
| `PaymentsPlugin::supportsRecurring(): bool`, `supportsOperatorPlacement(): bool` (public) | `false` by default. `supportsRecurring()` answering `true` commits the gateway to `onPaymentStoreReference` and `onPaymentChargeReference`. | Before a stored credential is charged, and before staff may place an order with the method |
| `ShipmentsPlugin::parcelRefusal(array $lines, array $limits): ?string` (public) | A refusal language key, or `null` when the carrier can physically take the cart. The default judges the carrier's configured maxima: the weight summed, each dimension per single unit, an unset maximum none. An override may call `parent::parcelRefusal()` first to keep the merchant's maxima. | By `costFromZones()`, before any price is read |
| `onCartView($event)`, `onItemView($event)` (abstract) | `void`. `onCartView` sets a layout, even an empty one. `onItemView` sets one only to add something below the method, which Alfa draws itself. | When the cart and an item page are drawn, for each active method |
| `PaymentsPlugin::onOrderProcessView($event)`, `onOrderCompleteView($event)` (abstract) | `void` | The process page (send the shopper to the provider, or show progress) and the completion page |
| `ShipmentsPlugin::onCalculateShippingCost(CalculateShippingCostEvent $event)` (abstract) | `void`. The answer is set on the event: `setShippingCost()` or `setShippingAmounts()`, or `setUnavailable($reasonKey)` with a key from `refusalKey()` or `$this->refusal()`. | For every method the checkout would list, many times a page (every listing, every change of a delivery field) and at placement, and when the cart's totals are worked out with the method chosen. `$event->getMethod()->isSelected()` is `true` only for the chosen one. Keep the handler free of side effects (no booking, no provider write, no row written), quick and repeatable: the same cart and destination give the same answer. |
| `onGetActions($event)`, `onExecuteAction($event)`, `onAdminOrderDelete($event)` on both base classes | `void`. By default: no buttons; "Unknown action" set as the event's error; the deletion allowed. `onAdminOrderDelete()` vetoes with `$event->setResult(false)`. | The order screen's action buttons and their clicks; before an order is deleted in the administrator |
| The other events addressed to your plugin alone: a gateway's `onCartViewAssets`, `onOrderBeforePlace`, `onOrderAfterPlace`, `onPaymentResponse`, `onPaymentWebhook`, `onPaymentCheckup`, `onPaymentStoreReference`, `onPaymentChargeReference` and `onClearData`; a carrier's `onCartViewAssets`, `onOrderBeforePlace`, `onOrderAfterPlace`, `onShipmentResponse`, `onShipmentWebhook` and `onClearData` | `void`, answered through the event. Each is handled by your public method of the event's name. | Each when its moment comes, addressed to your plugin alone. Alfa itself raises neither reference event: an extension's billing engine does. See [How events reach a plugin](../events/how-events-reach-a-plugin.md#addressed-to-one-plugin-targeted). |
