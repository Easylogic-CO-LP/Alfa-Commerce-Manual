---
sidebar_position: 1
title: Services overview
description: What a service is in Alfa Commerce, the service areas of 2.2.0 with one line each, and which door an extension uses for each job.
---

# Services overview

<AlfaVersion verified="2.2.0" />

A **service** is a class that does one job of the shop and is the only place that does it: write an order, change
an order's status, record a payment, issue a document, calculate a cart. Screens, the REST API and plugins all end
up in the same service, so the same rules apply whoever asked.

Most services are **core's own**. An extension does not call them. It takes part through a **door**: an event it
handles, a method of the base class it extends, or a reader object that Alfa hands it. This page lists the service
areas and names the door for each.

Read [How events reach a plugin](../events/how-events-reach-a-plugin.md) first. The words "commit", "ledger" and
"background work" are in the [Glossary](../reference/glossary.md).

## What it does

The services live in two folders:

| Folder | What is in it |
|---|---|
| `administrator/src/Service` | 21 folders and the file `PriceIndexSyncService.php`. The services that write: orders, payments, shipments, documents, stock, background work. |
| `site/src/Service` | 13 folders and the file `Router.php`. The storefront's services: the cart, the checkout, prices, and the readers that plugins receive. |

The column **For extensions?** in the tables below has three answers:

| Answer | What it means |
|---|---|
| **Yes**, with a door | An extension takes part, through the event, base class or class named |
| **Read only** | Alfa hands the extension an object of this area to read. The object has no method that changes anything. |
| **No, core's own** | This manual documents no door into the area in 2.2.0. Do not call its classes. |

## When it is used

Use this page when you know what you want to do and need to know where to start. Use the other pages of this
section when you need to understand what a service guarantees, so that your plugin does not work against it.

## The areas under administrator/src/Service

| Area | What it is for | For extensions? | Read more |
|---|---|---|---|
| `Card` | The cards Alfa itself puts on the store's home screen (`CoreCardProvider`) | Yes, through the event `onAlfaCollectCards` | [Dashboard cards](../events/notification-and-setup-events.md#dashboard-cards) |
| `Cart` | Every write to the cart tables (`CartRepository`), whose cart it is and who operates it (`CartSubject`), the cart's lifetime, and the objects that cart events hand to plugins (`Cart/Plugin`) | Read only, plus one builder: the charge a plugin declares in `onCartTotals` | [Cart and checkout](./cart-and-checkout.md) |
| `Catalog` | Who may see which items and categories (`CatalogAccessPolicy`), and the notices sent when that changes | Yes, through the events `onCatalogVisibilityChanged` and `onAlfaCatalogEntityChanged` | [Item and catalogue events](../events/item-and-catalogue-events.md#keeping-your-own-copy-of-the-catalogue) |
| `ClearData` | How core calls an extension's Clear Data and records it (`ClearDataExtensions`) | Yes, through the event `onClearData` | [Addressed to one plugin](../events/how-events-reach-a-plugin.md#addressed-to-one-plugin-targeted) |
| `Credit` | Customer credit, as a list of entries that is only added to (`CustomerCreditLedger`) | No, core's own | |
| `Document` | Issuing and voiding sales documents (`DocumentIssuer`), drawing them as a page or a PDF | Yes, through three events | [Documents](./documents.md) |
| `DocumentTypes` | The list of document types (`DocumentTypeRegistry`) | Yes, through the event `onCollectDocumentTypeProviders` | [Adding a document type](../events/document-events.md#the-provider-contract-adding-a-document-type) |
| `Download` | Download access for bought files: granting, removing and serving it (`Entitlements`) | No, core's own | |
| `Inventory` | Stock. `InventoryService` is the only writer of stock. | Yes, through the stock events and a stock allocation provider | [Stock](./stock.md), [Stock events](../events/stock-events.md) |
| `ItemFields` | Turns an item field or value id into its display name (`ItemFieldDisplayResolver`) | No, core's own | |
| `Log` | Every log category Alfa writes to, registered in one place (`AlfaLog`) | No, core's own. A payment or shipping plugin logs through its base class. | [Payment plugins: Logging](../plugins/payment-plugins.md#logging) |
| `Maintenance` | "Clear everything" and "Reset to default" (`FactoryReset`, `ResetToDefault`) | No, core's own. Your data is cleared through `onClearData`. | |
| `Media` | Making the gallery thumbnails again (`ThumbnailRecreation`) | No, core's own | [Media plugins](../plugins/media-plugins.md) |
| `Order` | Writing orders (`OrderCreator`), changing their status (`Transition`), the two ledgers, the status e-mails | Yes, through the payment and shipping base classes and the order events | [Orders](./orders.md), [Payments and shipments](./payments-and-shipments.md) |
| `PriceIndexSyncService.php` | Builds and maintains the stored prices (the price index) | Yes, through the event `onAlfaPricesChanged` | [Pricing](./pricing.md), [Item and catalogue events](../events/item-and-catalogue-events.md#onalfapriceschanged) |
| `Projection` | Sends an item change to everything that stores data derived from the item (`ProjectionManager`) | Yes, through the event `onCollectCatalogProjections` | [Search engine plugins](../plugins/search-plugins.md#oncollectcatalogprojections) |
| `Search` | Catalogue search, and which search engine serves it (`CatalogSearchService`, `SearchEngineRegistry`) | Yes, as a search engine plugin | [Search engine plugins](../plugins/search-plugins.md) |
| `Setup` | The component's own setup checks and the steps of an installation | Yes, through the event `onAlfaCollectSetupChecks` | [Setup checks](../events/notification-and-setup-events.md#setup-checks) |
| `Stats` | The figures behind core's dashboard cards (`DashboardStatsService`) | No, core's own | |
| `Task` | [Background work](../reference/glossary.md#background-work): what a change owes after its save is final, and long work done a part at a time (`Tasks`, `Runner`) | No, core's own. In 2.2.0 a plugin cannot register a task of its own. | |
| `Tools` | The component's own tools on the Tools screen (`CoreToolProvider`) | Yes, through the events `onGetToolActions` and `onExecuteToolAction` | [Other things a plugin can add](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) |
| `ValuePool` | The values a rule builder offers for one field | No, core's own | |

## The areas under site/src/Service

| Area | What it is for | For extensions? | Read more |
|---|---|---|---|
| `Cart` | What an application may ask of a cart (`CartService`), its totals, and the cart as a plugin reads it (`Cart`, `CartLine`) | Read only in events. A module may call `CartService`. | [Cart and checkout](./cart-and-checkout.md) |
| `CartRules` | Works out which cart rules and coupons apply to a cart (`CartRulesEngine`) | No, core's own | [Cart and checkout](./cart-and-checkout.md#cart-rules) |
| `Checkout` | Placing an order from a cart (`OrderPlacement`) | No, core's own. A plugin takes part through the placement events. | [Cart and checkout](./cart-and-checkout.md#placing-an-order) |
| `Data` | One reader for the data a plugin keeps on a payment or shipment row (`PluginPayload`) | Read only | [Shipping plugins: Facts of your own on a parcel](../plugins/shipment-plugins.md#facts-of-your-own-on-a-parcel) |
| `Facet` | Sorts item field values into the groups a filter shows (`FacetGroupResolver`) | Yes, through an item field plugin's event `onItemFieldValueFacetGroups` | [Item field plugins](../plugins/item-field-plugins.md#onitemfieldvaluefacetgroups) |
| `FieldState` | The state a page builds once for fields that depend on each other (`StateBag`) | No, core's own | |
| `Order` | The order, the payment and the shipment as a plugin reads them (`Order`, `Payment`, `Shipment`) | Read only | [Orders](./orders.md#the-order-reader) |
| `Place` | The tree of countries, regions and towns, read once per request (`PlaceTree`) | No, core's own | |
| `Pricing` | Price calculation, and the `Money` object every amount is handed over as | Read only: plugins receive and pass `Money` | [Pricing](./pricing.md) |
| `Router.php` | The storefront's address routing | No, core's own | |
| `Shipping` | A shipping charge with its tax (`ShippingCharge`), and which tax rules a charge carries | No, core's own. A shipping plugin answers the price in `onCalculateShippingCost`. | [Shipping plugins](../plugins/shipment-plugins.md#oncalculateshippingcost) |
| `ShowOn` | Decides on the server whether a conditional field is shown | No, core's own | |
| `Summary` | One labelled line of a money summary (`SummaryRow`) | No, core's own | |
| `Variant` | Finds the combination that matches a shopper's choice of field values (`CombinationResolver`) | No, core's own | |

## Which door do I use

| I want to | Use | Read |
|---|---|---|
| Record a payment, settle it, or refund it | The payment base class (`PaymentsPlugin`). Never the ledger itself. | [Payments and shipments](./payments-and-shipments.md) |
| Record a parcel, its tracking number or its status | The shipping base class (`ShipmentsPlugin`) | [Payments and shipments](./payments-and-shipments.md) |
| React to a new order | The event `onAlfaOrderPlaced` | [Order and cart events](../events/order-and-cart-events.md#onalfaorderplaced) |
| React to a status change | The event `onOrderStatusChange` | [Order and cart events](../events/order-and-cart-events.md#onorderstatuschange) |
| Refuse an order before it is placed | The event `onOrderPlaceValidate` | [Order and cart events](../events/order-and-cart-events.md#onorderplacevalidate) |
| Add a charge to the cart | The event `onCartTotals` and its builder | [Order and cart events](../events/order-and-cart-events.md#oncarttotals) |
| Read the cart in a module | `CartService::ambient()->read(CartResolution::Current)` | [Cart and checkout](./cart-and-checkout.md#reading-the-cart-in-a-module) |
| Move an order to another status | From a payment plugin: `orderTransition()`. From any other extension: `Transition`. | [Orders](./orders.md#transition) |
| Create an order without a cart | `OrderCreator::create()` | [Orders](./orders.md#ordercreator) |
| Read an order's lines, addresses, payments and parcels | The `Order` reader an event hands you | [Orders](./orders.md#the-order-reader) |
| Follow or refuse a stock movement | The stock events | [Stock events](../events/stock-events.md) |
| Change or refuse a document before it is issued | The event `onDocumentBeforeIssue` | [Document events](../events/document-events.md#ondocumentbeforeissue) |
| Add a document type | A document type provider | [Document events](../events/document-events.md#the-provider-contract-adding-a-document-type) |
| Tell staff about something that needs them | `NotificationHelper::push()` | [Notifications](./notifications.md) |
| Keep my own copy of prices or of the catalogue | `onAlfaPricesChanged`, or a projection | [Item and catalogue events](../events/item-and-catalogue-events.md#keeping-your-own-copy-of-the-catalogue) |

## What you must provide

Nothing for this page. Each door names what it needs on the page it links to.

## What happens next

When you go through a door, the service behind it does its checks, saves, and tells the other plugins. That is what
makes two plugins from two authors work on one order without knowing about each other.

## What can go wrong

| What you do | What happens |
|---|---|
| Write to an Alfa table yourself (`#__alfa_orders`, `#__alfa_order_payments`, `#__alfa_order_shipments`, the stock tables) | None of the service's checks run, nothing is written to the order's History, no event is announced and no follow-up work is recorded. The totals, the stock and the documents can stop agreeing with each other. |
| Call a class marked "No, core's own" | It may work today. Its methods can change in any release without a note in this manual. |
| Call a ledger from a payment or shipping plugin instead of the base class | The row does not record your plugin as its [plugin of record](../plugins/overview.md#the-plugin-of-record), so your later changes to it are refused. |

## Changed in 2.2.0

- **Changed in 2.2.0.** The helper classes of 2.1 and earlier (`CartHelper`, `OrderPlaceHelper`, `OrderStockHelper`,
  `OrderPaymentHelper`, `OrderShipmentHelper`) no longer exist. Their work is done by `CartService`,
  `OrderPlacement`, `StockPolicy`, `PaymentLedger` and `ShipmentLedger`.

## Not documented yet

- The areas marked "No, core's own" have no page. The table gives each one line only, taken from the comment at
  the top of the area's main class.
- The task engine and the REST API have pages of their own outside this section.
- Customer credit, download access and the dashboard figures: whether an extension may read them, and how.
