# TreeGen Backlog

## Broken / Awkward

1. Browser and desktop project workflow still lacks full named-project management.
   Scope:
   - browser and desktop now both support `Recent Projects`
   - project handling is still recent-file/snapshot oriented rather than a true named project workspace
   - there is still no rename/manage workflow for saved project entries
   Status: Open

## Missing

2. Decide whether browser mode should gain named local projects instead of one rolling draft.
   Scope:
   - current browser mode now supports one cached draft and recovery
   - next step would be multiple browser-side drafts/projects if needed
   Status: Open

2. Decide whether desktop project state needs stronger visible affordances.
   Scope:
   - recent files
   - dirty badges in more places
   - clearer saved/autosaved distinction
   Status: Open

## Nice To Have

3. Continue small UI polish passes where behavior is subtle.
   Scope:
   - keep the hamburger menu compact and coherent
   - keep tooltip coverage strong for advanced formatting controls
   - continue tightening the shell as new project features land
   Status: Open

4. Strengthen automated visual regression checks.
   Scope:
   - current QA bundle is useful but still human-reviewed
   - add sharper checks around preview/export consistency and layout regressions
   Status: Open

## Active Behavior Notes

- Undo/redo works in both the browser and the desktop app because it lives in shared `src/app.js`.
- Desktop project save/open/autosave/recovery exists now.
- Browser mode now has automatic local draft caching and recovery.
- Saved YAML now includes explicit `meta.appVersion`, `meta.schemaVersion`, and `meta.exportedAt`.

## Recently Completed

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
