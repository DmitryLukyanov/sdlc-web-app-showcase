# Quickstart: Multi-Weather Provider Support

**Feature**: `001-multi-weather-provider`
**Date**: 2025-07-22

A concise guide for developers implementing or extending this feature.

---

## Overview

This feature introduces a provider abstraction layer on top of the existing
weather data system. Two providers are available:

| Provider ID | Description | Cities |
|---|---|---|
| `'primary'` | Original 10-city dataset (unchanged) | New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, San Jose |
| `'mock'` | Hardcoded second provider | New York (Sunny), LA (Snow), Washington (Windy) |

---

## File Layout (After Implementation)

```text
frontend/
├── providers/
│   ├── primaryProvider.js      # New — wraps existing weatherData as a provider
│   └── mockProvider.js         # New — hardcoded mock data for 3 cities
├── providerRegistry.js         # New — registers providers; routes requests
└── weather.js                  # Updated — adds 2 new WeatherApp functions; existing API untouched

tests/
├── weather.test.js             # Existing — must continue to pass unchanged
└── providers/
    ├── primaryProvider.test.js # New
    ├── mockProvider.test.js    # New
    └── providerRegistry.test.js # New

frontend/weather.html           # Updated — adds 3 new <script> tags for new modules
```

---

## Using the API

### In the Browser (HTML)

```html
<!-- Load order is important -->
<script src="providers/primaryProvider.js"></script>
<script src="providers/mockProvider.js"></script>
<script src="providerRegistry.js"></script>
<script src="weather.js"></script>

<script>
  // Existing API — unchanged, uses primary provider
  var all = WeatherApp.getAllWeatherData();

  // New: get all data from the mock provider
  var mockAll = WeatherApp.getAllFromProvider('mock');

  // New: get weather for a specific city from a specific provider
  var nyMock = WeatherApp.getWeatherByCity('New York', 'mock');
  // → { city: 'New York', condition: 'Sunny', ... }

  var laMock = WeatherApp.getWeatherByCity('LA', 'mock');
  // → { city: 'Los Angeles', condition: 'Snow', ... }  (alias resolved)

  var dcMock = WeatherApp.getWeatherByCity('Washington', 'mock');
  // → { city: 'Washington D.C.', condition: 'Windy', ... }

  // Unsupported city returns null
  var unknown = WeatherApp.getWeatherByCity('Chicago', 'mock');
  // → null
</script>
```

### In Jest Tests

```js
const mockProvider = require('../frontend/providers/mockProvider');
const registry = require('../frontend/providerRegistry');

// Direct provider usage
const ny = mockProvider.getByCity('new york');  // case-insensitive
// → { city: 'New York', condition: 'Sunny', ... }

const la = mockProvider.getByCity('LA');         // alias
// → { city: 'Los Angeles', condition: 'Snow', ... }

const none = mockProvider.getByCity('Chicago');
// → null

// Via registry
const all = registry.getAllWeatherData('mock');
// → array of 3 WeatherRecord objects
```

---

## Adding a Third Provider

1. Create `frontend/providers/thirdProvider.js` implementing the `WeatherProvider` interface:
   ```js
   var thirdProviderData = [ /* WeatherRecord objects */ ];
   var thirdProvider = {
     id: 'third',
     getByCity: function (cityName) { /* ... */ return null; },
     getAll: function () { return thirdProviderData.slice(); }
   };
   if (typeof module !== 'undefined' && module.exports) {
     module.exports = thirdProvider;
   }
   if (typeof window !== 'undefined') {
     window.ThirdProvider = thirdProvider;
   }
   ```
2. Register it in `providerRegistry.js` (or have it self-register at load time).
3. Add `<script src="providers/thirdProvider.js"></script>` to `weather.html` before `providerRegistry.js`.
4. Add test file `tests/providers/thirdProvider.test.js`.

No existing provider or core registry logic needs to change.

---

## Running Tests

```bash
npm test
```

All existing tests continue to pass. New provider tests are co-located under `tests/providers/`.

---

## Key Constraints

- **No bundler**: Files are loaded via individual `<script>` tags. Load order in `weather.html` matters.
- **No globals mutation**: Each provider attaches to `window` under its own name; the registry is `window.WeatherProviderRegistry`; `window.WeatherApp` gains two new methods.
- **City lookup is case-insensitive and alias-aware**: Pass any known alias or casing; the provider normalises internally.
- **Unknown provider throws; unsupported city returns `null`**: Handle accordingly in calling code.
