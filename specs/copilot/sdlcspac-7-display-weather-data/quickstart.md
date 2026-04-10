# Quickstart: Multi-Provider Weather Data Display

**Feature**: SDLCSPAC-7  
**Branch**: `copilot/sdlcspac-7-display-weather-data`

---

## What is being changed?

The `weather.html` main screen currently shows data from a single static hardcoded array in `weather.js`. This feature makes the page display data from **all registered providers** simultaneously, adds a **Provider** attribution column, and adds a **multi-select checkbox filter** to let users focus on one or more providers.

---

## Files changed

| File | Change type | What changes |
|------|------------|--------------|
| `frontend/providerRegistry.js` | Modify | Add `listProviders()` method |
| `frontend/weather.js` | Modify | Add `getAllFromAllProviders()`, `filterByProvider()`, update `getFilteredData()` |
| `frontend/weather.html` | Modify | Add Provider column, checkbox filter `<fieldset>`, warning banner logic, update inline script |
| `tests/providers/providerRegistry.test.js` | Modify | Add `listProviders()` tests |
| `tests/weather.test.js` | Modify | Add tests for new `weather.js` functions |
| `tests/weather.html.test.js` | New | DOM integration tests for provider column, filter, warning banner |

---

## Running the tests

```bash
# From repository root
npm test
```

All tests must pass (green) after every logical change. The suite uses Jest 29 + jsdom.

To run a single test file during development:
```bash
npx jest tests/weather.html.test.js
npx jest tests/weather.test.js
npx jest tests/providers/providerRegistry.test.js
```

---

## How the aggregation works (developer overview)

```
WeatherProviderRegistry.listProviders()
  → ["primary", "mock"]

For each id:
  WeatherProviderRegistry.getAllWeatherData(id)
  → Array<WeatherRecord>
  Each record shallow-copied + providerName: id stamped

All records concatenated → 13 records total (10 primary + 3 mock)
failedProviders: [] if all succeed, or ["mock"] if mock throws

Passed to: filterByProvider(data, selectedProviderIds)
  → filtered by active checkbox selection (default: all)

Passed to: filterByCondition(filtered, condition)
  → filtered by active condition dropdown

Passed to: sortData(data, sortKey)
  → sorted by active sort key (default: "city")

Rendered in #weather-body with Provider column as last <td>
```

---

## How the provider filter UI works (user overview)

1. **On page load**: All provider checkboxes are checked ("All Providers" + individual providers). The table shows all 13 records.
2. **Uncheck "mock"**: Only primary records (10) remain visible.
3. **Check "mock" again**: All 13 records reappear.
4. **Uncheck "All Providers"**: Table empties (no providers selected).
5. **Check "All Providers"**: All records reappear.
6. **Combined with condition filter**: If "Sunny" is selected in the condition dropdown and "primary" only in the provider filter → only primary-sourced Sunny records appear.
7. **Provider filter resets on page reload** — no persistence (FR-010b).

---

## Provider failure handling

If a provider's `getAll()` throws at page load:
- Its records are omitted from the table.
- A non-blocking warning banner appears above the table:  
  `⚠ Could not load data from provider(s): mock.`
- The banner can be dismissed via the × button.
- The rest of the table remains fully functional.

---

## Adding a new provider (future developer)

No changes to this feature's code are needed to add a new provider:

```javascript
// In any <script> loaded after providerRegistry.js:
var MyProvider = {
  id: 'weather-gov',
  getAll: function () { return [...]; },
  getByCity: function (city) { return ... || null; },
};
WeatherProviderRegistry.register(MyProvider);
```

Once registered, `listProviders()` includes `'weather-gov'`, `getAllFromAllProviders()` aggregates its data, and the checkbox filter UI generates a checkbox for it automatically.
