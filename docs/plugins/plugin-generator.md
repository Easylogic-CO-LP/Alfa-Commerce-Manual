---
sidebar_position: 2
title: Plugin generator
description: "Fill in a name and your details and download a correctly structured Alfa Commerce 2.2.0 plugin, made from this manual's tested examples."
---

# Plugin generator

<AlfaVersion verified="2.2.0" />

Choose a plugin type, type a name and your details, and download a ZIP that Joomla's installer accepts. The form
runs in your browser. Nothing you type is sent anywhere.

<PluginGenerator />

## What you get

The generator writes no code of its own. Each plugin type has one complete example in this manual, and each
example was installed and used on an Alfa Commerce 2.2.0 test shop. The generator takes that example and changes
only names and details:

| What changes | For example |
|---|---|
| The element, and with it the folder and file names | `offline.xml` becomes `mygateway.xml` |
| The class name | `Offline` becomes `Mygateway` |
| The vendor part of the namespace | `Acme\Plugin\AlfaPayments\Offline` becomes `YourVendor\Plugin\AlfaPayments\Mygateway` |
| The language keys | `PLG_ALFA_PAYMENTS_OFFLINE_...` becomes `PLG_ALFA_PAYMENTS_MYGATEWAY_...` |
| The manifest | Name, author, e-mail, URL, copyright, licence, version, description, date |

Two things are added: a comment at the top of the plugin's class and a `README.md`. Both say what the example
code does, what it is not, and what is yours to write, with the manual pages to read.

Everything else is the example, line for line. So the plugin you download works at once: install it, enable it,
and it does what its example does.

| Plugin type | The example it is made from | What it does when installed |
|---|---|---|
| Payment plugin | [A complete payment plugin](./payment-plugin-example.md) | Records a pending payment at checkout; staff press "Mark as paid" |
| Shipping plugin | [A complete shipping plugin](./shipment-plugin-example.md) | Charges the price typed on the method and records a parcel |
| Item field plugin | [A complete item field plugin](./item-field-plugin-example.md) | Draws a field's values as radio buttons on the item page |
| Form field plugin | [Form field plugins](./form-field-plugins.md#a-complete-minimal-plugin) | Adds a one line text field to registration and checkout |
| Media plugin | [Media plugins](./media-plugins.md#a-complete-media-plugin) | Stores uploaded pictures as WebP and refuses very large ones |
| Feature plugin (admin screens) | [A complete feature plugin](./admin-screen-example.md) | Adds a column to the Manufacturers list and refuses some deletes |
| Feature plugin (admin panel) | [A complete admin panel](./admin-panel-example.md) | Adds its own screen with a list, a form and a table |
| System plugin | [System, console and task plugins](./system-console-task-plugins.md#a-complete-system-plugin) | Logs completed orders and adds a button to Tools |

## What it is not

A generated plugin is a starter. It has the right structure and a working demonstration, and it is not an
integration with anything:

- The payment starter talks to no payment provider. It asks for no money, captures none and refunds none.
- The shipping starter talks to no carrier.
- The texts of the demonstration (labels, messages) are the example's. Change them in the language files.

Read the comment at the top of the plugin's class first. It lists what you still have to write.

## Installing the ZIP

1. In the Joomla administrator go to **System**, **Install**, **Extensions** and upload the ZIP.
2. Joomla installs a new plugin disabled. Enable it under **System**, **Plugins**.
3. A payment, shipping, item field or form field plugin does nothing until a method or a field of its type
   exists. Create one under Alfa Commerce's **Configuration** menu.

## What can go wrong

| What you see | Why |
|---|---|
| The form does not offer a download | A field is not acceptable. The reason is printed under the form. |
| The element is refused | It must be lower case letters and digits, must not be a word of PHP such as `list` or `new`, and must not be the element of a plugin Alfa Commerce ships. |
| Joomla says the extension is already installed and updates it | A plugin with the same group and element exists on the site. Choose another element. |
| A name of the example is still in a text | Texts of the demonstration are not changed. Only names are. |

## How it was checked

One plugin of every type was generated with a new name and a new vendor, installed on a fresh Alfa Commerce 2.2.0
test shop (Joomla 6.1.4, PHP 8.3), enabled and used: an order was placed with the generated payment, shipping,
item field and form field plugins, the payment was marked as paid, a picture was uploaded through the media
plugin, and the feature and system plugins were used on their screens.

## Not offered yet

- A search engine plugin. The manual's example for it is a skeleton that finds nothing.
- Console and task plugins. Alfa Commerce 2.2.0 has no extension point for either.
