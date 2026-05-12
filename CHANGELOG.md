# Changelog

## 0.2.17 - 2026-05-11

- changed preview fitting to use a larger preview-only margin and a top-aligned fit scroll so the full SVG is shown more reliably
- increased the preview-only padded viewBox margin used by the browser preview
- refreshed the shipped demo subtitle text so it no longer refers to a placeholder crest

## 0.2.16 - 2026-05-11

- changed the late-generation vertical name fitter to prefer two wrapped lines before falling back to a single truncated line
- slightly increased the starting late-generation fitting scale so generations 5 and 6 use more of the available box height
- reviewed the current demo render and added a backlog item for the stale title-box subtitle copy

## 0.2.15 - 2026-05-11

- moved generation 5 and 6 maternal-side external dates to the left side of their connector line
- kept late-generation father dates aligned on the left side as before so the top rows read consistently
- verified the change with fresh PNG and PDF renders

## 0.2.14 - 2026-05-11

- changed the generation 4 name fitter to prefer three wrapped lines before shrinking
- increased the effective starting size for generation 4 box names so those boxes use more of their height
- kept the fit constrained to the box width and height while preserving the denser generation 4 layout

## 0.2.13 - 2026-05-11

- changed the horizontal name fitter so generations 1-3 prefer three wrapped name lines before shrinking
- increased the effective starting size for generation 1-3 name fitting to use more of the box height
- kept the fitter constrained to the box so the larger names still render inside the borders

## 0.2.12 - 2026-05-11

- updated the built-in demo so generation 1-3 child annotations show full names and full dates
- reduced early-generation demo child counts so the full child labels remain readable
- updated the shipped placeholder YAML to match the fuller early-generation child labels

## 0.2.11 - 2026-05-11

- added stable GitHub Release asset aliases so the latest release has exact per-OS download URLs
- updated the README to link directly to Windows, macOS, and Linux downloads
- marked the release-pipeline backlog item verified

## 0.2.10 - 2026-05-11

- fixed the release workflow so the publish-assets job checks out the repo and sets `GH_REPO` before `gh release upload`
- updated the backlog status for the release-pipeline issue

## 0.2.9 - 2026-05-11

- added `TODO.md` with the current renderer and preview backlog
- removed the title-box divider line

## 0.2.8 - 2026-05-11

- aligned parent date labels to the connector anchor under each box
- added optional single-character prefixes for birth, death, and marriage dates
- shortened the shipped demo child annotations and kept demo box notes empty
- simplified the public README to a single demo link and a single desktop download link

## 0.2.7 - 2026-05-11

- simplified the public README and moved build/release details into `DEVELOPER.md`
- shortened the shipped demo child annotations and removed demo box notes
- nudged preview margin and demo fit behavior again to reduce top-edge clipping
- kept the Windows desktop rebuild fix and updated the local release metadata

## 0.2.6 - 2026-05-11

- fixed Windows desktop rebuild by running Electron build tooling through `cmd.exe` on Windows runners
- changed box fitting to prefer wrapping names to up to three lines before shrinking the font
- simplified the rendered title box to title, subtitle, and optional crest
- added browser editing for marriage dates and kept deterministic export checks for the updated layout

## 0.2.5 - 2026-05-11

- moved generation 0-3 dates outside the boxes with smaller external labels
- added marriage dates above spouse connector lines with generation-aware formatting
- switched blank/default people from `?` markers to empty values
- added marriage-date editing in the browser UI and YAML support for `birth`, `death`, and `marriageDate`

## 0.2.4 - 2026-05-11

- changed the demo family to use longer Italian-style names and surnames
- improved generation 4 box fitting for longer wrapped names
- added visible version info in the UI and an About modal with version/runtime details

## 0.2.3 - 2026-05-11

- scrubbed hardcoded repo-owner references from tracked files
- replaced repo metadata fields with neutral placeholder values
- removed the old binary favicon and switched fully to generated PNG favicon assets
- added raster metadata stripping for tracked image assets
- fixed the release workflow so release creation checks out the repo before generating notes

## 0.2.2 - 2026-05-11

- added generated raster logo, favicon, and desktop app icon assets from `treegen.png`
- switched the site header and favicon set to the new TreeGen branding
- updated desktop packaging to use the generated icon assets
- added a repeatable logo asset generation script

## 0.2.1 - 2026-05-11

- added native desktop file-open and file-save dialogs with browser fallback
- added GitHub Pages demo deployment workflow
- added tagged desktop release workflow that uploads built assets to GitHub Releases
- added static Pages build script and hosted-demo capability detection
- added automatic latest-release download link for standard GitHub Pages hosting

## 0.2.0 - 2026-05-11

- added Electron desktop wrapper with its own app window
- kept local deterministic export pipeline for PDF, PNG, JPG, and SVG
- refactored the local server into reusable startup helpers for browser and desktop use
- added platform build scripts for macOS, Windows, and Linux packaging
- prepared a GitHub Actions workflow for future multi-platform release builds
