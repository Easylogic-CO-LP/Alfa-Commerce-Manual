---
title: Admin screen events
description: "The list, edit, save and delete events a feature plugin hears on Alfa Commerce's administrator screens in 2.2.0."
---

# Admin screen events

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Extending Admin Screens](./admin-screen-plugins.md): the guide itself
- [Admin screen events](./admin-screen-events.md)
- [A complete feature plugin](./admin-screen-example.md)
- [Calling your plugin from the browser](./admin-screen-ajax.md)

## The list screen events

All eight events below are announced to everyone. Each card says "you" for your handler.

### onAlfaAdminListQuery

- **When it fires.** When the list's database query has been built and before it runs.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `state` (the filters) and `query` (the real query object).
- **What you are expected to do.** Add a condition to `query` when your filter is in use, and nothing otherwise.
  Add an `EXISTS (...)` condition, not a join: a join can repeat rows and change the count. Never remove rows after
  the query has run, because the page numbers and the total come from this same query.
- **What happens next.** Alfa runs the query. Staff see only the rows that match.
- **If you are missing or you fail.** The list shows all rows. Your error is logged.

### onAlfaAdminListFilters

- **When it fires.** When the list's filter form is being prepared.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `state` and `form` (the filter form).
- **What you are expected to do.** Add your field under the `filter` group:
  `$context->form->load('<form><fields name="filter"><field name="risk" type="list" label="...">...</field></fields></form>')`.
- **What happens next.** The field appears under Filter Options. What staff choose arrives in the state as
  `filter.risk`, where your `onAlfaAdminListQuery` reads it. You need no other code to carry the value.
- **If you are missing or you fail.** The field is not shown. Your error is logged.

### onAlfaAdminListRowData

- **When it fires.** Once for each page of a list, after the rows are loaded and before the columns are declared.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `items` (the rows), `ids` (their ids, all at once) and `state`.
- **What you are expected to do.** Load your values for all the ids in **one** query, then hand them over:
  `$event->value('alfa.keeplist', 'kept', [12 => true, 15 => true])`. The array is keyed by row id.
- **What happens next.** The values are kept for the page. Your column and your row actions read them with
  `$context->rowValues($id)`. A key belongs to the first plugin that writes it. A second plugin writing the same key
  is refused and a warning is logged, so choose a key that is clearly yours.
- **If you are missing or you fail.** No values are stored and your column shows empty cells. Your error is logged.

### onAlfaAdminListColumns

- **When it fires.** Right after `onAlfaAdminListRowData`.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `columns` (the column builder), `items`, `ids`, `state`, and the row values through
  `rowData()` and `rowValues()`.
- **What you are expected to do.** Declare your column (see "Declaring a column" below). Do not run a query for each
  row. Read what `onAlfaAdminListRowData` stored.
- **What happens next.** The list gets one more header cell and one more cell on every row.
- **If you are missing or you fail.** The column is not shown. Your error is logged.

### onAlfaAdminListRowActions

- **When it fires.** After the columns, before the list is drawn.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `actions` (the action builder), `items`, `ids`, `state`, `token` and the row values.
- **What you are expected to do.** Declare a button (see "Declaring a row or bulk action" below). Change nothing in
  the database here: the list is only being drawn.
- **What happens next.** Staff who hold the button's permission see it in an Actions column at the end of each row.
- **If you are missing or you fail.** The button is not shown. Your error is logged.

### onAlfaAdminListBulkActions

- **When it fires.** Right after `onAlfaAdminListRowActions`.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `bulkActions` (the same builder), `items`, `ids`, `state`, `token`.
- **What you are expected to do.** Declare a button for the checked rows, the same way as a row action.
- **What happens next.** Staff who hold the permission see a labelled button in a bar above the table. It refuses to
  run when no row is checked.
- **If you are missing or you fail.** The button is not shown. Your error is logged.

### onAlfaAdminToolbar

- **When it fires.** On a list screen and on an edit screen, when Alfa has put its own buttons in the toolbar and
  before the page is drawn.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `toolbar` (Joomla's toolbar of the screen), `state`, `layout`, `token`, and on an edit
  screen `item` (the record). There is no `items` and there are no row values here.
- **What you are expected to do.** Add buttons with Joomla's toolbar methods. Do not remove Alfa's buttons.
- **What happens next.** Your button is shown after Alfa's.
- **If you are missing or you fail.** The button is not shown. Your error is logged.

```php
public function onAlfaAdminToolbar(AdminToolbarEvent $event): void
{
    if (!$event->isListScreen() || !$event->targets('manufacturer')) {
        return;                                   // one list only
    }

    $event->getAdminContext()->toolbar
        ->linkButton('keeplist-options', 'PLG_ALFA_KEEPLIST_TOOLBAR')
        ->icon('icon-pencil')
        ->url('index.php?option=com_plugins&view=plugins&filter[search]=keeplist');
}
```

Combine the guards as you need: a button on one list, on every list, or on one entity's edit form only. If only
some staff may have the button, check their permission first (see "Permissions").

### onAlfaAdminRender

- **When it fires.** While the page is being drawn, once for each named place (slot) the screen offers.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `slot`, `layout`, `state`, `token`, `item` and `items` when the screen has them.
- **What you are expected to do.** Check the slot with `at()`, then add your markup:
  `$context->append('alfa.keeplist', $html)`. Return markup only. Do not redirect, send headers or stop the request.
- **What happens next.** Every plugin's markup is joined in order and printed at the slot. Nobody replaces anybody.
- **If you are missing or you fail.** The slot prints nothing from you. Your error is logged.

These slots exist in 2.2.0:

| Slot | Where | Guard |
|---|---|---|
| `before-grid` | Above the table, on 24 of the 25 list screens. The carts list has none. | `$event->isListScreen() && $event->at('before-grid')` |
| `order-details` | Order edit screen, right column, under Order Details | `$event->targets('order') && $event->at('order-details')` |
| `order-main` | Order edit screen, full width, under the totals | `$event->targets('order') && $event->at('order-main')` |
| `cartrule-sidebar` | Cart rule edit screen, in the side column | `$event->targets('cartrule') && $event->at('cartrule-sidebar')` |
| `cart-main` | The screen of one cart, under its tabs | `$event->targets('cart') && $event->at('cart-main')` |

The screen of one cart answers `isListScreen()` with true, like the carts list. Tell the two apart with
`$context->view`: `'cart'` for one cart, `'carts'` for the list.

### Declaring a column

`$context->columns->column('group.element', 'key')` returns a column builder. Chain these on it:

| Method | Meaning |
|---|---|
| `title($languageKey)` | The header text |
| `setLayout($name)` | **Required.** The file that draws one cell: `tmpl/<name>.php` in your plugin. |
| `setData($function)` | A function that takes the row (an object) and returns an array, an object or `null`. It is called once for each row while the page is drawn. What it returns is handed to the layout as `$displayData`. `null` leaves the cell empty. |
| `after($coreColumnKey)` | Put the column right after one of the screen's own columns |
| `setPluginType($group)`, `setPluginName($element)` | Only to use a layout file of another plugin |

The function returns **data**, never HTML. The layout file turns the data into HTML. A site's administrator template
can replace your layout with its own file in `html/plg_<group>_<element>/<name>.php`.

:::note Where `after()` works
A screen honours `after()` only for the column keys its template declares. Everywhere else, and for a key the screen
does not know, your column is placed after the last column. Five lists declare keys in 2.2.0:

| List | Keys you may pass to `after()` |
|---|---|
| Orders | `id`, `customer`, `amount`, `date`, `payment`, `shipment`, `status` |
| Currencies | `state`, `name`, `code`, `id` |
| Cart rules | `priority` |
| Manufacturers | `item_count` |
| Items | `available` |
:::

### Declaring a row or bulk action

`$context->actions->action('group.element', 'key')` (or `$context->bulkActions->action(...)`) returns an action
builder:

| Method | Meaning |
|---|---|
| `title($languageKey)` | The button's text |
| `icon($cssClass)` | The full icon class, for example `'icon-mail'` |
| `task($task)` | A controller task of Alfa Commerce, for example `'orders.publish'`. The list's own form is posted, with its form token. Use it for anything that changes data. |
| `url($url)` | A link. Only for going somewhere, never for changing data. |
| `confirm($languageKey)` | Ask before running |
| `cssClass($classes)` | Extra CSS classes |
| `access($action, $asset = 'com_alfa')` | The permission staff need to see the button |
| `setLayout($name)`, `setData(fn)` | Draw the button yourself, with a file in your `tmpl/` folder |

An action with no task, no link and no layout is dropped.

**Who sees the button.** Alfa shows an action only to staff who hold its permission, and it works the permission out
like this:

1. If you called `access()`, that permission.
2. Otherwise, for a task of one of Alfa's own screens (`orders.publish`), the permission that task needs.
3. Otherwise, for a link to one of Alfa's own screens, the permission to open that screen. A link that leaves the
   administrator or Alfa Commerce needs nothing.
4. For anything else Alfa cannot tell, and **the button is shown to no one**. This is the case for a link to a panel,
   for a task Alfa does not know, and for an action that has only a layout. Call `access()` for these.

This row action links to a panel named `kept` that the Keep list plugin of [A complete feature plugin](./admin-screen-example.md) would own (that plugin
has no panel; panels are on [Creating an Admin Panel](./admin-panels.md)):

```php
$context->actions->action('alfa.keeplist', 'open')
    ->title('PLG_ALFA_KEEPLIST_OPEN')
    ->icon('icon-file')
    ->url('index.php?option=com_alfa&view=panel&group=alfa&element=keeplist&panel=kept')
    ->access('alfa.keeplist.manage');             // a link to a panel is hidden without this
```

Hiding a button is not security. Whatever the button reaches must check the permission again.

With `setLayout()` on a row action, the function given to `setData()` decides row by row: `null` shows nothing on
that row. A bulk action has no row, so its layout receives the action's own description instead (an array with
`key`, `title`, `icon`, `task`, `url`, `confirm`, `cssClass`).

:::note Two folders for layouts
`setLayout()` on a column or an action reads from your plugin's **`tmpl/`** folder. `setLayout()` on a panel event
([Creating an Admin Panel](./admin-panels.md)) reads from your plugin's **`layouts/`** folder. A cell is a fragment,
a panel screen is a page.
:::

## The edit screen events

### onAlfaAdminForm

- **When it fires.** When the edit form of a record has been loaded, before its values are put in.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `form` (the edit form), `item`, `isNew` and `data` (the record's values, to read).
- **What you are expected to do.** Add fields. Describe fields only, and set no values here:

```php
$event->getAdminContext()->form->load(
    '<form><fieldset name="keeplist" label="PLG_ALFA_KEEPLIST_TAB">'
    . '<field name="keeplist_months" type="number" label="PLG_ALFA_KEEPLIST_MONTHS" default="24" />'
    . '</fieldset></form>'
);
```

- **What happens next.** A fieldset with a name of its own becomes a tab of its own, after the screen's tabs. Your
  fields are posted with the form like any other field and arrive in `$context->data` in the save events.
- **If you are missing or you fail.** The fields are not shown. Your error is logged.

Three things to know:

- **Alfa does not store your field.** The record's table has no column for it, so the value is dropped when the
  record is written, without a message. Store it yourself: read it from `$context->data` in `onAlfaAdminAfterSave`
  and write it to your own table, then put it back in `onAlfaAdminPrepareData` when the form opens.
- **A name that is taken.** A fieldset that uses a name the screen already uses is not drawn as a tab. On the item
  screen those names are `general`, `identity`, `inventory`, `prices`, `Images`, `publish` and `meta`. On the order
  screen they are `user_details` and `order_details`. Give your fieldset a name that is clearly yours.
- **Two screens show no extra tabs.** Contributed tabs are drawn on 18 edit screens and on the screen of one cart.
  The edit screens of **Document Types** and **Stock Locations** do not draw them. There your fields are still part
  of the form and still arrive in the save events, but staff cannot see them.

### onAlfaAdminPrepareData

- **When it fires.** Right after `onAlfaAdminForm`, before the values are put into the form.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `item`, `isNew`, and `data` (the record's values, which you may change).
- **What you are expected to do.** Put the stored value of each of your fields into `$context->data`. If a value is
  already there, leave it: it can be what staff typed in a save that was refused.
- **What happens next.** The form opens with your values in your fields.
- **If you are missing or you fail.** Your fields open with their default values. Your error is logged.

## The save and delete events

### onAlfaAdminValidate

- **When it fires.** When staff save, after the form has passed Alfa's own checks and before anything is written.
  It does not fire when Alfa's own checks already failed.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `data` (what was submitted), `form`, `isNew`, and `item` (the record as it is stored now,
  or `null` for a new one).
- **What you are expected to do.** Check, and if the save must not happen call `$context->addError($message)` with a
  translated message. Do not write to the database and do not change the data here.
- **What happens next.** With no error from any plugin, the save goes on. With an error, nothing is saved, staff see
  the message and the form opens again with what they typed.
- **If you are missing or you fail.** If you are missing, the save goes on. If you throw an error, the save is
  refused with the error's text.

### onAlfaAdminBeforeSave

- **When it fires.** Just before the record is written.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `data` (which you may change), `isNew`, and `item` (the record as stored now, `null` for a
  new one).
- **What you are expected to do.** Adjust `$context->data` if you need to, for example tidy a value.
- **What happens next.** Alfa writes the record with the data as you left it.
- **If you are missing or you fail.** If you are missing, the record is written unchanged. If you throw an error,
  the save is refused with the error's text.

:::warning `addError()` does nothing here
Alfa does not read the errors after this event. Refuse a save in `onAlfaAdminValidate`. A new record has no id yet at
this point, so write your own rows in `onAlfaAdminAfterSave`.
:::

### onAlfaAdminAfterSave

- **When it fires.** After the save is final (the commit) and Alfa's locks are released. It never fires for a save
  that was undone.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `ids` (one id, the saved record's, also for a new record), `isNew`, `data` (what was
  saved) and `item` (the record read again from the database, or `null` if it could not be read). Use `ids[0]` as
  the key.
- **What you are expected to do.** Your own side of the save: store your rows, notify, index. Do not print,
  redirect or stop the request. The answer to staff belongs to Alfa.
- **What happens next.** Alfa shows the result of the save.
- **If you are missing or you fail.** The record stays saved either way. Your error is logged, and nothing tells
  staff, so check the log while developing.

### onAlfaAdminBeforeDelete

- **When it fires.** Once for a delete, with all the ids together, before anything is deleted. Alfa first checks
  that the person may delete. If not, this event does not fire at all.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `ids`, the records about to be deleted.
- **What you are expected to do.** If they must stay, call `$context->addError($message)`. This is also the last
  moment the records can still be read.
- **What happens next.** With no error, the delete goes on. With an error, **none** of the records is deleted and
  staff see a message.
- **If you are missing or you fail.** If you are missing, the delete goes on. If you throw an error, the delete is
  refused with the error's text.

### onAlfaAdminAfterDelete

- **When it fires.** After the delete is final (the commit). It never fires for a delete that was refused or undone.
- **Who receives it.** Every loaded plugin that listed the event.
- **What you are given.** `ids`, the records the delete finished with.
- **What you are expected to do.** Delete your own rows for those ids. Write it so that running it twice does no
  harm.
- **What happens next.** Alfa shows the result of the delete.
- **If you are missing or you fail.** The records stay deleted either way. Your error is logged.

:::note Orders
A new order made in the administrator is not saved through the edit form's save. The three save events fire when
staff save an **existing** order.
:::
