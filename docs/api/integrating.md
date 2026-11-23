---
title: Connecting another system
description: "What the shop needs from another system that connects to it and what it gives it: the account and its token, the shop's changes told or read, writes that keep the shop's own changes, and the answers to count on."
---

# Connecting another system

<AlfaVersion verified="2.3.0" />

This page is for the developers of a system that works with an Alfa Commerce shop: an ERP, a marketplace, a
warehouse, a connector. It says what the shop needs from that system and what the shop gives it, and points to the
pages that hold the detail. Every route is in the Postman collection, ready to run: see
[The Postman collection](./overview.md#the-postman-collection).

## Calling the shop

Every call goes to the shop's Joomla Web Services, at `https://your-shop.example/api/index.php/v1/alfa/...`, the
routes of the plugin "Web Services - Alfa Commerce".

The system calls with an account of its own, which the shop's staff set up once:

1. A Joomla user group of its own, and one account in it alone, never a Super User.
2. **Global Configuration**, **Permissions**, that group: **Web Services Login** allowed. An account without it is
   answered 401.
3. The plugin **User - Joomla API Token**, its **Allowed User Groups**: the group added (Super Users only by
   default). An account outside them is answered 401. That plugin and **API Authentication - Web Services Joomla
   Token** must be enabled.
4. **Alfa Commerce**, **Options**, **Permissions**, that group: the permissions of what the system does, and no
   others (below).
5. The account signs in once, opens its own profile and copies its token from the tab **Joomla API Token**, with the
   token **Active**. Joomla shows a token to its own account only.

| The system | The Alfa Commerce permission |
|---|---|
| Reads products, and the light list of stock and prices | Items: View |
| Writes prices and stock, of one product or of many units | Items: Edit |
| Places orders | Orders: Create |
| Reads orders | Orders: View |
| Changes an order, its lines, payments and parcels | Orders: Edit |
| Moves an order to another status | Orders: View and Orders: Change State |

Every other route asks the permission of its record and action; see [Permissions](./overview.md#permissions).

Each request carries:

```http
GET /api/index.php/v1/alfa/stockprices?page[limit]=500 HTTP/1.1
Host: your-shop.example
X-Joomla-Token: YOUR_TOKEN
Accept: application/vnd.api+json
```

- the token, as `X-Joomla-Token: YOUR_TOKEN` or as `Authorization: Bearer YOUR_TOKEN` (Joomla reads `Authorization`
  first);
- `Accept: application/vnd.api+json`, or `*/*`: a request without an `Accept` header, or with one that does not take
  `application/vnd.api+json` (`application/json` alone), is answered 406;
- on a write, the body as JSON.

## Receiving the shop's changes

The shop tells the system of its changes, or the system reads them on a schedule. It may do both.

### An address the shop calls

The system gives the shop's staff an https address. Staff add it on the **Webhooks** screen with the topics the
system takes, and hand the system the webhook's secret, which the shop makes and shows once. See
[Outgoing notifications](./notifications.md).

| Topic | Told when |
|---|---|
| `stock` | The quantity for sale of a unit (a product without combinations, or one combination) moves |
| `price` | A unit's selling price, as a guest sees it, moves |
| `order.created` | An order is placed |
| `order.status` | An order's status changes |

What the address must be and do:

- **Reachable.** https, its host resolving to public addresses only, with a certificate the shop verifies against
  the host name. A redirect is not followed.
- **Check the signature.** `X-Alfa-Signature` holds `t` and `v1`: the HMAC-SHA256, keyed with the secret, of `t`, a
  full stop and the body as received. Refuse a request whose `v1` differs, or whose `t` is more than 300 seconds from
  your clock. See [Check the signature](./notifications.md#check-the-signature).
- **Answer in time.** Any 2xx within 15 seconds (5 to connect), once the request is stored. No answer, a redirect,
  408, 425, 429 or a 5xx: the changes are sent again after 1 minute, 5 minutes, 30 minutes, 2 hours, 6 hours and 24
  hours, then given up. Any other 4xx gives them up at once. See
  [Answer the request](./notifications.md#answer-the-request).
- **Take a change twice.** When an answer is lost, the same changes come again with the same `id`. Drop an order
  change whose `id` you have already seen. Apply a stock or price change each time: it is read when it is sent, so it
  carries the newest figure. The changes of one order arrive in the order they happened.

A request holds up to 100 changes. A test from the Webhooks screen holds one change of topic `ping`; answer it as any
other. Each topic's fields are in [What each change holds](./notifications.md#what-each-change-holds). A system that
offers an API of its own can be told by an Alfa Commerce plugin instead: see
[Telling through a plugin](./notifications.md#telling-through-a-plugin).

### Reading on a schedule

- `GET v1/alfa/stockprices`, the light list: one row for each product without combinations and for each
  combination, with its codes, its stock and the price a guest pays. It pages by key, never by offset: `page[limit]`
  from 1 to 1,000 (100 when left out), and `page[after]` the key `item_id:combination_id` that the answer's
  `links.next` carries. Follow `links.next` until a page comes without it.
- `filter[changed_since]`, on `stockprices` and on `v1/alfa/items`, keeps what changed at or after a UTC time: a
  product's stock, its prices or its own fields. Ask from a little before your last read; a row read twice holds the
  current values.

See [The light list of stock and prices](./catalogue.md#the-light-list-of-stock-and-prices) and
[Items](./catalogue.md#items).

## Writing without stepping on the shop

- **An order the system made.** Send the system's name in `external_source` and its id of the order in
  `external_reference`, both or neither. One pair names one order: a create sent again (after a timeout or a lost
  answer) creates nothing and answers 409, with that order's id in `meta.existing_id`. See
  [Where an order comes from](./orders.md#where-an-order-comes-from).
- **Prices the shop changes too.** A product's read carries `prices_state`, and each combination its own. Send it
  back with `prices` in the product's `PATCH`: when the prices changed since, the answer is 409 and nothing is saved,
  so read again, merge and send again. Without `prices_state`, the last write wins. See
  [Two systems that both write prices](./notifications.md#two-systems-that-both-write-prices).
- **Many prices and stock figures in one request.** `PATCH v1/alfa/items/units` writes up to 100 units, each in a
  transaction of its own and answered on its own, so a refused unit leaves the others written. A stock figure is the
  unit's whole stock, not a change. See [Many units in one request](./catalogue.md#many-units-in-one-request).
- **Stock and variants the system keeps.** `POST v1/alfa/inventory/adjustments` sets or corrects stock by SKU or by
  id, a figure or a signed change, every line or none. Each adjustment carries an `Idempotency-Key` header, and the
  same key when it is sent again: a request sent twice is applied once, and the second answer says `meta.replayed`.
  A 409 with `Retry-After` asks for the same request again after those seconds. A product's variants are created,
  changed and removed under `v1/alfa/items/:id/combinations`. See [Variants and stock](./variants.md).
- **Texts.** Texts in several languages go in `translations`, keyed by language (`en_gb`, `el_gr`), as a read with
  `include=translations` gives them. A key with a language suffix (`name_el_gr`) is refused with 422. See
  [Writing](./overview.md#writing).

## What the system can count on

- **Times in UTC.** The API writes `Y-m-d H:i:s`, a webhook ISO 8601 with `Z`. A filter's time sent without a zone
  is UTC. See [Reading](./overview.md#reading).
- **Money as exact decimal text.** An amount is `"19.90"`, never a floating-point number; on orders and documents it
  comes with its formatted text and its amount in minor units. Send money as text too.
- **One shape of refusal.** `{"errors":[{"title":"...","code":409}]}`: `title` says why in words, and the HTTP
  status says what to do.

| Status | What to do |
|---|---|
| 400, 422 | Fix the request before sending it again. |
| 401 | Check the token, the account's Web Services Login and the token plugin's groups. |
| 403 | Grant the account the route's Alfa Commerce permission. |
| 406 | Send `Accept: application/vnd.api+json`. |
| 409 | The shop's data refuses the request as it stands: read again, then decide. After a `prices_state` refusal, merge and send again; after a pair another order carries, read that order (`meta.existing_id`). |
| 503 | The shop is being maintained, or a part the answer needs is missing: send the same request again later. A `Retry-After` header, when there is one, says after how many seconds. |

Every status is on [Status codes](./overview.md#status-codes).
