# Ride Prep

A cycling ride preparation checklist PWA. Enter your ride details, fetch weather data, and get a personalized checklist covering bike prep, clothing, nutrition, and accessories.

## Serving locally

Open `index.html` directly in a browser, or use any static file server:

```sh
npx serve .
```

## Development

```sh
npm install
npm test          # run unit tests
npm run lint      # check for lint issues
npm run lint:fix  # auto-fix lint issues
npm run format    # auto-format all files
```

## Architecture

- `app.js` — all application logic (pure utility functions, constants, weather API, DOM/UI)
- `sw.js` — service worker for offline caching
- `index.html` / `styles.css` — single-page UI
- `tests/tests.node.js` — Node.js test suite (run via `npm test`)
- `tests/tests.js` / `tests/tests.html` — browser-based test suite for visual verification
