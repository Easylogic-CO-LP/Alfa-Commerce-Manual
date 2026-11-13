---
sidebar_position: 8
title: Notifications
description: How an extension raises, updates and clears a notification for staff, how its text is shown in each reader's language, and who sees it in the bell.
---

# Notifications

<AlfaVersion verified="2.2.0" />

A **notification** is a line for staff in the bell at the top of Alfa Commerce's administrator screens: a new
order, low stock, a plugin that cannot be used. This page is about the helper that writes and clears them,
`NotificationHelper`, and about `NotificationText`, which carries a notification's words.

A plugin that wants to **hear** about notifications uses the event `onAlfaNotificationPushed`. It is described on
[Notification and setup events](../events/notification-and-setup-events.md#onalfanotificationpushed), with a picture
of the order of steps.

## What it does

All notifications live in one table, `#__alfa_notifications`, and one class writes it:
`Alfa\Component\Alfa\Administrator\Helper\NotificationHelper` (`administrator/src/Helper/NotificationHelper.php`).
Every method is static.

Each notification has a **key** that its producer chooses (the code calls it the dedup key). One key is one
notification: pushing the same key again updates it and never makes a second one.

| What | Who it is for |
|---|---|
| `push()`, `clear()` | Extensions. Raise a notification and take it away. |
| `exists()`, `isOpen()`, `keys()` | Extensions. Ask about your own notifications. |
| `NotificationText` and its builders | Extensions. The words of a notification. |
| The `GROUP_...` constants, `VIEW_ACTION`, `STATE_ACTION`, `PANEL_LIMIT` | Readable by anyone |
| `markRead()`, `dismiss()`, `find()`, `canView()`, `canChangeState()`, `canSee()`, `canUseLink()`, `summary()`, `toolbarBadge()`, `renderBadge()`, `safeUrl()` | Core's own screens: the bell, its panel and the Notifications list. Described so that you understand who sees what. |
| `applyJournal()`, `purge()`, `purgeThrottled()`, `pluginUnavailable()`, `unexpired()`, `visiblePairs()`, `visibilityCondition()` | Core's own. Do not call them. |

What this rests on: the changelog of 2.1.4 names `push()`, `NotificationText` and `NotificationText::from()` under
"For plugins", and the class comment says that any code pushes and that plain text is kept for third parties. The
comments of `clear()`, `exists()`, `isOpen()` and `keys()` address "a producer", which is whoever pushed the key.
The value builders of `NotificationText` are not named in the changelog. The comment of `key()` covers a key of
another extension, and the comments of the others do not say who may use them. No shipped plugin calls any of
these in 2.2.0.

## When it is used

Raise a notification for something staff must know that lasts longer than one request: your provider's keys stopped
working, an import failed, a record needs attention. For a message about the click a person has just made, use
Joomla's own message instead.

Clear it when the matter is over.

## What you must provide

### push()

```php
public static function push(string $dedupKey, NotificationText|string $title, array $options = []): void
```

This is how core raises "a new order arrived" when an order is placed (`site/src/Service/Checkout/OrderPlacement.php`):

```php
use Alfa\Component\Alfa\Administrator\Helper\NotificationHelper;
use Alfa\Component\Alfa\Administrator\Helper\NotificationText;

NotificationHelper::push(
    dedupKey: 'order:' . $orderId,
    title: NotificationText::of('COM_ALFA_NOTIFY_NEW_ORDER_TITLE', (int) $orderId),
    options: [
        'group' => NotificationHelper::GROUP_ORDERS,
        'severity' => 'info',
        'url' => 'index.php?option=com_alfa&task=order.edit&id=' . $orderId,
        'view' => ['action' => 'alfa.orders.view', 'asset' => 'com_alfa'],
        'link' => ['action' => 'alfa.orders.edit', 'asset' => 'com_alfa'],
    ],
);
```

A plugin does the same with its own key and its own language file. Use `NotificationText::from()` in place of
`of()`. A full plugin sample is on
[Notification and setup events](../events/notification-and-setup-events.md#raising-a-notification-of-your-own).

| Argument | Meaning |
|---|---|
| `$dedupKey` | Your key. Keep it the same for the same matter, and start it with a name of your own, for example `alfa.thanks:keys`. |
| `$title` | The headline: a `NotificationText`, or plain text |
| `$options['message']` | A longer text: a `NotificationText`, or plain text |
| `$options['severity']` | `success`, `info`, `warning` or `danger`. Anything else becomes `info`. |
| `$options['group']` | The heading it is listed under. Without it, `GROUP_GENERAL`. |
| `$options['url']` | A link: a relative address, or an absolute `http` or `https` address. Any other kind is dropped. |
| `$options['dismissible']` | `false` when staff may not dismiss it. Without it, `true`. |
| `$options['constant']` | `true` to raise it again each time it is pushed: unread, and back in the bell if it was dismissed |
| `$options['view']` | Who may see it: `['action' => ..., 'asset' => ...]`. Without it, everyone who may open the bell. |
| `$options['link']` | Who may follow the link, in the same form. Without it, everyone who sees the notification. |
| `$options['expires']` | A date and time in SQL format after which it is gone |

| What `push()` guarantees | What it refuses |
|---|---|
| One key is one notification, also when two requests push the same key at the same moment | A title and a message that are keys of two different extensions: `InvalidArgumentException`, raised when the notification is written. For a push inside a save that is after the save, not at your call. |
| Pushing a key that is already there updates its text, severity and link, and keeps whether it was read or dismissed | A `NotificationText` whose extension name is not made of `a` to `z`, `0` to `9`, `_`, `.` and `-`: `InvalidArgumentException` |
| A push made inside a save that is later undone writes nothing | |
| An error while writing reaches your code. An error in a plugin that listens to the notification never does. | |

### Severity and groups

The four severities, from mildest to worst: `success`, `info`, `warning`, `danger`. The bell takes the colour of
the worst unread notification the member of staff may see.

The groups core uses are language keys, shown translated:

| Constant | Language key |
|---|---|
| `NotificationHelper::GROUP_GENERAL` | `COM_ALFA_NOTIFY_GROUP_GENERAL` |
| `GROUP_ORDERS` | `COM_ALFA_NOTIFY_GROUP_ORDERS` |
| `GROUP_INVENTORY` | `COM_ALFA_NOTIFY_GROUP_INVENTORY` |
| `GROUP_DOCUMENTS` | `COM_ALFA_NOTIFY_GROUP_DOCUMENTS` |
| `GROUP_PAYMENTS` | `COM_ALFA_NOTIFY_GROUP_PAYMENTS` |
| `GROUP_SHIPPING` | `COM_ALFA_NOTIFY_GROUP_SHIPPING` |
| `GROUP_SETUP` | `COM_ALFA_NOTIFY_GROUP_SETUP` |
| `GROUP_SECURITY` | `COM_ALFA_NOTIFY_GROUP_SECURITY` |

An extension may use one of them, a language key of its own, or plain text.

### The words: NotificationText

Since 2.1.4 a notification's title and message are stored as a **language key with its values**, not as finished
text. Each member of staff then reads the notification in their own language. Plain text is still accepted, and is
shown as written to every reader.

`Alfa\Component\Alfa\Administrator\Helper\NotificationText` (`administrator/src/Helper/NotificationText.php`):

| Method | What it makes |
|---|---|
| `NotificationText::of(string $key, mixed ...$args): self` | A text of Alfa Commerce's own language files (`com_alfa`) |
| `NotificationText::from(string $domain, string $key, mixed ...$args): self` | A text of another extension's language files. `$domain` is the extension's name, for example `plg_alfa_thanks`. |
| `NotificationText::sentences(mixed ...$sentences): self` | A message made of several sentences, joined by a space. It is a text of `com_alfa`, so it cannot go with a title made by `from()` for another extension (see the two rules below). |

The values after the key fill the `%s` places of the language string, in order. A value is plain (an order number,
a name) or one of these, so that it too is shown in the reader's language:

| Method | The value it makes |
|---|---|
| `NotificationText::key(string $key, mixed ...$args): array` | Another language key, translated too |
| `NotificationText::plural(string $key, int $count, mixed ...$args): array` | A key chosen by a count, as Joomla's plural texts are |
| `NotificationText::number(int\|float $number, int $decimals = 0): array` | A number, grouped as the reader's language groups it |
| `NotificationText::date(string $utc): array` | A date and time given in UTC (`Y-m-d H:i:s`), shown in the reader's time zone. Since 2.2.0. |
| `NotificationText::content(array $byLanguage): array` | A text that exists in several content languages, such as an item's name: `['en_gb' => 'Shirt']` |
| `NotificationText::join(array $items, string $separator = ' ', ?string $and = null): array` | Several values joined, with an optional word before the last |

```php
$message = NotificationText::from(
    'plg_alfa_thanks',
    'PLG_ALFA_THANKS_NOTIFY_IMPORT_MESSAGE',
    NotificationText::number(1250),
    NotificationText::date('2026-11-12 09:30:00'),
);
```

Here the language string `PLG_ALFA_THANKS_NOTIFY_IMPORT_MESSAGE` has two `%s` places.

Two rules:

- When both the title and the message are keys, they are keys of the same extension. `of()` and `sentences()`
  make keys of `com_alfa`.
- Alfa also stores the text once in the shop's default administrator language. That copy is shown only when the
  key can no longer be found, for example after your plugin was uninstalled.

The class has more public methods (`pack()`, `unpack()`, `columns()`, `snapshot()`, `renderIn()`, `title()`,
`message()`, `group()`, `arguments()` and others). They are how core stores and prints a text. Do not call them.

### clear() and the three questions

| Method | What it does | What it guarantees |
|---|---|---|
| `clear(string $dedupKey, bool $hard = false, ?int $historyDays = null): void` | Takes a notification out of the bell. By default it moves to the history. With `$hard = true` it is deleted. | A key that has no notification changes nothing. Inside a save it waits for the save, as `push()` does. |
| `exists(string $dedupKey): bool` | Whether a notification with this key is there, in the bell or in the history | An expired one does not count. One that a save in progress still owes does count. |
| `isOpen(string $dedupKey): bool` | Whether it is in the bell now: raised and not dismissed or cleared | The same |
| `keys(string $prefix): array` | Every key that starts with `$prefix` | An empty prefix gives an empty list. The characters `%` and `_` in the prefix are taken as written. |

Use a hard clear for a state that comes and goes often, so that the history does not fill up with it.

```php
if (NotificationHelper::isOpen('alfa.thanks:keys')) {
    NotificationHelper::clear('alfa.thanks:keys');
}
```

## What happens next

### A push during a save

A push made while a save is in progress (inside a transaction) is not written at once.

| When you push | What Alfa does |
|---|---|
| With no save in progress | Writes the notification at once |
| Inside a save | Notes "a notification is owed" with the save. When the outermost save is final, the notification is written, before any other follow-up work. |
| Inside a save that is then undone | Nothing. The note is undone with the save. |

The same holds for `clear()`. Until an owed notification is written, `exists()`, `isOpen()` and `keys()` already
count it. Several pushes of one key are written in the order they were made.

Plugins hear `onAlfaNotificationPushed` only after the notification is written and the whole save is finished.

### The life of a notification

| State | Where staff see it | How it gets there |
|---|---|---|
| Active | In the bell and its panel | `push()` |
| History | In the Notifications list only | Staff dismiss it, or `clear()` without `$hard` |
| Gone | Nowhere | Its `expires` time has passed, or `clear()` with `$hard = true` |

- A dismissed or cleared notification is kept as history for 7 days by default. The shop owner changes that in the
  component's options (`notifications_history_days`, 1 to 365), and `$historyDays` of `clear()` sets it for one
  call.
- Pushing the key of a notification that is in the history updates it and leaves it in the history. To bring it
  back into the bell, push with `'constant' => true`, or clear it with `$hard = true` first.
- Pushing the key of a notification that has expired makes a new one.
- Expired rows are deleted at most once an hour, from the bell's background refresh. No page waits for it.

### The bell and the Notifications list

The dashboard and the list screens of Alfa Commerce show the bell in their toolbar. Its number is the count of unread notifications the
member of staff may see. Its panel lists the first 10 (`NotificationHelper::PANEL_LIMIT`), the most urgent and
newest first, with a link to the full list. The Notifications list shows the active ones and the history.

### Who sees a notification

Four checks apply.

| Check | Permission | What it decides |
|---|---|---|
| `canView()` | `alfa.notifications.view` on Alfa Commerce | Whether the bell, its panel and the Notifications list exist at all for this member of staff |
| `canSee($notification)` | The `view` option of the push | Whether this one notification is shown and counted. Without the option, yes. |
| `canUseLink($notification)` | The `link` option of the push | Whether its link can be followed. Without it the notification is shown with no link. |
| `canChangeState()` | `alfa.notifications.edit.state`, and `canView()` | Whether this member of staff may mark it read or dismiss it |

Marking a notification read or dismissing it changes it for every member of staff, not only for the one who
clicked.

So a notification about payments should carry a `view` option that names a payments permission. Otherwise everyone
who may open the bell reads it.

## What can go wrong

| What you see | The usual cause |
|---|---|
| The notification shows `PLG_...` in place of words | The language key is not in the language files of the extension named in `from()` |
| `InvalidArgumentException` on push | The title and the message are keys of two extensions (a `from()` title with a `sentences()` or `of()` message is one such case), or the extension name has a character that is not allowed |
| Nothing appears after a push | The push was made inside a save that was undone. Or the reader lacks the permission of the `view` option, or `alfa.notifications.view`. |
| A notification that was dismissed does not come back when the problem returns | A plain push updates it in the history. Push with `'constant' => true`. |
| The same matter appears twice | Two different keys were used for it |
| The link is missing | The address was not relative, `http` or `https`. Or the reader lacks the permission of the `link` option. |
| Your push throws an error | The notification could not be written. Decide in your code whether your work goes on without it. |

## Changed in 2.2.0 and 2.1.4

- **Since 2.2.0.** `NotificationText::date()` exists.
- **Changed in 2.1.4.** A title and a message are a language key with its values (`NotificationText`), and a group
  is a language key. Plain text is still accepted.
- **Changed in 2.1.4.** A push or a clear made inside a save is written only after the outermost save is final,
  and never for a save that was undone.

## Not documented yet

- The methods core's own screens use (`markRead()`, `dismiss()`, `find()`, `summary()`, `toolbarBadge()`,
  `renderBadge()`, `safeUrl()`) beyond what the table above says, and whether an extension's own administrator
  screen may show the bell with `toolbarBadge()`.
- `pluginUnavailable()`, the alert core raises when a provider's callback reaches a plugin that cannot be used.
- The columns of `#__alfa_notifications`.
- The methods of `NotificationText` that store and print a text.
