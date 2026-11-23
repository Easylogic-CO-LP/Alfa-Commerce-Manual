---
sidebar_position: 2
title: Your first shop
description: Where to start after installing. The Dashboard's setup checklist and the guided tours lead the way.
---

# Your first shop

<AlfaVersion verified="2.3.0" />

This manual is written for developers. Setting up a shop is explained inside Alfa Commerce itself, on the live
screens, so this page only says where to start.

## Follow the setup checklist

Open **Components**, **Alfa Commerce**. The Dashboard shows a **setup checklist**. Each row is one thing a shop
needs, checked against the shop as it is now, and each row opens the screen where it is done or starts a guided tour
of it.

The checklist has 20 rows in three groups, and says how many are done:

| Group | Rows |
|---|---|
| **Required** | Store name and contact e-mail, default currency, at least one active tax, storefront menu items, at least one published category, at least one published item |
| **Recommended** | Checkout form fields, required form fields can be filled in, an active payment method, an active shipping method, customer pages, storefront pages linked across languages, document numbering series, each SKU names one product or variant, Joomla mail configured, media folder writable |
| **Optional** | Customer cancel, item fields, search-engine-friendly addresses, HTTPS |

Item fields moves to the required rows while the shop has item fields and none of them is published.

The default currency is one of the published currencies: **Options**, **Currency**, **Default Currency** lists only
those.

One of the recommended rows, in more detail:

- **Required form fields can be filled in.** It fails while a form field that is required in a form is served by
  no enabled plugin of Public access, and names each such field.

The checklist lists only steps you complete. What is only to be known appears in the notification centre (the bell
at the top of Alfa Commerce's administrator screens) instead: Joomla's page cache is on, a library a feature needs is
missing or disabled, an Alfa extension is not built for this version, the shop shows its catalogue only, products
sell from a quantity no price covers. See [Notifications](../services/notifications.md#what-alfa-commerce-tells-you).

While a required row is not done, the notification centre keeps a notice, which cannot be dismissed, of how many
required steps remain.

Three rows have a **Create for me** button. On "Storefront menu items" it creates the Shop and Cart pages. On
"Customer pages" it creates the account page, My orders and the sign-up page. In both you choose the menu they go in: a new
menu named Alfa Commerce, made for you, or an existing one. On "Storefront pages linked across languages", a row of a
site in several languages, it links each storefront page's copies in the different languages to one another.

Each page is titled in its own language; on a site in one language, in the site's default language. The sign-up page
is made only while Users: Options allows sign-ups (Allow User Registration, which Joomla sets to No when it is
installed). While it does not, the Customer pages row says so, and once sign-ups are on, it offers to make the page.

The optional row **Customer cancel** is done once customers may cancel their own orders: Options, Cart, Customer
account, Customer cancel status names the status a cancelled order moves to, and at least one published status has
Customers may cancel. A new installation has both (Pending, into Cancelled); a shop that was updated has neither until it
sets them. See [The customer's account](../services/customer-account.md#cancelling).

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

Where a product's price would be, its page and its cards say **Call for price**, as they do for a product that has no
price while the shop sells. To word it your own way (a phone number, "Ask us"), override the language string
`COM_ALFA_PRICE_ON_REQUEST` in Joomla's **Language Overrides** for the site; an override with no text shows nothing
there.
A product that cannot be bought now and whose stock rule offers **Notify me when available** keeps that button in the
catalogue too: it is drawn beside the add to cart, not in its place.

While the shop shows its catalogue only, the notification centre says so, with the note **Online sales**. The
site's own Cart menu item stays where you put it: unpublish it while the shop shows its catalogue only, and publish it
again when it sells.

A shop whose customers ask for an offer instead of paying a listed price sells online, with prices of zero shown its
own way, a cart without amounts and a status for the requests: see
[A catalogue with requests for offer](requests-for-offer.md).

## Currencies

**Options**, **Currency**, **Default Currency** is the currency your prices are in. The list shows the published
currencies only; publish a currency on Alfa Commerce's Currencies screen to offer it here. If the stored default currency
is not published, the field shows "Select a currency" and the Options are not saved until you choose a published
one.

The store's default currency, and the last currency that is published, always stay in service. Unpublish, Archive,
Trash and Delete in the list refuse them, and so does the Status on a currency's own edit screen; the message names the
currency by its name and code, such as Euro (EUR), and says why. To retire the default currency, choose another default
first in **Options**, **Currency**.

## Manufacturers and categories in a module

Two site modules come with the package, for a sidebar or any template position (Content > Site Modules > New):

| Module | What it shows | Its settings |
|---|---|---|
| Alfa Manufacturers (`mod_alfa_manufacturers`) | The shop's manufacturers as a grid of links, as many columns as the width holds (two on a phone) | Manufacturers (empty: every one the shop shows), Show (logo and name, logo, name; a manufacturer without a logo shows its name), Link to (its products, its page), Ordering (name, the Manufacturers list's order), How many (0: all) |
| Alfa Categories (`mod_alfa_categories`) | The shop's categories as a nested list of links | Start from (top level or a category), Levels (1 to 10), Open (only the branch of the visitor's category, or all), Number of products |

Both show what the shop's own pages show: published manufacturers and categories, the categories a visitor may see,
names in the page's language. The categories module marks the visitor's category (`aria-current="page"`) on a
product list or a product page reached through one. A module with nothing to show draws nothing.

For a template author: each module reads the component's own data (the site Manufacturers model, and
`CategoryHelper::getCategoryTree()` and `getCategoryPath()`), never a table. Each has its own stylesheet and class,
`.mod-alfa-manufacturers` and `.mod-alfa-categories`, with one instance's class beside it
(`.mod-alfa-manufacturers-<id>`, `.mod-alfa-categories-<id>`). The look is set by tokens declared on that class
(`--mod-alfa-manufacturers-gap`, `-min`, `-logo-height`, `-padding`, `-surface`, `-color`, `-hairline`, `-radius`,
`-accent`; `--mod-alfa-categories-indent`, `-padding`, `-color`, `-current`, `-muted`, `-hairline`), which take the
storefront palette where it is loaded. Set a token on the class or on one instance's class in the template's CSS. The
layouts are overridable as any module's: `html/mod_alfa_manufacturers/default.php`, and for the categories
`html/mod_alfa_categories/default.php` and `default_level.php` (one level of the list, drawn again for each level
below).

## Take the guided tours

Alfa Commerce installs 33 guided tours. A tour walks through one screen step by step, on the screen itself:
categories, items, payments, shipping, currencies, taxes, discounts, cart rules, order statuses, stock and the
others. Start one from the tour menu in the administrator's header, or from a row of the checklist.

The tours are kept up to date with each release and are translated by the language packs.

## One idea a developer needs

A **payment method** or **shipping method** is a record that a shopper picks at checkout. Each method belongs to one
**plugin**, which does the work, and carries that plugin's settings. The plugin is the code; the method is one
configured use of it. See [Method](../reference/glossary.md#plugins-and-events) in the glossary.
