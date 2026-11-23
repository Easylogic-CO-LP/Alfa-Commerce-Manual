---
sidebar_position: 1
title: Plugin overview
description: What a plugin can do in Alfa Commerce, which plugin types exist, how to choose one, and the rules every plugin shares.
---

# Plugin overview

<AlfaVersion verified="2.3.0" />

Alfa Commerce is extended with Joomla plugins. A plugin adds to the shop without changing Alfa's own files, so an
update of Alfa Commerce does not undo it.

This page is the way in to the plugin pages. It lists the plugin types, helps you choose one, and collects the rules
that hold for all of them. The words used here are explained in the [Glossary](../reference/glossary.md).

## What it does

A plugin can:

- take payments, and handle a payment provider's answers and refunds;
- price a delivery, book it with a carrier and follow the parcel;
- add a kind of field to the customer's details (a phone number, a country);
- add a kind of field to items (a size, a colour) that shoppers see or choose;
- check, convert and resize the images staff add;
- answer the shop's searches from a search engine of its own;
- add columns, buttons, menu entries, dashboard cards, permissions, tools and whole screens to the administrator;
- add a charge to the cart, or refuse an order before it is placed;
- react when something happens in the shop: an order changed status, stock moved, prices changed;
- add commands to Joomla's command line.

Alfa tells plugins what is happening through **events**. How an event gets to a plugin is the same for every type
and is explained once, in [How events reach a plugin](../events/how-events-reach-a-plugin.md). Read that page before
any page listed below. The [Event index](../events/event-index.md) lists every event, how it is delivered and the
page that explains it.

## The plugin types

A plugin's **group** is the folder it lives in under `plugins/`. It says what kind of plugin it is. A **base class**
is the class a plugin of that group extends; the base classes are in `administrator/src/Plugin`.

| Type | Group | Base class | Ships with Alfa Commerce | Page |
|---|---|---|---|---|
| Payment | `alfa-payments` | `PaymentsPlugin` | `standard` | [Payment plugins](./payment-plugins.md) |
| Shipping | `alfa-shipments` | `ShipmentsPlugin` | `standard` | [Shipping plugins](./shipment-plugins.md) |
| Form fields | `alfa-form-fields` | `FormFieldsPlugin` | `tel`, `text`, `textarea`, `choice`, `country` | [Form field plugins](./form-field-plugins.md) |
| Item fields | `alfa-item-fields` | `ItemFieldsPlugin` | `choice` | [Item field plugins](./item-field-plugins.md) |
| Media | `alfa-media` | None. Joomla's `CMSPlugin`. | Nothing | [Media plugins](./media-plugins.md) |
| Search engines | `alfa-search` | `SearchEnginePlugin` | Nothing, on purpose | [Search engine plugins](./search-plugins.md) |
| Feature plugins | `alfa` | None. Joomla's `CMSPlugin`. | Nothing | [Admin screens](./admin-screen-plugins.md) and [Admin panels](./admin-panels.md) |
| Stock allocation | `alfa-inventory` | None. Joomla's `CMSPlugin`. | Nothing | [Stock events](../events/stock-events.md#oncollectstockallocationproviders) |
| System, console and task (Joomla's own plugin types) | `system`, `console`, `task` | None. Joomla's `CMSPlugin`. | `system`: `alfasync`. `console`: `alfa`. `task`: nothing. | [System, console and task plugins](./system-console-task-plugins.md) |

For the five groups with a base class, Alfa checks that the plugin really extends it. A plugin in `alfa-payments`
that does not extend `PaymentsPlugin` is refused.

Alfa Commerce also ships one `webservices` plugin, which registers the addresses of the REST API. It is not a type
you write.

## Plugin and method

Payment and shipping plugins have one idea the other types do not have.

- The **plugin** is the code. It is installed once.
- A **method** is a record that staff create in the administrator and that a shopper picks at checkout: "Bank
  transfer", "Courier". Each method belongs to one plugin, chosen as the method's Type, and carries that plugin's
  settings.

One plugin can serve several methods. A carrier plugin could serve "Courier, next day" and "Courier, economy", each
a method with its own name, price settings and limits, both handled by the same code.

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    actor Shopper
    participant Alfa as Alfa Commerce
    participant P as Your plugin
    Staff->>Alfa: Creates a method and chooses your plugin as its Type
    Alfa->>Alfa: Shows your plugin's settings form and stores the method with those settings
    Shopper->>Alfa: Picks that method at checkout
    Alfa->>P: Addresses the checkout events to your plugin, with that method's settings
    P->>Alfa: Answers
    Alfa->>Alfa: Saves the order, with the method and your plugin's name on it
    Note over Alfa: The save is final here
    Alfa->>P: Addresses later events about this order to the plugin written on the order
```

What this asks of you:

- The settings a method carries come from the file `params/params.xml` in your plugin's folder. Alfa loads that form
  into the method's edit screen when staff choose your plugin as the Type.
- Your plugin is always told which method it is working for. Never assume there is only one.
- An order keeps the name of the plugin that took its payment or shipment (the **plugin of record**). Alfa keeps
  using that plugin for the order, even if staff later delete the method or change its settings.

Form field and item field plugins work in a similar way: staff create a field, choose your plugin as its type, and
the field carries your plugin's settings. Their pages explain it.

## Which type do I need

| You want to | Write a |
|---|---|
| Take money through a gateway or a provider | Payment plugin |
| Charge for delivery, book a parcel, show tracking | Shipping plugin |
| Offer a new kind of field in the customer's details at registration and checkout | Form field plugin |
| Offer a new kind of item property, with its own look on the item page | Item field plugin |
| Convert or compress item images | Media plugin |
| Answer searches from your own index | Search engine plugin |
| Add a column, a button, a menu entry, a dashboard card, a tool or a screen to the administrator | Feature plugin |
| Add a fee or a discount line to the cart, or stop an order that breaks a rule of yours | Feature plugin |
| React to orders, stock or prices, for example to pass them to another system | Feature plugin |
| Do any of the reacting above from a plugin that must also run outside the shop's pages | System plugin |
| Add a command to Joomla's command line | Console plugin |
| Run your own work on a timetable | Task plugin, with Joomla's Scheduled Tasks |

System, console and task plugins are Joomla's own plugin types, not Alfa Commerce's. Joomla has more of them
(content, user, authentication, fields and others): choose the one that fits your purpose from
[Joomla's documentation on plugins](https://manual.joomla.org/docs/building-extensions/plugins/).

When in doubt between a feature plugin and a system plugin, choose the feature plugin. Alfa loads the `alfa` group
whenever the shop runs and only then, and some events go only to that group.

## The rules every plugin shares

Each rule is explained in full on [How events reach a plugin](../events/how-events-reach-a-plugin.md). In short:

### Two ways an event reaches a plugin

An event is either **announced to everyone** (broadcast) or **addressed to one plugin** (targeted). You list the
first kind in `getSubscribedEvents()`. The second kind is handled by a public method with the event's name, which
Alfa calls on the one plugin it addresses; nothing lists it. A targeted event never goes in `getSubscribedEvents()`,
and a method that is not public, or does not have the event's name, is never called. See
[Announced to everyone](../events/how-events-reach-a-plugin.md#announced-to-everyone-broadcast) and
[Addressed to one plugin](../events/how-events-reach-a-plugin.md#addressed-to-one-plugin-targeted).

### Naming yourself

Whenever your plugin adds something to Alfa (a column, a card, a tool, a cart charge, a search engine), it names
itself first as **group.element**, for example `alfa-payments.standard`. It is a label for logs and messages, not a permission.
A contribution without it is refused. See
[Naming your plugin](../events/how-events-reach-a-plugin.md#naming-your-plugin).

### The plugin of record

Alfa writes on each order, payment and shipment which plugin handled it, and keeps calling that plugin. If that
plugin is disabled or removed, Alfa refuses the request and tells staff. It never asks another plugin instead. See
[What can go wrong](../events/how-events-reach-a-plugin.md#what-can-go-wrong).

### The save is final

A change is stored as one unit. The moment it is stored for good is the **commit**; this manual's diagrams mark it
"The save is final here". In a "before" event nothing is saved yet and you may refuse. In an "after" event the
change is saved and cannot be undone by you. Write "after" listeners so that running them twice does no harm. See
[Where the save becomes final](../events/how-events-reach-a-plugin.md#where-the-save-becomes-final).

### Each extension owns its language

Every extension carries its own texts in its own language files. Alfa's files hold only Alfa's own texts, and your
plugin's texts are in your plugin's files. All of these files are in Joomla's language folders: `administrator/language/` followed by the language tag for the component and for plugins, `language/`
followed by the tag for the storefront and for modules. Joomla's installer puts them there from your package.

Alfa does not load your plugin's language when your plugin adds something to a screen. Your plugin loads
its own. The Alfa base classes do that for you (`$autoloadLanguage`); a plugin that extends `CMSPlugin` directly
sets `protected $autoloadLanguage = true;` itself.

Alfa Commerce ships in English only. Other languages are separate language packs.

## The manifest

Every shipped plugin has a manifest of the same shape. This is the Standard payment plugin's
(`plugins/alfa-payments/standard/standard.xml`), shortened by its empty `config` block and one comment:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<extension type="plugin" group="alfa-payments" method="upgrade">
	<name>PLG_ALFA_PAYMENTS_STANDARD</name>
	<copyright>(C) 2024-2026 Easylogic CO LP / Agamemnon Fakas. All rights reserved.</copyright>
	<license>GNU General Public License version 3 or later; see LICENSE</license>
	<author>Agamemnon Fakas</author>
	<creationDate>2025-03-04</creationDate>
	<authorEmail>info@easylogic.gr</authorEmail>
	<authorUrl>http://easylogic.gr</authorUrl>
	<version>2.2.1</version>
	<alfacore min="2.2" max="2.2"/>
	<description>PLG_ALFA_PAYMENTS_STANDARD_XML_DESCRIPTION</description>
	<namespace path="src">Alfa\Plugin\AlfaPayments\Standard</namespace>
	<files>
		<folder plugin="standard">services</folder>
		<folder>src</folder>
		<folder>tmpl</folder>
		<folder>params</folder>
    </files>
    <languages folder="language">
        <language tag="en-GB">en-GB/plg_alfa-payments_standard.ini</language>
        <language tag="en-GB">en-GB/plg_alfa-payments_standard.sys.ini</language>
    </languages>
	<media destination="plg_alfa-payments_standard" folder="media">
		<folder>js</folder>
		<filename>joomla.asset.json</filename>
	</media>
</extension>
```

| Line | The convention |
|---|---|
| `extension` | `type="plugin"`, the `group`, and `method="upgrade"` so that installing a newer package updates the plugin. |
| `name` | A language key built from the group and the element: `PLG_ALFA_PAYMENTS_STANDARD`. The key is in both language files, so Joomla shows the plugin's real name. The shipped `system`, `console` and `webservices` plugins write it in lower case (`plg_system_alfasync`). |
| `version` | The shipped plugins carry Alfa Commerce's own version. Your plugin carries its own. |
| `alfacore` | The lines of Alfa Commerce the plugin is built for. See [The Alfa Commerce lines your extension is built for](#the-alfa-commerce-lines-your-extension-is-built-for). |
| `namespace` | `path="src"`, then your vendor name, `Plugin`, the group in capitals without the hyphen, and the element: `Alfa\Plugin\AlfaPayments\Standard`. Use your own vendor name in place of `Alfa`. |
| `files` | The `services` folder carries the attribute `plugin` with the element. It holds `provider.php`, which creates the plugin. `src` holds the class, `tmpl` the layouts, `params` the settings form of a method or a field. |
| `languages` | Two files per language: the plugin's texts and its `.sys.ini` (the name and description Joomla shows in its lists). Their names are `plg_`, the group, an underscore, the element. |
| `media` | Only when the plugin has scripts or styles. The destination is named like the language files. Each style and script is shipped as its source, its `.min` twin and the `.min.gz`, and registered by its `.min` name; Joomla loads the source under Debug System by itself (see [Installation](../getting-started/installation#styles-and-scripts-three-forms-served-compressed)). The core repository's `php build/media-min/build.php --root=<your plugin's folder>` makes the two forms from your sources, reading your manifest's `media` folder. |

### How the shipped plugins are installed and enabled

The shipped plugins are inside the Alfa Commerce package. The component's manifest (`alfa.xml`) lists them, and the
component's installer script (`script.php`) installs or updates each one through Joomla's installer and then
**enables** it when the site did not have it before. On an update each one keeps the state it had, so a plugin that
staff disabled stays disabled, and the update page names it.

A plugin of your own is a package of its own. Staff install it through Joomla's Extensions: Install, and Joomla
leaves a new plugin disabled until staff enable it under Extensions: Plugins. A payment or shipping plugin must also
keep its Access on Public, or providers and carriers cannot call it.

## The installer gate

### What it does

`AlfaInstallerGate` (`administrator/src/Service/Setup/AlfaInstallerGate.php`) is one small class that every Alfa
extension uses when it is installed. It does two things:

- It refuses to install or update an extension on a site whose Alfa Commerce is missing, or of a line outside the
  lines your extension's manifest says it is built for, and an extension whose manifest states those lines in a way
  it cannot read, with one wording for every extension. See
  [The Alfa Commerce lines your extension is built for](#the-alfa-commerce-lines-your-extension-is-built-for).
- It provides the warning shown when an Alfa extension is uninstalled: the extension's data stays.

It never refuses anything because the shop is being cleared or maintained, and it never refuses an uninstall.

### When it is used

In your extension's installer script, in `preflight()`, which Joomla calls before it copies any file.

### What you must provide

Declare the lines of Alfa Commerce your extension is built for in its manifest, and ask the gate's `rangeRefusal()`
in `preflight()`: both are shown in
[The Alfa Commerce lines your extension is built for](#the-alfa-commerce-lines-your-extension-is-built-for). The
messages are plain English on purpose: at this moment of an installation no language file of your extension is
loaded yet.

### What happens next

When an Alfa plugin or package is uninstalled, Alfa Commerce itself tells staff that its data stays and that
complete cleanup is done before uninstalling, under Tools > Extensions > Clear Data. Your extension does not print
that warning. Alfa treats as an Alfa extension a plugin whose group name starts with `alfa`, a plugin whose
namespace starts with `Alfa\`, a module whose name starts with `mod_alfa`, and a package whose name starts with
`pkg_alfa`.

### What can go wrong

| What you see | The cause |
|---|---|
| The plugin installs on a site with an Alfa Commerce of another line, then fails | The installer script has no `preflight()` that asks the gate's `rangeRefusal()`. |
| The installation stops with "requires Alfa Commerce" | The site has no Alfa Commerce. Install Alfa Commerce first. |
| The uninstall warning is not shown when the extension is uninstalled through Joomla | The System - Alfa Commerce Sync plugin is disabled. It is the one that says it. |

## The Alfa Commerce lines your extension is built for

### What it does

An Alfa extension states once, in its manifest beside its version, the lines of Alfa Commerce it is built for. A
line is a major and a minor version: `2.3` covers every 2.3 release.

```xml
<version>1.4.0</version>
<alfacore min="2.3" max="2.3"/>
```

`min` is required. `max` is optional for the reader, and without it every line from `min` on is included; the
policy below asks for both. The element is a child of the manifest's root element. One class reads it,
`AlfaCoreRange` (`administrator/src/Service/Setup/AlfaCoreRange.php`), and two places use what it reads:

- Your installer script asks the gate's `rangeRefusal()`, which refuses an install or update outside the range.
- After Alfa Commerce itself is installed or updated, it reads the element of every installed Alfa plugin and
  module and names those that are not known to work with it.

Nothing is ever inferred from your extension's own version number.

### When it is used

At your extension's own install, update or discover install, in `preflight()`. And after every installation and
update of Alfa Commerce, which reads the manifest file of each installed Alfa plugin and module from its folder.

### What you must provide

1. The element in the manifest of every plugin and every module your extension installs. Alfa Commerce's check after
   its own update reads those manifests; a package's own manifest is not read there. A package carries the same
   element in its own manifest too, because the gate reads the manifest its installer is given.
2. A `preflight()` that asks the gate's `rangeRefusal()` with the manifest its installer is given. Replace
   `Example plugin` with your extension's name.

```php
public function preflight($type, $parent): bool
{
    $gate = \Alfa\Component\Alfa\Administrator\Service\Setup\AlfaInstallerGate::class;
    $file = JPATH_ROOT . '/administrator/components/com_alfa/src/Service/Setup/AlfaInstallerGate.php';

    if (!class_exists($gate) && is_file($file)) {
        require_once $file;
    }

    if ($type === 'uninstall') {
        return true;
    }

    if (!class_exists($gate)) {
        // No Alfa Commerce installed.
        \Joomla\CMS\Factory::getApplication()->enqueueMessage('Example plugin requires Alfa Commerce. Install Alfa Commerce'
            . ' first, then install Example plugin again. Nothing was changed.', 'error');

        return false;
    }

    $refusal = $gate::rangeRefusal(name: 'Example plugin', route: (string) $type, manifest: $parent->getManifest());

    if ($refusal !== null) {
        \Joomla\CMS\Factory::getApplication()->enqueueMessage($refusal, 'error');

        return false;
    }

    return true;
}
```

### What happens next

At your extension's installation:

| The site | What `rangeRefusal()` returns | What staff see |
|---|---|---|
| Has Alfa Commerce of a line inside your range | `null` | The installation goes on. |
| Has Alfa Commerce of a line outside your range | A sentence that names your extension, your range and the installed Alfa Commerce, asks for the build of your extension made for the installed line, or for its developer to make one, and ends "Nothing was changed." | The installation stops. Nothing was changed. |
| Has no Alfa Commerce | A sentence that your extension requires Alfa Commerce of your range's `min` line or later and none is installed: install or update Alfa Commerce first, nothing was changed | The installation stops. |
| Reads an element it cannot use: `min` missing or not a line, `max` not a line, or `max` before `min` | "Example plugin cannot be installed:", what is wrong with the element, "Its developer must correct its manifest. Nothing was changed." | The installation stops. |
| Reads no element at all | `null`. Nothing is refused and nothing is inferred. | The installation goes on. |
| Is uninstalling your extension | `null` | The uninstall goes on. |

After Alfa Commerce is installed or updated, every installed Alfa plugin and module gets one of three verdicts:

| What its manifest says | The verdict | What staff see |
|---|---|---|
| A range that includes the installed line | Nothing to say | **Built for this version** on Tools > Extensions |
| A range that excludes it | "needs a compatible build" | Named in one notification for administrators, whose link opens **Tools**, **Extensions**, where the extension shows **Needs a compatible build** and the lines it is built for, and in one line of the maintenance log (`com_alfa_maintenance.php`) |
| No range, or one that cannot be read | "compatibility not stated" | The same, with **Compatibility not stated**, and the maintenance log says why |

The extension keeps running in every case: Alfa Commerce's own update is never refused because of an extension.
The notification is raised again, unread, when an extension is newly named or Alfa Commerce moves to a new line,
brought up to date when one named is updated or uninstalled, and withdrawn when no extension is left to name. Once
dismissed, it stays dismissed until something new is named.

Which extensions are judged: the rule that Options > About and **Tools**, **Extensions** already use. A plugin of a
group whose name starts with `alfa`, a plugin whose namespace starts with `Alfa\`, and a module whose name starts
with `mod_alfa`. An extension of another vendor named that way is judged too. A package is not judged itself: each
of its plugins and modules is. The extensions that ship inside the Alfa Commerce package are never judged.

### What can go wrong

| What you see | The cause |
|---|---|
| After an update of Alfa Commerce your extension is named "compatibility not stated" | Its manifest has no `alfacore` element, or one that cannot be read. Add a valid element to the manifest of each of its plugins and modules. |
| After an update of Alfa Commerce your extension is named "needs a compatible build" | Its range excludes the installed line. Test it on that line and release it with a raised `max`. |
| Your package installs on a site outside its range | The package's own manifest has no element, or its `preflight()` does not ask `rangeRefusal()`. |
| The installation of your extension stops with "cannot be installed" | The element in the manifest the installer was given cannot be read. The message names the values written. |

### The compatibility-range policy

This is the policy every Alfa extension follows:

1. Every Alfa extension's manifest declares `<alfacore min max>` with both values. `max` names the last line the
   extension was tested on: a line such as 2.3, never a patch release.
2. Every extension that installs on its own (a premium or a third-party extension) enforces the range in its own
   installer's `preflight()` through `AlfaInstallerGate::rangeRefusal()`, as shown above. Install, update and
   discover install are refused outside the range with the gate's plain message. Uninstall is never refused. An
   installation from the command line runs the same `preflight()`.
3. The plugins and modules bundled with Alfa Commerce declare the range and need no gate call. The core package
   installs them itself, so they cannot mismatch the core they arrive with.
4. Updating Alfa Commerce is never blocked by an extension. After an install or update, Alfa Commerce names every
   installed Alfa extension outside its range or without one (a notification, which opens Tools > Extensions, and the
   maintenance log) and keeps running it.
5. An element that cannot be read is refused by the extension's own installer and named by Alfa Commerce's notice.
   A missing element is "compatibility not stated": never refused, and nothing is inferred.
6. A new line of Alfa Commerce: each extension is tested on it and released again with a raised `max` (a rebuild
   that changes only the manifest, once tested). Until then it runs on the new line with the notice, and only its
   own install or update is refused.
7. A package of several extensions carries the element in the package's manifest, which its installer hands to the
   gate, and in each plugin and module manifest it contains, which Alfa Commerce's notice reads, with the same
   values.

## Not documented yet

- Packaging several plugins as one Joomla package (`pkg_alfa` followed by a name).
- A full installer script file around the `preflight()` shown above.
