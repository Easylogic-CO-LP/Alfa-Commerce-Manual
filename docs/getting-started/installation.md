---
sidebar_position: 1
title: Installation
description: What Alfa Commerce needs, how to install and update it, and what the installer does and refuses.
---

# Installation

<AlfaVersion verified="2.2.2" />

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

Printing sales documents as PDF needs the dompdf library (`lib_dompdf`). It ships with Alfa Commerce and is
installed and updated with it, together with the four libraries it needs, so PDFs work with no extra step. The setup checklist has a
recommended row, "PDF library for sales documents", which fails only when one of these libraries has been removed,
and says that installing the Alfa Commerce package again restores it.

## Styles and scripts: three forms, served compressed

### What it does

Every stylesheet and every script that Alfa Commerce installs, for the component, its modules and its plugins, is
there in three forms:

| File | What it is | When it is sent |
|---|---|---|
| `cart.js` | The source: readable, with its comments. | When Debug System is on (System, Global Configuration, the System tab). |
| `cart.min.js` | The same code made smaller: no comments, and no spaces the browser does not need. | When Debug System is off, as on a live shop. |
| `cart.min.js.gz` | The `.min` file compressed with gzip. | In place of the `.min` file, by the web server, to a browser that accepts gzip. The server reads it from disk and compresses nothing while the page waits. |

Alfa Commerce asks Joomla for the `.min` file of each style and script. With Debug System on, Joomla finds the source
beside it and sends that instead, so the code can be read as it was written. A library that comes already minified,
with no source beside it, is sent as it is, and has its `.gz` too. A source never has a `.gz` of its own.

### What you must provide

On Apache, or on a server that reads the same `.htaccess` rules: use Joomla's own `htaccess.txt` as the site's
`.htaccess` (rename or copy it, as Joomla asks for search engine friendly URLs), and keep its section headed
`## GZIP & BROTLI` as it is. Nothing else is needed: the package brings the `.gz` files, and that section serves them.

For each request of a `.css` or a `.js` file, the section:

1. checks that the browser accepts gzip (its `Accept-Encoding` header) and that the same file with `.gz` added exists
   and is not empty;
2. when both hold, sends the `.gz` file in place of the file asked for, with the query string kept;
3. sends it with `Content-Encoding: gzip` and the type of the file asked for (`text/css` or `text/javascript`), tells
   the server's own compression to leave it as it is, and adds `Vary: Accept-Encoding`, so that a proxy keeps the
   compressed and the plain answer apart.

A browser that does not accept gzip gets the plain `.min` file. The section needs the server's `mod_rewrite` (switched
on earlier in the same file) and `mod_headers`. This is the section as Joomla 6's `htaccess.txt` carries it:

```apache
<IfModule mod_headers.c>
	# Serve gzip compressed CSS files if they exist
	# and the client accepts gzip.
	RewriteCond "%{HTTP:Accept-encoding}" "gzip"
	RewriteCond "%{REQUEST_FILENAME}\.gz" -s
	RewriteRule "^(.*)\.css" "$1\.css\.gz" [QSA]

	# Serve gzip compressed JS files if they exist
	# and the client accepts gzip.
	RewriteCond "%{HTTP:Accept-encoding}" "gzip"
	RewriteCond "%{REQUEST_FILENAME}\.gz" -s
	RewriteRule "^(.*)\.js" "$1\.js\.gz" [QSA]

	# Serve correct content types, and prevent mod_deflate double compression.
	RewriteRule "\.css\.gz$" "-" [T=text/css,E=no-gzip:1,E=no-brotli:1]
	RewriteRule "\.js\.gz$" "-" [T=text/javascript,E=no-gzip:1,E=no-brotli:1]

	<FilesMatch "(\.js\.gz|\.css\.gz)$">
		# Serve correct encoding type.
		Header set Content-Encoding gzip

		# Force proxies to cache gzipped &
		# non-gzipped css/js files separately.
		Header append Vary Accept-Encoding
	</FilesMatch>
</IfModule>
```

Another web server needs its own setting to send a `.gz` file that sits beside the file asked for.

### What happens next

To check it, ask for one `.min` file the way a browser does, and save what comes back:

```bash
curl -s -D - -o list-form.bin -H 'Accept-Encoding: gzip' https://example.com/media/com_alfa/js/site/list-form.min.js
cmp list-form.bin media/com_alfa/js/site/list-form.min.js.gz
```

The answer is `200` with `Content-Encoding: gzip` and `Content-Type: text/javascript`, and `cmp`, run against the
site's own file, prints nothing: the bytes sent are the `.gz` file. The same request without the `Accept-Encoding`
header answers the plain `.min` file.

### What can go wrong

| What you see | Why | What to do |
|---|---|---|
| Pages look unstyled, and the browser's console shows `ERR_CONTENT_DECODING_FAILED` | The server compresses styles and scripts itself as well. | Comment out the GZIP section, as the note at the top of `htaccess.txt` says. |
| The answer has no `Content-Encoding: gzip` | The site's `.htaccess` is not Joomla's `htaccess.txt`, its GZIP section is commented out, or the server lacks `mod_rewrite` or `mod_headers`. | Use Joomla's file with the section on, or ask the host for the two modules. |
| A change to a style or a script does not show on a development site | Debug System is off, so Joomla sends the `.min` file, which is made from the source only when the repository's build runs. | Work with Debug System on, and build before you commit: see [Contributing](./contributing#you-changed-a-stylesheet-or-a-script). |

## Installing

1. Download the latest release ZIP from [alfacommerce.gr](https://www.alfacommerce.gr) (**Download**). The archive
   GitHub offers for a branch is the source tree, not a release.
2. In the Joomla administrator go to **System**, **Install**, **Extensions**.
3. Upload the ZIP file.

### What the installer does

It installs, in this order, the libraries, the plugins and the modules that come in the ZIP, then enables every
plugin it brought that the site did not have before. On an update each plugin keeps the state it had (see
[Updating](#updating)).

| Kind | What is installed |
|---|---|
| Component | Alfa Commerce (`com_alfa`), with its 33 guided tours |
| Payment and shipping | `alfa-payments/standard`, `alfa-shipments/standard` |
| Form fields | `alfa-form-fields`: `text`, `textarea`, `tel`, `choice`, `country` |
| Item fields | `alfa-item-fields/choice` |
| Platform | `system/alfasync`, `webservices/alfa` (the REST API), `console/alfa` (the console commands) |
| Modules | `mod_alfa_cart`, `mod_alfa_search`, `mod_alfa_filters`, `mod_alfa_items`, `mod_easy_articles` |
| Libraries | libphonenumber and its locale data; dompdf and the four libraries it needs (php-font-lib, php-svg-lib, masterminds/html5, sabberworm/php-css-parser) |

Alfa Commerce ships in English. Every other language is a separate language pack.

No search engine plugin is included. The catalogue search works without one.

### What the installer refuses

The installer checks before it changes any file or table. If it refuses, nothing was touched, and the message says
why:

1. Joomla is older than 6.1.
2. Joomla is 7.0 or newer.
3. PHP is older than 8.3.
4. A required PHP extension is missing (each one is named).
5. A 1.x beta of Alfa Commerce is installed (see [From a 1.x beta](#from-a-1x-beta)).
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
  Commerce's administrator screens until a later check passes. Press **Check again** after fixing the cause.

nginx ignores the deny rules in the folder. There, refuse the folder in the server configuration (the warning prints
the rule), or move the store outside the public web root.

- **A switch.** **Options**, **Downloads**, **Direct-download protection check** (Yes by default). With No, no
  administrator page says anything about the store's protection, and installing, updating, a path change and the
  first file test nothing. **Check again** in the Options still tests the store and records the result. Turn it off
  for a shop that sells no files, or on a server where the site cannot request its own address.
- **Nothing to protect, nothing tested.** While no item carries a file, no order hands one out and the folder holds
  no file of its own, no page warns and nothing is tested. The Options say "No files in the store yet; the protection
  is checked when the first file is added." The first file added to such a store is tested once, while the check is
  on. The upload never fails because of the test.
- **The warning.** It says in plain words what happened, whether it matters and what to do. The nginx rule is behind
  the warning's **Server rule** line. Two links open the Downloads tab of the
  Options: "Move the store outside the web root" and, while the check is on, "Turn this check off".

The shop's background work (sending e-mails, issuing documents, rebuilding the catalogue's stored data) needs no
cron job: visits to the shop, staff using the administrator and API requests keep it running. A server can also run
it from cron with the console command `alfa:tasks:run`.

## Updating

Alfa Commerce updates in place through Joomla's own update system (update server
`https://cdn.alfacommerce.gr/com_alfa/update.xml`), or by installing the new ZIP over the installed version. Joomla
runs each release's database changes itself.

An update also removes the files the new version no longer ships, cleans Joomla's page cache and Alfa Commerce's
own caches, and pauses the shop's background work while it runs (at most ten minutes).

Before updating:

- Read the release's notes in the changelog. Some updates rebuild large tables and are best done at a quiet hour.
- Update every Alfa Commerce extension you have installed to the same release together with core. After the
  update, Alfa Commerce names the installed Alfa extensions that are not known to work with it, on the update page,
  in the maintenance log and in a notification, and the setup checklist keeps a row until each one is updated. See
  [The Alfa Commerce lines your extension is built for](../plugins/overview.md#the-alfa-commerce-lines-your-extension-is-built-for).

The same Joomla and PHP checks run on an update as on an installation. An update also cleans the caches of the
bundled items module (`mod_alfa_items`), and keeps each plugin of the package in the state staff left it.

What else an update does:

- **The database.** When you update Alfa Commerce, the installation drops the columns it no longer uses, adds the
  ones it needs, and, when a release changes how prices are worked out, rebuilds the item prices once in the
  background (**Tools**, **Tasks**). The columns it drops are those nothing reads: the orders' coupon id, coupon
  code, invoice date and invoice number, the invoice id of order lines, parcels and order cart rules, and the e-mail
  subject and body columns of each language's order status table. A report or an extension of your own that reads
  one of them by name stops working. On MariaDB 10.6 and on MySQL 8.0.29 or later a dropped column changes only the
  table's definition; an older MySQL 8.0 rebuilds each table, which takes longer on a large shop, so choose a quiet
  hour.
- **The prices.** Until the rebuild ends, the item list may sort and filter some customers by the earlier price,
  while the item page and the cart already show the new one. A discount or a tax scoped to a place reaches the
  places inside it; on a shop whose rules were saved before that, the update page names the published discounts and
  taxes that now reach further. A shop whose places are all countries has none.
- **The PDF libraries.** The package installs dompdf and the four libraries it needs. A `lib_dompdf` that was
  installed on its own is updated to the package's copy. PDFs then work with no extra step.
- **Item images that are not images.** The update lists the files among the item images that are not images, with
  the records that name them: one warning on the update page, and one line per file in the media log
  (`com_alfa_media.php` in Joomla's log folder). Nothing is deleted. Look at each file, delete by hand those that are
  not yours to publish, and choose a new thumbnail for the records named.
- **Plugins.** Each plugin of the package that staff disabled (for example Web Services - Alfa Commerce) stays
  disabled and is named on the update page and in the maintenance log.
- **Countries.** On a shop whose countries do not yet follow ISO 3166-1, the update brings them to it. The countries
  the shop never changed are corrected in place, each keeping its id, the missing ones are added unpublished, and
  the update page names what it left: the countries the shop changed, the old rows that are not countries, the place
  Larisa inside Greece, which older shops were installed with, and the countries whose default currency it left as
  it was. The places inside Greece and Spain are not added by the update: in **Countries/States**, select Greece or
  Spain and press **Add subdivisions** to add them, unpublished. The seeded country and region names are in English;
  rename them in **Countries/States** if the shop prefers names in another language.
- **E-mail layouts.** Alfa Commerce reads e-mail layout overrides from the default administrator template only (see
  [Order e-mails](../architecture/order-emails.md#overriding-from-a-template)). The update names every layout file it
  finds under a site template's `html/layouts/com_alfa/emails` in one warning and in the maintenance log, with the
  folder to copy each one into. It moves and deletes nothing.

### From a 1.x beta

A stable release cannot be installed over a 1.x beta, and the installer refuses before anything is changed. To move from a beta:

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
