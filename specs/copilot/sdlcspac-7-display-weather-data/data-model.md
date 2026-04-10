# Data Model: Multi-Provider Weather Data Display

**Feature**: SDLCSPAC-7  
**Branch**: `copilot/sdlcspac-7-display-weather-data`  
**Phase**: 1 — Design

---

## Entities

### 1. WeatherRecord

A single weather observation for one city, originating from one provider.

| Field | Type | Required | Validation | Source |
|-------|------|----------|------------|--------|
| `city` | `string` | ✅ | Non-empty string | Provider dataset |
| `state` | `string` | ✅ | Non-empty string (2-letter abbreviation or full name) | Provider dataset |
| `temperature` | `number` | ✅ | Numeric (Fahrenheit) | Provider dataset |
| `humidity` | `number` | ✅ | Integer 0–100 inclusive | Provider dataset |
| `windSpeed` | `number` | ✅ | Non-negative number | Provider dataset |
| `condition` | `string` | ✅ | Non-empty string (e.g. `"Sunny"`, `"Rainy"`) | Provider dataset |
| `forecastDate` | `string` | ✅ | Valid ISO 8601 date string (e.g. `"2024-06-15"`) | Provider dataset |
| `providerName` | `string` | ✅ **NEW** | Must equal a registered provider `id` (e.g. `"primary"`, `"mock"`) | Stamped at aggregation time by `getAllFromAllProviders()` in `weather.js` |

**Change from baseline**: `providerName` is a new field added to every record that passes through `getAllFromAllProviders()`. Records returned by individual provider `.getAll()` / `.getByCity()` calls do **not** carry `providerName` — the field is stamped by the aggregation layer only.

**Identity**: A `WeatherRecord` is uniquely identified by the composite key `(city, providerName)`. The same city may appear with different values across providers — these are distinct, non-merged records (FR-002).

---

### 2. Provider

A registered weather data source, identified by a unique string ID.

| Field | Type | Constraint | Notes |
|-------|------|------------|-------|
| `id` | `string` | Unique within `WeatherProviderRegistry`; used directly as UI display label | e.g. `"primary"`, `"mock"` |
| `getAll()` | `function` | Returns `Array<WeatherRecord>` (without `providerName`) | Implemented by each provider |
| `getByCity(cityName)` | `function` | Returns `WeatherRecord \| null` | Case-insensitive; alias-aware per provider |

**Built-in providers at module load**:
- `"primary"` → `PrimaryWeatherProvider` — 10 US cities
- `"mock"` → `MockWeatherProvider` — 3 cities (New York, Los Angeles, Washington D.C.)

**Third-party provider addition**: Any object implementing `{ id, getAll, getByCity }` may be registered via `WeatherProviderRegistry.register(provider)`. `listProviders()` will reflect it automatically.

---

### 3. ProviderFilter (UI State)

Runtime-only UI state; not persisted.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectedProviderIds` | `Array<string>` | All registered provider IDs (all checked on load) | The set of provider IDs whose records are currently visible |
| `allSelected` | `boolean` (derived) | `true` | True when `selectedProviderIds.length === listProviders().length` |

**Reset policy**: Resets to "all providers selected" on every page load (FR-010b).  
**Interaction rules**:
- Checking "All Providers" toggle → sets `selectedProviderIds` to all registered IDs.
- Unchecking "All Providers" toggle → sets `selectedProviderIds` to `[]` (no records shown).
- Checking an individual provider → adds its ID to `selectedProviderIds`; if now all are selected, "All Providers" is also checked.
- Unchecking an individual provider → removes its ID from `selectedProviderIds`; unchecks "All Providers".

---

## Aggregated Dataset

The combined view presented on the main screen is produced by `getAllFromAllProviders()`:

```
[PrimaryProvider.getAll() records × providerName:"primary"]
 +
[MockProvider.getAll() records × providerName:"mock"]
 + ...
= 13 total records (with 2 built-in providers)
```

| City | Records |
|------|---------|
| New York | 2 (one per provider) |
| Los Angeles | 2 (one per provider) |
| Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, San Jose | 1 each (primary only) |
| Washington D.C. | 1 (mock only) |

Records are **not** merged, averaged, or de-duplicated (FR-002).

---

## State Transitions

```
Page Load
  │
  ▼
getAllFromAllProviders()
  ├── [success] → { data: WeatherRecord[], failedProviders: [] }
  └── [partial failure] → { data: WeatherRecord[], failedProviders: string[] }
        └── Warning banner shown for each failed provider ID
  │
  ▼
Apply ProviderFilter (default: all selected)
  │
  ▼
Apply ConditionFilter (default: all conditions)
  │
  ▼
Apply Sort (default: city)
  │
  ▼
Render table rows + Provider column
```

---

## Validation Rules

| Rule | Where enforced |
|------|---------------|
| `providerName` must be non-empty string | `getAllFromAllProviders()` — only records from successfully loaded providers are included |
| `selectedProviderIds` items must match registered provider IDs | Filter is applied via array `.includes()` — unregistered IDs simply match no records (no error) |
| Provider registration throws on duplicate `id` | `WeatherProviderRegistry.register()` — existing behaviour, unchanged |
| Each provider must implement `getAll()` and `getByCity()` | Enforced by runtime duck-typing — a provider without `getAll()` will throw and be caught as a failed provider |
