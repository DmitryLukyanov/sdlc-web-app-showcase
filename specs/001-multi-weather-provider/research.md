# Research: Multi-Weather Provider Support

**Feature**: `001-multi-weather-provider`
**Phase**: 0 — Outline & Research
**Date**: 2025-07-22

---

## Research Area 1 — Provider Abstraction Pattern in Vanilla JavaScript

### Decision
Use factory functions (plain objects with methods) following the existing IIFE/CommonJS module pattern already established in `frontend/weather.js`. No ES6 classes, no TypeScript interfaces — consistency with the existing code style takes precedence.

### Rationale
The codebase uses vanilla ES5-compatible JavaScript (`function`, `var`/`const`/`let`, `module.exports`, IIFE for browser global exposure). Introducing a `class`-based hierarchy would break the established pattern (Constitution Principle 1 — Quality). A factory function that returns a plain object `{ id, getByCity, getAll }` satisfies the duck-typed interface requirement without any syntax mismatch.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| ES6 class hierarchy | Inconsistent with existing code style; no TypeScript to enforce the interface contract anyway |
| TypeScript interfaces | Would require introducing a transpilation step — out of scope |
| Singleton module pattern | Works for single provider; does not compose well when registering multiple providers |

---

## Research Area 2 — Provider Registry / Selector Mechanism

### Decision
A `WeatherProviderRegistry` module with a `Map`-based internal store. Exposes `register(provider)`, `getProvider(id)`, and convenience methods `getAllWeatherData(providerId)` and `getWeatherByCity(city, providerId)`. The registry is a plain object (not a class).

### Rationale
- **At-request-time selection** (FR-002): The `providerId` string is passed as an argument to data-fetch calls. No global state mutation, no restart needed.
- **Extensibility** (FR-008, SC-005): Registering a third provider requires calling `register()` with a new provider object. No core logic changes needed.
- **Backward compatibility** (FR-007): Existing `weatherData`, `getAllWeatherData`, `filterByCondition`, `sortData`, `getFilteredData`, `getConditionSummary` functions remain unchanged and continue to operate on the primary provider's dataset by default. Existing tests will not be touched.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Global config variable to switch provider | Breaks FR-002 (no restart required); global state is fragile |
| Strategy pattern with dependency injection into existing functions | Would require modifying existing function signatures in a breaking way; violates FR-007 |
| Environment variable switch | Requires app restart; violates FR-002 |

---

## Research Area 3 — File / Module Split vs Monolithic `weather.js`

### Decision
Split into four files:
1. `frontend/providers/primaryProvider.js` — extracts the existing `weatherData` array into a standalone provider module.
2. `frontend/providers/mockProvider.js` — new mock provider with hardcoded data.
3. `frontend/providerRegistry.js` — registry + selector logic.
4. `frontend/weather.js` — updated to `require`/import the registry for the new provider-aware exports; **existing exports remain untouched**.

Browser loading order in `weather.html`: `primaryProvider.js` → `mockProvider.js` → `providerRegistry.js` → `weather.js`.

### Rationale
A single-file approach would make `weather.js` unreadably large and make future provider additions harder (violates SC-005 — 30-minute third-provider rule). Separate files also make Jest test isolation clean: each provider and the registry can be tested in isolation.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Inline everything in `weather.js` | Monolithic; harder to test in isolation; harder to add future providers |
| Use a bundler (Webpack/Rollup) | Adds build tooling that doesn't exist today; scope creep |
| Single `providers.js` file for all providers | Less extensible; adding a provider means editing a shared file |

---

## Research Area 4 — City Name Aliasing / Case-Insensitive Matching

### Decision
The mock provider normalises the lookup key by trimming and lowercasing the input. An alias map resolves known alternate names to a canonical key before lookup.

Alias map:
```js
{
  'la': 'los angeles',
  'los angeles': 'los angeles',
  'washington': 'washington d.c.',
  'washington d.c.': 'washington d.c.',
  'washington dc': 'washington d.c.',
  'new york': 'new york',
  'new york city': 'new york',
  'nyc': 'new york'
}
```

### Rationale
- FR-009 (case-insensitive matching) is satisfied by the `toLowerCase()` + `trim()` normalisation.
- The spec assumptions explicitly call out `"LA"` / `"Los Angeles"` and `"Washington"` / `"Washington D.C."` as equivalent. A simple alias map is readable, testable, and requires no regex.
- Hardcoded aliases are appropriate for the initial implementation (FR-010 — hardcoded data); the architecture is extensible to an external alias configuration later.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Fuzzy string matching | Overkill; introduces a dependency; aliases are known and finite |
| Normalising only `toLowerCase` without alias map | Would not handle `"LA"` → `"Los Angeles"` mapping |

---

## Research Area 5 — Graceful Handling of Unsupported Cities

### Decision
`mockProvider.getByCity(city)` returns `null` when the city is not in the alias map or data store. The registry propagates `null` to the caller without throwing. An unknown `providerId` passed to the registry throws a descriptive `Error` (distinct behaviour — unsupported city vs unknown provider are different error conditions).

### Rationale
- FR-006: `null` is the spec-approved graceful indicator for unsupported cities.
- The edge-case spec states "an unknown provider identifier should return a clear error" — throwing is appropriate here because the caller has misconfigured the request, not requested a legitimate but uncovered city.
- No unhandled exceptions (FR-006), no silent data corruption (FR-006).

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Return empty array / empty object for unsupported city | Ambiguous; could be confused with a real response with no data |
| Throw for unsupported city | Spec says graceful degradation, not an exception |
| Return a sentinel object `{ error: 'unsupported city' }` | Adds complexity; `null` is the spec-approved answer |

---

## Summary of Resolutions

| Was Unknown | Resolution |
|---|---|
| Provider pattern in vanilla JS | Factory functions; plain `{ id, getByCity, getAll }` objects |
| Registry / selector mechanism | `WeatherProviderRegistry` module with `Map`; `providerId` passed at call time |
| File structure | Four files; browser loading order via `<script>` tags |
| City alias strategy | Inline alias map in `mockProvider.js`; `toLowerCase` + `trim` normalisation |
| Unsupported city handling | Return `null`; unknown provider throws descriptive `Error` |
