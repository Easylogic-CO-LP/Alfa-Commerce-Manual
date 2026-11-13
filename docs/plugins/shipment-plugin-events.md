---
title: Shipping plugin events
description: "Every event a shipping plugin receives in Alfa Commerce 2.2.0: when it fires, what it is given and what it must do."
---

# Shipping plugin events

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Shipping plugins](./shipment-plugins.md): start here
- **Shipping plugin events** (this page)
- [A complete shipping plugin](./shipment-plugin-example.md)

The event classes are in `administrator/src/Event/Shipments`. Each card answers the same six questions.

## onItemView

| | |
|---|---|
| **When it fires** | When the storefront draws an item page, once for each shipping method of your plugin that has "Show on item page" switched on. |
| **Who receives it** | The plugin of that method. |
| **What you are given** | `ItemViewEvent`. See the table below. |
| **What you are expected to do** | Name a layout file of your `tmpl` folder and hand it its data. Never print HTML yourself. |
| **What happens next** | Alfa draws your layout in the shipping methods area of the item page. A site template can override it at `templates/<template>/html/plg_alfa-shipments_<element>/<layout>.php`. |
| **If you are missing or you fail** | Nothing of yours is drawn. An error is written to Joomla's log (category `com_alfa`) and the page is still shown. |

| Method of the event | Meaning |
|---|---|
| `getItem()` | The item being shown |
| `getMethod()` | The method's record, an object with `name`, `description` and the other columns |
| `setLayout('default_item_view')` | The layout file to draw, without `.php` |
| `setLayoutData([...])` | What the layout receives in `$displayData` |
| `shipmentMethods()`, `title()`, `nearAddToCart()` | Three places on the page. Each returns a builder: `$event->title()->setLayout('badge')->setData([...])` |
| `setRedirectUrl($url)` | Sends the shopper elsewhere instead of showing the page |

## onCartViewAssets

| | |
|---|---|
| **When it fires** | Once per plugin, while the cart page (and the order builder in the administrator) is built as HTML. It fires for every plugin that has a published method, offered for this cart or not. It never fires inside the cart's JSON answers. |
| **Who receives it** | Each such plugin, alone. |
| **What you are given** | `CartViewAssetsEvent`: `getKind()` (the text `shipment`), `getMethods()` (your published methods, keyed by id), `getDocument()` (the page) and `getWebAssetManager()`. |
| **What you are expected to do** | Declare the script and stylesheet your cart panel needs. As dependencies, name only assets you registered yourself and Alfa's own, such as `com_alfa.cart`. Leave the method out if you have no script. |
| **What happens next** | Your assets are in the page's head before the shopper's first click. |
| **If you are missing or you fail** | The page is shown without your assets. A warning is written to the log (category `com_alfa.cart`). |

## onCartView

| | |
|---|---|
| **When it fires** | Once for each offered method, every time the cart is worked out. That includes the JSON answers that replace the methods block after the shopper changes something. |
| **Who receives it** | The plugin of that method. |
| **What you are given** | `CartViewEvent`: `getMethod()` (a `Method` reader, see [Method settings](./shipment-plugins.md#method-settings)), `getCart()` (the cart, read only), `getRequest()` (both, as one object). |
| **What you are expected to do** | Call `setLayout()` and `setLayoutData()`. The layout holds markup and `data-` attributes only. A script named here is lost the first time the block is replaced: declare scripts in `onCartViewAssets`. Pass only what the layout prints. |
| **What happens next** | Alfa draws your layout beside the method in the cart. |
| **If you are missing or you fail** | The method stays offered and is drawn without your part. A warning is written to the log (category `com_alfa.cart`). |

## onCalculateShippingCost

| | |
|---|---|
| **When it fires** | When the cart's totals are worked out and the cart has a method of your plugin chosen. Alfa asks once per calculation and keeps the answer. |
| **Who receives it** | The plugin of the chosen method. |
| **What you are given** | `CalculateShippingCostEvent`: the method, and the cart with its lines and its delivery address. See the tables below. |
| **What you are expected to do** | Answer, always, with exactly one of three calls: `setShippingCost()`, `setUnavailable()` or `setShippingAmounts()`. |
| **What happens next** | Alfa turns your answer into the shipping charge: net, tax and gross. The cart shows it, and the order keeps it. |
| **If you are missing or you fail** | If you answer nothing, or throw an error, the method comes off the cart and the shopper is asked to choose another one. A silent plugin is never read as free shipping. A disabled plugin is not asked at all, and the order cannot be placed with it. |

**What the event gives you**

| Call | Meaning |
|---|---|
| `$event->getMethod()` | The method being priced, as a `Method` reader: `id()`, `name()`, `param('key', $default)`, `params()` |
| `$event->getCart()` | The cart, as a `Cart` reader with no setters |
| `$cart->lines()` | The lines to carry, as `CartLine` objects: `quantity()`, `weight()`, `width()`, `height()`, `depth()` (each per unit), `isVirtual()`, `itemId()`, `name()` |
| `$cart->getSubtotal()` | What the goods come to, as `Money`. Already settled before you are asked. |
| `$cart->getTotal()` | Do not call it here. The total includes the shipping you are deciding, so it throws an error during a quote. |
| `$cart->currency()`, `customer()`, `quantity()`, `itemCount()`, `isVirtual()` | The cart's currency, customer and sizes |
| `$cart->delivery()` | The delivery address (`invoice()` is the invoice address) |
| `$cart->delivery()->places()` | Where the parcel goes: the destination place and every place that contains it, nearest first. Empty when it is not known. |
| `$cart->delivery()->places(fieldId: $id)` | The same, read from a checkout field that your method's settings name |
| `$cart->delivery()->field($id)->value()` | The text of one checkout field, or `null`. This is how you read a postcode: Alfa does not know which field holds it, your settings say. |

**What you answer**

| Call | Meaning |
|---|---|
| `setShippingCost(float $cost)` | The price **as the merchant configured it**. You do not say whether tax is inside it. Alfa reads that from the method (see below) and adds or extracts the method's taxes for the destination. `0.0` means free shipping. |
| `setUnavailable(string $reasonKey)` | "I cannot carry this cart." Pass a **language key** of your own language file, never a sentence. The shopper reads the translated reason. A refusal wins over a price you also set. |
| `setShippingAmounts($taxExcl, $taxAmount, $taxIncl, float $taxRate)` | Only for a carrier whose own service already splits the tax. Alfa takes the three amounts as they are: no price entry mode and no tax rule is applied. The net and the tax must add up to the gross exactly, in the cart's currency, and a charge with tax must name its rate. Otherwise the method comes off the cart. |

**How Alfa turns a price into a charge.** Since 2.1.0 each shipping method owns two settings, on its own form:

| Setting of the method | What Alfa does with the price you answered |
|---|---|
| Shipping prices entered: **Tax included** | Your price is what the shopper pays. Alfa works out the net and the tax inside it. |
| Shipping prices entered: **Tax excluded** | Your price is the net. Alfa adds the tax on top. |
| Shipping taxes | The tax rules the charge is taxed with, filtered by the destination. A method with none charges no shipping tax. |

There is no shop setting behind them and nothing is inherited. Two methods of your plugin can differ.

The quote of the standard plugin, as it ships:

```php
public function onCalculateShippingCost($event): void
{
    $cost = $this->carriageFor($event->getMethod(), $event->getCart());

    if ($cost === null) {
        $event->setUnavailable($this->refusal());

        return;
    }

    $event->setShippingCost($cost);
}

private function carriageFor(Method $method, Cart $cart): ?float
{
    return $this->costFromZones(
        zones: (array) $method->param('cost-per-place', []),
        lines: $cart->lines(),
        places: $cart->delivery()->places(fieldId: $method->param('delivery_place_field')),
        postcode: $cart->delivery()->field((int) $method->param('postcode_field'))->value(),
        subtotal: (float) $cart->getSubtotal()->getAmount(),
    );
}
```

`costFromZones()` belongs to the base class. It prices a cart from a table of zones and bands and returns a price,
`0.0` for free, or `null` for a refusal, whose language key `refusal()` then returns. A plugin that asks a carrier's
service for a rate does not need it.

## onOrderBeforePlace

| | |
|---|---|
| **When it fires** | When an order is about to be placed with a method of your plugin, before anything is saved. |
| **Who receives it** | The plugin of the chosen method. |
| **What you are given** | `OrderBeforePlaceEvent`. `getContext()` returns the facts of the placement: `cartId`, `lines` (each with `lineId`, `itemId`, `quantity`, `combinationId`), `customerId` and `shipmentMethodId`. |
| **What you are expected to do** | Nothing, or check what you need (a pickup point was chosen, for example). To refuse the order, throw an error. You cannot change the cart from here. |
| **What happens next** | If you return quietly, Alfa saves the order. |
| **If you are missing or you fail** | An error you throw stops the placement, nothing is saved, and the error is written to the log (category `com_alfa.orders`). If your plugin is disabled, missing or cannot start, the order is refused before anything is saved. |

## onOrderAfterPlace

| | |
|---|---|
| **When it fires** | Right after the order is saved for good (after the commit). |
| **Who receives it** | The plugin of the method the order was placed with. |
| **What you are given** | `OrderAfterPlaceEvent`. `getOrder()` returns the saved order as an `Order` reader. |
| **What you are expected to do** | Record the first parcel of the order (see [Recording and changing a parcel](./shipment-plugins.md#recording-and-changing-a-parcel)). Take the charge from the order: `shipmentTotal()`, `shipmentTotalExcl()` and `shipmentTaxRate()`. |
| **What happens next** | The order shows its parcel. The order's shipping total is the sum of its parcels' charges, so an order without a parcel shows no shipping charge. |
| **If you are missing or you fail** | The order stands, it cannot be undone. The failure is written to the log (category `com_alfa.orders`), as critical when your method threw an error and as an error when your plugin could not be used, and the shopper is told that part of the order could not be set up. A `save()` that returns `false` is not such a failure: nobody is told unless your plugin logs it. |

The standard plugin, as it ships (comments removed):

```php
public function onOrderAfterPlace($event): void
{
    $order = $event->getOrder();

    if (!$order || empty($order->id())) {
        return;
    }

    $shippingCostIncl = $order->shipmentTotal();
    $shippingCostExcl = $order->shipmentTotalExcl();
    $shippingTaxRate = $order->shipmentTaxRate();

    $shipmentId = $this->shipment($order)
        ->pending()
        ->withAllItems()
        ->cost($shippingCostIncl, $shippingCostExcl, $shippingTaxRate)
        ->save();

    if (!$shipmentId) {
        Log::add(
            'Standard shipment: Failed to create initial shipment for order #' . $order->id(),
            Log::ERROR,
            $this->logCategory(),
        );
    }
}
```

**The tax chain.** A shipping charge can be taxed by several rules, one after the other. The ordered list of their
rates is the charge's **tax chain**. During `onOrderAfterPlace` you can read it:

```php
$chain = $order->shipmentTaxChain();
// [['rate' => '24', 'name' => 'Tax 24%']]   one entry per rule, in the order they apply
// []                                        the charge is untaxed
// null                                      the order states none (it is read outside onOrderAfterPlace)
```

Each entry holds the rate as exact decimal text and the name of the tax rule. You do not have to pass it on:
`$this->shipment($order)` copies the chain, and how the figures were formed, from the order onto the parcel.

Changed in 2.2.0: each entry is `['rate' => ..., 'name' => ...]`. Before, the chain was a list of rate texts alone
(`['10', '5']`).

`shipmentTaxRate()`, `shipmentTaxChain()` and `shipmentChargeBasis()` are filled only on the order handed to
`onOrderAfterPlace`. An order read anywhere else answers `0.0`, `null` and `null`.

## onShipmentResponse

| | |
|---|---|
| **When it fires** | When a shopper's browser comes back to the shop from a page of the carrier (a pickup point map, for example), at the return address of your plugin. |
| **Who receives it** | The plugin named in the address. |
| **What you are given** | `ShipmentResponseEvent`. `getMethod()` is your plugin's element as text. `getOrder()` is `null`: Alfa does not know which order the return is about. Read the request yourself. |
| **What you are expected to do** | Check that the return is genuine, find the order from what the carrier sent, do your work, and call `setRedirectUrl()`. Always set a redirect: without one the shopper is sent nowhere. |
| **What happens next** | Alfa sends the shopper to the address you set. An address inside the shop written as `index.php?option=...` is turned into its friendly form for you. |
| **If you are missing or you fail** | If the plugin cannot be used, the shopper is sent to the shop's home page with the message that the shipping method of the return could not be identified. If your class has no such method, the shopper is sent to the cart. An error you throw shows Joomla's error page. |

## onShipmentWebhook

| | |
|---|---|
| **When it fires** | When the carrier's server calls your plugin's webhook address: picked up, delivered, returned, a label is ready. |
| **Who receives it** | The plugin named in the address. |
| **What you are given** | `ShipmentWebhookEvent`. `getMethod()` is your element, `getOrder()` is `null`. There is no shopper, no session and no token. Read the request yourself. |
| **What you are expected to do** | Three duties. Check that the call is genuine (the carrier's signature or shared secret): Alfa checks nothing. Find the parcel yourself. Cope with the same call arriving twice, with `settleAttempt()` (see below). Then set the answer. |
| **What happens next** | Alfa sends your answer to the carrier and ends the request. |
| **If you are missing or you fail** | See [Return and webhook addresses](./shipment-plugins.md#return-and-webhook-addresses). |

| Method of the event | Meaning | If you do not call it |
|---|---|---|
| `setResponseCode(int $code)` | The HTTP status. 2xx stops the carrier's retries, 5xx asks it to try again. | 200 |
| `setResponseBody(string $body)` | The body | `OK` |
| `setContentType(string $type)` | The Content-Type | `text/plain; charset=utf-8` |
| `setJsonResponse(array $payload, int $code = 200)` | Sets all three for a JSON answer | |

## onGetActions

| | |
|---|---|
| **When it fires** | When the order page in the administrator draws a shipment row, and again just before one of its actions runs. |
| **Who receives it** | The plugin recorded on the shipment row. |
| **What you are given** | `GetShipmentActionsEvent`: `getShipment()` (the row, with `id`, `status`, `tracking_number` and the rest), `getOrderShipment()` (the same row as a `Shipment` reader, for `pluginData()`), `getOrder()`. |
| **What you are expected to do** | Add the buttons that make sense for the row's status, with `$event->add($id, $label)`. Leave the method out for no buttons. |
| **What happens next** | Staff see the buttons in the row. An action that is no longer offered when staff press it is refused: write the method so that it answers from the row as it is now. |
| **If you are missing or you fail** | No buttons. When the plugin of record cannot be used, the row says which plugin and how to restore it. An error you throw is shown to staff as a warning. |

`add()` returns a `PluginAction` (`administrator/src/Plugin/PluginAction.php`). Chain what the button needs:

| Method of `PluginAction` | Meaning |
|---|---|
| `icon('truck')`, `css('btn-success')` | The icon and the button class |
| `confirm($message)` | Ask before running |
| `readOnly()` | The action changes nothing (details, logs). It may be opened from a link. |
| `mutating()` | The action changes something. This is the default: such an action runs only from a POST with a one-time key, so a reload cannot repeat it. |
| `modal($layout, $title, $size)` | Records a layout, a title and a size on the action. Nothing in 2.2.0 reads them: every button opens the action popup, its title is the button's label, and the layout drawn is the one your `onExecuteAction` sets with `setLayout()`. |
| `data([...])` | Fields posted with the action. Read them from the request in `onExecuteAction`. |
| `priority(200)` | Higher comes first. The default is 100. |
| `tooltip($text)`, `meta($key, $value)`, `buttonLayout($layout)` | Hint, extra data, your own button layout |
| `disabled()` | Takes the action off the list: no button is drawn and the action cannot be run |

From the standard plugin:

```php
$event->add('mark_shipped', Text::_('PLG_ALFA_SHIPMENTS_STANDARD_MARK_SHIPPED'))
    ->icon('truck')->css('btn-success')
    ->confirm(Text::_('PLG_ALFA_SHIPMENTS_STANDARD_CONFIRM_MARK_SHIPPED'))
    ->priority(200);
```

## onExecuteAction

| | |
|---|---|
| **When it fires** | When staff press one of your buttons. Staff need the permission to edit orders. |
| **Who receives it** | The plugin recorded on the shipment row. |
| **What you are given** | `ExecuteShipmentActionEvent`: `getAction()` (the button's id), `getShipment()`, `getOrderShipment()`, `getOrder()`. `getData()` is always empty for shipments in 2.2.0. |
| **What you are expected to do** | Do the action, then say what happened on the event. Check first that the row is yours: compare `$shipment->shipment_method_type` with your element. |
| **What happens next** | Staff see your message, your popup, or the reloaded order page. |
| **If you are missing or you fail** | When the plugin of record cannot be used the action is refused, staff are told which plugin and how to restore it, and no other plugin is asked. If you do not write the method, the base class answers "Unknown action". |

| Method of the event | Meaning |
|---|---|
| `setMessage($text)` | The message staff read |
| `setError($text)` | The action failed, with this message |
| `setRefresh(true)` | Reload the order page afterwards |
| `setRedirectUrl($url)` | Send staff elsewhere. Wins over the reload. |
| `setLayout($name)`, `setLayoutData([...])` | Draw a layout of your `tmpl` folder in the popup |
| `setModalTitle($title)` | Read by nothing in 2.2.0. The popup's title is the button's label. |
| `addButton($label, $opts)` | A button under the popup. `$opts` may hold `action` (run another action of this shipment), `data`, `reload`, `class`. |

From the standard plugin, shortened to the writing part:

```php
$result = $this->shipmentUpdate((int) $shipment->id)
    ->shipped()
    ->save();

if ($result === false) {
    $event->setError(Text::sprintf('PLG_ALFA_SHIPMENTS_STANDARD_ERROR_MARK_SHIPPED', $shipment->id));
    return;
}

$event->setMessage(Text::sprintf('PLG_ALFA_SHIPMENTS_STANDARD_MSG_MARKED_SHIPPED', $shipment->id));
$event->setRefresh(true);
```

## onAdminOrderDelete

| | |
|---|---|
| **When it fires** | When staff delete an order, before anything is removed. Once for each shipment row of the order that records a plugin. |
| **Who receives it** | The plugin recorded on that row. |
| **What you are given** | `AdminOrderDeleteEvent`. `getOrder()` returns the order. |
| **What you are expected to do** | Nothing, to allow the delete. Call `setResult(false)` to forbid it, for example while a parcel is on its way. You may also tidy up at the carrier here. |
| **What happens next** | If no plugin forbids it, Alfa deletes the order. If one does, that order is kept. |
| **If you are missing or you fail** | The base class allows the delete. If the plugin of record is disabled, missing or cannot start, the order is **not** deleted and staff are told which plugin to restore. |

## onClearData

| | |
|---|---|
| **When it fires** | When staff run Clear Data for your plugin under Tools > Extensions, remove the plugin with its data, or run Clear everything. Since 2.1.0. |
| **Who receives it** | Your plugin alone. It is started for this even when it is disabled. |
| **What you are given** | `ClearDataEvent` (`administrator/src/Event/Tools/ClearDataEvent.php`). `getSource()` says which of the three asked. |
| **What you are expected to do** | Remove the data your plugin owns (its log rows, for example). Call `setMessage()` with one translated line about what was removed. If something could not be removed, call `setError()` with a translated line and return. |
| **What happens next** | Staff see your message on the result page. |
| **If you are missing or you fail** | Without the method, staff are told that automatic Clear Data is not supported, and nothing of yours is touched. An error you throw is logged and the clear counts as failed. |
