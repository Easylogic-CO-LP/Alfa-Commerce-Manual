---
sidebar_position: 1
title: CI/CD Workflows
---

# CI/CD Workflows

Alfa Commerce uses GitHub Actions to automatically check every Pull Request. Four workflows run on every PR.

## Overview

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| **Claude PR Review** | PR opened / `@claude` comment | AI reviews code, answers questions |
| **Code Quality** | PR to main/developer | PHP CS Fixer (auto-fix) + PHPStan (bug detection) |
| **Security Scan** | PR/push to main/developer | CodeQL, PHPStan security, TruffleHog |

## What Happens on Every PR

```
Developer opens Pull Request
  │
  ├── PHP CS Fixer ──→ Auto-fixes code style, commits to branch
  ├── PHPStan ────────→ Reports bugs as inline annotations
  ├── Claude Review ──→ AI posts review comments
  └── Security Scan ─→ Checks for vulnerabilities and leaked secrets
```

## Checking Results

On the Pull Request page:

- **Checks tab** — Green (passed) or red (failed) for each check
- **Files changed tab** — Inline annotations on specific lines
- **Conversation tab** — Claude AI review comments

| Icon | Meaning |
|------|---------|
| Green checkmark | Passed |
| Red X | Issues found — click for details |
| Yellow dot | Still running |

## Claude AI Review

Claude automatically reviews every PR. You can also ask questions:

```
@claude is this the right approach for cart calculations?
@claude are there security issues with this code?
@claude explain what this method does
```

## Fixing Issues

| Check | Auto-fixes? | What to do |
|-------|-------------|-----------|
| PHP CS Fixer | Yes | Pull latest from your branch |
| PHPStan | No | Fix the errors, push again |
| Claude | No | Read suggestions, apply what makes sense |
| Security | No | Fix vulnerabilities, rotate leaked secrets |
