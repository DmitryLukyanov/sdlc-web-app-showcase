// License: Proprietary. All rights reserved.

'use strict';

const MockWeatherProvider = require('../../frontend/providers/mockProvider');

const REQUIRED_FIELDS = ['city', 'state', 'temperature', 'humidity', 'windSpeed', 'condition', 'forecastDate'];

describe('MockWeatherProvider', () => {
  describe('id', () => {
    test('has id === "mock"', () => {
      expect(MockWeatherProvider.id).toBe('mock');
    });
  });

  describe('getAll()', () => {
    test('returns exactly 3 records', () => {
      expect(MockWeatherProvider.getAll()).toHaveLength(3);
    });

    test('returns a copy — mutation does not affect internal state', () => {
      const copy = MockWeatherProvider.getAll();
      copy.push({ city: 'Fake City' });
      expect(MockWeatherProvider.getAll()).toHaveLength(3);
    });

    test('each record has all 7 required WeatherRecord fields', () => {
      MockWeatherProvider.getAll().forEach((record) => {
        REQUIRED_FIELDS.forEach((field) => {
          expect(record).toHaveProperty(field);
        });
      });
    });

    test('temperature values are numeric', () => {
      MockWeatherProvider.getAll().forEach((record) => {
        expect(typeof record.temperature).toBe('number');
      });
    });

    test('humidity values are between 0 and 100', () => {
      MockWeatherProvider.getAll().forEach((record) => {
        expect(record.humidity).toBeGreaterThanOrEqual(0);
        expect(record.humidity).toBeLessThanOrEqual(100);
      });
    });

    test('windSpeed values are non-negative', () => {
      MockWeatherProvider.getAll().forEach((record) => {
        expect(record.windSpeed).toBeGreaterThanOrEqual(0);
      });
    });

    test('forecastDate is a valid date string', () => {
      MockWeatherProvider.getAll().forEach((record) => {
        expect(new Date(record.forecastDate).toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('getByCity() — canonical city lookups', () => {
    test('New York returns condition "Sunny"', () => {
      const result = MockWeatherProvider.getByCity('New York');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Sunny');
    });

    test('Los Angeles returns condition "Snow"', () => {
      const result = MockWeatherProvider.getByCity('Los Angeles');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Snow');
    });

    test('Washington D.C. returns condition "Windy"', () => {
      const result = MockWeatherProvider.getByCity('Washington D.C.');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Windy');
    });
  });

  describe('getByCity() — alias resolution', () => {
    test('"LA" resolves to Los Angeles (Snow)', () => {
      const result = MockWeatherProvider.getByCity('LA');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Snow');
    });

    test('"la" (lowercase) resolves to Los Angeles (Snow)', () => {
      const result = MockWeatherProvider.getByCity('la');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Snow');
    });

    test('"Washington" resolves to Washington D.C. (Windy)', () => {
      const result = MockWeatherProvider.getByCity('Washington');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Windy');
    });

    test('"washington dc" resolves to Washington D.C. (Windy)', () => {
      const result = MockWeatherProvider.getByCity('washington dc');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Windy');
    });

    test('"NYC" resolves to New York (Sunny)', () => {
      const result = MockWeatherProvider.getByCity('NYC');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Sunny');
    });

    test('"New York City" resolves to New York (Sunny)', () => {
      const result = MockWeatherProvider.getByCity('New York City');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Sunny');
    });
  });

  describe('getByCity() — case insensitivity', () => {
    test('"new york" (all lowercase) returns Sunny', () => {
      const result = MockWeatherProvider.getByCity('new york');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Sunny');
    });

    test('"LOS ANGELES" (all uppercase) returns Snow', () => {
      const result = MockWeatherProvider.getByCity('LOS ANGELES');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Snow');
    });

    test('"WASHINGTON D.C." (all uppercase) returns Windy', () => {
      const result = MockWeatherProvider.getByCity('WASHINGTON D.C.');
      expect(result).not.toBeNull();
      expect(result.condition).toBe('Windy');
    });
  });

  describe('getByCity() — found records satisfy WeatherRecord shape', () => {
    test('New York record has all 7 required fields with correct types', () => {
      const result = MockWeatherProvider.getByCity('New York');
      REQUIRED_FIELDS.forEach((field) => {
        expect(result).toHaveProperty(field);
      });
      expect(typeof result.city).toBe('string');
      expect(typeof result.state).toBe('string');
      expect(typeof result.temperature).toBe('number');
      expect(typeof result.humidity).toBe('number');
      expect(typeof result.windSpeed).toBe('number');
      expect(typeof result.condition).toBe('string');
      expect(typeof result.forecastDate).toBe('string');
    });
  });

  // ── User Story 2: Graceful Degradation ─────────────────────────────────────

  describe('getByCity() — graceful degradation for unsupported cities', () => {
    test('"Chicago" returns strictly null', () => {
      expect(MockWeatherProvider.getByCity('Chicago')).toBeNull();
    });

    test('empty string returns strictly null', () => {
      expect(MockWeatherProvider.getByCity('')).toBeNull();
    });

    test('whitespace-only string returns strictly null', () => {
      expect(MockWeatherProvider.getByCity('   ')).toBeNull();
    });

    test('"Chicago" does not throw', () => {
      expect(() => MockWeatherProvider.getByCity('Chicago')).not.toThrow();
    });

    test('empty string does not throw', () => {
      expect(() => MockWeatherProvider.getByCity('')).not.toThrow();
    });

    test('whitespace-only string does not throw', () => {
      expect(() => MockWeatherProvider.getByCity('   ')).not.toThrow();
    });

    test('"Chicago" result is not undefined', () => {
      const result = MockWeatherProvider.getByCity('Chicago');
      expect(result).not.toBeUndefined();
    });

    test('"Chicago" result is not an empty object', () => {
      const result = MockWeatherProvider.getByCity('Chicago');
      expect(result).not.toEqual({});
    });

    test('null input returns strictly null without throwing', () => {
      expect(() => MockWeatherProvider.getByCity(null)).not.toThrow();
      expect(MockWeatherProvider.getByCity(null)).toBeNull();
    });
  });
});
