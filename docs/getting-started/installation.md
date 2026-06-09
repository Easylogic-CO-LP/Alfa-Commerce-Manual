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

1. Get the latest release ZIP from [alfacommerce.gr](https://www.alfacommerce.gr) — click **Download**
2. Log in to your Joomla administrator panel
3. Navigate to **System → Install → Extensions**
4. Upload the ZIP file
5. Click **Upload & Install**

The installation script (`script.php`) installs the bundled modules and plugins automatically.

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

To update manually, install the new version ZIP over your existing installation — the same steps as [Installing Alfa Commerce](#installing-alfa-commerce) (`method="upgrade"`). Migration scripts run automatically.

## Verifying your installation

Alfa Commerce can verify that the installed files match the officially published checksums for your release and shows
the result in the admin **Security** area — for example **official** (matches the release exactly) or **modified**
(one or more files differ). Use it to confirm an installation is pristine, or to spot unintended changes.
