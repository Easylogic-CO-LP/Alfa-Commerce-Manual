---
sidebar_position: 8
title: Event index
description: Every event Alfa Commerce 2.2.0 sends to plugins, with its class, how it is delivered, whether a plugin can refuse, when it fires, where the code sends it and the page that explains it.
---

# Event index

<AlfaVersion verified="2.2.0" />

This page lists every event that Alfa Commerce 2.2.0 sends to plugins. It was built from the code: every place where
the component hands an event to a plugin was opened and read. Use it to find an event by name, then follow the link
in the last column to the page that explains it.

Read [How events reach a plugin](./how-events-reach-a-plugin.md) first. To see events in the order they fire, read
[Event flows](./flows.md).

## What it does

One table per area. Every row is one event name.

| Column | What it tells you |
|---|---|
| **Event** | The name your plugin lists or declares |
| **Class** | The class of the object your handler receives, with its folder under `administrator/src/Event/`. The namespace is `Alfa\Component\Alfa\Administrator\Event\` plus the folder. |
| **Delivered** | **Announced**: to everyone who listed it in `getSubscribedEvents()` (broadcast). **One plugin**: addressed to one plugin, which declares it as a targeted handler. **Each in turn**: addressed to each enabled plugin of the `alfa` group that the customer's access levels admit, one after the other, each as a targeted handler. |
| **Can refuse** | **Yes**: a handler can stop what was asked, and the cell says how. **No**: an error in a handler is written to the log and the work goes on. **No veto**: the handler does the work itself, so an error in it is the failure of the request. |
| **Fires** | **Before the save**: nothing is stored yet. **After the save is final**: the change is stored for good (after the commit). **While a page is drawn**. **On request**: whenever Alfa needs the answer. |
| **Sent in** | The file and line where the event is handed to plugins, from the root of the repository |
| **Documented on** | The page that explains the event |

## When it is used

- You know an event's name and want its page.
- You want to know whether an event is announced to everyone or addressed to one plugin, before you decide where to
  declare it.
- You are reading Alfa's code and want the line where an event is sent.

## The totals

| What was counted | Count |
|---|---|
| Files under `administrator/src/Event/` | 134 |
| Event classes that can be created (not abstract) | 100 |
| Of those, sent to plugins in 2.2.0 | 97 |
| Of those, defined and not sent in 2.2.0 | 3 |
| Abstract bases, interfaces and traits | 22 |
| Other helper classes and enums in the folder | 12 |
| Different event names sent in 2.2.0 | 88 |
| Lines of code that hand an event to plugins (outside the plugin helper itself) | 62, in 38 files |

Eight names are sent with more than one class, because a payment plugin, a shipping plugin and an item field plugin
each get their own class under the same name. That is why 88 names use 97 classes.

No event is sent from `api/src`, from the modules or from the shipped plugins. All of them are sent from
`administrator/src`, `site/src` and one layout, `site/layouts/list/filter_form.php`.

## Administrator screens

All fifteen are announced after the plugins of the group `alfa` are loaded. A screen sends them only when its entity
has a name in the code and at least one plugin listens. The classes are in `Admin/`. Every one is handed over in
`administrator/src/Event/Admin/AlfaAdminAware.php`: line 91 for the three that can refuse, line 85 for the others.
The column below gives the line that raises each one.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaAdminListQuery` | `AdminListQueryEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:155` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistquery) |
| `onAlfaAdminListFilters` | `AdminListFiltersEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:225` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistfilters) |
| `onAlfaAdminListRowData` | `AdminListRowDataEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:295` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistrowdata) |
| `onAlfaAdminListColumns` | `AdminListColumnsEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:318` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistcolumns) |
| `onAlfaAdminListRowActions` | `AdminListRowActionsEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:278` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistrowactions) |
| `onAlfaAdminListBulkActions` | `AdminListBulkActionsEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:300` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistbulkactions) |
| `onAlfaAdminToolbar` | `AdminToolbarEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:201` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadmintoolbar) |
| `onAlfaAdminRender` | `AdminRenderEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:154` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminrender) |
| `onAlfaAdminForm` | `AdminFormEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaAdminModel.php:271` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminform) |
| `onAlfaAdminPrepareData` | `AdminPrepareDataEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaAdminModel.php:306` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminpreparedata) |
| `onAlfaAdminValidate` | `AdminValidateEvent` | Announced | Yes, by throwing an error | Before the save | `administrator/src/Model/AlfaAdminModel.php:378` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminvalidate) |
| `onAlfaAdminBeforeSave` | `AdminBeforeSaveEvent` | Announced | Yes, by throwing an error | Before the save | `administrator/src/Model/AlfaAdminModel.php:646` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminbeforesave) |
| `onAlfaAdminAfterSave` | `AdminAfterSaveEvent` | Announced | No | After the save of the record's own row is final | `administrator/src/Model/AlfaAdminModel.php:440` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminaftersave) |
| `onAlfaAdminBeforeDelete` | `AdminBeforeDeleteEvent` | Announced | Yes, by throwing an error | Before the save | `administrator/src/Model/AlfaAdminModel.php:734` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminbeforedelete) |
| `onAlfaAdminAfterDelete` | `AdminAfterDeleteEvent` | Announced | No | After the save is final | `administrator/src/Model/AlfaAdminModel.php:527` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminafterdelete) |

## Menu, permissions, dashboard, setup and tools

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaBuildMenu` | `BuildMenuEvent` in `Menu/` | Announced | No | While a page is drawn | `administrator/src/Menu/MenuBuilder.php:126` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfabuildmenu) |
| `onAlfaGetAccessActions` | `GetAccessActionsEvent` in `Access/` | Announced | No | While a page is drawn | `administrator/src/Field/AlfarulesField.php:74` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfagetaccessactions) |
| `onAlfaCollectCards` | `CollectCardsEvent` in `Card/` | Announced | No | While a page is drawn | `administrator/src/Card/CardRegistry.php:362` | [Notification and setup events](./notification-and-setup-events.md) |
| `onAlfaCollectSetupChecks` | `CollectSetupChecksEvent` in `Setup/` | Announced | No | On request | `administrator/src/Helper/SetupHelper.php:446` | [Notification and setup events](./notification-and-setup-events.md) |
| `onGetToolActions` | `GetToolActionsEvent` in `Tools/` | Announced. The plugin a tool is claimed for is then asked once more, alone. | No | While a page is drawn | `administrator/src/Helper/ToolRegistry.php:152` and `:588` | [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) |
| `onExecuteToolAction` | `ExecuteToolActionEvent` in `Tools/` | One plugin | No veto | On request | `administrator/src/Helper/ToolRegistry.php:362` | [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) |
| `onClearData` | `ClearDataEvent` in `Tools/` | One plugin | No | On request | `administrator/src/Service/ClearData/ClearDataExtensions.php:493` | [Payment plugins](../plugins/payment-plugin-events.md#oncleardata), [Shipping plugins](../plugins/shipment-plugin-events.md#oncleardata), [Item field plugins](../plugins/item-field-plugin-events.md#oncleardata), [Search engine plugins](../plugins/search-plugins.md#oncleardata) |

The two menu and permission events are handed over in `administrator/src/Panel/PanelDispatcher.php:114`.

## Admin panels

All six are addressed to the one plugin that owns the panel, through
`administrator/src/Panel/PanelDispatcher.php:86`. The classes are in `Panel/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaPanelToolbar` | `PanelToolbarEvent` | One plugin | No | While a page is drawn | `administrator/src/View/Panel/HtmlView.php:267` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneltoolbar) |
| `onAlfaPanelListQuery` | `PanelListQueryEvent` | One plugin | No | While a page is drawn | `administrator/src/Model/PanelModel.php:322` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanellistquery) |
| `onAlfaPanelView` | `PanelViewEvent` | One plugin | No | While a page is drawn | `administrator/src/View/Panel/HtmlView.php:142` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanelview) |
| `onAlfaPanelSave` | `PanelSaveEvent` | One plugin | No veto | On request. The plugin does the save. | `administrator/src/Controller/PanelController.php:127` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanelsave) |
| `onAlfaPanelDelete` | `PanelDeleteEvent` | One plugin | No veto | On request. The plugin does the delete. | `administrator/src/Controller/PanelController.php:173` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneldelete) |
| `onAlfaPanelTask` | `PanelTaskEvent` | One plugin | No veto | On request | `administrator/src/Controller/PanelController.php:217` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneltask) |

## Payment and shipping plugins

All of these are addressed to one plugin. The classes are in `Payments/` and in `Shipments/`. Where a row names two
classes, the first goes to a payment plugin and the second to a shipping plugin.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemView` | `ItemViewEvent` in `Payments/`, `ItemViewEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/View/Item/HtmlView.php:246` | [Payment plugins](../plugins/payment-plugin-events.md#onitemview), [Shipping plugins](../plugins/shipment-plugin-events.md#onitemview) |
| `onCartViewAssets` | `CartViewAssetsEvent` in `Payments/`, `CartViewAssetsEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/Service/Cart/CartPluginDispatch.php:454` | [Payment plugins](../plugins/payment-plugin-events.md#oncartviewassets), [Shipping plugins](../plugins/shipment-plugin-events.md#oncartviewassets) |
| `onCartView` | `CartViewEvent` in `Payments/`, `CartViewEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/Service/Cart/CartPluginDispatch.php:365` | [Payment plugins](../plugins/payment-plugin-events.md#oncartview), [Shipping plugins](../plugins/shipment-plugin-events.md#oncartview) |
| `onCalculateShippingCost` | `CalculateShippingCostEvent` in `Shipments/` | One plugin | Yes. `setUnavailable()`, or an error, takes the method off the cart. | On request, each time the cart is totalled | `site/src/Service/Cart/CartPluginDispatch.php:152` | [Shipping plugins](../plugins/shipment-plugin-events.md#oncalculateshippingcost) |
| `onOrderBeforePlace` | `OrderBeforePlaceEvent` in `Payments/`, `OrderBeforePlaceEvent` in `Shipments/` | One plugin | Yes, by throwing an error | Before the save | `site/src/Service/Checkout/OrderPlacement.php:956` | [Payment plugins](../plugins/payment-plugin-events.md#onorderbeforeplace), [Shipping plugins](../plugins/shipment-plugin-events.md#onorderbeforeplace) |
| `onOrderAfterPlace` | `OrderAfterPlaceEvent` in `Payments/`, `OrderAfterPlaceEvent` in `Shipments/` | One plugin | No | After the save is final | `site/src/Service/Checkout/OrderPlacement.php:956` | [Payment plugins](../plugins/payment-plugin-events.md#onorderafterplace), [Shipping plugins](../plugins/shipment-plugin-events.md#onorderafterplace) |
| `onOrderProcessView` | `OrderProcessViewEvent` in `Payments/` | One plugin | No | While a page is drawn | `site/src/View/Cart/HtmlView.php:346` | [Payment plugins](../plugins/payment-plugin-events.md#onorderprocessview) |
| `onOrderCompleteView` | `OrderCompleteViewEvent` in `Payments/` | One plugin | No | While a page is drawn | `site/src/View/Cart/HtmlView.php:346` | [Payment plugins](../plugins/payment-plugin-events.md#onordercompleteview) |
| `onPaymentResponse` | `PaymentResponseEvent` in `Payments/` | One plugin | No veto | On request, when the shopper comes back | `site/src/Controller/PaymentController.php:86` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentresponse) |
| `onPaymentWebhook` | `PaymentWebhookEvent` in `Payments/` | One plugin | No veto. An error is answered "500" so that the provider tries again. | On request, when the provider calls | `site/src/Controller/ProviderCallbacks.php:82` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentwebhook) |
| `onShipmentResponse` | `ShipmentResponseEvent` in `Shipments/` | One plugin | No veto | On request, when the shopper comes back | `site/src/Controller/ShipmentController.php:97` | [Shipping plugins](../plugins/shipment-plugin-events.md#onshipmentresponse) |
| `onShipmentWebhook` | `ShipmentWebhookEvent` in `Shipments/` | One plugin | No veto. An error is answered "500" so that the carrier tries again. | On request, when the carrier calls | `site/src/Controller/ProviderCallbacks.php:82` | [Shipping plugins](../plugins/shipment-plugin-events.md#onshipmentwebhook) |
| `onGetActions` | `GetPaymentActionsEvent` in `Payments/`, `GetShipmentActionsEvent` in `Shipments/` | One plugin | No | While a page is drawn | `administrator/src/Helper/ActionRegistry.php:1843` | [Payment plugins](../plugins/payment-plugin-events.md#ongetactions), [Shipping plugins](../plugins/shipment-plugin-events.md#ongetactions) |
| `onExecuteAction` | `ExecutePaymentActionEvent` in `Payments/`, `ExecuteShipmentActionEvent` in `Shipments/` | One plugin | No veto | On request, when staff press a button | `administrator/src/Helper/ActionRegistry.php:643` and `:701` | [Payment plugins](../plugins/payment-plugin-events.md#onexecuteaction), [Shipping plugins](../plugins/shipment-plugin-events.md#onexecuteaction) |
| `onAdminOrderDelete` | `AdminOrderDeleteEvent` in `Payments/`, `AdminOrderDeleteEvent` in `Shipments/` | One plugin | Yes. `setResult(false)` keeps the order. | Before the save | `administrator/src/Model/OrderModel.php:3469` | [Payment plugins](../plugins/payment-plugin-events.md#onadminorderdelete), [Shipping plugins](../plugins/shipment-plugin-events.md#onadminorderdelete) |
| `onPaymentCheckup` | `PaymentCheckupEvent` in `Payments/` | One plugin | No | On request, from the method's settings page | `administrator/src/Helper/PaymentCheckupHelper.php:102` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentcheckup) |

## Cart and orders

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCartTotals` | `CartTotalsEvent` in `Cart/` | Each in turn | No | On request, each time the cart is totalled | `site/src/Service/Cart/CartPluginDispatch.php:284` | [Order and cart events](./order-and-cart-events.md) |
| `onCartItemDisplay` | `CartItemDisplayEvent` in `Items/` | Each in turn | No | While a page is drawn | `site/src/Service/Cart/CartLinePresenter.php:143` | [Order and cart events](./order-and-cart-events.md) |
| `onOrderPlaceValidate` | `OrderPlaceValidateEvent` in `Orders/` | Each in turn | Yes. `reject()`, or an error, refuses the order. | Before the save | `site/src/Service/Checkout/OrderPlacement.php:1183` | [Order and cart events](./order-and-cart-events.md) |
| `onAlfaOrderPlaced` | `OrderPlacedEvent` in `Orders/` | Announced | No | After the save is final | `site/src/Service/Checkout/OrderPlacement.php:681` | [Order and cart events](./order-and-cart-events.md) |
| `onOrderStatusChange` | `OrderStatusChangeEvent` in `Orders/` | Announced. Each listener is called on its own and its result is recorded. | No | After the save is final | `administrator/src/Service/Order/Task/OrderStatusEvent.php:148` | [Order and cart events](./order-and-cart-events.md) |

## Item fields and form fields

The item field classes are in `ItemFields/`. Each event goes to the plugin of one field, except
`onItemsListPrepare`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemView` | `ItemViewEvent` in `ItemFields/` | One plugin | No veto | While a page is drawn | `site/src/Model/ItemModel.php:342` and `administrator/src/Model/OrderModel.php:2220` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemview) |
| `onItemListPrepare` | `ItemListPrepareEvent` | One plugin | No | While a page is drawn | `site/src/Model/ItemsModel.php:2246` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemlistprepare) |
| `onItemsListPrepare` | `ItemsListPrepareEvent` | Announced, after the plugins of `alfa-item-fields` are loaded | No | While a page is drawn | `site/src/Model/ItemsModel.php:2198` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemslistprepare) |
| `onItemFieldValueFacetGroups` | `ValueFacetGroupsEvent` | One plugin | No | While a page is drawn | `site/src/Model/ItemsModel.php:2980` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemfieldvaluefacetgroups) |
| `onValidateCartAdd` | `ValidateCartAddEvent` | One plugin | Yes. `setError()`, or an error, refuses the selection. | Before the save, when an item is added to the cart | `administrator/src/Helper/ItemConfigurationHelper.php:161` | [Item field plugins](../plugins/item-field-plugin-events.md#onvalidatecartadd) |
| `onPrepareForCart` | `PrepareForCartEvent` | One plugin | Yes. `setError()`, or an error, refuses the selection. | Before the save, when an item is added to the cart | `administrator/src/Helper/ItemConfigurationHelper.php:651` | [Item field plugins](../plugins/item-field-plugin-events.md#onprepareforcart) |
| `onCalculateItemPrice` | `CalculateItemPriceEvent` | One plugin | No | On request, each time a price is worked out | `site/src/Helper/VariantHelper.php:504` | [Item field plugins](../plugins/item-field-plugin-events.md#oncalculateitemprice) |
| `onCartItemView` | `CartItemViewEvent` | One plugin | No veto | While a page is drawn | `site/src/Service/Cart/CartLinePresenter.php:106` | [Item field plugins](../plugins/item-field-plugin-events.md#oncartitemview) |
| `onGetFieldActions` | `GetFieldActionsEvent` | One plugin | No | While a page is drawn | `administrator/src/Helper/ActionRegistry.php:1752` | [Item field plugins](../plugins/item-field-plugin-events.md#ongetfieldactions) |
| `onExecuteFieldAction` | `ExecuteFieldActionEvent` | One plugin | No veto | On request, when staff press a button | `administrator/src/Controller/ItemController.php:1210` and `administrator/src/Helper/ActionRegistry.php:517` | [Item field plugins](../plugins/item-field-plugin-events.md#onexecutefieldaction) |
| `onAlfaFormFieldsPrepareDom` | `PrepareDomEvent` in `Fields/` | One plugin. It is not declared as a handler: Alfa calls the plugin's `prepareDom()` method and hands it this object. | No | While a form is built | `administrator/src/Helper/FieldsHelper.php:296` | [Form field plugins](../plugins/form-field-plugins.md#the-operation-preparedom) |

`onCalculateItemPrice` has one exception. When Joomla's debug mode is on, an error in the handler is thrown again,
so that a developer sees it.

## Items and the catalogue

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemDisplay` | `ItemDisplayEvent` in `Items/` | Announced | No | While a page is drawn | `site/src/Model/ItemModel.php:392` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onItemPrepareForm` | `ItemPrepareFormEvent` in `Items/` | Announced | No | While a page is drawn | `administrator/src/Model/ItemModel.php:407` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onItemAfterSave` | `ItemAfterSaveEvent` in `Items/` | Announced | No | After the save is final, as the last step of an item save | `administrator/src/Model/ItemModel.php:1158` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onAlfaPricesChanged` | `PricesChangedEvent` in `Catalog/` | Announced | No | After the save is final | `administrator/src/Service/PriceIndexSyncService.php:1602` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onAlfaCatalogEntityChanged` | `CatalogEntityChangedEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | Right after the record is written. It does not wait for a bigger save around it. | `administrator/src/Service/Catalog/EntityChangeNotifier.php:73` | [Search engine plugins](../plugins/search-plugins.md#onalfacatalogentitychanged) |
| `onCatalogVisibilityChanged` | `VisibilityChangedEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | Right after the record is written. It does not wait for a bigger save around it. | `administrator/src/Service/Catalog/VisibilityNotifier.php:113` | [Search engine plugins](../plugins/search-plugins.md#oncatalogvisibilitychanged) |
| `onCollectCatalogProjections` | `CollectCatalogProjectionsEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | On request | `administrator/src/Service/Projection/ProjectionManager.php:119` | [Search engine plugins](../plugins/search-plugins.md#oncollectcatalogprojections) |

## Search

The classes are in `Search/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCollectSearchEngines` | `CollectSearchEnginesEvent` | Announced, after `alfa-search` is loaded | No | On request | `administrator/src/Service/Search/SearchEngineRegistry.php:225` | [Search engine plugins](../plugins/search-plugins.md#oncollectsearchengines) |
| `onAlfaSearchInputLayout` | `SearchInputLayoutEvent` | One plugin | No | While a page is drawn | `site/layouts/list/filter_form.php:114` | [Search engine plugins](../plugins/search-plugins.md#onalfasearchinputlayout) |
| `onAlfaResultSetRender` | `ResultSetRenderEvent` | Announced, after `alfa-search` is loaded | No | While a page is drawn | `site/src/View/Items/HtmlView.php:355` | [Search engine plugins](../plugins/search-plugins.md#onalfaresultsetrender) |

## Media

All five are announced after the plugins of `alfa-media` are loaded, in
`administrator/src/Helper/MediaHelper.php:1964`. The classes are in `Media/`. The column gives the line that builds
each one. They fire while a record is being saved. A media event does not tell you whether that save is final.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaMediaValidate` | `ValidateEvent` | Announced | Yes. `setValid(false)` skips the file. An error does not. | Before the image is stored | `administrator/src/Helper/MediaHelper.php:1797` | [Media plugins](../plugins/media-plugins.md#onalfamediavalidate) |
| `onAlfaMediaBeforeProcess` | `BeforeProcessEvent` | Announced | No | Before the image is stored | `administrator/src/Helper/MediaHelper.php:1870` | [Media plugins](../plugins/media-plugins.md#onalfamediabeforeprocess) |
| `onAlfaMediaThumbnail` | `ThumbnailEvent` | Announced | No | When a thumbnail is made | `administrator/src/Helper/MediaHelper.php:1870` | [Media plugins](../plugins/media-plugins.md#onalfamediathumbnail) |
| `onAlfaMediaAfterProcess` | `AfterProcessEvent` | Announced | No | After the file is stored, before the image's row is written | `administrator/src/Helper/MediaHelper.php:1899` | [Media plugins](../plugins/media-plugins.md#onalfamediaafterprocess) |
| `onAlfaMediaBeforeDelete` | `BeforeDeleteEvent` | Announced | No | Before the files and rows of an image are removed | `administrator/src/Helper/MediaHelper.php:1938` | [Media plugins](../plugins/media-plugins.md#onalfamediabeforedelete) |

## Stock

All nine are sent from `administrator/src/Service/Inventory/InventoryService.php`. The classes are in `Inventory/`.
The first eight are announced after the plugins of `alfa` are loaded: the "before" events at line 5632, the "after"
events at line 5647. The column gives the line of each command.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onInventoryBeforeReserve` | `InventoryBeforeReserveEvent` | Announced | Yes, by throwing an error | Before the stock is set aside | `InventoryService.php:425` | [Stock events](./stock-events.md) |
| `onInventoryBeforeCommit` | `InventoryBeforeCommitEvent` | Announced | Yes, by throwing an error | Before goods are taken from stock | `InventoryService.php:2032` | [Stock events](./stock-events.md) |
| `onInventoryBeforeRelease` | `InventoryBeforeReleaseEvent` | Announced | Yes, by throwing an error | Before the reservations of an order are let go | `InventoryService.php:709` | [Stock events](./stock-events.md) |
| `onInventoryReserved` | `InventoryReservedEvent` | Announced | No | After the save is final | `InventoryService.php:601` | [Stock events](./stock-events.md) |
| `onInventoryCommitted` | `InventoryCommittedEvent` | Announced | No | After the save is final | `InventoryService.php:2433` | [Stock events](./stock-events.md) |
| `onInventoryReleased` | `InventoryReleasedEvent` | Announced | No | After the save is final | `InventoryService.php:772` and `:888` | [Stock events](./stock-events.md) |
| `onInventoryAdjusted` | `InventoryAdjustedEvent` | Announced | No | After the save is final | `InventoryService.php:3674`, `:3993` and `:7715` | [Stock events](./stock-events.md) |
| `onInventoryTransferred` | `InventoryTransferredEvent` | Announced | No | After the save is final | `InventoryService.php:3845` | [Stock events](./stock-events.md) |
| `onCollectStockAllocationProviders` | `CollectStockAllocationProvidersEvent` | Announced, after `alfa-inventory` is loaded | No | On request, the first time a stock service object must choose a location | `InventoryService.php:5605` | [Stock events](./stock-events.md) |

## Documents

The classes are in `Documents/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCollectDocumentTypeProviders` | `CollectDocumentTypeProvidersEvent` | Announced | No | On request, when the Document Types screen is shown and when staff press its sync button | `administrator/src/Service/DocumentTypes/DocumentTypeRegistry.php:555` | [Document events](./document-events.md) |
| `onDocumentBeforeIssue` | `DocumentBeforeIssueEvent` | Announced | Yes, by throwing an error | Before the save, with no save open | `administrator/src/Service/Document/DocumentIssuer.php:2988` | [Document events](./document-events.md) |
| `onDocumentIssued` | `DocumentIssuedEvent` | Announced | No | After the save is final | `administrator/src/Service/Document/DocumentIssuer.php:577`, handed over at `:3806` | [Document events](./document-events.md) |
| `onDocumentVoided` | `DocumentVoidedEvent` | Announced | No | After the save is final | `administrator/src/Service/Document/DocumentIssuer.php:995`, handed over at `:3806` | [Document events](./document-events.md) |

## Notifications

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaNotificationPushed` | `NotificationPushedEvent` in `Notifications/` | Announced | No | After the save is final | `administrator/src/Helper/NotificationHelper.php:475` | [Notification and setup events](./notification-and-setup-events.md) |

## Joomla events Alfa raises or relies on

Joomla's own events are not Alfa events and are not listed above. These are the ones Alfa's code touches.

| Joomla event | What Alfa does with it | Where |
|---|---|---|
| `onContentAfterSave`, `onContentAfterDelete` | Joomla announces them when a record is saved or deleted. When Alfa's save runs inside a bigger save or under one of Alfa's locks, Alfa holds them back and announces them itself once the save is final, never for a change that was undone (since 2.1.4). | `administrator/src/Model/AlfaAdminModel.php:692` |
| The model's before-delete event (`onContentBeforeDelete` unless a model names another) | A model that deletes inside a save or a lock of its own asks this event itself, before it opens them. A listener that answers `false`, or throws, refuses the delete. | `administrator/src/Model/AlfaAdminModel.php:578` |
| `onContentBeforeSave` and Joomla's other save events | Announced by Joomla itself, inside the record's write. Alfa does not send them. | Joomla's `AdminModel` |
| `onTableBeforeStore` | Alfa listens to it, last of all listeners, while an item's row is stored. It sends nothing. | `administrator/src/Table/ItemTable.php:155` |
| `onPageCacheIsExcluded` | Alfa listens to it and answers "yes", so that the cart and filtered listings are not served from Joomla's page cache. | `site/src/View/Cart/HtmlView.php:394`, `site/src/View/Items/HtmlView.php:377` |
| `onAfterDispatch` | Alfa listens to it to place its menu in the administrator's sidebar. | `administrator/src/Extension/AlfaComponent.php:118` |

Two more names appear in the code and are not events for plugins: `onAlfaContentAfterTheCommit` and
`onAlfaContentDeleteAskedBeforeTheLock`. Alfa gives Joomla's model these private names for the length of one call, so
that it can hold Joomla's own event back as the first two rows describe. Do not listen to them.

## Defined, not dispatched in 2.2.0

These classes exist in `administrator/src/Event/`, but no code in the core repository of 2.2.0 creates them or sends
them.

| Class | Event name | What the code says |
|---|---|---|
| `StoreReferenceEvent` in `Payments/` | `onPaymentStoreReference` | Defined, not dispatched in 2.2.0. The name is in the payment plugins' list of targeted events. See [Payment plugins](../plugins/payment-plugin-events.md#onpaymentstorereference-and-onpaymentchargereference). |
| `ChargeReferenceEvent` in `Payments/` | `onPaymentChargeReference` | Defined, not dispatched in 2.2.0. As above. |
| `StoredCredentialIntentEvent` in `Payments/` | None in the code | Defined, not dispatched in 2.2.0. No event name is given to it anywhere. |

## Building blocks, not events

These files are in the same folder, but a plugin never receives them as an event of their own.

| Kind | Files |
|---|---|
| Abstract bases (14) | `AlfaAdminEvent` in `Admin/`. `FieldsEvent` in `Fields/`. `GeneralEvent`, `RedirectEvent` and `LayoutEvent` in `General/`. `InventoryAfterEvent` in `Inventory/`. `MediaEvent` in `Media/`. `PanelResultEvent` in `Panel/`. `PaymentsEvent`, `PaymentsRedirectEvent` and `PaymentsLayoutEvent` in `Payments/`. `ShipmentsEvent`, `ShipmentsRedirectEvent` and `ShipmentsLayoutEvent` in `Shipments/`. |
| Interface (1) | `ScopedFieldEvent` in `ItemFields/` |
| Traits (7) | `AlfaAdminAware` in `Admin/`. `HasMethodArgumentTrait` in `General/Traits/`. `ContributedSurfaces`, `HasCartLayout`, `HasSelections` and `HasSurfaces` in `ItemFields/Concern/`. `HasColumns` in `Lists/`. |
| Helper classes (9) | `ActionBuilder`, `AdminActions`, `AdminColumns` and `AlfaAdminContext` in `Admin/`. `PriceChange` in `Catalog/`. `SelectorDescriptor`, `SurfaceBuilder` and `Surfaces` in `ItemFields/`. `ColumnBuilder` in `Lists/`. |
| Enums (3) | `CartSurface`, `ItemListSurface` and `ItemSurface` in `ItemFields/` |

## What you must provide

Nothing. This page is a list. How to declare an event is on
[How events reach a plugin](./how-events-reach-a-plugin.md).

## What happens next

Follow the link in the last column of the event's row.

## What can go wrong

| What you see | The usual cause |
|---|---|
| An event in this list never reaches your plugin | It is addressed to one plugin and you listed it in `getSubscribedEvents()`, or it is announced and you declared it as a targeted handler. Check the column "Delivered". |
| The same name appears in two tables | `onItemView` is sent to payment plugins, shipping plugins and item field plugins, each with its own class. |
| A line number does not match your copy of the code | The lines are those of version 2.2.0. |

## Not documented yet

- `onGetToolActions` and `onExecuteToolAction` have no card of their own. One line each on
  [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) gives the call.
- `StoredCredentialIntentEvent` is not documented anywhere, because nothing sends it.
