---
sidebar_position: 1
title: Plugin System Overview
---

# Plugin System Overview

Alfa Commerce is designed as a **marketplace platform** — third-party developers can extend it by writing plugins for payments, shipping, and custom fields without modifying core code.

## Plugin Types

| Type | Group | Purpose | Example |
|------|-------|---------|---------|
| **Payment** | `alfa-payments` | Payment gateway integrations | Stripe, PayPal, Revolut |
| **Shipment** | `alfa-shipments` | Shipping method integrations | FedEx, DHL, Box Now |
| **Custom Field** | `alfa-fields` | Custom form field types | Color picker, File upload |
| **Media** | `alfa-media` | Image processing (validate, resize, convert, thumbnail) | Resize, WebP, compress |

:::note What ships in core
The core package bundles only the **`standard`** payment and shipment reference plugins, plus the field plugins
(`text`, `textarea`, `tel`, `choice`). The gateways/carriers in the *Example* column are illustrative; real integrations
(and image-processing plugins) are premium and distributed separately.
:::

## Plugin Architecture

All Alfa Commerce plugins follow the same architecture:

```
plugins/{group}/{name}/
├── {name}.xml                    # Manifest (metadata, namespace, config)
├── services/
│   └── provider.php              # DI container registration
├── src/Extension/
│   └── {Name}.php                # Main plugin class
├── params/
│   ├── params.xml                # Plugin configuration form
│   └── logs.xml                  # Log table schema
├── tmpl/
│   ├── default_item_view.php     # Product page template
│   ├── default_cart_view.php     # Cart page template
│   └── ...                       # More templates
├── language/{locale}/
│   ├── plg_{group}_{name}.ini    # Language strings
│   └── plg_{group}_{name}.sys.ini
├── media/                        # CSS, JS, images (optional)
└── forms/                        # Additional form XMLs (optional)
```

## Inheritance Chain

```
Joomla\CMS\Plugin\CMSPlugin         (Joomla core)
  └── Plugin                          (Alfa base — logging system)
        ├── PaymentsPlugin            (Payment-specific builder + hooks)
        ├── ShipmentsPlugin           (Shipment-specific builder + hooks)
        └── FieldsPlugin              (Field-specific hooks)
```

Each level adds:

| Class | Provides |
|-------|----------|
| `Plugin` | Logging system (`log()`, `loadLogs()`), auto-creates plugin-specific log tables |
| `PaymentsPlugin` | Fluent payment builder (`payment()`, `paymentUpdate()`), read/delete helpers |
| `ShipmentsPlugin` | Fluent shipment builder (`shipment()`, `shipmentUpdate()`), read/delete helpers |
| `FieldsPlugin` | Field rendering and validation hooks |

## Plugin Registration

Every plugin needs a service provider to register with Joomla's DI container:

```php title="services/provider.php"
<?php
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;
use Joomla\Plugin\AlfaPayments\YourPlugin\Extension\YourPlugin;

return new class () implements ServiceProviderInterface {
    public function register(Container $container)
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new YourPlugin(
                    (array) PluginHelper::getPlugin('alfa-payments', 'yourplugin'),
                );
                $plugin->setApplication(Factory::getApplication());
                return $plugin;
            },
        );
    }
};
```

## Logging System

Every plugin gets its own database log table (auto-created from `params/logs.xml`):

```php
// Write a log entry
$this->log([
    'id_order' => $order->id,
    'action' => 'payment_captured',
    'amount' => 150.00,
    'note' => 'Payment confirmed by gateway',
    'created_on' => Factory::getDate('now', 'UTC')->toSql(),
    'created_by' => Factory::getApplication()->getIdentity()->id,
]);

// Read logs
$logs = $this->loadLogs($orderId);
$logs = $this->loadLogs($orderId, $paymentId);
```

## Admin Action Buttons

Plugins can register action buttons in the admin order edit view using a fluent API:

```php
$event->add('mark_paid', 'Mark as Paid')
    ->icon('checkmark')
    ->css('btn-success')
    ->confirm('Are you sure you want to mark this as paid?')
    ->priority(200);

$event->add('view_details', 'View Details')
    ->icon('eye')
    ->css('btn-outline-secondary')
    ->modal('action_view_details', 'Payment Details', 'lg')
    ->priority(10);
```

## Template System

Plugin templates are stored in `tmpl/` and rendered via events:

```php
public function onCartView($event): void
{
    $event->setLayout('default_cart_view');
    $event->setLayoutData([
        'method' => $event->getMethod(),
        'cart' => $event->getCart(),
    ]);
}
```

In templates, use `extract($displayData)` to access variables:

```php title="tmpl/default_cart_view.php"
<?php
extract($displayData);
// $method and $cart are now available
?>
<div class="payment-method">
    <h5><?= htmlspecialchars($method->name); ?></h5>
</div>
```

## Next Steps

- [Build a Payment Plugin →](/docs/plugins/payment-plugins)
- [Build a Shipment Plugin →](/docs/plugins/shipment-plugins)
- [Build a Custom Field Plugin →](/docs/plugins/custom-field-plugins)
- [Conditional Field Visibility (showon) →](/docs/plugins/showon)
- [Build a Media Plugin →](/docs/plugins/media-plugins)
