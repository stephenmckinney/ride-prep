// AUTO-GENERATED — do not edit by hand.
// Edit config/ride.yaml and run: npm run generate

globalThis.RIDE_CONFIG = {
  defaults: {
    avgSpeedMph: 15,
    distanceMiles: 30,
    sunset: '18:30',
  },
  bikes: {
    caledonia: {
      name: 'Cervélo Caledonia-5',
      tire: '700C x 25',
      frontPsi: '55–60',
      rearPsi: '60–65',
    },
    r3: {
      name: 'Cervélo R3',
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
      frontPsi: '22–24',
      rearPsi: '24–26',
    },
  },
  weather: {
    temp: {
      nope: { below: 40, above: 95 },
      rough: { below: 50, above: 90 },
      fair: { below: 60, above: 85 },
    },
    wind: {
      nope: { above: 25 },
      rough: { above: 15 },
      fair: { above: 10 },
    },
    aqi: {
      nope: { above: 150 },
      rough: { above: 100 },
      fair: { above: 50 },
    },
  },
  supplies: {
    bottlesOnBike: 2,
    mixBagsPerExtraHour: 1,
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RIDE_CONFIG: globalThis.RIDE_CONFIG };
}
