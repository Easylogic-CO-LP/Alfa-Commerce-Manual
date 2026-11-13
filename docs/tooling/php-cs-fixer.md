---
sidebar_position: 2
title: PHP CS Fixer
description: What PHP CS Fixer formats in Alfa Commerce, with which rules, and how it commits its fixes to a pull request.
---

# PHP CS Fixer

<AlfaVersion verified="2.2.0" />

## What it does

PHP CS Fixer is a tool that rewrites PHP code so that it follows one set of formatting rules. Alfa Commerce's rules
are in the file `.php-cs-fixer.php` at the root of the repository. On a pull request the tool does not only report:
it fixes the code and commits the fixes to your branch itself.

## When it is used

On every pull request into `main` or `developer`, as the job **PHP CS Fixer** of the workflow
[Code Quality](./workflows#code-quality). It does not run when `main` or `developer` receives commits, and it does
not run for a pull request into another branch.

## What you must provide

Nothing. You may run it yourself before you push, see [Running it yourself](#running-it-yourself).

## What it covers

Files whose name ends in `.php`, in these folders:

| Covered | Not covered |
|---|---|
| `administrator/src/` | The component's `tmpl/`, `layouts/`, `forms/` and `services/` folders |
| `site/src/` | `script.php` and the other files at the root |
| `api/src/` | `libraries/` |
| `plugins/` (whole, with each plugin's `tmpl/` and `services/`) | `scripts/` |
| `modules/` (whole, with each module's `tmpl/`) | Hidden files and version control folders |

## The rules

Two rule sets, then single rules. Risky rules are allowed (`setRiskyAllowed(true)`).

| Rule set | What it is |
|---|---|
| `@PSR12` | The PSR-12 coding style: four spaces, brace placement, spacing of keywords and signatures. |
| `@PHP82Migration` | Rewrites older syntax to the forms of PHP 8.2. |

| Group | Rule | Setting |
|---|---|---|
| Imports | `ordered_imports` | Sorted alphabetically |
| Imports | `no_unused_imports` | On |
| Imports | `global_namespace_import` | Classes are imported. Constants and functions are not. |
| Spacing | `array_indentation` | On |
| Spacing | `binary_operator_spaces` | One space around operators |
| Spacing | `concat_space` | One space around the dot |
| Spacing | `not_operator_with_successor_space` | Off |
| Spacing | `type_declaration_spaces` | On |
| Spacing | `method_argument_space` | Arguments on several lines go one on each line |
| Clean code | `no_extra_blank_lines` | For extra lines, `throw`, `use`, and the three kinds of bracket blocks |
| Clean code | `no_trailing_comma_in_singleline` | On |
| Clean code | `trailing_comma_in_multiline` | In arrays, arguments and parameters |
| Clean code | `no_whitespace_before_comma_in_array` | On |
| Clean code | `trim_array_spaces` | On |
| Clean code | `single_quote` | Single quotes where nothing is inserted into the string |
| Clean code | `cast_spaces` | One space after a cast |
| Strict | `declare_strict_types` | Off |
| Strict | `strict_comparison` | Off |
| Strict | `strict_param` | Off |
| Arrays | `array_syntax` | The short form `[]` |
| Return types | `return_type_declaration` | No space before the colon |
| Return types | `nullable_type_declaration_for_default_null_value` | On |
| PHPDoc | `phpdoc_align` | Left |
| PHPDoc | `phpdoc_scalar` | On |
| PHPDoc | `phpdoc_single_line_var_spacing` | On |
| PHPDoc | `phpdoc_trim` | On |
| PHPDoc | `phpdoc_types` | On |
| PHPDoc | `no_empty_phpdoc` | On |
| PHPDoc | `no_superfluous_phpdoc_tags` | On. `mixed` is allowed and `inheritdoc` is kept. |

Two things that surprise contributors:

- The three strict rules are switched off on purpose. The configuration's comment gives the reason: Joomla
  compatibility. The tool will not add `declare(strict_types=1)` and will not turn `==` into `===`.
- `no_superfluous_phpdoc_tags` removes a `@param` or `@return` line that only repeats what the signature already
  says. A line that adds a description stays.

## Running it yourself

The workflow sets up PHP 8.2 and asks for the tool `php-cs-fixer` without naming a version, so the repository pins
none. Install PHP CS Fixer the way its own documentation describes, then run it from the root of the repository.
From the next promotion of `developer` to `main` (with 2.2.1, which is not released), the workflow sets up PHP 8.3;
it still names no version of the tool.

The workflow's command, which changes the files and prints each change:

```bash
php-cs-fixer fix --config=.php-cs-fixer.php --allow-risky=yes --diff
```

The same command with the tool's dry run option added, to see what would change without changing anything:

```bash
php-cs-fixer fix --config=.php-cs-fixer.php --allow-risky=yes --diff --dry-run
```

The tool writes a cache file, `.php-cs-fixer.cache`. Git ignores it.

## What happens next

On a pull request the job does this, in order:

1. It checks out the branch of your pull request.
2. It runs the command above.
3. If files changed, it commits them to your branch. The author is `github-actions[bot]` and the message is
   `style: auto-fix code style with PHP CS Fixer`.

You then have a commit on GitHub that you do not have on your computer. Pull before you commit again.

## What can go wrong

| What you see | Why | What to do |
|---|---|---|
| Your push is refused because the branch on GitHub is ahead | The job committed its fixes. | Pull, then push. |
| A PHPDoc line you wrote is gone | It only repeated the signature. | Nothing, or add a description to the line so that it carries information. |
| The check is red | A step broke: the tool could not run, or the commit could not be made. Formatting problems alone never turn it red. | Open the run and read the failing step. |
| A local run changes other things than the job did | Your version of the tool differs from the one the job installed that day. | Compare the versions. |

## Not documented yet

- Whether the job can commit its fixes to a pull request that comes from a fork. The workflow file does not settle
  it. From the next promotion of `developer` to `main`, the job checks out the branch from the pull request's own
  repository, so a fork's branch is found; whether it can then push to that fork was not tried.
- Which version of PHP CS Fixer a run installs. The workflow names none.
