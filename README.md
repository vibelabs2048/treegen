# TreeGen

TreeGen is a family-tree editor for building ancestor charts and exporting them as high-quality files.

## What it does

- lets you enter and edit a family tree visually
- stores the tree in YAML so you can save it and keep working later
- previews the chart live as you edit
- exports clean files for sharing or printing

## Example chart

![Example TreeGen family tree](docs/example-family-tree.png)

## Best way to use it

If you only want to try TreeGen in a browser:

- open your hosted demo URL

If you want the full export features:

- download the latest desktop release from your repository releases page

The desktop app is the best option for exact:

- PDF export
- PNG export
- JPG export
- local file open/save dialogs

## What the browser demo supports

The hosted browser demo is useful for:

- trying the editor
- viewing and editing a tree
- importing YAML
- exporting YAML
- exporting SVG

For final export work, use the desktop app.

## Files TreeGen can export

Desktop app:

- PDF
- PNG
- JPG
- SVG
- YAML

Browser demo:

- SVG
- YAML

## Run locally

Install dependencies:

```bash
npm install
```

Run the local browser version:

```bash
npm run start
```

Then open:

```text
http://127.0.0.1:4173
```

Run the desktop app locally:

```bash
npm run desktop:rebuild
npm run desktop:dev
```

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
```

Platform-specific builds:

```bash
npm run desktop:dist:mac
npm run desktop:dist:win
npm run desktop:dist:linux
```

## GitHub automation

This repo is set up so that:

- pushes to `main` update the GitHub Pages demo
- pushing a version tag like `v0.2.5` creates or updates a GitHub release
- the release workflow builds desktop packages and uploads them as release assets

## What still needs to be set manually

These parts live outside the repo itself:

- create the GitHub repository
- add the remote locally
- enable GitHub Pages in repository settings
- choose the Pages source as GitHub Actions
- push `main`
- push version tags

## Current version

`0.2.5`
