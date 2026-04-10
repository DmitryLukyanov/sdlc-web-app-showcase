// License: Proprietary. All rights reserved.

'use strict';

const {
  getAllWeatherData,
  filterByCondition,
  sortData,
  getFilteredData,
  getConditionSummary,
  weatherData,
  getAllFromAllProviders,
  filterByProvider,
  getAggregatedFilteredData,
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

// ── getAllFromAllProviders() (T004) ───────────────────────────────────────────

describe('getAllFromAllProviders', () => {
  test('returns an object with data and failedProviders arrays', () => {
    const result = getAllFromAllProviders();
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('failedProviders');
    expect(Array.isArray(result.data)).toBe(true);
    expect(Array.isArray(result.failedProviders)).toBe(true);
  });

  test('correct total record count — 13 (10 primary + 3 mock)', () => {
    const result = getAllFromAllProviders();
    expect(result.data).toHaveLength(13);
  });

  test('every record has a non-empty providerName field', () => {
    const result = getAllFromAllProviders();
    result.data.forEach((record) => {
      expect(record).toHaveProperty('providerName');
      expect(typeof record.providerName).toBe('string');
      expect(record.providerName.length).toBeGreaterThan(0);
    });
  });

  test('providerName values are registered provider IDs', () => {
    const result = getAllFromAllProviders();
    const validIds = ['primary', 'mock'];
    result.data.forEach((record) => {
      expect(validIds).toContain(record.providerName);
    });
  });

  test('failedProviders is [] when all providers succeed', () => {
    const result = getAllFromAllProviders();
    expect(result.failedProviders).toEqual([]);
  });

  test('records from primary provider have providerName === "primary"', () => {
    const result = getAllFromAllProviders();
    const primaryRecords = result.data.filter((r) => r.providerName === 'primary');
    expect(primaryRecords).toHaveLength(10);
  });

  test('records from mock provider have providerName === "mock"', () => {
    const result = getAllFromAllProviders();
    const mockRecords = result.data.filter((r) => r.providerName === 'mock');
    expect(mockRecords).toHaveLength(3);
  });

  test('original records are not mutated — providerName is on the copy', () => {
    // getAllWeatherData from primary does NOT return objects with providerName
    const primaryRaw = require('../frontend/providers/primaryProvider').getAll();
    primaryRaw.forEach((r) => {
      expect(r).not.toHaveProperty('providerName');
    });
  });

  test('simulated failing provider: populates failedProviders while returning others', () => {
    // Register a temporary failing provider
    jest.resetModules();
    const registry = require('../frontend/providerRegistry');
    const failingProvider = {
      id: 'failing',
      getByCity: () => null,
      getAll: () => { throw new Error('Network error'); },
    };
    registry.register(failingProvider);

    const { getAllFromAllProviders: freshGetAll } = require('../frontend/weather.js');
    const result = freshGetAll();
    expect(result.failedProviders).toContain('failing');
    // Other providers still returned their data
    expect(result.data.length).toBeGreaterThan(0);
  });
});

// ── filterByProvider() (T013) ────────────────────────────────────────────────

describe('filterByProvider', () => {
  const sampleData = [
    { city: 'New York', providerName: 'primary' },
    { city: 'Los Angeles', providerName: 'primary' },
    { city: 'New York', providerName: 'mock' },
    { city: 'Washington D.C.', providerName: 'mock' },
  ];

  test('single-provider selection returns only that provider records', () => {
    const result = filterByProvider(sampleData, ['primary']);
    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.providerName).toBe('primary'));
  });

  test('multi-provider selection returns union of their records', () => {
    const result = filterByProvider(sampleData, ['primary', 'mock']);
    expect(result).toHaveLength(4);
  });

  test('empty array returns all records unchanged', () => {
    const result = filterByProvider(sampleData, []);
    expect(result).toHaveLength(4);
  });

  test('null returns all records unchanged', () => {
    const result = filterByProvider(sampleData, null);
    expect(result).toHaveLength(4);
  });

  test('undefined returns all records unchanged', () => {
    const result = filterByProvider(sampleData, undefined);
    expect(result).toHaveLength(4);
  });

  test('unknown provider ID returns an empty array', () => {
    const result = filterByProvider(sampleData, ['unknown-provider']);
    expect(result).toHaveLength(0);
  });

  test('does not mutate the input array', () => {
    const copy = [...sampleData];
    filterByProvider(sampleData, ['primary']);
    expect(sampleData).toEqual(copy);
  });

  test('returns a new array', () => {
    const result = filterByProvider(sampleData, []);
    expect(result).not.toBe(sampleData);
  });

  test('never throws', () => {
    expect(() => filterByProvider([], null)).not.toThrow();
    expect(() => filterByProvider([], [])).not.toThrow();
    expect(() => filterByProvider(sampleData, ['primary'])).not.toThrow();
  });
});

// ── getAggregatedFilteredData() — WeatherApp.getFilteredData (T014) ──────────

describe('getAggregatedFilteredData (WeatherApp.getFilteredData)', () => {
  test('omitting providerIds returns all 13 records (backward-compatible)', () => {
    const result = getAggregatedFilteredData('', 'city');
    expect(result).toHaveLength(13);
  });

  test('passing providerIds=["primary"] returns only primary records (10)', () => {
    const result = getAggregatedFilteredData('', 'city', ['primary']);
    expect(result).toHaveLength(10);
    result.forEach((r) => expect(r.providerName).toBe('primary'));
  });

  test('passing providerIds=["mock"] returns only mock records (3)', () => {
    const result = getAggregatedFilteredData('', 'city', ['mock']);
    expect(result).toHaveLength(3);
    result.forEach((r) => expect(r.providerName).toBe('mock'));
  });

  test('combined condition + providerIds filters apply simultaneously', () => {
    // "Sunny" from primary: Los Angeles, Phoenix, San Diego, San Jose (4)
    // "Sunny" from mock: New York (1) → total 5 Sunny across all providers
    const allSunny = getAggregatedFilteredData('Sunny', 'city');
    expect(allSunny.length).toBeGreaterThan(0);
    allSunny.forEach((r) => expect(r.condition).toBe('Sunny'));

    // Filter to only primary Sunny
    const primarySunny = getAggregatedFilteredData('Sunny', 'city', ['primary']);
    primarySunny.forEach((r) => {
      expect(r.condition).toBe('Sunny');
      expect(r.providerName).toBe('primary');
    });
    // Should be fewer than all Sunny combined
    expect(primarySunny.length).toBeLessThan(allSunny.length);
  });

  test('returns sorted results', () => {
    const result = getAggregatedFilteredData('', 'city');
    const cities = result.map((r) => r.city);
    expect(cities).toEqual([...cities].sort());
  });

  test('empty providerIds array returns all providers (same as omitted)', () => {
    const withEmpty = getAggregatedFilteredData('', 'city', []);
    const withOmit = getAggregatedFilteredData('', 'city');
    expect(withEmpty).toHaveLength(withOmit.length);
  });
});
