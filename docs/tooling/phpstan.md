---
sidebar_position: 3
title: PHPStan
description: What PHPStan analyses in Alfa Commerce, what it is told to ignore, what the baseline is, and why any finding fails the check.
---

# PHPStan

<AlfaVersion verified="2.2.1" />

## What it does

PHPStan reads PHP code without running it and reports likely mistakes: a method called on something that may not be
an object, an argument of the wrong type, a class that does not exist. This is called static analysis. Its settings
for Alfa Commerce are in `phpstan.neon` at the root of the repository.

:::caution Any finding fails the check
Any finding PHPStan reports fails the job. It runs on PHP 8.3 with an exact PHPStan release (2.3.5) and an exact
Joomla release (6.2.0), so the findings do not change by themselves. No check is required for a merge yet.
:::

Two messages PHPStan gives on the code, both recorded in the baseline:

```text
Cannot call method priceLineConfig() on bool|Joomla\CMS\MVC\Model\BaseDatabaseModel.
Using nullsafe property access "?->id_payment" on left side of ?? is unnecessary. Use -> instead.
```

## When it is used

As the job **PHPStan** of the workflow [Code Quality](./workflows#code-quality): on every pull request into `main`
or `developer`, and again when `main` or `developer` receives commits.

## What you must provide

Nothing to make it run. What is expected of you is to open the run and read what it reports about the code you
changed.

## What it analyses

| Setting | Value | In plain words |
|---|---|---|
| `level` | 5 | How strict PHPStan is. A higher level reports more. |
| `phpVersion` | 80300 | The code is judged as PHP 8.3 code, the oldest PHP Alfa Commerce supports, whatever PHP runs the tool. A run on your computer and a run on GitHub therefore judge the code by the same PHP version. |
| `paths` | `administrator/src`, `site/src`, `api/src`, `plugins`, `modules` | The folders that are analysed. `script.php`, `libraries/` and `scripts/` are not. |
| `treatPhpDocTypesAsCertain` | false | A type written only in a PHPDoc comment is not taken as proof. |
| `reportUnmatchedIgnoredErrors` | false | An ignore rule or a baseline entry that no longer matches anything is not reported. |

### What is left out, and why

The reasons are the ones the configuration's comments give.

| Excluded path | Why |
|---|---|
| `*/tmpl/*` | View templates. They are HTML scripts that work with variables handed to them. They present, they hold no logic. |
| `*/layouts/*` | Layout files. The same: they draw the data they are given. |
| `*/*BACKUP*` | Stray backup files of a developer. Dead code, not maintained. |

Language files are not PHP, so PHPStan never reads them.

### Which messages are ignored, and why

| Ignored message | How many patterns | Why |
|---|---|---|
| "Access to an undefined property", everywhere | 1 | Joomla's models and views hand out values through magic access, which PHPStan cannot follow. This pattern is broad: it also hides a mistyped property name. |
| "Call to an undefined method" on nine Joomla types | 9 | The method exists on the class that really runs, for example the site application or the database driver, and not on the interface or base class the code names as the type. |
| "unknown class" for the phone number library | 2 | The library is bundled with the telephone field plugin and is not inside the Joomla folder PHPStan scans. |

The nine Joomla types are `BaseDatabaseModel`, `CMSApplicationInterface`, `DatabaseInterface`, `Document`,
`ComponentInterface`, `PluginInterface`, `Language`, `FormField` and `SessionInterface`.

### How Joomla is made available

Alfa Commerce extends Joomla's classes, and the repository holds no copy of Joomla and no Composer dependencies. So
before each analysis Joomla is downloaded and unpacked into a folder named `joomla` at the root
of the repository. The setting `scanDirectories` points PHPStan at that folder. Git ignores the folder. The release is
Joomla 6.2.0, taken by its address and checked against the sha256 that Joomla publishes.

- On GitHub the job downloads it in a step of its own, on every run.
- On your computer the script `scripts/phpstan-fetch-joomla.sh` does the same. It needs `curl`, `unzip` and
  `sha256sum` or `shasum`, and it replaces the `joomla` folder each time.

A small file, `.github/phpstan-bootstrap.php`, defines the constants that Joomla defines only when it runs:
`_JEXEC`, `DS`, `JDEBUG` and the `JPATH_` constants.

## The baseline

A **baseline** is a list of findings that already existed when the list was made. PHPStan stays silent about a
finding that is on the list, and reports any finding that is not. The list is the file `phpstan-baseline.neon`,
which `phpstan.neon` includes.

| What is counted | Count |
|---|---|
| Entries (one message in one file) | 424 |
| Findings they cover (an entry counts how often its message occurs in the file) | 641 |
| Files with at least one entry | 183 |

The most frequent kinds are a wrong argument type (81 entries), an unnecessary nullsafe access (38), a class that is
not found (30), a wrong number of arguments (29) and a method called on something that may not be an object (26).

The intention stated in the configuration is to shrink the list over time: fix findings, then make the list again.
The configuration's comment gives the command:

```bash
scripts/phpstan-fetch-joomla.sh && phpstan analyse --generate-baseline
```

Do not make the baseline again only to silence a finding of your own change. That hides the finding from everyone
after you.

## Running it yourself

Install PHPStan the way its own documentation describes; use 2.3.5 to see what the job sees. Then, from the root of
the repository:

```bash
# 1. Download Joomla 6.2.0 into ./joomla
scripts/phpstan-fetch-joomla.sh

# 2. Analyse
phpstan analyse --configuration=phpstan.neon --memory-limit=1G
```

The job installs PHPStan 2.3.5 and checks the file against the release's sha256.

The job on GitHub runs the same second command with one more option, which formats the output for GitHub:

```bash
phpstan analyse --configuration=phpstan.neon --memory-limit=1G --error-format=github
```

## What happens next

The job sets up PHP 8.3, downloads Joomla 6.2.0, and runs PHPStan 2.3.5. PHPStan prints its findings on the run's
page, and any finding turns the check red. A green check means PHPStan found nothing beyond the baseline.

What this means for you:

- A red PHPStan check: open the run from the pull request's list of checks and read the output of the step
  **Run PHPStan**.
- PHPStan fixes nothing by itself. A finding in code you changed is yours to fix and push.
- The AI review is told not to flag findings of this kind.



## What can go wrong

| What you see | Why | What to do |
|---|---|---|
| Very many "class not found" findings on your computer | The `joomla` folder is missing or empty. | Run `scripts/phpstan-fetch-joomla.sh` first. |
| The script stops | `curl`, `unzip`, or `sha256sum` and `shasum` are missing, the download failed, or the file's sha256 differs. | Install the missing tool, check the connection, run it again. |
| The check is red | PHPStan found something not in the baseline, or a step broke, for example the Joomla download. | Open the run and read the failing step. |
| Findings on your computer differ from the job's | Another PHPStan version than 2.3.5, or another Joomla than 6.2.0, in the `joomla` folder. | Use the versions the job uses. |
| A mistyped property name is not reported | "Access to an undefined property" is ignored everywhere. | Test the code path. PHPStan will not catch this one. |

## A note on @since tags

The `@since` tags in the analysed folders name many different releases. They are not set to one value across the
project, so a tag does not tell when a piece of code last changed.

## Not documented yet

- Whether the findings also show as notes on the changed lines of a pull request. The workflow asks PHPStan for
  GitHub's output format; what GitHub then shows is not part of the code.
