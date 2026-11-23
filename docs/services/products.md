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

## Related products

`related` is the list of products the item's page shows after it, in order, each a `RelatedLink`: the product, one of
its combinations, or values chosen for some of its fields (its dimensions' values and the options it offers).

```php
use Alfa\Component\Alfa\Administrator\Service\Catalog\ItemWriteService;
use Alfa\Component\Alfa\Administrator\Service\Catalog\RelatedLink;

$result = ItemWriteService::change(120)
    ->set('related', [
        RelatedLink::to(42)->onCombination(304)->withValue(7, 71), // White / 256 GB with the two-year warranty
        RelatedLink::to(57)->withValue(5, 12),                      // White, any storage
        RelatedLink::to(63),                                        // on its default
    ])
    ->save();
```

A row of the record's shape, `['item_id' => 42, 'combination_id' => 304, 'values' => [7 => 71]]`, is taken the same
way. The save judges every link before anything is written and refuses the whole save, each refusal in `refusals`,
for a link the product cannot take: a product named twice, a combination that is not a current one of the product,
a value of another field or one the product does not take, dimension values no combination carries together. Values
that name every dimension are stored as their combination. Read an item's links with
`RelatedItems::links($db, $itemId)`. The events are on [Item and catalogue events](../events/item-and-catalogue-events.md#related-products).

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
