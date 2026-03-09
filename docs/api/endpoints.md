---
sidebar_position: 2
title: Endpoints
---

# API Endpoints

All endpoints support standard CRUD operations: `GET` (list/single), `POST` (create), `PATCH` (update), `DELETE`.

## Catalog

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/items` | Products |
| `/api/index.php/v1/alfa/categories` | Product categories |
| `/api/index.php/v1/alfa/manufacturers` | Brands/manufacturers |
| `/api/index.php/v1/alfa/itemsprices` | Product variant pricing |
| `/api/index.php/v1/alfa/customfields` | Custom field definitions |

## Orders

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/orders` | Orders |
| `/api/index.php/v1/alfa/orderstatuses` | Order status definitions |

## Payments & Shipping

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/payments` | Payment methods |
| `/api/index.php/v1/alfa/shipments` | Shipping methods |

## Pricing Rules

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/discounts` | Discounts |
| `/api/index.php/v1/alfa/taxes` | Tax rules |
| `/api/index.php/v1/alfa/coupons` | Coupon codes |
| `/api/index.php/v1/alfa/currencies` | Currencies |

## Users & Locations

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/users` | Customer accounts |
| `/api/index.php/v1/alfa/usergroups` | Customer groups |
| `/api/index.php/v1/alfa/places` | Geographic locations |

## Configuration

| Endpoint | Description |
|----------|-------------|
| `/api/index.php/v1/alfa/settings` | Component settings |

## Common Operations

### List Items
```bash
GET /api/index.php/v1/alfa/items
```

### Get Single Item
```bash
GET /api/index.php/v1/alfa/items/123
```

### Create Item
```bash
POST /api/index.php/v1/alfa/items
Content-Type: application/json

{
  "name": "New Product",
  "sku": "PROD-001",
  "price": 29.99,
  "stock": 100
}
```

### Update Item
```bash
PATCH /api/index.php/v1/alfa/items/123
Content-Type: application/json

{
  "price": 24.99
}
```

### Delete Item
```bash
DELETE /api/index.php/v1/alfa/items/123
```
