---
sidebar_position: 1
title: The filters module
description: How the filters panel applies what the shopper ticks, how its option groups open, search and show more, what its foot offers, and how a button or link of your own opens it.
---

# The filters module

<AlfaVersion verified="2.3.0" />

## What it does

The filters module (`mod_alfa_filters`, shipped with Alfa Commerce) is the panel beside the product listing where a
shopper narrows the catalogue: categories, manufacturers, price, availability, sale items and every item field marked
as filterable (a colour, a size). From the module's breakpoint up (**Responsive Change**, 800 pixels by default: at
800 and wider) it is a **column** beside the products. Narrower, or always when **Fixed Positioning** is on, it is a
panel that **lies over the page**: the module's own button opens it, and so can any button or link of yours (see
[Opening the filters from your own button](#opening-the-filters-from-your-own-button)). In a shop that shows its
catalogue only, the panel has no price, sale or discount filters (see
[Online sales](../getting-started/store-setup.md#online-sales)).

## How the filters apply

Every tick refreshes the panel at once, in the background: the groups and their counts narrow to what the ticks leave.
When the **results** change depends on the module's setting **Dynamic Filtering**:

| Dynamic Filtering | Where | The results |
|---|---|---|
| Enabled | On the shop's listing | Change at once with every tick. The listing is swapped in place, the address bar follows, and the new results are brought into view. |
| Disabled (the default), or any page that is not the listing | Anywhere | Change when the shopper presses the panel's results button (the form is sent and the listing opens: on a listing page, that listing with its category; anywhere else, the shop's listing). |

## The option groups

The categories, the manufacturers and each item field are **option groups**. Each group has three helpers, set on the
module's **Filter groups** tab:

- **Its heading opens and shuts it.** The heading is a button; groups start open, and a group the shopper shut stays
  shut while the panel refreshes. **Group opener icon** picks the icon beside the heading: chevron, caret, plus or
  none (with none, the heading still opens and shuts the group). **Icon turns when open** turns it while the group is
  open (a plus becomes a cross); off, it stays still. For a shopper who asked the device for reduced motion, it turns
  at once, without movement.
- **A search box at the top of a long group.** **Search box in a group** (on by default) and **From how many options**
  (8): a group with at least that many options (the category tree counts every category at every level) gets a box
  that narrows it as the shopper types. Letters are compared without their case and their accents, so "cafe" finds
  "Café" and "καφε" finds "Καφές". In the category tree a match keeps the categories above it in view. When nothing is
  left, the group says "Nothing found". The box is no filter: what is typed is never sent with the form, and Enter in
  it sends nothing. A group shown as a dropdown has its own search instead.
- **Show more / Show less.** **Options shown before Show more** (8) is how many options a group shows; the rest wait
  behind one button that says how many ("Show 4 more") and then "Show less". **Per group** sets a different number for
  a group of your choice (a row of group and number). 0 shows every option. A group with just one option past the
  number shows it. A ticked option is never hidden, nor is a category with a ticked one under it. In the category
  tree the number counts the top level. A searched group shows every match and no button. A dropdown keeps every
  value in its list.

## The panel's foot

At the bottom of the panel, in view while the panel scrolls, the foot answers what the shopper does after ticking:

- **Show N results**, where N is the number of products the ticks leave (the listing's own count, redrawn with every
  refresh). With Dynamic Filtering enabled, on the listing, the results are already in place behind the panel, so the
  button closes the panel. Otherwise the button sends the form, and the listing opens with the filters applied.
- **Clear all**, beside it while any filter is in effect. It clears every filter and empties the groups' search
  boxes. Once nothing is left to clear it goes, and the keyboard moves on to the results button.

In the column, the bar above the groups carries Clear all instead, and a foot whose results already apply at once is
not shown (the results are beside the panel). A foot that sends the form stays, as the form's button.

## Opening the filters from your own button

Any element of your page, a button in the header, a link in a menu, opens the filters with one attribute and this
module's number (its id, shown on the module's list in the administrator):

| Attribute | What a press does |
|---|---|
| `data-alfa-filters-toggle="ID"` | Opens the panel, or closes it when it is open. |
| `data-alfa-filters-open="ID"` | Opens the panel. |
| `data-alfa-filters-close="ID"` | Closes the panel (it may sit inside the panel too). |

```html
<button type="button" data-alfa-filters-toggle="146">Filters</button>
```

The module's **Module** tab shows this line with the module's own number under **Your own button**, ready to copy (a
new module first asks to be saved).

What happens next:

- While the panel is open, every opener of the module carries `aria-expanded="true"`, and `false` once it closes.
- Opening puts the focus on the panel's close button. The backdrop, the close button and Escape (wherever the focus is
  while the panel lies open) close it and give the focus back to the element that opened it. Escape pressed in a
  group's search box that holds text, or while a dropdown is open, is left to the box or the dropdown and does not
  close the panel.
- Where the panel is a column beside the products, an opener brings the panel into view and puts the focus in it.
- An opener added to the page later (by a script, or a module loaded afterwards) works too: the module finds openers
  when they are pressed.

A script does the same:

```js
window.AlfaFilters.open(146);
window.AlfaFilters.close(146);
window.AlfaFilters.toggle(146);
```

Both editions of the module answer the same attributes and the same `window.AlfaFilters`, and a page that carries both
gets one of each.

## For a template override

The markup comes from the module's layouts in `tmpl/`: `default.php` (the module's button, the panel, its header, the
column's Clear all bar and the loading image), `default_form_content.php` (the sections in their order, the price,
availability, ordering, number of items, sale and discount sections, and the foot), `default_filters.php` (the option
groups, with the categories' and the manufacturers' options), `default_field.php` (an item field's options:
checkboxes, buttons, swatches or a dropdown), `default_group_icon.php` (a group's opener icon) and `default_arrow.php`
(the arrow of the subcategory toggles and of the apply buttons).

A template override (`html/mod_alfa_filters/` in the template) replaces `default.php`, `default_filters.php`,
`default_group_icon.php` and `default_arrow.php`. It replaces `default_form_content.php` only as the page loads: every
refresh of the panel draws the module's own file. `default_field.php` is always the module's own, drawn from the
module's folder.

The script and the stylesheet work through the module's class names and these attributes; an override that keeps them
keeps the behaviour. A group's search reads an option's name from `.af-item > .af-option > .af-label`, or from
`.af-item > .af-chip > .af-chip-name` for a chip.

| Attribute | On | Meaning |
|---|---|---|
| `data-af-icon`, `data-af-icon-turn` | the module's outer element | Printed by the layout: the opener icon (chevron, caret, plus or none) and whether it turns. |
| `data-af-group="category"`, `"manufacturer"`, `"field-<id>"` | each group | The group, as the script remembers it across a refresh. |
| `.af-group-toggle` with `aria-expanded`, `aria-controls` | the heading's button | Opens and shuts the group. |
| `data-af-closed` | the group | Written by the script: the group is shut. |
| `data-af-search` | the search box | The box. It must have no `name`. |
| `data-af-search-empty` (with `hidden`) | the "Nothing found" line | Shown by the script when nothing is left. |
| `data-af-filtering`, `data-af-match` | the group, its options | Written by the script while the group is searched. |
| `data-af-more` | an option | Printed by the layout: the option waits behind Show more. |
| `data-af-more-toggle` with `aria-expanded` | the Show more button | Turned by the script. |
| `data-af-expanded` | the group | Written by the script: the group is opened out. |
| `data-af-open` | a category | Written by the script: its subcategories are shown. |
| `data-af-show-results` | the foot's button | Present when the results already apply: the button closes the panel. |
| `data-af-applies="live"` or `"submit"` | the foot | How the results apply. |

An item field's ShowOn state name (`data-showon-name`) sits on the group's options (`.af-group-options`), not on the
group: the ShowOn engine reads every input inside it as the field's value, and the search box is not one.

The stylesheet (`media/mod_alfa_filters/css/filters.css`) keys these states on the same attributes, with class and
attribute selectors and no ids, so a template's own CSS can restyle any of it.

## What can go wrong

| What you see | Why |
|---|---|
| A button with the attribute does nothing | The number is not this module's, or the module is not on that page. |
| A group shows no search box | It has fewer options than **From how many options**, or it is shown as a dropdown. |
| A group shows no Show more | It holds at most one option more than its number, its number is 0, or it is shown as a dropdown. |

## Not documented yet

- The module's other settings (the panel's look, the loading image, the price slider's colours).
- The Pro edition, which is sold separately.
