---
sidebar_position: 6
title: Outgoing notifications
description: "How the shop tells another system of its changes: webhooks, the signed request and its body, retries, the changes given up, and the recipe for an integrator that keeps a copy of the catalogue."
---

# Outgoing notifications

The REST API answers a program that asks. Outgoing notifications go the other way: the shop tells another system
of its changes as they happen, so that system does not have to read the whole catalogue again and again.

The shop tells of four kinds of change, called **topics**:

| Topic | Told when |
|---|---|
| `stock` | The quantity a unit has for sale moves: a sale, a cancellation, a return, an adjustment, a stock correction |
| `price` | The selling price of a unit moves: a price written, a sale price or a discount saved, a price period that begins |
| `order.created` | An order is placed: in the shop, in the administrator, or over the API |
| `order.status` | An order's status changes |
| `order.dispute` | A card dispute of the order is recorded, moves or changes ([Card disputes](../services/disputes.md)) |

A **unit** is what has its own stock and price: a product without combinations, or one combination of a product.

There are two kinds of receiver, called **consumers**:

- a **webhook**: an https address of the other system, to which the shop posts the changes as signed JSON. Staff set
  it up on the Webhooks screen. This page is mostly about webhooks.
- a **plugin consumer**: an Alfa Commerce plugin that tells its own system through that system's own API, with the
  credentials it keeps in its settings. See [Telling through a plugin](#telling-through-a-plugin).

## Set up a webhook

1. In the administrator, open **Alfa Commerce**, **Webhooks** (in the System part of the menu), and press **New**.
2. Give it a **Name** staff will recognise, the **Address** of the receiving system (https only), and the **Topics**
   it is told of.
3. Save. The shop makes the webhook's **secret** and shows it once, in the message above the screen. Copy it and
   give it to the receiving system at once: it is never shown again, and no screen, list or API route returns it.
4. Press **Send test** on the webhook's row. The shop posts one change of topic `ping`, signed like every request,
   and says what the receiving system answered.

The address must be https and its host must resolve to public addresses only: an address inside the shop's own
network (loopback, private, link-local, shared or reserved) is refused when it is saved and again before every
request, and the shop connects to the address it checked and to no other. A redirect is not followed.

To change the secret, open the webhook, set **Make a new secret** to Yes and save. The new secret is shown once, and
every request is signed with it from then on.

A webhook is **Enabled** or **Paused**. A paused webhook is told nothing new, and what was waiting for it is kept
and sent when it is enabled again.

Who may do what is set in **Options**, **Permissions**, **Webhooks**: View, Create, Edit (which covers the test and a
new secret), Change State and Delete. Deleting a webhook deletes every change still waiting for it.

## The request

Changes are sent in the background by the shop's task runner (see
[Background work](../architecture/background-work.md)), never in the request that made the change, so a slow or
absent receiver never slows the shop. Up to 100 changes go in one request, oldest first.

```http
POST /their/hook HTTP/1.1
Content-Type: application/json
User-Agent: AlfaCommerce-Webhook
X-Alfa-Delivery: 8812-8814
X-Alfa-Signature: t=1795615331,v1=5f2b...e9

{
  "shop": "https://your-shop.example/",
  "sent_at": "2026-11-19T14:02:11Z",
  "changes": [
    {"id": 8812, "topic": "stock", "occurred_at": "2026-11-19T14:01:58.120000Z",
     "item_id": 600, "combination_id": 0, "sku": "SMX-BLK-128", "available_quantity": "8"},
    {"id": 8813, "topic": "price", "occurred_at": "2026-11-19T14:01:59.004000Z",
     "item_id": 600, "combination_id": 0, "sku": "SMX-BLK-128",
     "price": {"net": "200.00", "gross": "248.00", "currency": "EUR"},
     "prices_state": "4f0c9a1e5d2b7c90a1b2c3d4e5f60718"},
    {"id": 8814, "topic": "order.status", "occurred_at": "2026-11-19T14:02:03.511000Z",
     "order_id": 30899, "from_status_id": 1, "to_status_id": 3}
  ]
}
```

`X-Alfa-Delivery` names the first and the last change of the request. `X-Alfa-Signature` is described in
[Check the signature](#check-the-signature).

### What each change holds

Every change has `id`, `topic` and `occurred_at` (when the change was made, UTC). `id` is unique: a receiver that is
sent a change twice (it answered, but the answer was lost) recognises it by its id.

| Topic | Fields |
|---|---|
| `stock` | `item_id`, `combination_id` (0 for a product without combinations), `sku`, `available_quantity`: the quantity for sale, as exact decimal text. `sku` and `available_quantity` are null when the unit no longer exists. |
| `price` | `item_id`, `combination_id`, `sku`, `price`: `net` (without tax), `gross` (with tax) and `currency` (its ISO code), at the currency's decimal places, or null when no price applies to the unit; and `prices_state`, the state of the unit's own price rows (see [Two systems that both write prices](#two-systems-that-both-write-prices)) |
| `order.created` | `order_id`, `status_id`: the status the order is in when the change is sent |
| `order.status` | `order_id`, `from_status_id`, `to_status_id` |
| `order.dispute` | `order_id`, `dispute`: `id`, `state` (the state the change moved it to), and as they stand when the request leaves `outcome` (the bank's last decision: `won`, `lost` or null), `amount` (in the order's currency, decimal text, null while unknown), `currency`, `decided_at`. An ERP learns here that an order is owed again after a loss. |

The values are read **when the request leaves**, not when the change was made. A unit whose stock moves three times
before the next request is told once, with the quantity it has then: the receiver is always told the newest figure,
and a busy product is one change, not hundreds. Order changes are never merged: every status move is told, and the
changes of one order arrive in the order they happened (a later change of an order waits until the earlier one is
taken or given up).

The price is the one a guest sees: the shop's default currency, no place, the customer groups of a visitor who is not
logged in, at the quantity the product opens with, as the storefront's catalogue prices it.

A change is written in the same database transaction as the change itself. A change that is undone (an order that
fails at checkout, a save that is refused) is never told.

## Check the signature

Every request is signed with the webhook's secret. `X-Alfa-Signature` holds `t`, the moment the request was signed
in Unix seconds, and `v1`, the HMAC-SHA256, in hexadecimal, of that moment, a full stop and the body exactly as
sent, keyed with the secret.

The receiving system:

1. reads the body as received, before any parsing;
2. computes the same HMAC over `t`, a full stop and that body, with the secret;
3. compares it with `v1` in constant time;
4. refuses a `t` more than 300 seconds away from its own clock, so a captured request cannot be sent again later.

In PHP:

```php
function alfaSignatureValid(string $secret, string $header, string $body, int $now): bool
{
    if (preg_match('/^t=(\d{1,12}),v1=([0-9a-f]{64})$/D', trim($header), $m) !== 1) {
        return false;
    }

    if (abs($now - (int) $m[1]) > 300) {
        return false;
    }

    return hash_equals(hash_hmac('sha256', $m[1] . '.' . $body, $secret), $m[2]);
}

$body = file_get_contents('php://input');

if (!alfaSignatureValid(getenv('ALFA_WEBHOOK_SECRET'), $_SERVER['HTTP_X_ALFA_SIGNATURE'] ?? '', $body, time())) {
    http_response_code(401);
    exit;
}
```

## Answer the request

| The receiver answers | The shop |
|---|---|
| Any 2xx | Takes every change of the request as told |
| No answer within 15 seconds (5 to connect), a broken connection, a redirect (3xx), 408, 425, 429 or any 5xx | Sends the changes again later |
| Any other 4xx | Gives the changes up at once, and keeps the status and the first 255 bytes of the answer for staff |

Answer 2xx as soon as the request is stored, and do the work afterwards. A request that is answered 2xx is never
sent again.

## Retries and changes given up

A change that was not taken is sent again after 1 minute, then 5 minutes, 30 minutes, 2 hours, 6 hours and 24 hours.
A `Retry-After` header longer than the next wait is honoured. When the sixth retry fails too, the change is **given
up**: it is not sent again by itself, and staff are told.

Staff see each consumer in **Tools**, **Tasks**, on the card **Outgoing notifications**: what waits for it, what was
given up, and the last delivery with its answer. A notice also says which consumer was not told of how many changes.
On the card:

- **Retry** puts the changes given up back in the queue, as new. A stock or price change whose unit has a newer change
  waiting is covered by that one and is discarded instead.
- **Discard** leaves them unsent; they stop being counted.
- **Pause** and **Resume** stop and restart a consumer, as the webhook's state does.

A stock or price change that is given up does not block its unit: the unit's next change is told with the newest
figure. Changes that were taken, or that no consumer took, are kept for 7 days, changes given up or discarded for 30
days, then removed.

The card needs the permission **Tools** of Alfa Commerce.

## The integrator's recipe

A system that keeps its own copy of the shop's catalogue and orders:

1. **First sync.** When it connects, it reads what it needs once through the REST API: the items with their stock
   and prices (`v1/alfa/items`, page by page, and one record per item for its prices, its `prices_state` and each
   combination's `prices_state`), and the orders it follows. See [Catalogue](./catalogue.md) and
   [Orders](./orders.md).
2. **Then it is told.** A webhook (or the integration's plugin) tells it each change from then on. It stores each
   change's `id` and drops a change it has already seen.
3. **One reconciliation read a day**, outside busy hours, through the same reads as the first sync. It heals what a
   change given up and discarded, or a restore of the shop from a backup, left behind. It replaces the periodic full
   read: the system no longer needs to read everything every few minutes.

### Two systems that both write prices

When the shop and another system both change prices, neither must overwrite the other's change without seeing it:

- The item's record carries `prices_state`, the state of the product's own price rows, and every `price` change
  carries the unit's `prices_state`.
- A `PATCH` of an item that sends `prices` may send the `prices_state` it read with them. When the prices changed
  since, the change is refused with 409, the title saying "prices: the product's prices changed since you read them
  (prices_state). Read it again. Nothing was saved.", and nothing of the change is saved. The system reads the item
  again, merges, and sends again with the new state.
- A change sent without `prices_state` is written as sent: the last write wins.
- The same holds for many units in one request (`PATCH v1/alfa/items/units`): each unit may send the `prices_state`
  it read, a combination's included, and a unit whose prices changed since is refused alone with 409.

See [Catalogue](./catalogue.md#items) and [Many units in one request](./catalogue.md#many-units-in-one-request).

## Telling through a plugin

When the other system offers an API of its own, an Alfa Commerce plugin can tell it instead of a webhook. Core keeps
the queue, the order, the retries, the card and the notice; the plugin only delivers. A plugin of the `alfa` group
does two things:

- It names the topics it takes, when core asks (`onAlfaOutboundTopics`). Core asks when the plugin is saved or
  enabled, and keeps the plugin's consumer row with those topics; it pauses the row when the plugin is disabled
  (nothing new is queued, nothing waiting is lost) and removes it, with what was waiting, when the plugin is
  uninstalled.
- It delivers a batch when core hands it one (`onAlfaOutboundDeliver`), outside any database transaction, and
  answers each change.

Both events are addressed to the one plugin, as the other targeted events of Alfa Commerce are: the plugin takes
part by having a public method named as the event, nothing else is declared (see
[How events reach a plugin](../events/how-events-reach-a-plugin.md)).

```php
use Alfa\Component\Alfa\Administrator\Event\Outbound\OutboundDeliverEvent;
use Alfa\Component\Alfa\Administrator\Event\Outbound\OutboundTopicsEvent;

public function onAlfaOutboundTopics(OutboundTopicsEvent $event): void
{
    $event->topic('stock')->topic('price');
}

public function onAlfaOutboundDeliver(OutboundDeliverEvent $event): void
{
    foreach ($event->getChanges() as $change) {
        // $change->id, ->topic, ->subjectId, ->unitId, ->occurredAt, ->attempts,
        // ->values: the change as a webhook's body states it.
        $answer = $this->client()->send($change->values);

        if ($answer->ok) {
            $event->delivered($change->id);
        } elseif ($answer->permanent) {
            $event->refused($change->id, 'The other system refused it: ' . $answer->code);
        } else {
            $event->retry($change->id, 'The other system did not answer.');
        }
    }
}
```

A change the plugin does not answer is sent again later, on the same waits as a webhook's. A handler that throws has
every change of the batch sent again, and the failure is written to the log `com_alfa.outbound`. A plugin that
cannot be loaded leaves the batch waiting. A reason must never contain a credential: staff read it on the card.

A plugin that names topics but has no `onAlfaOutboundDeliver` method takes no change. Its changes are settled as taken
by **no consumer**: they are not sent again, not given up and not counted, no notice is shown, and the card shows its
last delivery as taken, the reason naming no consumer. This is not an error: the plugin has nothing to tell.

A plugin that writes prices on its system's behalf asks first whether a price change of that unit still waits for it:
`OutboundFeed::waiting($consumerId, 'price', $itemId, $combinationId)`, where `$consumerId` is
`OutboundConsumers::ofPlugin(PluginId::from('alfa', 'yourplugin'))` (or `$event->getConsumerId()` inside a delivery).
While one waits, it refuses its system's write for that product, so its system first learns the shop's price.
