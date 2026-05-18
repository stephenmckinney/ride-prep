# Ride Prep

A cycling ride preparation checklist PWA. Enter ride details, fetch weather, get a personalized checklist covering bike prep, clothing, nutrition, and accessories.

## Serving locally

```sh
npx serve .
```

Or open `index.html` directly in a browser.

## Personalizing

Everything personal lives in two YAML files. Edit either, then run:

```sh
npm run generate
```

This rewrites the generated `.js` config files. Both are committed so the app works without building.

**[`config/clothing.yaml`](config/clothing.yaml)** — what to wear at each temperature range. Each band has a label and a fully-resolved item list in dressing order.

**[`config/ride.yaml`](config/ride.yaml)** — everything about how you ride:
- `defaults` — avg speed, pre-filled distance and sunset
- `bikes` — fleet with tire specs, PSI, and optional suspension pressures
- `weather` — personal go/no-go bands for temp, wind, and AQI
- `supplies` — bottle count and mix bag logic

## Development

```sh
npm install
npm run generate  # regenerate config JS files from YAML
npm test          # unit tests
npm run lint      # check for lint issues
npm run lint:fix  # auto-fix lint issues
```
