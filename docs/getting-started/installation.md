---
sidebar_position: 1
title: Installation
---

# Installation

Alfa Commerce is a Joomla eCommerce component distributed as a single installable ZIP package.

## Requirements

- **Joomla** 6 or 7
- **PHP** 8.2 or higher
- **MySQL** 5.7+ or MariaDB 10.3+ (utf8mb4 encoding)
- **Web Server** Apache or Nginx

## Installing Alfa Commerce

1. Download the latest release ZIP from the [GitHub repository](https://github.com/Easylogic-CO-LP/Alfa-Commerce)
2. Log in to your Joomla administrator panel
3. Navigate to **System → Install → Extensions**
4. Upload the ZIP file
5. Click **Upload & Install**

The installation script (`script.php`) automatically:
- Creates all database tables (60+ tables)
- Installs bundled plugins (payments, shipments, custom fields, webservices)
- Installs bundled modules (cart, search)
- Enables all extensions

## What Gets Installed

| Extension | Type | Description |
|-----------|------|-------------|
| `com_alfa` | Component | Core eCommerce component |
| `plg_alfapayments_standard` | Plugin | Standard/offline payment method (bank transfer, cash on delivery) |
| `plg_alfashipments_standard` | Plugin | Standard shipping method (flat / zone rates) |
| `plg_alfafields_text` | Plugin | Text custom field type |
| `plg_alfafields_textarea` | Plugin | Textarea custom field type |
| `plg_alfafields_tel` | Plugin | Telephone custom field type |
| `plg_alfafields_choice` | Plugin | Choice (radio / checkbox) custom field type |
| `plg_webservices_alfa` | Plugin | REST API routing |
| `plg_system_alfasync` | Plugin | Post-install integrity & per-language schema sync |
| `mod_alfa_cart` | Module | Shopping cart widget |
| `mod_alfa_search` | Module | Product search widget |

:::note Gateways & carriers are distributed separately
The core package ships only the **`standard`** payment and shipment reference plugins. Real gateway/carrier
integrations are premium and distributed separately — they are **not** bundled
in the core ZIP.
:::

## Post-Installation

After installing, navigate to **Components → Alfa Commerce** in the admin panel to:

1. **Configure currencies** — Set your default currency
2. **Set up tax rules** — Define tax rates by category, region, and user group
3. **Create categories** — Organize your product catalog
4. **Add products** — Start adding items to your store
5. **Configure payment methods** — Enable and configure at least one payment plugin
6. **Configure shipping methods** — Enable and configure at least one shipment plugin
7. **Set up order statuses** — Customize your order workflow

## Updating

Alfa Commerce supports Joomla's built-in update system. Updates are checked automatically via the update server at `https://cdn.alfacommerce.gr/com_alfa/update.xml`.

To update manually:
1. Download the new version ZIP
2. Install it over the existing installation (method="upgrade")
3. Migration scripts in `/administrator/sql/updates/mysql/` run automatically

## Verifying your installation

Alfa Commerce can verify that the installed files match the officially published checksums for your release and shows
the result in the admin **Security** area — for example **official** (matches the release exactly) or **modified**
(one or more files differ). Use it to confirm an installation is pristine, or to spot unintended changes.
