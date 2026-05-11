# TreeGen

Local family-tree editor and exporter with deterministic YAML-driven rendering.

## What it is

- Browser UI for editing people, styles, title block, and export settings
- Local renderer for exact `PDF`, `PNG`, `JPG`, and `SVG` export
- Desktop wrapper via Electron so the app runs in its own window

## Run locally

Install dependencies:

```bash
npm install
```

Browser app:

```bash
npm run start
```

Then open `http://127.0.0.1:4173`.

Desktop app in its own window:

```bash
npm run desktop:rebuild
npm run desktop:dev
```

## Build desktop packages

Current host platform:

```bash
npm run desktop:dist
```

Platform-specific:

```bash
npm run desktop:dist:mac
npm run desktop:dist:win
npm run desktop:dist:linux
```

Notes:

- macOS builds work on macOS.
- Windows and Linux packaging is most reliable on their native runners.
- The repo includes a GitHub Actions workflow for future multi-platform release builds, but nothing is configured with a remote here.

## Headless render from YAML

```bash
npm run render -- --input examples/demo-placeholder.yaml --output artifacts/out.pdf
```

## Versioning

Current version: `0.2.0`

Use local npm version commands when you want to bump and tag:

```bash
npm version patch
npm version minor
npm version major
```
