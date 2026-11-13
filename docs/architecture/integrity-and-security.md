---
sidebar_position: 12
title: Integrity check and Tools > Security
description: How Alfa Commerce compares its installed files with the signed list published for the release, what each outcome means, what the other Tools tabs do, and how to report a security problem.
---

# Integrity check and Tools > Security

<AlfaVersion verified="2.2.0" />

Alfa Commerce can tell whether its files on a site are the files of the official release. It compares them with a
list that is published for every release and signed by the publisher. The result is shown under **Tools > Security**
and, when something is wrong, as a notification and a banner in the administrator.

For an extension author this matters for one reason: **an edited core file is reported.** Customise through plugins
and template or layout overrides, never by changing a file inside Alfa's own folders.

## What it does

### What is compared

| Step | What happens |
|---|---|
| 1. Fetch | Alfa downloads the list for the installed version, `checksums-<version>.json`, from `https://cdn.alfacommerce.gr/com_alfa/integrity/`, and with it a signature file of the same name ending in `.sig`. The address is fixed in the code (`administrator/src/Helper/IntegrityHelper.php`) and is not a setting. |
| 2. Check the signature | The signature must match the downloaded list, checked with the public keys that ship inside Alfa. The matching private keys are never on the site. A list that fails this check is not used at all. |
| 3. Compare | For every file the list names, Alfa computes the file's **checksum** (a fingerprint of its content) and compares it with the list. Then it walks Alfa's own folders and looks for files the list does not name. |

A **checksum** changes when the content changes. For text files (`php`, `js`, `css`, `ini`, `xml`, `json`, `html`,
`htm`, `sql`, `svg`, `txt`, `md`, and files with no extension) runs of spaces, tabs and line breaks count as one
space, so a file that differs only in line endings or indentation is not reported. Every other file is compared
byte for byte.

The comparison finds three kinds of difference:

| Kind | Meaning | The words on the Security tab |
|---|---|---|
| Changed | A file the list names has different content | "Files that differ from the official release (expected if you edited them; otherwise investigate)" |
| Missing | A file the list names is not there | "Files the official release ships that are missing here (deleted or moved: investigate)" |
| Extra | A file is inside one of Alfa's own folders and the list does not name it | "Injected files inside the core (not part of the official release). ..." |

### Which folders are searched for extra files

Only the folders of the extensions the list itself names: Alfa's component folders (site, administrator and API),
its `media` folder, and the folder of each module and plugin that ships with Alfa Commerce. Hidden files such as
`.htaccess` and `.user.ini` are reported. A few names that desktop systems leave behind are ignored: `.DS_Store`,
`Thumbs.db`, `desktop.ini` and files starting with `._`, unless such a name contains an extension a web server may
run.

Folders shared with other extensions, such as Joomla's `language` and `libraries` folders, are never searched for
extra files. This is how the two language rules below come about.

| Case | Result | Since |
|---|---|---|
| A language pack's files, which live in Joomla's own language folders (`language/<tag>/` and `administrator/language/<tag>/`) | Not reported | 2.1.1 |
| A language file placed inside Alfa's own folders (for example `administrator/components/com_alfa/language/`) | Reported as an extra file, like any other file the release does not list | 2.1.2 |
| Your own plugin or module, in its own folder | Not looked at. The check covers only what ships with Alfa Commerce. | |
| A template override in a template's `html` folder | Not looked at | |

### The outcomes

Tools > Security shows one card, "Official release verification", with one of these outcomes. The name in code
style is the value the code uses.

| Outcome | When | The words on the card | Shown as |
|---|---|---|---|
| `official` | The list was fetched and verified, and nothing differs | "Verified against the official release *version*: this install matches the Alfa Commerce distribution signed by Easylogic, file for file." | Green |
| `modified` | The list for exactly the installed version was verified, and something differs | "This install does NOT match the official release *version*. Core files should never be edited (customise via plugins and template/layout overrides); review every item below; injected files are the highest priority." | Red, with the lists of extra, changed and missing files |
| `ahead` | No list exists for the installed version, the list of the latest release was used instead, and something differs | "This install is ahead of / customised from the latest official release (*version*). The differences below are expected if you are developing or running a newer build: informational, not a tamper alarm." | Blue, with the same lists |
| `unreachable` | No list could be downloaded | "The official file list could not be downloaded (the site may be offline, or the list for this version is not published yet), so your files were not compared with it. This is not a problem with your files. Press Recheck now later." | Grey note |
| `bad_signature` | A list was downloaded and its signature did not verify, or the list could not be read | "The official checksums failed signature verification and must NOT be trusted: possibly a tampered or forged reference, or a network interception. Do not rely on this result; check your connection and the CDN." | Red |
| `bad_signature`, reason `unknown_hash` | The list is signed, but was made with a checksum method this version does not know | "The official checksums are signed, but were produced with a hash method this build does not know, so they cannot be checked against your files. Update Alfa Commerce to the version the checksums were published for. Do not rely on this result." | Red |

`unreachable` is also the outcome on a server whose PHP lacks the sodium extension, which the signature check needs.

### What "ahead of the latest release" means

Alfa first asks for the list of its own version. Only when that list does not exist does it ask for
`checksums-latest.json`, the list of the newest published release.

- If the files match that list, the outcome is `official`.
- If they differ, the outcome is `ahead`: the site runs something the publisher has no list for, typically a
  development build or a version newer than the newest published list. Differences are then expected, so this is
  shown calmly and is not an alarm.

A difference against the list of **exactly the installed version** is `modified`, which is an alarm.

### Where the result is shown

| Place | What it shows |
|---|---|
| Tools > Security | The card, the three lists, the time of the last check and the button **Recheck now** |
| The notification bell | A notification "File integrity" for every outcome except `official`: danger for `modified` and `bad_signature`, information for `ahead` and `unreachable`. It cannot be dismissed and goes away when the files match again. Everyone sees it; only users with the Tools permission get the link to Tools. |
| Every Alfa Commerce administrator page | A red banner, while the last recorded outcome is `modified` or `bad_signature`. Its words say whether files were changed, how many extra files there are, or that the list could not be verified or fetched. |

The card is drawn from one fixed file (`administrator/src/View/Tools/_integrity.php`), not through Joomla's layout
overrides, so a template override cannot change it. Its sentences are ordinary language strings. The banner's words
are fixed in the code and are not language strings, so neither a template override nor a language override can
change or silence the banner.

## When it is used

- **By itself, at most once in 24 hours.** The notification bell's background refresh starts the check. The answer
  is kept for 24 hours (see [Caches and the page cache](./caches.md)).
- **When Tools is opened and no answer is kept.** The page then runs the check and keeps its answer.
- **When staff press Recheck now.** The kept answer is dropped and the check runs again.
- **After an update of Alfa Commerce.** The kept answer is dropped, because the files changed.

The check never changes, removes or disables a file. It only reports.

## What you must provide

**The permission.** Opening Tools, pressing Recheck now and downloading a package all need the permission
**Use Maintenance Tools** (`alfa.tools`) on Alfa Commerce. A user without it does not see the Tools menu item.

**As an extension author: nothing, as long as you stay out of Alfa's folders.**

| Do | Do not |
|---|---|
| Put your code in your own plugin, module or template | Edit a file under `components/com_alfa`, `administrator/components/com_alfa`, `api/components/com_alfa`, `media/com_alfa`, or the folder of a module or plugin that ships with Alfa |
| Change how something looks with a template or layout override | Add a file of your own inside those folders |
| Ship your translations as a language pack in Joomla's language folders | Put language files inside Alfa's own folders |

A site that needs a real change in core should send it upstream. The tab "GitHub - Commit & Pull Request" exports
the files for that.

## What happens next

- With `official`, any earlier notification is removed.
- With any other outcome, the notification is written or updated, and the counts of changed, missing and extra files
  are recorded for the banner.
- While the outcome stays other than `official`, the notification is raised again at each daily check, also if it
  was read.

## What the check cannot do

The check runs on the site's own server. Somebody who fully controls the server can switch the check off or block
the download of the list. The Security tab says so itself: a clean result is strong evidence that the files were not
tampered with, not an absolute guarantee. The signed list cannot be forged on the site, because the signing key is
never there.

## The other tabs of Tools

Tools is one screen (`administrator/tmpl/tools/default.php`) with these tabs. Every card on them is drawn from one
registry of tool actions, so a plugin's own tool looks and behaves like core's. How a plugin adds a tool is on
[Admin screen plugins](../plugins/admin-screen-plugins.md).

| Tab | What it is for | The code behind it |
|---|---|---|
| Media | Find and delete media entries whose record or file no longer exists, and create missing or all thumbnails. Planned for 2.2.1, which is not released: a row whose image is not a file a thumbnail may be made from gets no thumbnail, and the job's report names it. | The view `toolsmedia`; the thumbnail actions in `administrator/src/Service/Tools/CoreToolProvider.php` |
| Database Sync | Actions listed in the order to run them: users and groups, language tables, backfill of empty translations, catalogue projections, list prices for customer groups, outstanding stock movements, the search index | `administrator/src/Service/Tools/CoreToolProvider.php` |
| Tasks | Failed and held tasks, the jobs, the deletion of finished tasks, and how background work runs. See [Background work](./background-work.md). | `administrator/src/Controller/TasksController.php`, `administrator/src/Service/Task/TaskStaff.php` |
| GitHub - Commit & Pull Request | A guide for contributing, and two downloads: the whole package, or only the files the integrity check reports as changed | `ToolsController::exportPackage()` in `administrator/src/Controller/ToolsController.php`, `administrator/src/Helper/PackageHelper.php` |
| Security | The integrity check of this page | `administrator/src/Helper/IntegrityHelper.php`, `administrator/src/View/Tools/_integrity.php` |
| Reset and clear | **Reset to default** gives Alfa's Options back their installation values. **Clear everything** removes the shop's data and makes a fresh installation. Each opens its own page that lists what would change before anything changes. | `administrator/src/Service/Maintenance/ResetToDefault.php`, `administrator/src/Service/Maintenance/FactoryReset.php` |
| Extensions | The separately installed Alfa extensions: **Clear Data** of an extension, remove it, or remove it with its data | `administrator/src/Controller/ExtensionsController.php` |
| Setup | Run the setup checklist again, and reseed or export the guided tours | `administrator/src/Service/Tools/CoreToolProvider.php` |
| A tab of a plugin | A plugin whose tool names a tab that core does not have gets a tab of its own | `ToolRegistry::extraSurfaces()` |

There is no "About" tab on Tools. **About** is a tab of Alfa's Options (`administrator/src/Field/AboutField.php`).
It shows who made Alfa Commerce, which release is installed, what it runs on and which Alfa extensions are present.

Two of these need more than the Tools permission:

| Action | Permission |
|---|---|
| Reset to default | Use Maintenance Tools (`alfa.tools`) and Joomla's permission to configure the component (`core.admin`) on Alfa Commerce |
| Clear everything | Joomla's permission to open the component in the administrator (`core.manage`) and **Clear Alfa data** (`alfa.data.clear`). No group has this permission after an installation, so only a Super User can run it until a Super User grants it. |

How an extension takes part in Clear Data is on [Admin screen plugins](../plugins/admin-screen-plugins.md).

## Maintenance during Clear everything

While Clear everything runs, and for as long as it is paused or did not finish, Alfa Commerce is **in
maintenance**. The state is one row in the table `#__alfa_maintenance`. That table is never dropped by Clear
everything and is kept by an uninstall, so a reinstall still finds an unfinished clear.

Every way into Alfa asks first whether the shop is in maintenance:

| Who asks | The answer during maintenance |
|---|---|
| The storefront | An error page with status 503: "The shop is being maintained. Please try again in a few minutes." |
| The administrator | A user who may run Clear everything is sent to the Clear everything page. Everyone else gets status 503: "Alfa Commerce is being maintained (Clear everything). Try again in a few minutes." Only the Clear everything page and its own requests are served. |
| The REST API | Status 503 with one error whose title is the same sentence as the administrator's |
| Alfa's modules | Left out of the pages |
| Alfa's Options | Cannot be saved |
| Background work | Waits. A turn of the engine does nothing, and the console command `alfa:tasks:run` ends with exit code 1. |
| Plugins of the Alfa groups | Not loaded, so their listeners are not called |

**What this means for your extension.** While the shop is in maintenance your Alfa plugin is not called, and Alfa's
tables may not exist. If your extension has an entry point of its own that Alfa does not guard (your own component,
your own cron script), check before you touch an Alfa table:

```php
use Alfa\Component\Alfa\Administrator\Service\Maintenance\MaintenanceState;

if (MaintenanceState::active()) {
    return; // The shop is being cleared. Try again later.
}
```

`MaintenanceState::active()` costs one read of one row, at most once in two seconds for each process. When the
state cannot be read it answers yes, because a half cleared shop must never be served.

## The installer gate

Every Alfa extension passes one gate when it is installed or updated: it is refused when Alfa Commerce is missing
or older than the version the extension needs. The gate never refuses anything because the shop is in maintenance,
and it never refuses an uninstall. It is documented on [Plugin overview](../plugins/overview.md), under "The
installer gate".

## How to report a security problem

The rules are in the file `SECURITY.md` in the repository:
[SECURITY.md on GitHub](https://github.com/Easylogic-CO-LP/Alfa-Commerce/blob/main/SECURITY.md). In short:

- **Do not open a public GitHub issue** for a security problem.
- Send an e-mail to **info@easylogic.gr** with the subject `[SECURITY] Alfa Commerce Vulnerability Report`.
- Include a description, the steps to reproduce it, the possible impact, and a suggested fix if you have one.

What the file promises in return:

| Step | Time |
|---|---|
| Your report is acknowledged | Within 48 hours |
| The problem is investigated and assessed | Within 7 days |
| A fix is released | The aim is within 30 days of confirming the problem |
| Credit | Reporters are named in the release notes, unless they prefer not to be |

| In scope | Out of scope |
|---|---|
| SQL injection, cross-site scripting, cross-site request forgery, bypassing login or permissions, remote code execution, exposure of sensitive data, weaknesses in payment processing | Weaknesses in Joomla itself (report them to the Joomla Security Strike Team), denial of service attacks, social engineering, problems in third-party dependencies (report them to their maintainers) |

The same file lists rules for contributors: use Joomla's database driver with bound values and never build SQL from
user input, clean all user input with Joomla's input filter, use the form token on every form submission, never
commit secrets or credentials, and give database operations no more rights than they need.

## What can go wrong

| What you see | The usual cause |
|---|---|
| "This install does NOT match the official release" after you edited a core file | The edit. Move the change into a plugin or an override. |
| The same message and you edited nothing | Investigate. The Security tab itself says that a file added inside the core is unexpected and may be malicious, and that such files come first. |
| "ahead of / customised from the latest official release" | The site runs a build that has no published list of its own. Expected on a development site. |
| "The official file list could not be downloaded" | The server cannot reach the address, the list for this version is not published yet, or PHP has no sodium extension. Nothing is known about the files. |
| "failed signature verification" | The downloaded list is not the publisher's. Check the server's connection. Do not trust the result. |
| An extra file is reported that is yours | You put a file inside one of Alfa's folders. Move it to your own extension. |
| A language file is reported as extra | It lies inside Alfa's own folders. A language pack belongs in Joomla's language folders. |
| The red banner stays after you fixed the files | The last answer is kept for 24 hours. Press Recheck now. |
| A user cannot find Tools | The user lacks the permission Use Maintenance Tools. |
| Your extension's request fails with status 503 | The shop is in maintenance during Clear everything |

## Changed in 2.2.0

- **Since 2.2.0.** Tools > Tasks lists jobs, and Tools > Database Sync hands its long actions to background work.
- **Changed in 2.1.2.** A language file inside Alfa's own folders is reported as an extra file.
- **Changed in 2.1.1.** A language pack's files are no longer reported. When the only differences are extra files,
  the banner says how many. When the list cannot be verified or fetched, the banner says that instead of saying the
  files were changed.
- **Since 2.1.0.** Maintenance during Clear everything, the permission Clear Alfa data, and the installer gate.

## Not documented yet

- The format of the signed list and how a release is signed. That is the publisher's own process.
- Each action of Tools > Database Sync and Tools > Media in detail.
- The steps of Clear everything and Reset to default, and what an extension's Clear Data must do.
- The contents of the contributing guide shown on the tab "GitHub - Commit & Pull Request".
