// License: Proprietary. All rights reserved.

/**
 * Weather Forecast Portal - US Cities
 * Mock data and utility functions for the weather forecast table view.
 */

const weatherData = [
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
 * Returns a copy of all weather data entries.
 * @returns {Array<Object>}
 */
function getAllWeatherData() {
  return weatherData.slice();
}

/**
 * Filters weather data by condition (case-insensitive).
 * @param {string} condition - Condition to filter by (empty string returns all).
 * @returns {Array<Object>}
 */
function filterByCondition(condition) {
  if (!condition) return weatherData.slice();
  const lower = condition.toLowerCase();
  return weatherData.filter(function (entry) {
    return entry.condition.toLowerCase() === lower;
  });
}

/**
 * Sorts an array of weather entries by a given key.
 * @param {Array<Object>} data
 * @param {string} key - One of: city, state, temperature, humidity, windSpeed, condition, forecastDate
 * @returns {Array<Object>} New sorted array.
 */
function sortData(data, key) {
  const validKeys = ['city', 'state', 'temperature', 'humidity', 'windSpeed', 'condition', 'forecastDate'];
  if (!validKeys.includes(key)) return data.slice();
  return data.slice().sort(function (a, b) {
    if (typeof a[key] === 'number') return a[key] - b[key];
    return String(a[key]).localeCompare(String(b[key]));
  });
}

/**
 * Returns filtered and sorted weather data.
 * @param {string} condition - Condition filter (empty = all).
 * @param {string} sortKey - Key to sort by (default: 'city').
 * @returns {Array<Object>}
 */
function getFilteredData(condition, sortKey) {
  const filtered = filterByCondition(condition);
  return sortData(filtered, sortKey || 'city');
}

/**
 * Returns a summary count grouped by condition.
 * @returns {Object} Map of condition -> count.
 */
function getConditionSummary() {
  return weatherData.reduce(function (acc, entry) {
    acc[entry.condition] = (acc[entry.condition] || 0) + 1;
    return acc;
  }, {});
}

// Browser global exposure
if (typeof window !== 'undefined') {
  window.WeatherApp = { getAllWeatherData, filterByCondition, sortData, getFilteredData, getConditionSummary };
}

// CommonJS export for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getAllWeatherData, filterByCondition, sortData, getFilteredData, getConditionSummary, weatherData };
}
