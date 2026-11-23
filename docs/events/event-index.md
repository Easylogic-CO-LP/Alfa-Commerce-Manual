---
sidebar_position: 8
title: Event index
description: Every event Alfa Commerce sends to plugins, with its class, how it is delivered, whether a plugin can refuse, when it fires, where the code sends it and the page that explains it.
---

# Event index

<AlfaVersion verified="2.3.0" />

This page lists every event that Alfa Commerce sends to plugins. It was built from the code: every place where
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
| **Delivered** | **Announced**: to everyone who listed it in `getSubscribedEvents()` (broadcast). **One plugin**: addressed to one plugin, whose public method with the event's name handles it. **Each in turn**: addressed to each enabled plugin of the `alfa` group that the customer's access levels admit, one after the other, each through its method with the event's name. |
| **Can refuse** | **Yes**: a handler can stop what was asked, and the cell says how. **No**: an error in a handler is written to the log and the work goes on. **No veto**: the handler does the work itself, so an error in it is the failure of the request. |
| **Fires** | **Before the save**: nothing is stored yet. **After the save is final**: the change is stored for good (after the commit). **While a page is drawn**. **On request**: whenever Alfa needs the answer. |
| **Sent in** | The file and line where the event is handed to plugins, from the root of the repository. The line numbers are those of the current release's code. |
| **Documented on** | The page that explains the event |

## When it is used

- You know an event's name and want its page.
- You want to know whether an event is announced to everyone or addressed to one plugin, before you decide where to
  declare it.
- You are reading Alfa's code and want the line where an event is sent.

## The totals

| What was counted | Count |
|---|---|
| Files under `administrator/src/Event/` | 154 |
| Event classes that can be created (not abstract) | 115 |
| Of those, sent to plugins | 111 |
| Of those, defined and not sent | 4 |
| Abstract bases, interfaces and traits | 24 |
| Other helper classes and enums in the folder | 15 |
| Different event names sent | 102 |

Eight names are sent with more than one class, because a payment plugin, a shipping plugin and an item field plugin
each get their own class under the same name. That is why 102 names use 111 classes. Two of the helper classes are
`OrderPlaceRefusedException` in `Orders/`, an exception a listener of `onOrderPlaceValidate` may throw, and
`SurfaceMap` in `ItemFields/`, the read-only surfaces of a page.

No event is sent from the modules or from the shipped plugins. All of them are sent from `administrator/src`,
`site/src`, one controller of the REST API, `api/src/Controller/ExtController.php`, and one layout,
`site/layouts/list/filter_form.php`.

## Administrator screens

All fifteen are announced after the plugins of the group `alfa` are loaded. A screen sends them only when its entity
has a name in the code and at least one plugin listens. The classes are in `Admin/`. Every one is handed over in
`administrator/src/Event/Admin/AlfaAdminAware.php`: line 92 for the three that can refuse, line 86 for the others.
The column below gives the line that raises each one.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaAdminListQuery` | `AdminListQueryEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:156` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistquery) |
| `onAlfaAdminListFilters` | `AdminListFiltersEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:226` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistfilters) |
| `onAlfaAdminListRowData` | `AdminListRowDataEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:296` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistrowdata) |
| `onAlfaAdminListColumns` | `AdminListColumnsEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaListModel.php:319` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistcolumns) |
| `onAlfaAdminListRowActions` | `AdminListRowActionsEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:278` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistrowactions) |
| `onAlfaAdminListBulkActions` | `AdminListBulkActionsEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:300` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminlistbulkactions) |
| `onAlfaAdminToolbar` | `AdminToolbarEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:201` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadmintoolbar) |
| `onAlfaAdminRender` | `AdminRenderEvent` | Announced | No | While a page is drawn | `administrator/src/View/HasAdminEvents.php:154` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminrender) |
| `onAlfaAdminForm` | `AdminFormEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaAdminModel.php:273` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminform) |
| `onAlfaAdminPrepareData` | `AdminPrepareDataEvent` | Announced | No | While a page is drawn | `administrator/src/Model/AlfaAdminModel.php:308` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminpreparedata) |
| `onAlfaAdminValidate` | `AdminValidateEvent` | Announced | Yes, with `addError()` or by throwing an error | Before the save | `administrator/src/Model/AlfaAdminModel.php:380` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminvalidate) |
| `onAlfaAdminBeforeSave` | `AdminBeforeSaveEvent` | Announced | Yes, by throwing an error | Before the save | `administrator/src/Model/AlfaAdminModel.php:686` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminbeforesave) |
| `onAlfaAdminAfterSave` | `AdminAfterSaveEvent` | Announced | No | After the save of the record's own row is final; for an item, a discount, a tax, a cart rule, a payment method and a shipping method, after the whole save is final | `administrator/src/Model/AlfaAdminModel.php:480` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminaftersave) |
| `onAlfaAdminBeforeDelete` | `AdminBeforeDeleteEvent` | Announced | Yes, with `addError()` or by throwing an error | Before the delete | `administrator/src/Model/AlfaAdminModel.php:774` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminbeforedelete) |
| `onAlfaAdminAfterDelete` | `AdminAfterDeleteEvent` | Announced | No | After the delete is final | `administrator/src/Model/AlfaAdminModel.php:567` | [Extending Admin Screens](../plugins/admin-screen-events.md#onalfaadminafterdelete) |

## Menu, permissions, dashboard, setup and tools

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaBuildMenu` | `BuildMenuEvent` in `Menu/` | Announced | No | While a page is drawn | `administrator/src/Menu/MenuBuilder.php:127` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfabuildmenu) |
| `onAlfaGetAccessActions` | `GetAccessActionsEvent` in `Access/` | Announced | No | While a page is drawn | `administrator/src/Field/AlfarulesField.php:74` and `administrator/src/Service/Api/ApiAddressListing.php:336` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfagetaccessactions) |
| `onAlfaCollectCards` | `CollectCardsEvent` in `Card/` | Announced | No | While a page is drawn | `administrator/src/Card/CardRegistry.php:364` | [Notification and setup events](./notification-and-setup-events.md) |
| `onAlfaCollectSetupChecks` | `CollectSetupChecksEvent` in `Setup/` | Announced | No | On request | `administrator/src/Helper/SetupHelper.php:649` | [Notification and setup events](./notification-and-setup-events.md) |
| `onGetToolActions` | `GetToolActionsEvent` in `Tools/` | Announced. The plugin a tool is claimed for is then asked once more, alone. | No | While a page is drawn | `administrator/src/Helper/ToolRegistry.php:151` and `:587` | [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) |
| `onExecuteToolAction` | `ExecuteToolActionEvent` in `Tools/` | One plugin | No veto | On request | `administrator/src/Helper/ToolRegistry.php:361` | [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) |
| `onClearData` | `ClearDataEvent` in `Tools/` | One plugin | No | On request | `administrator/src/Service/ClearData/ClearDataExtensions.php:508` | [Payment plugins](../plugins/payment-plugin-events.md#oncleardata), [Shipping plugins](../plugins/shipment-plugin-events.md#oncleardata), [Item field plugins](../plugins/item-field-plugin-events.md#oncleardata), [Search engine plugins](../plugins/search-plugins.md#oncleardata) |

The two menu and permission events are handed over in `administrator/src/Panel/PanelDispatcher.php:115`.

## Admin panels

All six are addressed to the one plugin that owns the panel, through
`administrator/src/Panel/PanelDispatcher.php:87`. The classes are in `Panel/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaPanelToolbar` | `PanelToolbarEvent` | One plugin | No | While a page is drawn | `administrator/src/View/Panel/HtmlView.php:274` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneltoolbar) |
| `onAlfaPanelListQuery` | `PanelListQueryEvent` | One plugin | No | While a page is drawn | `administrator/src/Model/PanelModel.php:323` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanellistquery) |
| `onAlfaPanelView` | `PanelViewEvent` | One plugin | No | While a page is drawn | `administrator/src/View/Panel/HtmlView.php:143` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanelview) |
| `onAlfaPanelSave` | `PanelSaveEvent` | One plugin | No veto | On request. The plugin does the save. | `administrator/src/Controller/PanelController.php:128` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapanelsave) |
| `onAlfaPanelDelete` | `PanelDeleteEvent` | One plugin | No veto | On request. The plugin does the delete. | `administrator/src/Controller/PanelController.php:174` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneldelete) |
| `onAlfaPanelTask` | `PanelTaskEvent` | One plugin | No veto | On request | `administrator/src/Controller/PanelController.php:218` | [Creating an Admin Panel](../plugins/admin-panels.md#onalfapaneltask) |

## Payment and shipping plugins

All of these are addressed to one plugin. The classes are in `Payments/` and in `Shipments/`. Where a row names two
classes, the first goes to a payment plugin and the second to a shipping plugin.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemView` | `ItemViewEvent` in `Payments/`, `ItemViewEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/View/Item/HtmlView.php:408` | [Payment plugins](../plugins/payment-plugin-events.md#onitemview), [Shipping plugins](../plugins/shipment-plugin-events.md#onitemview) |
| `onCartViewAssets` | `CartViewAssetsEvent` in `Payments/`, `CartViewAssetsEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/Service/Cart/CartPluginDispatch.php:493` | [Payment plugins](../plugins/payment-plugin-events.md#oncartviewassets), [Shipping plugins](../plugins/shipment-plugin-events.md#oncartviewassets) |
| `onCartView` | `CartViewEvent` in `Payments/`, `CartViewEvent` in `Shipments/` | One plugin | No | While a page is drawn | `site/src/Service/Cart/CartPluginDispatch.php:404` | [Payment plugins](../plugins/payment-plugin-events.md#oncartview), [Shipping plugins](../plugins/shipment-plugin-events.md#oncartview) |
| `onCalculateShippingCost` | `CalculateShippingCostEvent` in `Shipments/` | One plugin | Yes. `setUnavailable()`, or an error, takes the method off the cart. | On request: for the chosen carrier each time the cart is totalled, and on the storefront for each carrier the checkout would list | `site/src/Service/Cart/CartPluginDispatch.php:238` | [Shipping plugins](../plugins/shipment-plugin-events.md#oncalculateshippingcost) |
| `onOrderBeforePlace` | `OrderBeforePlaceEvent` in `Payments/`, `OrderBeforePlaceEvent` in `Shipments/` | One plugin | Yes, by throwing an error | Before the save | `site/src/Service/Checkout/OrderPlacement.php:958` | [Payment plugins](../plugins/payment-plugin-events.md#onorderbeforeplace), [Shipping plugins](../plugins/shipment-plugin-events.md#onorderbeforeplace) |
| `onOrderAfterPlace` | `OrderAfterPlaceEvent` in `Payments/`, `OrderAfterPlaceEvent` in `Shipments/` | One plugin | No | After the save is final | `site/src/Service/Checkout/OrderPlacement.php:958` | [Payment plugins](../plugins/payment-plugin-events.md#onorderafterplace), [Shipping plugins](../plugins/shipment-plugin-events.md#onorderafterplace) |
| `onOrderProcessView` | `OrderProcessViewEvent` in `Payments/` | One plugin | No | While a page is drawn | `site/src/Service/Order/GatewayOfRecord.php:70` | [Payment plugins](../plugins/payment-plugin-events.md#onorderprocessview) |
| `onOrderCompleteView` | `OrderCompleteViewEvent` in `Payments/` | One plugin | No | While a page is drawn | `site/src/Service/Order/GatewayOfRecord.php:70` | [Payment plugins](../plugins/payment-plugin-events.md#onordercompleteview) |
| `onPaymentResponse` | `PaymentResponseEvent` in `Payments/` | One plugin | No veto | On request, when the shopper comes back | `site/src/Controller/PaymentController.php:89` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentresponse) |
| `onPaymentWebhook` | `PaymentWebhookEvent` in `Payments/` | One plugin | No veto. An error is answered "500" so that the provider tries again. | On request, when the provider calls | `site/src/Controller/ProviderCallbacks.php:83` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentwebhook) |
| `onShipmentResponse` | `ShipmentResponseEvent` in `Shipments/` | One plugin | No veto | On request, when the shopper comes back | `site/src/Controller/ShipmentController.php:100` | [Shipping plugins](../plugins/shipment-plugin-events.md#onshipmentresponse) |
| `onShipmentWebhook` | `ShipmentWebhookEvent` in `Shipments/` | One plugin | No veto. An error is answered "500" so that the carrier tries again. | On request, when the carrier calls | `site/src/Controller/ProviderCallbacks.php:83` | [Shipping plugins](../plugins/shipment-plugin-events.md#onshipmentwebhook) |
| `onGetActions` | `GetPaymentActionsEvent` in `Payments/`, `GetShipmentActionsEvent` in `Shipments/` | One plugin | No | While a page is drawn | `administrator/src/Helper/ActionRegistry.php:2244` | [Payment plugins](../plugins/payment-plugin-events.md#ongetactions), [Shipping plugins](../plugins/shipment-plugin-events.md#ongetactions) |
| `onExecuteAction` | `ExecutePaymentActionEvent` in `Payments/`, `ExecuteShipmentActionEvent` in `Shipments/` | One plugin | No veto | On request, when staff press a button | `administrator/src/Helper/ActionRegistry.php:668` and `:726` | [Payment plugins](../plugins/payment-plugin-events.md#onexecuteaction), [Shipping plugins](../plugins/shipment-plugin-events.md#onexecuteaction) |
| `onAdminOrderDelete` | `AdminOrderDeleteEvent` in `Payments/`, `AdminOrderDeleteEvent` in `Shipments/` | One plugin | Yes. `setResult(false)` keeps the order. | Before the save | `administrator/src/Model/OrderModel.php:3852` | [Payment plugins](../plugins/payment-plugin-events.md#onadminorderdelete), [Shipping plugins](../plugins/shipment-plugin-events.md#onadminorderdelete) |
| `onPaymentCheckup` | `PaymentCheckupEvent` in `Payments/` | One plugin | No | On request, from the method's settings page | `administrator/src/Helper/PaymentCheckupHelper.php:102` | [Payment plugins](../plugins/payment-plugin-events.md#onpaymentcheckup) |
| `onAlfaDisputeRefresh` | `DisputeRefreshEvent` in `Payments/` | One plugin | No veto. An error tells staff the provider could not be asked, and nothing is saved. | On request, when staff press "Ask the provider again" on a dispute | `administrator/src/Helper/ActionRegistry.php:1775` | [Payment plugins](../plugins/payment-plugin-events.md#onalfadisputerefresh-and-onalfadisputeaccept) |
| `onAlfaDisputeAccept` | `DisputeAcceptEvent` in `Payments/` | One plugin | No veto. An error tells staff the provider could not be asked, and nothing is saved. | On request, when staff press "Accept at the provider" on an inquiry or an open dispute | `administrator/src/Helper/ActionRegistry.php:1775` | [Payment plugins](../plugins/payment-plugin-events.md#onalfadisputerefresh-and-onalfadisputeaccept) |

## Cart and orders

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCartTotals` | `CartTotalsEvent` in `Cart/` | Each in turn | No | On request, each time the cart is totalled | `site/src/Service/Cart/CartPluginDispatch.php:323` | [Order and cart events](./order-and-cart-events.md) |
| `onCartItemDisplay` | `CartItemDisplayEvent` in `Items/` | Each in turn | No | While a page is drawn | `site/src/Service/Cart/CartLinePresenter.php:153` | [Order and cart events](./order-and-cart-events.md) |
| `onOrderPlaceValidate` | `OrderPlaceValidateEvent` in `Orders/` | Each in turn | Yes. `reject()`, or an error, refuses the order, and so does `OrderPlaceRefusedException`, read in its own words. | Before the save | `site/src/Service/Checkout/OrderPlacement.php:1231` | [Order and cart events](./order-and-cart-events.md) |
| `onAlfaOrderPlaced` | `OrderPlacedEvent` in `Orders/` | Announced | No | After the save is final | `site/src/Service/Checkout/OrderPlacement.php:707` | [Order and cart events](./order-and-cart-events.md) |
| `onOrderStatusChange` | `OrderStatusChangeEvent` in `Orders/` | Announced. Each listener is called on its own and its result is recorded. | No | After the save is final | `administrator/src/Service/Order/Task/OrderStatusEvent.php:149` | [Order and cart events](./order-and-cart-events.md) |
| `onAlfaDisputeChanged` | `DisputeChangedEvent` in `Payments/` | Announced, after `alfa` is loaded. Each listener is called on its own and its result is recorded. | No | After the save is final: a dispute moved or its facts changed | `administrator/src/Service/Order/Task/OrderDisputeEvent.php:103` | [Order and cart events](./order-and-cart-events.md) |

## Item fields and form fields

The item field classes are in `ItemFields/`. Each event goes to the plugin of one field, except
`onItemsListPrepare`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemView` | `ItemViewEvent` in `ItemFields/` | One plugin | No | While a page is drawn | `site/src/Model/ItemModel.php:382` and `administrator/src/Model/OrderModel.php:2586` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemview) |
| `onItemListPrepare` | `ItemListPrepareEvent` | One plugin | No | While a page is drawn | `site/src/Model/ItemsModel.php:2560` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemlistprepare) |
| `onItemsListPrepare` | `ItemsListPrepareEvent` | Announced, after the plugins of `alfa-item-fields` are loaded | No | While a page is drawn | `site/src/Model/ItemsModel.php:2487` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemslistprepare) |
| `onItemFieldValueFacetGroups` | `ValueFacetGroupsEvent` | One plugin | No | While a page is drawn | `site/src/Model/ItemsModel.php:3345` | [Item field plugins](../plugins/item-field-plugin-events.md#onitemfieldvaluefacetgroups) |
| `onValidateCartAdd` | `ValidateCartAddEvent` | One plugin | Yes. `setError()`, or an error, refuses the selection. | Before the save, when an item is added to the cart | `administrator/src/Helper/ItemConfigurationHelper.php:161` | [Item field plugins](../plugins/item-field-plugin-events.md#onvalidatecartadd) |
| `onPrepareForCart` | `PrepareForCartEvent` | One plugin | Yes. `setError()`, or an error, refuses the selection. | Before the save, when an item is added to the cart | `administrator/src/Helper/ItemConfigurationHelper.php:651` | [Item field plugins](../plugins/item-field-plugin-events.md#onprepareforcart) |
| `onCalculateItemPrice` | `CalculateItemPriceEvent` | One plugin | No | On request, each time a price is worked out | `site/src/Helper/VariantHelper.php:552` | [Item field plugins](../plugins/item-field-plugin-events.md#oncalculateitemprice) |
| `onCartItemView` | `CartItemViewEvent` | One plugin | No | While a page is drawn | `site/src/Service/Cart/CartLinePresenter.php:114` | [Item field plugins](../plugins/item-field-plugin-events.md#oncartitemview) |
| `onGetFieldActions` | `GetFieldActionsEvent` | One plugin | No | While a page is drawn | `administrator/src/Helper/ActionRegistry.php:2159` | [Item field plugins](../plugins/item-field-plugin-events.md#ongetfieldactions) |
| `onExecuteFieldAction` | `ExecuteFieldActionEvent` | One plugin | No veto | On request, when staff press a button | `administrator/src/Controller/ItemController.php:1240` and `administrator/src/Helper/ActionRegistry.php:542` | [Item field plugins](../plugins/item-field-plugin-events.md#onexecutefieldaction) |
| `onAlfaFormFieldsPrepareDom` | `PrepareDomEvent` in `Fields/` | One plugin. It is not declared as a handler: Alfa calls the plugin's `prepareDom()` method and hands it this object. | No | While a form is built | `administrator/src/Helper/FieldsHelper.php:310` | [Form field plugins](../plugins/form-field-plugins.md#the-operation-preparedom) |

`onCalculateItemPrice` has one exception. When Joomla's debug mode is on, an error in the handler is thrown again,
so that a developer sees it.

## Items and the catalogue

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onItemDisplay` | `ItemDisplayEvent` in `Items/` | Announced | No | While a page is drawn | `site/src/Model/ItemModel.php:443` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onItemPrepareForm` | `ItemPrepareFormEvent` in `Items/` | Announced | No | While a page is drawn | `administrator/src/Model/ItemModel.php:433` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onItemAfterSave` | `ItemAfterSaveEvent` in `Items/` | Announced | No | After the whole item's save is final, never for a save that was undone | `administrator/src/Model/ItemModel.php:1422` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onAlfaPricesChanged` | `PricesChangedEvent` in `Catalog/` | Announced | No | After the save is final, and when a stored price period begins | `administrator/src/Service/PriceIndexSyncService.php:2786` | [Item and catalogue events](./item-and-catalogue-events.md) |
| `onAlfaCombinationsChanged` | `CombinationsChangedEvent` in `Catalog/` | Announced, after `alfa` is loaded; each listener on its own | No | Once a write of a product's variants through `CombinationService`, after it is final | `administrator/src/Service/Catalog/CombinationService.php:684` | [Saving a product](../services/products.md#saving-a-variant) |
| `onAlfaRelatedResolve` | `RelatedResolveEvent` in `Catalog/` | Announced, after `alfa` is loaded, each listener isolated | No | While a page is drawn, before the related products are judged | `site/src/Service/Catalog/RelatedProducts.php:84` | [Item and catalogue events](./item-and-catalogue-events.md#onalfarelatedresolve) |
| `onAlfaRelatedLinksChanged` | `RelatedLinksChangedEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded, each listener isolated | No | After the change is final, never for one that was undone | `administrator/src/Service/Catalog/RelatedItems.php:684` | [Item and catalogue events](./item-and-catalogue-events.md#onalfarelatedlinkschanged) |
| `onAlfaCatalogEntityChanged` | `CatalogEntityChangedEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | Right after the record is written. It does not wait for a bigger save around it. | `administrator/src/Service/Catalog/EntityChangeNotifier.php:73` | [Search engine plugins](../plugins/search-plugins.md#onalfacatalogentitychanged) |
| `onCatalogVisibilityChanged` | `VisibilityChangedEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | Right after the record is written. It does not wait for a bigger save around it. | `administrator/src/Service/Catalog/VisibilityNotifier.php:113` | [Search engine plugins](../plugins/search-plugins.md#oncatalogvisibilitychanged) |
| `onCollectCatalogProjections` | `CollectCatalogProjectionsEvent` in `Catalog/` | Announced, after `alfa-search` and `alfa` are loaded | No | On request | `administrator/src/Service/Projection/ProjectionManager.php:118` | [Search engine plugins](../plugins/search-plugins.md#oncollectcatalogprojections) |

## Search

The classes are in `Search/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCollectSearchEngines` | `CollectSearchEnginesEvent` | Announced, after `alfa-search` is loaded | No | On request | `administrator/src/Service/Search/SearchEngineRegistry.php:226` | [Search engine plugins](../plugins/search-plugins.md#oncollectsearchengines) |
| `onAlfaSearchInputLayout` | `SearchInputLayoutEvent` | One plugin | No | While a page is drawn | `site/layouts/list/filter_form.php:114` | [Search engine plugins](../plugins/search-plugins.md#onalfasearchinputlayout) |
| `onAlfaResultSetRender` | `ResultSetRenderEvent` | Announced, after `alfa-search` is loaded | No | While a page is drawn | `site/src/View/Items/HtmlView.php:425` | [Search engine plugins](../plugins/search-plugins.md#onalfaresultsetrender) |

## Media

All five are announced after the plugins of `alfa-media` are loaded, in
`administrator/src/Helper/MediaHelper.php:2716`. The classes are in `Media/`. The column gives the line that builds
each one. They fire while a record is being saved. A media event does not tell you whether that save is final.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaMediaValidate` | `ValidateEvent` | Announced | Yes. `setValid(false)` skips the file. An error does not. | Before the image is stored | `administrator/src/Helper/MediaHelper.php:2546` | [Media plugins](../plugins/media-plugins.md#onalfamediavalidate) |
| `onAlfaMediaBeforeProcess` | `BeforeProcessEvent` | Announced | No | Before the image is stored | `administrator/src/Helper/MediaHelper.php:2621` | [Media plugins](../plugins/media-plugins.md#onalfamediabeforeprocess) |
| `onAlfaMediaThumbnail` | `ThumbnailEvent` | Announced | No | When a thumbnail is made | `administrator/src/Helper/MediaHelper.php:2620` | [Media plugins](../plugins/media-plugins.md#onalfamediathumbnail) |
| `onAlfaMediaAfterProcess` | `AfterProcessEvent` | Announced | No | After the file is stored, before the image's row is written | `administrator/src/Helper/MediaHelper.php:2648` | [Media plugins](../plugins/media-plugins.md#onalfamediaafterprocess) |
| `onAlfaMediaBeforeDelete` | `BeforeDeleteEvent` | Announced | No | Before the files and rows of an image are removed, on every delete path; inside a save, once the save is final, the rows already gone and the files not yet | `administrator/src/Helper/MediaHelper.php:2690` | [Media plugins](../plugins/media-plugins.md#onalfamediabeforedelete) |

## Stock

All nine are sent from `administrator/src/Service/Inventory/InventoryService.php`. The classes are in `Inventory/`.
The first eight are announced after the plugins of `alfa` are loaded: the "before" events at line 5387, the "after"
events at line 5402. The column gives the line of each command.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onInventoryBeforeReserve` | `InventoryBeforeReserveEvent` | Announced | Yes: `InventoryRefusedException` refuses; another error is a failure that is tried again. | Before the stock is set aside | `InventoryService.php:465` | [Stock events](./stock-events.md) |
| `onInventoryBeforeCommit` | `InventoryBeforeCommitEvent` | Announced | Yes: `InventoryRefusedException` refuses; another error is a failure that is tried again. | Before goods are taken from stock | `InventoryService.php:1938` | [Stock events](./stock-events.md) |
| `onInventoryBeforeRelease` | `InventoryBeforeReleaseEvent` | Announced | Yes: `InventoryRefusedException` refuses; another error is a failure that is tried again. | Before the reservations of an order are let go | `InventoryService.php:752` | [Stock events](./stock-events.md) |
| `onInventoryReserved` | `InventoryReservedEvent` | Announced | No | After the save is final | `InventoryService.php:642` | [Stock events](./stock-events.md) |
| `onInventoryCommitted` | `InventoryCommittedEvent` | Announced | No | After the save is final | `InventoryService.php:2339` | [Stock events](./stock-events.md) |
| `onInventoryReleased` | `InventoryReleasedEvent` | Announced | No | After the save is final | `InventoryService.php:815` | [Stock events](./stock-events.md) |
| `onInventoryAdjusted` | `InventoryAdjustedEvent` | Announced | No | After the save is final | `InventoryService.php:3577`, `:3727` and `:7517` | [Stock events](./stock-events.md) |
| `onInventoryRestored` | `InventoryRestoredEvent` | Announced | No | After stock was put back, or taken off again when a credit note is voided, and the save is final | `InventoryService.php:3107` | [Stock events](./stock-events.md#oninventoryrestored) |
| `onCollectStockAllocationProviders` | `CollectStockAllocationProvidersEvent` | Announced, after `alfa-inventory` is loaded | No | On request, once per request | `InventoryService.php:5347` | [Stock events](./stock-events.md) |

## Documents

The classes are in `Documents/`.

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onCollectDocumentTypeProviders` | `CollectDocumentTypeProvidersEvent` | Announced | No | On request, when the Document Types screen is shown and when staff press its sync button | `administrator/src/Service/DocumentTypes/DocumentTypeRegistry.php:556` | [Document events](./document-events.md) |
| `onDocumentBeforeIssue` | `DocumentBeforeIssueEvent` | Announced | Yes, by throwing an error | Before the save, with no save open | `administrator/src/Service/Document/DocumentIssuer.php:3065` | [Document events](./document-events.md) |
| `onDocumentIssued` | `DocumentIssuedEvent` | Announced | No | After the save is final | `administrator/src/Service/Document/DocumentIssuer.php:625`, handed over at `:3884` | [Document events](./document-events.md) |
| `onDocumentVoided` | `DocumentVoidedEvent` | Announced | No | After the save is final | `administrator/src/Service/Document/DocumentIssuer.php:1073`, handed over at `:3884` | [Document events](./document-events.md) |

## Notifications

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaNotificationPushed` | `NotificationPushedEvent` in `Notifications/` | Announced | No | After the save is final | `administrator/src/Helper/NotificationHelper.php:480` | [Notification and setup events](./notification-and-setup-events.md) |

## Outgoing notifications

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaOutboundTopics` | `OutboundTopicsEvent` in `Outbound/` | One plugin | No | On request: when the plugin is saved or enabled | `administrator/src/Service/Outbound/OutboundConsumers.php:545` | [Outgoing notifications](../api/notifications.md#telling-through-a-plugin) |
| `onAlfaOutboundDeliver` | `OutboundDeliverEvent` in `Outbound/` | One plugin | No veto: each change is answered delivered, retry or refused | After the save is final, in the background | `administrator/src/Service/Outbound/OutboundDelivery.php:301` | [Outgoing notifications](../api/notifications.md#telling-through-a-plugin) |

## The REST API and background work

| Event | Class | Delivered | Can refuse | Fires | Sent in | Documented on |
|---|---|---|---|---|---|---|
| `onAlfaBeforeApiRoute` | `ApiRoutesEvent` in `Api/` | One plugin | No veto. An error makes the plugin's addresses answer 503. | On request: a REST request under the plugin's address `v1/alfa/ext/<element>/`, and Tools, Security | `administrator/src/Service/Api/ApiRouteRegistrar.php:210` and `:268` | [Adding routes to the REST API](../plugins/api-route-plugins.md#what-it-does) |
| `onAlfaApiRequest` | `ApiRequestEvent` in `Api/` | One plugin | No veto. An error is answered 500. | On request: a REST request on one of the plugin's routes | `api/src/Controller/ExtController.php:189` | [Adding routes to the REST API](../plugins/api-route-plugins.md#answering-a-request) |
| `onAlfaDeclareWork` | `DeclareWorkEvent` in `Background/` | One plugin | No veto. An error keeps the plugin's previous declarations. | On request: when the plugin is installed, updated, saved or enabled | `administrator/src/Service/Task/WorkDeclarations.php:292` | [Background work of a plugin](../plugins/background-work-plugins.md#declaring-the-work) |
| `onAlfaRunTask` | `RunTaskEvent` in `Background/` | One plugin | No veto. `WorkFailure` says how the run failed; any other error is tried again or held. | After the save is final, and in the background | `administrator/src/Service/Task/PluginTask.php:79` | [Background work of a plugin](../plugins/background-work-plugins.md#running-a-task) |
| `onAlfaRunJob` | `RunJobEvent` in `Background/` | One plugin | No veto. `WorkFailure` says how the step failed; any other error is tried again. | In the background, once a step | `administrator/src/Service/Task/PluginJob.php:135` | [Background work of a plugin](../plugins/background-work-plugins.md#running-a-job) |
| `onAlfaWorkSettled` | `WorkSettledEvent` in `Background/` | One plugin | No veto. An error is tried again later. | In the background, after the save that ended the plugin's task or job is final | `administrator/src/Service/Task/WorkSettled.php:121` | [Background work of a plugin](../plugins/background-work-plugins.md#told-when-it-ends) |

## Joomla events Alfa raises or relies on

Joomla's own events are not Alfa events and are not listed above. These are the ones the component's code raises or
listens to, with the page cache answers of the shipped plugin and module.

| Joomla event | What Alfa does with it | Where |
|---|---|---|
| `onContentAfterSave`, `onContentAfterDelete` | Joomla announces them when a record is saved or deleted. When Alfa's save runs inside a bigger save or under one of Alfa's locks, Alfa holds them back and announces them itself once the save is final, never for a change that was undone. | `administrator/src/Model/AlfaAdminModel.php:732` |
| The model's before-delete event (`onContentBeforeDelete` unless a model names another) | A model that deletes inside a save or a lock of its own asks this event itself, before it opens them. A listener that answers `false`, or throws, refuses the delete. | `administrator/src/Model/AlfaAdminModel.php:618` |
| `onContentBeforeSave` and Joomla's other save events | Announced by Joomla itself, inside the record's write. Alfa does not send them. An item's save is one unit, so what a listener writes to the shop's database there is undone with a save that fails. | Joomla's `AdminModel` |
| `onTableBeforeStore` | Alfa listens to it, last of all listeners, while an item's row is stored. It sends nothing. | `administrator/src/Table/ItemTable.php:155` |
| `onPageCacheIsExcluded` | Alfa listens to it and answers "yes", so that the cart and filtered listings are not served from Joomla's page cache. "System - Alfa Commerce Sync" answers for the cart and a visitor with a cart, typed checkout details, or a currency or place of their own; the pages that keep themselves out (the cart page in every form, the item page opened to change a line of the cart, a page whose cart module shows items, the registration page showing a refusal, a listing marked `responseSpecific`, the items module's recently viewed list, a page priced in a currency or place of the visitor's own) answer through one helper that needs no Alfa plugin. The easy articles module answers with a listener of its own while it shows a visitor's recently read list. | `plugins/system/alfasync/src/Extension/Alfasync.php:411`, `site/src/Helper/PageCache.php:70`, `modules/mod_easy_articles/src/Helper/EasyArticlesHelper.php:433` |
| `onAfterDispatch` | Alfa listens to it to place its menu in the administrator's sidebar. | `administrator/src/Extension/AlfaComponent.php:118` |
| `onBeforeApiRoute` | Joomla's API application announces it to the `webservices` and `system` plugins. Alfa's webservices plugin listens to it to add the core routes and, after them, the routes of the `alfa` plugins (`onAlfaBeforeApiRoute`). Tools, Security raises it itself, asking that plugin alone, to list the core routes. | `plugins/webservices/alfa/src/Extension/Alfa.php:68`, `administrator/src/Service/Api/ApiRouteRegistrar.php:317` |

Two more names appear in the code and are not events for plugins: `onAlfaContentAfterTheCommit` and
`onAlfaContentDeleteAskedBeforeTheLock`. Alfa gives Joomla's model these private names for the length of one call, so
that it can hold Joomla's own event back as the first two rows describe. Do not listen to them.

## Defined, not dispatched

These classes exist in `administrator/src/Event/`, but no code in the core repository creates them or sends
them.

| Class | Event name | What the code says |
|---|---|---|
| `StoreReferenceEvent` in `Payments/` | `onPaymentStoreReference` | Defined, not dispatched. An extension's billing engine raises it at a gateway whose `supportsRecurring()` answers `true`, which handles it with its public method of that name. See [Payment plugins](../plugins/payment-plugin-events.md#onpaymentstorereference-and-onpaymentchargereference). |
| `ChargeReferenceEvent` in `Payments/` | `onPaymentChargeReference` (`NAME`) | Defined, not dispatched by Alfa Commerce: an extension that bills again (a subscriptions extension) sends it to the gateway of the stored credential. As above. |
| `ChargeQueryEvent` in `Payments/` | `onPaymentChargeQuery` (`NAME`) | Defined, not dispatched by Alfa Commerce: the same extension asks the gateway with it about an attempt whose outcome it does not know. See [onPaymentChargeQuery](../plugins/payment-plugin-events.md#onpaymentchargequery). |
| `StoredCredentialIntentEvent` in `Payments/` | `onPaymentCredentialIntent` (`NAME`) | Defined, not dispatched by Alfa Commerce: a gateway that can charge stored credentials sends it to every plugin that listens, before it creates its checkout order. See [Payment plugin events](../plugins/payment-plugin-events.md#onpaymentstorereference-and-onpaymentchargereference). |

## Building blocks, not events

These files are in the same folder, but a plugin never receives them as an event of their own.

| Kind | Files |
|---|---|
| Abstract bases (16) | `AlfaAdminEvent` in `Admin/`. `FieldsEvent` in `Fields/`. `GeneralEvent`, `RedirectEvent` and `LayoutEvent` in `General/`. `InventoryAfterEvent` in `Inventory/`. `MediaEvent` in `Media/`. `PanelResultEvent` in `Panel/`. `ChargeAnswerEvent` (the answers `ChargeReferenceEvent` and `ChargeQueryEvent` share), `DisputeEvent` (the asks `DisputeAcceptEvent` and `DisputeRefreshEvent` share), `PaymentsEvent`, `PaymentsRedirectEvent` and `PaymentsLayoutEvent` in `Payments/`. `ShipmentsEvent`, `ShipmentsRedirectEvent` and `ShipmentsLayoutEvent` in `Shipments/`. |
| Interface (1) | `ScopedFieldEvent` in `ItemFields/` |
| Traits (7) | `AlfaAdminAware` in `Admin/`. `HasMethodArgumentTrait` in `General/Traits/`. `ContributedSurfaces`, `HasCartLayout`, `HasSelections` and `HasSurfaces` in `ItemFields/Concern/`. `HasColumns` in `Lists/`. |
| Helper classes (10) | `ActionBuilder`, `AdminActions`, `AdminColumns` and `AlfaAdminContext` in `Admin/`. `PriceChange` in `Catalog/`. `SelectorDescriptor`, `SurfaceBuilder` and `Surfaces` in `ItemFields/`. `ColumnBuilder` in `Lists/`. `OutboundChange` in `Outbound/`. |
| Enums (3) | `CartSurface`, `ItemListSurface` and `ItemSurface` in `ItemFields/` |

## What you must provide

Nothing. This page is a list. How to declare an event is on
[How events reach a plugin](./how-events-reach-a-plugin.md).

## What happens next

Follow the link in the last column of the event's row.

## What can go wrong

| What you see | The usual cause |
|---|---|
| An event in this list never reaches your plugin | It is addressed to one plugin and you listed it in `getSubscribedEvents()`, or it is announced and you did not list it in `getSubscribedEvents()`. Check the column "Delivered". |
| The same name appears in two tables | `onItemView` is sent to payment plugins, shipping plugins and item field plugins, each with its own class. |
| A line number does not match your copy of the code | The lines are those of the current release. Another copy of the code can hold a call at another line. |

## Not documented yet

- `onGetToolActions` and `onExecuteToolAction` have no card of their own. One line each on
  [Extending Admin Screens](../plugins/admin-screen-plugins.md#other-things-a-plugin-can-add) gives the call.
