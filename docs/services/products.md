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
or none of them is. Some parts can be refused on their own once the product is written: its stock figure, the changes
made in the item screen's variants grid, and its Options and Informational lists. The rest is then saved, and the save
answers a warning for each part refused. A change of the product's stock tracking, or its move into the archive,
refused at that point leaves the product as it was in that respect and is said in the application's message queue,
not in the warnings.

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
way. The save judges every link before anything is written and refuses the whole save, nothing written, for a link
the product cannot take: the product itself, a product that does not exist or is named twice, a combination that is
not a current one of the product, a value of another field or one the product does not take, dimension values no
current combination carries together. `refusals` then holds the sentences of every link refused, in one entry. Values
that name every dimension are stored as their combination. Read an item's links with
`RelatedItems::links($db, $itemId)`.

On the item screen the Related tab is the field `RelatedProducts`: Joomla's repeatable subform of
`administrator/forms/related_link.xml`, each row a product picker and the field `RelatedVariant` (the product's
default, each current combination, or Choose values with a select for each dimension, and a select for each option it
offers). A row whose product changes gets its variant cell from the server, drawn by the field. Both draw com_alfa
layouts a template overrides: `html/layouts/com_alfa/form/field/relatedproducts.php` and
`html/layouts/com_alfa/form/field/relatedvariant.php` in the administrator template. The events are on
[Item and catalogue events](../events/item-and-catalogue-events.md#related-products).

## What the save answers

`save()` answers an `ItemWriteResult`:

| Property | What it holds |
| :- | :- |
| `saved` | `true` when the product was saved |
| `id` | The product's id, the new one after a `create()` |
| `refusals` | Why the save was refused, as sentences; nothing was written. Empty when it was saved. |
| `warnings` | What the save did not apply, or applied with a remark, each as `['message' => ..., 'type' => ...]`. For example, a stock figure refused after the product was written, or an address the product shares with another. |
| `tasks` | The ids of the background tasks the save left (a price rebuild, for example) |
| `written` | What a save with the product's graph wrote, part by part: see [A product with its graph](#a-product-with-its-graph). Empty for a save without one. |
| `refused` | The refusals of a save with the product's graph, as `Refusal` values: see [A product with its graph](#a-product-with-its-graph). |

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
that keeps the SKU it held before the save is never refused for it. A copy (the item screen's Save as Copy,
`asCopyOf($originalId)`) whose SKU another product or variant holds is saved with its SKU empty, and a warning says so;
the copy takes none of its original's variants.

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
| `opening(array $figures)` | Opening stock by location, for a save that switches tracking on. On a new variant whose product already tracks stock they are its first stock, set after the save as `stock()` figures are (a refusal there is a warning); on a new variant that does not track stock they are not applied, and a warning says so. |
| `from(string $origin)` | `admin`, `api` or `sync`, for the event |
| `refusals()` | What `save()` would refuse, nothing written |
| `save(): CombinationWriteResult` | Saves: `saved`, `id`, `refusals`, `warnings` |
| `remove(int $itemId, array $combinationIds, string $origin = 'admin')` | Removes: refused while the variant or the product itself holds stock (on hand, reserved, or owed to an open order line); archived where order history names it. Its result names them in `removed` and, of those, `archived`. |

`onAlfaCombinationsChanged` is raised once for each write of `CombinationService`, after its commit, with the `alfa`
plugin group loaded, to each listener on its own: `itemId()`, `created()`, `changed()`, `archived()`, `removed()`,
`origin()`. The variants grid and the Generate panel do not raise it. `CombinationReader::of(itemId: 42)` and
`CombinationReader::one(itemId: 42, combinationId: 305)` read the variants staff manage, published and unpublished,
with their values, price rows, stock by location, overrides and names.

When a product's whole write carries a variant (see [A product with its graph](#a-product-with-its-graph)), the
variant's catalogue rebuild is left to that write, which rebuilds the product once after its commit.

## Saving options and specifications

A product's options and specifications are written one way: through `ItemOptionService`. The item screen (the Options
and Informational lists saved with the product, the two pickers) and the REST API use it, and an extension's code uses it
the same way.

```php
use Alfa\Component\Alfa\Administrator\Service\Catalog\ItemOptionService;

$result = ItemOptionService::of(itemId: 42)
    ->add(valueId: 71, operation: '+', amount: '49.00', applyOn: 'final')
    ->change(valueId: 72, operation: '%', amount: '10')
    ->remove(valueIds: [73])
    ->order(valueIds: [72, 71])
    ->informational(valueIds: [80, 81])
    ->save();
```

| Call | What it does |
|---|---|
| `of(int $itemId)` | The options and specifications of a product |
| `add(int $valueId, ?string $operation, ?string $amount, ?string $applyOn)` | A value made an option, last in the list, with its price change (`+`, `-`, `%` or `-%` and an amount; none for an option that changes no price) |
| `change(int $valueId, ?string $operation, ?string $amount, ?string $applyOn)` | An option's price change set again |
| `remove(array $valueIds)` | Options removed |
| `order(array $valueIds)` | The options given take the first places, in that order |
| `informational(array $valueIds)` | The product's specifications replaced by the values given, in that order |
| `save(): ItemOptionResult` | Writes every step in one transaction, or none: `saved`, `refusals`, `added`, `changed`, `removed`, `cartSelectionsRemoved` |
| `options(int $itemId)`, `specifications(int $itemId)` | The product's options and specifications as stored |

A value becomes an option when its field is published, not informational, available in the product's categories and
not one of the product's variant fields, and the value is published; a value that is already an option is refused with
409. An amount is exact decimal text, refused when it is finer or larger than an amount is kept at. A specification is a
published value of a published informational field. Each refusal is a `Refusal`: a code, the sentence, a JSON pointer and
a status. Removing an option takes with it its settings of the field type, the selections of the product's cart lines
that chose it (the lines stay; the same value chosen on another product's line stays) and the related links that
preselect it. The product's catalogue (its filter and search rows) is rebuilt after the commit.

## Saving an item field's values

An item field's values are written one way: through `ItemFieldValueService`. The field's Values tab and the REST API use
it, and an extension's code uses it the same way.

```php
use Alfa\Component\Alfa\Administrator\Service\Catalog\ItemFieldValueService;

$result = ItemFieldValueService::of(fieldId: 5)
    ->create(['code' => 'silver', 'name_en_gb' => 'Silver'])
    ->change(valueId: 12, fields: ['name_en_gb' => 'White', 'ordering' => 0])
    ->remove(valueIds: [14])
    ->save();
```

The fields are the Values tab's: a name by its language key (`name_en_gb`; the alias is made from it), `code`, `state`
(1 or 0), `ordering` and `valueparams` (the field type's settings of the value). A value's `code` is its machine key: a
to z, 0 to 9, `-` and `_`, at most 64 characters, unique in its field; empty for none. An ERP names a value by its
field's `field_name` and its code. A new value needs a name in one language at least.

`save(): ItemFieldValueResult` writes every step in one transaction, or none: `saved`, `refusals`, `created` (the new
ids, in the order of the steps), `changed`, `removed`. A value a product uses (a variant's value, an option, a
specification) is not removed: the refusal (409) says how many products use it. A removed value takes with it its texts,
the cart selections that chose it and the related links that preselect it. The products that carry a changed or
removed value have their search rows rebuilt by the catalogue job. `ItemFieldValueService::usage($valueIds)` answers
what depends on values, `read($fieldId)` the field's values with their texts in every language, `byCode($fieldId,
$code)` a value's id by its code.

## A product with its graph

A product is saved with its whole graph in the same save, in one transaction: the values of its item fields, its
options and specifications, its variants and their stock. The steps go on the same `ItemWriteService`:

```php
$result = ItemWriteService::create()
    ->with(['sku' => 'SMX', 'name_en_gb' => 'Smartphone X', 'categories' => [3], 'id_category_default' => 3, 'manage_stock' => 1])
    ->value(field: 'colour', fields: ['code' => 'silver', 'name_en_gb' => 'Silver'])
    ->option(value: ['field' => 'warranty', 'code' => '2y'], operation: '+', amount: '49.00')
    ->informational(values: [['field' => 'material', 'code' => 'aluminium']])
    ->combination(values: ['colour' => 'silver', 'storage' => '512gb'], fields: ['sku' => 'SMX-SLV-512'],
        stock: [['location_id' => 1, 'quantity' => '5']])
    ->from('api')
    ->save();
```

| Call | What it adds |
|---|---|
| `value(int\|string $field, array $fields)` | An item field's value: created, or changed when the field already has a value with the `code` given |
| `option(int\|array $value, ?string $operation, ?string $amount, ?string $applyOn)` | An option: added, or its price change set when the value is already one |
| `informational(array $values)` | The specifications, replaced by the values given in order |
| `combination(array $values, array $fields, ?array $prices, array $stock)` | A variant: created by its values, or changed when the product already has one with those values; its stock figures set |
| `from(string $origin)` | `admin`, `api` or `sync`: the variants' event and the stock movements record it |

`value()`, `option()`, `informational()` and `combination()` also take `pointer`, where the part stands in the
caller's request (`/combinations/0`): its refusals point there.

An option's or a specification's value is named by its id (a number) or by its field (id or `field_name`) and code:
`['field' => 'colour', 'code' => 'silver']`. A variant's values are field (id or `field_name`) to value, where a
number is the value's id and text is its code: `512` names the value with id 512, `'512'` the value whose code is 512.
So a write can make a value and use it in the same call.

**The order of resolution** is fixed: the item fields' values first (`ItemFieldValueService`), then the product itself
(the item save), then its options and specifications (`ItemOptionService`), then its variants (`CombinationService`),
then their stock (`InventoryCommands`, one adjustment). Each step can name what an earlier one made. The first refusal of
any step rolls the whole write back: nothing of the product, its values or its variants is written. A graph removes
nothing: options, variants and values are removed through their own calls.

The result's `written` names what each part wrote: `field_values`, `options` and `combinations`, each entry with its
`pointer`, its `id` (`value_id` for an option; a value's entry also names its `field_id`) and `created` (true when it
was made, false when it was changed); `informational`, the value ids when they were sent; and `stock`, each line
applied. `refused` holds the refusals as `Refusal` values, each with its JSON pointer (`/combinations/0/values/colour`)
and status; `refusals` holds their sentences, each led by its place (`combinations[0].values.colour: ...`).

