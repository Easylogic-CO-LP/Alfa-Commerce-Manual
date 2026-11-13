---
sidebar_position: 1
title: Glossary
description: The words this manual uses, each in plain language with the name it has in the code.
---

# Glossary

<AlfaVersion verified="2.2.0" />

The words this manual uses, in plain language. Where a word has a name in the code, that name follows in brackets.
Each page explains a word the first time it uses it; this page collects them.

## Plugins and events

**Event.** Alfa Commerce telling plugins that something is happening, so that they can take part. See
[How events reach a plugin](../events/how-events-reach-a-plugin.md).

**Listener.** The method of a plugin that Alfa calls for an event.

**Announced to everyone (a broadcast event).** An event every enabled plugin may hear, whatever its group. A plugin
lists the ones it handles in `getSubscribedEvents()`.

**Addressed to one plugin (a targeted event).** An event that is the job of one named plugin. No other plugin sees
it. A plugin declares the ones it handles in its targeted declaration (`TARGETED_EVENTS` of its base class, or
`getTargetedHandlers()`).

**"Before" and "after" events.** A "before" event asks whether something may happen; a listener that throws an error
stops it. An "after" event reports what already happened; a listener that fails is logged and the others still run.

**Plugin group.** The folder a plugin lives in under `plugins/`, which says what kind of plugin it is: `alfa-payments`,
`alfa-shipments`, `alfa-form-fields`, `alfa-item-fields`, `alfa-search`, `alfa`, `system` and so on. The groups whose
name starts with `alfa` are Alfa Commerce's. `system`, `console`, `task`, `content`, `user` and the rest are Joomla's
own, and a plugin of such a group is an ordinary Joomla plugin.

**Feature plugin.** A plugin of the `alfa` group. Alfa loads the group whenever the shop runs, so it is the home of
plugins that react to shop events or add screens, cards and tools.

**Base class.** The class a plugin of an Alfa family extends: `PaymentsPlugin`, `ShipmentsPlugin`, `ItemFieldsPlugin`,
`FormFieldsPlugin` or `SearchEnginePlugin` (all in `administrator/src/Plugin`).

**Plugin name (group.element).** How a plugin names itself when it adds something to Alfa: its group and its element
joined by a dot, for example `alfa-payments.standard` (`PluginId`).

**Method.** The record a shopper picks at checkout: "Bank transfer", "Courier". A method belongs to one plugin and
carries that plugin's settings. The **plugin** is the code; the **method** is one configured use of it. One plugin
can serve several methods.

**Plugin of record.** The plugin that took an order's payment or shipment, as written on the order and on each
payment and shipment row. Alfa keeps using that plugin for the order, whatever the method's settings say later.

**Unavailable plugin.** A plugin Alfa cannot call: not installed, disabled, not loaded for the current user, or
failing to start (`PluginUnavailable`). Alfa refuses the request and tells staff. It never asks another plugin
instead.

**Standard plugins.** The payment plugin and the shipping plugin that ship with Alfa Commerce
(`alfa-payments.standard`, `alfa-shipments.standard`). The manual uses them as its examples.

## Saving

**Transaction.** A group of database changes that are stored together or not at all.

**Commit ("the save is final").** The moment a transaction's changes are stored for good. Before it, everything can
still be undone; after it, nothing can.

**After the commit.** Work that Alfa starts only once the save is final: e-mails, documents, plugin reactions,
notifications. It never runs for a change that was undone.

**Lock.** A short reservation that keeps two requests from changing the same thing at the same moment. Alfa locks an
order's row while it writes a payment or a refund (`PaymentLedger`). The shipment ledger takes no lock on the order:
its conditional write (`updateIfStatus()`) holds the shipment's own row. Two further locks exist for plugins: a
payment plugin may hold `OrderMoneyLock` around its own capture or release, and for a refund never across the call
to the provider. A shipping plugin may hold `ShipmentBookingLock` around a booking. See
[Orders](../services/orders.md).

**Ledger.** The one place that writes an order's payments and refunds (`PaymentLedger`) or its shipments
(`ShipmentLedger`). Plugins reach the ledgers through their base class, never directly.

## Background work

**Background work.** Follow-up work that Alfa records together with a change and carries out afterwards, so that a
slow mail server or a closed browser cannot lose it. Staff see it under Tools > Tasks.

**Task.** One small piece of background work: send this e-mail, issue this document. A task that fails is tried again
later when trying again is safe. Where it is not (an e-mail that may already have left, or the plugins' reaction to a
status change), it waits for staff, who run it again or mark it resolved under Tools > Tasks.

**Job.** Long background work over many records, done a part at a time, which continues from where it stopped: for
example, rebuilding the search entry of every item.

**Held.** A task whose outcome cannot be known (an e-mail that may or may not have left). Alfa does not try it again
by itself; it waits for staff to decide.

In 2.2.0 only Alfa Commerce itself creates tasks and jobs. A plugin cannot register its own.

## Catalogue and prices

**Item.** What the shop sells. The manual and the product say "item", not "product".

**Item field.** A property of an item that the shopper sees or chooses, such as a size or a colour (plugin group
`alfa-item-fields`).

**Combination.** One sellable choice of an item's field values, for example "Large, Blue".

**Form field.** A field of the customer's details at registration and checkout, such as a phone number or a country
(plugin group `alfa-form-fields`). Not to be confused with an item field.

**Customer group.** A Joomla user group with Alfa's own settings on it, used to give some customers their own prices, taxes and discounts.

**Price index.** The prices of every item, worked out in advance and stored, so that the price and discount filters and
sorting by price do not have to calculate them. The prices shown on a page are still worked out when the page is
drawn. Core alone writes the index: when an item, a discount or a tax changes, and when a category or a manufacturer is
deleted. It announces each write with the event `onAlfaPricesChanged`. See [Pricing](../services/pricing.md).

**Projection.** Stored data that is derived from the catalogue and can always be rebuilt from it, such as the search
entry of an item. Tools > Database Sync rebuilds projections.

**Cart rule.** A promotion applied in the cart, with or without a code the shopper types. Cart rules replaced the
earlier coupons.

**Place.** A country, a region inside it, or a town, in one tree. Prices, taxes, discounts and payment and shipping
methods can be limited to places.

## Stock

**Reservation.** Stock set aside for an order that has not left the warehouse yet.

**Claim.** What an order's status asks of the stock: nothing, a reservation, or the goods themselves taken from
stock. When a status changes, Alfa moves the stock to match the new status's claim.

**Stock movement.** One recorded change of stock, with its reason. The quantity shown on an item follows the movements; it is
not a figure to write to directly.

## Documents and languages

**Document.** An invoice, a credit note or another paper issued for an order, numbered and kept as issued.

**Document type and series.** The kind of document (its **type**) and the numbered sequence it is issued in (its
**series**).

**Content language.** A language the site's content exists in, as set up in Joomla's Content Languages.

**Default content language.** The content language whose text is shown wherever a translation is missing.

**Language pack.** A separate, installable package with Alfa Commerce's texts in one language. Alfa Commerce itself
ships in English only.
