# Ride Prep

A cycling ride preparation checklist PWA. Enter your ride details, fetch weather data, and get a personalized checklist covering bike prep, clothing, nutrition, and accessories.

## Serving locally

Open `index.html` directly in a browser, or use any static file server:

```sh
npx serve .
```

## Customising clothing

Edit [`config/clothing.yaml`](config/clothing.yaml) to change what the app recommends for each temperature range. Each band has a label and a fully-resolved list of items in dressing order — no code knowledge needed.

After editing, regenerate the config and commit both files:

```sh
npm run generate
```

This rewrites `clothing-config.js` from the YAML. The generated file is committed so the app works out of the box without running anything.

## Development

```sh
npm install
npm run generate  # regenerate clothing-config.js from config/clothing.yaml
npm test          # run unit tests
npm run lint      # check for lint issues
npm run lint:fix  # auto-fix lint issues
npm run format    # auto-format all files
```

## Architecture

- `config/clothing.yaml` — human-editable clothing config (source of truth)
- `clothing-config.js` — generated from clothing.yaml, loaded by the app at runtime
- `scripts/generate-clothing.js` — reads config/clothing.yaml, validates, emits clothing-config.js
- `app.js` — all application logic (pure utility functions, constants, weather API, DOM/UI)
- `sw.js` — service worker for offline caching
- `index.html` / `styles.css` — single-page UI
- `tests/tests.node.js` — Node.js test suite (run via `npm test`)
- `tests/tests.js` / `tests/tests.html` — browser-based test suite for visual verification
