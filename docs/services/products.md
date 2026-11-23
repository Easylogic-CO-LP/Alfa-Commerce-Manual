---
sidebar_position: 9
title: Saving a product
description: The one way to save a product from an extension's code, the same save the item screen and the REST API run, and what it answers.
---

# Saving a product

<AlfaVersion verified="2.3.0" />

A product is saved one way: through `ItemWriteService`. The item screen and the REST API's create and update use it,
and an extension's code uses it the same way. The save is the item save the screen runs, with its rules, its refusals
and its one transaction: the product, its texts, prices, categories, images, variants and stock are saved together,
or none of them is. Two parts can be refused on their own once the product is written, its stock figure and the
changes to its variants: the rest is then saved, and the save answers a warning for the part refused.

The items list's quick edit of a name, a SKU or a stock figure, and the REST API's `PATCH v1/alfa/items/units` of
prices and stock, write only those, each on a path of its own.

## The calls

```php
use Alfa\Component\Alfa\Administrator\Service\Catalog\ItemWriteService;

// A new product.
$result = ItemWriteService::create()
    ->set('sku', 'SMX-128')
    ->set('name_en_gb', 'Smartphone X')
    ->set('state', 1)
    ->set('id_category_default', 3)
    ->set('categories', [3])
    ->save();

// A change of one product: what you leave out keeps its stored value.
$result = ItemWriteService::change(42)
    ->set('sku', 'SMX-128-B')
    ->save();

// Several fields at once.
$result = ItemWriteService::change(42)
    ->with(['width' => '12.5', 'height' => '7', 'robots' => 'noindex, follow'])
    ->save();
```

- `create()` starts a new product, `change($id)` a change of product `$id`.
- `set($field, $value)` gives one field and `with($fields)` several. The names are the item form's, those of
  `administrator/forms/item.xml`. A translated field is named by its language: `name_en_gb`, `name_el_gr`.
- `save()` runs the save and answers what it came to.

The fields are checked by the item form, as the screen's are: a filter cleans each value, and a required field left
empty refuses the save. The caller checks its own permission first: the service saves what it is given.

## What a change keeps

On a change, a field you do not give keeps its stored value. That covers the fields the save would otherwise empty
(`categories`, `manufacturers`, `allowedUsers`, `allowedUserGroups`, `prices`, `robots`, `related`) and every
translated field in every language. A list you give replaces the stored one; give `[]` to empty it. The REST API's
`PATCH` keeps what it is not sent by the same list.

## What the save answers

`save()` answers an `ItemWriteResult`:

| Property | What it holds |
| :- | :- |
| `saved` | `true` when the product was saved |
| `id` | The product's id, the new one after a `create()` |
| `refusals` | Why the save was refused, as sentences; nothing was written. Empty when it was saved. |
| `warnings` | What the save did not apply, or applied with a remark, each as `['message' => ..., 'type' => ...]`. For example, a stock figure refused after the product was written, or an address the product shares with another. |
| `tasks` | The ids of the background tasks the save left (a price rebuild, for example) |

```php
if (!$result->saved) {
    foreach ($result->refusals as $reason) {
        // Tell your caller why.
    }
}

foreach ($result->warnings as $warning) {
    // The product is saved; this part was not applied, or was applied with this remark.
}
```

A save with warnings is saved: the product is written with everything else it carried, except what a warning names.
The REST API gives the same warnings in `meta.warnings`.

## One SKU, one product or variant

A SKU names one unit: a product, or one of its variants. A save that gives the product, or one of its variants, a SKU
another product or variant holds is refused, and nothing is written. Letter case does not count: `smx-128` is held
when `SMX-128` is. The refusal is a sentence in `refusals` that names the SKU and the product or variant holding it:
"%1$s is the SKU of %2$s: a SKU names one product or variant. Nothing was saved." (`COM_ALFA_SKU_IN_USE`). A unit
that keeps the SKU it held before the save is never refused for it.

## Saving a variant

An extension's code creates, changes and removes a product's variant (combination) through `CombinationService`. The
variant window and the REST API's variant routes use it; the rules, the refusals and the one transaction are the
window's. Changed stock figures are applied after that transaction, as the window applies them: a figure refused there
leaves the variant saved and comes back as a warning. The item screen's variants grid, saved with the product, and its
Generate panel write variants on paths of their own.

```php
use Alfa\Component\Alfa\Administrator\Service\Catalog\CombinationService;

// A new variant, by one value of each of the product's variant fields (field id => value id).
$result = CombinationService::create(itemId: 42)
    ->values([5 => 12, 6 => 23])
    ->set('sku', 'SMX-WHT-512')
    ->prices([['_mode' => 'adjust', 'operation' => '+', 'value' => '250.00', 'price_status' => '1']])
    ->opening([1 => '5'])
    ->save();

// A change of a variant: the window's fields, publication, the variant the product opens on, stock.
$result = CombinationService::change(itemId: 42, combinationId: 305)
    ->set('sku', 'SMX-WHT-512-EU')
    ->set('state', 0)
    ->stock(figures: [1 => '7'], read: [1 => '5'])
    ->save();

// Removed as the variants' grid removes it.
$result = CombinationService::remove(itemId: 42, combinationIds: [305]);
```

| Call | What it does |
|---|---|
| `create(int $itemId)`, `values(array $values)` | A new variant, made by its values on the generator's rules |
| `change(int $itemId, int $combinationId)` | A change of a variant; its values never change |
| `set(string $field, mixed $value)`, `with(array $fields)` | The window's fields: `sku`, `gtin`, `mpn`, the overrides and quantity rules, `manage_stock`, a name by its language key (`name_en_gb`), `state`, `default`. `sku`, `gtin`, `mpn`, an override, a quantity rule or a name left out keeps its stored value; `''` clears one. |
| `prices(array $rows)` | The variant's price rows, as the window writes them (`_mode` `price` or `adjust`, `price_status`): a row kept by its `id`, a row not sent removed. Without `prices()` the rows stay as they are. |
| `stock(array $figures, array $read)` | Tracked figures by location, each with the figure it was read with |
| `opening(array $figures)` | Opening stock, when the save switches tracking on or the variant is new |
| `from(string $origin)` | `admin`, `api` or `sync`, for the event |
| `refusals()` | What `save()` would refuse, nothing written |
| `save(): CombinationWriteResult` | Saves: `saved`, `id`, `refusals`, `warnings` |
| `remove(int $itemId, array $combinationIds, string $origin = 'admin')` | Removes: refused while a variant holds stock; archived where order history names it. Its result names them in `removed` and, of those, `archived`. |

`onAlfaCombinationsChanged` is raised once for each write of `CombinationService`, after its commit, with the `alfa`
plugin group loaded, to each listener on its own: `itemId()`, `created()`, `changed()`, `archived()`, `removed()`,
`origin()`. The variants grid and the Generate panel do not raise it. `CombinationReader::of(itemId: 42)` and
`CombinationReader::one(itemId: 42, combinationId: 305)` read the variants staff manage, published and unpublished,
with their values, price rows, stock by location, overrides and names.
