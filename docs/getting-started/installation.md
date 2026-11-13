---
sidebar_position: 1
title: Installation
description: What Alfa Commerce 2.2.0 needs, how to install and update it, and what the installer does and refuses.
---

# Installation

<AlfaVersion verified="2.2.0" />

Alfa Commerce is a Joomla component. One ZIP file installs the component together with its plugins, modules and
libraries.

## Requirements

| | Needed |
|---|---|
| **Joomla** | 6.1 or a later Joomla 6 release. Joomla 6.0 is refused; update Joomla first. Joomla 7 is not supported yet and is refused. |
| **PHP** | 8.3 or newer (8.4 recommended), with the extensions `bcmath`, `intl`, `mbstring`, `gd` and `openssl` |
| **Database** | MySQL 8.0.13 or newer, or MariaDB 10.6 or newer (utf8mb4) |

The installer checks Joomla, PHP and the PHP extensions itself and names what is missing. It does not check the
database version, so check that one yourself.

Printing sales documents as PDF needs the dompdf library (`lib_dompdf`), which is installed separately. Planned for
2.2.1, which is not released: the setup checklist has a recommended row, "PDF library for sales documents", which
says that the library is to be had from Easylogic and is installed in **System**, **Install**, **Extensions**.

## Installing

1. Download the latest release ZIP from [alfacommerce.gr](https://www.alfacommerce.gr) (**Download**). The archive
   GitHub offers for a branch is the source tree, not a release.
2. In the Joomla administrator go to **System**, **Install**, **Extensions**.
3. Upload the ZIP file.

### What the installer does

It installs, in this order, the libraries, the plugins and the modules that come in the ZIP, then enables every
plugin it brought:

| Kind | What is installed |
|---|---|
| Component | Alfa Commerce (`com_alfa`), with its 33 guided tours |
| Payment and shipping | `alfa-payments/standard`, `alfa-shipments/standard` |
| Form fields | `alfa-form-fields`: `text`, `textarea`, `tel`, `choice`, `country` |
| Item fields | `alfa-item-fields/choice` |
| Platform | `system/alfasync`, `webservices/alfa` (the REST API), `console/alfa` (the console commands) |
| Modules | `mod_alfa_cart`, `mod_alfa_search`, `mod_alfa_filters`, `mod_alfa_items`, `mod_easy_articles` |
| Libraries | libphonenumber and its locale data |

Alfa Commerce ships in English. Every other language is a separate language pack.

No search engine plugin is included. The catalogue search works without one.

### What the installer refuses

The installer checks before it changes any file or table. If it refuses, nothing was touched, and the message says
why:

1. Joomla is older than 6.1.
2. Joomla is 7.0 or newer.
3. PHP is older than 8.3.
4. A required PHP extension is missing (each one is named).
5. An Alfa Commerce older than 2.0.0 is installed (see [From a 1.x beta](#from-a-1x-beta)).
6. Alfa Commerce tables of another version were left in the database and cannot be reconnected.

## After installing

Open **Components**, **Alfa Commerce**. The Dashboard shows a setup checklist that leads you through the first
steps. See [Your first shop](./store-setup.md).

### The download store check

Files that shoppers buy as downloads are kept in the folder `alfa-downloads` inside the site, unless **Options**,
**Downloads**, **Downloads storage path** names a folder outside the public web root. Alfa Commerce puts deny rules
for Apache and IIS in that folder. At installation, at every update and when the path changes, it then tests the
result: it places a test file in the folder and asks the site for it at its public address.

- If the test file is refused, nothing is shown.
- If the test file is served, or the site could not request its own address, a security warning stays on Alfa
  Commerce's administrator screens until a later check passes. Press **Check again** after fixing the cause. In 2.2.0
  the warning cannot be dismissed.

nginx ignores the deny rules in the folder. There, refuse the folder in the server configuration (the warning prints
the rule), or move the store outside the public web root.

Planned for 2.2.1, which is not released:

- **A switch.** **Options**, **Downloads**, **Direct-download protection check** (Yes by default). With No, no
  administrator page says anything about the store's protection, and installing, updating, a path change and the
  first file test nothing. **Check again** in the Options still tests the store and records the result. Turn it off
  for a shop that sells no files, or on a server where the site cannot request its own address.
- **Nothing to protect, nothing tested.** While no item carries a file, no order hands one out and the folder holds
  no file of its own, no page warns and nothing is tested. The Options say "No files in the store yet; the protection
  is checked when the first file is added." The first file added to such a store is tested once, while the check is
  on. The upload never fails because of the test.
- **The warning.** It says in plain words what happened, whether it matters and what to do. The nginx rule is no
  longer in its text: it is behind the warning's **Server rule** line. Two links open the Downloads tab of the
  Options: "Move the store outside the web root" and, while the check is on, "Turn this check off".

The shop's background work (sending e-mails, issuing documents, rebuilding the catalogue's stored data) needs no
cron job: visits to the shop, staff using the administrator and API requests keep it running. A server can also run
it from cron with the console command `alfa:tasks:run`.

## Updating

From 2.0.0 on, Alfa Commerce updates in place through Joomla's own update system (update server
`https://cdn.alfacommerce.gr/com_alfa/update.xml`), or by installing the new ZIP over the installed version. Joomla
runs each release's database changes itself.

An update also removes the files the new version no longer ships, cleans Joomla's page cache and Alfa Commerce's
own caches, and pauses the shop's background work while it runs (at most ten minutes).

Before updating:

- Read the release's notes in the changelog. Some updates rebuild large tables and are best done at a quiet hour.
- Update every Alfa Commerce extension you have installed to the same release together with core.

The same Joomla and PHP checks run on an update as on an installation.

Planned for 2.2.1, which is not released:

- The update also cleans the caches of the bundled items module (`mod_alfa_items`).
- The update lists the files among the item images that are not images, with the records that name them: one
  warning on the update page, and one line per file in the media log (`com_alfa_media.php` in Joomla's log folder).
  Nothing is deleted. Look at each file, delete by hand those that are not yours to publish, and choose a new
  thumbnail for the records named.

An update from 2.1.4 to 2.2.0 may print the warning "The scheduled tasks of plg_task_alfapricesets were not
removed". They were removed, and the warning can be ignored. A fix is planned for 2.2.1, which is not released.

### From a 1.x beta

2.0.0 was the first stable release. It cannot be installed over any 1.x beta, and the installer refuses before
anything is changed. To move from a beta:

1. Back up the site.
2. Uninstall the beta.
3. Delete every database table whose name still starts with your table prefix followed by `alfa_`. The beta's
   uninstaller leaves some behind.
4. Install the current release.

The beta's data is not carried over.

## Uninstalling

Uninstalling removes the component, its plugins, modules, libraries, guided tours and any Alfa Commerce language
packs. It keeps every Alfa Commerce table and its data. Installing the same version again reconnects that data.

A language pack whose package manifest is missing is not uninstalled: Joomla cannot uninstall it without the
manifest either. The uninstall message names the pack, and the maintenance log (`com_alfa_maintenance.php` in
Joomla's log folder) says why, with its files.

Two things stay: plugins of other authors that were written for Alfa Commerce, and the storefront menu items.
Remove them yourself if you do not install again.

To remove the shop's data as well, use **Tools**, **Reset and clear** before uninstalling.

## Verifying the installed files

**Tools**, **Security** compares the installed files with the signed list of checksums published for your release
and says whether the installation is verified, modified, or ahead of the latest release, or why the comparison
could not be made. Use it to confirm that an installation is as released, or to find files that were changed.
