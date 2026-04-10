// License: Proprietary. All rights reserved.

/**
 * Primary Weather Provider
 *
 * Wraps the existing 10-city weather dataset as a WeatherProvider implementation.
 * The dataset array is inlined here rather than imported from `weather.js`
 * to avoid a circular dependency: `weather.js` will eventually require
 * `providerRegistry.js`, which requires both providers; importing `weather.js`
 * from here would create a cycle that breaks module initialisation in Node/Jest.
 *
 * @module primaryProvider
 * @implements {WeatherProvider}
 */

/**
 * Raw 10-city weather dataset used by this provider implementation.
 * Declared at file scope in this classic script; treat it as an internal detail.
 * @type {Array<import('../weather').WeatherRecord>}
 */
var primaryProviderDataset = [
  {
    city: 'New York',
    state: 'NY',
    temperature: 68,
    humidity: 72,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Los Angeles',
    state: 'CA',
    temperature: 82,
    humidity: 45,
    windSpeed: 8,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Chicago',
    state: 'IL',
    temperature: 61,
    humidity: 65,
    windSpeed: 18,
    condition: 'Windy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Houston',
    state: 'TX',
    temperature: 91,
    humidity: 80,
    windSpeed: 10,
    condition: 'Rainy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Phoenix',
    state: 'AZ',
    temperature: 105,
    humidity: 15,
    windSpeed: 6,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Philadelphia',
    state: 'PA',
    temperature: 70,
    humidity: 68,
    windSpeed: 11,
    condition: 'Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Antonio',
    state: 'TX',
    temperature: 88,
    humidity: 74,
    windSpeed: 14,
    condition: 'Stormy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Diego',
    state: 'CA',
    temperature: 75,
    humidity: 60,
    windSpeed: 9,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Dallas',
    state: 'TX',
    temperature: 94,
    humidity: 55,
    windSpeed: 16,
    condition: 'Partly Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Jose',
    state: 'CA',
    temperature: 78,
    humidity: 50,
    windSpeed: 7,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
];

/**
 * Primary weather provider.
 * Exposes the existing 10-city dataset via the WeatherProvider interface.
 *
 * @type {WeatherProvider}
 */
var PrimaryWeatherProvider = {
  /** @type {string} Unique provider identifier. */
  id: 'primary',

  /**
   * Returns weather data for the specified city (case-insensitive).
   *
   * @param {string} cityName - The name of the city to look up.
   * @returns {Object|null} A WeatherRecord if found, or null if the city is not in the dataset.
   */
  getByCity: function (cityName) {
    if (!cityName) return null;
    var lower = cityName.trim().toLowerCase();
    for (var i = 0; i < primaryProviderDataset.length; i++) {
      if (primaryProviderDataset[i].city.toLowerCase() === lower) {
        return primaryProviderDataset[i];
      }
    }
    return null;
  },

  /**
   * Returns a shallow copy of all WeatherRecord entries.
   *
   * @returns {Array<Object>} Shallow copy of the full 10-city dataset.
   */
  getAll: function () {
    return primaryProviderDataset.slice();
  },
};

// Browser global exposure
if (typeof window !== 'undefined') {
  window.PrimaryWeatherProvider = PrimaryWeatherProvider;
}

// CommonJS export for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrimaryWeatherProvider;
}
