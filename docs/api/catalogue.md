---
sidebar_position: 2
title: Catalogue
description: "The REST API routes for items, categories, manufacturers and item fields of Alfa Commerce, and the storefront's view of an item."
---

# Catalogue

<AlfaVersion verified="2.2.1" />

Read [the overview](./overview.md) first. It has the rules every route follows: the token, pages, languages, how
texts and money are sent, and the status codes.

The catalogue can be read in two ways, and the same item id answers differently in each. That is on purpose.

| | The back office routes | The storefront's view |
|---|---|---|
| Address | `v1/alfa/items` | `v1/alfa/catalog/items` |
| What you see | Every item, whatever its state | Only items a shopper could see: published, inside their publication dates, allowed for the visitor |
| An unpublished item | 200 | 404 |
| What a record holds | The stored record, as the edit form has it | The item as the shop shows it: texts in one language, the calculated price, the fields and combinations, the pictures |
| Writing | Create, change, delete | Read only |

Build a shop front or an app on the storefront's view. Edit through the back office routes.

## Items

`v1/alfa/items`, the five standard routes.

**Create.** The name in the site's default language, a default category and a state are enough. Prices are exact
decimal text. `currency_id` 47 is the euro of a fresh installation; read `v1/alfa/currencies` for the ids of your
shop.

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/items" \
  -d '{
    "translations": {"en_gb": {"name": "Cordless drill"}},
    "sku": "DRILL-18V",
    "state": 1,
    "manage_stock": 0,
    "id_category_default": 1,
    "categories": [1],
    "prices": [{"id": 0, "value": "19.90", "currency_id": 47, "quantity_start": 1}]
  }'
```

The answer, status 201, shortened:

```json
{
  "data": {
    "type": "items",
    "id": "1",
    "attributes": {
      "id": 1,
      "id_category_default": 1,
      "sku": "DRILL-18V",
      "manage_stock": 0,
      "state": 1,
      "prices": [{"id": 1, "value": "19.90", "currency_id": 47, "quantity_start": 1, "state": 1}],
      "categories": [1],
      "name": "Cordless drill",
      "translations": {"en_gb": {"name": "Cordless drill", "alias": ""}}
    }
  },
  "meta": {
    "tasks": [{
      "id": 2, "type": "job", "handler": "price.set.prepare", "state": "pending",
      "links": {"self": "https://your-shop.example/api/index.php/v1/alfa/tasks/2"}
    }]
  }
}
```

`meta.tasks` is there because a new price leaves work for the price index. See
[Tasks](./documents-and-tasks.md#tasks).

Read it back, with every language:

```bash
curl -H "X-Joomla-Token: YOUR_TOKEN" "https://your-shop.example/api/index.php/v1/alfa/items/12?include=translations"
```

**Stock.** Stock is not a field to overwrite. A stock figure in the body is an instruction to the stock service
and counts only when the body carries `stock` or `inventory_stock`. For a product stocked at one location send
`stock`, one figure. For several locations send `inventory_stock`, an object of location id to figure, each figure
the stock to hold there: `{"manage_stock": 1, "inventory_stock": {"1": "3", "2": "2"}}`. The ids are those of
`v1/alfa/locations`. A product with combinations holds its stock on them. Another shape is refused with 422. A
product that tracks stock reads `stock` 0 when it holds none; one that does not track stock reads null. See
[Stock](../services/stock.md).

**A list row holds:** `id`, `name`, `alias`, `sku`, `gtin`, `mpn`, `state`, `stock`, `available_quantity`,
`manage_stock`, `stock_action`, `is_virtual`, `combination_count`, `id_category_default`, `category_ids`,
`manufacturer_ids`, `publish_up`, `publish_down`, `modified`, `commerce_changed_at`, `ordering`.

**One record holds also:** `short_desc`, `full_desc`, `meta_title`, `meta_desc`, `quantity_min`, `quantity_max`,
`quantity_step`, `stock_low`, `backorder`, `min_qty`, `width`, `height`, `depth`, `weight`, `meta_data`, `robots`,
`prices`, `prices_state`, `categories`, `manufacturers`, `medias`, `translations`, `fields`, `options`, `combinations`,
`informational`, `related`, `created_by`, `modified_by`.

**Related lists you can send:** `categories`, `manufacturers`, `allowedUsers`, `allowedUserGroups`, `prices`,
`robots`. Left out, each stays as it was.

**Prices written by two systems.** One record holds `prices_state`, the state of the item's own price rows (32
hexadecimal digits). A `PATCH` that sends `prices` may send the `prices_state` it read with them: when the item's
prices changed since, the answer is 409 with the title "prices: the product's prices changed since you read them
(prices_state). Read it again. Nothing was saved." and nothing of the change is saved. Without `prices_state`, the
prices are written as sent. `prices_state` sent on a create, without `prices`, or in another shape answers 422. See
[Two systems that both write prices](./notifications.md#two-systems-that-both-write-prices).

**Options, combinations and item field values** (`fields`, `options`, `combinations`, `informational`) are for
reading. A program that reads an item and sends it back leaves them out. Set them on the item's page in the
administrator. A create or change that carries any of these keys answers 422 naming them, and nothing is saved. A
refused change leaves the item as it was; it is not checked out. The keys are `fields`,
`options`, `combinations`, `informational`, and the item form's `combinations_default`, `deleted_combination_ids`,
`deleted_option_value_ids`, `deleted_info_value_ids`, `info_values`, `field_order`, `field_required`,
`item_downloads` and `related`. For a body that carries `options`, the reason reads: "options cannot be written through
the API: an item's options, combinations, item field values, downloads and related products are edited on its page in
the administrator. Send the item without them; nothing was saved."

`related` lists the ids of the products the item's page shows as related, in their order. It is for reading: set them
on the product's Related tab in the administrator. A create or change that carries it answers 422 naming it, and
nothing is saved; a change that leaves it out keeps the item's related products.

The list also takes `filter[stock]`, `filter[fields]` and `filter[changed_since]`. See
[The filters of each list](./overview.md#the-filters-of-each-list).

**What changed since your last read.** `commerce_changed_at` is when the item's stock, its prices or the item itself
last changed: a stock move (an order's line, a stock count, a delivery), a price written on the item or on one of its
combinations, a price period stored ahead of time that has begun, a change of its state, a save of the item. It is a
UTC time to the microsecond, `2026-11-20 10:15:02.481920`. A stock move does not change `modified`, so a program that
keeps stock and prices in step with another system reads the items changed since its last read instead of every
item:

```bash
curl -H "X-Joomla-Token: YOUR_TOKEN" \
  "https://your-shop.example/api/index.php/v1/alfa/items?filter[changed_since]=2026-11-20T10:00:00Z&list[limit]=100"
```

Ask from a minute before your last read: an item read twice is harmless, since a read gives the item as it is now.
A time without a zone is UTC; `Z` or an offset is read in its zone; a value that is not a date and time answers 400.
A change of a discount or a tax is not a change of the item and does not move `commerce_changed_at`.

**Delete.** An item is deleted only while it is in the trash. Move it there first with a `PATCH` of `state` -2; an
item in any other state answers 409 and nothing is deleted. An item that was never sold is then removed (204). An
item that an order holds stays, archived (`state` 2), and the answer is 200 with the item and `meta.note` saying
that it was archived instead of deleted.

### Images given by their address

An image the shop should keep as its own file can be given by its address: an entry of `media` with `"type": "image"`
and a `url`. The shop fetches the file and stores it as an upload is stored: in its image folder, with a thumbnail
and its main colour, through the media plugins' events. `"type": "url"` keeps its own meaning: an outside link,
shown from its address, never fetched.

```json
{"media": [
  {"type": "image", "url": "https://images.example.com/drill-front.jpg", "alt": "Cordless drill", "ordering": 1},
  {"type": "image", "url": "https://images.example.com/drill-side.jpg", "alt": "Side view", "ordering": 2}
]}
```

What is fetched, and what is not:

- Only an `http` or `https` address whose host resolves to public addresses; a loopback, private, link-local or
  reserved address is refused, and so is a redirect to one. At most three redirects are followed.
- The file must arrive within the size and the time Options, Media, Images by URL sets (10 MB and 15 seconds by
  default), and its content, not its name or the type the server states, must be an image of a type the shop takes.
- An address the record already holds an image from is not fetched again: sending the same list again changes
  nothing.

**One or two images** are fetched with the request, and the answer carries them. **More** are fetched in the
background: the answer is the record as it is, and `meta.tasks` names the job (`media.fetch`). Read the task (see
[Tasks](./documents-and-tasks.md#tasks)) until its `state` is `done`: its `result` says what became of each image,
by its place in your request:

```json
{"result": [
  {"pointer": "/media/0/url", "url": "https://images.example.com/drill-front.jpg", "outcome": "stored", "media_id": 812, "reason": null},
  {"pointer": "/media/1/url", "url": "https://images.example.com/drill-side.jpg", "outcome": "stored", "media_id": 813, "reason": null},
  {"pointer": "/media/2/url", "url": "https://images.example.com/drill-box.gif", "outcome": "refused", "media_id": null,
   "reason": "its content is image/gif, not an image of a type the shop takes (Options, Media)"}
]}
```

`outcome` is `stored`, `kept` (the record already holds an image from that address) or `refused`, with the reason.

**An image the request fetches and cannot store** is answered 422, one error for each such image with its pointer,
and the record is saved with everything else the request sent; `meta.id` is the record's id, so a create that
answers 422 still names the record it made:

```json
{"meta": {"id": 1201},
 "errors": [{"title": "/media/0/url: the image at http://10.0.0.5/drill.jpg was not stored: its host does not resolve, or resolves to an address that is not public (loopback, private, link-local or reserved). The record was saved with everything else the request sent.",
             "code": 422, "source": {"pointer": "/media/0/url"}}]}
```

Each image the shop fetched carries `source_url`, the address it came from, in `medias`.

## Categories

`v1/alfa/categories`, the five standard routes.

```json
{"translations": {"en_gb": {"name": "Tools"}}, "parent_id": 0, "state": 1}
```

**A list row holds:** `id`, `name`, `alias`, `parent_id`, `state`, `item_count`, `item_count_descendants`,
`ancestors`, `level`, `publish_up`, `publish_down`, `modified`, `ordering`.

**One record holds also:** `desc`, `meta_title`, `meta_desc`, `meta_data`, `robots`, `list_options`, `medias`,
`translations`.

**The products of a category.** `item_count` counts the items assigned to the category itself.
`item_count_descendants` counts the items assigned to it or to any category below it, at any depth, each item once
however many of those categories it is in. Both count the items the administrator's items list shows by default,
published and unpublished; trashed and archived items are not counted. A category whose items all sit in its
sub-categories reads `item_count` 0 and `item_count_descendants` the number of those items:

```json
{"name": "Mobile phones", "parent_id": 0, "item_count": 0, "item_count_descendants": 128}
```

**Where a category sits.** `ancestors` lists the categories above it from the top down, each with `id`, `name`,
`alias` and `state`; `level` is 1 for a top-level category:

```json
{"name": "MOTOROLA", "parent_id": 7, "level": 2,
 "ancestors": [{"id": 7, "name": "ΚΙΝΗΤΑ ΤΗΛΕΦΩΝΑ", "alias": "kinita-tilefona", "state": 1}]}
```

**Related lists you can send:** `allowedUsers`, `allowedUserGroups`, `robots`.

**Delete.** Only a category in the trash is deleted; any other answers 409. Move it to the trash first (`PATCH`
with `state` -2). A category that has sub-categories, or that is the default category of an item, is refused with
409 and the reason.

## Manufacturers

`v1/alfa/manufacturers`, the five standard routes.

```json
{"translations": {"en_gb": {"name": "Acme Tools"}}, "website": "https://example.com", "state": 1}
```

**A list row holds:** `id`, `name`, `alias`, `website`, `state`, `item_count`, `modified`, `ordering`.

**One record holds also:** `desc`, `meta_title`, `meta_desc`, `meta_data`, `robots`, `medias`, `translations`.

**Delete.** Only a manufacturer in the trash is deleted; any other answers 409. Move it to the trash first (`PATCH`
with `state` -2).

## Item fields

`v1/alfa/itemfields`, the five standard routes. An item field is a property of an item that the shopper sees or
chooses, such as a colour. `type` names the item field plugin that handles it. See
[Item field plugins](../plugins/item-field-plugins.md).

```json
{"translations": {"en_gb": {"name": "Colour"}}, "field_name": "colour", "type": "choice", "state": 1}
```

**A list row holds:** `id`, `field_name`, `name`, `type`, `informational`, `required`, `filterable`,
`searchable`, `show_on_listing`, `state`, `ordering`.

**One record holds also:** `description`, `categories`, `translations`.

**Related lists you can send:** `categories`. Edit a field's values on its page in the administrator: a create or
change that carries `values` or `deleted_value_ids` answers 422 naming them, and nothing is saved; the field is not
checked out.

**Delete.** Only an item field in the trash is deleted; any other answers 409 and nothing is deleted. Move it to the
trash first (`PATCH` with `state` -2). Deleting an item field that items still use (their combinations, offered
options or specifications) is refused with 409 and the reason, and nothing is deleted.

## The storefront's view

Two routes, read only:

| Method and address | What it does |
|---|---|
| `GET v1/alfa/catalog/items` | Lists the items a shopper could see |
| `GET v1/alfa/catalog/items/:id` | One item as the shop shows it |

The token is still needed, and its user needs the permission "Items: View".

Add `lang=` for the language of the texts, and `currency=` and `place=` for the price. Without them the price is
worked out with the shop's defaults, which is wrong for a shop that sells in several currencies.

One item, shortened:

```json
{
  "data": {
    "type": "catalogitems",
    "id": "1",
    "attributes": {
      "id": 1,
      "sku": "DRILL-18V",
      "name": "Cordless drill",
      "stockStatus": "in_stock",
      "categories": {"1": {"name": "Tools", "media": [], "layouts": []}},
      "cartState": {"salable": true, "showNotify": false},
      "price": {
        "base_total": {"amount": "19.90", "formatted": "19,90 €"},
        "tax_total": {"amount": "0.00", "formatted": "0,00 €"},
        "total": {"amount": "19.90", "formatted": "19,90 €"},
        "price": {"amount": "19.90", "formatted": "19,90 €", "minor_units": 1990},
        "currency": {"id": 47, "code": "EUR", "symbol": "€", "decimal_places": 2},
        "discounts": {"count": 0, "has_discounts": false, "applied": []},
        "taxes": {"effective_rate": "0", "count": 0, "applied": []}
      },
      "payment_methods": [],
      "shipment_methods": []
    }
  }
}
```

**A list row holds:** `id`, `name`, `alias`, `sku`, `stock`, `available_quantity`, `stockStatus`, `is_virtual`,
`price`, `medias`, `variant`, `cartState`.

**One record holds also:** `short_desc`, `full_desc`, `meta_title`, `meta_desc`, `gtin`, `mpn`, `manage_stock`,
`stock_action`, `stock_low_message`, `stock_zero_message`, `width`, `height`, `depth`, `weight`, `quantity_min`,
`quantity_max`, `quantity_step`, `categories`, `manufacturers`, `fields`, `options`, `combinations`,
`informational`, `payment_methods`, `shipment_methods`, `publish_up`, `publish_down`.

The price here is worked out when you ask, by the same pricing code as the item page. See
[Pricing](../services/pricing.md).

`price` is `null` for an item with no price for the shopper (no price row applies to the currency, place and
customer group asked), and for an item priced only from a larger quantity than it opens with; the quantity it is
priced from is not published. Such an item is in the list, and a sort by price or by saving lists it after the items
with a price. While the shop shows its catalogue only (Options, Cart, Online sales), `price` is `null` and each
option's `amount` is `null`; the fields and their values are published as when the shop sells.

Each entry of `categories` carries `ancestors` and `level`, as [Categories](#categories) describes them; an
ancestor the shopper may not see is listed by its `id` and `state` only.

## Not documented yet

- The parts of the `price` object one by one, and the `variant`, `combinations` and `cartState` objects.
- How to send combinations and item field values of an item in a write. The API has no supported way to write them.
