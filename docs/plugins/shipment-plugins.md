---
sidebar_position: 3
title: Building Shipment Plugins
---

# Building Shipment Plugins

This guide walks you through building a shipment/shipping plugin. Shipment plugins calculate shipping costs, create shipment records, and manage delivery tracking.

## Shipment Lifecycle

```
Cart page → Plugin shows shipping UI (onCartView)
  → Plugin calculates shipping cost (onCalculateShippingCost)
    → Customer places order
      → Plugin creates shipment record (onOrderAfterPlace)
        → Admin manages shipment (onGetActions / onExecuteAction)
          → Mark shipped → Mark delivered
```

## Shipment Status State Machine

```
PENDING ──→ SHIPPED ──→ DELIVERED   (normal flow)
PENDING ──→ CANCELLED               (cancellation)
PENDING ──→ ON_HOLD                 (stock/verification)
SHIPPED ──→ RETURNED                (customer return)
```

| Status | Description |
|--------|-------------|
| `pending` | Shipment created, not yet dispatched |
| `shipped` | Package dispatched, tracking active |
| `delivered` | Package received by customer |
| `cancelled` | Shipment cancelled |
| `on_hold` | Paused for verification |
| `returned` | Customer returned package |

## Step 1: Create Plugin Structure

```
plugins/alfa-shipments/yourplugin/
├── yourplugin.xml
├── services/provider.php
├── src/Extension/YourPlugin.php
├── params/
│   ├── params.xml
│   └── logs.xml
├── tmpl/
│   ├── default_item_view.php
│   ├── default_cart_view.php
│   ├── action_view_details.php
│   ├── action_tracking.php
│   └── default_order_logs_view.php
└── language/en-GB/
    ├── plg_alfa-shipments_yourplugin.ini
    └── plg_alfa-shipments_yourplugin.sys.ini
```

## Step 2: Manifest XML

```xml title="yourplugin.xml"
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-shipments" method="upgrade">
    <name>PLG_ALFA_SHIPMENTS_YOURPLUGIN</name>
    <author>Your Name</author>
    <version>1.0.0</version>
    <description>PLG_ALFA_SHIPMENTS_YOURPLUGIN_XML_DESCRIPTION</description>

    <namespace path="src">Joomla\Plugin\AlfaShipments\YourPlugin</namespace>

    <files>
        <folder>params</folder>
        <folder plugin="yourplugin">services</folder>
        <folder>src</folder>
        <folder>tmpl</folder>
    </files>

    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-shipments_yourplugin.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-shipments_yourplugin.sys.ini</language>
    </languages>

    <config>
        <fields name="params">
            <fieldset name="basic">
            </fieldset>
        </fields>
    </config>
</extension>
```

## Step 3: Main Plugin Class

```php title="src/Extension/YourPlugin.php"
<?php
namespace Joomla\Plugin\AlfaShipments\YourPlugin\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Helper\OrderShipmentHelper;
use Alfa\Component\Alfa\Administrator\Plugin\ShipmentsPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;

final class YourPlugin extends ShipmentsPlugin
{
    /**
     * Show shipping info on product page.
     */
    public function onItemView($event): void
    {
        $event->setLayout('default_item_view');
        $event->setLayoutData([
            'method' => $event->getMethod(),
            'item' => $event->getItem(),
        ]);
    }

    /**
     * Show shipping method on cart page.
     */
    public function onCartView($event): void
    {
        $event->setLayout('default_cart_view');
        $event->setLayoutData([
            'method' => $event->getMethod(),
            'cart' => $event->getCart(),
        ]);
    }

    /**
     * REQUIRED: Calculate shipping cost.
     * This is the most important method in a shipment plugin.
     * You MUST call $event->setShippingCost() with the calculated amount.
     */
    public function onCalculateShippingCost($event): void
    {
        $method = $event->getMethod();
        $cart = $event->getSubject();

        // Example: flat rate
        $cost = 5.00;

        // Example: weight-based
        // $totalWeight = 0;
        // foreach ($cart->items as $item) {
        //     $totalWeight += $item->data->weight * $item->quantity;
        // }
        // $cost = $totalWeight * 2.50;

        // Example: call external API
        // $cost = $this->callCarrierApi($cart, $method->params);

        $event->setShippingCost($cost);           // Tax-inclusive
        $event->setShippingCostTaxExcl($cost);    // Tax-exclusive (optional)
    }

    /**
     * Create shipment record after order is placed.
     */
    public function onOrderAfterPlace($event): void
    {
        $order = $event->getOrder();

        $shipmentId = $this->shipment($order)
            ->pending()
            ->withAllItems()
            ->cost(
                $order->total_shipping_tax_incl,
                $order->total_shipping_tax_excl
            )
            ->save();
    }

    /**
     * Register admin action buttons.
     */
    public function onGetActions($event): void
    {
        $shipment = $event->getShipment();
        $status = $shipment->status ?? 'pending';

        // View Details — always available
        $event->add('view_details', Text::_('COM_ALFA_VIEW_DETAILS'))
            ->icon('eye')
            ->css('btn-outline-secondary')
            ->modal('action_view_details', Text::_('COM_ALFA_SHIPMENT_DETAILS'))
            ->priority(10);

        // Pending → can ship or cancel
        if ($status === OrderShipmentHelper::STATUS_PENDING) {
            $event->add('mark_shipped', Text::_('PLG_YOURPLUGIN_MARK_SHIPPED'))
                ->icon('truck')
                ->css('btn-success')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_SHIP'))
                ->priority(200);

            $event->add('cancel', Text::_('COM_ALFA_CANCEL'))
                ->icon('cancel')
                ->css('btn-outline-danger')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_CANCEL'))
                ->priority(50);
        }

        // Shipped → can mark delivered
        if ($status === OrderShipmentHelper::STATUS_SHIPPED) {
            $event->add('mark_delivered', Text::_('PLG_YOURPLUGIN_MARK_DELIVERED'))
                ->icon('checkmark-circle')
                ->css('btn-primary')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_DELIVERED'))
                ->priority(200);
        }
    }

    /**
     * Handle admin action button clicks.
     */
    public function onExecuteAction($event): void
    {
        match ($event->getAction()) {
            'mark_shipped' => $this->handleMarkShipped($event),
            'mark_delivered' => $this->handleMarkDelivered($event),
            'cancel' => $this->handleCancel($event),
            'view_details' => $this->handleViewDetails($event),
            default => $event->setError('Unknown action'),
        };
    }

    private function handleMarkShipped($event): void
    {
        $shipment = $event->getShipment();

        $this->shipmentUpdate((int) $shipment->id)
            ->shipped()
            ->trackingNumber('TRACK-' . time())
            ->carrier('Your Carrier')
            ->save();

        $event->setMessage('Shipment marked as shipped');
        $event->setRefresh(true);
    }

    private function handleMarkDelivered($event): void
    {
        $shipment = $event->getShipment();

        $this->shipmentUpdate((int) $shipment->id)
            ->delivered()
            ->save();

        $event->setMessage('Shipment marked as delivered');
        $event->setRefresh(true);
    }

    private function handleCancel($event): void
    {
        $shipment = $event->getShipment();

        $this->shipmentUpdate((int) $shipment->id)
            ->cancelled()
            ->save();

        $event->setMessage('Shipment cancelled');
        $event->setRefresh(true);
    }

    private function handleViewDetails($event): void
    {
        $event->setLayout('action_view_details');
        $event->setLayoutData([
            'shipment' => $event->getShipment(),
            'order' => $event->getOrder(),
        ]);
    }
}
```

## Shipping Cost Calculation Strategies

### Flat Rate
```php
$event->setShippingCost(5.00);
```

### Weight-Based
```php
$totalWeight = 0;
foreach ($cart->items as $item) {
    $totalWeight += $item->data->weight * $item->quantity;
}
$cost = $totalWeight * $ratePerKg;
$event->setShippingCost($cost);
```

### Zone-Based (like Standard plugin)
The Standard plugin uses dimension-based zones:
1. Resolve delivery country
2. Find matching zone by country
3. Aggregate product dimensions (width, height, depth, weight)
4. Find first package where all dimensions fit
5. Return the package cost

### API-Based (like Box Now plugin)
```php
$response = $this->callCarrierApi([
    'origin' => $params['warehouse_id'],
    'destination' => $deliveryAddress,
    'weight' => $totalWeight,
    'dimensions' => ['w' => $w, 'h' => $h, 'd' => $d],
]);
$event->setShippingCost($response->rate);
```

## Fluent Shipment Builder Reference

### Create Shipment

```php
$id = $this->shipment($order)
    ->pending()
    ->withAllItems()
    ->cost($taxIncl, $taxExcl)
    ->trackingNumber('TRACK123')
    ->carrier('DHL')
    ->save();
```

### Update Shipment

```php
$this->shipmentUpdate($id)->shipped()->trackingNumber('NEW123')->save();
$this->shipmentUpdate($id)->delivered()->save();
$this->shipmentUpdate($id)->cancelled()->save();
```

### Builder Methods

| Method | Description |
|--------|-------------|
| `->pending()` | Set status to pending |
| `->shipped()` | Set status to shipped (auto-sets timestamp) |
| `->delivered()` | Set status to delivered (auto-sets timestamp) |
| `->cancelled()` | Set status to cancelled |
| `->onHold()` | Set status to on_hold |
| `->returned()` | Set status to returned |
| `->withAllItems()` | Assign all order items to this shipment |
| `->withItems([...])` | Assign specific items |
| `->withNoItems()` | No items assigned |
| `->cost($incl, $excl)` | Set shipping cost |
| `->trackingNumber($num)` | Set tracking number |
| `->trackingUrl($url)` | Set tracking URL |
| `->carrier($name)` | Set carrier name |
| `->weight($kg)` | Set total weight |
| `->save()` | Persist to database |

## Existing Plugins as Reference

| Plugin | Type | Reference For |
|--------|------|---------------|
| `standard` | Zone-based | Dimension matching, cost zones, admin actions |
| `boxnow` | API-based | External API calls, map integration, custom forms |
