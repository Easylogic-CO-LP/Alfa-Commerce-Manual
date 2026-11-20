---
sidebar_position: 9
title: Adding routes to the REST API
description: How a plugin of the alfa group adds addresses of its own to the REST API, with Joomla's router calls, its own permission and its own answer, how it hears the shop's changes, and how the integration account that calls it is set up.
---

# Adding routes to the REST API

<AlfaVersion verified="2.2.2" />

A plugin of the **`alfa`** group can add addresses of its own to the shop's REST API, under
`v1/alfa/ext/<element>/`, where `<element>` is the plugin's element (`example` for `plg_alfa_example`). It declares
them with Joomla's own router calls, as a webservices plugin does, and answers each request itself. An integrator that
speaks a dialect of its own (Base.com, a marketplace, an ERP) is served this way without a component of its own and
without a second plugin.

## Two ways an event reaches a plugin

Alfa Commerce delivers an event in one of two ways, and a plugin names it in one place only:

- **Announced to every plugin (broadcast):** named in `getSubscribedEvents()`. The shop's changes are announced this
  way: the stock, price, order status and placed order events below.
- **Addressed to one plugin (targeted):** handled by the plugin's public method with the event's name, never named in
  `getSubscribedEvents()`. Both route events on this page are targeted: core sends them to the plugin the address
  names and to no other. A plugin without one of the two methods takes no part, and its addresses answer 404.

[How events reach a plugin](../events/how-events-reach-a-plugin.md) tells the whole story of both.

## What it does

Joomla's API application lets only the `webservices` and `system` groups hear `onBeforeApiRoute`. Alfa Commerce's own
webservices plugin bridges it: when a request's address starts with `v1/alfa/ext/<element>/`, it boots the plugin of
that element alone and asks it, with `onAlfaBeforeApiRoute`, to write its routes on a router of its own. Every route
that keeps the rules below is put on the application's router after the core routes. A request on it then reaches the
plugin through `onAlfaApiRequest`, once Joomla has checked the token and Alfa Commerce has checked the route's
permission and the size of the body.

| Event | Class | The plugin's job |
|---|---|---|
| `onAlfaBeforeApiRoute` | `ApiRoutesEvent` | Write its routes on `getRouter()`, under `getPrefix()`, and do nothing else: it runs before the token is checked |
| `onAlfaApiRequest` | `ApiRequestEvent` | Read the request and answer it, once |

The two methods, ready to copy:

```php
use Alfa\Component\Alfa\Administrator\Event\Api\ApiRequestEvent;
use Alfa\Component\Alfa\Administrator\Event\Api\ApiRoutesEvent;

public function onAlfaBeforeApiRoute(ApiRoutesEvent $event): void
{
    // Write the routes on $event->getRouter(), under $event->getPrefix().
}

public function onAlfaApiRequest(ApiRequestEvent $event): void
{
    // Read the request and answer it with one respond...() or refuse().
}
```

A plugin adds addresses of its own; it never replaces, removes or shadows a core address. No core route is registered
under `v1/alfa/ext/`. To change what a core address does, a plugin listens to the events of the services behind it
([Listening to the shop's changes](#listening-to-the-shops-changes)), which run the same whichever door the change
came through.

## A complete plugin: plg_alfa_example

The smallest plugin that uses everything on this page: one address, `GET v1/alfa/ext/example/hello`, behind its own
permission, answering plain JSON; one setting; one stock event heard. Copy it, rename `example` and `Acme`, and it
installs and answers.

```
plg_alfa_example/
    example.xml                              the manifest
    services/provider.php                    Joomla's service provider: builds the plugin
    src/Extension/Example.php                the plugin
    language/en-GB/plg_alfa_example.ini      the setting's and the permission's texts
    language/en-GB/plg_alfa_example.sys.ini  the name in the extension lists
    language/el-GR/...                       the same keys in Greek
```

### example.xml

The group is `alfa`; the element is the folder of `<folder plugin="example">`; `<namespace path="src">` maps `src/` to
the namespace, so `src/Extension/Example.php` is `Acme\Plugin\Alfa\Example\Extension\Example`. The `<config>` fields
are the plugin's settings, read as `$this->params`.

```xml
<?xml version="1.0" encoding="utf-8"?>
<extension type="plugin" group="alfa" method="upgrade">
    <name>plg_alfa_example</name>
    <author>Acme</author>
    <creationDate>2026-11</creationDate>
    <copyright>(C) 2026 Acme</copyright>
    <license>GNU General Public License version 3 or later</license>
    <version>1.0.1</version>
    <description>PLG_ALFA_EXAMPLE_XML_DESCRIPTION</description>
    <namespace path="src">Acme\Plugin\Alfa\Example</namespace>
    <files>
        <folder plugin="example">services</folder>
        <folder>src</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa_example.ini</language>
        <language tag="en-GB">en-GB/plg_alfa_example.sys.ini</language>
        <language tag="el-GR">el-GR/plg_alfa_example.ini</language>
        <language tag="el-GR">el-GR/plg_alfa_example.sys.ini</language>
    </languages>
    <config>
        <fields name="params">
            <fieldset name="basic">
                <field name="greeting" type="text" default="hello" required="true"
                       label="PLG_ALFA_EXAMPLE_GREETING" description="PLG_ALFA_EXAMPLE_GREETING_DESC"/>
            </fieldset>
        </fields>
    </config>
</extension>
```

### services/provider.php

Joomla calls it to build the plugin: the plugin's row (its saved settings) from `PluginHelper::getPlugin()`, and the
application. This is Joomla 6's form, the settings alone; a constructor given the dispatcher first is deprecated and
goes in Joomla 7.

```php
<?php

\defined('_JEXEC') or die;

use Acme\Plugin\Alfa\Example\Extension\Example;
use Joomla\CMS\Extension\PluginInterface;
use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\PluginHelper;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;

return new class () implements ServiceProviderInterface {
    public function register(Container $container): void
    {
        $container->set(PluginInterface::class, static function (Container $container): PluginInterface {
            $plugin = new Example((array) PluginHelper::getPlugin('alfa', 'example'));
            $plugin->setApplication(Factory::getApplication());

            return $plugin;
        });
    }
};
```

### src/Extension/Example.php

```php
<?php

namespace Acme\Plugin\Alfa\Example\Extension;

\defined('_JEXEC') or die;

use Alfa\Component\Alfa\Administrator\Event\Access\GetAccessActionsEvent;
use Alfa\Component\Alfa\Administrator\Event\Api\ApiRequestEvent;
use Alfa\Component\Alfa\Administrator\Event\Api\ApiRoutesEvent;
use Alfa\Component\Alfa\Administrator\Event\Inventory\InventoryAdjustedEvent;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Log\Log;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\SubscriberInterface;
use Joomla\Router\Route;

final class Example extends CMSPlugin implements SubscriberInterface
{
    protected $autoloadLanguage = true;

    /** @return array<string, string> */
    public static function getSubscribedEvents(): array
    {
        return ['onAlfaGetAccessActions' => 'onAlfaGetAccessActions', 'onInventoryAdjusted' => 'onInventoryAdjusted'];
    }

    public function onAlfaGetAccessActions(GetAccessActionsEvent $event): void
    {
        $event->action('alfa.example', 'alfa.example.hello', 'PLG_ALFA_EXAMPLE_ACCESS_HELLO', 'PLG_ALFA_EXAMPLE_ACCESS_HELLO_DESC');
    }

    public function onAlfaBeforeApiRoute(ApiRoutesEvent $event): void
    {
        $event->getRouter()->addRoute(new Route(['GET'], $event->getPrefix() . '/hello', 'example.hello', [], [
            'component' => 'com_alfa',
            'alfa_permission' => 'alfa.example.hello',
            'format' => ['application/json'],
        ]));
    }

    public function onAlfaApiRequest(ApiRequestEvent $event): void
    {
        // One route, so the task is always 'hello'.
        $event->respondJson([
            (string) $this->params->get('greeting', 'hello') => (string) ComponentHelper::getParams('com_alfa')->get('store_name', ''),
            'account' => $event->getIdentity()->username,
        ]);
    }

    public function onInventoryAdjusted(InventoryAdjustedEvent $event): void
    {
        Log::addLogger(['text_file' => 'plg_alfa_example.php'], Log::ALL, ['plg_alfa_example']);
        Log::add(sprintf(
            'Stock of item %d, combination %d, location %d changed by %s.',
            $event->argument('itemId'),
            $event->argument('combinationId'),
            $event->argument('locationId'),
            $event->argument('quantityDelta'),
        ), Log::INFO, 'plg_alfa_example');
    }
}
```

What each part does:

- **`$autoloadLanguage = true`** loads the plugin's language files when the plugin is booted, so the permission's
  title and description show in Options, Permissions. (`$this->loadLanguage()` inside the handler does the same.)
- **`onAlfaGetAccessActions`** (broadcast) declares the permission. The first argument of `action()` is the plugin's
  own id, `<group>.<element>` (`alfa.example`), the second the permission, `alfa.<element>.<word>`, then its title's
  and description's language keys. A Super User grants it in Alfa Commerce, Options, Permissions.
- **`onAlfaBeforeApiRoute`** (targeted) writes the route on the router the event carries, under `getPrefix()`
  (`v1/alfa/ext/example`). The controller `example.hello` gives the task `hello`.
- **`onAlfaApiRequest`** (targeted) answers it. The shop's name is Alfa Commerce, Options, General, Store name:
  `ComponentHelper::getParams('com_alfa')->get('store_name', '')`, empty while it is not set.
- **`onInventoryAdjusted`** (broadcast) is a stock adjustment, announced once it is committed. The stock events'
  names carry no `onAlfa` prefix.

### Calling it

Give an account the permission (see [The integration account](#the-integration-account)) and call it with its token,
as `X-Joomla-Token` or `Authorization: Bearer`:

```bash
curl -H "X-Joomla-Token: <the account's token>" https://shop.example/api/index.php/v1/alfa/ext/example/hello
```

```json
{"hello":"My shop","account":"example-connection"}
```

The route answers in its one format, `application/json`, so the request needs no `Accept` header. A JSON:API route
(the default format) answers `curl -H "Accept: application/vnd.api+json" ...` with a JSON:API document. Without the
token the answer is 401; with an account that lacks `alfa.example.hello`, 403.

## The rules of a route

The router a plugin writes on is its own for that call and starts empty. `createCRUDRoutes()`, `addRoutes()`,
`addRoute()`, `get()`, `post()`, `patch()`, `put()` and `delete()` work as on Joomla's router. Alfa Commerce adds a
route only when it keeps every rule; a route that breaks one is not added, the plugin's other routes are. Tools,
Security lists the refused ones with their rule, and listing them writes each to the log `com_alfa_api.php` (WARNING,
naming the plugin, the pattern and the rule); nothing is logged while a request is routed.

| Part | The rule |
|---|---|
| Owner | A plugin of the `alfa` group whose element is not a name of Alfa Commerce's own (below), so `alfa.<element>.<word>` is never a core permission. |
| Pattern | `v1/alfa/ext/<element>/`, then one to six segments, each lower-case `a` to `z`, `0` to `9` and `-`, or a variable `:name`. No empty segment, no `.` or `..`, no `*`. |
| Variables | Each has a rule: `\d+` (it arrives as a whole number) or `[A-Za-z0-9_-]{1,64}` (it arrives as text). One outer pair of parentheses is taken off, so `(\d+)`, as `createCRUDRoutes()` writes it, is taken. |
| Methods | GET, POST, PATCH, PUT and DELETE. |
| Controller | `<element>.<task>`: the task (`hello`, `displayList` and the others) is what `getTask()` gives the plugin. |
| `component` | Required: `com_alfa`. |
| `alfa_permission` | Required: `alfa.<element>.<word>`, a permission the plugin declares with `onAlfaGetAccessActions`. |
| `format` | Optional, a list of one media type: `application/vnd.api+json` (the default, a JSON:API answer), `application/json` (plain JSON in the plugin's own shape) or any other `type/subtype` (bytes of that type). |
| `alfa_max_body` | Optional: the largest body the route takes, from 1 to 8,388,608 bytes; 1,048,576 when not given. |
| `public` | Only `false`. Every route takes the Joomla API token. |
| Other keys | None. |
| Unique | One route a method and pattern. |

The names a plugin's element cannot take, Alfa Commerce's permission sections and screens: `cart`, `cartrule`, `cartrules`, `carts`, `categories`, `category`, `currencies`, `currency`, `data`, `discount`, `discounts`, `document`, `documents`, `documentseries`, `documenttype`, `documenttypes`, `formfield`, `formfieldgroup`, `formfieldgroups`, `formfields`, `inventorymovement`, `inventorymovements`, `item`, `itemdownload`, `itemdownloads`, `itemfield`, `itemfields`, `items`, `location`, `locations`, `manufacturer`, `manufacturers`, `notification`, `notifications`, `order`, `orders`, `orderstatus`, `orderstatuses`, `payment`, `payments`, `place`, `places`, `reservation`, `reservations`, `series`, `shipment`, `shipments`, `tax`, `taxes`, `tools`, `user`, `usergroup`, `usergroups`, `users`.

`createCRUDRoutes()` makes five routes at once (`displayList`, `displayItem`, `add`, `edit`, `delete`), each with the
permission given, so that permission must be declared like any other, and the plugin answers every one of the five
tasks (a read only set refuses the three writes with 405).

## Answering a request

What the plugin reads:

| Method | Gives |
|---|---|
| `getTask()` | The task of the route's `controller.task` |
| `getMethod()` | The HTTP method |
| `getVariables()` | The path's variables by name; a `\d+` one as a whole number |
| `getQuery()` | The query string, decoded |
| `getHeader($name)` | One request header, '' when it was not sent; the token's headers always answer '' |
| `getRawBody()` | The body as sent |
| `getJsonBody()` | The body decoded as JSON, null when it is not a JSON object or list |
| `getForm()` | The fields of a form-encoded body, without the keys Joomla's router writes beside them |
| `getIdentity()` | The account of the token, a `Joomla\CMS\User\User` |

How the plugin answers, exactly once:

| Method | For a route whose format is | Writes |
|---|---|---|
| `respondData($type, $attributes, $id, $meta, $status)` | `application/vnd.api+json` | One JSON:API resource |
| `respondList($type, $rows, $meta, $status)` | `application/vnd.api+json` | A JSON:API list; each row's `id` is its resource id |
| `respondJson($payload, $status)` | `application/json` | The plugin's JSON, `Content-Type: application/json; charset=utf-8` |
| `respondRaw($body, $status)` | Any other type | The bytes, with the route's media type |
| `refuse($status, $sentence)` | Any | 400, 403, 404, 405, 409, 422 or 429 with one sentence: a JSON:API error, `{"errors":[{"code":422,"title":"..."}]}` in plain JSON, or the sentence as text |
| `header($name, $value)` | Any | `Location`, `Retry-After`, `ETag`, `Cache-Control` or `Content-Disposition` |

The respond methods take 200, 201 or 202. A respond method that does not fit the route's format, a second answer or no
answer at all is the plugin's mistake: the caller gets 500 and the log says why.

Before the plugin acts, it asks the core permission of what it does, with the one check Alfa Commerce uses:

```php
use Alfa\Component\Alfa\Administrator\Helper\AlfaHelper;

if (!AlfaHelper::can(section: 'orders', action: 'create', user: $event->getIdentity())) {
    $event->refuse(403, 'The account may not create orders.');

    return;
}
```

Taking a core permission away then stops that act through every door at once, the plugin's included.

## Listening to the shop's changes

The shop announces its changes to every plugin of the `alfa` group once they are committed (never after a rollback).
A plugin names each in `getSubscribedEvents()`. The ones an integration usually needs:

| Event | Class | What it carries |
|---|---|---|
| `onInventoryAdjusted` | `InventoryAdjustedEvent` | `argument('itemId')`, `argument('combinationId')`, `argument('locationId')`, `argument('quantityDelta')`, `argument('sourceType')`, `argument('sourceId')` |
| `onInventoryReserved` | `InventoryReservedEvent` | `argument('lines')`: each line's `item_id` and `combination_id`; `argument('sourceType')`, `argument('sourceId')` |
| `onInventoryCommitted` | `InventoryCommittedEvent` | `argument('request')`, a `CommitmentRequest` whose `lines` name `item_id` and `combination_id` |
| `onInventoryReleased` | `InventoryReleasedEvent` | `argument('sourceType')`, `argument('sourceId')` (an order's lines are read from the order) |
| `onInventoryRestored` | `InventoryRestoredEvent` | `movements()`: each `itemId`, `combinationId`, `locationId`, `quantity`; `isReversal()` |
| `onAlfaPricesChanged` | `PricesChangedEvent` | `itemIds()`, `cause()` |
| `onOrderStatusChange` | `OrderStatusChangeEvent` | `getOrder()->id()`, `getPreviousStatusId()`, `getNewStatusId()` |
| `onAlfaOrderPlaced` | `OrderPlacedEvent` | `getOrderId()`, `getOrder()` |

The classes are under `Alfa\Component\Alfa\Administrator\Event\` (`Inventory\`, `Catalog\`, `Orders\`). Every stock
event and its moment are on [Stock events](../events/stock-events.md); every event of the shop is in the
[Event index](../events/event-index.md). A listener never writes stock itself: it asks the inventory service, or owes
background work (below).

## Failures and their answers

| Case | Answer | Said by |
|---|---|---|
| The shop in maintenance (Clear everything) | 503 with the maintenance sentence; no plugin is loaded | Alfa Commerce |
| No installed, enabled plugin of that element, or no route that matches | 404 | Joomla |
| The plugin has no `onAlfaBeforeApiRoute()` method, so it adds no routes | 404 | Joomla |
| The plugin has no `onAlfaApiRequest()` method | 404, and a warning naming the route in `com_alfa_api.php` | Alfa Commerce |
| No `Accept` header | Answered in the route's one format. A core address still answers 406: send `Accept: application/vnd.api+json` or `*/*` | Alfa Commerce |
| No token, a wrong token, an account outside the token plugin's groups or without API Login | 401, in every format | Joomla |
| The account lacks the route's permission | 403 | Alfa Commerce |
| A body larger than the route takes | 413 | Alfa Commerce |
| The plugin is enabled but cannot be loaded, or throws while it declares its routes | 503 with `Retry-After: 600`, and one notification for staff | Alfa Commerce |
| The plugin's handler throws | 500 "The extension could not answer; the server's log says why." The log `com_alfa_api.php` names the plugin, the route, the exception's class and message; the answer never does | Alfa Commerce |
| The plugin refuses | Its status and sentence | The plugin |

On a plain JSON route every one of these answers has the same body, `{"errors":[{"code":403,"title":"..."}]}`, so a
caller reads one shape; on a JSON:API route each is a JSON:API error.

## The integration account

An integrator calls with the Joomla API token of an account of its own, never a Super User:

1. A user group of its own (for example "Example connection", under Public), and one account in it alone.
2. Global Configuration, Permissions, that group: **API Login** allowed. **Administrator Login** too, only so the
   account can sign in to read its own token; nothing else.
3. The plugin **User - Joomla API Token**: **Allowed User Groups** includes the group. Its default is Super Users only.
4. Alfa Commerce, Options, Permissions, the group: the route's permission and the core permissions of what the
   integrator does (for example Orders: Create), nothing else.
5. The account signs in once, enables its token on its profile's **Joomla API Token** tab and copies it.

Tools, Security lists every address of the REST API in one table, the plugins' beside core's: who adds it, the method,
the full address, the permission and its title, the groups granted it, whether each group has API Login and is in the
token groups, and the accounts in it with an enabled token, a Super User marked. A plugin that cannot be loaded and the
routes refused with their rule are listed under it. See
[The REST API's addresses](../architecture/integrity-and-security.md#the-rest-apis-addresses).

## Background work of a plugin

A plugin that must tell another system of a change, or do work outside the request, owes a job to the task runner:

```php
use Alfa\Component\Alfa\Administrator\Plugin\PluginId;
use Alfa\Component\Alfa\Administrator\Service\Task\Job\ExtensionJob;

ExtensionJob::enqueue(PluginId::of('alfa.example'), 'stock:600:0', ['item' => 600, 'combination' => 0]);
```

`PluginId::of()` takes the same `<group>.<element>` id as `action()`. There is one job a plugin and key: a request
with the same key while the job waits joins it, and one made while it runs makes it run again, so the job reads the
latest values when it runs. The runner hands the job back to the plugin with the targeted `onAlfaExtensionJob`
(`ExtensionJobEvent`: `getJobId()`, `getKey()`, `getData()`), outside its own transaction, so the handler may call
another system. The job runs as the shop, not as the visitor whose request ran the runner: the plugin is loaded for it
whatever its Access, as long as it is installed and enabled. A handler that throws is retried on the runner's backoff; after the last retry the job waits for staff
in Tools, Tasks, where every job is listed.
