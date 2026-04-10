# Implementation Plan: Multi-Weather Provider Support

**Branch**: `001-multi-weather-provider` | **Date**: 2025-07-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-weather-provider/spec.md`

---

## Summary

Introduce a provider abstraction layer into the existing vanilla-JavaScript weather forecast
app so that multiple weather data sources can be selected at request time. The first provider
wraps the existing 10-city dataset unchanged; the second is a hardcoded mock returning:
New York → Sunny, LA → Snow, Washington → Windy. A lightweight registry routes calls to the
selected provider by string id. All existing exports and tests remain unmodified.

---

## Technical Context

**Language/Version**: JavaScript (vanilla ES5-compatible; no transpilation step)
**Primary Dependencies**: Jest 29.x (test), jest-environment-jsdom (test DOM simulation); no runtime dependencies
**Storage**: N/A — all data is hardcoded in source files; no database or external config
**Testing**: Jest 29 (`npm test`); jsdom environment for DOM-dependent tests
**Target Platform**: Browser (Chrome/Firefox/Safari) + Node.js 18+ (CommonJS for Jest)
**Project Type**: Frontend web application — single HTML page; no bundler, no framework
**Performance Goals**: No specific targets; mock provider returns synchronously with negligible overhead (SC-006)
**Constraints**: No build step; files loaded via `<script>` tags; load order in `weather.html` is the dependency graph
**Scale/Scope**: 2 providers at launch; architecture supports N providers without core changes (SC-005)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle 1 — Quality

| Check | Status | Notes |
|---|---|---|
| Change is small and focused | ✅ PASS | Adds provider abstraction only; no visual changes, no unrelated refactors |
| Single clearly stated purpose | ✅ PASS | Provider abstraction + mock provider as described in SDLCSPAC-5 |
| Existing code patterns preserved | ✅ PASS | Factory functions + CommonJS + IIFE pattern matches existing `weather.js` style |
| Existing API surface unchanged | ✅ PASS | All existing `WeatherApp.*` functions remain; two new functions added |

### Principle 2 — Testing

| Check | Status | Notes |
|---|---|---|
| Tests added for new behaviour | ✅ PASS | Three new test files covering primaryProvider, mockProvider, and registry |
| Existing tests untouched | ✅ PASS | `tests/weather.test.js` must not be modified; SC-003 mandates zero regression |
| Test assertions are not loosened | ✅ PASS | New tests add coverage; no existing assertion is removed or weakened |

### Principle 3 — Security & Configuration

| Check | Status | Notes |
|---|---|---|
| No secrets committed | ✅ PASS | No API keys or credentials involved; all data is static mock |
| Inputs validated at boundaries | ✅ PASS | `providerId` validated in registry (throws on unknown); city name normalised and alias-resolved before lookup |
| Hardcoded data is safe | ✅ PASS | Mock data is non-sensitive city weather; no PII |

### Principle 4 — Delivery

| Check | Status | Notes |
|---|---|---|
| Codebase stays buildable after each commit | ✅ PASS | Plan requires tests pass before merge; each file is independently loadable |
| Non-obvious decisions documented | ✅ PASS | Alias map, load order, `null`-vs-throw distinction documented in contracts and inline comments |

**Gate Result: ALL CHECKS PASS — proceed to implementation.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-weather-provider/
├── spec.md                          # Feature specification
├── plan.md                          # This file
├── research.md                      # Phase 0 — provider patterns, alias strategy, error handling
├── data-model.md                    # Phase 1 — WeatherRecord, WeatherProvider, WeatherProviderRegistry
├── quickstart.md                    # Phase 1 — developer usage guide and third-provider recipe
├── contracts/
│   └── weather-provider-api.md      # Phase 1 — full API contract for providers and registry
└── tasks.md                         # Phase 2 — created by /speckit.tasks (not this command)
```

### Source Code (repository root)

```text
frontend/                            # Browser-loaded JS; all files plain ES5-compatible
├── providers/                       # NEW directory
│   ├── primaryProvider.js           # NEW — existing weatherData wrapped as a provider
│   └── mockProvider.js              # NEW — hardcoded mock: NY(Sunny)/LA(Snow)/Washington(Windy)
├── providerRegistry.js              # NEW — Map-based registry; routes getAllWeatherData / getWeatherByCity
├── weather.js                       # UPDATED — adds getWeatherByCity + getAllFromProvider to WeatherApp;
│                                    #           all existing exports unchanged
├── weather.html                     # UPDATED — adds 3 <script> tags in correct load order
└── weather.css                      # UNCHANGED

tests/
├── weather.test.js                  # UNCHANGED — must remain green (SC-003)
└── providers/                       # NEW directory
    ├── primaryProvider.test.js      # NEW — provider interface compliance + data integrity
    ├── mockProvider.test.js         # NEW — alias resolution, city conditions, null returns
    └── providerRegistry.test.js     # NEW — registration, routing, error messages
```

**Structure Decision**: Option 2 variant — frontend-only web application. No backend/API directory;
all logic is client-side JS. The `frontend/providers/` subdirectory is introduced to house provider
modules without expanding `frontend/` root into a flat file list that becomes unnavigable as
providers grow (SC-005 — 30-minute third-provider onboarding target).

---

## Complexity Tracking

No constitution violations identified. No complexity justification required.

---

## Phase 0 — Research

> **Status**: Complete. See [`research.md`](./research.md).

### Key Decisions

| Topic | Decision | File |
|---|---|---|
| Provider pattern | Factory functions (plain JS objects); consistent with existing module style | `research.md §1` |
| Registry/selector | `WeatherProviderRegistry` module; `Map`-based; `providerId` as call-time argument | `research.md §2` |
| File structure | Four files; browser `<script>` load order; CommonJS exports for Jest | `research.md §3` |
| City alias strategy | Inline alias map + `toLowerCase()` + `trim()` in `mockProvider.js` | `research.md §4` |
| Error handling | `null` for unsupported city; `Error` thrown for unknown `providerId` | `research.md §5` |

### NEEDS CLARIFICATION — All Resolved

All unknowns from Technical Context were resolved in research. No open items remain.

---

## Phase 1 — Design & Contracts

> **Status**: Complete. See [`data-model.md`](./data-model.md), [`contracts/`](./contracts/), [`quickstart.md`](./quickstart.md).

---

### Data Model Summary

See [`data-model.md`](./data-model.md) for full entity definitions.

**Three entities:**

1. **WeatherRecord** — the unified data shape; all providers return this structure.
   Required fields: `city`, `state`, `temperature`, `humidity`, `windSpeed`, `condition`, `forecastDate`.

2. **WeatherProvider** (duck-typed interface) — `{ id, getByCity(cityName) → WeatherRecord|null, getAll() → WeatherRecord[] }`.
   Two implementations: `primaryProvider` (id=`'primary'`) and `mockProvider` (id=`'mock'`).

3. **WeatherProviderRegistry** — `{ register, getProvider, getAllWeatherData, getWeatherByCity }`.
   Single module instance; providers registered at module load time.

**Mock provider data:**

| city | condition |
|---|---|
| New York | Sunny |
| Los Angeles | Snow |
| Washington D.C. | Windy |

---

### Contract Summary

See [`contracts/weather-provider-api.md`](./contracts/weather-provider-api.md) for the full specification.

**WeatherProvider interface** (all providers must implement):
- `id: string` — unique, non-empty
- `getByCity(cityName: string) → WeatherRecord | null` — case-insensitive, alias-aware, returns `null` for unknown cities (never throws)
- `getAll() → WeatherRecord[]` — returns a copy of all records (never `null`)

**WeatherProviderRegistry**:
- `register(provider)` — throws if duplicate id
- `getProvider(id)` — throws `'Unknown weather provider: <id>'` for unknown ids
- `getAllWeatherData(providerId)` — delegates to provider's `getAll()`
- `getWeatherByCity(city, providerId)` — delegates to provider's `getByCity()`

**WeatherApp public surface additions** (browser global):
- `WeatherApp.getWeatherByCity(city, providerId) → WeatherRecord | null`
- `WeatherApp.getAllFromProvider(providerId) → WeatherRecord[]`

**Script load order** (`weather.html`):
```html
<script src="providers/primaryProvider.js"></script>   <!-- 1st -->
<script src="providers/mockProvider.js"></script>        <!-- 2nd -->
<script src="providerRegistry.js"></script>             <!-- 3rd -->
<script src="weather.js"></script>                      <!-- 4th (existing; now reads registry) -->
```

---

### Agent Context

Agent context updated via `.specify/scripts/powershell/update-agent-context.ps1`.

**Technologies added in this plan:**
- `WeatherProvider` duck-typed interface pattern (vanilla JS)
- `WeatherProviderRegistry` Map-based registry module
- `frontend/providers/` module directory convention

---

## Implementation Guidance

### `frontend/providers/primaryProvider.js`

- Imports (requires) `weatherData` array from `weather.js` **or** duplicates the raw array (preferred: self-contained module; does not import from `weather.js` to avoid circular dependency).
- Implements `getByCity(cityName)`: normalises input, looks up by `city` field case-insensitively, returns first match or `null`.
- Implements `getAll()`: returns `weatherData.slice()`.
- Exports via `module.exports` and attaches to `window.PrimaryWeatherProvider`.

### `frontend/providers/mockProvider.js`

- Defines internal `mockData` array (3 entries) and `aliasMap` (lowercase keys).
- `getByCity` normalises input → looks up alias → looks up `mockData` by canonical key.
- Known aliases: `la` → `los angeles`; `los angeles` → `los angeles`; `washington` → `washington d.c.`; `washington d.c.` → `washington d.c.`; `washington dc` → `washington d.c.`; `new york` → `new york`; `new york city` → `new york`; `nyc` → `new york`.
- `getAll()` returns `mockData.slice()`.
- Exports via `module.exports` and attaches to `window.MockWeatherProvider`.

### `frontend/providerRegistry.js`

- Internal `_providers` Map initialised at module load.
- `register(provider)` — checks for duplicate, stores in `_providers`.
- At module load: calls `register(primaryProvider)` and `register(mockProvider)` — these files must already be loaded (browser) or required (Node).
- In browser: reads `window.PrimaryWeatherProvider` and `window.MockWeatherProvider`.
- In Node: `require('./providers/primaryProvider')` and `require('./providers/mockProvider')`.
- Exports via `module.exports` and attaches to `window.WeatherProviderRegistry`.

### `frontend/weather.js` (changes only)

- Add at the end of the existing CommonJS export block:
  ```js
  getWeatherByCity: function (city, providerId) {
    return WeatherProviderRegistry.getWeatherByCity(city, providerId);
  },
  getAllFromProvider: function (providerId) {
    return WeatherProviderRegistry.getAllWeatherData(providerId);
  }
  ```
- Mirror in `window.WeatherApp` assignment.
- Browser: reads `window.WeatherProviderRegistry` (already loaded by this point).
- Node: requires `./providerRegistry`.
- **No existing function or export is removed or modified.**

### Test Coverage Requirements

| Test file | Scenarios to cover |
|---|---|
| `primaryProvider.test.js` | Implements `id`, `getAll()` returns 10 records, `getByCity` case-insensitive match, `getByCity` returns `null` for unknown city, `getAll()` returns a copy |
| `mockProvider.test.js` | New York → Sunny, LA (alias) → Snow, Washington (alias) → Windy, case-insensitive variants, unknown city → `null`, `getAll()` returns 3 records, `getAll()` returns a copy |
| `providerRegistry.test.js` | Both providers registered at load, `getProvider('primary')` / `getProvider('mock')`, unknown id throws with correct message, `getWeatherByCity` routing, `getAllWeatherData` routing, duplicate registration throws |

---

## Post-Design Constitution Re-Check

| Principle | Status |
|---|---|
| Quality — small focused change, patterns preserved | ✅ PASS |
| Testing — new tests for all new behaviour; existing tests untouched | ✅ PASS |
| Security — no secrets; city input normalised at provider boundary | ✅ PASS |
| Delivery — no build step broken; load order documented; inline comments planned for alias map and load-order rationale | ✅ PASS |

**All gates pass. Feature is ready for task generation (`/speckit.tasks`) and implementation (`/speckit.implement`).**
