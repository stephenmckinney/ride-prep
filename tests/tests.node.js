const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  esc,
  formatTime,
  assessWeather,
  assessMetric,
  isRidingAfterDark,
  getRideEndHour,
  extractWeatherRange,
  getClothingItems,
  getAccessoryItems,
} = require('../app.js');

function findItem(items, id) {
  return items.find((i) => i.id === id);
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
  assert.equal(
    esc('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
  );
});

test('esc: escapes double quotes', () => {
  assert.equal(esc('a "b" c'), 'a &quot;b&quot; c');
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

test('assessWeather: good conditions at 70F, 5mph, AQI 30', () => {
  assert.equal(assessWeather(70, 5, 30).cls, 'good');
});

test('assessWeather: fair at 58F', () => {
  assert.equal(assessWeather(58, 5, 30).cls, 'fair');
});

test('assessWeather: fair at moderate AQI (51-100)', () => {
  assert.equal(assessWeather(70, 5, 60).cls, 'fair');
});

test('assessWeather: fair at moderate wind (11-15 mph)', () => {
  assert.equal(assessWeather(70, 12, 30).cls, 'fair');
});

test('assessWeather: rough at 45F', () => {
  assert.equal(assessWeather(45, 5, 30).cls, 'rough');
});

test('assessWeather: rough at 91F', () => {
  assert.equal(assessWeather(91, 5, 30).cls, 'rough');
});

test('assessWeather: rough at high AQI (101-150)', () => {
  assert.equal(assessWeather(70, 5, 110).cls, 'rough');
});

test('assessWeather: rough at high wind (16-25 mph)', () => {
  assert.equal(assessWeather(70, 20, 30).cls, 'rough');
});

test('assessWeather: nope at extreme cold (<40F)', () => {
  assert.equal(assessWeather(25, 5, 30).cls, 'nope');
});

test('assessWeather: nope at extreme heat (>95F)', () => {
  assert.equal(assessWeather(96, 5, 30).cls, 'nope');
});

test('assessWeather: nope at extreme wind (>25 mph)', () => {
  assert.equal(assessWeather(70, 30, 30).cls, 'nope');
});

test('assessWeather: nope at extreme AQI (>150)', () => {
  assert.equal(assessWeather(70, 5, 160).cls, 'nope');
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
  assert.equal(
    findItem(items, 'baselayer'),
    undefined,
    'no base layer above 70',
  );
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
  assert.ok(
    findItem(items, 'shoes').text.includes('overshoes'),
    'should mention overshoes',
  );
});

test('getClothingItems: 50-59F: shoes include oversocks', () => {
  const items = getClothingItems(55);
  assert.ok(
    findItem(items, 'shoes').text.includes('oversocks'),
    'should mention oversocks',
  );
});

test('getClothingItems: 60F+: long-fingered gloves at 59, short-fingered at 60', () => {
  assert.equal(
    findItem(getClothingItems(59), 'gloves').text,
    'Long-fingered gloves',
  );
  assert.equal(
    findItem(getClothingItems(60), 'gloves').text,
    'Short-fingered gloves',
  );
});

test('getClothingItems: exactly 50F gets leg warmers not winter tights', () => {
  assert.equal(
    findItem(getClothingItems(50), 'bibs').text,
    'Bib shorts + leg warmers',
  );
});

test('getClothingItems: exactly 49F gets winter tights', () => {
  assert.equal(
    findItem(getClothingItems(49), 'bibs').text,
    'Classic winter tights',
  );
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
  assert.equal(
    findItem(clothing, 'helmet'),
    undefined,
    'helmet should not be in clothing',
  );
  assert.equal(
    findItem(clothing, 'sunglasses'),
    undefined,
    'sunglasses should not be in clothing',
  );
  assert.equal(
    findItem(clothing, 'whoop'),
    undefined,
    'whoop should not be in clothing',
  );
  assert.equal(
    findItem(clothing, 'bikebag'),
    undefined,
    'bike bag should not be in clothing',
  );
});

// ── assessMetric ──────────────────────────────────────────────────

test('assessMetric: temp 49 is rough', () => {
  assert.equal(assessMetric('temp', 49), 'rough');
});

test('assessMetric: temp 50 is fair', () => {
  assert.equal(assessMetric('temp', 50), 'fair');
});

test('assessMetric: temp 60 is good', () => {
  assert.equal(assessMetric('temp', 60), 'good');
});

test('assessMetric: temp 40 is rough (boundary)', () => {
  assert.equal(assessMetric('temp', 40), 'rough');
});

test('assessMetric: temp 39 is nope', () => {
  assert.equal(assessMetric('temp', 39), 'nope');
});

test('assessMetric: temp 95 is rough (boundary)', () => {
  assert.equal(assessMetric('temp', 95), 'rough');
});

test('assessMetric: temp 96 is nope', () => {
  assert.equal(assessMetric('temp', 96), 'nope');
});

test('assessMetric: temp 90 is fair (boundary)', () => {
  assert.equal(assessMetric('temp', 90), 'fair');
});

test('assessMetric: temp 91 is rough (DC humidity)', () => {
  assert.equal(assessMetric('temp', 91), 'rough');
});

test('assessMetric: null input returns good', () => {
  assert.equal(assessMetric('temp', null), 'good');
});

test('assessMetric: NaN input returns good', () => {
  assert.equal(assessMetric('temp', Number.NaN), 'good');
});

test('assessMetric: undefined input returns good', () => {
  assert.equal(assessMetric('temp', undefined), 'good');
});

test('assessMetric: unknown type returns good', () => {
  assert.equal(assessMetric('unknown', 50), 'good');
});

test('assessMetric: wind 10 is good', () => {
  assert.equal(assessMetric('wind', 10), 'good');
});

test('assessMetric: wind 11 is fair', () => {
  assert.equal(assessMetric('wind', 11), 'fair');
});

test('assessMetric: wind 15 is fair', () => {
  assert.equal(assessMetric('wind', 15), 'fair');
});

test('assessMetric: wind 16 is rough', () => {
  assert.equal(assessMetric('wind', 16), 'rough');
});

test('assessMetric: wind 26 is nope', () => {
  assert.equal(assessMetric('wind', 26), 'nope');
});

test('assessMetric: AQI 50 is good', () => {
  assert.equal(assessMetric('aqi', 50), 'good');
});

test('assessMetric: AQI 51 is fair', () => {
  assert.equal(assessMetric('aqi', 51), 'fair');
});

test('assessMetric: AQI 100 is fair', () => {
  assert.equal(assessMetric('aqi', 100), 'fair');
});

test('assessMetric: AQI 101 is rough', () => {
  assert.equal(assessMetric('aqi', 101), 'rough');
});

test('assessMetric: AQI 151 is nope', () => {
  assert.equal(assessMetric('aqi', 151), 'nope');
});

// ── getClothingItems edge cases ──────────────────────────────────

test('getClothingItems: exactly 71F matches first CLOTHING_RULES boundary', () => {
  const items = getClothingItems(71);
  assert.equal(findItem(items, 'jersey').text, 'Jersey');
  assert.equal(findItem(items, 'bibs').text, 'Bib shorts');
  assert.equal(findItem(items, 'gloves').text, 'Short-fingered gloves');
  assert.equal(findItem(items, 'shoes').text, 'Shoes');
});

// ── assessMetric: zero values ─────────────────────────────────────

test('assessMetric: wind 0 is good (not ignored)', () => {
  assert.equal(assessMetric('wind', 0), 'good');
});

test('assessMetric: AQI 0 is good (not ignored)', () => {
  assert.equal(assessMetric('aqi', 0), 'good');
});

test('getClothingItems: below 30F returns base items with no CLOTHING_RULES match', () => {
  const items = getClothingItems(25);
  assert.equal(findItem(items, 'bibs').text, 'Classic winter tights');
  assert.equal(findItem(items, 'gloves').text, 'Winter gloves');
  assert.ok(
    findItem(items, 'shoes').text.includes('overshoes'),
    'should include overshoes',
  );
  assert.equal(
    findItem(items, 'jersey'),
    undefined,
    'no jersey rule matches below 30',
  );
  assert.equal(
    findItem(items, 'baselayer'),
    undefined,
    'no base layer rule matches below 30',
  );
});

// ── getRideEndHour ──────────────────────────────────────────────

test('getRideEndHour: 60mi ride at 9am ends at hour 13', () => {
  // 60 miles / 15 mph = 4 hours → 9 + 4 = 13
  assert.equal(getRideEndHour(9, 60), 13);
});

test('getRideEndHour: 30mi ride at 9am ends at hour 11', () => {
  // 30 miles / 15 mph = 2 hours → 9 + 2 = 11
  assert.equal(getRideEndHour(9, 30), 11);
});

test('getRideEndHour: caps at hour 23', () => {
  assert.equal(getRideEndHour(20, 120), 23);
});

test('getRideEndHour: short ride same hour', () => {
  // 10 miles / 15 mph = 0.67 hours → ceil(9.67) = 10
  assert.equal(getRideEndHour(9, 10), 10);
});

// ── extractWeatherRange ─────────────────────────────────────────

test('extractWeatherRange: computes min/max across ride window', () => {
  // Simulate hourly data for hours 0-23
  const temps = [
    30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 55, 62, 65, 63, 60, 58, 55, 52, 50,
    48, 46, 44, 42, 40,
  ];
  const winds = [
    5, 5, 4, 4, 3, 3, 5, 6, 8, 10, 12, 14, 16, 15, 13, 11, 9, 8, 7, 6, 5, 5, 4,
    4,
  ];
  const humidity = [
    80, 82, 84, 85, 86, 85, 83, 80, 75, 70, 65, 60, 55, 50, 48, 50, 55, 60, 65,
    70, 75, 78, 80, 82,
  ];
  const precip = [
    0, 0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 40, 50, 45, 35, 25, 15, 10, 5, 0, 0, 0,
    0, 0,
  ];

  // Ride from 9am to 1pm (hours 9-13)
  const range = extractWeatherRange(temps, winds, humidity, precip, 9, 13);
  assert.equal(range.tempLow, 48, 'lowest temp in range is 48');
  assert.equal(range.tempHigh, 65, 'highest temp in range is 65');
  assert.equal(range.windMax, 16, 'max wind in range is 16');
  assert.equal(range.humidityMax, 70, 'max humidity in range is 70');
  assert.equal(range.precipMax, 50, 'max precip in range is 50');
});

test('extractWeatherRange: single hour returns that hour values', () => {
  const temps = [40, 50, 60, 70, 80];
  const winds = [5, 10, 15, 20, 25];
  const humidity = [50, 55, 60, 65, 70];
  const precip = [0, 10, 20, 30, 40];

  const range = extractWeatherRange(temps, winds, humidity, precip, 2, 2);
  assert.equal(range.tempLow, 60);
  assert.equal(range.tempHigh, 60);
  assert.equal(range.windMax, 15);
  assert.equal(range.humidityMax, 60);
  assert.equal(range.precipMax, 20);
});

test('extractWeatherRange: clamps start index to 0', () => {
  const temps = [40, 50, 60];
  const winds = [5, 10, 15];
  const humidity = [50, 55, 60];
  const precip = [0, 10, 20];

  const range = extractWeatherRange(temps, winds, humidity, precip, -1, 1);
  assert.equal(range.tempLow, 40);
  assert.equal(range.tempHigh, 50);
});

test('extractWeatherRange: clamps end index to array length', () => {
  const temps = [40, 50, 60];
  const winds = [5, 10, 15];
  const humidity = [50, 55, 60];
  const precip = [0, 10, 20];

  const range = extractWeatherRange(temps, winds, humidity, precip, 1, 99);
  assert.equal(range.tempLow, 50);
  assert.equal(range.tempHigh, 60);
  assert.equal(range.windMax, 15);
});

test('extractWeatherRange: start beyond data clamps to last element', () => {
  const temps = [40, 50, 60];
  const winds = [5, 10, 15];
  const humidity = [50, 55, 60];
  const precip = [0, 10, 20];

  const range = extractWeatherRange(temps, winds, humidity, precip, 5, 2);
  // start (5) clamps to len-1 (2), end clamps to max(start, 2) = 2
  assert.equal(range.tempLow, 60);
  assert.equal(range.tempHigh, 60);
  assert.equal(range.windMax, 15);
});

test('extractWeatherRange: empty arrays return NaN', () => {
  const range = extractWeatherRange([], [], [], [], 0, 0);
  assert.equal(Number.isNaN(range.tempLow), true);
  assert.equal(Number.isNaN(range.tempHigh), true);
});
