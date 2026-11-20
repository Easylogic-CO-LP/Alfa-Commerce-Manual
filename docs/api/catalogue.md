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
    "name_en_gb": "Cordless drill",
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

**Stock.** Stock is not a field to overwrite. A stock figure in the body is an instruction to the stock service
and counts only when the body carries `stock`. See [Stock](../services/stock.md).

**A list row holds:** `id`, `name`, `alias`, `sku`, `gtin`, `mpn`, `state`, `stock`, `available_quantity`,
`manage_stock`, `stock_action`, `is_virtual`, `combination_count`, `id_category_default`, `category_ids`,
`manufacturer_ids`, `publish_up`, `publish_down`, `modified`, `ordering`.

**One record holds also:** `short_desc`, `full_desc`, `meta_title`, `meta_desc`, `quantity_min`, `quantity_max`,
`quantity_step`, `stock_low`, `backorder`, `min_qty`, `width`, `height`, `depth`, `weight`, `meta_data`, `robots`,
`prices`, `prices_state`, `categories`, `manufacturers`, `medias`, `translations`, `fields`, `options`, `combinations`,
`informational`, `created_by`, `modified_by`. Each combination in `combinations` holds its own `prices_state`, the
state of its own price rows, for [Many units in one request](#many-units-in-one-request).

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
`deleted_option_value_ids`, `deleted_info_value_ids`, `info_values`, `field_order`, `field_required` and
`item_downloads`. For a body that carries `options`, the reason reads: "options cannot be written through the API: an
item's options, combinations, item field values and downloads are edited on its page in the administrator. Send the
item without them; nothing was saved."

The list also takes `filter[stock]` and `filter[fields]`. See
[The filters of each list](./overview.md#the-filters-of-each-list).

**Delete.** An item is deleted only while it is in the trash. Move it there first with a `PATCH` of `state` -2; an
item in any other state answers 409 and nothing is deleted. An item that was never sold is then removed (204). An
item that an order holds stays, archived (`state` 2), and the answer is 200 with the item and `meta.note` saying
that it was archived instead of deleted.

## Many units in one request

`PATCH v1/alfa/items/units` writes the prices and the stock of up to 100 units in one request. A **unit** is a product
without combinations, or one combination of a product. It asks the permission to edit items, as a change of one item
does.

```bash
curl -X PATCH -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/items/units" \
  -d '{
    "units": [
      {"item_id": 12, "prices": [{"id": 31, "value": "21.00", "currency_id": 47, "quantity_start": 1}],
       "prices_state": "3f9c0d0b3b1e4c6c8f0a5d2e7b9a1c44", "stock": "7"},
      {"item_id": 15, "combination_id": 4, "prices": [{"mode": "price", "value": "31.00", "currency_id": 0}],
       "stock": "4"},
      {"item_id": 18, "inventory_stock": {"1": "3", "2": "2"}}
    ]
  }'
```

Each unit takes:

| Key | What it is |
|---|---|
| `item_id` | The product. Required. |
| `combination_id` | The combination; 0 or left out for the product itself. |
| `prices` | The unit's own price rows, all of them: the rows as a change of one item sends them. A row with the `id` of one of the unit's rows changes it, a row without an `id` is added, and the unit's rows not sent are removed. `[]` removes them all. A combination's row may be of the mode `price` (its own price) or `adjust` (a change of the product's price, with `operation` `+`, `-`, `%` or `-%`); a product's own rows are of the mode `price`. |
| `prices_state` | The state the unit's prices were read in (the item's `prices_state`, or the combination's in `combinations`). Sent only with `prices`. |
| `stock` | The unit's stock as one figure of 0 or more, at the shop's default location, for a shop that keeps stock at one location. A shop with more locations takes `inventory_stock`. |
| `inventory_stock` | The unit's stock by location, an object of location id to figure, `{"1": "3", "2": "2"}`. Not with `stock`. |

Each unit is written whole or not at all, on its own: a unit that cannot be written is refused alone, and the others
are written. A stock figure is the unit's whole stock there, not a change: the shop moves the stock to it as a stock
correction would, so a sale made meanwhile is not lost.

The answer is 200 when the request could be read, with one answer a unit in the order of the request:

```json
{
  "data": [
    {"type": "units", "id": "0", "attributes": {"pointer": "/units/0", "status": 200, "item_id": 12,
      "combination_id": 0, "prices_state": "a41d...", "stock": "7", "available_quantity": "7"}},
    {"type": "units", "id": "1", "attributes": {"pointer": "/units/1/prices_state", "status": 409, "item_id": 15,
      "combination_id": 4, "title": "The unit's prices changed since you read them (prices_state). Read them again. Nothing of this unit was saved."}}
  ]
}
```

A written unit answers its new `prices_state` and its stock. A refused unit answers the status it would have had
alone (404 for a product or a combination that does not exist, 409 for prices changed since or stock that orders hold,
422 for a value that cannot be taken) and the reason, and its `pointer` names what was refused in the request, as a
JSON pointer: `/units/1/prices_state`, `/units/3/stock`. A unit named twice in one request is refused the second
time.

The whole request is refused with 422, and nothing is written, when the body is not `{"units": [...]}` with 1 to 100
units.

The price index, which the storefront's lists read, is brought up to date once for all the products whose prices were
written, after the last unit. A product it cannot bring up to date at once is done by the shop's background work
shortly after. Each change is told to the [outgoing notifications](./notifications.md) as a change of one item is.

## Categories

`v1/alfa/categories`, the five standard routes.

```json
{"name_en_gb": "Tools", "parent_id": 0, "state": 1}
```

**A list row holds:** `id`, `name`, `alias`, `parent_id`, `state`, `item_count`, `publish_up`, `publish_down`,
`modified`, `ordering`.

**One record holds also:** `desc`, `meta_title`, `meta_desc`, `meta_data`, `robots`, `list_options`, `medias`,
`translations`.

**Related lists you can send:** `allowedUsers`, `allowedUserGroups`, `robots`.

**Delete.** Only a category in the trash is deleted; any other answers 409. Move it to the trash first (`PATCH`
with `state` -2). A category that has sub-categories, or that is the default category of an item, is refused with
409 and the reason.

## Manufacturers

`v1/alfa/manufacturers`, the five standard routes.

```json
{"name_en_gb": "Acme Tools", "website": "https://example.com", "state": 1}
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
{"name_en_gb": "Colour", "field_name": "colour", "type": "choice", "state": 1}
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

## Not documented yet

- The parts of the `price` object one by one, and the `variant`, `combinations` and `cartState` objects.
- How to send combinations and item field values of an item in a write. The API has no supported way to write them.
