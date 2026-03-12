// ── Pure utility functions (testable without DOM) ───────────────

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function assessWeather(temp, wind, aqi) {
  if (temp < 30) return { cls: 'warning', label: 'Below 30\u00B0F \u2014 consider staying inside!' };
  if (temp < 50 || temp > 90 || aqi > 100 || wind > 15) return { cls: 'warning', label: 'Conditions flagged \u2014 ride with caution' };
  if (temp < 60 || temp > 85 || aqi > 50 || wind > 10) return { cls: 'tolerable', label: 'Tolerable conditions' };
  return { cls: 'perfect', label: 'Perfect conditions' };
}

function isRidingAfterDark(rideTime, rideDurationHrs, sunsetStr) {
  const [startH, startM] = rideTime.split(':').map(Number);
  const [sunH, sunM] = sunsetStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const sunsetMinutes = sunH * 60 + sunM;
  const endMinutes = startMinutes + Math.round(rideDurationHrs * 60);
  return endMinutes > sunsetMinutes;
}

// ── Constants ───────────────────────────────────────────────────

const BIKES = {
  caledonia: { name: 'Cerv\u00E9lo Caledonia-5', tire: '700C x 25', frontPsi: '55\u201360', rearPsi: '60\u201365' },
  r3: { name: 'Cerv\u00E9lo R3', tire: '700C x 23', frontPsi: '70', rearPsi: '70' },
  cx: { name: 'Open UP 700C (CX)', tire: '700C x 34', frontPsi: '25', rearPsi: '25' },
  gravel: { name: 'Open UP 650B (Gravel)', tire: '650B', frontPsi: '24', rearPsi: '25' },
  mtb: { name: 'Ripley MTB', tire: '29" x 2.4"', frontPsi: '22\u201324', rearPsi: '24\u201326' }
};

const CLOTHING_RULES = [
  { min: 71, max: Infinity, prepend: [{ id: 'jersey', text: 'Jersey' }] },
  { min: 65, max: 70, prepend: [{ id: 'baselayer', text: 'Pro Team base layer', detail: 'Lightweight mesh' }, { id: 'jersey', text: 'Brevet jersey' }] },
  { min: 60, max: 64, prepend: [{ id: 'baselayer', text: 'Merino wool base layer' }, { id: 'jersey', text: 'Brevet jersey' }] },
  { min: 55, max: 59, prepend: [{ id: 'baselayer', text: 'Merino wool base layer' }, { id: 'jersey', text: 'Long-sleeve jersey' }] },
  { min: 50, max: 54, prepend: [{ id: 'baselayer', text: 'Merino wool base layer' }, { id: 'jersey', text: 'Long-sleeve jersey' }], append: [{ id: 'windjacket', text: 'Classic Wind jacket' }] },
  { min: 40, max: 49, prepend: [{ id: 'baselayer', text: 'Merino wool base layer' }, { id: 'jersey', text: 'Long-sleeve jersey' }], append: [{ id: 'softshell', text: 'Classic Softshell jacket' }, { id: 'woolhat', text: 'Wool hat (optional \u2014 helps with ears)' }] },
  { min: 30, max: 39, prepend: [{ id: 'baselayer', text: 'Merino wool base layer' }, { id: 'jersey', text: 'Long-sleeve jersey' }], append: [{ id: 'softshell', text: 'Classic Softshell jacket' }, { id: 'woolhat', text: 'Wool hat (must)' }, { id: 'scarf', text: 'Cycling scarf' }] },
];

function getClothingItems(temp) {
  const items = [
    { id: 'bibs', text: temp < 50 ? 'Classic winter tights' : temp < 60 ? 'Bib shorts + leg warmers' : 'Bib shorts' },
    { id: 'socks', text: 'Pro Team Socks' },
    { id: 'shoes', text: 'Shoes' + (temp < 50 ? ' + overshoes' : temp < 60 ? ' + oversocks' : '') },
    { id: 'handkerchief', text: 'Handkerchief' },
    { id: 'sunglasses', text: 'Sunglasses' },
    { id: 'helmet', text: 'Helmet' },
    { id: 'gloves', text: temp < 50 ? 'Winter gloves' : temp < 60 ? 'Long-fingered gloves' : 'Short-fingered gloves' },
    { id: 'whoop', text: 'WHOOP arm band' },
    { id: 'bikebag', text: 'Bike bag (credit card, ID, phone)' },
  ];

  const rule = CLOTHING_RULES.find(r => temp >= r.min && temp <= r.max);
  if (rule) {
    if (rule.prepend) rule.prepend.slice().reverse().forEach(item => items.unshift({ ...item }));
    if (rule.append) rule.append.forEach(item => items.push({ ...item }));
  }

  return items;
}

// ── Weather API ─────────────────────────────────────────────────

async function geocodeLocation(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find "${name}". Try a more specific city name.`);
  }
  const { latitude, longitude, timezone, name: cityName, admin1 } = data.results[0];
  return { latitude, longitude, timezone, cityName, admin1 };
}

async function fetchForecast(lat, lon, tz, date, hourIndex) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability`
    + `&daily=sunset`
    + `&temperature_unit=fahrenheit&wind_speed_unit=mph`
    + `&timezone=${encodeURIComponent(tz)}`
    + `&start_date=${date}&end_date=${date}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
    throw new Error('No forecast data available for this date. Try a date within the next 7 days.');
  }

  const i = Math.min(hourIndex, data.hourly.time.length - 1);
  return {
    tempF: Math.round(data.hourly.temperature_2m[i]),
    windMph: Math.round(data.hourly.wind_speed_10m[i]),
    humidity: Math.round(data.hourly.relative_humidity_2m[i]),
    precipChance: data.hourly.precipitation_probability[i],
    sunsetTime: data.daily.sunset[0].split('T')[1],
  };
}

async function fetchAqi(lat, lon, tz, date, hourIndex) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}`
      + `&hourly=us_aqi`
      + `&timezone=${encodeURIComponent(tz)}`
      + `&start_date=${date}&end_date=${date}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.hourly && data.hourly.us_aqi) {
      return data.hourly.us_aqi[hourIndex];
    }
  } catch (e) { /* best-effort */ }
  return null;
}

// ── DOM-dependent code (only runs in browser) ───────────────────

if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);

  const els = {
    headerTitle: $('headerTitle'),
    headerSub: $('headerSub'),
    progressBar: $('progressBar'),
    progressFill: $('progressFill'),
    progressText: $('progressText'),
    setupScreen: $('setupScreen'),
    checklistScreen: $('checklistScreen'),
    checklistContainer: $('checklistContainer'),
    weatherBanner: $('weatherBanner'),
    rideSummary: $('rideSummary'),
    fetchWeatherBtn: $('fetchWeatherBtn'),
    weatherStatus: $('weatherStatus'),
    weatherPreview: $('weatherPreview'),
    generateBtn: $('generateBtn'),
    resetBtn: $('resetBtn'),
    rideDate: $('rideDate'),
    rideTime: $('rideTime'),
    rideMiles: $('rideMiles'),
    rideLocation: $('rideLocation'),
    rideBike: $('rideBike'),
    rideTemp: $('rideTemp'),
    rideWind: $('rideWind'),
    rideAqi: $('rideAqi'),
    rideSunset: $('rideSunset'),
    rideMeetup: $('rideMeetup'),
    rideLock: $('rideLock'),
    wpTemp: $('wpTemp'),
    wpWind: $('wpWind'),
    wpAqi: $('wpAqi'),
    wpHumidity: $('wpHumidity'),
    wpSunset: $('wpSunset'),
    wpPrecip: $('wpPrecip'),
  };

  // ── Event Delegation ──────────────────────────────────────────
  els.fetchWeatherBtn.addEventListener('click', handleFetchWeather);
  els.generateBtn.addEventListener('click', () => generateChecklist());
  els.resetBtn.addEventListener('click', resetAll);

  document.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (item) { toggleItem(item); return; }

    const header = e.target.closest('.section-header');
    if (header) {
      const section = header.closest('.section');
      if (section) section.classList.toggle('collapsed');
    }
  });

  // ── Set default date to tomorrow ──────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  els.rideDate.value = tomorrow.toISOString().split('T')[0];

  // ── Restore saved session ─────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => { loadState(); });
  if (document.readyState !== 'loading') { loadState(); }

  // ── Persistence ───────────────────────────────────────────────

  const STORAGE_KEY = 'ridePrep_v2';
  const FORM_FIELDS = ['rideDate', 'rideTime', 'rideMiles', 'rideLocation', 'rideBike', 'rideTemp', 'rideWind', 'rideAqi', 'rideSunset', 'rideMeetup', 'rideLock'];

  function getFormValues() {
    const form = {};
    FORM_FIELDS.forEach(id => { form[id] = els[id].value; });
    return form;
  }

  function setFormValues(form) {
    if (!form) return;
    Object.entries(form).forEach(([id, val]) => {
      if (els[id] && val) els[id].value = val;
    });
  }

  function saveState() {
    try {
      const state = {
        screen: els.checklistScreen.classList.contains('hidden') ? 'setup' : 'checklist',
        checkState,
        weatherData,
        form: getFormValues(),
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or unavailable */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') return false;

      setFormValues(state.form);

      if (state.screen === 'checklist') {
        weatherData = state.weatherData || null;
        checkState = state.checkState || {};
        generateChecklist(true);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
  }

  // ── Weather UI ────────────────────────────────────────────────

  function displayWeatherPreview(data) {
    els.wpTemp.textContent = data.tempF + '\u00B0';
    els.wpWind.textContent = data.windMph;
    els.wpAqi.textContent = data.aqi !== null ? data.aqi : '\u2014';
    els.wpHumidity.textContent = data.humidity + '%';
    els.wpSunset.textContent = formatTime(data.sunsetTime);
    els.wpPrecip.textContent = data.precipChance + '%';
    els.weatherPreview.classList.add('visible');
  }

  async function handleFetchWeather() {
    const location = els.rideLocation.value.trim();
    const rideDate = els.rideDate.value;
    const rideTime = els.rideTime.value;

    if (!location) { showStatus('error', 'Enter a location first.'); return; }
    if (!rideDate) { showStatus('error', 'Enter a ride date first.'); return; }

    els.fetchWeatherBtn.disabled = true;
    els.fetchWeatherBtn.textContent = 'Fetching\u2026';
    showStatus('loading', 'Looking up location\u2026');

    try {
      const geo = await geocodeLocation(location);
      const label = `${geo.cityName}${geo.admin1 ? ', ' + geo.admin1 : ''}`;
      showStatus('loading', `Found ${label}. Fetching forecast\u2026`);

      const [startH] = rideTime.split(':').map(Number);
      const forecast = await fetchForecast(geo.latitude, geo.longitude, geo.timezone, rideDate, startH);
      const aqi = await fetchAqi(geo.latitude, geo.longitude, geo.timezone, rideDate, startH);

      els.rideTemp.value = forecast.tempF;
      els.rideWind.value = forecast.windMph;
      if (aqi !== null) els.rideAqi.value = aqi;
      els.rideSunset.value = forecast.sunsetTime;

      weatherData = { ...forecast, aqi, locationName: label };
      displayWeatherPreview(weatherData);

      showStatus('success', `Weather loaded for ${label} on ${rideDate}. Fields auto-filled \u2014 adjust if needed.`);
    } catch (err) {
      showStatus('error', err.message || 'Failed to fetch weather. You can enter values manually.');
      els.weatherPreview.classList.remove('visible');
    } finally {
      els.fetchWeatherBtn.disabled = false;
      els.fetchWeatherBtn.textContent = 'Fetch Weather for Ride Day';
    }
  }

  function showStatus(type, msg) {
    els.weatherStatus.className = 'weather-status ' + type;
    els.weatherStatus.textContent = msg;
  }

  // ── Checklist State ───────────────────────────────────────────

  let checkState = {};
  let weatherData = null;

  // ── Checklist Generation ──────────────────────────────────────

  function generateChecklist(isRestore) {
    const miles = parseFloat(els.rideMiles.value);
    const temp = parseFloat(els.rideTemp.value);
    const wind = parseFloat(els.rideWind.value);
    const aqi = parseFloat(els.rideAqi.value);
    const bikeKey = els.rideBike.value;
    const meetup = els.rideMeetup.value.trim();
    const needLock = els.rideLock.value === 'yes';
    const rideDate = els.rideDate.value;
    const rideTime = els.rideTime.value;
    const location = els.rideLocation.value;

    if (!miles || !temp) { alert('Please enter miles and temperature (or fetch weather first).'); return; }

    const bike = BIKES[bikeKey];
    const rideDurationHrs = miles / 15;
    const hours = Math.ceil(rideDurationHrs);
    const waffles = hours;

    const sunsetStr = els.rideSunset.value;
    const ridingDark = isRidingAfterDark(rideTime, rideDurationHrs, sunsetStr);
    const extraBags = Math.max(0, hours - 2);

    const weather = assessWeather(temp, wind, aqi);

    const humidity = weatherData ? weatherData.humidity + '%' : '\u2014';
    const precipChance = weatherData ? weatherData.precipChance + '%' : '\u2014';
    const locationName = weatherData ? weatherData.locationName : location;

    els.weatherBanner.innerHTML = `
    <div class="weather-banner">
      <h3>Weather</h3>
      <div class="weather-grid">
        <div class="weather-stat"><div class="val">${esc(String(temp))}\u00B0F</div><div class="label">Temperature</div></div>
        <div class="weather-stat"><div class="val">${wind ? esc(String(wind)) + ' MPH' : '\u2014'}</div><div class="label">Wind</div></div>
        <div class="weather-stat"><div class="val">${aqi ? esc(String(aqi)) : '\u2014'}</div><div class="label">AQI</div></div>
        <div class="weather-stat"><div class="val">${esc(humidity)}</div><div class="label">Humidity</div></div>
        <div class="weather-stat"><div class="val">${esc(precipChance)}</div><div class="label">Rain chance</div></div>
        <div class="weather-stat"><div class="val">${sunsetStr ? esc(formatTime(sunsetStr)) : '\u2014'}</div><div class="label">Sunset</div></div>
      </div>
      <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${esc(locationName)}</div>
      <div class="weather-tag ${weather.cls}">${esc(weather.label)}</div>
    </div>
  `;

    const dateStr = new Date(rideDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    let summaryP = `<span class="detail">${esc(dateStr)} at ${esc(formatTime(rideTime))}</span><br>`;
    summaryP += `<span class="detail">${esc(String(miles))} miles</span> on the <span class="detail">${esc(bike.name)}</span><br>`;
    summaryP += `Est. duration: <span class="detail">~${hours} hour${hours > 1 ? 's' : ''}</span>`;
    if (meetup) summaryP += `<br>Meeting: <span class="detail">${esc(meetup)}</span>`;
    if (ridingDark) summaryP += `<br><span style="color:var(--yellow);">Sunset at ${esc(formatTime(sunsetStr))} \u2014 you may be riding in the dark. Ensure lights are charged and mounted.</span>`;

    els.rideSummary.innerHTML = `
    <div class="ride-summary">
      <h3>Ride Summary</h3>
      <p>${summaryP}</p>
    </div>
  `;

    // Build sections
    const sections = [];

    const bikeItems = [
      { id: 'wahoo', text: 'Charge Wahoo ROAM 3', detail: 'Bike computer' },
      { id: 'lights', text: 'Charge Garmin lights' },
      { id: 'chain', text: 'Check chain \u2014 needs wax?' },
      { id: 'tires', text: `Pump tires \u2014 Front: ${bike.frontPsi} PSI / Rear: ${bike.rearPsi} PSI`, detail: bike.tire },
      { id: 'route', text: 'Load route on Wahoo' },
    ];
    if (needLock) bikeItems.push({ id: 'lock', text: 'Pack bike lock', detail: 'Urban ride with stops' });
    if (ridingDark) bikeItems.push({ id: 'extralights', text: 'Mount front & rear Garmin lights on bike', detail: 'Ride may extend past sunset (' + formatTime(sunsetStr) + ')' });
    sections.push({ title: 'Bike Prep (Night Before)', emoji: '\uD83D\uDD27', items: bikeItems });

    const clothingItems = getClothingItems(temp);
    sections.push({ title: 'Clothing', emoji: '\uD83D\uDC55', items: clothingItems });

    const foodItems = [
      { id: 'preride', text: 'Pre-ride meal', detail: 'Oatmeal + berries or cereal + fruit \u2014 eat 1\u20132 hrs before' },
      { id: 'waffles', text: `Pack ${waffles} Honey Stinger Waffle${waffles > 1 ? 's' : ''}`, detail: `${waffles} waffle${waffles > 1 ? 's' : ''} for ~${hours} hr ride` },
      { id: 'bottles', text: 'Fill 2 bottles with Skratch mix' },
    ];
    if (extraBags > 0) {
      foodItems.push({ id: 'bags', text: `Pack ${extraBags} Ziploc bag${extraBags > 1 ? 's' : ''} of Skratch mix`, detail: 'For refills on the road' });
    }
    foodItems.push({ id: 'recovery', text: 'Prep Skratch Chocolate Recovery Shake', detail: 'Have it ready in the fridge for post-ride' });
    sections.push({ title: 'Food & Hydration', emoji: '\uD83C\uDF6F', items: foodItems });

    if (meetup) {
      sections.push({
        title: 'Meetup', emoji: '\uD83D\uDC65', items: [
          { id: 'meetup', text: meetup, detail: 'Confirm with your group' },
          { id: 'traveltime', text: 'Account for travel time to start', detail: 'Work backwards from meeting time' },
        ]
      });
    }

    // Render checklist items
    const savedChecks = isRestore ? { ...checkState } : {};
    checkState = {};
    let html = '';
    const CHECK_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    sections.forEach((sec, si) => {
      const sectionId = 'sec_' + si;
      let itemsHtml = '';
      sec.items.forEach((item, ii) => {
        const key = sectionId + '_' + item.id + '_' + ii;
        const wasChecked = isRestore && savedChecks[key];
        checkState[key] = !!wasChecked;
        const checkedClass = wasChecked ? ' checked' : '';
        const detailHtml = item.detail ? '<div class="item-detail">' + esc(item.detail) + '</div>' : '';
        itemsHtml += `
        <div class="item${checkedClass}" data-key="${esc(key)}">
          <div class="checkbox">${CHECK_SVG}</div>
          <div><div class="item-text">${esc(item.text)}</div>${detailHtml}</div>
        </div>`;
      });
      html += `
      <div class="section" id="${sectionId}">
        <div class="section-header">
          <h3>${sec.emoji} ${esc(sec.title)} <span class="section-badge" id="${sectionId}_badge">0/${sec.items.length}</span></h3>
          <span class="section-chevron">\u25BC</span>
        </div>
        <div class="section-items">${itemsHtml}</div>
      </div>`;
    });

    els.checklistContainer.innerHTML = html;
    els.setupScreen.classList.add('hidden');
    els.checklistScreen.classList.remove('hidden');
    els.progressBar.classList.remove('hidden');
    els.progressText.classList.remove('hidden');
    els.headerTitle.textContent = `${miles}mi Ride Prep`;
    els.headerSub.textContent = `${bike.name} \u2014 ${dateStr}`;
    updateProgress();
    if (!isRestore) saveState();
  }

  function toggleItem(el) {
    const key = el.dataset.key;
    checkState[key] = !checkState[key];
    el.classList.toggle('checked', checkState[key]);
    updateProgress();
    saveState();
  }

  function updateProgress() {
    const total = Object.keys(checkState).length;
    const done = Object.values(checkState).filter(Boolean).length;
    const pct = total > 0 ? (done / total * 100) : 0;
    els.progressFill.style.width = pct + '%';
    els.progressText.textContent = `${done}/${total} items \u2014 ${Math.round(pct)}%`;

    document.querySelectorAll('.section').forEach(sec => {
      const items = sec.querySelectorAll('.item');
      const checked = sec.querySelectorAll('.item.checked');
      const badge = sec.querySelector('.section-badge');
      if (badge) {
        badge.textContent = `${checked.length}/${items.length}`;
        badge.classList.toggle('done', checked.length === items.length);
      }
    });
  }

  function resetAll() {
    if (confirm('Start a new ride prep?')) {
      clearState();
      checkState = {};
      weatherData = null;
      els.setupScreen.classList.remove('hidden');
      els.checklistScreen.classList.add('hidden');
      els.progressBar.classList.add('hidden');
      els.progressText.classList.add('hidden');
      els.headerTitle.textContent = 'Ride Prep';
      els.headerSub.textContent = 'Get ready for tomorrow\'s ride';
      els.rideMiles.value = '';
      els.rideTemp.value = '';
      els.rideWind.value = '';
      els.rideAqi.value = '';
      els.rideMeetup.value = '';
      els.rideLock.value = 'no';
      els.rideSunset.value = '18:30';
      els.weatherStatus.className = 'weather-status';
      els.weatherPreview.classList.remove('visible');
      els.checklistContainer.innerHTML = '';
      els.weatherBanner.innerHTML = '';
      els.rideSummary.innerHTML = '';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      els.rideDate.value = tomorrow.toISOString().split('T')[0];
    }
  }

  // ── Service Worker Registration ───────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
}

// ── Node.js exports for testing ──────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { esc, formatTime, assessWeather, isRidingAfterDark, getClothingItems };
}
