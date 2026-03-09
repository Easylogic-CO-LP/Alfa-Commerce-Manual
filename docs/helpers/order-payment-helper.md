---
sidebar_position: 3
title: OrderPaymentHelper
---

# OrderPaymentHelper

`Alfa\Component\Alfa\Administrator\Helper\OrderPaymentHelper` provides a fluent builder for creating and managing payment records.

**Location:** `administrator/src/Helper/OrderPaymentHelper.php`

## Fluent Builder — Create

```php
// Pending payment
$id = OrderPaymentHelper::for($order)->pending()->save();

// Completed payment with gateway data
$id = OrderPaymentHelper::for($order)
    ->completed()
    ->transactionId('ch_3MqBE2...')
    ->gatewayResponse(json_encode($data))
    ->processedAt($now)
    ->save();

// Refund audit record
OrderPaymentHelper::for($order)
    ->refund()
    ->amount(50.00)
    ->refunded()
    ->refundedPayment($originalId)
    ->partialRefund()
    ->refundReason('Damaged item')
    ->save();
```

## Fluent Builder — Update

```php
OrderPaymentHelper::load($id)->completed()->processedAt($now)->save();
OrderPaymentHelper::load($id)->cancelled()->save();
OrderPaymentHelper::load($id)->refunded()->save();
```

## Static CRUD

```php
OrderPaymentHelper::create($data);
OrderPaymentHelper::update($id, $data);
OrderPaymentHelper::delete($id, $orderId);
OrderPaymentHelper::get($id);
OrderPaymentHelper::getByOrder($orderId);
```

## Constants

```php
// Statuses
OrderPaymentHelper::STATUS_PENDING
OrderPaymentHelper::STATUS_AUTHORIZED
OrderPaymentHelper::STATUS_COMPLETED
OrderPaymentHelper::STATUS_FAILED
OrderPaymentHelper::STATUS_CANCELLED
OrderPaymentHelper::STATUS_REFUNDED

// Types
OrderPaymentHelper::TYPE_PAYMENT
OrderPaymentHelper::TYPE_REFUND
OrderPaymentHelper::TYPE_AUTHORIZATION

// Refund types
OrderPaymentHelper::REFUND_FULL
OrderPaymentHelper::REFUND_PARTIAL
```
