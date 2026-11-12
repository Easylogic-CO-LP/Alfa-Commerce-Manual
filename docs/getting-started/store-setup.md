---
sidebar_position: 2
title: Your first shop
description: Where to start after installing. The Dashboard's setup checklist and the guided tours lead the way.
---

# Your first shop

<AlfaVersion verified="2.2.0" />

This manual is written for developers. Setting up a shop is explained inside Alfa Commerce itself, on the live
screens, so this page only says where to start.

## Follow the setup checklist

Open **Components**, **Alfa Commerce**. The Dashboard shows a **setup checklist**. Each row is one thing a shop
needs, checked against the shop as it is now, and each row opens the screen where it is done or starts a guided tour
of it.

The checklist has 17 rows in three groups, and says how many are done:

| Group | Rows |
|---|---|
| **Required** | Store name and contact e-mail, default currency, at least one active tax, storefront menu items, at least one published category, at least one published item |
| **Recommended** | Checkout form fields, an active payment method, an active shipping method, customer pages, storefront pages linked across languages, document numbering series, Joomla mail configured, media folder writable |
| **Optional** | Item fields, search-engine-friendly addresses, HTTPS |

The shop cannot take orders until every required row is done.

Two rows have a **Create for me** button. On "Storefront menu items" it creates the Shop and Cart pages. On
"Customer pages" it creates the account page and the sign-up page. In both you choose the menu they go in: a new
menu named Alfa Commerce, made for you, or an existing one.

The first time you open the Dashboard, a short welcome tour starts by itself. You can close it and start it again
later from the tour menu.

## Take the guided tours

Alfa Commerce installs 33 guided tours. A tour walks through one screen step by step, on the screen itself:
categories, items, payments, shipping, currencies, taxes, discounts, cart rules, order statuses, stock and the
others. Start one from the tour menu in the administrator's header, or from a row of the checklist.

The tours are kept up to date with each release and are translated by the language packs.

## One idea a developer needs

A **payment method** or **shipping method** is a record that a shopper picks at checkout. Each method belongs to one
**plugin**, which does the work, and carries that plugin's settings. The plugin is the code; the method is one
configured use of it. See [Method](../reference/glossary.md#plugins-and-events) in the glossary.
