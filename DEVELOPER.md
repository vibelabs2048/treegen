# TreeGen Developer Notes

## Local run

Install dependencies:

```bash
npm install
```

Run the local browser version:

```bash
npm run start
```

Run the desktop app locally:

```bash
npm run desktop:rebuild
npm run desktop:dev
```

## Build commands

Build logo and icon assets from `treegen.png`:

```bash
npm run build:logo-assets
```

Build a static demo bundle:

```bash
npm run build:pages
```

Build desktop packages:

```bash
npm run desktop:dist
npm run desktop:dist:mac
npm run desktop:dist:win
npm run desktop:dist:linux
```

QA review bundle:

```bash
npm run qa:review
```

That writes a comparable demo bundle to `artifacts/qa-review/` with:
- `demo.svg`
- `demo.png`
- `demo.pdf`
- `fit-report.json`

Pre-publish validation in GitHub Actions:

- `Preview Validation` runs on pull requests to `main` and on manual dispatch
- it uploads:
  - a built Pages artifact
  - the QA review bundle
  - non-publishing desktop build artifacts for macOS, Windows, and Linux

## GitHub automation

- pushes to `main` update the GitHub Pages demo
- pushing a version tag like `v0.2.23` creates or updates a GitHub release
- the release workflow builds desktop packages and uploads them as release assets

## Manual repo setup

- create the GitHub repository
- add the remote locally
- enable GitHub Pages in repository settings
- choose the Pages source as GitHub Actions
- push `main`
- push version tags

Use the preview-validation workflow before pushing a release tag when you want a production-like check without touching the public demo or official release page.
