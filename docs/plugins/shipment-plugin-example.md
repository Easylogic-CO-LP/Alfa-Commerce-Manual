---
title: A complete shipping plugin
description: "A complete minimal shipping plugin for Alfa Commerce 2.2.0, file by file."
---

# A complete shipping plugin

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Shipping plugins](./shipment-plugins.md): start here
- [Shipping plugin events](./shipment-plugin-events.md)
- **A complete shipping plugin** (this page)

This plugin is called `flat`. Each of its methods has one setting, a price, and it answers that price for every cart.
It records one parcel when the order is placed. It is modelled on the standard plugin, without the zones, the staff
buttons and the log table.

```text
plugins/alfa-shipments/flat/
    flat.xml
    services/provider.php
    src/Extension/Flat.php
    params/params.xml
    tmpl/default_item_view.php
    tmpl/default_cart_view.php
    language/en-GB/plg_alfa-shipments_flat.ini
    language/en-GB/plg_alfa-shipments_flat.sys.ini
```

**flat.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-shipments" method="upgrade">
    <name>PLG_ALFA_SHIPMENTS_FLAT</name>
    <author>Acme</author>
    <creationDate>2026-11-12</creationDate>
    <license>GNU General Public License version 3 or later</license>
    <version>1.0.0</version>
    <description>PLG_ALFA_SHIPMENTS_FLAT_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\AlfaShipments\Flat</namespace>
    <files>
        <folder>params</folder>
        <folder plugin="flat">services</folder>
        <folder>src</folder>
        <folder>tmpl</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-shipments_flat.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-shipments_flat.sys.ini</language>
    </languages>
    <config>
        <fields name="params">
            <fieldset name="basic">
            </fieldset>
        </fields>
    </config>
</extension>
```

**services/provider.php**

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\AlfaShipments\Flat\Extension\Flat;
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

return new class () implements ServiceProviderInterface {
    public function register(Container $container)
    {
        $container->set(
            PluginInterface::class,
            function (Container $container) {
                $plugin = new Flat(
                    (array) PluginHelper::getPlugin('alfa-shipments', 'flat'),
                );
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            },
        );
    }
};
```

**src/Extension/Flat.php**

```php
<?php

namespace Acme\Plugin\AlfaShipments\Flat\Extension;

use Alfa\Component\Alfa\Administrator\Event\Shipments\CalculateShippingCostEvent;
use Alfa\Component\Alfa\Administrator\Plugin\ShipmentsPlugin;
use Joomla\CMS\Log\Log;

\defined('_JEXEC') or die;

final class Flat extends ShipmentsPlugin
{
    // The item page: draw the method's name and description.
    public function onItemView($event): void
    {
        $event->setLayout('default_item_view');
        $event->setLayoutData(['method' => $event->getMethod()]);
    }

    // The cart: this plugin has nothing to add beside its method.
    public function onCartView($event): void
    {
        $event->setLayout('default_cart_view');
        $event->setLayoutData([]);
    }

    // The price: the one the merchant typed on the method, or a refusal.
    public function onCalculateShippingCost(CalculateShippingCostEvent $event): void
    {
        $price = $event->getMethod()->param('price');

        if (!is_numeric($price) || (float) $price < 0) {
            $event->setUnavailable($this->refusalKey('NO_PRICE'));

            return;
        }

        // The price as configured. Alfa applies the method's entry mode and taxes.
        $event->setShippingCost((float) $price);
    }

    // The order exists: record its parcel with the charge the order holds.
    public function onOrderAfterPlace($event): void
    {
        $order = $event->getOrder();

        $shipmentId = $this->shipment($order)
            ->pending()
            ->withAllItems()
            ->cost($order->shipmentTotal(), $order->shipmentTotalExcl(), $order->shipmentTaxRate())
            ->save();

        if (!$shipmentId) {
            Log::add(
                'Flat shipping: no parcel was recorded for order #' . $order->id(),
                Log::ERROR,
                $this->logCategory(),
            );
        }
    }
}
```

**params/params.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<form>
    <fields name="shipmentsparams">
        <fieldset name="shipmentsparams" label="PLG_ALFA_SHIPMENTS_FLAT_FIELDSET_SETTINGS">
            <field
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required="true"
                    label="PLG_ALFA_SHIPMENTS_FLAT_PRICE_LABEL"
                    description="PLG_ALFA_SHIPMENTS_FLAT_PRICE_DESC"
            />
        </fieldset>
    </fields>
</form>
```

**tmpl/default_item_view.php**

```php
<?php

\defined('_JEXEC') or die;

extract($displayData);

if (!isset($method)) {
    return;
}
?>
<div>
    <h5><?= htmlspecialchars((string) $method->name, ENT_QUOTES, 'UTF-8'); ?></h5>
    <p><?= htmlspecialchars((string) $method->description, ENT_QUOTES, 'UTF-8'); ?></p>
</div>
```

**tmpl/default_cart_view.php**

```php
<?php

\defined('_JEXEC') or die;
```

**language/en-GB/plg_alfa-shipments_flat.ini**

```ini
PLG_ALFA_SHIPMENTS_FLAT="Flat price shipping"
PLG_ALFA_SHIPMENTS_FLAT_XML_DESCRIPTION="Charges one price for every order."
PLG_ALFA_SHIPMENTS_FLAT_FIELDSET_SETTINGS="Flat price settings"
PLG_ALFA_SHIPMENTS_FLAT_PRICE_LABEL="Price"
PLG_ALFA_SHIPMENTS_FLAT_PRICE_DESC="The price of this method, as you enter shipping prices for it (see Shipping prices entered)."
PLG_ALFA_SHIPMENTS_FLAT_NO_PRICE="no price is set for this shipping method"
```

**language/en-GB/plg_alfa-shipments_flat.sys.ini**

```ini
PLG_ALFA_SHIPMENTS_FLAT="Flat price shipping"
PLG_ALFA_SHIPMENTS_FLAT_XML_DESCRIPTION="Charges one price for every order."
```

After installing: enable the plugin, leave its Access at Public, then create a shipping method, choose `flat` as its
Type, type a price, and choose "Shipping prices entered" and the "Shipping taxes" on the same form.
