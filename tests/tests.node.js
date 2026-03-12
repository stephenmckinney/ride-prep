const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc, formatTime, assessWeather, isRidingAfterDark, getClothingItems, getAccessoryItems } = require('../app.js');

function findItem(items, id) {
  return items.find(i => i.id === id);
}

// ── formatTime ──────────────────────────────────────────────────

test('formatTime: formats morning time', () => {
  assert.equal(formatTime('09:05'), '9:05 AM');
});

test('formatTime: formats afternoon time', () => {
  assert.equal(formatTime('14:30'), '2:30 PM');
});

test('formatTime: formats midnight as 12:00 AM', () => {
  assert.equal(formatTime('00:00'), '12:00 AM');
});

test('formatTime: formats noon as 12:00 PM', () => {
  assert.equal(formatTime('12:00'), '12:00 PM');
});

test('formatTime: formats 12:59 PM', () => {
  assert.equal(formatTime('12:59'), '12:59 PM');
});

test('formatTime: pads single-digit minutes', () => {
  assert.equal(formatTime('08:03'), '8:03 AM');
});

// ── esc ─────────────────────────────────────────────────────────

test('esc: escapes < and >', () => {
  assert.equal(esc('<script>alert("xss")</script>'), '&lt;script&gt;alert("xss")&lt;/script&gt;');
});

test('esc: escapes &', () => {
  assert.equal(esc('A & B'), 'A &amp; B');
});

test('esc: passes through normal text', () => {
  assert.equal(esc('Hello World'), 'Hello World');
});

test('esc: handles empty string', () => {
  assert.equal(esc(''), '');
});

// ── assessWeather ───────────────────────────────────────────────

test('assessWeather: perfect conditions at 70F, 5mph, AQI 30', () => {
  assert.equal(assessWeather(70, 5, 30).cls, 'perfect');
});

test('assessWeather: tolerable at 58F', () => {
  assert.equal(assessWeather(58, 5, 30).cls, 'tolerable');
});

test('assessWeather: tolerable at high AQI (51-100)', () => {
  assert.equal(assessWeather(70, 5, 60).cls, 'tolerable');
});

test('assessWeather: tolerable at moderate wind (11-15 mph)', () => {
  assert.equal(assessWeather(70, 12, 30).cls, 'tolerable');
});

test('assessWeather: warning at 45F', () => {
  assert.equal(assessWeather(45, 5, 30).cls, 'warning');
});

test('assessWeather: warning at 95F', () => {
  assert.equal(assessWeather(95, 5, 30).cls, 'warning');
});

test('assessWeather: warning at dangerous AQI (>100)', () => {
  assert.equal(assessWeather(70, 5, 110).cls, 'warning');
});

test('assessWeather: warning at high wind (>15 mph)', () => {
  assert.equal(assessWeather(70, 20, 30).cls, 'warning');
});

test('assessWeather: below 30F overrides to warning', () => {
  const result = assessWeather(25, 5, 30);
  assert.equal(result.cls, 'warning');
  assert.ok(result.label.includes('30'), 'should mention 30F');
});

// ── isRidingAfterDark ───────────────────────────────────────────

test('isRidingAfterDark: returns false when ride ends before sunset', () => {
  assert.equal(isRidingAfterDark('09:00', 2, '18:30'), false);
});

test('isRidingAfterDark: returns true when ride ends after sunset', () => {
  assert.equal(isRidingAfterDark('16:00', 3, '18:30'), true);
});

test('isRidingAfterDark: exactly at sunset is not after dark', () => {
  assert.equal(isRidingAfterDark('15:30', 3, '18:30'), false);
});

test('isRidingAfterDark: early morning ride finishing before sunset', () => {
  assert.equal(isRidingAfterDark('06:00', 1.5, '19:00'), false);
});

// ── getClothingItems ────────────────────────────────────────────

test('getClothingItems: above 70F: plain jersey, bib shorts, short gloves', () => {
  const items = getClothingItems(75);
  assert.equal(findItem(items, 'jersey').text, 'Jersey');
  assert.equal(findItem(items, 'bibs').text, 'Bib shorts');
  assert.equal(findItem(items, 'gloves').text, 'Short-fingered gloves');
  assert.equal(findItem(items, 'baselayer'), undefined, 'no base layer above 70');
});

test('getClothingItems: 65-70F: brevet jersey + pro team base layer', () => {
  const items = getClothingItems(67);
  assert.equal(findItem(items, 'jersey').text, 'Brevet jersey');
  assert.equal(findItem(items, 'baselayer').text, 'Pro Team base layer');
});

test('getClothingItems: 60-64F: brevet jersey + merino base layer', () => {
  const items = getClothingItems(62);
  assert.equal(findItem(items, 'jersey').text, 'Brevet jersey');
  assert.equal(findItem(items, 'baselayer').text, 'Merino wool base layer');
});

test('getClothingItems: 55-59F: long-sleeve jersey + merino base layer', () => {
  const items = getClothingItems(57);
  assert.equal(findItem(items, 'jersey').text, 'Long-sleeve jersey');
  assert.equal(findItem(items, 'baselayer').text, 'Merino wool base layer');
});

test('getClothingItems: 50-54F: adds wind jacket', () => {
  const items = getClothingItems(52);
  assert.equal(findItem(items, 'jersey').text, 'Long-sleeve jersey');
  assert.ok(findItem(items, 'windjacket'), 'should include wind jacket');
  assert.equal(findItem(items, 'bibs').text, 'Bib shorts + leg warmers');
});

test('getClothingItems: 40-49F: softshell + winter tights + winter gloves', () => {
  const items = getClothingItems(45);
  assert.ok(findItem(items, 'softshell'), 'should include softshell');
  assert.ok(findItem(items, 'woolhat'), 'should include wool hat');
  assert.equal(findItem(items, 'bibs').text, 'Classic winter tights');
  assert.equal(findItem(items, 'gloves').text, 'Winter gloves');
});

test('getClothingItems: 30-39F: softshell + wool hat + scarf', () => {
  const items = getClothingItems(35);
  assert.ok(findItem(items, 'softshell'), 'should include softshell');
  assert.ok(findItem(items, 'woolhat'), 'should include wool hat');
  assert.ok(findItem(items, 'scarf'), 'should include scarf');
});

test('getClothingItems: below 50F: shoes include overshoes', () => {
  const items = getClothingItems(45);
  assert.ok(findItem(items, 'shoes').text.includes('overshoes'), 'should mention overshoes');
});

test('getClothingItems: 50-59F: shoes include oversocks', () => {
  const items = getClothingItems(55);
  assert.ok(findItem(items, 'shoes').text.includes('oversocks'), 'should mention oversocks');
});

test('getClothingItems: 60F+: long-fingered gloves at 59, short-fingered at 60', () => {
  assert.equal(findItem(getClothingItems(59), 'gloves').text, 'Long-fingered gloves');
  assert.equal(findItem(getClothingItems(60), 'gloves').text, 'Short-fingered gloves');
});

test('getClothingItems: exactly 50F gets leg warmers not winter tights', () => {
  assert.equal(findItem(getClothingItems(50), 'bibs').text, 'Bib shorts + leg warmers');
});

test('getClothingItems: exactly 49F gets winter tights', () => {
  assert.equal(findItem(getClothingItems(49), 'bibs').text, 'Classic winter tights');
});

// ── getAccessoryItems ──────────────────────────────────────────

test('getAccessoryItems: includes helmet, sunglasses, handkerchief, whoop, bike bag', () => {
  const items = getAccessoryItems();
  assert.ok(findItem(items, 'helmet'), 'should include helmet');
  assert.ok(findItem(items, 'sunglasses'), 'should include sunglasses');
  assert.ok(findItem(items, 'handkerchief'), 'should include handkerchief');
  assert.ok(findItem(items, 'whoop'), 'should include WHOOP');
  assert.ok(findItem(items, 'bikebag'), 'should include bike bag');
});

test('getAccessoryItems: accessories not in clothing items', () => {
  const clothing = getClothingItems(75);
  assert.equal(findItem(clothing, 'helmet'), undefined, 'helmet should not be in clothing');
  assert.equal(findItem(clothing, 'sunglasses'), undefined, 'sunglasses should not be in clothing');
  assert.equal(findItem(clothing, 'whoop'), undefined, 'whoop should not be in clothing');
  assert.equal(findItem(clothing, 'bikebag'), undefined, 'bike bag should not be in clothing');
});
