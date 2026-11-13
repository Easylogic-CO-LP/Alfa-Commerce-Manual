---
sidebar_position: 10
title: System, console and task plugins
description: What a plugin of a group that Joomla loads itself can do with Alfa Commerce events, and what the system and console plugins shipped with Alfa Commerce do.
---

# System, console and task plugins

<AlfaVersion verified="2.2.0" />

Joomla has plugin groups of its own: `system`, `console`, `task`, `user`, `content` and others. Joomla loads them,
not Alfa Commerce. A plugin of such a group can still take part in the shop. This page says how, and what such a
plugin cannot do. It also describes the two plugins of these groups that ship with Alfa Commerce.

Read [How events reach a plugin](../events/how-events-reach-a-plugin.md) first. The words used here are explained in
the [Glossary](../reference/glossary.md).

## What it does

| Group | Loaded by Joomla | What it is for in a shop |
|---|---|---|
| `system` | On every request of the site | Reacting to shop events from anywhere on the site, also on pages that are not Alfa Commerce's |
| `console` | When Joomla's command line runs | Adding commands to `php cli/joomla.php` |
| `task` | When Joomla's Scheduled Tasks need it | A plugin's own timed work |

## When it is used

Use the `alfa` group (a feature plugin) when the plugin exists for the shop. Alfa loads that group whenever the shop
runs and only then.

Use `system` only when the plugin must also work on requests where Alfa Commerce does not run, or when it is a
plugin of another extension that also wants to hear shop events. A system plugin is loaded on every page of the
site, so keep its start cheap.

## What you must provide

### Events announced to everyone (broadcast)

A system plugin hears every broadcast Alfa event that it lists in `getSubscribedEvents()`. Nothing else is needed:
Joomla has already loaded the plugin when Alfa announces the event.

### Events addressed to one plugin (targeted)

A plugin of the Alfa groups declares its targeted events by implementing `TargetedHandlersInterface`. A plugin of a
group Joomla loads itself must **not** do that. Joomla loads such a plugin whether Alfa Commerce is installed or
not. If its class line named an Alfa Commerce interface or base class, PHP could not load the class on a site where
Alfa Commerce was uninstalled.

Such a plugin writes the same method without naming the interface:

```php
public function getTargetedHandlers(): array
{
    return ['onExecuteToolAction' => 'runTool'];
}
```

Alfa reads both forms in one place (`AlfaPluginHelper::declarationOf()`): it first looks for the interface, then
for a public `getTargetedHandlers()` method. The method returns a list of event name to the name of the public
method that handles it. Entries that are not text to text are ignored.

The three rules of the events page hold here too: the plugin is a `SubscriberInterface` plugin, an event name is in
one of the two lists and never in both, and a method that is not declared is never called.

Alfa Commerce classes may appear inside the plugin: as the type of a method's parameter, or in a method's body. PHP
loads those only when the method runs, and the method runs only when Alfa Commerce raised the event.

### What a system plugin cannot do

| It cannot | Why |
|---|---|
| Add a charge to the cart (`onCartTotals`) | These three events are handed only to the enabled plugins of the `alfa` group that the customer's access levels admit. A plugin of another group is never asked. |
| Refuse an order before it is placed (`onOrderPlaceValidate`) | The same. |
| Add its own part to a cart line (`onCartItemDisplay`) | The same. |
| Act as a payment, shipping, item-field, form-field or search plugin | Alfa calls those by their own group, and the plugin must extend that group's base class. |
| Register work in Alfa's own background work | See [Task plugins](#task-plugins). |

A plugin that needs any of the first three is a feature plugin of the `alfa` group.

## What happens next

A broadcast listener in a system plugin is treated like any other: an error in a "before" event stops the
operation, an error in an "after" or display event is logged (category `com_alfa.plugins`) and the next listener
runs.

One thing catches authors of system plugins out. `onOrderStatusChange` is announced by the shop's background work,
after the status change is saved. That work can run on any request: a shopper's page, a member of staff's page, an
API call, the cron command. Your listener must not read the current user or the current page to learn who changed
the order. Use what the event carries.

## A complete system plugin

This plugin writes a line to the file `shopnotes.php` in Joomla's log folder when an order is completed, and offers
one button on Alfa's Tools screen.
The order event is announced to everyone. The tool list (`onGetToolActions`) is announced to everyone too. Running
the tool (`onExecuteToolAction`) is addressed to this plugin alone, so it is declared in `getTargetedHandlers()`.

Tools and where their buttons appear are explained in [Admin screens](./admin-screen-plugins.md). They are used here
only to show a targeted declaration.

```text
plugins/system/shopnotes/
    shopnotes.xml
    services/provider.php
    src/Extension/Shopnotes.php
    language/en-GB/plg_system_shopnotes.ini
    language/en-GB/plg_system_shopnotes.sys.ini
```

### shopnotes.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<extension type="plugin" group="system" method="upgrade">
    <name>plg_system_shopnotes</name>
    <author>Acme</author>
    <creationDate>2026-11-12</creationDate>
    <copyright>(C) 2026 Acme</copyright>
    <license>GNU General Public License version 3 or later; see LICENSE</license>
    <version>1.0.0</version>
    <description>PLG_SYSTEM_SHOPNOTES_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\System\Shopnotes</namespace>
    <files>
        <folder plugin="shopnotes">services</folder>
        <folder>src</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_system_shopnotes.ini</language>
        <language tag="en-GB">en-GB/plg_system_shopnotes.sys.ini</language>
    </languages>
</extension>
```

### services/provider.php

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\System\Shopnotes\Extension\Shopnotes;
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
                $plugin = new Shopnotes(
                    (array) PluginHelper::getPlugin('system', 'shopnotes'),
                );
                $plugin->setApplication(Factory::getApplication());

                return $plugin;
            },
        );
    }
};
```

### src/Extension/Shopnotes.php

```php
<?php

namespace Acme\Plugin\System\Shopnotes\Extension;

use Alfa\Component\Alfa\Administrator\Event\Orders\OrderStatusChangeEvent;
use Alfa\Component\Alfa\Administrator\Event\Tools\ExecuteToolActionEvent;
use Alfa\Component\Alfa\Administrator\Event\Tools\GetToolActionsEvent;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Log\Log;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;

\defined('_JEXEC') or die;

// The class line names nothing of Alfa Commerce, so the plugin loads without it.
final class Shopnotes extends CMSPlugin implements SubscriberInterface
{
    protected $autoloadLanguage = true;

    // Announced to everyone.
    public static function getSubscribedEvents(): array
    {
        return [
            'onOrderStatusChange' => 'onOrderStatusChange',
            'onGetToolActions' => 'onGetToolActions',
        ];
    }

    // Addressed to this plugin alone. The same method a plugin of the Alfa groups
    // has through TargetedHandlersInterface, written here without the interface.
    public function getTargetedHandlers(): array
    {
        return [
            'onExecuteToolAction' => 'onExecuteToolAction',
        ];
    }

    public function onOrderStatusChange(OrderStatusChangeEvent $event): void
    {
        if (!$event->enteredCompleted()) {
            return;
        }

        $order = $event->getOrder();

        // Joomla writes a log category to a file only when a logger was added for it.
        Log::addLogger(['text_file' => 'shopnotes.php'], Log::ALL, ['shopnotes']);

        Log::add('Order ' . $order->id() . ' was completed.', Log::INFO, 'shopnotes');
    }

    public function onGetToolActions(GetToolActionsEvent $event): void
    {
        // The plugin names itself first, as group.element. The surface is the tab of the
        // Tools screen the button is drawn on: a tool without a surface is not drawn at all.
        // A name no tab of Alfa has opens a tab of its own, with surface_label as its title.
        $event->add('system.shopnotes', 'shopnotes.check', 'PLG_SYSTEM_SHOPNOTES_TOOL_LABEL')
            ->meta('surface', 'shopnotes')
            ->meta('surface_label', 'PLG_SYSTEM_SHOPNOTES_TOOL_TAB');
    }

    public function onExecuteToolAction(ExecuteToolActionEvent $event): void
    {
        if ($event->getAction() !== 'shopnotes.check') {
            return;
        }

        $event->setMessage(Text::_('PLG_SYSTEM_SHOPNOTES_TOOL_DONE'));
    }
}
```

### language/en-GB/plg_system_shopnotes.ini

```ini
PLG_SYSTEM_SHOPNOTES="System - Shop notes"
PLG_SYSTEM_SHOPNOTES_XML_DESCRIPTION="Notes completed orders in Joomla's log."
PLG_SYSTEM_SHOPNOTES_TOOL_TAB="Shop notes"
PLG_SYSTEM_SHOPNOTES_TOOL_LABEL="Check Shop notes"
PLG_SYSTEM_SHOPNOTES_TOOL_DONE="Shop notes is enabled and hears the shop's events."
```

### language/en-GB/plg_system_shopnotes.sys.ini

```ini
PLG_SYSTEM_SHOPNOTES="System - Shop notes"
PLG_SYSTEM_SHOPNOTES_XML_DESCRIPTION="Notes completed orders in Joomla's log."
```

## What can go wrong

| What you see | The usual cause |
|---|---|
| The plugin fails to load after Alfa Commerce was uninstalled | Its class line names an Alfa class or interface. |
| The tool is not listed on Tools | The plugin lists the tool and declares no `onExecuteToolAction` (Alfa shows a tool only when its plugin can run it), or the tool names no surface with `meta('surface', ...)`. |
| The targeted method is never called | The event name was put in `getSubscribedEvents()`. A targeted event is never delivered from there. |
| Alfa's log says an event is listed in both places | The same name is in `getSubscribedEvents()` and in `getTargetedHandlers()`. |
| The plugin does not appear under Tools > Extensions, so its data cannot be cleared from there | Alfa lists there the plugins of groups whose name starts with `alfa`, and plugins whose namespace starts with `Alfa\`. A plugin of another group and another namespace is not listed. |

## The system plugin that ships: Alfa Commerce Sync

`plugins/system/alfasync` (shown in Joomla as "System - Alfa Commerce Sync") is installed and enabled with Alfa
Commerce. It listens only to Joomla's own events and does the work that has to happen outside Alfa's pages:

| When | What it does |
|---|---|
| A Joomla user is saved or deleted | Keeps Alfa's own user records in step, and has the price index follow a user who moved to other customer groups. |
| A Joomla user group is saved or deleted | Keeps Alfa's customer group records in step. |
| A content language is added, saved or published | Makes that language's Alfa tables. |
| An Alfa language pack is installed or updated | Has Alfa name its order statuses and system fields in the new language. |
| Joomla's registration page is opened | Sends the visitor to Alfa's own registration page. Login, profile and password pages are not touched. |
| A storefront page, or an administrator page of staff who manage the shop, is drawn | Lets that page start the shop's background work when work is waiting. |
| An API request has been answered | Runs waiting background work for a moment. |
| Joomla's page cache asks | Keeps the cart page, and every page of a visitor who has a cart, out of the cache. |
| An administrator page starts | Loads the texts of Alfa's guided tours. |
| A site menu item is saved or deleted, a payment or shipping plugin is enabled or disabled, or Alfa's Options are saved | Has the setup checklist checked again. |
| Clear everything is running (maintenance) | Leaves the Alfa modules out of pages, refuses a save of Alfa's Options, and tells staff on other screens. |
| An Alfa extension is about to be uninstalled | Says that its data stays. See [the installer gate](./overview.md#the-installer-gate). |
| The administrator menu is built | Hides the Tools entry from staff without the permission for it. |

Its one setting is Debug Logging, which writes what it does to the file `alfa_sync.php` in Joomla's log folder.

**If it is disabled or missing.** Every Alfa Commerce administrator page shows a warning that Alfa Commerce needs
it, and says what stops: the guided tours show language keys, Alfa no longer follows Joomla's users and user groups,
pages outside Alfa Commerce no longer start the background work, and a language pack installed meanwhile takes
effect only after Language tables is run under Tools > Database Sync. Staff who may manage plugins get a link to the
plugin.

## The console plugin that ships: three commands

`plugins/console/alfa` (shown as "Console - Alfa Commerce") adds three commands to Joomla's command line. Run them
as `php cli/joomla.php` followed by the command.

### alfa:tasks:run

**What it does.** Runs the shop's waiting background work for up to 25 seconds, or until nothing is due.

**When it is used.** From the server's cron, every minute, on a shop that should not depend on visits to run its
background work.

**Options.** None.

| Exit code | Meaning |
|---|---|
| 0 | The work ran, or nothing was due |
| 1 | Refused: the shop is in maintenance, the background work is paused during an update, or the command was called inside an open database transaction or while an order was locked |
| 2 | It failed. The Alfa Commerce log names the cause. |

### alfa:tasks:prune

**What it does.** Deletes finished tasks that are old enough. It works for up to 25 seconds. Failed tasks and tasks
whose outcome is unknown stay until staff act on them under Tools > Tasks.

| The task | Deleted |
|---|---|
| Done, of one of six kinds whose result the order itself shows: `order.stock`, `order.entitlements`, `order.documents`, `payment.automation`, `shipment.automation`, `payment.refund_flip` | 7 days after it finished |
| Done, of any other kind (the e-mails, the plugins' reaction to a status change, the jobs) | 30 days after it finished |
| Resolved | 30 days after it was resolved |
| The newest done run of each of the shop-wide jobs (`stock.effects.drain`, `catalogue.rebuild`, `search.rebuild`, `tasks.prune`, `media.thumbnails.recreate`) | Never. It is kept as the record of the last run. |

**Options.** None.

| Exit code | Meaning |
|---|---|
| 0 | Done. It prints how many tasks were deleted. |
| 1 | The shop is in maintenance |
| 2 | It failed. The Alfa Commerce log names the cause. |

### alfa:inventory:audit

**What it does.** Compares the stock figures with the stock records and reports what disagrees. It only reads:
nothing is changed or repaired. Repairs are made on the Inventory audit page.

| Option | Meaning |
|---|---|
| `item` | Audit only these item ids. Give the option once per id, or separate the ids with commas. Without it the whole catalogue is audited. |
| `json` | Print the report as JSON. |

Both are written with two leading hyphens on the command line, as every long option is.

| Exit code | Meaning |
|---|---|
| 0 | Nothing found |
| 1 | At least one finding. Lines listed "for information" do not count. |
| 2 | The audit could not run: a wrong item id, maintenance, or an error |

The console plugin is separate from Alfa Commerce Sync, so the commands keep working while that plugin is
disabled.

## Task plugins

Alfa Commerce 2.2.0 ships no task plugin.

Alfa has background work of its own (tasks and jobs, under Tools > Tasks). In 2.2.0 only Alfa Commerce itself
creates them. The lists of what can run are fixed inside Alfa, and writing a task or a job with a name Alfa does not
know is refused. An extension cannot register its own.

So a plugin's own timed work uses Joomla's Scheduled Tasks: a plugin of the `task` group, written and set up the
way Joomla's documentation describes. That is Joomla's feature, not Alfa's. If such a plugin also handles a targeted
Alfa event, it declares it with `getTargetedHandlers()` and no Alfa interface, as shown above.

A plugin's code can still run inside work that Alfa queues, without queuing anything itself. The clearest case is a
listener of `onOrderStatusChange`: Alfa records each listener's run as part of a task, and staff can run a failed
one again.

The background work engine will be described on the page "Background work"
(../architecture/background-work.md), which is not written yet.

## Changed in 2.2.0

- New: a plugin of a group Joomla loads itself declares targeted handlers with a public `getTargetedHandlers()` and
  names no Alfa class or interface on its class line.
- `onCartTotals`, `onOrderPlaceValidate` and `onCartItemDisplay` go only to plugins of the `alfa` group. A system
  plugin that used them must move that code to a feature plugin.
- The console commands come with "Console - Alfa Commerce". The update removes "Console - Alfa Inventory";
  `alfa:inventory:audit` keeps its name, so existing cron lines keep working.
- The scheduled task "Alfa - Prepare list prices for customer groups" and its task plugin are removed by the
  update. Alfa's own background work does that job now.
- The shop's background work no longer needs a cron job. `alfa:tasks:run` remains for servers that prefer one.

## Not documented yet

- The web-cron address that also runs the background work.
- The `webservices` plugin that ships (`plugins/webservices/alfa`), which registers the REST API's routes. It
  belongs with the REST API pages.
- The background work engine itself.
