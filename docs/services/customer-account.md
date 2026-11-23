---
sidebar_position: 4
title: The customer's account
description: My orders, the order page, a guest's one order, cancelling, documents and ordering again: what each shows, who may open it, the settings, and what a template or an extension can change.
---

# The customer's account

<AlfaVersion verified="2.3.0" />

A customer with an account sees their orders in the shop: a list, and a page for each order. From an order's page
they can pay what is still owed, cancel the order where the shop allows it, download its invoices, receipts and credit
notes, and put its products in the cart again. A guest reaches one order, the one an e-mail of theirs names.

The pages read an order through one class, `OrderConfirmation` (`site/src/Service/Order/OrderConfirmation.php`), the
same class the order completed page reads. They print the order through one layout, so a template override changes
the order completed page and the account's order page together.

## The pages

| Page | Address | Who opens it |
|---|---|---|
| My orders | The menu item type **My orders** (`index.php?option=com_alfa&view=orders`) | The customer logged in. A visitor who is not is sent to log in and comes back. |
| The order's page | `index.php?option=com_alfa&view=order&id=<id>`, under My orders in the address (`/my-orders/123`) | The order's customer, logged in. Any other visitor, and an order in the trash, get "Order not available" with status 404. |
| The order completed page | `index.php?option=com_alfa&view=cart&layout=default_order_completed&id=<id>&key=<key>` | A guest's order by its key alone; an account's order by its key and its customer logged in. This is the one page a guest reaches. |

An order belongs to a customer by its account (`id_user`) alone, never by an e-mail address or a name. A guest's
orders under the same e-mail address are not in that customer's list.

The setup checklist's **Customer pages** row creates My orders with the account page and the sign-up page, in every
language of the site.

### My orders

Each row is one order, newest first: its number (a link to its page), the date, the status and the total in the
order's own currency. The page shows the site's list limit of orders at a time, with Joomla's page links below.

### The order's page

From top to bottom:

- **Order #n**;
- the facts: the date, the status, the shipping and payment methods, how much is paid;
- **Pay now**, while the order still owes money and may be paid again (see [Payments and
  shipments](./payments-and-shipments.md));
- the payment method's own block, asked of the plugin the order was paid with;
- **Tracking**: each parcel that has a tracking number, with its carrier (the carrier's name, else the shipping
  method's);
- **Documents**: the order's invoices, receipts and credit notes (see [Documents](#documents));
- the products, the totals and the addresses;
- **Cancel order**, where the shop allows it (see [Cancelling](#cancelling)), **Order again**, **Print** and **My
  orders**.

Print opens the same address with `tmpl=component&print=1`, which shows the order alone and opens the print dialog.

### A guest's one order

A guest reaches their order on the order completed page's address, which carries the order's key. The order e-mails
the customer receives link to it (**View your order**): for a guest's order the keyed address, for an account's order
the order's page in the account, with no key. The keyed page shows the same order block as the account's page. It
never offers Cancel order. It offers Order again, and **See it in your account**, to the order's customer when they are
logged in.

### Neither stored nor indexed

Every answer of these pages is the visitor's own. Each one asks Joomla's page cache not to store it
(`PageCache::excludeResponse()`), is sent with Joomla's `no-store`, and carries `noindex, nofollow` (the `X-Robots-Tag`
header and the robots meta). System - Alfa Commerce Sync also never serves a stored page for them. See [Caches and the
page cache](../architecture/caches.md).

## The name of a status

Customers read a status by its **customer-facing name**, which the status form takes for each language. The field is
optional: where it is empty in a language, customers read the status's internal name in that language; a language
that has neither reads the site's default language the same way. The internal name stays the administration's.

One method gives that name, wherever a customer reads it (My orders, the order pages, the e-mails' `{status_customer}`):

```php
use Alfa\Component\Alfa\Administrator\Helper\OrderStatusHelper;

$name = OrderStatusHelper::customerName(statusId: $statusId);              // the request's language
$name = OrderStatusHelper::customerName(statusId: $statusId, langTag: 'el-GR');
```

## Cancelling

A customer cancels an order from its page only where the shop has set two things:

1. **Options, Cart, Customer account, Customer cancel status**: the status a cancelled order moves to. Required. Only a
   published status of the cancelled family can be chosen.
2. **Customers may cancel** on each order status in which a customer may cancel (Order statuses, the status's Order
   Status tab).

Neither is ever inferred from a name or another setting. A new installation lets customers cancel Pending orders and
names its Cancelled status. A shop that was updated starts with both unset: nobody can cancel until the shop sets them,
and the setup checklist's optional row **Customer cancel** says so. Reset to default keeps the chosen status.

The cancel is refused while a payment of the order is still open at a payment provider (a gateway's payment or
authorisation pending or held), until it settles or fails. It is refused as well when the order is no longer in the
status the customer saw (someone changed it meanwhile).

What happens is the order's ordinary status change to the chosen status (`Transition`), attributed to the customer,
with "Cancelled by the customer" in its history: that status decides the stock, the customer's e-mail and the staff
e-mail to its recipients, as for any order moved to it. Staff also get a notification. Nothing is refunded by the
cancel: refund what was paid from the order.

`CustomerCancel` (`site/src/Service/Order/CustomerCancel.php`) holds the rule:

| Method | Returns |
|---|---|
| `verdict(int $orderId, int $customerId): string` | Whether the customer may cancel the order now: `OPEN`, or why not (`NOT_AVAILABLE`, `OFF`, `NOT_ALLOWED`, `HELD`) |
| `cancel(int $orderId, int $customerId, int $shownStatusId): string` | `CANCELLED`, or why not (the above, `SUPERSEDED`, `BUSY`, `REFUSED`). Everything is asked again under the order's row lock. |
| `target(): ?int`, `allowedIn(int $statusId): bool`, `sentence(string $verdict): string` | The status Options name when it can take a cancel; whether a status allows it; the customer's sentence |

The page posts the task `order.cancel` with the form's token; a guest cannot cancel.

## Documents

The order block lists the order's **invoices and receipts** (the sales types) and its **credit notes** (the credit
types), each as a link to its PDF. Only the current version of a document is listed: one that another document replaced
is not. A voided document is listed and marked **Voided**. A delivery note is never listed.

Each link carries a token of its own, `DocumentToken::for($documentId, $secureKey)`: an HMAC of the document's id keyed
with the order's secret, so the page never shows the secret and a link opens that one document. The download (the task
`order.document`) follows the rule of the order's page: a guest's order opens for the token alone; an account's order
for the token and its customer logged in; never an order in the trash. The PDF is sent inline and never stored. When
the PDF cannot be made now, the customer is sent back with a sentence and the reason goes to the documents log.

`OrderDocuments` (`site/src/Service/Order/OrderDocuments.php`) holds the rule: `of(object $order): array` lists them,
`open(int $documentId, string $token, int $viewerId): array` decides a download.

## Order again

**Order again** puts the order's products in the customer's cart through the cart's own add, at today's prices and
availability, never the order's. Each line is added on its own:

| The line | What happens |
|---|---|
| Its product is for sale, its options are still offered | Added with the same options |
| The stock holds fewer than the order had | Added with what is available; the message says "2 of 3 added" |
| Its product is no longer for sale to this customer | Not added: "no longer available" |
| Its price was set by the shop for that order (a line priced in the order builder) | Not added: ask the shop |
| It was made to the customer's own choices (a field that took an upload or a design) | Not added: choose them again on the product's page |
| One of its options is no longer offered | Not added |
| The cart refuses it | Not added |

Every line that was not added whole is named in the message. The customer then lands on the cart when anything was
added, else on the order's page. The task is `order.reorder`, a POST with the form's token from the order's customer
logged in.

In code, `Reorder::order(int $orderId): array` does it for the visitor's own cart and returns each line's outcome;
`Reorder::sentences()` words them. Whose order it is, the caller asks first. It adds through
`CartService::addCommand()` (see [Cart and checkout](./cart-and-checkout.md#cartservice)).

## Templates

| Override | Changes |
|---|---|
| `html/com_alfa/orders/default.php` | My orders. Its stylesheet is `media/com_alfa/css/site/orders.css` (asset `com_alfa.orders`). |
| `html/com_alfa/order/default.php` | The account's order page |
| `html/layouts/com_alfa/order/detail.php` | The order block, on the account's order page and on the order completed page |
| `html/layouts/com_alfa/order/reorder.php` | The Order again form, on both pages |

The order pages share the order completed page's stylesheet, `media/com_alfa/css/site/order-completed.css`.
