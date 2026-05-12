# TreeGen Backlog

## Priority Order

1. Fix the release pipeline failure in the publish step.
   Error:
   `Run gh release upload "$TAG" release-assets/* --clobber`
   `failed to run git: fatal: not a git repository (or any of the parent directories): .git`
   Status: Done and verified in GitHub Actions

2. Generation 1, 2, and 3 child annotations should show full child name and full date.
   Status: Done in v0.2.12

3. Generation 1, 2, and 3 should use all three lines in the box for names with a larger default font.
   Status: Done in v0.2.13

4. Generation 4 should use all three lines in the box before overflowing. Ensure wrapping works correctly.
   Status: Done in v0.2.14

5. Generation 5 and 6 maternal-side birth/death dates should move to the left side of their tree line to avoid overlap.
   Status: Done in v0.2.15

6. Generation 5 and 6 should wrap to two lines instead of one to avoid overflow.
   Status: Done in v0.2.16

7. The SVG preview is still vulnerable to top-edge clipping. Add a general fit/margin solution so the full SVG is always shown.
   Status: Done in v0.2.17

8. Remove the line in the title box.
   Status: Done in v0.2.9

9. Refresh the shipped demo title-box subtitle so it no longer says "placeholder crest".
   Status: Done in v0.2.17

10. Make date prefixes generation-aware by default:
    use `N` for birth, `M` for marriage, and `S` for death on generations 0-3 only,
    and suppress those prefixes on generations 4-6 by default.
    Status: Done in v0.2.18

11. Prefix editing is still global. Adding or removing `N`, `M`, and `S` should work per generation in the UI, YAML model, and renderer.
    Status: Done in v0.2.19

12. Font-size controls need clearer limit feedback. The auto-fit behavior is useful, but the UI should show when a requested size is being capped by box-fit logic instead of letting the control imply it is fully applied.
    Status: Done in v0.2.20

13. Evaluate per-box text styling overrides. Long names vary enough that some boxes may need individual font size and color overrides beyond generation-level defaults.
    Status: Done in v0.2.21

14. Add a better change-evaluation workflow. TreeGen needs a more deliberate way to inspect formatting changes across preview, SVG, PNG, and PDF before calling a change good.
    Status: Done in v0.2.22

15. Add a safer pre-publish release path for the demo and desktop artifacts. The goal is to validate a production-like Pages build and release package before publishing to official GitHub Pages and tagged releases.
    Status: Done in v0.2.23

16. Date-size controls are still semantically misleading. External date rendering uses generation-specific fallback sizes around 4.4-4.6pt, so the requested date size is not currently acting like a real target across all generations.
    Status: Open

17. Name-size controls can currently exceed the requested value in some generations because the fitter boosts the starting size before shrinking. Decide whether the requested size should be a target hint or a hard ceiling.
    Status: Open

18. Generation 4 long hyphenated surnames can still overflow even after the three-line fitter runs. Break those names at hyphen boundaries before shrinking.
    Status: Done in v0.2.24

19. Rework the app shell for more chart space. Replace the wide top menu with a compact hamburger menu, remove the header logo/description, and shrink the header footprint.
    Status: Done in v0.2.26

20. Merge the editor tab chooser into the inspector itself and reduce the inspector footprint so the preview gets more width.
    Status: Done in v0.2.26

21. Normalize menu names and make the selected inspector section visually explicit.
    Status: Done in v0.2.26

22. Add broader tooltips across menu items and editor fields, especially where "inherit" and generation-scoped controls are not obvious.
    Status: First pass done in v0.2.26

23. Windows desktop build: verify why Display Name may not be editable. If intentionally locked in some state, gray it out and explain why; otherwise fix the interaction bug.
    Status: Open

24. Increase preview zoom controls to at least 300 percent everywhere, including the slider ceiling.
    Status: Done in v0.2.26

25. Add a simple first-run help modal for the desktop app and browser demo, shown only on initial launch.
    Status: Done in v0.2.26

26. Add undo and redo for editing actions.
    Status: Open

27. Split first and last name editing, add optional paternal surname inheritance, and allow an explicit arbitrary display-name override.
    Status: Open

28. Add project save and autosave behavior, including desktop-side cached recovery under a local TreeGen app directory.
    Status: Open

29. Widen generation 0-3 boxes slightly to use available width more effectively.
    Status: Open

30. Remove the TreeGen logo from the menu bar.
    Status: Done in v0.2.26
