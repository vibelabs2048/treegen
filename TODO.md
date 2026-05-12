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
