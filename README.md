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

Static Pages demo bundle:

```bash
npm run build:pages
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
- The repo now includes GitHub Actions workflows for:
  - GitHub Pages demo deployment
  - tagged desktop release builds with uploaded release assets
- Windows x64 is the main Windows target for normal PCs.

## Headless render from YAML

```bash
npm run render -- --input examples/demo-placeholder.yaml --output artifacts/out.pdf
```

## Versioning

Current version: `0.2.1`

Use local npm version commands when you want to bump and tag:

```bash
npm version patch
npm version minor
npm version major
```

Push the new tag afterward so GitHub Actions can build the release:

```bash
git push origin main --tags
```

## GitHub setup

Everything important can live in the repo itself. For the normal GitHub Pages + Releases setup, the only manual work is:

1. create a GitHub repo and add it as `origin`
2. push `main`
3. in GitHub repo settings, enable **Pages** with **GitHub Actions** as the source
4. push tags like `v0.2.1`

No extra secrets are required for the basic flow:

- the Pages workflow uses the built-in `GITHUB_TOKEN`
- the release workflow also uses the built-in `GITHUB_TOKEN`

What happens after that:

- pushes to `main` deploy the static browser demo to GitHub Pages
- pushes of tags like `v0.2.1` create/update a GitHub release and upload desktop build assets
- the hosted demo automatically derives a `Download Desktop App` link to `releases/latest` when it is served from the standard `owner.github.io/repo` Pages URL

Limitations of the hosted demo:

- preview and editing work
- YAML and SVG export work
- exact PDF / PNG / JPG export is reserved for the desktop app or local server mode
