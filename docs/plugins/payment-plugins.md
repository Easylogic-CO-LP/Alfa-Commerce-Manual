---
sidebar_position: 2
title: Payment plugins
description: How to write a payment plugin for Alfa Commerce, what it must provide, its settings, staff actions and logging. The events, the money calls and a complete plugin have their own pages.
---

# Payment plugins

<CreatePluginButton type="payment" />

<AlfaVersion verified="2.3.0" />

**The pages of this guide:**

- **Payment plugins** (this page)
- [Payment plugin events](./payment-plugin-events.md)
- [Payments, refunds and webhooks](./payment-plugin-money.md)
- [A complete payment plugin](./payment-plugin-example.md)

A payment plugin connects Alfa Commerce to one way of paying: a bank transfer, cash on delivery, or a payment
provider's hosted page. This page is for the author of such a plugin, called a **gateway** below.

Read [How events reach a plugin](../events/how-events-reach-a-plugin.md) first. Words such as "method", "plugin of
record", "ledger" and "commit" are explained in the [Glossary](../reference/glossary.md).

## What it does

A payment plugin is a Joomla plugin in the group `alfa-payments` whose class extends the base class
`Alfa\Component\Alfa\Administrator\Plugin\PaymentsPlugin`. It does four jobs:

- it draws its part of the item page, the cart and the order pages;
- it records a payment for each order placed with one of its methods, and settles that payment when the money
  arrives;
- it answers its provider's return and callback;
- it gives staff the buttons to act on a payment (mark as paid, cancel, refund).

**Plugin and method.** The plugin is the code. A [method](../reference/glossary.md#plugins-and-events) is one
configured use of it, the record a shopper picks at checkout, with its own name and its own settings. One plugin can
serve several methods.

**The plugin of record.** When an order is placed, Alfa writes the plugin's element on the order, and on every
payment row the plugin writes. From then on Alfa asks that plugin, and only that plugin, about that order and that
row. It never asks another plugin instead, whatever the method's settings say later.

**The base class is the whole payment API.** A gateway records, reads and refunds payments through methods of
`PaymentsPlugin`. It never calls the ledger class `PaymentLedger` and never reads or writes the table
`#__alfa_order_payments` itself. A need the base class does not cover is a request to the Alfa Commerce project, not a
query of your own. Every call of the base class, and the few core classes a gateway calls by name, are listed with what
each guarantees on [Calling core from an extension](./calling-core.md).

**The country you send your provider.** When your provider asks for the buyer's delivery or billing country as an ISO
code, ask `PlaceTree::countryOf($placeId)` (`Alfa\Component\Alfa\Site\Service\Place\PlaceTree`) with the place the
address holds. It answers the country at the top of the place's chain, with its codes `code2` and `code3` in capitals,
or `null` for a place that does not exist; empty codes mean the address has no country. A gateway never reads
`#__alfa_places` itself.

## When it is used

Write a payment plugin when the shop needs a way of paying that the Standard plugin (`alfa-payments.standard`, the
offline method that ships with Alfa Commerce) does not cover. Use the Standard plugin as your model: it is in
`plugins/alfa-payments/standard`. Trust its code over its comments: some of its comments describe older wiring.

## What you must provide

| You provide | Where | Notes |
|---|---|---|
| A manifest | `<element>.xml` | `group="alfa-payments"`, a `<namespace>` for `src`, `<alfacore min="2.3" max="2.3"/>` (see [The Alfa Commerce lines your extension is built for](./overview.md#the-alfa-commerce-lines-your-extension-is-built-for)) |
| A service provider | `services/provider.php` | Builds your class from `PluginHelper::getPlugin('alfa-payments', '<element>')` |
| The plugin class | `src/Extension/<Name>.php` | Extends `PaymentsPlugin` |
| Layouts | `tmpl/*.php` | What your plugin draws |
| Method settings | `params/params.xml` | Optional. See [Method settings](#method-settings) |
| A log table description | `params/logs.xml` | Optional. See [Logging](#logging) |
| Language files | `language/en-GB/plg_alfa-payments_<element>.ini` and `.sys.ini` | See [Language](#language) |

Your class **must** write these four methods, because the base classes declare them abstract:

```php
public function onItemView($event): void;
public function onCartView($event): void;
public function onOrderProcessView($event): void;
public function onOrderCompleteView($event): void;
```

Alfa draws the method on the item page itself: its image, its title and its description. `onItemView` sets a layout
only to add something below them; with nothing to add, it sets none. `onCartView` always sets a layout, even an empty
one.

Every other event is optional. You take part in an event by writing a public method with the event's name. Nothing
is listed in `getSubscribedEvents()`: all payment events are addressed to one plugin (targeted), and Alfa calls the
public method of your class that has the event's name.

The base class's `getSubscribedEvents()` returns an empty list. If your plugin needs a Joomla
event of its own, override it and merge with `parent::getSubscribedEvents()`.

:::warning A written method is a live endpoint
Because writing the method is the declaration, a method you add "for later" is called. The Standard plugin has no
`onPaymentWebhook` for that reason: with it, the shop would accept callbacks for a method that has no provider.
:::

:::warning Access must be Public
A provider calls your plugin as a guest. Set the plugin's Access (Extensions: Plugins) to Public, or callbacks are
answered "try again later".
:::

## What happens next: the life of a payment

```mermaid
sequenceDiagram
    autonumber
    actor Shopper
    participant Alfa as Alfa Commerce
    participant P as Your plugin
    participant Provider as The provider
    Shopper->>Alfa: Opens the cart
    Alfa->>P: onCartView, then onCartViewAssets
    Shopper->>Alfa: Places the order
    Alfa->>P: onOrderBeforePlace (you may refuse)
    Alfa->>Alfa: Saves the order
    Note over Alfa: The save is final here
    Alfa->>P: onOrderAfterPlace (record a pending payment)
    Alfa->>P: onOrderProcessView (send the shopper to the provider)
    Shopper->>Provider: Pays on the provider's page
    Provider->>Alfa: Calls back, server to server
    Alfa->>P: onPaymentWebhook (check it, settle the payment)
    Provider->>Alfa: Sends the shopper back
    Alfa->>P: onPaymentResponse, then onOrderCompleteView
```

What the picture means:

- **Before step 5 nothing is saved.** Refusing in `onOrderBeforePlace` costs one failed checkout and leaves no order.
- **After step 5 the order exists for good.** `onOrderAfterPlace` cannot undo it. If your plugin fails there, the
  order stays, without a payment row.
- **Steps 9 and 11 can arrive in either order**, and each can arrive twice. The callback is the proof of payment. The
  shopper's return only decides which page the shopper sees.
- **An offline method stops after step 7.** It sets nothing in `onOrderProcessView`, the shopper goes to the
  completed page, and staff settle the payment later with a button.
- **Step 7 can come again for the same order.** While an order still owes money, its confirmation page, the
  customer's order e-mail and the payment link staff send from the order screen show Pay now, which leads the buyer
  back to the process page of the same order; nothing is placed again. See [Paying an order again](#paying-an-order-again).
- **Settling is its own save.** When your plugin settles a payment, Alfa writes the payment row and makes that save
  final. Only then, and after Alfa's locks are released, does the order move to the status the method's settings name
  (see [The order's status](./payment-plugin-money.md#the-orders-status)).

The other events are not part of this timeline: `onItemView` (the item page), `onGetActions` and `onExecuteAction`
(staff), `onAdminOrderDelete`, `onPaymentCheckup` (the method's settings page), `onClearData` (Tools), the stored
credential events, and `onAlfaDisputeRefresh` and `onAlfaDisputeAccept` (staff's buttons on a dispute's card).

### Paying an order again

Pay now runs your `onOrderProcessView` again for an order that already exists and still owes money. The order may hold
an earlier attempt of yours: one the buyer abandoned, one your provider declined, or one that expired. The contract
for this visit:

| Your process view | What it must do |
|---|---|
| Finds nothing owed (`amountToCollect()` is 0) | Set nothing: the buyer goes to the completed page. |
| Finds a payment of yours authorised, or one your provider is still processing | Open nothing new: show the order's state, as on a first visit. |
| Finds your own pending attempt | Close it with `supersedeAttemptVerdict()` (or claim the reference-less row your placement wrote), then open a new one. |
| Opens the attempt | Write the pending row first (`$this->payment($order)->pending()->transactionId($minted)->saveWithVerdict()`), for `amountToCollect()`, then create the provider's payment page for exactly that row, then redirect. |

**A new attempt is the contract.** A process view that only sends the buyer back to a provider page created at
placement (in `onOrderAfterPlace`) does not meet it: once that page has expired, or its attempt was closed failed or
cancelled, the buyer has nothing to pay on. Create the provider's page in `onOrderProcessView`, for each visit, and
let `onOrderAfterPlace` write the pending row only.

**Declare it with `supportsPayAgain()`.** Core cannot look inside your process view, so it asks your plugin: override
`public function supportsPayAgain(): bool` and return `true` only when your `onOrderProcessView` meets the contract
above. The base class answers `false`, and a gateway that answers `false`, or fails while answering, gets no Pay now on
its orders' confirmation page and e-mail and no Send payment link on the order screen. An offline method, which takes
no payment on the process page, keeps the default; so does core's Standard method.

```php
public function supportsPayAgain(): bool
{
    return true;
}
```

Core offers Pay now, and lets staff send the payment link, only while the order is there and not in the trash, still
owes money (`amountToCollect()`), is neither in the cancelled nor in the completed family of statuses, holds no payment
authorised at a provider, no refund that is not settled and no dispute the bank has not decided, its payment method is
published, and its gateway is available and answers `supportsPayAgain()` with `true`. This is checked again on every use of the link and just
before your process view is asked.

Before you close an earlier attempt, make sure your provider can no longer take money on it: expire or cancel its page
there, or ask the provider first and settle the attempt when it was paid.

### The life of a refund through a provider

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    participant Alfa as Alfa Commerce
    participant P as Your plugin
    participant Provider as The provider
    Staff->>Alfa: Presses Refund on a payment
    Alfa->>P: onExecuteAction
    P->>Alfa: reserveRefund()
    Alfa->>Alfa: Checks the books and writes a reservation
    Note over Alfa: The save is final here
    P->>Provider: Asks for the refund, with the reservation's amount and key
    Provider->>P: Answers
    P->>Alfa: settleRefund(), holdRefund() or releaseRefund()
    Alfa->>Alfa: Books the answer
    Note over Alfa: The save is final here
    Alfa->>Staff: Shows the result
```

The reservation (step 4) is saved before the provider is asked, so a second click, or a second member of staff,
cannot start the same refund twice. The provider is called with no lock and no database transaction open. The verbs
are explained under [Refunds](./payment-plugin-money.md#refunds).

When the provider reports that this attempt failed and you will try
again for the same request, step 7 is `failRefundAttempt()`. The reservation keeps its amount and gets a new key,
and you ask the provider again with that key and that amount (steps 5 to 7 again). Nothing in the books moves, so
the retry is never reserved twice.

## Method settings

**Where they live.** Each method is a row of the table `#__alfa_payments`. Its settings are stored as JSON in the
row's `params` column. The fields come from your plugin's `params/params.xml`, inside a group named
`paymentsparams`. Only that group is saved as the method's settings:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form>
	<fields name="paymentsparams" addfieldprefix="Alfa\Component\Alfa\Administrator\Field">
		<fieldset name="paymentsparams" label="PLG_ALFA_PAYMENTS_OFFLINE_FIELDSET_SETTINGS">
			<field
					name="status_on_completed"
					type="model"
					model="orderstatuses"
					column_value="id"
					column_text="name"
					orderBy="ordering"
					label="PLG_ALFA_PAYMENTS_OFFLINE_STATUS_ON_COMPLETED_LABEL"
			>
				<option value="">PLG_ALFA_PAYMENTS_OFFLINE_STATUS_NO_CHANGE</option>
			</field>
		</fieldset>
	</fields>
</form>
```

**How you read them.** The settings reach you in three shapes. In all three they are already a plain array.

| Where you are | What you hold | How you read a setting |
|---|---|---|
| `onCartView`, `onCartViewAssets` | A `Method` object: `$event->getMethod()` in `onCartView`, one for each of your methods in `$event->getMethods()` in `onCartViewAssets` | `$method->param('api_key', '')`, or `$method->params()` for the array |
| `onItemView`, `onOrderProcessView`, `onOrderCompleteView`, and anywhere through `getPaymentMethod()` | The method record | `$method->params['api_key'] ?? ''` |
| `onExecuteAction` | The payment row, whose `params` is the method record | `$payment->params->params['api_key'] ?? ''` |

The `Method` object also has `id()`, `type()` (the plugin's element), `name()`, `description()`, `isSelected()`, and
`get('column', $default)` for any other column of the record.

**How `getPaymentMethod()` finds the method.**

`protected function getPaymentMethod(int $orderId = 0, int $methodId = 0): ?object`

| You ask | You get |
|---|---|
| With a method id: `getPaymentMethod($orderId, (int) $payment->id_payment_method)` | Exactly that method, while it is one of your plugin's. Otherwise `null`. |
| By order alone: `getPaymentMethod($orderId)` | The order's own method, while the order records your plugin and the method is still your plugin's. Otherwise `null`. |

There is no fallback. It never answers another method of your plugin, because another method is
another set of credentials. An order paid through another plugin gives `null`. Treat `null` as "this is not mine"
and stop.

Pass the method id whenever a payment row names one: on an order with several attempts, the row is the only record
of which method took that money. Asking twice in one request costs nothing: the answer is kept.

`protected function ownMethods(bool $publishedOnly = true): array` lists
your plugin's own methods, keyed by id in ascending order, each the record `getPaymentMethod()` answers. Use it for
what concerns every method rather than one order's, such as a key your provider registers once per account. With
`false` it lists every method of your plugin, whatever its state. Never read the methods table yourself.

```php
foreach ($this->ownMethods() as $methodId => $method) {
    $key = (string) ($method->params['webhook_key'] ?? '');
}
```

### Sandbox and live

Alfa has one contract for a method with a test set and a live set of credentials, in the class
`Alfa\Component\Alfa\Administrator\Service\Order\PaymentEnvironment`:

- Store both sets side by side in the method's settings, as `sandbox_<key>` and `live_<key>`.
- A switch named `is_production` chooses the set a **new** payment uses. `PaymentEnvironment::active($params)`
  returns `PaymentEnvironment::SANDBOX` or `PaymentEnvironment::LIVE`. Anything but exactly 1 is sandbox.
- `PaymentEnvironment::credentials($params, $environment, ['api_key', 'secret'])` returns one set, without the
  prefix.
- Record the set on each attempt when you create it, under the key `self::PAYLOAD_ENVIRONMENT`:
  `->pluginData([self::PAYLOAD_ENVIRONMENT => $environment])`.
- Everything that follows an existing payment (a refund, a callback) uses the set that payment recorded, never the
  switch. `$this->paymentEnvironment($payment)` returns it, or `null` when none was recorded.
- `PaymentEnvironment::fromAddress($input)` reads the set a webhook address names.

The Standard plugin has no credentials and does not use this.

## Staff actions

Two events give staff buttons on a payment row: `onGetActions` registers them and `onExecuteAction` runs the one
pressed.

```php
public function onGetActions($event): void
{
    $payment = $event->getPayment();

    if (($payment->transaction_status ?? '') === self::STATUS_PENDING) {
        $event->add('mark_paid', Text::_('PLG_ALFA_PAYMENTS_OFFLINE_MARK_PAID'))
            ->mutating()
            ->icon('checkmark')->css('btn-success')
            ->confirm(Text::_('PLG_ALFA_PAYMENTS_OFFLINE_CONFIRM_MARK_PAID'))
            ->priority(200);
    }
}
```

`$event->add()` returns a `PluginAction` (`administrator/src/Plugin/PluginAction.php`):

| Call | Meaning |
|---|---|
| `icon(string)`, `css(string)`, `tooltip(string)` | How the button looks. Defaults: icon `cog`, class `btn-primary`. |
| `confirm(string $message)` | Ask before running |
| `priority(int)` | Higher is drawn first. Default 100. |
| `mutating()` | The action changes something. This is the default for every action. |
| `readOnly()` | The action writes nothing whatever the request carries (details, logs). Only such an action may be opened by a plain link. |
| `startsRefund()` | The action starts a new refund. Alfa hides it, and refuses it and its form's `_do` step, while the refund block holds. |
| `data(array $fields)` | Fields posted with the action, such as the figure the confirmation showed |
| `disabled()` | Takes the action off the list: no button is drawn and the action cannot be run |
| `meta(string $key, mixed $value)`, `buttonLayout(string $layout)` | Attach your own data, use your own button layout (a layout of your `tmpl` folder; the default is `action_button`) |

An action carries no window layout, title or size of its own: its window shows the layout `onExecuteAction` sets with
`setLayout()`, under the action's label.

What Alfa does for you before `onExecuteAction` runs:

- An action that changes something must arrive as a POST with a one-time key. A second submit of the same key is
  refused, so a double click runs once.
- The action must still be on the list your `onGetActions` gives for the row as it is now. If the row changed
  meanwhile, the click is refused.
- The action runs on the plugin recorded on the row, or not at all.

In `onExecuteAction`, refuse a row that is not yours before you read or write anything, as the Standard plugin does:
`(string) ($payment->payment_method_type ?? '') !== $this->_name`.

A form on the action page is two action ids. The button's own id draws the form (`setLayout()`). The form submits
to the same id with the suffix `_do`, which does the work. The `_do` id is never registered as a button: Alfa admits
it exactly when the button that opens it is on offer. The Standard plugin's partial refund works this way
(`refund_partial` and `refund_partial_do`).

## Logging

A plugin has two logs of its own, both from the base class.

**The text log**, for staff who run the server. The base class registers it when your plugin starts:

| | Value for `alfa-payments` / `mygateway` |
|---|---|
| Category | `com_alfa.payments.mygateway` |
| File | `alfa_payments_mygateway.php` in Joomla's log folder |

```php
use Joomla\CMS\Log\Log;

Log::add('Order #' . $order->id() . ': the provider refused the charge.', Log::WARNING, $this->logCategory());
```

Always pass `$this->logCategory()`. A category typed by hand, or shared with another plugin, sends your lines to the
wrong file or to none. `settleAttempt()` writes its CRITICAL "the money moved and the books did not" line here.

An exception's text goes into a line, a staff message or a log row only through `ErrorText::of()`
(`Alfa\Component\Alfa\Administrator\Helper\ErrorText`), never as `$e->getMessage()`:

```php
} catch (\Throwable $e) {
    Log::add('Order #' . $orderId . ': the refund could not be sent: ' . ErrorText::of($e), Log::ERROR, $this->logCategory());
}
```

A database driver's text names the site's database user, host and schema, and a transport's text can carry a
credential. `ErrorText::of(Throwable|string $failure): string` applies one rule, the one Alfa's own ledgers and base
classes use: the site's database user, host and schema (each where it stands as a word of its own) become `<user>`,
`<host>` and `<schema>`; the database password, the site's secret and the mail password become `<secret>` wherever
they occur; the site's folder is taken out of a path (a file of the site reads from the site's root, the root itself
reads `.`); any `'name'@'host'` account becomes `'<user>'@'<host>'`; the user and password of an address
(`https://user:password@host`) become `<user>:<secret>`; a Bearer or Basic credential, and a value of four characters
or more given to `password`, `passwd`, `pwd`, `secret`, `client_secret`, `api_key`, `apikey`, `access_token`,
`refresh_token` or `token` (as `name=value` or `name: value`), become `<secret>`; line breaks and other control
characters become spaces; the text is cut at 1,000 characters (`ErrorText::LIMIT`) and ends with `...` when cut.
Everything else is kept as it is. It never throws.

**The log table**, for the merchant, shown by your own "Logs" action. Describe its columns in `params/logs.xml`,
inside `<fields name="paymentslogs">` and one `<fieldset>` within it, as the Standard plugin does (Alfa reads the
fields of the first fieldset). Give each field a `mysql_type`; without one the column is `VARCHAR(255)`. Alfa creates
the table
`#__alfa_payments_<element>_logs` on first use, with `id`, `id_order`, `id_order_payment` and `id_payment_method`
of its own.

| Verb | What it does |
|---|---|
| `log(array $data): int` | Writes a row. `id_order` is required. With an `id` it changes that row, and only the columns you pass. Returns the row's id, or 0 when nothing was written. |
| `loadLogs(int $orderId, int $identifierId = 0, array $filters = [], bool $asArray = true): ?array` | Rows of an order, or of one payment of it |
| `deleteLog(int $orderId, int $identifierId = 0): void` | Deletes them |
| `logForMethod(int $methodId, array $data): int`, `loadMethodLogs(int $methodId, array $filters = [], int $limit = 0): array` | Rows about a method and no order, such as a connection check |
| `getLogsSchema(): ?SimpleXMLElement` | Your `logs.xml`, for a layout that draws the rows |

The table is never created or changed while a database transaction is open. A log write that needs a missing table
or column inside one is reported and skipped; the next write outside a transaction completes the table. A failed log
write is never shown to a shopper.

**Joomla's User Actions Log**. For an act a shop owner audits, such as a
refund started, call `recordActionLog()` with a sentence of your language file that names the facts in braces:

```php
$this->recordActionLog('PLG_ALFA_PAYMENTS_MYGATEWAY_LOG_REFUND_STARTED', ['title' => '#' . $orderId, 'amount' => $amount->format()], $orderId);
```

```ini
PLG_ALFA_PAYMENTS_MYGATEWAY_LOG_REFUND_STARTED="User <a href=\"{accountlink}\">{username}</a> started a refund of {amount} on order {title}"
```

`recordActionLog(string $languageKey, array $facts = [], int $itemId = 0): bool` writes one row filed under your
plugin (`plg_alfa-payments_mygateway`), so the User Actions Log screen reads the sentence from your language file.
The facts are plain values by name. `userid`, `username` and `accountlink` are always those of the user who acted
(user 0 when nobody did, as for a provider's notification), whatever your facts say. It answers `true` when the row
is written and `false` otherwise; a failure is logged, never thrown. A row written this way is never deleted.

**An act that may still fail after its row is written** (a staff close that the books may refuse) writes its row
first with `recordActionLogPending()`, then takes it back with `withdrawActionLog()` when the act did not stand. A
staff close never stands without its trail, and a trail never stays for a close that was not made:

```php
$rowId = $this->recordActionLogPending('PLG_ALFA_PAYMENTS_MYGATEWAY_LOG_CAPTURE_CLOSED', ['title' => '#' . $orderId], $orderId);
$verdict = $this->settleAttemptVerdict($write, $orderId, $providerId);

if ($verdict->kind !== self::VERDICT_WRITTEN && $rowId !== null && !$this->withdrawActionLog($rowId)) {
    // tell staff: the close was not made, and its audit line could not be withdrawn: entry #$rowId stands
}
```

| Call | What it does |
|---|---|
| `recordActionLogPending(string $languageKey, array $facts = [], int $itemId = 0): ?int` | Writes the row as `recordActionLog()` writes it, and answers its id; `null` when it is not written (the reason logged, never thrown) |
| `withdrawActionLog(int $rowId): bool` | Deletes that row: `true` when it is gone. Only a row your plugin wrote with `recordActionLogPending()` in the same request; any other row (another plugin's, one written by `recordActionLog()`, one of an earlier request, one already withdrawn) answers `false` and nothing is deleted. `false` also when the delete failed (logged): the row then stands, and you tell staff so. |

A pending row not withdrawn by the end of the request stays, as every other row. Nothing else in Alfa Commerce
deletes a row of the User Actions Log.

## Language

Your plugin carries its own texts and loads them.

- The files are `plg_alfa-payments_<element>.ini` and `plg_alfa-payments_<element>.sys.ini`. The file name keeps
  the hyphen of the group.
- The keys drop the hyphen: `PLG_ALFA_PAYMENTS_<ELEMENT>_...`.
- Packaged under `language/en-GB/` in your zip, they are installed to `administrator/language/en-GB/`.
- The base class sets `$autoloadLanguage = true`, so your texts are loaded whenever your plugin is started, on the
  storefront and in the administrator. Alfa also loads your file for the method's settings form.
- Bodies you answer to a provider (`setResponseBody()`) are plain machine text, never translated.
- The `COM_ALFA_` keys are core's: core keeps none for a plugin's screens, and one a plugin borrows can change or go
  with any update of Alfa Commerce. Every string your plugin shows is in its own files, under its own keys.

## What can go wrong

| What you see | The usual cause |
|---|---|
| The plugin does not load at all after you added a method | You typed the `$event` parameter of a method the base class declares untyped, or you wrote a private method with the name of a base class method |
| The provider's callbacks are answered 503 | The plugin is disabled, or its Access is not Public |
| The provider's callbacks are answered 404 | Your class has no `onPaymentWebhook`, the element in the address is wrong, or the plugin is disabled and no method of the shop uses it |
| The provider's check of the webhook address fails, on a multilingual site with friendly addresses or with URL rewriting and "Remove index.php" on | The provider was given the plain `index.php` address and checks it with a GET, which Joomla redirects. Give it the address the setup checkup prints. A POST to the plain address reaches your plugin. |
| A provider that checks the address with a GET gets a redirect | "System - Alfa Commerce Sync" is disabled, or its Access is not Public. Enable it with its Access set to Public. A POST reaches your plugin either way. See [Return and webhook addresses](./payment-plugin-money.md#return-and-webhook-addresses). |
| The payment is completed but the order did not move | The row was created as completed instead of changed to completed, or the method has no `status_on_completed` setting |
| `getPaymentMethod()` returns `null` | The order records another plugin, or the method id you passed is not one of your plugin's. There is no fallback. |
| A setting is always empty in `onCartView` | You read `$method->params[...]`. There the method is an object: use `->param('key')`. |
| A setting you added is never saved | Its field is outside `<fields name="paymentsparams">` |
| `$order->id` is empty | The order is an `Order` object: use `$order->id()` |
| `onPaymentResponse` or `onPaymentWebhook` stops with "Call to undefined method" on `getOrder()` | These two events carry no order and have no `getOrder()`. Find the order from your provider's data. |
| A refund verb answers `OUTCOME_FAILED` and nothing is written | It was called inside a database transaction |
| A refund button disappeared from a completed payment | The refund block holds: a provider reported a refund the books do not hold. Staff resolve that report first. |
| `save()`, `settleAttempt()` or `deletePayment()` refuses a row | The row was written by another plugin. A plugin changes only its own rows. |
| Your cart panel works once and then stops | Its script was declared in the `onCartView` layout. Declare it in `onCartViewAssets`. |
| A staff action is refused as "already submitted" | The same one-time key was posted twice. The first submit ran. |

## Not documented yet

- **Charging a saved card or mandate: what the shopper sees.** The gateway's side (`onPaymentStoreReference`,
  `onPaymentChargeReference`, `onPaymentChargeQuery`, `supportsRecurring()`, `renewalsAllowed()` and
  `StoredCredentialIntentEvent`) is on [Payment plugin events](./payment-plugin-events.md#onpaymentstorereference-and-onpaymentchargereference).
  Alfa Commerce sends none of these events itself; when they fire, and what the shopper sees, is the extension's
  that sends them (a subscriptions extension).
- **The action page.** How a layout set in `onExecuteAction` is shown, and the script helper a form uses to submit
  its `_do` step. Every button opens the action page, its title is the button's label, and the layout drawn is the one
  `onExecuteAction` sets with `setLayout()`.
- **Locks for a capture.** `OrderMoneyLock` and when a gateway that captures an authorization should hold it.
- **Deposits and instalments**: several payment rows for one order, written by one plugin.
- **The texts shoppers and staff see** when a plugin is unavailable or an order is refused. This page describes
  what Alfa does, not the exact wording.
- **Carriers.** Shipping plugins have the same return and webhook channels. See
  [Shipping plugins](./shipment-plugins.md).
