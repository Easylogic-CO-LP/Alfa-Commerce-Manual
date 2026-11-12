---
sidebar_position: 3
title: Orders
description: The services that write an order, change its status and read it in 2.2.0, with what each guarantees, what it refuses and which of them an extension may call.
---

# Orders

<AlfaVersion verified="2.2.0" />

An order is written by one class, changes status through one class, and is handed to plugins as one read-only
object. This page describes those three, the helpers around them, and the two locks.

The events an order announces are on [Order and cart events](../events/order-and-cart-events.md). Payments and
parcels are on [Payments and shipments](./payments-and-shipments.md).

## What it does

| Class | In plain words | For extensions? |
|---|---|---|
| `OrderCreator` (`administrator/src/Service/Order/OrderCreator.php`) | Writes a new order and its lines from plain data, without a cart | **Yes, with limits.** The code's comments expect a plugin as a caller. No extension that ships with Alfa calls it. See [Who may call it](#who-may-call-it). |
| `Transition` (`administrator/src/Service/Order/Transition.php`) | The single way an order changes status | **Yes** for a payment plugin, through `orderTransition()`. For a feature plugin the class comment expects the call and nothing shipped shows it. For a shipping plugin the code does not settle it. See [Transition](#transition). |
| `Order` (`site/src/Service/Order/Order.php`) | The order as a plugin reads it | **Read only.** Events hand it to you. |
| `OrderStatusHelper` (`administrator/src/Helper/OrderStatusHelper.php`) | Answers "which status is the first one, which are cancelled, which are completed" | **Read only**, called directly |
| `OrderTotalHelper` (`administrator/src/Helper/OrderTotalHelper.php`) | The one formula of an order's total | Core's own. Described so that you can read a total correctly. |
| `OrderHelper` (`administrator/src/Helper/OrderHelper.php`) | Reads an order's lines for the order screen | Core's own |
| `OrderHistoryHelper` (`administrator/src/Helper/OrderHistoryHelper.php`) | Turns a stored History entry into the line staff read | Core's own |
| `StockPolicy` (`administrator/src/Service/Order/StockPolicy.php`) | What an order status asks of the stock | Core's own. Described so that you can follow the stock events. |
| `OrderMoneyLock`, `ShipmentBookingLock` (`administrator/src/Service/Order/`) | One capture at a time per order, one booking at a time per shipment | Their class comments address a payment plugin and a shipping plugin. Nothing in 2.2.0 calls them, so there is no shipped example. See [The two locks](#the-two-locks). |

## When it is used

- Your extension creates orders that do not come from a cart, for example a renewal.
- Your extension must move an order to another status.
- Your plugin is handed an order in an event and you want to know what you can read.
- You show or compare an order's total and want the same figure as Alfa.

## OrderCreator

### What it does

`OrderCreator::create()` writes one order row, its lines, sets the stock aside, and writes the "order created"
entry of the order's History. It reads no cart, no request and no catalogue price: every figure is in the data you
pass.

The checkout itself uses it: [`OrderPlacement`](./cart-and-checkout.md#placing-an-order) builds the data from the
cart and calls `create()`. The back office uses it for a manual order.

It is deliberately narrow. It sends **no e-mail**, announces **no event**, and writes **no payment row and no
parcel**. `onAlfaOrderPlaced` is announced by the checkout, not by `OrderCreator`.

### When it is used

When an order has to exist and there is no shopper at a checkout. The class comment names renewals and manual
orders next to the checkout.

### Who may call it

| | |
|---|---|
| **What the code says** | The class comment calls it the writer "for every non-checkout order source" and names renewals. A comment inside `create()` speaks of a plugin that supplies the `source`, and the comment of `clampTaxName()` calls that method "a helper for a plugin". So the code expects a plugin as a caller. |
| **What the code does not give you** | No plugin or module that ships with Alfa Commerce calls `create()`: the two callers in 2.2.0 are the checkout and the back office. There is no shipped example and no base class method that reaches it. |
| **No permission is checked** | `create()` checks no user right. Alfa's own callers check the person before they call. Your code must do the same. |
| **It is not a complete order** | It writes no payment row and no parcel. How an extension that is not the order's payment or shipping plugin adds them is not settled by the code. See [Not documented yet](#not-documented-yet). |

### What you must provide

```php
public static function create(array $draft, bool $manageTransaction = true): object
```

The **draft** is a plain array. Keys marked required must be there; the others have the default shown.

| Key | Meaning | Default |
|---|---|---|
| `source` | **Required.** Where the order comes from: `storefront`, `admin`, `renewal` or `api`. It is stored on the order and in its History. Only its presence is checked. | |
| `lines` | **Required**, at least one line, unless `allow_empty` is true | |
| `id_address_delivery` | The id of an existing address row (`#__alfa_user_info`). The method's comment marks it required, but `create()` does not check it: without it the order is stored with no delivery address. | none |
| `id_address_invoice` | The same for the invoice address | none |
| `id_user` | The customer's user id | 0, a guest |
| `id_order_status` | The status the order starts in | The shop's first status |
| `id_currency` | The currency | The shop's default currency |
| `conversion_rate` | | 1.0 |
| `id_payment_method`, `id_shipment_method` | The methods | 0, none |
| `payment_method_name`, `shipment_method_name` | The methods' names as kept on the order | empty |
| `id_language` | The language the customer is addressed in | 1 |
| `customer_note`, `note` | Notes | empty |
| `ip_address` | | The current request's address |
| `created_by` | Who created it | The current user |
| `deduct_stock` | Whether the order claims stock | `true` |
| `allow_empty` | Allows an order without lines | `false` |

Each line:

| Key | Meaning | Default |
|---|---|---|
| `id_item` | **Required.** The item | |
| `quantity` | **Required**, above 0 | |
| `unit_price_tax_excl`, `unit_price_tax_incl` | **Required.** The unit price without and with tax | |
| `id_combination` | The combination | none |
| `name` | The name kept on the line | Taken from the catalogue |
| `sku`, `gtin`, `mpn`, `weight` | | empty, 0 |
| `total_price_tax_excl`, `total_price_tax_incl` | The line totals | Unit price times quantity |
| `original_product_price` | The price before discounts | `unit_price_tax_excl` |
| `tax_rate`, `tax_name` | The line's tax | 0, empty |
| `discount_percent`, `discount_amount_tax_excl`, `discount_amount_tax_incl` | The line's discount | 0 |
| `id_shipment_method` | A method for this line | The order's |

A minimal call. Every key was checked against `create()` in 2.2.0:

```php
use Alfa\Component\Alfa\Administrator\Service\Order\OrderCreator;

$created = OrderCreator::create(draft: [
    'source'              => 'api',
    'id_user'             => $customerId,
    'id_address_delivery' => $addressId,      // an existing #__alfa_user_info row
    'lines'               => [
        [
            'id_item'             => $itemId,
            'quantity'            => 2,
            'unit_price_tax_excl' => 10.00,
            'unit_price_tax_incl' => 12.40,
            'tax_rate'            => 24.0,
        ],
    ],
]);

$orderId  = $created->orderId;
$statusId = $created->statusId;                // where the order landed, see below
```

`$manageTransaction`: leave it `true` and `create()` saves as one unit of its own. Pass `false` only when your code
has already opened a database transaction and will make the save final itself.

### What happens next

`create()` returns an object with `orderId`, `lineIds` (in the order of your lines) and `statusId`.

What it guarantees:

| | |
|---|---|
| **All or nothing** | The order, its lines, the stock claim and the History entry are saved together. If one fails, none is kept. |
| **The stock follows the status** | The order claims stock as its starting status asks: nothing for a cancelled status, a reservation, or the goods themselves. See [StockPolicy](#stockpolicy). A claim that fails makes the whole creation fail. |
| **A status that does not exist does not lose the order** | If `id_order_status` names a status that does not exist or is unpublished, the order lands in the shop's first status and staff get a notice. Read `statusId` to see where it landed. |
| **Prices are kept as given** | `create()` never prices a line again. |

After it returns, the rest is yours: a payment row and a parcel are written by the payment and shipping plugins of
the order's methods, a status change goes through [`Transition`](#transition).

### What can go wrong

`create()` refuses by throwing a `RuntimeException`. When it owns the transaction, everything is undone first.

| It refuses | Message starts with |
|---|---|
| A draft without `source` | `OrderCreator: a draft must name its source` |
| `lines` that is not an array | `OrderCreator: lines must be an array` |
| No lines, without `allow_empty` | `OrderCreator: a draft needs at least one line` |
| A line without `id_item` or with a quantity of 0 or less | `OrderCreator: line N needs id_item and a positive quantity` |
| A line without both unit prices | `OrderCreator: line N needs explicit unit prices` |
| A starting status that requires the order to be paid, unless that status allows an unpaid exception | `OrderCreator: status N requires payment` |
| A shop with no order status at all | `OrderCreator: no target status and no is_initial status exists` |
| Any write that fails, the stock claim included | `OrderCreator: order creation failed:` |

Two more public methods:

| Method | What it does |
|---|---|
| `mayCreateInto(int $statusId): bool` | Whether a new order may start in this status. `false` for a status that requires payment and allows no unpaid exception. Ask it before you offer a status as a starting status. |
| `clampTaxName(string $name, string $context): string` | Shortens a tax name to 255 characters (`OrderCreator::TAX_NAME_MAX`) and logs when it had to. For a plugin that keeps a tax name in a column of its own of that width. Core does not call it in 2.2.0: an order line keeps the tax name whole. |

## Transition

### What it does

`Transition` is the single way an order changes status. Staff, a payment, a parcel and a plugin all end here, so the
follow-up work is the same whoever asked: the stock moves, download access is granted or removed, documents are
issued, the status e-mail is sent and `onOrderStatusChange` is announced.

The picture of a status change is on [Event flows](../events/flows.md#changing-an-orders-status). The listener's
side is on [Order and cart events](../events/order-and-cart-events.md#onorderstatuschange).

### When it is used

| You are | Use |
|---|---|
| A payment or shipping plugin, and the move follows a payment or parcel status | Nothing. The method's settings `status_on_<status>` move the order. See [The order's status](../plugins/payment-plugins.md#the-orders-status) and [A parcel's status can move the order](../plugins/shipment-plugins.md#a-parcels-status-can-move-the-order). |
| A payment plugin, for a moment the settings cannot express | `$this->orderTransition($orderId)->to($statusId)->save()` |
| A feature plugin | `Transition::for($orderId)->to($statusId)->byPlugin($element)->save()`. The class comment counts a plugin that is not a payment plugin among its callers. No plugin that ships with Alfa makes this call, and no base class offers it, so there is no shipped example. |
| A shipping plugin, for a moment the settings cannot express | The code does not settle it. `ShipmentsPlugin` has no `orderTransition()`. This manual documents only the settings for a shipping plugin. |

`Transition` checks no user right. Alfa's own callers check the person before they call. A plugin that moves an
order because a person asked must check that person's rights itself.

Never write the column `id_order_status` yourself. The status would change and none of the follow-up work would
happen.

### What you must provide

```php
use Alfa\Component\Alfa\Administrator\Service\Order\Transition;

$transition = Transition::for($orderId)
    ->to($statusId)
    ->byPlugin('thanks')                       // your plugin's element
    ->note('Loyalty tier reached');

$moved = $transition->save();

if (!$moved && $transition->refusedBusy()) {
    // Another request held the order. Asking again later may move it.
}
```

The calls you chain, each returning the same object:

| Call | Meaning |
|---|---|
| `Transition::for(int $orderId): self` | Starts a change for an order |
| `to(int $statusId)` | The status to move to. Required. |
| `byPlugin(string $pluginName)` | Records your plugin as the one that moved the order. Pass the plugin's element. |
| `byUser(int $userId)` | Records a user instead. Without either, the current user is recorded. |
| `note(string $note)` | A sentence for the order's History |
| `silent()` | Sends no status e-mail |
| `expectStatus(int $statusId)` | Since 2.2.0. Moves the order only if it is still in this status. Use it when your move was decided earlier and the order may have moved since. |
| `force()` | Allows the order to leave a cancelled status. That is a decision for a member of staff. Automatic code must never call it. |
| `from(int $statusId)` | For Alfa's own order screen, which writes the status itself first. Do not call it. |
| `save(): bool` | Makes the change. `true` when the order moved. |

### What happens next

`save()` does this, in this order, with the order's row held so that no other request can change it meanwhile:

1. Reads the order's status as it is now.
2. Checks that the target status exists, is published, and that the order may enter it.
3. Writes the new status.
4. Records, in the same save, the History entry and the follow-up work the change owes.
5. Makes the save final and releases the order.
6. Carries out the follow-up work.

What it guarantees:

| | |
|---|---|
| **The same move twice moves once** | A second request for the status the order already has returns `false` and does nothing: no second e-mail, no second document. This is what makes a provider callback that arrives twice harmless. |
| **The change and what it owes are saved together** | If the change is undone, no follow-up work is left behind. If the request stops after the save, the work is still recorded and Alfa carries it out later. |
| **Work only where there is work** | Since 2.2.0 a step is recorded only when it has something to do: the stock step when the new status asks something else of the stock, the documents step when the status issues documents, the e-mail when the status notifies, `onOrderStatusChange` when a plugin listens. |
| **The follow-up work runs after the save is final** | And after Alfa's locks are released. When you call `save()` inside a database transaction of your own, the work waits until your transaction is final. Until then the order has its new status and nothing else has happened. |
| **A refusal that matters is visible** | A change refused because of the target status, because the order is cancelled, or because the order was busy is written to the log (category `com_alfa.orders`). The first and the last are also written to the order's History. |

The follow-up work, in the order it runs: stock, download access, documents, the status e-mail,
`onOrderStatusChange`. Each step is a save of its own. A step that fails leaves the status as saved.

### What can go wrong

`save()` returns `false` and moves nothing when:

| The reason | How to tell |
|---|---|
| The order does not exist, or no target was given | |
| The order is already in that status | |
| The target status does not exist or is unpublished | `Transition::isValidTarget($statusId)` is `false` |
| The status requires the order to be paid, the order is not, and the status allows no unpaid exception | `Transition::refusalReason($orderId, $statusId)` gives the reason |
| The order names no currency | The same |
| The target status keeps the goods set aside, and a line of the order has a unit that does not track stock now | The same |
| The order is in a cancelled status, the target is not, and `force()` was not called | |
| The order was no longer in the status named with `expectStatus()` | `refusedSuperseded()` is `true` |
| Another request held the order's row for too long, or the database stopped the change twice | `refusedBusy()` is `true`. Asking again later may work. |

`outcome(bool $moved): string` turns the answer of `save()` into one of four constants: `Transition::OUTCOME_MOVED`,
`OUTCOME_UNMOVED`, `OUTCOME_BUSY` and `OUTCOME_SUPERSEDED` (since 2.2.0).

Any other error is thrown. When `save()` runs inside your transaction and the database stops it to resolve a
deadlock, that error is thrown to you as well, because your own work is lost with it.

Reading what the stock did, after `save()` returned `true`:

| Method | Meaning |
|---|---|
| `getStockResult(): ?array` | `['action' => ..., 'count' => ...]` with the action `deducted`, `reserved`, `restored` or `none`. `null` when the stock step has not been applied: it is still owed, or it was refused. While a transaction of your own is open and a stock step is owed, it is `null` too. |
| `getStockRefusal(): ?string` | Why the stock step was refused for good, or `null` |
| `getStockReservedFloor(): ?string` | Why the stock step waits for stock that other orders hold, or `null` |
| `getStockFailure(): ?string` | What the stock step failed with, when a later attempt can still apply it, or `null` |

The three texts are plain text. Escape them before you show them in a page.

The two static methods `drainFor()` and `deliverStockOutcome()` are for Alfa's own background work. Do not call
them.

## The order reader

### What it does

`Order` is what every order event hands a plugin. It answers with named methods and has no method that changes
anything. Everything it gives is what the **order** recorded, not what the customer's account says today.

You get it from `getOrder()` of an event, for example `onAlfaOrderPlaced`, `onOrderStatusChange`,
`onOrderAfterPlace` and the staff action events of a payment or shipping plugin. A payment or shipping plugin can
also load one with `$this->getOrder($orderId)`.

### What you are given

| Method | Returns | Meaning |
|---|---|---|
| `id()` | `int` | The order's id |
| `reference()` | `string` | The reference the merchant and the customer see |
| `secureKey()` | `string` | The key a return link is signed with |
| `customerId()` | `int` | The account that placed it. 0 for a guest and for an account deleted since. |
| `isGuest()` | `bool` | Placed without an account, as recorded when it was placed |
| `getName()` | `string` | The name of the person who placed the order. The buyer, not the recipient of the parcel. |
| `getEmail()` | `string` | The buyer's e-mail address |
| `languageId()` | `int` | The language to address the buyer in. 0 when the order names none. |
| `delivery()` | `AddressView` | The delivery address the order was placed with. Who the parcel is for. |
| `invoice()` | `AddressView` | The invoice address, or the delivery address when they are the same |
| `currency()` | `Currency` | The order's currency. Throws `OrderCurrencyException` when the order names none. |
| `total()` | `Money` | What the customer pays in total, tax included |
| `hasComputedTotal()` | `bool` | Whether `total()` is a calculated total and not a bare stored figure. It matters at placement only. |
| `shipmentTotal()`, `shipmentTotalExcl()` | `Money` | The shipping cost, with and without tax |
| `shipmentTaxRate()` | `float` | The tax rate of the shipping cost in percent. Stated at placement for the shipping plugin that writes the parcel. 0.0 anywhere else. |
| `shipmentChargeBasis()`, `shipmentTaxChain()` | | How the shipping figures were formed. Stated at placement only, for the parcel row. |
| `paymentMethodId()`, `shipmentMethodId()` | `int` | The chosen methods, 0 for none |
| `paymentMethod()` | `?object` | The record of the chosen payment method |
| `items()` | `array` | The order's lines |
| `payments()` | `Payment[]` | Every payment, refund and authorization row of the order, in the order written |
| `shipments()` | `Shipment[]` | The order's parcels, oldest first |
| `row()` | | For Alfa. Do not call it. |

`Order::of(object $row): self` makes a reader from an order row. Core uses it. An order handed to you is already a
reader.

A `Payment` reader has `id()`, `orderId()`, `methodId()`, `methodType()`, `type()`, `status()`, `transactionId()`,
`amount()` and `pluginData()`. A `Shipment` reader has `id()`, `orderId()`, `methodId()`, `methodType()`,
`status()`, `trackingNumber()`, `weight()`, `cost()`, `costExcl()` and `pluginData()`. Both also have `row()` and
`of()`, which are for Alfa as on the order reader.

### What can go wrong

| What you see | The cause |
|---|---|
| A property such as `$order->total_shipping` is empty | Read with the methods. The reader has no properties. |
| `shipmentTaxRate()` is 0.0 in a staff action | The rate is stated only at placement. An order can hold several parcels at different rates. Read the parcel. |
| `getName()` is empty | The order was created without a customer name, for example by an import |

## The total of an order

The orders table has no column for a total. Every total is added up from the order's rows by one formula, in
`OrderTotalHelper`:

```text
total = lines + shipping + plugin charges - cart rules
```

| Part | Where it comes from |
|---|---|
| Lines | The line totals of the order (`#__alfa_order_items`) |
| Shipping | The charges of the order's parcels (`#__alfa_order_shipments`). A cancelled or returned parcel does not count. A cart rule of the shipping class lowers this part, never below 0. |
| Plugin charges | The charges plugins added in `onCartTotals`, stored with the order (`#__alfa_order_contributions`) |
| Cart rules | The item and order rules stored with the order (`#__alfa_order_cart_rule`), each with its own tax-included figure |

Changed in 2.2.0. Plugin charges are part of the total. Each stored cart rule carries its own tax-included amount;
it is no longer worked out from the items' average tax.

`OrderTotalHelper` is core's own. A plugin reads the total from the reader (`$order->total()`), and a payment
plugin reads what is still to collect from its base class (`amountToCollect()`, `orderBalance()`). Its public
methods, so that you can follow the code:

| Method | Returns |
|---|---|
| `computeFromArrays(array $items, array $shipments, array $discounts, array $contributions = []): object` | The formula, on rows already loaded. Ten figures as floats: `items_tax_incl`, `items_tax_excl`, `shipping_tax_incl`, `shipping_tax_excl`, `contributions_tax_incl`, `contributions_tax_excl`, `discount_tax_incl`, `discount_tax_excl`, `grand_total_tax_incl`, `grand_total_tax_excl`. |
| `exactFromArrays(...)` | The same ten figures as exact decimal texts |
| `getBreakdown(int $orderId, ?object $order = null): object` | The same from the database, plus `cart_rules` and the shipping cost before shipping rules (`shipping_gross_tax_incl`, `shipping_gross_tax_excl`) |
| `getExactBreakdown(int $orderId, ?object $order = null): object` | The ten figures from the database, as exact decimal texts |
| `getOrderTotal(int $orderId, ?object $order = null): float` | The total, tax included |
| `getItemsTotal()`, `getShippingTotal()`, `getDiscountTotal()`, `getDiscountTotalExcl()` | One part each. `getShippingTotal()` is the parcels' charges before shipping rules. |
| `activeShipments(array $shipments): array`, `activeShipmentsWhere($db, string $prefix = ''): string` | The parcels that count: all but cancelled and returned ones |

## OrderStatusHelper

Order statuses are made by the merchant. No status has a fixed id. Code that needs "the first status" or "is this
order cancelled" asks this helper. It only reads, and it remembers its answers for the rest of the request.

| Method | Returns |
|---|---|
| `getInitialId(): ?int` | The status a new order starts in. When none is marked, the first published status in the merchant's order. `null` when there is no status. |
| `isInitial(?int $statusId): bool` | Whether this is that status |
| `getCancelledIds(): array`, `isCancelled(?int $statusId): bool` | The cancelled statuses. There can be several: "Cancelled", "Returned", "Refunded". |
| `getCompletedIds(): array`, `isCompleted(?int $statusId): bool` | The completed statuses. There can be several. |
| `getById(?int $statusId): ?object` | One status row, or `null` |
| `getAll(?string $orderBy = null): array` | Every status row, keyed by id |
| `clearCache(): void` | Forgets the remembered answers. For code that has just changed a status row. |

In a listener of `onOrderStatusChange` you do not need it: the event has `enteredCompleted()`, `enteredCancelled()`,
`leftCompleted()` and `leftCancelled()`.

## OrderHelper and OrderHistoryHelper

Both are core's own and serve the order screen of the back office.

| Class | Public methods | What they do |
|---|---|---|
| `OrderHelper` | `getOrderItems(int $orderId, ?Currency $currency = null): array`, `attachOrderItemFields(array $items): void`, `buildOrderPriceContext(int $orderId)`, `searchProducts(string $searchTerm, PriceContext $context, int $limit = 20): array`, `getProductById(int $productId, PriceContext $context, int $quantity = 1): ?object` | Read an order's lines with their amounts as `Money`, attach the field values kept on each line, and price an item for the order's customer when staff add a line. It reads only: order lines are written by the order model. |
| `OrderHistoryHelper` | `line(object $entry, object $order): string`, `details(array $context): array` | Turn one stored History entry into the sentence and the details staff read. They change nothing. |

Changed in 2.2.0. `OrderHelper::getOrder()` and `OrderHelper::setOrderItems()` no longer exist.

## StockPolicy

Every order status carries a **claim**: what an order in that status asks of the stock. `StockPolicy::claimFor()`
is the one place that answers it.

| `claimFor(int $statusId)` returns | When | What it means |
|---|---|---|
| `StockPolicy::CLAIM_NONE` | A cancelled status | The order holds nothing. What was taken is put back and every reservation is let go. |
| `StockPolicy::CLAIM_RESERVATION` | A status that keeps the goods in stock | The goods stay on the shelf, set aside for the order |
| `StockPolicy::CLAIM_PHYSICAL` | A status that removes the goods from stock, and any status Alfa does not know | The goods are taken from stock |

`StockPolicy` never writes a stock figure itself. It tells the stock service what to do, and the stock service
announces the stock events. See [What decides which of them happens](../events/stock-events.md#what-decides-which-of-them-happens).

It is core's own. `OrderCreator` and `Transition` call it for you. Its other public methods
(`getDefaultOrderStatus()`, `shouldDeductStock()`, `handleStatusTransition()`, `reconcileOrderClaim()`,
`deductOrderStock()`, `restoreOrderStock()`) move stock and are not for an extension.

Changed in 2.2.0. `OrderStockHelper` no longer exists, and nothing writes the `stock` column of an item directly.

## The two locks

### What they are

A **lock** makes a second request wait or step back, so that two requests do not do the same thing at the same
moment. These two step back at once: they do not wait.

| Lock | What it guards | Signature |
|---|---|---|
| `OrderMoneyLock` | One capture or release of a payment at a time, per order | `OrderMoneyLock::run(int $orderId, callable $work): bool` |
| `ShipmentBookingLock` | One booking with the carrier at a time, per shipment | `ShipmentBookingLock::run(int $shipmentId, callable $work): bool` |

Both run your function while holding the lock, and return `false`, without running it, when another request holds
the lock.

### When they are used

Their class comments address plugins: a gateway for `OrderMoneyLock`, a carrier for `ShipmentBookingLock`. Core itself
takes neither in 2.2.0, and the standard plugins do not take them either. `ShipmentBookingLock::run()` has no caller
anywhere in the code. The base classes have no method that reaches them, so a plugin that uses one calls the class.
There is no shipped example of either.

| Your plugin | What the class comment says |
|---|---|
| A payment plugin that captures or releases an authorized payment | `OrderMoneyLock`. The comment says the gateway runs its checks, the provider call and the booking inside `run()`. The same comment then says a gateway holds the lock around its own log write and booking, "never across a call to the provider". The two sentences do not agree, and no shipped plugin shows which is meant. This manual does not say whether the call to the provider belongs inside the lock. |
| A shipping plugin that books a parcel with the carrier | `ShipmentBookingLock`. The comment says the carrier runs the whole booking inside `run()`: it reads whether the shipment is booked, asks the carrier and records the parcel. |

**A refund needs no such lock.** A refund is set aside in the books before the provider is asked
(`reserveRefund()`), and no lock is held while the provider is called. The class comment adds that a gateway may
still hold `OrderMoneyLock` around its own log write and booking, never across the call to the provider. See
[A refund through a provider](../plugins/payment-plugins.md#a-refund-through-a-provider).

### What you must provide

```php
use Alfa\Component\Alfa\Administrator\Service\Order\OrderMoneyLock;

$ran = OrderMoneyLock::run($orderId, function () use ($paymentId): void {
    // The work that must not run twice for this order: check that the payment
    // can still be captured, and book the result.
});

if (!$ran) {
    // Another request is working on this order's money. Nothing ran. Tell staff to try again.
}
```

### What happens next, and what can go wrong

| | |
|---|---|
| **What they guarantee** | The same request may take the same lock again. A request that stops frees its lock. Follow-up work that Alfa records while the lock is held (an order moved by a settled payment, an e-mail) runs after the lock is released. |
| **What they refuse** | An id of 0 or less: `RuntimeException`. A lock the database gives no answer for: `RuntimeException`, and your function does not run. |
| **What to remember** | Inside the lock the order has not moved yet when a payment's `save()` returns. Do not read the order's new status there. |

## Changed in 2.2.0

- **Changed in 2.2.0.** `OrderStockHelper` is replaced by `StockPolicy`. `OrderHelper` only reads.
- **Changed in 2.2.0.** The order total includes plugin charges.
- **Since 2.2.0.** `Transition::expectStatus()`, `refusedBusy()`, `refusedSuperseded()` and `outcome()`.
- **Changed in 2.2.0.** A status change records a follow-up step only when the step has work.
- **Changed in 2.1.4.** The follow-up work of a status change is recorded with the change and carried out after
  the save is final.

## Not documented yet

- Creating a complete order from an extension: `OrderCreator` writes the order and its lines, and nothing in 2.2.0
  shows how an extension that is not the order's payment or shipping plugin adds the payment row and the parcel.
- The draft keys `customer_name`, `customer_email`, `customer_is_guest` and `actor_name`, which the back office
  passes to `OrderCreator::create()` and the method's comment does not list.
- The properties of the line objects that `Order::items()` returns.
- The address reader (`AddressView`) in full.
- Writing an entry of your own to an order's History.
- A checked sample of `OrderCreator::create()`, of a direct `Transition` call and of either lock from an extension.
  No extension that ships with Alfa makes these calls, so the samples on this page were checked against the
  signatures and comments only.
- Whether a shipping plugin may call `Transition`, and whether the call to the provider belongs inside
  `OrderMoneyLock`. The code does not settle either.
- `OrderFacts`, `OrderIdentity`, `InventoryBridge`, `EmailService` and the other classes of
  `administrator/src/Service/Order`. They are core's own.
