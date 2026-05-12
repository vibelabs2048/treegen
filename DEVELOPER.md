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

## GitHub automation

- pushes to `main` update the GitHub Pages demo
- pushing a version tag like `v0.2.8` creates or updates a GitHub release
- the release workflow builds desktop packages and uploads them as release assets

## Manual repo setup

- create the GitHub repository
- add the remote locally
- enable GitHub Pages in repository settings
- choose the Pages source as GitHub Actions
- push `main`
- push version tags

## Current version

`0.2.8`
