---
sidebar_position: 2
title: Database Schema
---

# Database Schema

Alfa Commerce uses 60+ MySQL tables, all prefixed with `#__alfa_`. The schema is defined in `administrator/sql/install.mysql.utf8.sql`.

## Table Groups

### Products & Catalog

| Table | Description |
|-------|-------------|
| `#__alfa_items` | Product master table (name, SKU, stock, dimensions, weight) |
| `#__alfa_categories` | Hierarchical product categories |
| `#__alfa_items_categories` | Many-to-many: items ↔ categories |
| `#__alfa_manufacturers` | Brand/manufacturer data |
| `#__alfa_items_prices` | Variant pricing by currency, usergroup, and location |
| `#__alfa_items_price_index` | Denormalized price index for fast filtering |

### Pricing Rules

| Table | Description |
|-------|-------------|
| `#__alfa_discounts` | Discount/promotion rules |
| `#__alfa_discount_categories` | Discount scope: which categories |
| `#__alfa_discount_usergroups` | Discount scope: which customer groups |
| `#__alfa_discount_places` | Discount scope: which locations |
| `#__alfa_taxes` | Tax rate definitions |
| `#__alfa_tax_categories` | Tax scope: which categories |
| `#__alfa_tax_usergroups` | Tax scope: which customer groups |
| `#__alfa_tax_places` | Tax scope: which locations |
| `#__alfa_coupons` | Coupon codes |
| `#__alfa_coupons_usergroups` | Coupon visibility per group |
| `#__alfa_coupons_users` | Coupon per-user assignments |

### Cart & Checkout

| Table | Description |
|-------|-------------|
| `#__alfa_cart` | Shopping cart header (user, payment/shipment selection) |
| `#__alfa_cart_items` | Cart line items (item_id, quantity) |
| `#__alfa_user_info` | Delivery and invoice addresses |

### Orders

| Table | Description |
|-------|-------------|
| `#__alfa_orders` | Order header (totals, status, customer, methods) |
| `#__alfa_order_items` | Order line items with pricing snapshot |
| `#__alfa_order_payments` | Payment records (status, gateway data, refunds) |
| `#__alfa_order_shipments` | Shipment records (status, tracking, carrier) |
| `#__alfa_order_activity_log` | Unified event log (status changes, actions) |
| `#__alfa_order_detail_tax` | Per-item tax breakdown |
| `#__alfa_order_cart_rule` | Applied discounts/coupons per order |
| `#__alfa_orders_statuses` | Order status definitions |
| `#__alfa_orderstatus_recipients` | Order-status email recipients |

### Configuration

| Table | Description |
|-------|-------------|
| `#__alfa_shipments` | Shipping method definitions |
| `#__alfa_payments` | Payment method definitions |
| `#__alfa_places` | Geographic locations/countries |
| `#__alfa_currencies` | Currency definitions (200+ pre-loaded) |
| `#__alfa_form_fields` | Custom form field definitions (+ `_form_field_groups`, `_form_fields_usergroups`, `_form_fields_users`) |
| `#__alfa_customs` | Form field entries (submitted values) |

### Users

| Table | Description |
|-------|-------------|
| `#__alfa_users` | Customer profiles (with B2B fields) |
| `#__alfa_usergroups` | Customer segmentation groups (per-group price visibility is stored as JSON in the `prices_display` column) |
| `#__alfa_categories_usergroups` | Category visibility per group |
| `#__alfa_categories_users` | Category visibility per user |

## Key Relationships

```
Items ──┬── Items_Prices (1:N — per currency/group/place)
        ├── Items_Categories (M:N — multiple categories)
        └── Items_Price_Index (1:N — denormalized for filtering)

Orders ─┬── Order_Items (1:N)
        ├── Order_Payments (1:N — multiple payment attempts)
        ├── Order_Shipments (1:N — split shipments)
        ├── Order_Activity_Log (1:N — audit trail)
        ├── Order_Detail_Tax (1:N — per-item tax)
        └── Order_Cart_Rule (1:N — applied discounts)

Discounts ──┬── Discount_Categories (scope)
            ├── Discount_Usergroups (scope)
            └── Discount_Places (scope)

Taxes ──┬── Tax_Categories (scope)
        ├── Tax_Usergroups (scope)
        └── Tax_Places (scope)
```

## Price Index

The `#__alfa_items_price_index` table is a denormalized index maintained by `PriceIndexSyncService`. It pre-computes prices for every combination of (currency, location, usergroup) to enable fast catalog filtering.

**Columns:**
- `base_price` — Original price, no discounts, no tax
- `discount_amount` — Money saved
- `base_price_with_discounts` — After discounts, before tax
- `tax_amount` — Tax on discounted price
- `base_price_with_tax` — Base + tax (the "was" price)
- `final_price` — What the customer pays (primary filter column)
- `discount_percent` — Percentage saving

**Sync triggers:**
- Item save/publish → `syncItem($itemId)`
- Discount change → `syncByDiscount($discountId)`
- Tax change → `syncByTax($taxId)`
- Full rebuild → `syncAll()`

## Migrations

Database migrations are stored in `administrator/sql/updates/mysql/` with filenames matching version numbers (e.g., `1.0.9.sql`). On update, Joomla runs every file newer than the installed schema automatically.


### Removing obsolete files

SQL migrations only add or alter tables — **files** that a release no longer ships are removed by a parallel,
version-keyed mechanism. List the old paths in `administrator/files/removed/<version>.json`:

```json
{
  "files":   ["/components/com_alfa/old-controller.php"],
  "folders": ["/media/com_alfa/js/legacy"]
}
```

Paths are relative to the Joomla root. On update, `script.php` applies every list newer than the installed version
(so a site that skipped several releases is still fully cleaned up). Joomla never removes files dropped between
versions on its own, so add this list whenever you delete or rename a shipped file.
