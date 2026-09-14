# DualityDocs

Documentation site for the Duality Nintendo 3DS engine. It is a Vite + React
single-page application with hash routes, full-text guide/API search, a curated
gameplay reference, and a generated public-header catalogue.

## Run locally

```powershell
cd F:\Workspace\ts\DualityDocs
npm run dev
```

`npm run build` performs the complete production check:

1. generates `src/data/generatedHeaders.ts` from every public engine header;
2. type-checks the React application;
3. produces the static site in `dist/`.

The generator expects the engine at `F:\Workspace\CPP\DualityEngine` by
default. For another checkout, point it at the repository root:

```powershell
$env:DUALITY_ENGINE_ROOT = 'D:\Source\DualityEngine'
npm run build
```

## Authoring the documentation

- `src/data/docs.ts` contains the structured guide pages: editor workflow,
  ECS/runtime, rendering, physics, data, build pipeline and 3DS integration.
- `src/data/api.ts` is the curated, explained API reference for game developers.
- `scripts/generate-api-index.mjs` makes the exhaustive header catalogue. It is
  intentionally lightweight: a listed header is a dependable discovery link,
  while its C++ declaration remains the source of truth.

The 3DS-native chapter documents the integration boundary, rather than copying
devkitPro declarations into the engine API. Use the linked official libctru and
Citro3D references for version-specific raw symbols.
