# TreeGen Backlog

## Priority Work

1. Decide whether the first project-manager surface needs a second pass for scale.
   Scope:
   - browser and desktop now have a dedicated `Projects` surface for current actions plus recent entries
   - decide whether larger collections need search, sections, or stronger organization later
   Status: Open

2. Keep hardening preview-shell clipping prevention and its automatic validation.
   Scope:
   - top-edge clipping has recurred multiple times in the preview shell
   - keep preview padding, fit margins, browser-level geometry checks, and QA checks aligned so the SVG preview stays fully visible
   Status: Open

## Missing

3. Keep browser mode file-oriented with local cache and avoid drifting into a separate project model.
   Scope:
   - browser should stay as close to desktop behavior as the platform allows
   - local storage should remain a cache/recovery layer rather than the primary project system
   Status: Open

4. Decide whether desktop project state still needs stronger visible affordances beyond the current status summary.
   Scope:
   - recent files
   - clearer save destinations
   - clearer saved/autosaved distinction
   Status: Open

5. Decide whether persistent QA warnings for generations 3 and 4 should be treated as a formatting problem or an expected demo artifact.
   Scope:
   - current machine QA passes but warns that every generation 3 and 4 box name is being reduced to fit in the demo
   - decide whether to tune the demo data, geometry, or warning thresholds
   Status: Open

## Nice To Have

6. Continue small UI polish passes where behavior is subtle.
   Scope:
   - keep the top menu bar compact and coherent
   - keep tooltip coverage strong for advanced formatting controls
   - continue tightening the shell as new project features land
   Status: Open

## Active Behavior Notes

- Undo/redo works in both the browser and the desktop app because it lives in shared `src/app.js`.
- Desktop project save/open/autosave/recovery exists now.
- Browser mode now has automatic local draft caching and recovery.
- Saved YAML now includes explicit `meta.appVersion`, `meta.schemaVersion`, and `meta.exportedAt`.

## Recently Completed

- `v0.2.56` Added a little more vertical spacing between the two external date lines in generation 4 so those labels no longer read as crowded.
- `v0.2.55` Strengthened the browser QA gate so it now checks preview geometry across multiple scenarios, including hidden-editor, compact viewport, and fullscreen preview states.
- `v0.2.54` Replaced the brittle disclosure-based menu interactions with an explicit top-menu controller, prevented overlapping open panels, and extended browser QA to assert real menu behavior.
- `v0.2.53` Fixed the horizontal menu bar interaction model by switching it to native disclosure behavior so the menu buttons actually open and close their panels reliably.
- `v0.2.52` Replaced the scrolling hamburger with a horizontal menu bar and submenus, added a show/hide editor control, and switched preview clipping protection to measured preview-bound normalization plus stronger shell validation.
- `v0.2.51` Shortened the hamburger by moving more document actions into the `Projects` surface, strengthened preview-shell padding and fit margins, and added automatic QA checks for the preview safety constants.
- `v0.2.50` Turned the old recent-project modal into a dedicated `Projects` surface with current-project actions plus the recent list, keeping the workflow file-oriented in both browser and desktop mode.
- `v0.2.49` Reworked project-status wording so TreeGen now leads with where and when the current tree was last saved or cached, with unsaved changes treated as secondary context instead of the main status message.
- `v0.2.48` Split desktop recent-project removal into a lightweight `Remove from Recent` action and a destructive `Delete from Disk` action with stronger confirmation, while keeping the current tree open but unsaved if its backing file is deleted.
- `v0.2.47` Added hard QA validation for SVG sanity, artifact sizes, and fit-report invariants so CI can reject obviously broken preview/export output before release.
- `v0.2.46` Brought desktop recent-project management closer to browser mode by allowing rename directly from `Recent Projects`, and updated the visible help text to match.
- `v0.2.45` Added the first browser-side named-project step by making `Save As` assign browser project names and allowing rename directly from `Recent Projects`.
- `v0.2.44` Strengthened project-state visibility by surfacing a current-project summary and clearer save/autosave state directly in the main menu, and enabled `Recent Projects` for desktop too.
- `v0.2.43` Extended `Recent Projects` into the desktop app so the same project workflow exists in both browser and desktop runtimes.
- `v0.2.42` Added recent browser projects so browser mode can reopen locally cached project snapshots through a first-class project workflow.
- `v0.2.41` Made browser `Open Project` a first-class workflow and updated the visible user guide/help copy to match the real project actions.
- `v0.2.40` Adds a real `New Project` action and resets project/session state cleanly instead of forcing users to reuse `Clear Tree`.
- `v0.2.39` Defaulted surname inheritance on for non-root boxes, clarified the checkbox-to-field sync behavior, and added explicit `Save`, `Save As`, and autosave controls for project work.
- `v0.2.38` Polished the editor shell again by grouping the hamburger menu into clearer sections, improving tooltip coverage, and making the header project-state badge read more clearly when changes are unsaved.
- `v0.2.37` TreeGen became more project-focused in both browser and desktop mode: browser draft recovery was added, light/dark theme selection now persists, fullscreen control uses a real icon, project state is visible in the header, raw YAML import moved under Advanced, and the inspector now behaves more like a tabbed editor.
- `v0.2.36` Name size controls now behave as a real ceiling; auto-fit can only hold or reduce the requested size.
- `v0.2.35` Date size controls now use the requested size as the target, and inherited surnames remain visible in the disabled surname field.
- `v0.2.34` Desktop project open/save, autosave, and recovery were added.
- `v0.2.33` First/last name editing, surname inheritance, and explicit display-name override were added.
- `v0.2.32` Undo and redo were added.
- `v0.2.31` Fullscreen preview replaced the old Fit button.
- `v0.2.30` Windows desktop text editing was stabilized.

## Historical Milestones

- `v0.2.29` Downloads page uses explicit OS/architecture targets.
- `v0.2.28` Dedicated downloads page, OS detection, SHA-256 display, and 500% zoom ceiling.
- `v0.2.27` Wider generations 0-3 boxes.
- `v0.2.26` Streamlined app shell, smaller inspector, tooltips, first-run help.
- `v0.2.25` Generation 4 fit tightening and platform download modal.
- `v0.2.24` Hyphenated generation 4 surname overflow fix.
- `v0.2.23` Pre-publish validation workflow.
- `v0.2.22` Repeatable QA review bundle.
- `v0.2.21` Per-box text overrides.
- `v0.2.20` Fit feedback in the UI.
- `v0.2.19` Per-generation date prefixes.
- `v0.2.18` Default early-generation `N/M/S` prefixes.
- `v0.2.17` Preview no-clipping fit improvements.
