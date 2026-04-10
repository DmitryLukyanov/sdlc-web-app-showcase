# API Contract: Weather Provider Interface

**Feature**: `001-multi-weather-provider`
**Contract Type**: Internal JavaScript module interface (duck-typed)
**Date**: 2025-07-22

This document defines the contracts that govern how weather provider modules
and the provider registry interact. All current and future providers MUST
implement the `WeatherProvider` interface. The registry MUST honour the
`WeatherProviderRegistry` contract.

---

## 1. WeatherProvider Interface

Every provider module MUST export (CommonJS) and expose (browser global, where applicable) an object conforming to the following shape.

### Shape

```js
{
  id:         <string>,                              // REQUIRED. Unique provider identifier.
  getByCity:  function(cityName: string)             // REQUIRED. See §1.1
              → WeatherRecord | null,
  getAll:     function()                             // REQUIRED. See §1.2
              → WeatherRecord[]
}
```

### 1.1 `getByCity(cityName)`

| Aspect | Specification |
|---|---|
| **Input** | `cityName` — a non-empty string. May contain any casing, surrounding whitespace, or known aliases. |
| **Normalisation** | Implementation MUST `trim()` and `toLowerCase()` the input before lookup. |
| **Alias resolution** | Implementation MUST resolve known alternate city names (e.g., `"LA"` → `"Los Angeles"`) before the data lookup. |
| **Match found** | Returns a `WeatherRecord` object (see §3). MUST return a copy, not a mutable reference to internal state. |
| **No match** | Returns `null`. MUST NOT throw. MUST NOT return `undefined` or an empty object. |

### 1.2 `getAll()`

| Aspect | Specification |
|---|---|
| **Input** | None. |
| **Returns** | An array of all `WeatherRecord` objects held by this provider. |
| **Copy semantics** | MUST return a new array (shallow copy). Mutations to the returned array MUST NOT affect internal provider state. |
| **Empty provider** | Returns `[]`. MUST NOT return `null` or `undefined`. |

---

## 2. WeatherProviderRegistry Contract

Exported from `frontend/providerRegistry.js` as CommonJS (`module.exports`) and attached to `window.WeatherProviderRegistry` in browser contexts.

### Shape

```js
{
  register:          function(provider: WeatherProvider) → void,
  getProvider:       function(id: string) → WeatherProvider,
  getAllWeatherData:  function(providerId: string) → WeatherRecord[],
  getWeatherByCity:  function(city: string, providerId: string) → WeatherRecord | null
}
```

### 2.1 `register(provider)`

| Aspect | Specification |
|---|---|
| **Input** | A `WeatherProvider` object with a non-empty `id` property. |
| **Effect** | Adds the provider to the internal map. |
| **Duplicate id** | Throws `Error('Provider already registered: <id>')`. |
| **Returns** | `undefined` (no return value). |

### 2.2 `getProvider(id)`

| Aspect | Specification |
|---|---|
| **Input** | `id` — a string. |
| **Match found** | Returns the `WeatherProvider` object associated with `id`. |
| **No match** | Throws `Error('Unknown weather provider: <id>')`. |

### 2.3 `getAllWeatherData(providerId)`

| Aspect | Specification |
|---|---|
| **Input** | `providerId` — the string id of a registered provider. |
| **Returns** | `provider.getAll()` result — an array of `WeatherRecord` objects. |
| **Unknown providerId** | Throws `Error('Unknown weather provider: <id>')` (propagated from `getProvider`). |

### 2.4 `getWeatherByCity(city, providerId)`

| Aspect | Specification |
|---|---|
| **Input** | `city` — city name string; `providerId` — registered provider id. |
| **Returns** | `provider.getByCity(city)` result — a `WeatherRecord` or `null`. |
| **Unknown providerId** | Throws `Error('Unknown weather provider: <id>')`. |
| **Unknown city** | Returns `null` (propagated from provider). |

---

## 3. WeatherRecord Shape

All providers MUST return data objects conforming to this shape.

```js
{
  city:         string,   // Display city name, e.g. "New York"
  state:        string,   // State abbreviation or descriptor, e.g. "NY"
  temperature:  number,   // Degrees Fahrenheit
  humidity:     number,   // 0–100 inclusive
  windSpeed:    number,   // mph, ≥ 0
  condition:    string,   // Human-readable condition, e.g. "Sunny"
  forecastDate: string    // ISO date string, YYYY-MM-DD
}
```

No field may be omitted or set to `undefined`. Static placeholder values are permitted for mock providers on non-spec-critical fields.

---

## 4. WeatherApp Public Surface (Browser Global)

The `window.WeatherApp` namespace, set by `frontend/weather.js`, is the public API for browser consumers. The following additions MUST be made without removing any existing functions.

### Existing (unchanged)

```js
WeatherApp.getAllWeatherData()       // → WeatherRecord[] (primary provider)
WeatherApp.filterByCondition(cond)  // → WeatherRecord[] (primary provider)
WeatherApp.sortData(data, key)      // → WeatherRecord[]
WeatherApp.getFilteredData(cond, sortKey)  // → WeatherRecord[] (primary provider)
WeatherApp.getConditionSummary()    // → Object
```

### New additions

```js
WeatherApp.getWeatherByCity(city, providerId)
// → WeatherRecord | null
// Delegates to WeatherProviderRegistry.getWeatherByCity.
// Throws for unknown providerId. Returns null for unsupported city.

WeatherApp.getAllFromProvider(providerId)
// → WeatherRecord[]
// Delegates to WeatherProviderRegistry.getAllWeatherData.
// Throws for unknown providerId.
```

---

## 5. CommonJS Exports (Jest / Node)

Each module MUST export via `module.exports` for Jest test access.

| Module | Exported symbol |
|---|---|
| `frontend/providers/primaryProvider.js` | `module.exports = primaryProvider` (the provider object) |
| `frontend/providers/mockProvider.js` | `module.exports = mockProvider` (the provider object) |
| `frontend/providerRegistry.js` | `module.exports = WeatherProviderRegistry` (the registry object) |
| `frontend/weather.js` | Existing exports unchanged; `WeatherProviderRegistry` also exported |

---

## 6. Error Catalogue

| Error message | Thrown by | Trigger condition |
|---|---|---|
| `'Unknown weather provider: <id>'` | `getProvider`, `getAllWeatherData`, `getWeatherByCity` | `providerId` not in registry |
| `'Provider already registered: <id>'` | `register` | `provider.id` already exists in the registry |
