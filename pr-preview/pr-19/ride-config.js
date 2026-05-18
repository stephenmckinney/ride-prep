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
      tire: 'Vittoria Corsa Control TLR 28c',
      frontPsi: '48–52',
      rearPsi: '52–56',
    },
    r3: {
      name: 'Cervélo R3',
      tire: '700C x 23 (tubed)',
      frontPsi: '68',
      rearPsi: '72',
    },
    cx: {
      name: 'Open UP 700C (CX)',
      tire: 'Donnelly PDX (F) / MXP (R) 700x33',
      frontPsi: '22–23',
      rearPsi: '24–25',
    },
    gravel: {
      name: 'Open UP 650B (Gravel)',
      tire: 'Rene Herse 650Bx48 Juniper Ridge',
      frontPsi: '16–18',
      rearPsi: '18–20',
    },
    mtb: {
      name: 'Ibis Ripley MTB',
      tire: '29" x 2.4"',
      frontPsi: '22–24',
      rearPsi: '24–26',
      fork: {
        model: 'RockShox Pike 29',
        travel: '140mm',
        psi: '52–57',
      },
      shock: {
        model: 'RockShox Deluxe Select+',
        stroke: '52.5mm',
        psi: '140–150',
      },
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
