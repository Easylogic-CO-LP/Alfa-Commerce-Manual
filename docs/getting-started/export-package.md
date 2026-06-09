---
sidebar_position: 5
title: Package Export Tool
---

# Package Export Tool

If you developed on a live install rather than the repo, **Components → Alfa Commerce → Tools → Export package** turns
that install back into the source-repo layout so your changes diff cleanly for a pull request.

- It reads `alfa.xml` as the source of truth and reassembles every declared file (component, plugins, modules, media,
  languages) into the flat `site` / `administrator` / `api` repo structure.
- **Changed-only (`&changed=1`)** exports just the files that differ from the official release — for a minimal PR.
- **Bundled `libraries/` are excluded** (a live install can't reproduce an installable library folder), so the export is
  a **source / PR artifact**, not a guaranteed-installable ZIP — add library folders from the repo by hand to test it.
- Before exporting a structural change, create the artifacts it needs: `sql/updates/mysql/<version>.sql`, the
  removed-files list `files/removed/<version>.json`, and the `alfa.xml` version bump (the Tools screen reminds you).
