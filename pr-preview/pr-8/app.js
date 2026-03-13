// ── Pure utility functions (testable without DOM) ───────────────

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const METRIC_THRESHOLDS = {
  temp: [
    { check: (v) => v < 40 || v > 95, level: 'nope' },
    { check: (v) => v < 50 || v > 90, level: 'rough' },
    { check: (v) => v < 60 || v > 85, level: 'fair' },
  ],
  wind: [
    { check: (v) => v > 25, level: 'nope' },
    { check: (v) => v > 15, level: 'rough' },
    { check: (v) => v > 10, level: 'fair' },
  ],
  aqi: [
    { check: (v) => v > 150, level: 'nope' },
    { check: (v) => v > 100, level: 'rough' },
    { check: (v) => v > 50, level: 'fair' },
  ],
};

function assessMetric(type, value) {
  if (value === null || value === undefined || Number.isNaN(value))
    return 'good';
  const thresholds = METRIC_THRESHOLDS[type];
  if (!thresholds) return 'good';
  for (const t of thresholds) {
    if (t.check(value)) return t.level;
  }
  return 'good';
}

function assessWeather(temp, wind, aqi) {
  const levels = [
    assessMetric('temp', temp),
    assessMetric('wind', wind),
    assessMetric('aqi', aqi),
  ];
  if (levels.includes('nope'))
    return { cls: 'nope', label: "Bro?! It's trainer season" };
  if (levels.includes('rough'))
    return { cls: 'rough', label: 'Oof! Do you really want to ride outside?' };
  if (levels.includes('fair'))
    return { cls: 'fair', label: "Good conditions. Let's ride!" };
  return { cls: 'good', label: 'Perfect conditions!' };
}

function isRidingAfterDark(rideTime, rideDurationHrs, sunsetStr) {
  const [startH, startM] = rideTime.split(':').map(Number);
  const [sunH, sunM] = sunsetStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const sunsetMinutes = sunH * 60 + sunM;
  const endMinutes = startMinutes + Math.round(rideDurationHrs * 60);
  return endMinutes > sunsetMinutes;
}

function getRideEndHour(startHour, miles) {
  const durationHrs = miles / AVG_SPEED_MPH;
  return Math.min(Math.ceil(startHour + durationHrs), 23);
}

function extractWeatherRange(
  hourlyTemps,
  hourlyWind,
  hourlyHumidity,
  hourlyPrecip,
  startIndex,
  endIndex,
) {
  const len = hourlyTemps.length;
  if (len === 0) {
    return {
      tempLow: Number.NaN,
      tempHigh: Number.NaN,
      windMax: Number.NaN,
      humidityMax: Number.NaN,
      precipMax: Number.NaN,
    };
  }

  const start = Math.min(Math.max(0, startIndex), len - 1);
  const end = Math.min(Math.max(start, endIndex), len - 1);

  let tempLow = Number.POSITIVE_INFINITY;
  let tempHigh = Number.NEGATIVE_INFINITY;
  let windMax = 0;
  let humidityMax = 0;
  let precipMax = 0;

  for (let i = start; i <= end; i++) {
    const t = hourlyTemps[i];
    if (t < tempLow) tempLow = t;
    if (t > tempHigh) tempHigh = t;
    if (hourlyWind[i] > windMax) windMax = hourlyWind[i];
    if (hourlyHumidity[i] > humidityMax) humidityMax = hourlyHumidity[i];
    if (hourlyPrecip[i] > precipMax) precipMax = hourlyPrecip[i];
  }

  return {
    tempLow: Math.round(tempLow),
    tempHigh: Math.round(tempHigh),
    windMax: Math.round(windMax),
    humidityMax: Math.round(humidityMax),
    precipMax,
  };
}

// ── Constants ───────────────────────────────────────────────────

const COLD_THRESHOLD = 50; // Below: winter tights, overshoes, winter gloves
const COOL_THRESHOLD = 60; // Below: leg warmers, oversocks, long-fingered gloves
const AVG_SPEED_MPH = 15; // Used to estimate ride duration

const BIKES = {
  caledonia: {
    name: 'Cerv\u00E9lo Caledonia-5',
    tire: '700C x 25',
    frontPsi: '55\u201360',
    rearPsi: '60\u201365',
  },
  r3: {
    name: 'Cerv\u00E9lo R3',
    tire: '700C x 23',
    frontPsi: '70',
    rearPsi: '70',
  },
  cx: {
    name: 'Open UP 700C (CX)',
    tire: '700C x 34',
    frontPsi: '25',
    rearPsi: '25',
  },
  gravel: {
    name: 'Open UP 650B (Gravel)',
    tire: '650B',
    frontPsi: '24',
    rearPsi: '25',
  },
  mtb: {
    name: 'Ripley MTB',
    tire: '29" x 2.4"',
    frontPsi: '22\u201324',
    rearPsi: '24\u201326',
  },
};

const CLOTHING_RULES = [
  {
    min: 71,
    max: Number.POSITIVE_INFINITY,
    prepend: [{ id: 'jersey', text: 'Jersey' }],
  },
  {
    min: 65,
    max: 70,
    prepend: [
      {
        id: 'baselayer',
        text: 'Pro Team base layer',
        detail: 'Lightweight mesh',
      },
      { id: 'jersey', text: 'Brevet jersey' },
    ],
  },
  {
    min: 60,
    max: 64,
    prepend: [
      { id: 'baselayer', text: 'Merino wool base layer' },
      { id: 'jersey', text: 'Brevet jersey' },
    ],
  },
  {
    min: 55,
    max: 59,
    prepend: [
      { id: 'baselayer', text: 'Merino wool base layer' },
      { id: 'jersey', text: 'Long-sleeve jersey' },
    ],
  },
  {
    min: 50,
    max: 54,
    prepend: [
      { id: 'baselayer', text: 'Merino wool base layer' },
      { id: 'jersey', text: 'Long-sleeve jersey' },
      { id: 'windjacket', text: 'Classic Wind jacket' },
    ],
  },
  {
    min: 40,
    max: 49,
    prepend: [
      { id: 'baselayer', text: 'Merino wool base layer' },
      { id: 'jersey', text: 'Long-sleeve jersey' },
      { id: 'softshell', text: 'Classic Softshell jacket' },
    ],
    append: [
      {
        id: 'woolhat',
        text: 'Wool hat',
        detail: 'Optional \u2014 helps with ears',
      },
    ],
  },
  {
    min: 30,
    max: 39,
    prepend: [
      { id: 'baselayer', text: 'Merino wool base layer' },
      { id: 'jersey', text: 'Long-sleeve jersey' },
      { id: 'softshell', text: 'Classic Softshell jacket' },
    ],
    append: [
      { id: 'woolhat', text: 'Wool hat', detail: 'Must have' },
      { id: 'scarf', text: 'Cycling scarf' },
    ],
  },
];

function getClothingItems(temp) {
  const items = [
    {
      id: 'bibs',
      text:
        temp < COLD_THRESHOLD
          ? 'Classic winter tights'
          : temp < COOL_THRESHOLD
            ? 'Bib shorts + leg warmers'
            : 'Bib shorts',
    },
    { id: 'socks', text: 'Pro Team Socks' },
    {
      id: 'shoes',
      text: `Shoes${temp < COLD_THRESHOLD ? ' + overshoes' : temp < COOL_THRESHOLD ? ' + oversocks' : ''}`,
    },
    {
      id: 'gloves',
      text:
        temp < COLD_THRESHOLD
          ? 'Winter gloves'
          : temp < COOL_THRESHOLD
            ? 'Long-fingered gloves'
            : 'Short-fingered gloves',
    },
  ];

  const rule = CLOTHING_RULES.find((r) => temp >= r.min && temp <= r.max);
  if (rule) {
    if (rule.prepend) {
      for (const item of [...rule.prepend].reverse())
        items.unshift({ ...item });
    }
    if (rule.append) {
      for (const item of rule.append) items.push({ ...item });
    }
  }

  return items;
}

function getAccessoryItems() {
  return [
    { id: 'helmet', text: 'Helmet' },
    { id: 'sunglasses', text: 'Sunglasses' },
    { id: 'handkerchief', text: 'Handkerchief' },
    { id: 'whoop', text: 'WHOOP arm band' },
    { id: 'bikebag', text: 'Bike bag', detail: 'Credit card, ID, phone' },
  ];
}

// ── Weather API ─────────────────────────────────────────────────

async function geocodeLocation(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find "${name}". Try a more specific city name.`);
  }
  const {
    latitude,
    longitude,
    timezone,
    name: cityName,
    admin1,
  } = data.results[0];
  return { latitude, longitude, timezone, cityName, admin1 };
}

async function fetchForecast(lat, lon, tz, date, startHourIndex, endHourIndex) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(tz)}&start_date=${date}&end_date=${date}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
    throw new Error(
      'No forecast data available for this date. Try a date within the next 7 days.',
    );
  }

  const range = extractWeatherRange(
    data.hourly.temperature_2m,
    data.hourly.wind_speed_10m,
    data.hourly.relative_humidity_2m,
    data.hourly.precipitation_probability,
    startHourIndex,
    endHourIndex,
  );

  return {
    ...range,
    sunsetTime: data.daily.sunset[0].split('T')[1],
  };
}

async function fetchAqi(lat, lon, tz, date, startHourIndex, endHourIndex) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&timezone=${encodeURIComponent(tz)}&start_date=${date}&end_date=${date}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.hourly?.us_aqi) {
      const len = data.hourly.us_aqi.length;
      if (len === 0) return null;
      const start = Math.min(Math.max(0, startHourIndex), len - 1);
      const end = Math.min(Math.max(start, endHourIndex), len - 1);
      let max = null;
      for (let i = start; i <= end; i++) {
        const val = data.hourly.us_aqi[i];
        if (val != null && (max === null || val > max)) max = val;
      }
      return max;
    }
  } catch (e) {
    /* best-effort */
  }
  return null;
}

// ── DOM-dependent code (only runs in browser) ───────────────────

void (() => {
  if (typeof document !== 'undefined') {
    const $ = (id) => document.getElementById(id);
    if (!$('fetchWeatherBtn')) return; // not on the app page (e.g. test runner)

    const PROGRESS_CIRCUMFERENCE = 163.36; // 2 * π * 26

    const els = {
      headerTitle: $('headerTitle'),
      headerDatetime: $('headerDatetime'),
      headerMeta: $('headerMeta'),
      progressRing: $('progressRing'),
      progressFill: $('progressFill'),
      progressPct: $('progressPct'),
      weatherBlock: $('weatherBlock'),
      weatherCondition: $('weatherCondition'),
      weatherLocation: $('weatherLocation'),
      weatherStrip: $('weatherStrip'),
      setupScreen: $('setupScreen'),
      checklistScreen: $('checklistScreen'),
      checklistContainer: $('checklistContainer'),
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
      rideTempLow: $('rideTempLow'),
      rideTempHigh: $('rideTempHigh'),
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
      if (item) {
        toggleItem(item);
        return;
      }

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
    window.addEventListener('DOMContentLoaded', () => {
      loadState();
    });
    if (document.readyState !== 'loading') {
      loadState();
    }

    // ── Persistence ───────────────────────────────────────────────

    const STORAGE_KEY = 'ridePrep_v3';
    const FORM_FIELDS = [
      'rideDate',
      'rideTime',
      'rideMiles',
      'rideLocation',
      'rideBike',
      'rideTempLow',
      'rideTempHigh',
      'rideWind',
      'rideAqi',
      'rideSunset',
      'rideMeetup',
      'rideLock',
    ];

    function getFormValues() {
      const form = {};
      for (const id of FORM_FIELDS) {
        form[id] = els[id].value;
      }
      return form;
    }

    function setFormValues(form) {
      if (!form) return;
      for (const [id, val] of Object.entries(form)) {
        if (els[id] && val) els[id].value = val;
      }
    }

    function saveState() {
      try {
        const state = {
          screen: els.checklistScreen.classList.contains('hidden')
            ? 'setup'
            : 'checklist',
          checkState,
          weatherData,
          form: getFormValues(),
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        /* storage full or unavailable */
      }
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
      } catch (e) {
        return false;
      }
    }

    function clearState() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }

    // ── Weather UI ────────────────────────────────────────────────

    function displayWeatherPreview(data) {
      els.wpTemp.textContent =
        data.tempLow === data.tempHigh
          ? `${data.tempLow}\u00B0`
          : `${data.tempLow}\u00B0\u2013${data.tempHigh}\u00B0`;
      els.wpWind.textContent = data.windMax;
      els.wpAqi.textContent = data.aqi !== null ? data.aqi : '\u2014';
      els.wpHumidity.textContent = `${data.humidityMax}%`;
      els.wpSunset.textContent = formatTime(data.sunsetTime);
      els.wpPrecip.textContent = `${data.precipMax}%`;
      els.weatherPreview.classList.add('visible');
    }

    async function handleFetchWeather() {
      const location = els.rideLocation.value.trim();
      const rideDate = els.rideDate.value;
      const rideTime = els.rideTime.value;

      if (!location) {
        showStatus('error', 'Enter a location first.');
        return;
      }
      if (!rideDate) {
        showStatus('error', 'Enter a ride date first.');
        return;
      }

      els.fetchWeatherBtn.disabled = true;
      els.fetchWeatherBtn.textContent = 'Fetching\u2026';
      showStatus('loading', 'Looking up location\u2026');

      try {
        const geo = await geocodeLocation(location);
        const label = `${geo.cityName}${geo.admin1 ? `, ${geo.admin1}` : ''}`;
        showStatus('loading', `Found ${label}. Fetching forecast\u2026`);

        const [startH] = rideTime.split(':').map(Number);
        const miles = Number.parseFloat(els.rideMiles.value);
        const endH =
          Number.isFinite(miles) && miles > 0
            ? getRideEndHour(startH, miles)
            : startH;

        const forecast = await fetchForecast(
          geo.latitude,
          geo.longitude,
          geo.timezone,
          rideDate,
          startH,
          endH,
        );
        const aqi = await fetchAqi(
          geo.latitude,
          geo.longitude,
          geo.timezone,
          rideDate,
          startH,
          endH,
        );

        els.rideTempLow.value = forecast.tempLow;
        els.rideTempHigh.value = forecast.tempHigh;
        els.rideWind.value = forecast.windMax;
        if (aqi !== null) els.rideAqi.value = aqi;
        els.rideSunset.value = forecast.sunsetTime;

        weatherData = { ...forecast, aqi, locationName: label };
        displayWeatherPreview(weatherData);

        showStatus(
          'success',
          `Weather loaded for ${label} on ${rideDate}. Fields auto-filled \u2014 adjust if needed.`,
        );
      } catch (err) {
        showStatus(
          'error',
          err.message ||
            'Failed to fetch weather. You can enter values manually.',
        );
        els.weatherPreview.classList.remove('visible');
      } finally {
        els.fetchWeatherBtn.disabled = false;
        els.fetchWeatherBtn.textContent = 'Fetch Weather for Ride Day';
      }
    }

    function showStatus(type, msg) {
      els.weatherStatus.className = `weather-status ${type}`;
      els.weatherStatus.textContent = msg;
    }

    // ── Checklist State ───────────────────────────────────────────

    let checkState = {};
    let weatherData = null;

    // ── Checklist Generation ──────────────────────────────────────

    function generateChecklist(isRestore) {
      const miles = Number.parseFloat(els.rideMiles.value);
      const tempLow = Number.parseFloat(els.rideTempLow.value);
      const tempHigh = Number.parseFloat(els.rideTempHigh.value);
      const wind = Number.parseFloat(els.rideWind.value);
      const aqi = Number.parseFloat(els.rideAqi.value);
      const bikeKey = els.rideBike.value;
      const meetup = els.rideMeetup.value.trim();
      const needLock = els.rideLock.value === 'yes';
      const rideDate = els.rideDate.value;
      const rideTime = els.rideTime.value;
      const location = els.rideLocation.value;

      if (!Number.isFinite(miles) || miles <= 0 || !Number.isFinite(tempLow)) {
        alert(
          'Please enter miles and a low temperature (or fetch weather first).',
        );
        return;
      }

      // Use the high temp if provided, otherwise fall back to low
      const effectiveHigh = Number.isFinite(tempHigh) ? tempHigh : tempLow;
      const hasRange = effectiveHigh !== tempLow;

      const bike = BIKES[bikeKey];
      const rideDurationHrs = miles / AVG_SPEED_MPH;
      const hours = Math.ceil(rideDurationHrs);
      const waffles = hours;

      const sunsetStr = els.rideSunset.value;
      const ridingDark = isRidingAfterDark(
        rideTime,
        rideDurationHrs,
        sunsetStr,
      );
      const extraBags = Math.max(0, hours - 2);

      // Assess using worst-case: lowest temp, highest wind/AQI
      const weather = assessWeather(tempLow, wind, aqi);

      const humidity = weatherData ? `${weatherData.humidityMax}%` : '\u2014';
      const precipChance = weatherData ? `${weatherData.precipMax}%` : '\u2014';
      const locationName = weatherData ? weatherData.locationName : location;

      const tempLowCls = assessMetric('temp', tempLow);
      const tempHighCls = assessMetric('temp', effectiveHigh);
      // Use the worse of the two temp assessments for the range display
      const LEVEL_RANK = { good: 0, fair: 1, rough: 2, nope: 3 };
      const tempCls =
        LEVEL_RANK[tempLowCls] > LEVEL_RANK[tempHighCls]
          ? tempLowCls
          : tempHighCls;
      const windCls = assessMetric('wind', wind);
      const aqiCls = assessMetric('aqi', aqi);

      const tempDisplay = hasRange
        ? `${esc(String(tempLow))}\u2013${esc(String(effectiveHigh))}\u00B0F`
        : `${esc(String(tempLow))}\u00B0F`;

      // Populate weather block in header
      els.weatherBlock.className = `weather-block weather-block--${weather.cls}`;
      els.weatherCondition.textContent = weather.label;
      els.weatherLocation.textContent = locationName;
      els.weatherStrip.innerHTML = `
        <div class="weather-stat"><div class="weather-stat__value metric-${tempCls}">${tempDisplay}</div><div class="weather-stat__label">Temp</div></div>
        <div class="weather-sep"></div>
        <div class="weather-stat"><div class="weather-stat__value metric-${windCls}">${Number.isFinite(wind) ? `${esc(String(wind))} mph` : '\u2014'}</div><div class="weather-stat__label">Wind</div></div>
        <div class="weather-sep"></div>
        <div class="weather-stat"><div class="weather-stat__value">${esc(precipChance)}</div><div class="weather-stat__label">Rain</div></div>
        <div class="weather-sep"></div>
        <div class="weather-stat"><div class="weather-stat__value metric-${aqiCls}">${Number.isFinite(aqi) ? `AQI ${esc(String(aqi))}` : '\u2014'}</div><div class="weather-stat__label">Air</div></div>
        <div class="weather-sep"></div>
        <div class="weather-stat"><div class="weather-stat__value">${sunsetStr ? esc(formatTime(sunsetStr)) : '\u2014'}</div><div class="weather-stat__label">Sunset</div></div>
      `;

      const dateStr = new Date(`${rideDate}T12:00:00`).toLocaleDateString(
        'en-US',
        { weekday: 'short', month: 'short', day: 'numeric' },
      );

      // Build sections
      const sections = [];

      const bikeItems = [
        { id: 'wahoo', text: 'Charge Wahoo ROAM 3', detail: 'Bike computer' },
        { id: 'lights', text: 'Charge Garmin lights' },
        { id: 'chain', text: 'Check chain \u2014 needs wax?' },
        {
          id: 'tires',
          text: `Pump tires \u2014 Front: ${bike.frontPsi} PSI / Rear: ${bike.rearPsi} PSI`,
          detail: bike.tire,
        },
        { id: 'route', text: 'Load route on Wahoo' },
      ];
      if (needLock)
        bikeItems.push({
          id: 'lock',
          text: 'Pack bike lock',
          detail: 'Urban ride with stops',
        });
      if (ridingDark)
        bikeItems.push({
          id: 'extralights',
          text: 'Mount front & rear Garmin lights on bike',
          detail: `Ride may extend past sunset (${formatTime(sunsetStr)})`,
        });
      sections.push({
        title: 'Bike Prep (Night Before)',
        emoji: '\uD83D\uDD27',
        items: bikeItems,
      });

      sections.push({
        title: 'Pre-Ride Activation',
        emoji: '🏋️',
        items: [
          { id: 'marching', text: 'Core Single Leg Marching', detail: '1 set' },
          { id: 'clams', text: 'Clams', detail: '2 sets each side' },
          {
            id: 'abduction',
            text: 'Side Lying Abduction',
            detail: '2 sets each side',
          },
        ],
      });

      const clothingItems = getClothingItems(tempLow);
      sections.push({
        title: 'Clothing',
        emoji: '\uD83D\uDC55',
        items: clothingItems,
      });

      const accessoryItems = getAccessoryItems();
      sections.push({
        title: 'Accessories',
        emoji: '\uD83E\uDD7D',
        items: accessoryItems,
      });

      const foodItems = [
        {
          id: 'preride',
          text: 'Pre-ride meal',
          detail:
            'Oatmeal + berries or cereal + fruit \u2014 eat 1\u20132 hrs before',
        },
        {
          id: 'waffles',
          text: `Pack ${waffles} Honey Stinger Waffle${waffles > 1 ? 's' : ''}`,
          detail: `${waffles} waffle${waffles > 1 ? 's' : ''} for ~${hours} hr ride`,
        },
        { id: 'bottles', text: 'Fill 2 bottles with Skratch mix' },
      ];
      if (extraBags > 0) {
        foodItems.push({
          id: 'bags',
          text: `Pack ${extraBags} Ziploc bag${extraBags > 1 ? 's' : ''} of Skratch mix`,
          detail: `${2 + extraBags} total bottles for ~${hours} hr ride`,
        });
      }
      foodItems.push({
        id: 'recovery',
        text: 'Prep Skratch Chocolate Recovery Shake',
        detail: 'Have it ready in the fridge for post-ride',
      });
      sections.push({
        title: 'Food & Hydration',
        emoji: '\uD83C\uDF6F',
        items: foodItems,
      });

      if (meetup) {
        sections.push({
          title: 'Meetup',
          emoji: '\uD83D\uDC65',
          items: [
            { id: 'meetup', text: meetup, detail: 'Confirm with your group' },
            {
              id: 'traveltime',
              text: 'Account for travel time to start',
              detail: 'Work backwards from meeting time',
            },
          ],
        });
      }

      sections.push({
        title: 'Post-Ride',
        emoji: '🧹',
        items: [
          { id: 'chain', text: 'Wipe bike chain' },
          {
            id: 'wash',
            text: 'Wash helmet and gloves',
            detail: 'Mild soap and water, air dry',
          },
          { id: 'charge', text: 'Charge bike computer and lights' },
          {
            id: 'recovery',
            text: 'Recovery shake or balanced meal',
            detail: 'Within 30 minutes of finishing',
          },
          { id: 'shower', text: 'Shower' },
        ],
      });

      // Render checklist items
      const savedChecks = isRestore ? { ...checkState } : {};
      checkState = {};
      let html = '';
      const CHECK_SVG =
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      sections.forEach((sec, si) => {
        const sectionId = `sec_${si}`;
        let itemsHtml = '';
        sec.items.forEach((item, ii) => {
          const key = `${sectionId}_${item.id}_${ii}`;
          const wasChecked = isRestore && savedChecks[key];
          checkState[key] = !!wasChecked;
          const checkedClass = wasChecked ? ' checked' : '';
          const detailHtml = item.detail
            ? `<div class="item-detail">${esc(item.detail)}</div>`
            : '';
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

      // Populate header
      const cityName = location.split(',')[0].trim();
      els.headerTitle.textContent = `${miles}mi ${cityName} Ride Prep`;
      els.headerDatetime.textContent = `${dateStr} \u00B7 ${formatTime(rideTime)}`;
      els.headerMeta.innerHTML = `
        <span class="ride-header__meta-value">${esc(String(miles))} mi</span>
        <span>distance</span>
        <span class="ride-header__meta-sep">\u00B7</span>
        <span class="ride-header__meta-value">~${hours} hr${hours > 1 ? 's' : ''}</span>
        <span>est.</span>
        <span class="ride-header__meta-sep">\u00B7</span>
        <span class="ride-header__meta-bike">${esc(bike.name)}</span>
      `;
      els.headerMeta.classList.remove('hidden');
      els.progressRing.classList.remove('hidden');
      els.weatherBlock.classList.remove('hidden');
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
      const pct = total > 0 ? done / total : 0;
      const offset = PROGRESS_CIRCUMFERENCE * (1 - pct);
      els.progressFill.style.strokeDashoffset = offset;
      els.progressPct.textContent = `${Math.round(pct * 100)}%`;

      for (const sec of document.querySelectorAll('.section')) {
        const items = sec.querySelectorAll('.item');
        const checked = sec.querySelectorAll('.item.checked');
        const badge = sec.querySelector('.section-badge');
        if (badge) {
          badge.textContent = `${checked.length}/${items.length}`;
          badge.classList.toggle('done', checked.length === items.length);
        }
      }
    }

    function resetAll() {
      if (confirm('Start a new ride prep?')) {
        clearState();
        checkState = {};
        weatherData = null;
        els.setupScreen.classList.remove('hidden');
        els.checklistScreen.classList.add('hidden');
        els.progressRing.classList.add('hidden');
        els.headerMeta.classList.add('hidden');
        els.weatherBlock.classList.add('hidden');
        els.headerTitle.textContent = 'Ride Prep';
        els.headerDatetime.textContent = "Get ready for tomorrow's ride";
        els.rideMiles.value = '';
        els.rideTempLow.value = '';
        els.rideTempHigh.value = '';
        els.rideWind.value = '';
        els.rideAqi.value = '';
        els.rideMeetup.value = '';
        els.rideLock.value = 'no';
        els.rideSunset.value = '18:30';
        els.weatherStatus.className = 'weather-status';
        els.weatherPreview.classList.remove('visible');
        els.checklistContainer.innerHTML = '';
        els.weatherStrip.innerHTML = '';
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
})();

// ── Node.js exports for testing ──────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esc,
    formatTime,
    assessWeather,
    assessMetric,
    isRidingAfterDark,
    getRideEndHour,
    extractWeatherRange,
    getClothingItems,
    getAccessoryItems,
    COLD_THRESHOLD,
    COOL_THRESHOLD,
    AVG_SPEED_MPH,
  };
}
