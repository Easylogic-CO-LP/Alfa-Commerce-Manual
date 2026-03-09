---
sidebar_position: 2
title: Building Payment Plugins
---

# Building Payment Plugins

This guide walks you through building a payment plugin from scratch. By the end, you'll have a fully functional payment gateway integration.

## Payment Lifecycle

```
Customer adds items to cart
  → Customer selects payment method (onCartView)
    → Customer clicks "Place Order"
      → Order saved to database
        → Plugin creates payment record (onOrderAfterPlace)
          → Customer sees processing page (onOrderProcessView)
            → [For gateways: redirect to payment page]
              → Gateway sends callback (onPaymentResponse)
                → Plugin updates payment status
                  → Customer sees confirmation (onOrderCompleteView)
```

## Payment Statuses

```
PENDING ──────→ COMPLETED ──────→ REFUNDED
  │  (Mark Paid)    (Refund)
  │
  └── CANCELLED

AUTHORIZED ───→ COMPLETED
     (Capture)

PENDING ──────→ FAILED
   (Gateway decline)
```

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting payment (offline/bank transfer) |
| `authorized` | Funds reserved, not yet captured |
| `completed` | Payment received successfully |
| `failed` | Gateway declined or timed out |
| `cancelled` | Cancelled before completion |
| `refunded` | Refund issued |

## Step 1: Create Plugin Structure

```
plugins/alfa-payments/yourplugin/
├── yourplugin.xml
├── services/provider.php
├── src/Extension/YourPlugin.php
├── params/
│   ├── params.xml
│   └── logs.xml
├── tmpl/
│   ├── default_item_view.php
│   ├── default_cart_view.php
│   ├── default_order_process.php
│   ├── default_order_completed.php
│   ├── action_view_details.php
│   └── default_order_logs_view.php
└── language/en-GB/
    ├── plg_alfa-payments_yourplugin.ini
    └── plg_alfa-payments_yourplugin.sys.ini
```

## Step 2: Manifest XML

```xml title="yourplugin.xml"
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-payments" method="upgrade">
    <name>PLG_ALFA_PAYMENTS_YOURPLUGIN</name>
    <author>Your Name</author>
    <creationDate>2025-01</creationDate>
    <version>1.0.0</version>
    <description>PLG_ALFA_PAYMENTS_YOURPLUGIN_XML_DESCRIPTION</description>

    <namespace path="src">Joomla\Plugin\AlfaPayments\YourPlugin</namespace>

    <files>
        <folder>params</folder>
        <folder plugin="yourplugin">services</folder>
        <folder>src</folder>
        <folder>tmpl</folder>
    </files>

    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-payments_yourplugin.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-payments_yourplugin.sys.ini</language>
    </languages>

    <config>
        <fields name="params">
            <fieldset name="basic">
            </fieldset>
        </fields>
    </config>
</extension>
```

## Step 3: Service Provider

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

## Step 4: Main Plugin Class

```php title="src/Extension/YourPlugin.php"
<?php
namespace Joomla\Plugin\AlfaPayments\YourPlugin\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Helper\OrderPaymentHelper;
use Alfa\Component\Alfa\Administrator\Plugin\PaymentsPlugin;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;

final class YourPlugin extends PaymentsPlugin
{
    /**
     * Show payment info on product page.
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
     * Show payment method selector on cart page.
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
     * Create initial payment record after order is placed.
     * This is called ONCE when the order is committed to the database.
     */
    public function onOrderAfterPlace($event): void
    {
        $order = $event->getOrder();

        // For offline payment: create as pending
        $paymentId = $this->payment($order)
            ->pending()
            ->save();

        // For gateway payment: create as authorized
        // $session = $this->createGatewaySession($order);
        // $paymentId = $this->payment($order)
        //     ->authorized()
        //     ->transactionId($session->id)
        //     ->save();
    }

    /**
     * Order processing page — after checkout, before completion.
     * For offline: show payment instructions (bank details, etc.)
     * For gateway: redirect to the payment page
     */
    public function onOrderProcessView($event): void
    {
        $order = $event->getOrder();
        $method = $event->getMethod();

        // Option A: Show a template with instructions
        $event->setLayout('default_order_process');
        $event->setLayoutData([
            'order' => $order,
            'method' => $method,
        ]);

        // Option B: Redirect to gateway
        // $event->setRedirectUrl('https://gateway.com/pay?session=' . $sessionId);
        // $event->setRedirectCode(303);
    }

    /**
     * Order completion page — thank-you message.
     */
    public function onOrderCompleteView($event): void
    {
        $event->setLayout('default_order_completed');
        $event->setLayoutData([
            'order' => $event->getOrder(),
            'method' => $event->getMethod(),
        ]);
    }

    /**
     * Handle gateway webhook callback.
     * Called when the payment gateway sends a notification.
     */
    public function onPaymentResponse($event): void
    {
        $order = $event->getOrder();
        $input = $this->getApplication()->getInput();

        // Verify the callback (check signature, etc.)
        // $gatewayData = $this->verifyWebhook($input);

        // Update payment to completed
        // $this->paymentUpdate($paymentId)
        //     ->completed()
        //     ->transactionId($gatewayData->transaction_id)
        //     ->gatewayResponse(json_encode($gatewayData))
        //     ->processedAt(Factory::getDate('now', 'UTC')->toSql())
        //     ->save();
    }

    /**
     * Register admin action buttons.
     */
    public function onGetActions($event): void
    {
        $payment = $event->getPayment();
        $status = $payment->transaction_status ?? 'pending';

        // Always show: View Details
        $event->add('view_details', Text::_('COM_ALFA_VIEW_DETAILS'))
            ->icon('eye')
            ->css('btn-outline-secondary')
            ->modal('action_view_details', Text::_('COM_ALFA_PAYMENT_DETAILS'))
            ->priority(10);

        // Always show: View Logs
        $event->add('view_logs', Text::_('COM_ALFA_VIEW_LOGS'))
            ->icon('list')
            ->css('btn-outline-info')
            ->modal('default_order_logs_view', Text::_('COM_ALFA_PAYMENT_LOGS'))
            ->priority(5);

        // Pending → can mark paid or cancel
        if ($status === OrderPaymentHelper::STATUS_PENDING) {
            $event->add('mark_paid', Text::_('PLG_YOURPLUGIN_MARK_PAID'))
                ->icon('checkmark')
                ->css('btn-success')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_MARK_PAID'))
                ->priority(200);

            $event->add('cancel', Text::_('COM_ALFA_CANCEL'))
                ->icon('cancel')
                ->css('btn-outline-danger')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_CANCEL'))
                ->priority(50);
        }

        // Completed → can refund
        if ($status === OrderPaymentHelper::STATUS_COMPLETED) {
            $event->add('refund', Text::_('PLG_YOURPLUGIN_REFUND'))
                ->icon('undo-2')
                ->css('btn-warning')
                ->confirm(Text::_('PLG_YOURPLUGIN_CONFIRM_REFUND'))
                ->priority(150);
        }
    }

    /**
     * Handle admin action button clicks.
     */
    public function onExecuteAction($event): void
    {
        match ($event->getAction()) {
            'mark_paid' => $this->handleMarkPaid($event),
            'cancel' => $this->handleCancel($event),
            'refund' => $this->handleRefund($event),
            'view_details' => $this->handleViewDetails($event),
            'view_logs' => $this->handleViewLogs($event),
            default => $event->setError('Unknown action'),
        };
    }

    private function handleMarkPaid($event): void
    {
        $payment = $event->getPayment();

        $this->paymentUpdate((int) $payment->id)
            ->completed()
            ->processedAt(Factory::getDate('now', 'UTC')->toSql())
            ->save();

        $this->log([
            'id_order' => $event->getOrder()->id,
            'id_order_payment' => $payment->id,
            'action' => 'mark_paid',
            'transaction_status' => OrderPaymentHelper::STATUS_COMPLETED,
            'amount' => $payment->amount,
            'note' => 'Marked as paid by admin',
            'created_on' => Factory::getDate('now', 'UTC')->toSql(),
            'created_by' => Factory::getApplication()->getIdentity()->id,
        ]);

        $event->setMessage('Payment marked as paid');
        $event->setRefresh(true);
    }

    private function handleCancel($event): void
    {
        $payment = $event->getPayment();

        $this->paymentUpdate((int) $payment->id)
            ->cancelled()
            ->save();

        $event->setMessage('Payment cancelled');
        $event->setRefresh(true);
    }

    private function handleRefund($event): void
    {
        $payment = $event->getPayment();
        $order = $event->getOrder();

        // Step 1: Mark original payment as refunded
        $this->paymentUpdate((int) $payment->id)
            ->refunded()
            ->save();

        // Step 2: Create refund audit record
        $this->payment($order)
            ->refund()
            ->amount((float) $payment->amount)
            ->refunded()
            ->refundedPayment((int) $payment->id)
            ->fullRefund()
            ->refundReason('Admin refund')
            ->save();

        $event->setMessage('Payment refunded');
        $event->setRefresh(true);
    }

    private function handleViewDetails($event): void
    {
        $event->setLayout('action_view_details');
        $event->setLayoutData([
            'payment' => $event->getPayment(),
            'order' => $event->getOrder(),
        ]);
    }

    private function handleViewLogs($event): void
    {
        $event->setLayout('default_order_logs_view');
        $event->setLayoutData([
            'logs' => $this->loadLogs(
                $event->getOrder()->id,
                $event->getPayment()->id
            ),
            'schema' => $this->getLogsSchema(),
        ]);
    }
}
```

## Step 5: Configuration

```xml title="params/params.xml"
<?xml version="1.0" encoding="UTF-8"?>
<form>
    <fields name="paymentsparams">
        <fieldset name="paymentsparams">
            <field name="api_key"
                type="text"
                label="API Key"
                description="Your payment gateway API key"
                required="true" />

            <field name="secret_key"
                type="password"
                label="Secret Key"
                description="Your payment gateway secret key"
                required="true" />

            <field name="sandbox_mode"
                type="radio"
                layout="joomla.form.field.radio.switcher"
                label="Sandbox Mode"
                default="1">
                <option value="0">JNO</option>
                <option value="1">JYES</option>
            </field>

            <field name="webhook_url"
                type="text"
                label="Webhook URL"
                description="URL for gateway callbacks"
                readonly="true" />
        </fieldset>
    </fields>
</form>
```

Access configuration in your plugin:

```php
$params = $order->selected_payment->params;
$apiKey = $params['api_key'];
$isSandbox = $params['sandbox_mode'] === '1';
```

## Step 6: Log Schema

```xml title="params/logs.xml"
<?xml version="1.0" encoding="UTF-8"?>
<form>
    <fields name="paymentslogs">
        <fieldset name="paymentslogs">
            <field name="action" mysql_type="varchar(50)" default="NULL" />
            <field name="transaction_status" mysql_type="varchar(20)" default="NULL" />
            <field name="amount" mysql_type="decimal(20,6)" default="0.000000" />
            <field name="currency" mysql_type="char(3)" default="NULL" />
            <field name="transaction_id" mysql_type="varchar(254)" default="NULL" />
            <field name="refund_type" mysql_type="varchar(10)" default="NULL" />
            <field name="note" mysql_type="varchar(500)" default="NULL" />
            <field name="created_on" mysql_type="datetime" default="0000-00-00 00:00:00" />
            <field name="created_by" mysql_type="int(11)" default="0" />
        </fieldset>
    </fields>
</form>
```

## Fluent Payment Builder Reference

### Create Payment

```php
// Pending (offline)
$id = $this->payment($order)->pending()->save();

// Authorized (gateway pre-auth)
$id = $this->payment($order)
    ->authorized()
    ->transactionId('ch_3MqBE2...')
    ->save();

// Completed (instant capture)
$id = $this->payment($order)
    ->completed()
    ->transactionId('ch_3MqBE2...')
    ->gatewayResponse(json_encode($response))
    ->processedAt($now)
    ->save();

// Refund audit record
$this->payment($order)
    ->refund()
    ->amount(100.00)
    ->refunded()
    ->refundedPayment($originalPaymentId)
    ->fullRefund()          // or ->partialRefund()
    ->refundReason('Customer requested')
    ->save();
```

### Update Payment

```php
$this->paymentUpdate($paymentId)->completed()->processedAt($now)->save();
$this->paymentUpdate($paymentId)->cancelled()->save();
$this->paymentUpdate($paymentId)->refunded()->save();
```

### Read/Delete

```php
$payment = $this->getPayment($paymentId);
$payments = $this->getPaymentsByOrder($orderId);
$this->deletePayment($paymentId, $orderId);
```

## Financial Calculation Rules

```
total_paid_real = SUM(amount)
  WHERE payment_type = 'payment'
  AND transaction_status = 'completed'
```

- Only **completed payments** count toward revenue
- **Authorized** payments do NOT count (funds reserved, not captured)
- **Refund audit records** are NEVER counted (payment_type = 'refund')
- When a payment is refunded, its status flips to 'refunded' → drops from total immediately

## Existing Plugins as Reference

| Plugin | Type | Reference For |
|--------|------|---------------|
| `standard` | Offline | Admin actions (mark paid, cancel, refund) |
| `revolut` | Redirect gateway | External redirect flow, webhook handling |
| `viva` | Form submission | Form-based payment, API integration |
