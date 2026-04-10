# Data Model: Multi-Weather Provider Support

**Feature**: `001-multi-weather-provider`
**Phase**: 1 — Design & Contracts
**Date**: 2025-07-22

---

## Core Entities

### 1. WeatherRecord

The canonical, unified shape for all weather data, regardless of provider. Defined by the existing primary provider shape. All providers MUST return objects conforming to this shape.

```js
/**
 * @typedef {Object} WeatherRecord
 * @property {string}  city         - Display city name (e.g. "New York")
 * @property {string}  state        - State abbreviation or descriptor (e.g. "NY")
 * @property {number}  temperature  - Temperature in degrees Fahrenheit
 * @property {number}  humidity     - Relative humidity percentage (0–100)
 * @property {number}  windSpeed    - Wind speed in mph (≥ 0)
 * @property {string}  condition    - Human-readable condition (e.g. "Sunny", "Snow", "Windy")
 * @property {string}  forecastDate - ISO 8601 date string (YYYY-MM-DD)
 */
```

**Constraints:**
- `city` and `condition` are spec-required (non-negotiable values for the mock provider).
- `state`, `temperature`, `humidity`, `windSpeed`, `forecastDate` are populated with static placeholder values in the mock provider — they must be present and have the correct types.
- No field may be `undefined`; fields without meaningful mock values use well-typed placeholders.

**Mock Provider's WeatherRecord instances:**

| city | state | temperature | humidity | windSpeed | condition | forecastDate |
|---|---|---|---|---|---|---|
| New York | NY | 55 | 60 | 10 | Sunny | 2024-06-15 |
| Los Angeles | CA | 34 | 40 | 5 | Snow | 2024-06-15 |
| Washington D.C. | DC | 72 | 55 | 20 | Windy | 2024-06-15 |

---

### 2. WeatherProvider (Interface / Duck Type)

Every weather provider module MUST expose the following contract. Because the project uses vanilla JavaScript (no TypeScript), this is enforced by documentation and test coverage.

```js
/**
 * @typedef {Object} WeatherProvider
 * @property {string}   id                          - Unique string identifier for this provider.
 * @property {function(string): WeatherRecord|null} getByCity
 *   Looks up weather data for a city name (case-insensitive, alias-aware).
 *   Returns null if the city is not supported by this provider.
 * @property {function(): WeatherRecord[]}          getAll
 *   Returns all WeatherRecord entries this provider holds. Returns a copy, not a reference.
 */
```

**Registered Provider IDs:**

| ID | Module | Description |
|---|---|---|
| `'primary'` | `frontend/providers/primaryProvider.js` | Existing 10-city dataset (unchanged) |
| `'mock'` | `frontend/providers/mockProvider.js` | Hardcoded 3-city mock (NY/LA/Washington) |

---

### 3. WeatherProviderRegistry

The singleton registry that maintains available providers and routes requests.

```js
/**
 * @typedef {Object} WeatherProviderRegistry
 * @property {function(WeatherProvider): void}                   register
 *   Registers a new provider. Throws if a provider with the same id is already registered.
 * @property {function(string): WeatherProvider}                 getProvider
 *   Returns the provider for a given id. Throws a descriptive Error for unknown ids.
 * @property {function(string, string): WeatherRecord|null}      getWeatherByCity
 *   (city, providerId) → calls provider.getByCity(city). Throws for unknown providerId.
 * @property {function(string): WeatherRecord[]}                 getAllWeatherData
 *   (providerId) → calls provider.getAll(). Throws for unknown providerId.
 */
```

---

## Entity Relationships

```text
WeatherProviderRegistry
  ├── Map<id → WeatherProvider>
  │     ├── 'primary' → PrimaryWeatherProvider
  │     │                 └── getAll() / getByCity()  ─ operates on: weatherData[10]
  │     └── 'mock'    → MockWeatherProvider
  │                       └── getAll() / getByCity()  ─ operates on: mockData[3] + aliasMap
  │
  └── Public surface used by weather.js / WeatherApp
        ├── getAllWeatherData(providerId)
        └── getWeatherByCity(city, providerId)
```

---

## State Transitions

This feature has no persistent state or database. All data is immutable at runtime (hardcoded). The only "state" is the registry's internal `Map`, which is populated once at module load time and is not mutated thereafter.

---

## Validation Rules

| Rule | Applies To | Enforcement |
|---|---|---|
| `providerId` must match a registered provider | `getProvider`, `getWeatherByCity`, `getAllWeatherData` | Throws `Error('Unknown provider: <id>')` |
| City lookup is case-insensitive | `mockProvider.getByCity` | `toLowerCase()` + `trim()` before alias map lookup |
| City lookup supports known aliases | `mockProvider.getByCity` | Alias map in `mockProvider.js` |
| Unsupported city returns `null` | `mockProvider.getByCity` | Returns `null` (not throw) |
| `getAll()` returns a copy | Both providers | `.slice()` / spread on the internal array |
| All `WeatherRecord` fields must be present and correctly typed | Both providers | Jest test coverage on shape |
