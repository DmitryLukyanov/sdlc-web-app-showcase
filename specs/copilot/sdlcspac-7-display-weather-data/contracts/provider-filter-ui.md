# Contract: Provider Filter UI

**Feature**: SDLCSPAC-7  
**Branch**: `copilot/sdlcspac-7-display-weather-data`  
**Type**: UI Component Contract  
**Status**: Approved

---

## Overview

This document defines the contract between `weather.html` (the view), `weather.js` (the logic layer), and `providerRegistry.js` (the data source) for the multi-select provider filter UI control introduced by this feature.

---

## `WeatherProviderRegistry.listProviders()` — New API

**Module**: `frontend/providerRegistry.js`

### Signature
```javascript
WeatherProviderRegistry.listProviders() → string[]
```

### Behaviour
- Returns an array of all currently registered provider `id` strings, in registration order.
- Returns a new array on every call (callers may mutate it without affecting the registry).
- Returns at least `["primary", "mock"]` after module load (built-in providers auto-registered).
- Reflects runtime additions: if a third provider is registered via `WeatherProviderRegistry.register(p)`, `listProviders()` includes `p.id`.

### Errors
- Never throws.

### Example
```javascript
WeatherProviderRegistry.listProviders();
// → ["primary", "mock"]
```

---

## `WeatherApp.getAllFromAllProviders()` — New API

**Module**: `frontend/weather.js`

### Signature
```javascript
WeatherApp.getAllFromAllProviders() → { data: WeatherRecord[], failedProviders: string[] }
```

### Behaviour
- Iterates `WeatherProviderRegistry.listProviders()` in order.
- For each provider ID, calls `WeatherProviderRegistry.getAllWeatherData(id)`.
- Each returned record is shallow-copied and stamped with `providerName: id`.
- If a provider throws, its ID is added to `failedProviders`; processing continues for remaining providers.
- Returns `{ data, failedProviders }` — `failedProviders` is `[]` when all providers succeed.

### Errors
- Never throws — per-provider errors are caught and surfaced through `failedProviders`.

### Example
```javascript
var result = WeatherApp.getAllFromAllProviders();
// result.data.length === 13 (10 primary + 3 mock, all providers healthy)
// result.failedProviders === []
// result.data[0].providerName === "primary"  (or "mock" depending on order)
```

---

## `WeatherApp.filterByProvider(data, selectedProviderIds)` — New API

**Module**: `frontend/weather.js`

### Signature
```javascript
WeatherApp.filterByProvider(data: WeatherRecord[], selectedProviderIds: string[]) → WeatherRecord[]
```

### Behaviour
- Returns records from `data` whose `providerName` is included in `selectedProviderIds`.
- If `selectedProviderIds` is empty, `null`, or `undefined`, returns `data` unchanged (all providers).
- Does not mutate `data`.
- Returns a new array.

### Errors
- Never throws.

### Example
```javascript
WeatherApp.filterByProvider(allRecords, ["primary"]);
// → 10 records (primary only)

WeatherApp.filterByProvider(allRecords, ["primary", "mock"]);
// → 13 records (all)

WeatherApp.filterByProvider(allRecords, []);
// → 13 records (empty = all)
```

---

## `WeatherApp.getFilteredData(condition, sortKey, providerIds)` — Updated API

**Module**: `frontend/weather.js`

### Signature
```javascript
// Previous (still valid — providerIds is optional):
WeatherApp.getFilteredData(condition: string, sortKey: string) → WeatherRecord[]

// Extended:
WeatherApp.getFilteredData(condition: string, sortKey: string, providerIds?: string[]) → WeatherRecord[]
```

### Behaviour change
- **Now operates on the combined multi-provider dataset** (from `getAllFromAllProviders().data`) rather than the static `weatherData` array.
- Chains: `filterByCondition` → `filterByProvider` → `sortData`.
- `providerIds` defaults to `[]` (all providers) when omitted or falsy.

### Backward compatibility
- Existing two-argument calls (`getFilteredData(condition, sortKey)`) continue to work identically — result now includes records from all providers instead of only the static array, which is the intended change.

### Errors
- Never throws.

---

## Provider Filter UI Component — DOM Contract

**File**: `frontend/weather.html` (inline `<script>`)

### Structure
```html
<fieldset id="filter-provider" class="provider-filter">
  <legend>Filter by Provider:</legend>
  <label>
    <input type="checkbox" id="filter-provider-all" checked />
    All Providers
  </label>
  <!-- One label+checkbox per registered provider, generated dynamically: -->
  <label>
    <input type="checkbox" class="provider-checkbox" value="primary" checked />
    primary
  </label>
  <label>
    <input type="checkbox" class="provider-checkbox" value="mock" checked />
    mock
  </label>
</fieldset>
```

### Behaviour Contract

| Event | Action |
|-------|--------|
| Page load | All checkboxes checked (all providers); table shows all 13 records |
| "All Providers" checked | All individual provider checkboxes checked; `selectedProviderIds` = all IDs; table refreshes |
| "All Providers" unchecked | All individual provider checkboxes unchecked; `selectedProviderIds` = []; table shows 0 rows |
| Individual provider checked | Adds to `selectedProviderIds`; if all now checked → "All Providers" becomes checked; table refreshes |
| Individual provider unchecked | Removes from `selectedProviderIds`; "All Providers" becomes unchecked; table refreshes |
| Condition `<select>` changes | Applied on top of active provider filter; both filters combine (FR-008) |
| Sort `<select>` changes | Sort applied to currently filtered (condition + provider) dataset |
| Page reload | Filter state NOT persisted; resets to all-checked (FR-010b) |

### Warning Banner Contract

```html
<!-- Injected dynamically when failedProviders.length > 0 -->
<div class="provider-warning" role="alert">
  ⚠ Could not load data from provider(s): <strong>mock</strong>.
  <button class="provider-warning__dismiss" aria-label="Dismiss">×</button>
</div>
```

- `role="alert"` ensures screen readers announce the warning on injection.
- Dismiss button removes the banner from the DOM.
- Banner is inserted before `#weather-table` (inside `.table-container` or before it).
- Banner does not block table interaction.

---

## Provider Column — Table Contract

**Applies to**: `#weather-table` in `weather.html`

### Header row change
```html
<!-- Before -->
<tr>
  <th>City</th><th>State</th><th>Condition</th>
  <th>Temperature (°F)</th><th>Humidity (%)</th>
  <th>Wind Speed (mph)</th><th>Forecast Date</th>
</tr>

<!-- After (Provider column added as last header) -->
<tr>
  <th>City</th><th>State</th><th>Condition</th>
  <th>Temperature (°F)</th><th>Humidity (%)</th>
  <th>Wind Speed (mph)</th><th>Forecast Date</th>
  <th>Provider</th>
</tr>
```

### Row rendering change
```javascript
// Each row gains a final cell:
tr.innerHTML = '...' +
  '<td class="provider-badge provider-badge-' + row.providerName + '">'
    + row.providerName + '</td>';
```

- `providerName` is rendered as plain text (the provider `id` string) inside a `<td>`.
- The CSS class `provider-badge-{providerName}` allows per-provider styling without JS logic.

---

## Sort Key Constraint

- `"providerName"` is NOT added as a sort option in the existing `<select id="sort-by">` — not required by spec.
- The existing four sort keys (`city`, `temperature`, `humidity`, `windSpeed`) remain unchanged.
