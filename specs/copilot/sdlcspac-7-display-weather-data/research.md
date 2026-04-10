# Research: Multi-Provider Weather Data Display

**Feature**: SDLCSPAC-7  
**Branch**: `copilot/sdlcspac-7-display-weather-data`  
**Phase**: 0 — Research & Unknowns Resolution

---

## 1. How to expose all registered provider IDs from `WeatherProviderRegistry`

**Decision**: Add a `listProviders()` method to `WeatherProviderRegistry` that returns an array of all registered provider `id` strings, derived from the internal `_providers` Map.

**Rationale**: The spec and clarifications explicitly state: *"extend `WeatherProviderRegistry` with a method to expose all registered providers (e.g. `listProviders()`)"*. The internal `_providers` Map already holds all registered instances — `Array.from(_providers.keys())` gives the ID list without any additional data structure. This is the minimal, non-breaking change required.

**Implementation sketch**:
```javascript
listProviders: function () {
  return Array.from(_providers.keys());
}
```

**Alternatives considered**:
- Return full provider objects instead of IDs — rejected; the spec says IDs are used for labelling. Returning objects would leak internals unnecessarily.
- A separate `getRegisteredIds()` name — rejected; spec names it `listProviders()` explicitly.

---

## 2. Data aggregation strategy in `weather.js`

**Decision**: Add `getAllFromAllProviders()` to `weather.js`. It calls `registry.listProviders()`, iterates the ID array, calls `registry.getAllWeatherData(id)` for each, stamps every returned record with `providerName: id`, and concatenates results into a single flat array. Failed providers (those whose `getAllWeatherData()` throws) are caught per-provider; their error is captured in a separate `failedProviders` array returned alongside the data.

**Rationale**:  
- Follows the Strategy pattern already in place: the registry routes to each provider; `weather.js` is the consumer layer.  
- `providerName` stamping at aggregation time means provider source data objects are not mutated — each record is a new shallow copy (`Object.assign({}, record, { providerName: id })`).  
- Per-provider try/catch satisfies FR-009: *"If a provider returns no data or is unavailable, the main screen MUST continue to display records from all other providers"*.  
- Returning `{ data, failedProviders }` from the function rather than side-effecting into a global keeps the function testable in isolation.

**Return shape**:
```javascript
// { data: Array<WeatherRecord>, failedProviders: Array<string> }
function getAllFromAllProviders() { ... }
```

**Alternatives considered**:
- `Promise`-based async aggregation — rejected; all providers are synchronous in-memory; async would add complexity with no benefit in this stack.
- Aggregating in the HTML inline `<script>` — rejected; logic belongs in `weather.js` to remain testable via Jest.

---

## 3. `providerName` field placement

**Decision**: `providerName` is added to each record **at aggregation time** in `getAllFromAllProviders()`, not inside the provider implementations.

**Rationale**:  
- Neither `primaryProvider.js` nor `mockProvider.js` currently carry a `providerName` field in their dataset objects. Adding it there would couple provider data definitions to display concerns, and would not generalise when a third provider is registered externally.  
- Stamping at the consumer layer (`weather.js`) matches the existing pattern where `weather.js` is the sole presenter-layer logic module.
- Spec FR-003 says *"each record MUST be attributed to its originating provider using the provider's `id` string"* — `providerName: providerId` satisfies this directly.

**Alternatives considered**:
- Adding `providerName` to each provider's dataset — rejected; creates duplication and couples data to presentation.
- Using a separate lookup map `{ recordIndex: providerId }` — rejected; unnecessarily complex when a direct property is simpler and more readable.

---

## 4. Provider filter implementation

**Decision**: Add `filterByProvider(data, selectedProviderIds)` to `weather.js`.  
- `selectedProviderIds` is an array of provider ID strings.  
- An empty array or null/undefined means "all providers" (no filter applied).  
- Returns a new filtered array; does not mutate input.

**Update `getFilteredData`**: Accept an additional `providerIds` parameter:
```javascript
function getFilteredData(condition, sortKey, providerIds) { ... }
```
This chains `filterByCondition` → `filterByProvider` → `sortData` in that order.

**Rationale**: Keeping the filter as a pure function in `weather.js` makes it unit-testable. The HTML inline script simply passes `selectedProviderIds` from the checkbox state to `getFilteredData`.

**Alternatives considered**:
- Filtering purely in the HTML `<script>` — rejected; untestable, and violates the separation already established by `weather.js`.
- A single combined filter function — rejected; the existing `filterByCondition` is already a named function; extending `getFilteredData` to chain filters is the smallest modification.

---

## 5. Multi-select checkbox UI control

**Decision**: Add a `<fieldset>` with one `<input type="checkbox">` per registered provider (labelled with `provider.id`) plus an "All Providers" master toggle. This replaces no existing control — the existing `<select id="filter-condition">` remains unchanged.

**Rationale**: Spec clarification says *"Multi-select checkboxes — one checkbox per registered provider"*. A `<fieldset>` + `<legend>` is the semantically correct HTML pattern for a group of related checkboxes; it is also accessible by default (matches the existing `<fieldset class="theme-toggle">` pattern in the page).

**Checkbox state logic**:
- On page load: all provider checkboxes checked; "All Providers" checkbox checked.
- Checking "All Providers" checks all individual provider boxes.
- Unchecking any individual provider unchecks "All Providers".
- Checking all individual providers re-checks "All Providers".
- The effective `selectedProviderIds` is derived from which individual checkboxes are checked.

**DOM generation**: Checkboxes are generated dynamically from `WeatherProviderRegistry.listProviders()` so the UI automatically reflects any future provider registrations.

**Alternatives considered**:
- Static hardcoded checkboxes — rejected; would not generalise when a third provider is added.
- `<select multiple>` — rejected; spec explicitly requires checkboxes.
- A single-select `<select>` — rejected; spec requires multi-select.

---

## 6. Provider column in the data table

**Decision**: Add a **Provider** column (`<th>Provider</th>`) as the last column in `#weather-table`. Each row renders `row.providerName` in the new cell.

**Rationale**: FR-003 requires per-record attribution. Adding it as the rightmost column is the least disruptive change to the existing table layout and matches the convention of adding derived/metadata columns after the data columns.

**Alternatives considered**:
- Adding provider as the first column — rejected; would shift all existing column indices and affect sorting expectations.
- Rendering provider as a badge/tag within the City cell — rejected; spec says "clearly identifies which provider" — a dedicated column is clearest.

---

## 7. Non-blocking warning for failed providers (FR-009)

**Decision**: After calling `getAllFromAllProviders()`, if `failedProviders.length > 0`, inject a `<div class="provider-warning">` banner above the table. The banner lists each failed provider by `id`. It is dismissible (close button) but does not block any interaction. If `failedProviders` is empty, no banner is rendered.

**Rationale**: Spec says *"a visible, non-blocking warning indicator (e.g. a banner or inline badge)"*. A top-of-content banner is the most visible location that does not disrupt the table. Using a CSS class (`provider-warning`) rather than inline styles keeps it consistent with existing badge patterns.

**Alternatives considered**:
- Inline per-row badge — rejected; failed providers produce no rows, so there is nothing to badge.
- `console.warn` only — rejected; the spec explicitly requires a visible UI indicator.
- Full-page error state — rejected; spec explicitly prohibits it.

---

## 8. Existing `filterByCondition` and the static `weatherData` array

**Decision**: The static `weatherData` array and `filterByCondition`/`getFilteredData`/`getAllWeatherData` in `weather.js` that operate on it are **preserved as-is**. The new multi-provider functions are additive. The HTML inline script is updated to call the new `getAllFromAllProviders()` path instead of `WeatherApp.getFilteredData()`.

**Rationale**:  
- Existing Jest tests (`weather.test.js`) test the static-array functions and must remain green (Constitution Principle 2).  
- Removing the static array would break 40+ existing test assertions.  
- The spec does not require removing or deprecating the existing API.

**Risk**: `getFilteredData` signature change (adding optional `providerIds` parameter) is backward-compatible — existing callers with two arguments continue to work since `providerIds` defaults to `[]`/all.

---

## 9. Test strategy

**Decision**:  
- `tests/providers/providerRegistry.test.js`: Add tests for `listProviders()` — returns array of IDs, reflects runtime registrations.  
- `tests/weather.test.js`: Add tests for `getAllFromAllProviders()` (record count, `providerName` field, failed-provider handling), `filterByProvider()` (filter by one provider, multi-select, empty array = all, unknown provider ID = empty), and updated `getFilteredData()` with provider parameter.  
- `tests/weather.html.test.js` (new file): DOM integration tests using jsdom — provider column in table header/rows, checkbox filter rendering, "All Providers" toggle, combined condition + provider filter, warning banner for failed providers.

**Rationale**: Constitution Principle 2 requires tests for all observable behaviour changes. Jest + jsdom is already configured in `package.json`.

**Alternatives considered**:
- Playwright/E2E tests — rejected; not in current test stack; Jest + jsdom is sufficient for DOM unit-level testing.
