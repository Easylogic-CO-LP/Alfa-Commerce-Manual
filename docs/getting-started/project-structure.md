---
sidebar_position: 3
title: Project Structure
description: How the Alfa Commerce repository is laid out, with its namespaces and the files worth knowing.
---

# Project Structure

<AlfaVersion verified="2.2.0" />

How the Alfa Commerce repository is organised. Read it before contributing or writing an extension.

## Directory overview

```
Alfa-Commerce/
├── administrator/              # The administrator side, and most of the shop's logic
│   ├── src/
│   │   ├── Extension/          # Component bootstrap (AlfaComponent.php)
│   │   ├── Controller/         # Administrator controllers
│   │   ├── Model/              # Administrator models
│   │   ├── View/               # Administrator views
│   │   ├── Table/              # Database table classes
│   │   ├── Field/  Rule/  Filter/   # Form field types, validation rules, input filters
│   │   ├── Service/            # The shop's services (orders, documents, stock, tasks, ...)
│   │   ├── Helper/             # Smaller shared helpers
│   │   ├── Event/              # Event classes, in one folder per area
│   │   ├── Plugin/             # Base classes for plugins, and AlfaPluginHelper
│   │   ├── Panel/  Card/  Setup/  Toolbar/  Menu/   # Screens plugins can add to
│   │   ├── Dispatcher/         # Request dispatcher
│   │   └── Provider/           # Interfaces a plugin implements to provide document types or stock rules
│   ├── forms/                  # XML form definitions
│   ├── tmpl/                   # Administrator templates
│   ├── layouts/                # Reusable layouts
│   ├── sql/
│   │   ├── install.mysql.utf8.sql   # The complete schema
│   │   └── updates/mysql/           # One file per release since 2.0.0 (2.0.0.sql ... 2.2.0.sql)
│   ├── tours/                  # Guided tours (JSON)
│   ├── languages/en-GB/        # com_alfa.ini, com_alfa.sys.ini, com_alfa.tours.ini
│   ├── services/provider.php   # Registers the component with Joomla
│   ├── menu.xml                # The administrator menu
│   ├── config.xml              # The Options form
│   └── access.xml              # Permissions
│
├── site/                       # The storefront
│   ├── src/
│   │   ├── Controller/  Model/  View/
│   │   ├── Service/            # Cart, CartRules, Checkout, Pricing, Shipping, Order, Place, ...
│   │   ├── Helper/  Field/  Pagination/  Dispatcher/
│   ├── forms/  tmpl/  layouts/
│   └── languages/en-GB/        # com_alfa.ini
│
├── api/                        # The REST API
│   └── src/                    # Controller/  Model/  View/  Dispatcher/
│
├── plugins/                    # Only what ships with core
│   ├── alfa-payments/standard/      # The reference payment plugin
│   ├── alfa-shipments/standard/     # The reference shipping plugin
│   ├── alfa-form-fields/            # text, textarea, tel, choice, country
│   ├── alfa-item-fields/choice/     # The reference item field
│   ├── webservices/alfa/            # Registers the REST API's routes
│   ├── console/alfa/                # Console commands (alfa:tasks:run, alfa:tasks:prune, alfa:inventory:audit)
│   └── system/alfasync/             # Keeps Alfa in step with Joomla (users, languages, tour texts)
│
├── modules/
│   ├── mod_alfa_cart/          # Cart
│   ├── mod_alfa_search/        # Search
│   ├── mod_alfa_filters/       # Filters
│   ├── mod_alfa_items/         # Items
│   └── mod_easy_articles/      # Joomla articles
│
├── libraries/                  # lib_libphonenumber, lib_giggsey_locale
│
├── media/                      # Installed as media/com_alfa
│   ├── css/  js/               # Each with admin/, site/ and libraries/
│   ├── images/
│   └── joomla.asset.json       # Joomla's asset registry
│
├── scripts/                    # Tools for the automated checks
├── alfa.xml                    # The component's manifest
├── script.php                  # Install, update and uninstall script
├── changelog.xml               # The public changelog
├── .php-cs-fixer.php           # Code style configuration
├── phpstan.neon                # Static analysis configuration (with phpstan-baseline.neon)
├── CONTRIBUTING.md  README.md  SECURITY.md  CODE_OF_CONDUCT.md  LICENSE
└── .github/workflows/          # code-quality.yml, security-scan.yml, claude-pr-review.yml
```

`alfa.xml` is a component manifest, not a Joomla package manifest. It lists the plugins, modules and libraries, and
`script.php` installs them.

There is no uninstall SQL file. Uninstalling keeps the shop's tables and data; see
[Installation](./installation.md#uninstalling).

## Namespaces

Alfa Commerce follows PSR-4 autoloading with Joomla's namespace conventions:

| Part | Namespace |
|---|---|
| Administrator | `Alfa\Component\Alfa\Administrator\{Controller,Model,Service,...}` |
| Site | `Alfa\Component\Alfa\Site\{Controller,Model,Service,...}` |
| API | `Alfa\Component\Alfa\Api\{Controller,Model,View,Dispatcher}` |
| Payment plugins | `Alfa\Plugin\AlfaPayments\{PluginName}\Extension` |
| Shipping plugins | `Alfa\Plugin\AlfaShipments\{PluginName}\Extension` |
| Form field plugins | `Alfa\Plugin\AlfaFormFields\{PluginName}\Extension` |
| Item field plugins | `Alfa\Plugin\AlfaItemFields\{PluginName}\Extension` |
| System plugin | `Alfa\Plugin\System\Alfasync` |
| Web services plugin | `Alfa\Plugin\WebServices\Alfa` |
| Console plugin | `Alfa\Plugin\Console\Alfa` |
| Modules | `Alfa\Module\AlfaCart`, `Alfa\Module\AlfaSearch`, `Alfa\Module\AlfaFilters`, `Alfa\Module\AlfaItems`, `Easy\Module\EasyArticles` |

## Naming conventions

| Kind | Example |
|---|---|
| Controllers | `ItemController`, `ItemsController` |
| Models | `ItemModel`, `CategoriesModel` |
| Views | `Items\HtmlView`, `Items\JsonapiView` |
| Tables | `ItemTable` |
| Events | `OrderStatusChangeEvent`, `PaymentResponseEvent` |
| Services | `OrderCreator`, `PaymentLedger`, `CartService` |
| Helpers | `OrderHelper`, `OrderTotalHelper` |

## Key files to know

| File or folder | What it is |
|---|---|
| `administrator/src/Extension/AlfaComponent.php` | The component's bootstrap class |
| `administrator/services/provider.php` | Registers the component with Joomla |
| `administrator/src/Plugin/` | The plugin base classes (`PaymentsPlugin`, `ShipmentsPlugin`, `FormFieldsPlugin`, `ItemFieldsPlugin`, `SearchEnginePlugin`, `Plugin`) and `AlfaPluginHelper` |
| `administrator/src/Event/` | Every event class, in 22 folders by area |
| `administrator/src/Service/Order/` | Orders: `OrderCreator`, `Transition`, `PaymentLedger`, `ShipmentLedger` |
| `site/src/Service/Cart/` | The cart (`CartService`) |
| `site/src/Service/Checkout/OrderPlacement.php` | Placing an order |
| `site/src/Service/Pricing/` | The pricing engine |
| `administrator/sql/install.mysql.utf8.sql` | The complete database schema |
| `plugins/webservices/alfa/src/Extension/Alfa.php` | The REST API's routes |
