// License: Proprietary. All rights reserved.

'use strict';

// Each test gets a fresh registry instance to avoid cross-test state leakage.
// We achieve isolation by clearing Jest's module cache before each test.
let WeatherProviderRegistry;

beforeEach(() => {
  jest.resetModules();
  WeatherProviderRegistry = require('../../frontend/providerRegistry');
});

describe('WeatherProviderRegistry — built-in registration', () => {
  test('primary provider is registered at load time', () => {
    expect(() => WeatherProviderRegistry.getProvider('primary')).not.toThrow();
  });

  test('mock provider is registered at load time', () => {
    expect(() => WeatherProviderRegistry.getProvider('mock')).not.toThrow();
  });

  test('getProvider("primary") returns a provider with id === "primary"', () => {
    const provider = WeatherProviderRegistry.getProvider('primary');
    expect(provider.id).toBe('primary');
  });

  test('getProvider("mock") returns a provider with id === "mock"', () => {
    const provider = WeatherProviderRegistry.getProvider('mock');
    expect(provider.id).toBe('mock');
  });
});

describe('WeatherProviderRegistry — routing', () => {
  test('getWeatherByCity("New York", "mock") returns condition "Sunny"', () => {
    const result = WeatherProviderRegistry.getWeatherByCity('New York', 'mock');
    expect(result).not.toBeNull();
    expect(result.condition).toBe('Sunny');
  });

  test('getWeatherByCity("LA", "mock") returns condition "Snow"', () => {
    const result = WeatherProviderRegistry.getWeatherByCity('LA', 'mock');
    expect(result).not.toBeNull();
    expect(result.condition).toBe('Snow');
  });

  test('getWeatherByCity("Washington", "mock") returns condition "Windy"', () => {
    const result = WeatherProviderRegistry.getWeatherByCity('Washington', 'mock');
    expect(result).not.toBeNull();
    expect(result.condition).toBe('Windy');
  });

  test('getAllWeatherData("primary") returns 10 records', () => {
    expect(WeatherProviderRegistry.getAllWeatherData('primary')).toHaveLength(10);
  });

  test('getAllWeatherData("mock") returns 3 records', () => {
    expect(WeatherProviderRegistry.getAllWeatherData('mock')).toHaveLength(3);
  });

  test('getWeatherByCity("New York", "primary") returns primary provider data (not mock)', () => {
    const mockResult = WeatherProviderRegistry.getWeatherByCity('New York', 'mock');
    const primaryResult = WeatherProviderRegistry.getWeatherByCity('New York', 'primary');
    // Primary returns "Partly Cloudy" for New York; mock returns "Sunny"
    expect(primaryResult).not.toBeNull();
    expect(primaryResult.condition).not.toBe(mockResult.condition);
  });
});

describe('WeatherProviderRegistry — error handling', () => {
  test('getProvider with unknown id throws Error with correct message', () => {
    expect(() => WeatherProviderRegistry.getProvider('unknown')).toThrow(
      'Unknown weather provider: unknown'
    );
  });

  test('getAllWeatherData with unknown providerId throws', () => {
    expect(() => WeatherProviderRegistry.getAllWeatherData('nonexistent')).toThrow(
      'Unknown weather provider: nonexistent'
    );
  });

  test('getWeatherByCity with unknown providerId throws', () => {
    expect(() => WeatherProviderRegistry.getWeatherByCity('New York', 'ghost')).toThrow(
      'Unknown weather provider: ghost'
    );
  });
});

// ── User Story 3: Extensibility ───────────────────────────────────────────────

describe('WeatherProviderRegistry — extensibility (US3)', () => {
  // Define an inline third provider directly in the test — no separate source file needed
  const thirdProvider = {
    id: 'third',
    getByCity: function (cityName) {
      if (cityName && cityName.toLowerCase() === 'boston') {
        return {
          city: 'Boston',
          state: 'MA',
          temperature: 50,
          humidity: 70,
          windSpeed: 15,
          condition: 'Cloudy',
          forecastDate: '2024-06-15',
        };
      }
      return null;
    },
    getAll: function () {
      return [
        {
          city: 'Boston',
          state: 'MA',
          temperature: 50,
          humidity: 70,
          windSpeed: 15,
          condition: 'Cloudy',
          forecastDate: '2024-06-15',
        },
      ];
    },
  };

  test('register() accepts a third provider without error', () => {
    expect(() => WeatherProviderRegistry.register(thirdProvider)).not.toThrow();
  });

  test('getProvider("third") returns the registered third provider', () => {
    WeatherProviderRegistry.register(thirdProvider);
    expect(WeatherProviderRegistry.getProvider('third')).toBe(thirdProvider);
  });

  test('getAllWeatherData("third") delegates to thirdProvider.getAll()', () => {
    WeatherProviderRegistry.register(thirdProvider);
    expect(WeatherProviderRegistry.getAllWeatherData('third')).toHaveLength(1);
  });

  test('getWeatherByCity("Boston", "third") delegates to thirdProvider.getByCity()', () => {
    WeatherProviderRegistry.register(thirdProvider);
    const result = WeatherProviderRegistry.getWeatherByCity('Boston', 'third');
    expect(result).not.toBeNull();
    expect(result.city).toBe('Boston');
  });

  test('registering duplicate id throws "Provider already registered: third"', () => {
    WeatherProviderRegistry.register(thirdProvider);
    expect(() => WeatherProviderRegistry.register(thirdProvider)).toThrow(
      'Provider already registered: third'
    );
  });

  test('adding third provider does not change getAllWeatherData("primary")', () => {
    WeatherProviderRegistry.register(thirdProvider);
    expect(WeatherProviderRegistry.getAllWeatherData('primary')).toHaveLength(10);
  });

  test('adding third provider does not change getAllWeatherData("mock")', () => {
    WeatherProviderRegistry.register(thirdProvider);
    expect(WeatherProviderRegistry.getAllWeatherData('mock')).toHaveLength(3);
  });
});
