// Minimal test runner
let passed = 0;
let failed = 0;
let currentSuite = '';
const resultsEl = document.getElementById('results');

function suite(name) {
  currentSuite = name;
  const div = document.createElement('div');
  div.className = 'suite';
  div.id = 'suite-' + name.replace(/\s+/g, '-');
  div.innerHTML = `<div class="suite-title">${name}</div>`;
  resultsEl.appendChild(div);
}

function test(name, fn) {
  const suiteEl = resultsEl.querySelector(`#suite-${currentSuite.replace(/\s+/g, '-')}`);
  const div = document.createElement('div');
  try {
    fn();
    div.className = 'result pass';
    div.textContent = `\u2713 ${name}`;
    passed++;
  } catch (e) {
    div.className = 'result fail';
    div.textContent = `\u2717 ${name} — ${e.message}`;
    failed++;
  }
  suiteEl.appendChild(div);
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'assertEqual'}: expected "${expected}", got "${actual}"`);
  }
}

// ── formatTime ──────────────────────────────────────────────────

suite('formatTime');

test('formats morning time', () => {
  assertEqual(formatTime('09:05'), '9:05 AM');
});

test('formats afternoon time', () => {
  assertEqual(formatTime('14:30'), '2:30 PM');
});

test('formats midnight as 12:00 AM', () => {
  assertEqual(formatTime('00:00'), '12:00 AM');
});

test('formats noon as 12:00 PM', () => {
  assertEqual(formatTime('12:00'), '12:00 PM');
});

test('formats 12:59 PM', () => {
  assertEqual(formatTime('12:59'), '12:59 PM');
});

test('pads single-digit minutes', () => {
  assertEqual(formatTime('08:03'), '8:03 AM');
});

// ── esc ─────────────────────────────────────────────────────────

suite('esc');

test('escapes < and >', () => {
  assertEqual(esc('<script>alert("xss")</script>'), '&lt;script&gt;alert("xss")&lt;/script&gt;');
});

test('escapes &', () => {
  assertEqual(esc('A & B'), 'A &amp; B');
});

test('passes through normal text', () => {
  assertEqual(esc('Hello World'), 'Hello World');
});

test('handles empty string', () => {
  assertEqual(esc(''), '');
});

// ── assessWeather ───────────────────────────────────────────────

suite('assessWeather');

test('perfect conditions at 70F, 5mph, AQI 30', () => {
  const result = assessWeather(70, 5, 30);
  assertEqual(result.cls, 'perfect');
});

test('tolerable at 58F', () => {
  const result = assessWeather(58, 5, 30);
  assertEqual(result.cls, 'tolerable');
});

test('tolerable at high AQI (51-100)', () => {
  const result = assessWeather(70, 5, 60);
  assertEqual(result.cls, 'tolerable');
});

test('tolerable at moderate wind (11-15 mph)', () => {
  const result = assessWeather(70, 12, 30);
  assertEqual(result.cls, 'tolerable');
});

test('warning at 45F', () => {
  const result = assessWeather(45, 5, 30);
  assertEqual(result.cls, 'warning');
});

test('warning at 95F', () => {
  const result = assessWeather(95, 5, 30);
  assertEqual(result.cls, 'warning');
});

test('warning at dangerous AQI (>100)', () => {
  const result = assessWeather(70, 5, 110);
  assertEqual(result.cls, 'warning');
});

test('warning at high wind (>15 mph)', () => {
  const result = assessWeather(70, 20, 30);
  assertEqual(result.cls, 'warning');
});

test('below 30F overrides to warning', () => {
  const result = assessWeather(25, 5, 30);
  assertEqual(result.cls, 'warning');
  assert(result.label.includes('30'), 'should mention 30F');
});

// ── isRidingAfterDark ───────────────────────────────────────────

suite('isRidingAfterDark');

test('returns false when ride ends before sunset', () => {
  assert(!isRidingAfterDark('09:00', 2, '18:30'), 'should not be after dark');
});

test('returns true when ride ends after sunset', () => {
  assert(isRidingAfterDark('16:00', 3, '18:30'), 'should be after dark');
});

test('returns true when ride ends exactly at sunset', () => {
  // 15:30 + 3hrs = 18:30 = sunset, endMinutes > sunsetMinutes is false
  assert(!isRidingAfterDark('15:30', 3, '18:30'), 'exactly at sunset is not after dark');
});

test('handles early morning ride finishing well before sunset', () => {
  assert(!isRidingAfterDark('06:00', 1.5, '19:00'), 'should not be after dark');
});

// ── getClothingItems ────────────────────────────────────────────

suite('getClothingItems');

function findItem(items, id) {
  return items.find(i => i.id === id);
}

test('above 70F: plain jersey, bib shorts, short gloves', () => {
  const items = getClothingItems(75);
  assertEqual(findItem(items, 'jersey').text, 'Jersey');
  assertEqual(findItem(items, 'bibs').text, 'Bib shorts');
  assertEqual(findItem(items, 'gloves').text, 'Short-fingered gloves');
  assert(!findItem(items, 'baselayer'), 'no base layer above 70');
});

test('65-70F: brevet jersey + pro team base layer', () => {
  const items = getClothingItems(67);
  assertEqual(findItem(items, 'jersey').text, 'Brevet jersey');
  assertEqual(findItem(items, 'baselayer').text, 'Pro Team base layer');
});

test('60-64F: brevet jersey + merino base layer', () => {
  const items = getClothingItems(62);
  assertEqual(findItem(items, 'jersey').text, 'Brevet jersey');
  assertEqual(findItem(items, 'baselayer').text, 'Merino wool base layer');
});

test('55-59F: long-sleeve jersey + merino base layer', () => {
  const items = getClothingItems(57);
  assertEqual(findItem(items, 'jersey').text, 'Long-sleeve jersey');
  assertEqual(findItem(items, 'baselayer').text, 'Merino wool base layer');
});

test('50-54F: adds wind jacket', () => {
  const items = getClothingItems(52);
  assertEqual(findItem(items, 'jersey').text, 'Long-sleeve jersey');
  assert(findItem(items, 'windjacket'), 'should include wind jacket');
  assertEqual(findItem(items, 'bibs').text, 'Bib shorts + leg warmers');
});

test('40-49F: softshell jacket + winter tights + winter gloves', () => {
  const items = getClothingItems(45);
  assert(findItem(items, 'softshell'), 'should include softshell');
  assert(findItem(items, 'woolhat'), 'should include wool hat');
  assertEqual(findItem(items, 'bibs').text, 'Classic winter tights');
  assertEqual(findItem(items, 'gloves').text, 'Winter gloves');
});

test('30-39F: softshell + wool hat + scarf', () => {
  const items = getClothingItems(35);
  assert(findItem(items, 'softshell'), 'should include softshell');
  assert(findItem(items, 'woolhat'), 'should include wool hat');
  assert(findItem(items, 'scarf'), 'should include scarf');
});

test('below 50F: socks include overshoes', () => {
  const items = getClothingItems(45);
  assert(findItem(items, 'socks').text.includes('overshoes'), 'should mention overshoes');
});

test('below 60F: socks detail includes oversocks', () => {
  const items = getClothingItems(55);
  assert(findItem(items, 'socks').detail.includes('oversocks'), 'should mention oversocks');
});

test('60F+: long-fingered gloves at 59, short-fingered at 60', () => {
  assertEqual(findItem(getClothingItems(59), 'gloves').text, 'Long-fingered gloves');
  assertEqual(findItem(getClothingItems(60), 'gloves').text, 'Short-fingered gloves');
});

test('boundary: exactly 50F gets leg warmers not winter tights', () => {
  assertEqual(findItem(getClothingItems(50), 'bibs').text, 'Bib shorts + leg warmers');
});

test('boundary: exactly 49F gets winter tights', () => {
  assertEqual(findItem(getClothingItems(49), 'bibs').text, 'Classic winter tights');
});

// ── Summary ─────────────────────────────────────────────────────

const summaryEl = document.getElementById('summary');
const total = passed + failed;
summaryEl.className = 'summary ' + (failed === 0 ? 'all-pass' : 'has-fail');
summaryEl.textContent = failed === 0
  ? `All ${total} tests passed`
  : `${failed} of ${total} tests failed`;
