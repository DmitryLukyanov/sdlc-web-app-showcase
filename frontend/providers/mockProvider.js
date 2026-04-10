// License: Proprietary. All rights reserved.

/**
 * Mock Weather Provider
 *
 * Returns hardcoded weather data for three cities:
 *   - New York  → Sunny
 *   - Los Angeles → Snow
 *   - Washington D.C. → Windy
 *
 * All non-condition fields use static placeholder values that satisfy the
 * WeatherRecord type contract (`state`, `temperature`, `humidity`, `windSpeed`,
 * `forecastDate` are present and correctly typed per data-model.md).
 *
 * City lookup is case-insensitive and alias-aware; see `aliasMap` below for
 * the full list of accepted input strings.
 *
 * @module mockProvider
 * @implements {WeatherProvider}
 *
 * @example
 * // To add a fourth supported city (e.g. "Boston"):
 * // 1. Add a WeatherRecord entry to mockData:
 * //      { city: 'Boston', state: 'MA', temperature: 50, humidity: 70,
 * //        windSpeed: 15, condition: 'Cloudy', forecastDate: '2024-06-15' }
 * // 2. Add its canonical key to aliasMap:
 * //      'boston': 'boston'
 * //    (and any additional aliases, e.g. 'bos': 'boston')
 * // 3. Run `npm test` — all existing tests should still pass.
 */

/**
 * Hardcoded mock weather dataset.
 * Spec-required fields: `city`, `condition`.
 * Placeholder fields: `state`, `temperature`, `humidity`, `windSpeed`, `forecastDate`
 * — present and correctly typed per data-model.md; values are not meaningful.
 *
 * @type {Array<Object>}
 */
var mockData = [
  {
    city: 'New York',
    state: 'NY',
    temperature: 55,
    humidity: 60,
    windSpeed: 10,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Los Angeles',
    state: 'CA',
    temperature: 34,
    humidity: 40,
    windSpeed: 5,
    condition: 'Snow',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Washington D.C.',
    state: 'DC',
    temperature: 72,
    humidity: 55,
    windSpeed: 20,
    condition: 'Windy',
    forecastDate: '2024-06-15',
  },
];

/**
 * Alias map for city name normalisation.
 *
 * Keys   : lowercase input strings the user might provide.
 * Values : canonical lowercase city name used to look up `mockData`.
 *
 * Canonical keys (value === city.toLowerCase() from mockData):
 *   'new york'       → 'new york'        (New York)
 *   'los angeles'    → 'los angeles'     (Los Angeles)
 *   'washington d.c.'→ 'washington d.c.' (Washington D.C.)
 *
 * Additional accepted aliases:
 *   'nyc'             → 'new york'
 *   'new york city'   → 'new york'
 *   'la'              → 'los angeles'
 *   'washington'      → 'washington d.c.'
 *   'washington dc'   → 'washington d.c.'
 *   'washington d.c.' → 'washington d.c.'  (already canonical)
 *
 * @type {Object.<string, string>}
 */
var aliasMap = {
  'new york': 'new york',
  'new york city': 'new york',
  'nyc': 'new york',
  'los angeles': 'los angeles',
  'la': 'los angeles',
  'washington d.c.': 'washington d.c.',
  'washington dc': 'washington d.c.',
  'washington': 'washington d.c.',
};

/**
 * Index from canonical lowercase city name to WeatherRecord.
 * Built once at module load for O(1) lookup.
 *
 * @type {Object.<string, Object>}
 */
var dataIndex = (function () {
  var index = {};
  for (var i = 0; i < mockData.length; i++) {
    index[mockData[i].city.toLowerCase()] = mockData[i];
  }
  return index;
}());

/**
 * Mock weather provider.
 * Returns hardcoded conditions for New York, Los Angeles, and Washington D.C.
 *
 * @type {WeatherProvider}
 */
var MockWeatherProvider = {
  /** @type {string} Unique provider identifier. */
  id: 'mock',

  /**
   * Returns weather data for the specified city (case-insensitive, alias-aware).
   *
   * @param {string} cityName - City name to look up (any case, aliases accepted).
   * @returns {Object|null} WeatherRecord if the city is supported, null otherwise.
   *   Never throws; unsupported cities return strictly null.
   */
  getByCity: function (cityName) {
    if (!cityName || !cityName.trim()) return null;
    var normalised = cityName.trim().toLowerCase();
    var canonical = aliasMap[normalised];
    if (!canonical) return null;
    return dataIndex[canonical] || null;
  },

  /**
   * Returns a shallow copy of all mock WeatherRecord entries.
   *
   * @returns {Array<Object>} Shallow copy of the 3-entry mock dataset.
   */
  getAll: function () {
    return mockData.slice();
  },
};

// Browser global exposure
if (typeof window !== 'undefined') {
  window.MockWeatherProvider = MockWeatherProvider;
}

// CommonJS export for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockWeatherProvider;
}
