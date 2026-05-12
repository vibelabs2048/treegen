# Changelog

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
