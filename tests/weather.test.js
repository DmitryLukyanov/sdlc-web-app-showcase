// License: Proprietary. All rights reserved.

'use strict';

const {
  getAllWeatherData,
  filterByCondition,
  sortData,
  getFilteredData,
  getConditionSummary,
  weatherData,
} = require('../frontend/weather.js');

describe('weatherData', () => {
  test('contains exactly 10 cities', () => {
    expect(weatherData).toHaveLength(10);
  });

  test('each entry has all required fields', () => {
    const requiredFields = ['city', 'state', 'temperature', 'humidity', 'windSpeed', 'condition', 'forecastDate'];
    weatherData.forEach((entry) => {
      requiredFields.forEach((field) => {
        expect(entry).toHaveProperty(field);
      });
    });
  });

  test('includes all expected cities', () => {
    const cities = weatherData.map((e) => e.city);
    const expected = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    ];
    expected.forEach((city) => {
      expect(cities).toContain(city);
    });
  });

  test('temperature values are numeric', () => {
    weatherData.forEach((entry) => {
      expect(typeof entry.temperature).toBe('number');
    });
  });

  test('humidity values are between 0 and 100', () => {
    weatherData.forEach((entry) => {
      expect(entry.humidity).toBeGreaterThanOrEqual(0);
      expect(entry.humidity).toBeLessThanOrEqual(100);
    });
  });

  test('wind speed values are non-negative', () => {
    weatherData.forEach((entry) => {
      expect(entry.windSpeed).toBeGreaterThanOrEqual(0);
    });
  });

  test('forecastDate is a valid date string', () => {
    weatherData.forEach((entry) => {
      expect(new Date(entry.forecastDate).toString()).not.toBe('Invalid Date');
    });
  });
});

describe('getAllWeatherData', () => {
  test('returns an array with 10 entries', () => {
    expect(getAllWeatherData()).toHaveLength(10);
  });

  test('returns a copy, not the original array', () => {
    const data = getAllWeatherData();
    expect(data).not.toBe(weatherData);
  });
});

describe('filterByCondition', () => {
  test('returns all entries when condition is empty string', () => {
    expect(filterByCondition('')).toHaveLength(10);
  });

  test('returns only sunny cities', () => {
    const sunny = filterByCondition('Sunny');
    expect(sunny.length).toBeGreaterThan(0);
    sunny.forEach((entry) => {
      expect(entry.condition).toBe('Sunny');
    });
  });

  test('is case-insensitive', () => {
    const lower = filterByCondition('sunny');
    const upper = filterByCondition('Sunny');
    expect(lower).toEqual(upper);
  });

  test('returns empty array for unknown condition', () => {
    expect(filterByCondition('Tornado')).toHaveLength(0);
  });

  test('returns only rainy cities', () => {
    const rainy = filterByCondition('Rainy');
    expect(rainy.length).toBeGreaterThan(0);
    rainy.forEach((entry) => {
      expect(entry.condition).toBe('Rainy');
    });
  });
});

describe('sortData', () => {
  test('sorts by city name alphabetically', () => {
    const sorted = sortData(weatherData, 'city');
    const cities = sorted.map((e) => e.city);
    expect(cities).toEqual([...cities].sort());
  });

  test('sorts by temperature ascending', () => {
    const sorted = sortData(weatherData, 'temperature');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].temperature).toBeGreaterThanOrEqual(sorted[i - 1].temperature);
    }
  });

  test('sorts by humidity ascending', () => {
    const sorted = sortData(weatherData, 'humidity');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].humidity).toBeGreaterThanOrEqual(sorted[i - 1].humidity);
    }
  });

  test('returns a copy, not the original array', () => {
    const sorted = sortData(weatherData, 'city');
    expect(sorted).not.toBe(weatherData);
  });

  test('returns data unchanged for invalid sort key', () => {
    const result = sortData(weatherData, 'invalid_key');
    expect(result).toHaveLength(weatherData.length);
  });
});

describe('getFilteredData', () => {
  test('returns all data when no filter or sort specified', () => {
    expect(getFilteredData('', '')).toHaveLength(10);
  });

  test('filters and sorts correctly', () => {
    const result = getFilteredData('Sunny', 'temperature');
    result.forEach((entry) => {
      expect(entry.condition).toBe('Sunny');
    });
    for (let i = 1; i < result.length; i++) {
      expect(result[i].temperature).toBeGreaterThanOrEqual(result[i - 1].temperature);
    }
  });

  test('defaults sort to city when key is not provided', () => {
    const result = getFilteredData('');
    const cities = result.map((e) => e.city);
    expect(cities).toEqual([...cities].sort());
  });
});

describe('getConditionSummary', () => {
  test('returns an object with condition keys', () => {
    const summary = getConditionSummary();
    expect(typeof summary).toBe('object');
    expect(Object.keys(summary).length).toBeGreaterThan(0);
  });

  test('total count equals number of cities', () => {
    const summary = getConditionSummary();
    const total = Object.values(summary).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(10);
  });

  test('Sunny count is correct', () => {
    const summary = getConditionSummary();
    const sunnyCount = weatherData.filter((e) => e.condition === 'Sunny').length;
    expect(summary['Sunny']).toBe(sunnyCount);
  });
});
