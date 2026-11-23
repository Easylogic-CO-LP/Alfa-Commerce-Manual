---
sidebar_position: 2
title: The cart module
description: The cart module's button and drawer, how the drawer opens over the whole page, and what a template override of the module must keep.
---

# The cart module

<AlfaVersion verified="2.3.0" />

## What it does

The cart module (`mod_alfa_cart`, shipped with Alfa Commerce) is the cart's button, usually in the page's header, with
a counter of the items or the quantity, and the **drawer** it opens: the cart's lines, their quantities and the total,
with the way to the checkout. How it reads the cart is on [Cart and checkout](../services/cart-and-checkout.md). In a
shop that shows its catalogue only, the module draws nothing (see
[Online sales](../getting-started/store-setup.md#online-sales)).

## The button and the drawer

- **The button** is a real button: the keyboard reaches it with Tab, and Enter or Space opens the drawer. It is named
  "Cart" for screen readers (`MOD_ALFA_CART_TOGGLER`, which a language override can word your way), and its
  `aria-expanded` is `true` while the drawer is open.
- **The drawer** is a dialog the module opens as a modal. The browser draws it over the whole page and places it
  against the screen, whatever the page around the module does. A header that slides away as the page scrolls (it
  moves with a transform, and may hide its content) cannot carry the drawer away with it, and the drawer is visible
  inside such a header too. While it is open, the page behind it does not take clicks or the keyboard.
- **Its movement** is the module's setting **Animation**: Zoom In, From Top, From Left or From Right.
  The drawer closes with the same movement, by its close button, a click beside it, or Escape; the focus then returns
  to what opened it.

## For a template override

A template override of `mod_alfa_cart/tmpl/default.php` keeps these, or the drawer does not open:

- `data-mod-cart-outer` on the module's outer element, with the button and the drawer inside it (the script works with
  the first such element on the page);
- the class `cart-toggler` on the button (a `<button type="button">` in the shipped layout);
- the drawer as a `<dialog>` whose direct child is the block `default_items.php` prints (`data-cart-items`): the script
  opens that block's parent with the browser's `showModal()`.

It keeps these too, or a part stops working:

- `data-counter` and `data-counter-mode` on the button: the stylesheet prints the counter from `data-counter`, and the
  script rewrites it after every change and re-read of the drawer, counting what `data-counter-mode` names (`items`
  or `quantity`);
- `data-on-add` on the outer element: the setting **When an item is added**;
- the classes `mod-alfa-cart` and the animation's (`zoomIn`, `fromTop`, `fromLeft` or `fromRight`) on the outer
  element, and `mod-alfa-cart-data` on the dialog: the stylesheet draws the drawer and its movement on them.

The rest (`aria-controls` naming the drawer's `id`, `aria-haspopup="dialog"`, the button's name) is what the shipped
layout prints, so assistive technology reads the button as the one that opens the drawer.

## Not documented yet

- The module's settings for the counter, the line prices (the **Price Display Settings** tab), the colours and the
  button's image.
- The setting **When an item is added** ("Open the cart") and how it replaces the added-to-cart card.
