#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'clothing.yaml');
const OUTPUT = path.join(ROOT, 'clothing-config.js');

const raw = fs.readFileSync(INPUT, 'utf8');
const config = yaml.load(raw);

validate(config);
const normalised = normalise(config);
fs.writeFileSync(OUTPUT, emit(normalised), 'utf8');
console.log('Generated clothing-config.js');

// ── Validation ───────────────────────────────────────────────────

function validate(c) {
  const errors = [];

  if (!Array.isArray(c.ranges) || c.ranges.length === 0) {
    errors.push('"ranges" must be a non-empty array');
  } else {
    c.ranges.forEach((r, i) => {
      if (!r.label || typeof r.label !== 'string')
        errors.push(`Range ${i}: "label" must be a non-empty string`);
      if (!Number.isFinite(r.min))
        errors.push(`Range ${i}: "min" must be a finite number`);
      if (r.max !== null && !Number.isFinite(r.max))
        errors.push(`Range ${i}: "max" must be a finite number or null`);
      if (Number.isFinite(r.min) && Number.isFinite(r.max) && r.min > r.max)
        errors.push(`Range ${i}: min must be <= max`);
      if (!Array.isArray(r.items) || r.items.length === 0) {
        errors.push(`Range ${i}: "items" must be a non-empty array`);
      } else {
        const ids = new Set();
        r.items.forEach((item, j) => {
          if (!item.id || typeof item.id !== 'string')
            errors.push(`Range ${i}, item ${j}: "id" is required`);
          if (!item.text || typeof item.text !== 'string')
            errors.push(`Range ${i}, item ${j}: "text" is required`);
          if (ids.has(item.id))
            errors.push(`Range ${i}: duplicate item id "${item.id}"`);
          ids.add(item.id);
        });
      }
    });

    // Overlap detection
    const resolved = c.ranges.map((r) => ({
      ...r,
      max: r.max === null ? Infinity : r.max,
    }));
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i];
        const b = resolved[j];
        if (a.min <= b.max && b.min <= a.max) {
          errors.push(
            `Ranges ${i} ("${c.ranges[i].label}") and ${j} ("${c.ranges[j].label}") overlap`,
          );
        }
      }
    }
  }

  if (!Array.isArray(c.accessories)) {
    errors.push('"accessories" must be an array');
  } else {
    c.accessories.forEach((item, j) => {
      if (!item.id || typeof item.id !== 'string')
        errors.push(`Accessory ${j}: "id" is required`);
      if (!item.text || typeof item.text !== 'string')
        errors.push(`Accessory ${j}: "text" is required`);
    });
  }

  if (errors.length > 0) {
    throw new Error(
      `clothing.yaml validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

// ── Normalise ────────────────────────────────────────────────────

function normalise(c) {
  return {
    ranges: c.ranges.map((r) => ({
      ...r,
      max: r.max === null ? Infinity : r.max,
    })),
    accessories: c.accessories,
  };
}

// ── Emit ─────────────────────────────────────────────────────────

function q(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function emitItem(item, indent) {
  const pad = ' '.repeat(indent);
  const detail = item.detail ? `, detail: ${q(item.detail)}` : '';
  return `${pad}{ id: ${q(item.id)}, text: ${q(item.text)}${detail} },`;
}

function emitRange(r, indent) {
  const pad = ' '.repeat(indent);
  const pad2 = ' '.repeat(indent + 2);
  const maxVal = r.max === Infinity ? 'Infinity' : r.max;
  const lines = [
    `${pad}{`,
    `${pad2}label: ${q(r.label)},`,
    `${pad2}min: ${r.min},`,
    `${pad2}max: ${maxVal},`,
    `${pad2}items: [`,
    ...r.items.map((item) => emitItem(item, indent + 4)),
    `${pad2}],`,
    `${pad}},`,
  ];
  return lines.join('\n');
}

function emit(c) {
  const date = new Date().toISOString();
  const rangeLines = c.ranges.map((r) => emitRange(r, 4)).join('\n');
  const accessoryLines = c.accessories
    .map((item) => emitItem(item, 4))
    .join('\n');

  return `// AUTO-GENERATED — do not edit by hand.
// Edit clothing.yaml and run: npm run generate
//
// Generated: ${date}

const CLOTHING_CONFIG = {
  ranges: [
${rangeLines}
  ],
  accessories: [
${accessoryLines}
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CLOTHING_CONFIG };
}
`;
}
