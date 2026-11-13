---
sidebar_position: 2
title: Catalogue
description: "The REST API routes for items, categories, manufacturers and item fields in Alfa Commerce 2.2.0, and the storefront's view of an item."
---

# Catalogue

<AlfaVersion verified="2.2.0" />

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

The answer, status 200, shortened:

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
`prices`, `categories`, `manufacturers`, `medias`, `translations`, `fields`, `options`, `combinations`,
`informational`, `created_by`, `modified_by`.

**Related lists you can send:** `categories`, `manufacturers`, `allowedUsers`, `allowedUserGroups`, `prices`,
`robots`. Left out, each stays as it was.

**Delete.** An item that was never sold is removed (204). An item that an order holds stays, archived
(`state` 2), and the answer is still 204.

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

**Delete.** A category that has sub-categories, or that is the default category of an item, is refused with 409
and the reason.

## Manufacturers

`v1/alfa/manufacturers`, the five standard routes.

```json
{"name_en_gb": "Acme Tools", "website": "https://example.com", "state": 1}
```

**A list row holds:** `id`, `name`, `alias`, `website`, `state`, `item_count`, `modified`, `ordering`.

**One record holds also:** `desc`, `meta_title`, `meta_desc`, `meta_data`, `robots`, `medias`, `translations`.

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

**Related lists you can send:** `categories`, `values`.

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
- How to send combinations and item field values of an item in a write.
