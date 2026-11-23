---
sidebar_position: 3
title: Variants and stock
description: "The REST API routes for a product's variants (combinations) and for stock: adjustments by SKU or by id, applied once under an Idempotency-Key, and the stock records."
---

# Variants and stock

<AlfaVersion verified="2.3.0" />

A product's variants (combinations) and its stock are written over the REST API through the same services the
administrator's variant window and stock editors use: a variant through `CombinationService`, stock through
`InventoryCommands`. The rules, the refusals and their sentences are the screens' own.

Every refusal answers 409 when the shop's data stands in the way (a SKU in use, a figure below what open orders
reserve), 422 when the request itself is wrong, or 404 for a product that does not exist or a variant that is not one
of its current variants, with one error a refusal and, where it points into the request, its JSON pointer:

```json
{"errors": [{"title": "lines[1]: The stock at location Default location cannot go below zero. Nothing was changed.",
  "code": 409, "source": {"pointer": "/lines/1"}}]}
```

A key the body does not take is left out and named in `meta.warnings`, code `not_a_field`, with its pointer; the rest of
the request is applied.

## SKUs

A SKU names one product or one variant: no two hold the same SKU, letter case aside, archived ones included. A write
that gives a product or a variant a SKU another one holds answers 409 naming it:

```json
{"errors": [{"title": "sku: SMX-WHT-512 is the SKU of Smartphone X (Black / 512 GB): a SKU names one product or variant. Nothing was saved.",
  "code": 409}]}
```

A variant's write adds `"source": {"pointer": "/sku"}`. A product or variant that keeps the SKU it held before the
write is never refused for it, even when another one holds the same SKU: such a SKU stays out of the SKU registry, the
REST API finds no unit by it, and the setup checklist names it until each has its own.

## Variants

| Route | What it does | Permission |
|---|---|---|
| `GET v1/alfa/items/:id/combinations` | The product's variants, published and unpublished | Items: View |
| `GET v1/alfa/items/:id/combinations/:combinationId` | One variant | Items: View |
| `POST v1/alfa/items/:id/combinations` | A new variant, made by its values | Items: Edit |
| `PATCH v1/alfa/items/:id/combinations/:combinationId` | A change of a variant's fields | Items: Edit |
| `DELETE v1/alfa/items/:id/combinations/:combinationId` | The variant removed | Items: Edit |
| `GET v1/alfa/combinations` | Every product's variants, flat | Items: View |

**Create.** A variant is made by its values, one value of each of the product's variant fields (`field id: value id`),
with the fields it takes:

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/items/42/combinations" \
  -d '{
    "values": {"5": 12, "6": 23},
    "sku": "SMX-WHT-512",
    "gtin": "5201234567893",
    "mpn": "SMX512W",
    "state": 1,
    "prices": [{"mode": "adjust", "operation": "+", "value": "250.00", "currency_id": 0, "state": 1}],
    "opening_stock": [{"location_id": 1, "quantity": "5"}]
  }'
```

The answer is 201 with `Location` and the variant as a read gives it, shortened:

```json
{
  "data": {
    "type": "combinations",
    "id": "305",
    "attributes": {
      "id": 305,
      "item_id": 42,
      "signature": "12-23",
      "values": [{"field_id": 5, "field_name": "colour", "value_id": 12}, {"field_id": 6, "field_name": "storage", "value_id": 23}],
      "sku": "SMX-WHT-512",
      "gtin": "5201234567893",
      "mpn": "SMX512W",
      "state": 1,
      "default": false,
      "ordering": 4,
      "manage_stock": null,
      "stock": 5,
      "available_quantity": 5,
      "stock_by_location": [{"location_id": 1, "quantity": 5, "reserved_quantity": 0}],
      "prices": [{"id": 912, "mode": "adjust", "operation": "+", "value": "250.00000000", "state": 1}],
      "overrides": {"weight": null, "width": null, "height": null, "depth": null, "quantity_min": null},
      "translations": {}
    }
  }
}
```

The values are judged as the generator judges them: a field that is an option of the product, a value that is not
published, a field that is not a variant field of the product's categories, each answers 422 pointing at it
(`/values/5`); values that are not one of each of the product's variant fields answer 422 pointing at `/values`;
values the product already has answer 409 naming that variant. An archived product answers 409. A variant the product
once had with the same values, archived since, comes back. `translations` names the variant in a content language;
a variant created without it has none.

**Change.** `PATCH` takes `sku`, `gtin`, `mpn`, `state` (1 or 0), `default` (true: the variant the product opens on),
`manage_stock` (1, 0, or null to follow the product), `opening_stock` (the figures a variant starts from when the
change switches its stock tracking on), `overrides` (weight, dimensions, quantity rules, stock rules; null follows the
product), `translations` (`{"en_gb": {"name": "White"}}`), `prices` (the variant's rows, a row kept by its id, a row
left out removed; `state` as the read gives it) and `stock` (`[{"location_id": 1, "quantity": "7"}]`, the figure each
location takes). `sku`, `gtin`, `mpn`, an override, a name, `manage_stock` or `prices` left out keeps what is stored;
`""` clears an identifier.
A variant's values are what it is: `values` in a `PATCH` answers 422; make the variant with the new values and remove
this one. A stock figure the stock records refuse leaves the rest of the change saved and is named in
`meta.warnings`. The answer is 200 with the variant.

**Remove.** `DELETE` answers 204. A variant that order history names is archived instead, kept as the stock identity its
orders are fulfilled against: 200 with the variant and `meta.note`. A variant that still holds stock answers 409.

**The flat list.** `GET v1/alfa/combinations` lists the variants published and unpublished. It takes `filter[sku]`
(exact, letter case aside), `filter[item_id]`, `filter[state]` (1, 0 or 2 for archived) and `page[limit]` (1 to 1,000,
100 by default) with `page[after]`, the last id of the page before; `links.next` carries it. A filter or a page key
that cannot be read answers 400.

## Stock adjustments

`POST v1/alfa/inventory/adjustments` sets or corrects stock. The body holds `reason` (at most 255 characters, left out
for none) and `lines`, 1 to 500. Each line names a unit by `sku`, or by `item_id` and `combination_id` (0 or left out
for the product itself), a `location_id` (the default location when left out) and either `set` (the figure the record
takes) or `delta` (a signed change, positive for goods received), each a decimal of at most 8 places such as `"7"`:

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  -H "Idempotency-Key: erp-stock-2026-11-23-000123" \
  "https://your-shop.example/api/index.php/v1/alfa/inventory/adjustments" \
  -d '{
    "reason": "ERP stock sync",
    "lines": [
      {"sku": "SMX-WHT-512", "location_id": 1, "set": "7"},
      {"item_id": 42, "combination_id": 301, "delta": "-2"}
    ]
  }'
```

Every line is judged first, as the stock editors judge a figure: a `set` line by its unit (the archive, the unit's
tracking, the integrity of its figures) and its figure (the location, what open orders reserve, the floor at zero); a
`delta` line by its unit, and by its location, the reservations and the floor when it is applied. All are applied in
one transaction: every line, or none. The answer, 200, gives each line's figure before and after, the change, the
operation that recorded it and the unit's available quantity:

```json
{
  "data": {
    "type": "inventoryadjustments",
    "id": "erp-stock-2026-11-23-000123",
    "attributes": {
      "lines": [
        {"line": 0, "item_id": 42, "combination_id": 305, "location_id": 1, "before": 5, "after": 7, "delta": 2,
         "operation_id": "invop_8c1f2d0e5a7b9c1d3e4f", "available_quantity": 7},
        {"line": 1, "item_id": 42, "combination_id": 301, "location_id": 1, "before": 9, "after": 7, "delta": -2,
         "operation_id": "invop_8c1f2d115a7b9c1d3e50", "available_quantity": 4}
      ]
    }
  }
}
```

The movements record the source `api`, the key as their correlation (its sha256 when it is longer than 64
characters), the reason as their note and the token's user:
`GET v1/alfa/inventorymovements?filter[operation_id]=invop_8c1f2d0e5a7b9c1d3e4f` lists what a line moved. A line whose
figure was already true has no operation (`operation_id` null). Each line that moved stock announces
`onInventoryAdjusted` to plugins.

**The Idempotency-Key.** Every adjustment carries one, 1 to 255 printable characters without spaces naming the
request; a request without one, or with a key of another form, answers 422. The same request sent again with the same
key answers the first one's lines with `"meta": {"replayed": true}` and changes nothing, so a request whose answer was
lost is sent again safely. The same key with another body answers 422. A request whose key's first request is still
running waits for it and answers its result, or answers 409 with `Retry-After` after ten seconds. A refused request
keeps no key: send it again, corrected, with the same key. Keys are each API user's own and are kept 30 days.

**Permission.** Items: Edit, the permission of the stock editors.

## Stock records

`GET v1/alfa/inventory/stock` lists the stock records, one a unit and location: `id`, `item_id`, `combination_id`,
`location_id`, `location_title`, `quantity` on hand, `reserved_quantity` held by open orders, and `available` there.
Filters: `filter[sku]`, `filter[item_id]`, `filter[combination_id]` (0 for the product's own records),
`filter[location_id]`; `page[limit]` (1 to 1,000, 100 by default) with `page[after]`, the last record's id;
`links.next` carries it. A SKU that names no unit answers 400, one held by more than one unit, archived or held by its
variants 409. Permission: Items: View.

`GET v1/alfa/inventorymovements` takes `filter[combination_id]`, `filter[operation_id]` and `filter[source_type]`
beside its other filters (see [Stock movements](./customers-and-configuration.md#stock-movements)). Movements are the
ledger's record of what a command did: they are read only.
