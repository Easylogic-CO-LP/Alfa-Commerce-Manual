---
title: A complete payment plugin
description: "A complete minimal payment plugin for Alfa Commerce 2.2.0, file by file."
---

# A complete payment plugin

<AlfaVersion verified="2.2.0" />

**The pages of this guide:**

- [Payment plugins](./payment-plugins.md): start here
- [Payment plugin events](./payment-plugin-events.md)
- [Payments, refunds and webhooks](./payment-plugin-money.md)
- **A complete payment plugin** (this page)

This plugin takes an offline payment, such as a bank transfer. When an order is placed it records a pending payment.
When the money arrives, staff press "Mark as paid", and the order moves to the status the method's settings name. It
is modelled on the Standard plugin. Its element is `offline`.

```text
plugins/alfa-payments/offline/
  offline.xml
  services/provider.php
  src/Extension/Offline.php
  params/params.xml
  tmpl/default_item_view.php
  tmpl/default_cart_view.php
  tmpl/default_order_completed.php
  language/en-GB/plg_alfa-payments_offline.ini
  language/en-GB/plg_alfa-payments_offline.sys.ini
```

**`offline.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-payments" method="upgrade">
	<name>PLG_ALFA_PAYMENTS_OFFLINE</name>
	<author>Acme</author>
	<creationDate>2026-11-12</creationDate>
	<license>GNU General Public License version 3 or later</license>
	<version>1.0.0</version>
	<description>PLG_ALFA_PAYMENTS_OFFLINE_XML_DESCRIPTION</description>
	<namespace path="src">Acme\Plugin\AlfaPayments\Offline</namespace>
	<files>
		<folder plugin="offline">services</folder>
		<folder>src</folder>
		<folder>tmpl</folder>
		<folder>params</folder>
	</files>
	<languages folder="language">
		<language tag="en-GB">en-GB/plg_alfa-payments_offline.ini</language>
		<language tag="en-GB">en-GB/plg_alfa-payments_offline.sys.ini</language>
	</languages>
</extension>
```

**`services/provider.php`**

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\AlfaPayments\Offline\Extension\Offline;
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
                $plugin = new Offline(
                    (array) PluginHelper::getPlugin('alfa-payments', 'offline'),
                );
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            },
        );
    }
};
```

**`src/Extension/Offline.php`**

```php
<?php

namespace Acme\Plugin\AlfaPayments\Offline\Extension;

use Alfa\Component\Alfa\Administrator\Plugin\PaymentsPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Log\Log;

\defined('_JEXEC') or die;

final class Offline extends PaymentsPlugin
{
    /**
     * Staff may place an order with this method: it needs no shopper, no browser and no provider.
     */
    public function supportsOperatorPlacement(): bool
    {
        return true;
    }

    public function onItemView($event): void
    {
        $event->setLayout('default_item_view');
        $event->setLayoutData(['method' => $event->getMethod()]);
    }

    public function onCartView($event): void
    {
        // The layout prints nothing, so nothing is passed to it.
        $event->setLayout('default_cart_view');
        $event->setLayoutData([]);
    }

    public function onOrderAfterPlace($event): void
    {
        $order = $event->getOrder();

        // Only an order this plugin takes.
        if ($this->getPaymentMethod(orderId: $order->id()) === null) {
            return;
        }

        // Nothing left to collect: write no row.
        if ($this->amountToCollect($order) <= 0.000001) {
            return;
        }

        // One pending payment for the amount still to collect.
        $paymentId = $this->payment($order)->pending()->save();

        // The order is already saved, so report and do not throw.
        if (!$paymentId) {
            Log::add('Offline payment: no payment row was created for order #' . $order->id(), Log::ERROR, $this->logCategory());
        }
    }

    public function onOrderProcessView($event): void
    {
        // Offline: nothing to do. The shopper goes straight to the completed page.
    }

    public function onOrderCompleteView($event): void
    {
        $event->setLayout('default_order_completed');
        $event->setLayoutData([]);
    }

    public function onGetActions($event): void
    {
        $payment = $event->getPayment();

        if (($payment->transaction_status ?? '') === self::STATUS_PENDING) {
            $event->add('mark_paid', Text::_('PLG_ALFA_PAYMENTS_OFFLINE_MARK_PAID'))
                ->mutating()
                ->icon('checkmark')->css('btn-success')
                ->confirm(Text::_('PLG_ALFA_PAYMENTS_OFFLINE_CONFIRM_MARK_PAID'))
                ->priority(200);
        }
    }

    public function onExecuteAction($event): void
    {
        $payment = $event->getPayment();

        if ($event->getAction() !== 'mark_paid') {
            $event->setError(Text::sprintf('PLG_ALFA_PAYMENTS_OFFLINE_ERROR_UNKNOWN_ACTION', $event->getAction()));

            return;
        }

        // Only a payment this plugin wrote.
        if ((string) ($payment->payment_method_type ?? '') !== $this->_name) {
            $event->setError(Text::sprintf('PLG_ALFA_PAYMENTS_OFFLINE_ERROR_NOT_OWN', (int) $payment->id));

            return;
        }

        // Changing the row to completed is what moves the order (status_on_completed).
        $saved = $this->paymentUpdate((int) $payment->id)
            ->completed()
            ->processedAt(Factory::getDate('now', 'UTC')->toSql())
            ->save();

        if ($saved === false) {
            $event->setError(Text::sprintf('PLG_ALFA_PAYMENTS_OFFLINE_ERROR_MARK_PAID', (int) $payment->id));

            return;
        }

        $event->setMessage(Text::sprintf('PLG_ALFA_PAYMENTS_OFFLINE_MSG_MARKED_PAID', (int) $payment->id));
        $event->setRefresh(true);
    }
}
```

**`params/params.xml`** is printed in full under [Method settings](./payment-plugins.md#method-settings).

**`tmpl/default_item_view.php`**

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
</div>
```

**`tmpl/default_cart_view.php`**

```php
<?php

\defined('_JEXEC') or die;
```

**`tmpl/default_order_completed.php`**

```php
<?php

use Joomla\CMS\Language\Text;

\defined('_JEXEC') or die;
?>
<p><?= Text::_('PLG_ALFA_PAYMENTS_OFFLINE_COMPLETED_NOTE'); ?></p>
```

**`language/en-GB/plg_alfa-payments_offline.ini`**

```ini
PLG_ALFA_PAYMENTS_OFFLINE="Offline payment"
PLG_ALFA_PAYMENTS_OFFLINE_FIELDSET_SETTINGS="Offline payment settings"
PLG_ALFA_PAYMENTS_OFFLINE_STATUS_ON_COMPLETED_LABEL="Order status when paid"
PLG_ALFA_PAYMENTS_OFFLINE_STATUS_NO_CHANGE="No change"
PLG_ALFA_PAYMENTS_OFFLINE_COMPLETED_NOTE="We will confirm your order as soon as your payment arrives."
PLG_ALFA_PAYMENTS_OFFLINE_MARK_PAID="Mark as paid"
PLG_ALFA_PAYMENTS_OFFLINE_CONFIRM_MARK_PAID="Mark this payment as paid?"
PLG_ALFA_PAYMENTS_OFFLINE_MSG_MARKED_PAID="Payment #%d marked as paid"
PLG_ALFA_PAYMENTS_OFFLINE_ERROR_MARK_PAID="Payment #%d could not be marked as paid"
PLG_ALFA_PAYMENTS_OFFLINE_ERROR_NOT_OWN="Payment #%d was not taken through this payment method. Nothing was changed."
PLG_ALFA_PAYMENTS_OFFLINE_ERROR_UNKNOWN_ACTION="Unknown action: %s"
```

**`language/en-GB/plg_alfa-payments_offline.sys.ini`**

```ini
PLG_ALFA_PAYMENTS_OFFLINE="Offline payment"
PLG_ALFA_PAYMENTS_OFFLINE_XML_DESCRIPTION="Takes a payment outside the shop and lets staff mark it as paid."
```

After installing: enable the plugin, leave its Access on Public, create a payment method of type `offline` under
Alfa Commerce, and choose the order status for "Order status when paid".

A site template can override any of your plugin's layouts at
`templates/<template>/html/plg_alfa-payments_<element>/<layout>.php`. Alfa looks there first, then in your plugin's
`tmpl/` folder.
