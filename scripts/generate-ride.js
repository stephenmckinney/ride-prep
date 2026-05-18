#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'config', 'ride.yaml');
const OUTPUT = path.join(ROOT, 'ride-config.js');

const raw = fs.readFileSync(INPUT, 'utf8');
const config = yaml.load(raw);

validate(config);
fs.writeFileSync(OUTPUT, emit(config), 'utf8');
console.log('Generated ride-config.js');

// ── Validation ───────────────────────────────────────────────────

function validate(c) {
  const errors = [];

  // defaults
  if (!c.defaults || typeof c.defaults !== 'object') {
    errors.push('"defaults" must be an object');
  } else {
    if (
      typeof c.defaults.avg_speed_mph !== 'number' ||
      c.defaults.avg_speed_mph <= 0
    )
      errors.push('"defaults.avg_speed_mph" must be a positive number');
    if (
      typeof c.defaults.distance_miles !== 'number' ||
      c.defaults.distance_miles <= 0
    )
      errors.push('"defaults.distance_miles" must be a positive number');
    if (
      typeof c.defaults.sunset !== 'string' ||
      !/^\d{2}:\d{2}$/.test(c.defaults.sunset)
    )
      errors.push('"defaults.sunset" must be a time string in HH:MM format');
  }

  // bikes
  if (!c.bikes || typeof c.bikes !== 'object' || Array.isArray(c.bikes)) {
    errors.push('"bikes" must be a non-empty object');
  } else {
    for (const [key, bike] of Object.entries(c.bikes)) {
      if (!bike.name || typeof bike.name !== 'string')
        errors.push(`Bike "${key}": "name" must be a non-empty string`);
      if (!bike.tire || typeof bike.tire !== 'string')
        errors.push(`Bike "${key}": "tire" must be a non-empty string`);
      if (!bike.front_psi || typeof bike.front_psi !== 'string')
        errors.push(`Bike "${key}": "front_psi" must be a non-empty string`);
      if (!bike.rear_psi || typeof bike.rear_psi !== 'string')
        errors.push(`Bike "${key}": "rear_psi" must be a non-empty string`);
    }
  }

  // weather
  const METRICS = ['temp', 'wind', 'aqi'];
  const LEVELS = ['nope', 'rough', 'fair'];
  if (!c.weather || typeof c.weather !== 'object') {
    errors.push('"weather" must be an object');
  } else {
    for (const metric of METRICS) {
      if (!c.weather[metric]) {
        errors.push(`"weather.${metric}" is required`);
        continue;
      }
      for (const level of LEVELS) {
        const entry = c.weather[metric][level];
        if (!entry) {
          errors.push(`"weather.${metric}.${level}" is required`);
          continue;
        }
        if (entry.below !== undefined && typeof entry.below !== 'number')
          errors.push(`"weather.${metric}.${level}.below" must be a number`);
        if (entry.above !== undefined && typeof entry.above !== 'number')
          errors.push(`"weather.${metric}.${level}.above" must be a number`);
        if (entry.below === undefined && entry.above === undefined)
          errors.push(
            `"weather.${metric}.${level}" must have at least one of "below" or "above"`,
          );
      }
    }
  }

  // supplies
  if (!c.supplies || typeof c.supplies !== 'object') {
    errors.push('"supplies" must be an object');
  } else {
    if (
      typeof c.supplies.bottles_on_bike !== 'number' ||
      c.supplies.bottles_on_bike <= 0
    )
      errors.push('"supplies.bottles_on_bike" must be a positive number');
    if (
      typeof c.supplies.mix_bags_per_extra_hour !== 'number' ||
      c.supplies.mix_bags_per_extra_hour <= 0
    )
      errors.push(
        '"supplies.mix_bags_per_extra_hour" must be a positive number',
      );
  }

  if (errors.length > 0) {
    throw new Error(
      `ride.yaml validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

// ── Emit ─────────────────────────────────────────────────────────

function q(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function emitBike(key, bike, indent) {
  const pad = ' '.repeat(indent);
  const pad2 = ' '.repeat(indent + 2);
  const pad3 = ' '.repeat(indent + 4);
  const lines = [
    `${pad}${key}: {`,
    `${pad2}name: ${q(bike.name)},`,
    `${pad2}tire: ${q(bike.tire)},`,
    `${pad2}frontPsi: ${q(bike.front_psi)},`,
    `${pad2}rearPsi: ${q(bike.rear_psi)},`,
  ];
  if (bike.fork) {
    lines.push(
      `${pad2}fork: {`,
      `${pad3}model: ${q(bike.fork.model)},`,
      `${pad3}travel: ${q(bike.fork.travel)},`,
      `${pad3}psi: ${q(bike.fork.psi)},`,
      `${pad2}},`,
    );
  }
  if (bike.shock) {
    lines.push(
      `${pad2}shock: {`,
      `${pad3}model: ${q(bike.shock.model)},`,
      `${pad3}stroke: ${q(bike.shock.stroke)},`,
      `${pad3}psi: ${q(bike.shock.psi)},`,
      `${pad2}},`,
    );
  }
  lines.push(`${pad}},`);
  return lines.join('\n');
}

function emitThreshold(entry, indent) {
  const pad = ' '.repeat(indent);
  const parts = [];
  if (entry.below !== undefined) parts.push(`below: ${entry.below}`);
  if (entry.above !== undefined) parts.push(`above: ${entry.above}`);
  return `${pad}{ ${parts.join(', ')} },`;
}

function emit(c) {
  const bikeLines = Object.entries(c.bikes)
    .map(([key, bike]) => emitBike(key, bike, 4))
    .join('\n');

  const { temp, wind, aqi } = c.weather;
  const { defaults: d, supplies: s } = c;

  return `// AUTO-GENERATED — do not edit by hand.
// Edit config/ride.yaml and run: npm run generate

globalThis.RIDE_CONFIG = {
  defaults: {
    avgSpeedMph: ${d.avg_speed_mph},
    distanceMiles: ${d.distance_miles},
    sunset: ${q(d.sunset)},
  },
  bikes: {
${bikeLines}
  },
  weather: {
    temp: {
      nope: ${emitThreshold(temp.nope, 0).trimEnd().slice(0, -1)},
      rough: ${emitThreshold(temp.rough, 0).trimEnd().slice(0, -1)},
      fair: ${emitThreshold(temp.fair, 0).trimEnd().slice(0, -1)},
    },
    wind: {
      nope: ${emitThreshold(wind.nope, 0).trimEnd().slice(0, -1)},
      rough: ${emitThreshold(wind.rough, 0).trimEnd().slice(0, -1)},
      fair: ${emitThreshold(wind.fair, 0).trimEnd().slice(0, -1)},
    },
    aqi: {
      nope: ${emitThreshold(aqi.nope, 0).trimEnd().slice(0, -1)},
      rough: ${emitThreshold(aqi.rough, 0).trimEnd().slice(0, -1)},
      fair: ${emitThreshold(aqi.fair, 0).trimEnd().slice(0, -1)},
    },
  },
  supplies: {
    bottlesOnBike: ${s.bottles_on_bike},
    mixBagsPerExtraHour: ${s.mix_bags_per_extra_hour},
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RIDE_CONFIG: globalThis.RIDE_CONFIG };
}
`;
}
