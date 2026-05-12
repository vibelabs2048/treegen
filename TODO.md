# TreeGen Backlog

## Priority Order

1. Windows desktop build: verify why Display Name may not be editable. If intentionally locked in some state, gray it out and explain why; otherwise fix the interaction bug.
   Status: Done in v0.2.30

2. Replace the current Fit button with a fullscreen-preview control. Use a fullscreen-style icon, open a modal focused on the SVG preview, keep only zoom controls in that view, maximize the preview area, and add a tooltip.
   Status: Done in v0.2.31

3. Add undo and redo for editing actions.
   Status: Done in v0.2.32

4. Split first and last name editing, add optional paternal surname inheritance, and allow an explicit arbitrary display-name override.
   Status: Open

5. Add project save and autosave behavior, including desktop-side cached recovery under a local TreeGen app directory.
   Status: Open

6. Date-size controls are still semantically misleading. External date rendering uses generation-specific fallback sizes around 4.4-4.6pt, so the requested date size is not currently acting like a real target across all generations.
   Status: Open

7. Name-size controls can currently exceed the requested value in some generations because the fitter boosts the starting size before shrinking. Decide whether the requested size should be a target hint or a hard ceiling.
   Status: Open

8. Refine the downloads page so OS and architecture are explicit. Show a selector for concrete targets such as Windows x64, macOS arm64, and Linux x64/AppImage (or whatever the actual release artifacts support), default it from the current device, and show only the links for the selected target.
   Status: Done in v0.2.29

9. Add a real downloads page to the hosted web version. It should be directly navigable, show Windows/macOS/Linux options with platform symbols, display the release version being downloaded, provide a clear way back to the editor/home screen, auto-detect the user's operating system, allow manual platform selection, and expose the GitHub-provided SHA-256 digest on demand.
   Status: Done in v0.2.28

10. Raise the preview zoom ceiling from 300 percent to 500 percent across the slider, numeric input, and zoom controls.
   Status: Done in v0.2.28

11. Fix the release pipeline failure in the publish step.
   Error:
   `Run gh release upload "$TAG" release-assets/* --clobber`
   `failed to run git: fatal: not a git repository (or any of the parent directories): .git`
   Status: Done and verified in GitHub Actions

10. Refresh the shipped demo title-box subtitle so it no longer says "placeholder crest".
   Status: Done in v0.2.17

11. Make date prefixes generation-aware by default:
    use `N` for birth, `M` for marriage, and `S` for death on generations 0-3 only,
    and suppress those prefixes on generations 4-6 by default.
    Status: Done in v0.2.18

12. Prefix editing is still global. Adding or removing `N`, `M`, and `S` should work per generation in the UI, YAML model, and renderer.
    Status: Done in v0.2.19

13. Font-size controls need clearer limit feedback. The auto-fit behavior is useful, but the UI should show when a requested size is being capped by box-fit logic instead of letting the control imply it is fully applied.
    Status: Done in v0.2.20

14. Evaluate per-box text styling overrides. Long names vary enough that some boxes may need individual font size and color overrides beyond generation-level defaults.
    Status: Done in v0.2.21

15. Add a better change-evaluation workflow. TreeGen needs a more deliberate way to inspect formatting changes across preview, SVG, PNG, and PDF before calling a change good.
    Status: Done in v0.2.22

16. Add a safer pre-publish release path for the demo and desktop artifacts. The goal is to validate a production-like Pages build and release package before publishing to official GitHub Pages and tagged releases.
    Status: Done in v0.2.23

17. Date-size controls are still semantically misleading. External date rendering uses generation-specific fallback sizes around 4.4-4.6pt, so the requested date size is not currently acting like a real target across all generations.
    Status: Open

18. Name-size controls can currently exceed the requested value in some generations because the fitter boosts the starting size before shrinking. Decide whether the requested size should be a target hint or a hard ceiling.
    Status: Open

19. Generation 4 long hyphenated surnames can still overflow even after the three-line fitter runs. Break those names at hyphen boundaries before shrinking.
    Status: Done in v0.2.24

20. Rework the app shell for more chart space. Replace the wide top menu with a compact hamburger menu, remove the header logo/description, and shrink the header footprint.
    Status: Done in v0.2.26

21. Merge the editor tab chooser into the inspector itself and reduce the inspector footprint so the preview gets more width.
    Status: Done in v0.2.26

22. Normalize menu names and make the selected inspector section visually explicit.
    Status: Done in v0.2.26

23. Add broader tooltips across menu items and editor fields, especially where "inherit" and generation-scoped controls are not obvious.
    Status: First pass done in v0.2.26

24. Windows desktop build: verify why Display Name may not be editable. If intentionally locked in some state, gray it out and explain why; otherwise fix the interaction bug.
    Status: Done in v0.2.30

25. Increase preview zoom controls to at least 300 percent everywhere, including the slider ceiling.
    Status: Done in v0.2.26

26. Add a simple first-run help modal for the desktop app and browser demo, shown only on initial launch.
    Status: Done in v0.2.26

27. Add undo and redo for editing actions.
    Status: Open

28. Split first and last name editing, add optional paternal surname inheritance, and allow an explicit arbitrary display-name override.
    Status: Open

29. Add project save and autosave behavior, including desktop-side cached recovery under a local TreeGen app directory.
    Status: Open

30. Widen generation 0-3 boxes slightly to use available width more effectively.
    Status: Done in v0.2.27

31. Remove the TreeGen logo from the menu bar.
    Status: Done in v0.2.26

32. Add an author/about link in the shared About view that points to the main site at `https://vibelabs2048.github.io/`.
    Status: Done in v0.2.28
