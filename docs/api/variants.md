---
sidebar_position: 3
title: Variants and stock
description: "The REST API routes for a product's variants (combinations), options, specifications and item field values, a product written with its whole graph in one request, and stock: adjustments by SKU or by id, applied once under an Idempotency-Key, and the stock records."
---

# Variants and stock

<AlfaVersion verified="2.3.0" />

A product's variants (combinations), options, specifications, item field values and stock are written over the REST API
through the same services the administrator's screens use: a variant through `CombinationService`, an option or a
specification through `ItemOptionService`, a value through `ItemFieldValueService`, stock through `InventoryCommands`. The
rules, the refusals and their sentences are the screens' own.

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
that gives a product or a variant a SKU another one holds answers 409 naming the holder, and nothing is saved:

```json
{"errors": [{"title": "sku: SMX-WHT-512 is the SKU of Smartphone X (Black / 512 GB): a SKU names one product or variant. Nothing was saved.",
  "code": 409}]}
```

A variant's write adds `"source": {"pointer": "/sku"}`, and so does a product written with its graph, where a
variant's SKU points at its place (`/combinations/0/sku`). A product or variant that keeps the SKU it held before the
write is never refused for it, even when another one holds the same SKU: such a SKU stays out of the SKU registry, a
stock adjustment and the stock records' `filter[sku]` find no unit by it (409), and the setup checklist names it until
each has its own. A product saved with Save as Copy in the item screen is saved with its SKU empty when another product
or variant holds that SKU, as its original does, and the screen says so; the copy takes none of the original's
variants, so none of their SKUs.

## Variants

| Route | What it does | Permission |
|---|---|---|
| `GET v1/alfa/items/:id/combinations` | The product's variants, published and unpublished | Items: View |
| `GET v1/alfa/items/:id/combinations/:combinationId` | One variant | Items: View |
| `POST v1/alfa/items/:id/combinations` | A new variant, made by its values | Items: Edit |
| `PATCH v1/alfa/items/:id/combinations/:combinationId` | A change of a variant's fields | Items: Edit |
| `DELETE v1/alfa/items/:id/combinations/:combinationId` | The variant removed | Items: Edit |
| `GET v1/alfa/combinations` | Every product's variants, flat | Items: View |

**Create.** A variant is made by its values, one value of each of the product's variant fields (`field id: value id`,
ids only; a product's graph also names them by `field_name` and code), with the fields it takes:

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

`opening_stock` is the new variant's first stock when its product tracks stock (`stock`, sent too, is taken instead);
for a variant that does not track stock it is not applied, and `meta.warnings` says so.

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

The values are judged as the generator judges them: a field that is an option of the product, a value that is not a
published value of its field, a field that is not a variant field of the product's categories, each answers 422
pointing at it (`/values/5`); values that are not one of each of the product's variant fields answer 422 pointing at
`/values`; values the product already has answer 409 naming that variant. An archived product answers 409, and so does
a product that still holds stock of its own: bring it to zero first. A variant the product once had with the same
values, archived since, comes back. `translations` names the variant in a content language; a variant created without
it has none.

**Change.** `PATCH` takes `sku`, `gtin`, `mpn`, `state` (1 or 0), `default` (`true` only: the variant the product
opens on), `manage_stock` (1, 0, or null to follow the product), `opening_stock` (the figures a variant starts from
when the change switches its stock tracking on), `overrides` (weight, dimensions, quantity rules, stock rules; null
follows the product), `translations` (`{"en_gb": {"name": "White"}}`), `prices` (the variant's rows, a row kept by its
id, a row left out removed; `state` as the read gives it) and `stock` (`[{"location_id": 1, "quantity": "7"}]`, the
figure each location takes). `sku`, `gtin`, `mpn`, an override, a name, `manage_stock` or `prices` left out keeps what
is stored; `""` clears an identifier. A variant's values are what it is: `values` in a `PATCH` answers 422; make the
variant with the new values and remove this one. A stock figure the stock records refuse leaves the rest of the change
saved and is named in `meta.warnings`. The answer is 200 with the variant.

**Remove.** `DELETE` answers 204. A variant that order history names is archived instead, kept as the stock identity its
orders are fulfilled against: 200 with the variant and `meta.note`. A variant that still holds stock answers 409, and so
does any variant while the product itself holds stock.

**The flat list.** `GET v1/alfa/combinations` lists the variants published and unpublished. It takes `filter[sku]`
(exact, letter case aside), `filter[item_id]`, `filter[state]` (1, 0 or 2 for archived) and `page[limit]` (1 to 1,000,
100 by default) with `page[after]`, the last id of the page before; `links.next` carries it. A filter or a page key
that cannot be read answers 400.

## Item field values

| Route | What it does | Permission |
|---|---|---|
| `GET v1/alfa/itemfields/:id/values` | The field's values in their order; `filter[code]` finds one | Item fields: View |
| `GET v1/alfa/itemfields/:id/values/:valueId` | One value | Item fields: View |
| `POST v1/alfa/itemfields/:id/values` | A new value, last in the list unless `ordering` is sent | Item fields: Edit |
| `PATCH v1/alfa/itemfields/:id/values/:valueId` | A change of the keys sent | Item fields: Edit |
| `DELETE v1/alfa/itemfields/:id/values/:valueId` | The value removed | Item fields: Edit |

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/itemfields/5/values" \
  -d '{"code": "silver", "state": 1, "translations": {"en_gb": {"name": "Silver"}, "el_gr": {"name": "Ασημί"}}}'
```

The answer is 201 with `Location` and the value: `id`, `item_field_id`, `code`, `state`, `ordering`, `params` (the field
type's settings of the value) and `name` in the request's language (`lang`, or the shop's default content language);
with `include=translations` every language's `name` and `alias`. A value's `code` is its machine key, unique in its field
(a to z, 0 to 9, `-` and `_`, at most 64 characters); a code another value of the field holds answers 409 at `/code`.
The alias is made from the name; an `alias` sent is left out and named in `meta.warnings`. A new value needs a name in
one language at least.

`DELETE` answers 204. A value a product uses (a variant's value, an option, a specification) answers 409 saying how many
products use it, nothing deleted. A value of another field answers 404.

## Options and specifications

| Route | What it does | Permission |
|---|---|---|
| `GET v1/alfa/items/:id/options` | The product's options in their order | Items: View |
| `GET v1/alfa/items/:id/options/:valueId` | One option | Items: View |
| `POST v1/alfa/items/:id/options` | A value made an option of the product | Items: Edit |
| `PATCH v1/alfa/items/:id/options/:valueId` | Its price change, and its place | Items: Edit |
| `DELETE v1/alfa/items/:id/options/:valueId` | The option removed | Items: Edit |
| `GET v1/alfa/items/:id/informational` | The product's specifications in their order | Items: View |
| `PUT v1/alfa/items/:id/informational` | The specifications replaced | Items: Edit |

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/items/42/options" \
  -d '{"value_id": 71, "operation": "+", "amount": "49.00", "apply_on": "final"}'
```

An option reads `id` (`42-71`), `item_id`, `value_id`, `field_id`, `field_name`, `code`, `name` (the value's),
`operation` (`+`, `-`, `%`, `-%`, or null for an option that changes no price), `amount`, `apply_on` (`start` or
`final` for a fixed amount, or null to follow the shop's setting) and `ordering`; with `include=translations` the
value's texts in every language. A value is offered as an option when its field is published, not informational,
available in the product's categories and not one of the product's variant fields, and the value is published: any
other answers 422 at `/value_id`; a value that is already an option answers 409. An amount finer or larger than an
amount is kept at answers 422 at `/amount`.

`PATCH` changes the parts it sends (`operation`, `amount`, `apply_on`) and keeps the others; `ordering` moves the option
to that place in the list. `DELETE` answers 200 with `removed: true` and `meta.cart_selections_removed`, the selections
of the product's cart lines that chose the option (the lines stay).

`PUT v1/alfa/items/:id/informational` takes `{"value_ids": [80, 81]}`, the values the product shows as its
specifications, in that order; `[]` for none. A value the product does not show yet that is not a published value of
a published informational field answers 422 at its place (`/value_ids/1`); one it already shows is kept.

## A product with its graph

`POST v1/alfa/items` and `PATCH v1/alfa/items/:id` take a product's graph beside its own fields, written with it in one
transaction: `field_values`, `options`, `informational` and `combinations`, each variant with its `stock`.

```bash
curl -X POST -H "X-Joomla-Token: YOUR_TOKEN" -H "Content-Type: application/json" \
  "https://your-shop.example/api/index.php/v1/alfa/items" \
  -d '{
    "sku": "SMX", "state": 1, "manage_stock": 1, "id_category_default": 3, "categories": [3],
    "translations": {"en_gb": {"name": "Smartphone X"}},
    "field_values": [
      {"field": "colour", "code": "silver", "translations": {"en_gb": {"name": "Silver"}}},
      {"field": "warranty", "code": "2y", "translations": {"en_gb": {"name": "Two years"}}}
    ],
    "options": [{"value": {"field": "warranty", "code": "2y"}, "operation": "+", "amount": "49.00"}],
    "informational": [{"field": "material", "code": "aluminium"}],
    "combinations": [
      {"values": {"colour": "silver", "storage": "512gb"}, "sku": "SMX-SLV-512",
       "stock": [{"location_id": 1, "quantity": "5"}]}
    ]
  }'
```

- `field_values`: each
  `{"field": ..., "code": ..., "state": ..., "ordering": ..., "params": {...}, "translations": {...}}`, `field` an
  item field's id or `field_name`. A value the field already has with that code is changed; any
  other is created.
- `options`: each `{"value_id": 71}` or `{"value": {"field": "warranty", "code": "2y"}}` with `operation`, `amount`
  and `apply_on`; `value_id` and `value` each take either form. A value the product already offers has its price change
  set to what is sent (a part left out is none); any other is added.
- `informational`: the specifications in order, each a value's id or `{"field": ..., "code": ...}`; they replace the
  product's list.
- `combinations`: each `{"values": {...}, ...}`, the values as field (id or `field_name`) to value (id or code), and the
  keys a variant's own route takes (`sku`, `gtin`, `mpn`, `state`, `manage_stock`, `default`, `overrides`,
  `translations`, `prices`) and `stock` (`[{"location_id": 1, "quantity": "5"}]`, the figure each location takes). A
  variant the product already has with those values is changed; any other is created.

A value is named by its id as a JSON number above 0, or by its code as text. In `options` and `informational` the code
goes in `{"field": ..., "code": "2y"}`, the field by its id or `field_name` and the code a JSON string (`"code": 512`
answers 422); a string alone, `"71"` among them, names no value there and answers 422. In a variant's `values` the
value stands alone: a number names it by its id, text by its code, so `{"storage": "512"}` names the value whose code is
`512` and `{"storage": 512}` the value whose id is 512.

**The order of resolution.** The values first, then the product itself, then its options and specifications, then its
variants, then their stock: each part can name what an earlier part made, so a request can make a value and use it at
once. A part that cannot be read answers 422 at its pointer, with every other such part, before anything is written.
Then the first part refused answers its refusals, each with its JSON pointer and status, and nothing of the request is
written, the product's own fields included:

```json
{"errors": [{"title": "combinations[0].values.storage.code: The field has no value with the code 512gb. Nothing was saved.",
  "code": 422, "source": {"pointer": "/combinations/0/values/storage/code"}}]}
```

A written graph answers the product with `meta.written`, what each part wrote:

```json
"meta": {"written": {
  "field_values": [{"pointer": "/field_values/0", "field_id": 5, "id": 13, "created": true},
                   {"pointer": "/field_values/1", "field_id": 9, "id": 72, "created": true}],
  "options": [{"pointer": "/options/0", "value_id": 72, "created": true}],
  "informational": [80],
  "combinations": [{"pointer": "/combinations/0", "id": 305, "created": true}],
  "stock": [{"pointer": "/combinations/0/stock/0", "line": 0, "item_id": 42, "combination_id": 305, "location_id": 1,
             "before": 0, "after": 5, "delta": 5, "operation_id": "invop_8c1f2d0e5a7b9c1d3e4f"}]
}}
```

A graph removes nothing: an option, a variant or a value goes through its own `DELETE`. The movements of the stock a
graph sets record the source `api`. The item screen's own lists (`fields`, `combinations_default`,
`deleted_combination_ids`, `deleted_option_value_ids`, `deleted_info_value_ids`, `info_values`, `field_order`,
`field_required`, `item_downloads`) are not keys of the API and answer 422 naming them.

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

**The Idempotency-Key.** Every adjustment carries one, 1 to 255 printable ASCII characters without spaces naming the
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
