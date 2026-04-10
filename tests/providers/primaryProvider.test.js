// License: Proprietary. All rights reserved.

'use strict';

const PrimaryWeatherProvider = require('../../frontend/providers/primaryProvider');

const REQUIRED_FIELDS = ['city', 'state', 'temperature', 'humidity', 'windSpeed', 'condition', 'forecastDate'];

describe('PrimaryWeatherProvider', () => {
  describe('id', () => {
    test('has id === "primary"', () => {
      expect(PrimaryWeatherProvider.id).toBe('primary');
    });
  });

  describe('getAll()', () => {
    test('returns exactly 10 records', () => {
      expect(PrimaryWeatherProvider.getAll()).toHaveLength(10);
    });

    test('returns a copy — mutation does not affect internal state', () => {
      const copy = PrimaryWeatherProvider.getAll();
      copy.push({ city: 'Fake City' });
      expect(PrimaryWeatherProvider.getAll()).toHaveLength(10);
    });

    test('each record has all 7 required WeatherRecord fields', () => {
      PrimaryWeatherProvider.getAll().forEach((record) => {
        REQUIRED_FIELDS.forEach((field) => {
          expect(record).toHaveProperty(field);
        });
      });
    });

    test('temperature values are numeric', () => {
      PrimaryWeatherProvider.getAll().forEach((record) => {
        expect(typeof record.temperature).toBe('number');
      });
    });

    test('humidity values are between 0 and 100', () => {
      PrimaryWeatherProvider.getAll().forEach((record) => {
        expect(record.humidity).toBeGreaterThanOrEqual(0);
        expect(record.humidity).toBeLessThanOrEqual(100);
      });
    });

    test('windSpeed values are non-negative', () => {
      PrimaryWeatherProvider.getAll().forEach((record) => {
        expect(record.windSpeed).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getByCity()', () => {
    test('finds Seattle case-insensitively... actually finds New York case-insensitively', () => {
      const result = PrimaryWeatherProvider.getByCity('new york');
      expect(result).not.toBeNull();
      expect(result.city).toBe('New York');
    });

    test('lookup is case-insensitive — mixed case', () => {
      const result = PrimaryWeatherProvider.getByCity('nEw YoRk');
      expect(result).not.toBeNull();
      expect(result.city).toBe('New York');
    });

    test('returns null for a city not in the dataset', () => {
      expect(PrimaryWeatherProvider.getByCity('NonExistentCity')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(PrimaryWeatherProvider.getByCity('')).toBeNull();
    });

    test('returns null for null input', () => {
      expect(PrimaryWeatherProvider.getByCity(null)).toBeNull();
    });

    test('finds Los Angeles', () => {
      const result = PrimaryWeatherProvider.getByCity('Los Angeles');
      expect(result).not.toBeNull();
      expect(result.city).toBe('Los Angeles');
    });

    test('found record has all 7 required fields', () => {
      const result = PrimaryWeatherProvider.getByCity('Chicago');
      expect(result).not.toBeNull();
      REQUIRED_FIELDS.forEach((field) => {
        expect(result).toHaveProperty(field);
      });
    });
  });
});
