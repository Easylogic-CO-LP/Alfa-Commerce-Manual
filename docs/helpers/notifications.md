---
sidebar_position: 7
title: Notification Centre
---

# Notification Centre

A generic backend notification store. Any code pushes a notification with a stable key; the admin toolbar shows a
badge + dropdown, and dismissed items are kept in a history view. The store is content-agnostic — every producer
(new order, low stock, …) calls the same `push()`.

## Raise a notification

```php
use Alfa\Component\Alfa\Administrator\Helper\NotificationHelper;

NotificationHelper::push('order:123', 'New order #123', [
    'group'       => 'Orders',
    'severity'    => 'success',        // success | info | warning | danger
    'message'     => 'A new order is waiting.',
    'url'         => 'index.php?option=com_alfa&task=order.edit&id=123',
    'dismissible' => true,
    'constant'    => false,            // true = resurface (mark unread) on re-push
    'view'        => ['action' => 'core.manage', 'asset' => 'com_alfa'],  // who may SEE it
    'link'        => ['action' => 'core.edit',   'asset' => 'com_alfa'],  // who may follow the link
]);
```

- **Dedup** — re-pushing the same key updates the row in place and preserves read/dismissed state (a still-true
  condition doesn't re-nag); `constant => true` clears read state so a persistent condition resurfaces.
- **Lifecycle** — `markRead($id, $userId)`, `dismiss($id)` (→ history, kept until `expires`, default 7 days),
  `clear($key, $hard)` (`$hard` deletes outright — for fluctuating live states). Expired rows are purged lazily on read.
- **Two gates** — `canSee()` (the `view_access` action/asset) controls visibility + the count; `canUseLink()`
  (`url_access`) controls whether the link is clickable. Empty action = unrestricted.

## Toolbar badge

A list view's `addToolbar()` calls `NotificationHelper::toolbarBadge($toolbar)` — it loads the assets, registers the
panel/markRead/dismiss AJAX endpoints, and renders the badge. `summary()` counts only **unread, active** notifications
the user can see and reports the highest severity among them (the badge colour).

Storage: `#__alfa_notifications` (`dedup_key` unique, group/severity/title/message/url, access columns, timestamps);
the `Notifications` admin view lists the history.

> Reference: `administrator/src/Helper/NotificationHelper.php`.
