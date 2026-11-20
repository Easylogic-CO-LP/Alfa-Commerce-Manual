---
sidebar_position: 2
title: Your first shop
description: Where to start after installing. The Dashboard's setup checklist and the guided tours lead the way.
---

# Your first shop

<AlfaVersion verified="2.2.1" />

This manual is written for developers. Setting up a shop is explained inside Alfa Commerce itself, on the live
screens, so this page only says where to start.

## Follow the setup checklist

Open **Components**, **Alfa Commerce**. The Dashboard shows a **setup checklist**. Each row is one thing a shop
needs, checked against the shop as it is now, and each row opens the screen where it is done or starts a guided tour
of it.

The checklist has 21 rows in three groups, and says how many are done:

| Group | Rows |
|---|---|
| **Required** | Store name and contact e-mail, default currency, at least one active tax, storefront menu items, at least one published category, at least one published item |
| **Recommended** | Checkout form fields, required form fields can be filled in, an active payment method, an active shipping method, customer pages, storefront pages linked across languages, document numbering series, PDF library for sales documents, Alfa extensions built for this version, Joomla mail configured, media folder writable, Joomla page cache |
| **Optional** | Item fields, search-engine-friendly addresses, HTTPS |

The default currency is one of the published currencies: **Options**, **Currencies**, **Default Currency** lists only
those.

Four of the recommended rows, in more detail:

- **Required form fields can be filled in.** It fails while a form field that is required in a form is served by
  no enabled plugin of Public access, and names each such field.
- **PDF library for sales documents.** It says that the dompdf library ships with Alfa Commerce and is installed
  with it, together with the libraries it needs. It fails only when one of them has been removed, says that installing
  the Alfa Commerce package again restores it, and opens Joomla's extension installer.
- **Joomla page cache.** It passes while "System - Page Cache" is off, warns while it runs beside "System - Alfa
  Commerce Sync", and also warns while that plugin is disabled, missing, or not run for visitors who are not logged
  in, saying what Alfa still keeps out of the page cache and what is lost.
  See [Caches](../architecture/caches.md#the-page-cache-rule).
- **Alfa extensions built for this version.** It warns while an installed Alfa extension states a range of Alfa
  Commerce lines that excludes this one ("needs a compatible build") or states none ("compatibility not stated"),
  names each with its verdict and the line to update to, and opens **Tools**, **Extensions**. An Alfa extension here
  is a plugin of a group whose name starts with `alfa` or whose namespace starts with `Alfa\`, or a module whose name
  starts with `mod_alfa`, another vendor's included; the extensions that ship with Alfa Commerce are never named.
  See [The Alfa Commerce lines your extension is built for](../plugins/overview.md#the-alfa-commerce-lines-your-extension-is-built-for).

The shop cannot take orders until every required row is done.

Two rows have a **Create for me** button. On "Storefront menu items" it creates the Shop and Cart pages. On
"Customer pages" it creates the account page and the sign-up page. In both you choose the menu they go in: a new
menu named Alfa Commerce, made for you, or an existing one.

Each page is titled in its own language; on a site in one language, in the site's default language. The sign-up page
is made only while Users: Options allows sign-ups (Allow User Registration, which Joomla sets to No when it is
installed). While it does not, the Customer pages row says so, and once sign-ups are on, it offers to make the page.

A recommended or optional step you do not need can be ignored, such as Item fields on a shop whose products have no
options, or Joomla mail on a test copy that must not send e-mail. **Ignore** on its row moves it under **Ignored**, at
the end of the checklist, out of the count; **Show again** brings it back. A required step cannot be ignored. The
choice is the site's, the same for every administrator, and a reset of the Options keeps it.

The first time you open the Dashboard, a short welcome tour starts by itself. You can close it and start it again
later from the tour menu.

## Online sales

**Options**, **Cart**, **Online sales**: **Catalogue only** shows the products with their details, images and stock,
and every product field as a plain list of its options, with nothing to choose, no prices and no add to cart. The cart
page shows a sentence instead of the cart, the cart module shows nothing, and the cart and the checkout refuse every
change and every order. Orders you take in the administrator or over the REST API, and orders already placed, are not
affected. The catalogue API publishes prices as null. Switching online sales on or off, by the Options, Reset to
default or Clear everything, drops the pages Joomla's page cache stored, so visitors see the shop as it is now. It
does not reach another extension's page cache, a server's or a CDN's cache, or the pages browsers keep under Joomla's
Use Browser Caching: each is purged by its own means.

The site's own Cart menu item stays where you put it: unpublish it while the shop shows its catalogue only, and
publish it again when it sells.

## Take the guided tours

Alfa Commerce installs 33 guided tours. A tour walks through one screen step by step, on the screen itself:
categories, items, payments, shipping, currencies, taxes, discounts, cart rules, order statuses, stock and the
others. Start one from the tour menu in the administrator's header, or from a row of the checklist.

The tours are kept up to date with each release and are translated by the language packs.

## One idea a developer needs

A **payment method** or **shipping method** is a record that a shopper picks at checkout. Each method belongs to one
**plugin**, which does the work, and carries that plugin's settings. The plugin is the code; the method is one
configured use of it. See [Method](../reference/glossary.md#plugins-and-events) in the glossary.
