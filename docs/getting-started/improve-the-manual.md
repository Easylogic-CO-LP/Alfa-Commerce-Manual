---
title: Help improve this Manual
description: How to correct or add to this Manual, from one word to a new page, and what a good change looks like.
---

# Help improve this Manual

This Manual has its own repository on GitHub,
[Easylogic-CO-LP/Alfa-Commerce-Manual](https://github.com/Easylogic-CO-LP/Alfa-Commerce-Manual). Each page is a
Markdown file in its `docs` folder. Anyone with a GitHub account can propose a change, and every change is a pull
request.

## Edit a page on GitHub

1. At the bottom of the page, select **Edit this page**. GitHub opens the page's file in its editor. If you cannot
   write to the repository, GitHub first asks you to fork it: accept.
2. Make your change.
3. Select **Commit changes**, say in one line what you changed, and select **Propose changes**.
4. On the next page, select **Create pull request**.

A larger change, several pages at once or a new page, is easier from a copy on your computer. The repository's
`README.md` gives the three commands: `npm ci` installs, `npm start` shows the Manual with live reload, and
`npm run build` builds it. The build stops on a link that leads nowhere, so run it before you open the pull request.

## What a good change looks like

- **The present tense, with no version words.** A page says what Alfa Commerce does now. It tells no history and
  names no release. The only version numbers are the requirements, such as the Joomla and PHP a shop needs.
- **Plain words.** Short sentences, and the names the screens use.
- **One subject per pull request.** A fix to the cart page and a new section on taxes are two pull requests.

## What happens next

A maintainer reads the pull request. Once it is merged, the Manual is built and published by itself, and the change
is live a few minutes later.
