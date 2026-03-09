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
│   │   ├── View/               # Admin views (36+ view classes)
│   │   ├── Table/              # Database table classes
│   │   ├── Field/              # Custom form field types
│   │   ├── Helper/             # Business logic helpers
│   │   ├── Service/            # Services (PriceIndexSyncService)
│   │   ├── Event/              # Event classes (40+ events)
│   │   └── Plugin/             # Base plugin classes
│   ├── forms/                  # XML form definitions (39 forms)
│   ├── tmpl/                   # Admin HTML templates
│   ├── sql/                    # Database schemas & migrations
│   │   ├── install.mysql.utf8.sql
│   │   ├── uninstall.mysql.utf8.sql
│   │   └── updates/            # Version migration scripts
│   ├── services/               # DI container (provider.php)
│   ├── layouts/                # Reusable template layouts
│   ├── languages/              # Localization (en-GB, el-GR)
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
│       ├── Controller/         # 18 API controllers
│       └── View/               # JSON response views
│
├── plugins/
│   ├── alfa-payments/          # Payment gateway plugins
│   │   ├── standard/           # Offline/bank transfer payment
│   │   ├── revolut/            # Revolut integration
│   │   └── viva/               # Viva Wallet integration
│   ├── alfa-shipments/         # Shipping method plugins
│   │   ├── standard/           # Standard shipping (zone-based)
│   │   └── boxnow/             # Box Now courier
│   ├── alfa-fields/            # Custom field type plugins
│   │   ├── text/               # Text input field
│   │   └── textarea/           # Textarea field
│   └── webservices/alfa/       # API route registration
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
├── CLAUDE.md                    # AI assistant context
├── CONTRIBUTING.md              # Contribution guide
└── .github/workflows/           # CI/CD automation
```

## Namespaces

Alfa Commerce follows PSR-4 autoloading with Joomla 4 namespace conventions:

| Component | Namespace |
|-----------|-----------|
| Admin | `Alfa\Component\Alfa\Administrator\{Controller,Model,View,...}` |
| Site | `Alfa\Component\Alfa\Site\{Controller,Model,View,...}` |
| API | `Alfa\Component\Alfa\Api\{Controller,View}` |
| Payment Plugins | `Joomla\Plugin\AlfaPayments\{PluginName}\Extension` |
| Shipment Plugins | `Joomla\Plugin\AlfaShipments\{PluginName}\Extension` |
| Field Plugins | `Joomla\Plugin\AlfaFields\{PluginName}\Extension` |
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
