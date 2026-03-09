---
sidebar_position: 1
title: Architecture Overview
---

# Architecture Overview

Alfa Commerce is built on Joomla 4's modern MVC architecture with a service-oriented design, event-driven plugin system, and a professional pricing engine.

## Design Principles

- **Event-Driven** — Plugins extend functionality through events, not code modifications
- **Service Layer** — Business logic lives in Helpers and Services, not in Controllers
- **Value Objects** — Money and pricing use immutable value objects for correctness
- **Fluent APIs** — Builder patterns for payments, shipments, and price settings
- **Atomic Operations** — Order placement uses database transactions

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Site)                       │
│  Controllers → Models → Helpers/Services → Database         │
│  CartController, ItemsController, OrderController           │
├─────────────────────────────────────────────────────────────┤
│                      Admin (Administrator)                   │
│  Controllers → Models → Helpers → Database                  │
│  OrderModel, ItemModel, CategoriesModel                     │
├─────────────────────────────────────────────────────────────┤
│                        REST API                              │
│  ApiControllers → Models → JSON Views                       │
│  17 endpoints (items, orders, payments, shipments, etc.)    │
├─────────────────────────────────────────────────────────────┤
│                      Plugin System                           │
│  Payment Plugins ──── Event Dispatcher ──── Shipment Plugins│
│  Field Plugins                              Webservices      │
├─────────────────────────────────────────────────────────────┤
│                   Core Services                              │
│  Pricing Engine │ Cart System │ Order System │ Stock Mgmt   │
├─────────────────────────────────────────────────────────────┤
│                      Database (MySQL)                        │
│  60+ tables: items, orders, payments, shipments, prices...  │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### Frontend (Customer)

```
HTTP Request
  → Joomla Router
    → ComponentDispatcher
      → Controller (e.g., CartController)
        → Helper/Service (e.g., CartHelper)
          → Model (e.g., ItemsModel)
            → Database
          → Event Dispatcher (plugin hooks)
        → View (HtmlView)
          → Template (tmpl/)
```

### Admin

```
HTTP Request
  → Joomla Router
    → Controller (FormController or ListController)
      → Model (AdminModel)
        → Table (database CRUD)
      → View (HtmlView)
        → Template + Form XML
```

### API

```
HTTP Request
  → Joomla API Router (webservices plugin)
    → ApiController
      → Model
        → JsonapiView (JSON response)
```

## Dependency Injection

The component registers services in `administrator/services/provider.php`:

```php
$container->registerServiceProvider(new MVCFactory('\\Alfa\\Component\\Alfa'));
$container->registerServiceProvider(new CategoryFactory('\\Alfa\\Component\\Alfa'));
$container->registerServiceProvider(new ComponentDispatcherFactory('\\Alfa\\Component\\Alfa'));
$container->registerServiceProvider(new RouterFactory('\\Alfa\\Component\\Alfa'));
```

## Key Design Patterns

| Pattern | Where Used |
|---------|-----------|
| **MVC** | All controllers, models, and views |
| **Service Layer** | CartHelper, OrderPlaceHelper, PriceIndexSyncService |
| **Value Objects** | Money, Currency, PriceResult |
| **Builder/Fluent API** | OrderPaymentHelper, OrderShipmentHelper, PriceSettings |
| **Strategy** | PricingIntent (catalog, cart, checkout, quote) |
| **Observer/Events** | Plugin system (40+ events) |
| **Factory** | PriceContext, MVCFactory |
| **Repository** | Models as data access layer |
