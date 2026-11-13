---
title: Item field plugin events
description: "Every event an item field plugin receives in Alfa Commerce 2.2.0: when it fires, what it is given and what it must do."
---

# Item field plugin events

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Item field plugins](./item-field-plugins.md): the guide itself
- [Item field plugin events](./item-field-plugin-events.md)
- [A complete item field plugin](./item-field-plugin-example.md)

In every card, "the field" is the field as staff defined it, with these properties among others: `id`, `type`,
`field_name`, `display_name`, `informational`, `params_decoded` and `values` (the values of the pool, each with
`id`, `display_name` and `params_decoded`).

## onItemView

**When it fires.** When Alfa prepares an item page, once for each field of the item. Also when staff open the
popup that configures an item for an order in the administrator.

**Who receives it.** One plugin (targeted): the plugin of the field's type.

**What you are given.** An `ItemViewEvent` (`Alfa\Component\Alfa\Administrator\Event\ItemFields\ItemViewEvent`).

| Getter | What it returns |
|---|---|
| `getItem()` | The item. Among its properties: `variant` (what the shopper's picks led to, see the sample), `options` (the values the item offers as extras), `selectedOptionValueIds`, `informational`. |
| `getField(): object` | The field |
| `getConfig(): Registry` | The settings your plugin stored for this field on this item. Empty when none. |
| `getCurrentValue()` | The composition already stored for this field, when the shopper or staff edit an existing line. `null` otherwise. |
| `getSelections(): array` | What is chosen across all fields now: `['sel' => [field id => value id], 'opt' => [value ids]]` |
| `getSelectedValueIds(): int[]` | The same, as one flat list of value ids |

**What you are expected to do.** Pick the place of the page, name a layout, pass its data:

```php
$event->buyForm()
    ->setLayout('item-radio')
    ->variantSelector($fieldId)
    ->setData(['field' => $field, 'values' => $field->values]);
```

The places of the item page, each returning a builder:

| Method | Place |
|---|---|
| `buyForm()` | Inside the buy form. This is where a control the shopper answers goes. |
| `specifications()` | The read only specifications block |
| `title()`, `image()` | Beside the title, on the image |
| `shortDescription()`, `fullDescription()` | In the description blocks |
| `nearAddToCart()` | Next to the add to cart button |

The builder's methods:

| Method | Meaning |
|---|---|
| `setLayout(string $layout)` | The layout file's name, without `.php` |
| `setData(array\|object $data)` | The data the layout receives |
| `variantSelector(int $fieldId)` | "This place holds the control of a variant field." Alfa adds `inputName` (`sel[<field id>]`) and `reloadScope` (`item`) to the layout's data. A change reloads the whole item. |
| `optionSelector(int $fieldId)` | "This place holds the control of an option." Alfa adds `inputName` (`opt[<field id>]`) and `reloadScope` (`price`). A change only prices again. |
| `setPluginType()`, `setPluginName()` | Rarely needed: render another plugin's layout |

Your layout must give its input the name in `$inputName` and the attribute `data-item-reload` with
`$reloadScope`. Declare `variantSelector()` only for a field that is a dimension of the item's combinations, and
`optionSelector()` only for one that is not.

You may also replace the add to cart area of the page with `setCartLayout(string $layout)` and
`setCartLayoutData(array|object $data)`, or add a block beside it with `setCartChildLayout()` and
`setCartChildLayoutData()`. When several fields replace the area, the last one wins.

**What happens next.** Alfa collects the places of every field in order, and the item template renders them. A
[field condition](./form-field-plugins.md#field-conditions-showon) set on the item field is applied around your
layout by Alfa.

**If you are missing or you fail.**

| What is wrong | What Alfa does |
|---|---|
| The plugin is disabled, missing or cannot be loaded | The field is not drawn. The page shows without it. |
| The selector kind does not match the field's use | On a site in debug mode, an error. Otherwise a warning in Joomla's log, category `alfa-item-fields`. |
| The layout file does not exist | Your layout is not drawn. Alfa falls back to a default layout of its own or to nothing. In debug mode a warning names the missing file. |
| Your method throws an error | Alfa does not catch it at this point. Do not let an error leave `onItemView`. |

## onItemListPrepare

**When it fires.** When Alfa builds a card of an item list, once for each field of the item that has "Show on
listings" on. A card can be built twice in one request, so act only through the event.

**Who receives it.** One plugin (targeted): the plugin of the field's type.

**What you are given.** An `ItemListPrepareEvent`.

| Getter | What it returns |
|---|---|
| `getItem(): object` | The item of the card |
| `getField(): object` | The field |

**What you are expected to do.** The same as on the item page, with the places a card has: `buyForm()`,
`specifications()`, `title()` and `image()`. The builder and the cart area methods are the same.

**What happens next.** The card renders your layout. If a field the shopper must answer drew no control on the
card, Alfa turns the card's button into a "Choose options" link to the item page. A cart area your plugin set is
never replaced by that link.

**If you are missing or you fail.** A missing plugin draws nothing, and the same log line is written for it. An
error you throw is written to Joomla's log (category `com_alfa`) with the field's type, and the card keeps its
normal add to cart area.

## onItemsListPrepare

**When it fires.** Once per item list, after every card is fully built. Also after a single card is reloaded.

**Who receives it.** Everyone (broadcast). The base class already subscribes your plugin. It arrives whether or
not the list contains a field of your type.

**What you are given.** An `ItemsListPrepareEvent` with one getter, `getItems(): array`, the items of the page.

**What you are expected to do.** Change the items directly when you need something across cards. The event has
no setters.

**What happens next.** The list is rendered with the items as you left them.

**If you are missing or you fail.** An error you throw is written to Joomla's log (category `com_alfa.plugins`).
The other listeners still run and the list is shown.

## onItemFieldValueFacetGroups

**When it fires.** When Alfa builds the filters of an item list, once for each field, never once per value.

**Who receives it.** One plugin (targeted), and only when your class has this method.

**What you are given.** A `ValueFacetGroupsEvent`.

| Getter | What it returns |
|---|---|
| `getField(): object` | The field |
| `getValues(): array` | The field's values, keyed by value id. Each is an array with at least `id`, `name` and `params`. |

**What you are expected to do.** Say which **groups** a value belongs to, when several values should be offered
as one filter entry. The shipped `choice` plugin uses it to offer "Blue", "Navy Blue" and "Blue and Red" under
one colour.

| Method | Meaning |
|---|---|
| `putValueGroups(int $valueId, array $groups)` | The groups of one value. Each group is an array: `type` and `id` (yours to choose, Alfa only compares them), `label`, and optionally `layout`, `layoutData` and `ordering`. A value can be in several groups. |
| `putValueLayout(int $valueId, string $layout, array $data = [])` | How one value draws itself when it is listed alone |
| `putFieldGrouping(bool $grouping)` | Whether this field wants its values grouped |

**What happens next.** Alfa builds the filter entries, the counts and the query from your answer. You never write
SQL or HTML for a filter.

**If you are missing or you fail.** Each value is offered alone. An error you throw is written to Joomla's log
(category `com_alfa`) and has the same result.

## onValidateCartAdd

**When it fires.** When an item is added to the cart, and when staff save an order line, after Alfa's own checks:
a combination is chosen, and every required field has an answer. Once for each field of the item.

**Who receives it.** One plugin (targeted).

**What you are given.** A `ValidateCartAddEvent`.

| Getter | What it returns |
|---|---|
| `getItem(): object`, `getField(): object` | The item and the field |
| `getPayload(): string` | The composition sent for this field, as text, exactly as the browser sent it. Never trust it. Empty when none. |
| `getConfig(): Registry` | The settings of this field on this item |
| `getQuantity(): float` | The quantity asked for |
| `getSelections()`, `getSelectedValueIds()` | What is chosen across all fields |

**What you are expected to do.** If the choice is not acceptable, call `setError(string $message)` with a
translated sentence for the shopper. Otherwise do nothing.

**What happens next.** With an error, the item is not added and the shopper sees your sentence. Without one, Alfa
goes on.

**If you are missing or you fail.** A missing plugin takes no part, except for a required field: an item with a
required field whose plugin is unavailable cannot be added, and the shopper is told. An error you throw is
written to Joomla's log (category `com_alfa.cart`), the item is not added, and the shopper sees a general
"invalid selection" message.

:::note
`ValidateCartAddEvent` also has `setSnapshot()` and `setPriceImpact()`. In 2.2.0 nothing reads what they set.
Store data with `onPrepareForCart` and change the price with `onCalculateItemPrice`.
:::

## onPrepareForCart

**When it fires.** After the checks above and before the cart line or the order line is written, for a field
that takes a composition and was sent one.

**Who receives it.** One plugin (targeted), and only when your class has this method. Having the method is also
how your plugin says that its fields take a composition at all. A composition sent for a field whose plugin has
no such method is refused before anything is stored.

**What you are given.** A `PrepareForCartEvent`.

| Getter | What it returns |
|---|---|
| `getItem(): object`, `getField(): object` | The item and the field |
| `getPayload(): string` | The full composition as the browser sent it. Never trust it. |
| `getFiles(): array` | The files uploaded for this field: slot to one file array (`name`, `type`, `tmp_name`, `error`, `size`) |
| `getConfig(): Registry` | The settings of this field on this item |
| `getSelections()`, `getSelectedValueIds()` | What is chosen across all fields |

**What you are expected to do.** Check the composition, move uploaded files to where you keep them, and call
`setStoredPayload(array|string $payload)` with what should be stored. An array is stored as JSON. To refuse, call
`setError(string $message)`.

**What happens next.** Alfa stores your answer on the cart line (`#__alfa_cart_item_fields.payload`). It comes
back to you as `getPayload()` in `onCalculateItemPrice`, as `getSnapshot()` in `onCartItemView` and as
`getCurrentValue()` in `onItemView`. If you set nothing, the composition is stored as sent.

**If you are missing or you fail.** With `setError()`, the line is not written and the shopper sees your sentence.
An error you throw is written to Joomla's log (category `com_alfa.cart`) and the shopper sees a general "invalid
selection" message.

On the storefront the browser sends a composition as `conf[<field id>]`.

## onCalculateItemPrice

**When it fires.** Each time Alfa works out the price of an item for which at least one composition exists: on
the item page while the shopper builds one, and for a cart line that carries one. It then fires once for each
field of the item, also for the fields without a composition. It does not fire when there is no composition at
all, which is the case for the cards of an item list.

**Who receives it.** One plugin (targeted).

**What you are given.** A `CalculateItemPriceEvent`.

| Getter | What it returns |
|---|---|
| `getItem(): object`, `getField(): object` | The item and the field |
| `getPayload(): mixed` | The composition for this field. `null` when this field has none. |
| `getConfig(): Registry` | The settings of this field on this item |
| `getContext(): ?object` | The pricing context (currency, place, customer group, quantity), when there is one |
| `getSelections()`, `getSelectedValueIds()` | What is chosen across all fields |

**What you are expected to do.** Add price lines. A line says what to do, not what the result is:

```php
$event->contribution('engraving.text')
    ->label('Engraving')
    ->add(5.00)
    ->onGross();
```

| Method of the line | Meaning |
|---|---|
| `label(string $label)` | The text shown in the price breakdown. Required. |
| `add(float $amount)`, `subtract(float $amount)` | Add or take off an amount of money |
| `percent(float $percent)`, `subtractPercent(float $percent)` | Add or take off a percentage |
| `onNet()`, `onGross()` | Apply to the price before tax, or to the price with tax |
| `sortOrder(int $sortOrder)` | Lines with a lower number are applied first |

The first argument of `contribution()` is a code of your own that identifies the line. Work the amount out on the
server from `getConfig()` and the composition. Never take an amount from the browser.

**What happens next.** Alfa applies the lines of all fields in order, and each appears as a step of the price
breakdown.

**If you are missing or you fail.** An error you throw is written to Joomla's log (category `com_alfa.pricing`)
and the price is worked out without your lines. On a site in debug mode the error is shown instead. When the
plugin is unavailable, see "When the plugin is unavailable" below.

:::note
`CalculateItemPriceEvent` also has `setOverrideFinal()`. In 2.2.0 nothing reads what it sets.
:::

## onCartItemView

**When it fires.** When Alfa prepares a cart line for display, once for each field choice the line carries.

**Who receives it.** One plugin (targeted).

**What you are given.** A `CartItemViewEvent`.

| Getter | What it returns |
|---|---|
| `getLine()` | The cart line |
| `getField(): object` | The field |
| `getSnapshot(): array` | The composition stored for this field on this line. Empty when none. |
| `getConfig(): Registry` | The settings of this field on this item |

**What you are expected to do.** Only if you want your own look: `$event->main()->setLayout(...)->setData(...)`.
`main()` is the one place a cart line has.

**What happens next.** If you set no layout, Alfa draws the field as "label: value" itself.

**If you are missing or you fail.** A missing plugin gets the standard "label: value". Alfa does not catch an
error you throw at this point. Do not let an error leave `onCartItemView`.

## onGetFieldActions

**When it fires.** When the administrator draws a row that your field belongs to: a combination or an option on
the item's edit screen.

**Who receives it.** One plugin (targeted).

**What you are given.** A `GetFieldActionsEvent`.

| Getter | What it returns |
|---|---|
| `getScope(): string` | Which kind of row: `item`, `combination`, `option` or `order` |
| `getScopeId(): int` | The row's id |
| `getItemId(): int` | The item |
| `getField(): object` | The field |

**What you are expected to do.** Offer buttons:

```php
$event->add('configure', 'Configure')->icon('cog')->readOnly();
```

`add(string $id, string $label)` returns the button. Its methods include `icon()`, `css()`, `confirm()`,
`tooltip()`, `priority()`, `disabled()`, `readOnly()` and `mutating()`. A button changes data unless you mark it
`readOnly()`. A button that only opens a popup is read only.

**What happens next.** Alfa draws the buttons on the row. A click runs `onExecuteFieldAction`.

**If you are missing or you fail.** No buttons, and staff see a warning on the screen. An error you throw is
shown to staff the same way.

## onExecuteFieldAction

**When it fires.** When staff click one of your buttons, or a button inside your popup.

**Who receives it.** One plugin (targeted). Staff need the permission to edit items, and for an order row the
permission to edit orders.

**What you are given.** An `ExecuteFieldActionEvent`.

| Getter | What it returns |
|---|---|
| `getAction(): string` | The id of the action |
| `getScope()`, `getScopeId()`, `getItemId()`, `getField()` | The row, as in `onGetFieldActions` |
| `getData(): array` | What the browser sent with the click, for example the values of your popup's form |

**What you are expected to do.** Produce an outcome on the event:

| Method | Outcome |
|---|---|
| `setLayout(string $layout)`, `setLayoutData(array $data)` | Show one of your layouts in a popup |
| `setModalTitle(string $title)` | The popup's title |
| `addButton(string $label, array $opts = [])` | A footer button of the popup. Without options it closes. `['reload' => true]` closes and reloads. `['action' => 'id']` runs another of your actions in the same popup. |
| `setMessage(string $message)` | Report a result |
| `setError(string $message)` | Report a failure |
| `setRefresh(bool $refresh)` | Reload the screen afterwards |
| `setRedirectUrl(string $url)` | Send staff to another page |
| `setPayload(array $payload)` | Data for your own script |

Read and write the row's settings with `$this->getConfig($event)` and `$this->saveConfig($event, $config)`.

**What happens next.** Alfa shows your outcome. An action that changes data runs only from a POST request, and on
the action page only with a one time key, so a reloaded page cannot run it twice.

**If you are missing or you fail.** Staff see an error saying that the plugin is not available. An error you
throw is shown to staff as the action's failure.

## onClearData

**When it fires.** When staff use Clear Data or "Remove extension and its data" for your plugin under Tools:
Extensions, or "Clear everything".

**Who receives it.** One plugin (targeted), and only when your class has this method. Alfa may call it while the
plugin is disabled.

**What you are given.** A `ClearDataEvent` (`Alfa\Component\Alfa\Administrator\Event\Tools\ClearDataEvent`) with
`getSource(): string`, which says which of the three actions asked.

**What you are expected to do.** Remove the data your plugin owns outside Alfa's tables, for example uploaded
files. Then call `setMessage(string $message)` with one line about what was removed. If something could not be
removed, call `setError(string $error)`.

**What happens next.** Staff see your message or your error.

**If you are missing or you fail.** Without the method, staff are told that automatic Clear Data is not supported
and nothing is touched. An error you throw is logged and reported as a failure.
