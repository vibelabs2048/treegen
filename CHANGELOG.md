# Changelog

## 0.2.45 - 2026-05-12

- made browser `Save As` define the logical project filename so browser-side saved work starts behaving more like named projects instead of anonymous snapshots
- added browser-side rename from `Recent Projects`
- updated the visible help text and README so the user-facing guide reflects the new browser naming behavior

## 0.2.44 - 2026-05-12

- surfaced a clearer current-project summary directly in the main menu so users can see the active project, saved state, and last meaningful save/autosave timestamp without guessing
- enabled `Recent Projects` for desktop in the same menu path instead of leaving it browser-only
- tightened project-state labeling across browser and desktop modes so save state is easier to read at a glance

## 0.2.43 - 2026-05-12

- extended `Recent Projects` into the desktop app by tracking recent project files in app data and letting users reopen or remove them from the same modal used in browser mode
- kept the browser and desktop project workflows more aligned by making `Recent Projects` a real first-class concept in both runtimes
- updated the visible help text and README so the user guide reflects the new cross-runtime recent-project behavior

## 0.2.42 - 2026-05-12

- added a `Recent Projects` browser workflow backed by local storage so browser mode can reopen cached project snapshots without routing through raw YAML import
- made the browser project status label show the active project filename when one is known
- kept the recent-project flow explicitly browser-only and visible in the UI instead of silently overloading autosave/draft behavior

## 0.2.41 - 2026-05-12

- made browser `Open Project` a real project action instead of routing users through the raw YAML import flow
- added unsaved-work confirmation before replacing the current browser project with a newly opened file
- updated the in-app help modal and README so the visible user guide matches the current project workflow: `New Project`, `Open Project`, `Save`, `Save As`, and `Autosave`
- widened and slightly enlarged generations 0-3 so the early tree uses more of the page and leaves less dead white space between boxes

## 0.2.40 - 2026-05-12

- added a real `New Project` action so users can start a blank tree explicitly instead of reusing `Clear Tree`
- made `New Project` reset project/session state cleanly, including current project path, autosave markers, and browser-draft markers
- kept `Load Demo` separate from blank-project creation so the project menu reads more like a normal application

## 0.2.39 - 2026-05-12

- turned `Inherit Linked Surname` on by default for non-root boxes and made the surname field/checkbox transition clearer by preserving the currently inherited surname when inheritance is turned off
- added explicit `Save` and `Save As` actions to the project menu instead of relying on one implicit save path
- added a visible autosave toggle, enabled by default, so automatic project saving can be controlled in both desktop and browser modes
- let browser mode use `Save` and `Save As` to download the current TreeGen project YAML directly instead of forcing users through export for basic project saving

## 0.2.38 - 2026-05-12

- grouped the hamburger menu into clearer Project, Display, and Help sections so the shell reads more like an application
- converted the inspector header into tab-only navigation so the active tab itself is the only visible section title
- tightened tooltip coverage around version, project state, zoom controls, and surname inheritance behavior
- added a visible dirty-state marker to the header project label and improved project-state titles for browser drafts and desktop sessions

## 0.2.37 - 2026-05-12

- made the app more project-focused by moving raw YAML import under an Advanced submenu while keeping project open/save/export prominent
- added browser-side draft caching and recovery so the hosted and local browser versions can restore recent work automatically
- added persistent light/dark mode and visible project-state status in the header
- replaced the fullscreen preview control with a real inline SVG icon and cleaned up the inspector so the active tab title is shown once instead of being duplicated
- started writing explicit YAML `meta` information for app version, schema version, and export timestamp

## 0.2.36 - 2026-05-12

- changed name-size fitting so the requested name size is now a real ceiling instead of a boosted starting hint
- removed generation-specific size boosts from the box and vertical name fitters so auto-fit can only hold or reduce the requested size
- updated tooltips and fit-report text to describe name size as a maximum target rather than an open-ended hint

## 0.2.35 - 2026-05-12

- changed external date sizing so the requested generation date size is now the actual target across the renderer
- fit external dates down only when the available date lane is too narrow, and updated fit-report wording to reflect that behavior
- when surname inheritance is enabled, the inherited surname now stays visible in the disabled surname field so the editor state is clearer

## 0.2.34 - 2026-05-12

- added desktop-only project open/save actions in the main menu
- added desktop autosave into the TreeGen app-data project directory with startup recovery prompt
- kept browser mode clean by leaving project-file and autosave behavior disabled outside the desktop app

## 0.2.33 - 2026-05-12

- replaced the single display-name editor with separate first-name and last-name fields
- added per-box surname inheritance and explicit custom display-text override controls
- kept YAML backward-compatible with older `name:` input while exporting the new structured name fields

## 0.2.32 - 2026-05-12

- added first-pass undo and redo controls in the main menu
- implemented bounded full-state history snapshots for tree edits, imports, clear/reset actions, style changes, and crest changes
- kept native text-field undo untouched by avoiding global keyboard shortcut interception in this first pass

## 0.2.31 - 2026-05-12

- replaced the old Fit button with a fullscreen-preview control that opens a dedicated modal preview
- added separate fullscreen zoom controls with drag-to-pan behavior and automatic fit-to-window on open and resize
- kept the normal editor preview fit behavior for load and resize while freeing the toolbar from the old fit button

## 0.2.30 - 2026-05-12

- fixed the Windows desktop editing loop so text inputs are no longer re-hydrated on every keystroke while the user is typing
- kept live preview, YAML sync, and renderer updates active during direct edits without resetting the active field
- marked the Windows Display Name editing backlog item done after aligning browser and desktop edit behavior

## 0.2.29 - 2026-05-12

- refined the downloads page so operating system and architecture are explicit
- added a concrete target selector for Windows x64, macOS arm64, and Linux x64
- changed the downloads page to default to the current device target and show only the selected target's links

## 0.2.28 - 2026-05-12

- added a real `downloads.html` page for the hosted web version with direct navigation back to the editor
- changed the menu-bar Downloads action to navigate to the downloads page instead of opening an in-app modal
- added OS auto-detection, manual platform selection, and on-demand SHA-256 digest display for desktop downloads
- raised the preview zoom ceiling from 300 percent to 500 percent
- fixed the hamburger menu so it stays collapsed by default until opened
- added an author link in the shared About modal pointing to `https://vibelabs2048.github.io/`

## 0.2.27 - 2026-05-12

- widened generations 0-3 and synced the browser-side preview geometry with the shared renderer so early-generation boxes use more of the available width consistently

## 0.2.26 - 2026-05-12

- replaced the wide top action row with a compact hamburger menu and removed the header logo/description to free more preview space
- merged the inspector tabs into the inspector itself, tightened the inspector width, and made the active section explicit
- added first-pass tooltips across the main editor controls, including clearer explanations for per-box inheritance fields
- raised the preview zoom slider ceiling to 300 percent
- added a first-run help modal for the browser demo and desktop app

## 0.2.25 - 2026-05-12

- tightened generation 4 name fitting again with a real safety margin so long surnames stay inside the box in the hosted browser demo
- replaced the top-bar desktop download link with a download modal that offers direct Windows, macOS, and Linux packages
- added client-side OS detection so the hosted demo recommends the best desktop download for the current device

## 0.2.24 - 2026-05-12

- fixed stale version/example strings in the About modal, developer notes, and release workflow input description
- added new backlog items documenting the remaining size-control semantics issues surfaced by the QA fit report
- tightened generation 4 name wrapping so long hyphenated surnames break at hyphen boundaries before they can overflow the box

## 0.2.23 - 2026-05-12

- added a non-publishing `Preview Validation` GitHub Actions workflow for pull requests and manual runs
- the preview workflow builds the Pages bundle, the QA review bundle, and desktop packages for macOS, Windows, and Linux as workflow artifacts only
- updated developer notes to document the safer pre-publish validation path

## 0.2.22 - 2026-05-12

- added `npm run qa:review` to build the static demo and generate a review bundle with SVG, PNG, PDF, and a fit report
- added `build/review-artifacts.js` so formatting changes can be evaluated from one repeatable artifact set instead of ad hoc exports
- documented the QA review bundle in `DEVELOPER.md`

## 0.2.21 - 2026-05-12

- added per-box name and date size/color overrides in the Selected Person panel, with blank meaning inherit from generation
- wired those overrides through browser state, YAML import/export, and the shared renderer
- updated the fit report so explicit per-box overrides do not get misreported as auto-fit shrinkage

## 0.2.20 - 2026-05-12

- added generation-level fit feedback in the Format panel so the UI now shows when auto-fit is reducing the effective name or date size
- reused the shared renderer’s fitting logic to report requested size versus actual applied size for the selected generation
- corrected the prefix input placeholders so birth/death/marriage match `N` / `S` / `M`

## 0.2.19 - 2026-05-12

- changed date prefixes from one global setting to per-generation settings in the browser model, YAML serializer, and shared renderer
- kept backward compatibility with older YAML that only had one global `datePrefixes` block
- wired the existing generation selector so the prefix inputs now edit the selected generation instead of one global value

## 0.2.18 - 2026-05-12

- changed the default date prefixes to `N` for birth, `M` for marriage, and `S` for death
- made those prefixes generation-aware so they render only on generations 0-3 and are suppressed on generations 4-6
- kept the current global prefix model in place while documenting the remaining per-generation editing issue in the backlog

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
