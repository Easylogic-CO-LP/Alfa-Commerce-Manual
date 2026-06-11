---
sidebar_position: 2
title: Project Structure
---

# Project Structure

Understanding how Alfa Commerce is organized is essential before contributing or extending it.

## Directory Overview

```
Alfa-Commerce/
├── administrator/              # Backend admin panel
│   ├── src/
│   │   ├── Extension/          # Component bootstrap (AlfaComponent.php)
│   │   ├── Controller/         # Admin controllers (Form + List)
│   │   ├── Model/              # Admin models (CRUD, queries)
│   │   ├── View/               # Admin views
│   │   ├── Table/              # Database table classes
│   │   ├── Field/              # Custom form field types
│   │   ├── Helper/             # Business logic helpers
│   │   ├── Service/            # Services (PriceIndexSyncService)
│   │   ├── Event/              # Event classes
│   │   └── Plugin/             # Base plugin classes
│   ├── forms/                  # XML form definitions
│   ├── tmpl/                   # Admin HTML templates
│   ├── sql/                    # Database schemas & migrations
│   │   ├── install.mysql.utf8.sql
│   │   ├── uninstall.mysql.utf8.sql
│   │   └── updates/mysql/      # Version migration scripts (e.g. 1.0.9.sql)
│   ├── services/               # DI container (provider.php)
│   ├── layouts/                # Reusable template layouts
│   ├── languages/              # Localization (en-GB)
│   ├── config.xml              # Component configuration form
│   └── access.xml              # ACL permissions
│
├── site/                       # Frontend customer-facing
│   ├── src/
│   │   ├── Controller/         # Frontend controllers
│   │   ├── Model/              # Frontend models
│   │   ├── View/               # Frontend views
│   │   ├── Service/            # Pricing engine
│   │   │   └── Pricing/        # Money, PriceResult, PriceContext, etc.
│   │   ├── Helper/             # CartHelper, OrderPlaceHelper, PriceSettings
│   │   └── Dispatcher/         # Request dispatcher
│   ├── forms/                  # Frontend forms
│   ├── tmpl/                   # Frontend templates
│   └── languages/              # Frontend localization
│
├── api/                        # REST JSON-API
│   └── src/
│       ├── Controller/         # REST API controllers
│       └── View/               # JSON response views
│
├── plugins/                    # Core ships only the `standard` reference plugins;
│   │                           # real gateways/carriers are premium (distributed separately)
│   ├── alfa-payments/
│   │   └── standard/           # Offline payment (bank transfer / cash on delivery)
│   ├── alfa-shipments/
│   │   └── standard/           # Standard shipping (flat / zone rates)
│   ├── alfa-form-fields/            # Form field type plugins
│   │   ├── text/
│   │   ├── textarea/
│   │   ├── tel/
│   │   └── choice/
│   ├── webservices/alfa/       # API route registration
│   └── system/alfasync/        # Post-install integrity & per-language schema sync
│
├── modules/
│   ├── mod_alfa_cart/           # Shopping cart widget module
│   └── mod_alfa_search/         # Product search module
│
├── media/com_alfa/              # Static assets
│   ├── css/                     # Stylesheets (admin + site)
│   ├── js/                      # JavaScript (admin + site)
│   ├── images/                  # Component images
│   └── joomla.asset.json        # Joomla asset registry
│
├── alfa.xml                     # Package manifest
├── script.php                   # Install/update/uninstall script
├── .php-cs-fixer.php            # Code style configuration
├── phpstan.neon                 # Static analysis configuration
├── CONTRIBUTING.md              # Contribution guide
└── .github/workflows/           # CI/CD automation
```

## Namespaces

Alfa Commerce follows PSR-4 autoloading with Joomla 6/7 namespace conventions:

| Component | Namespace |
|-----------|-----------|
| Admin | `Alfa\Component\Alfa\Administrator\{Controller,Model,View,...}` |
| Site | `Alfa\Component\Alfa\Site\{Controller,Model,View,...}` |
| API | `Alfa\Component\Alfa\Api\{Controller,View}` |
| Payment Plugins | `Alfa\Plugin\AlfaPayments\{PluginName}\Extension` |
| Shipment Plugins | `Alfa\Plugin\AlfaShipments\{PluginName}\Extension` |
| Field Plugins | `Alfa\Plugin\AlfaFormFields\{PluginName}\Extension` |
| Cart Module | `Alfa\Module\AlfaCart` |
| Search Module | `Alfa\Module\AlfaSearch` |

## Naming Conventions

| Pattern | Example |
|---------|---------|
| Controllers | `ItemController`, `ItemsController` |
| Models | `ItemModel`, `CategoriesModel` |
| Views | `Items\HtmlView`, `Items\JsonapiView` |
| Tables | `ItemTable` |
| Events | `AdminOrderViewEvent`, `PaymentResponseEvent` |
| Helpers | `CartHelper`, `OrderPaymentHelper` |

## Key Files to Know

| File | Purpose |
|------|---------|
| `administrator/services/provider.php` | DI container — registers all component services |
| `administrator/src/Extension/AlfaComponent.php` | Component bootstrap class |
| `site/src/Helper/CartHelper.php` | Shopping cart logic |
| `site/src/Helper/OrderPlaceHelper.php` | Order placement flow |
| `site/src/Service/Pricing/` | Complete pricing engine |
| `administrator/src/Event/` | All event classes |
| `administrator/src/Plugin/` | Base plugin classes (Plugin, PaymentsPlugin, ShipmentsPlugin) |
| `administrator/sql/install.mysql.utf8.sql` | Complete database schema |
