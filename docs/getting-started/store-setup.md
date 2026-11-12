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

The checklist covers, in the order you would do them: the store's name and contact e-mail, the default currency, a
tax, the checkout form, a payment method, a shipping method, the storefront menu and the customer pages, a category,
an item, item fields, document series, mail, the media folder, search-friendly addresses and HTTPS.

For the storefront menu the checklist can create the shop, cart and account pages for you with one click.

## Take the guided tours

Alfa Commerce installs 33 guided tours. A tour walks through one screen step by step, on the screen itself:
categories, items, payments, shipping, currencies, taxes, discounts, cart rules, order statuses, stock and the
others. Start one from the tour menu in the administrator's header, or from a row of the checklist.

The tours are kept up to date with each release and are translated by the language packs.

## One idea a developer needs

A **payment method** or **shipping method** is a record that a shopper picks at checkout. Each method belongs to one
**plugin**, which does the work, and carries that plugin's settings. The plugin is the code; the method is one
configured use of it. See [Method](../reference/glossary.md#plugins-and-events) in the glossary.
