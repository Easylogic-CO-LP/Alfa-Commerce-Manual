---
sidebar_position: 9
title: Saving a product
description: The one way to save a product from an extension's code, the same save the item screen and the REST API run, and what it answers.
---

# Saving a product

A product is saved one way: through `ItemWriteService`. The item screen and the REST API use it, and an extension's
code uses it the same way. The save is the item save the screen runs, with its rules, its refusals and its one
transaction: the product, its texts, prices, categories, images and stock are saved together, or none of them is.

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

On a change, a field you do not give keeps its stored value. That covers the lists the save would otherwise empty
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

A save with warnings is saved: the product and everything else it carried are written. The REST API gives the same
warnings in `meta.warnings`.

## Saving a variant

A product's variant (combination) is created, changed and removed one way: through `CombinationService`. The variant
window and the REST API use it, and an extension's code uses it the same way; the rules, the refusals and the one
transaction are the window's.

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
| `set(string $field, mixed $value)`, `with(array $fields)` | The window's fields: `sku`, `gtin`, `mpn`, the overrides and quantity rules, `manage_stock`, a name by its language key (`name_en_gb`), `state`, `default` |
| `prices(array $rows)` | The variant's price rows, as the window writes them |
| `stock(array $figures, array $read)` | Tracked figures by location, each with the figure it was read with |
| `opening(array $figures)` | Opening stock, when the save switches tracking on or the variant is new |
| `from(string $origin)` | `admin`, `api` or `sync`, for the event |
| `refusals()` | What `save()` would refuse, nothing written |
| `save(): CombinationWriteResult` | Saves: `saved`, `id`, `refusals`, `warnings` |
| `remove(int $itemId, array $combinationIds)` | Removes: refused while a variant holds stock; archived where order history names it |

`onAlfaCombinationsChanged` is raised once a write, after its commit: `itemId()`, `created()`, `changed()`,
`archived()`, `removed()`, `origin()`. `CombinationReader::of(itemId:)` and `CombinationReader::one(itemId:,
combinationId:)` read the variants staff manage with their values, price rows, stock by location, overrides and names.
