---

description: "Task list for Multi-Provider Weather Data Display (SDLCSPAC-7)"
---

# Tasks: Multi-Provider Weather Data Display

**Feature**: SDLCSPAC-7 — The shown data on the main screen is taken only from single weather provider  
**Input**: Design documents from `specs/copilot/sdlcspac-7-display-weather-data/`  
**Spec**: `specs/002-multi-provider-display/spec.md`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/provider-filter-ui.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Audit & Setup

**Purpose**: Understand the existing integration points before making any changes

- [X] T001 Audit `frontend/providerRegistry.js`, `frontend/weather.js`, `frontend/weather.html`, and `tests/` to confirm current provider registration flow, static `weatherData` array usage, and existing test coverage baseline

---

## Phase 2: Foundational — Registry Extension

**Purpose**: Expose all registered provider IDs from `WeatherProviderRegistry` — this API is required by every subsequent implementation and test task

**⚠️ CRITICAL**: T002 and T003 MUST be complete before any User Story phase begins

- [X] T002 Add `listProviders()` method to `WeatherProviderRegistry` in `frontend/providerRegistry.js` that returns `Array.from(_providers.keys())` as a new array; method must never throw
- [X] T003 [P] Extend `tests/providers/providerRegistry.test.js` with tests for `listProviders()`: returns array of IDs in registration order, returns at least `["primary", "mock"]` after module load, reflects a runtime-registered third provider, and returns a new array (mutations do not affect the registry)

**Checkpoint**: `WeatherProviderRegistry.listProviders()` is implemented and all `providerRegistry.test.js` tests pass (`npm test`)

---

## Phase 3: User Story 1 — View Weather Data from All Providers (Priority: P1) 🎯 MVP

**Goal**: Replace the single static `weatherData` array with an aggregated dataset drawn from every registered provider; each record is stamped with `providerName`; failed providers surface a non-blocking warning

**Independent Test**: Open `weather.html` in a browser (or run `tests/weather.html.test.js`) and verify the table contains 13 total records (10 primary + 3 mock) without any console errors; the `npm test` suite must remain fully green

### Tests for User Story 1

- [X] T004 [P] [US1] Add tests for `WeatherApp.getAllFromAllProviders()` in `tests/weather.test.js`: correct total record count (13), every record has a non-empty `providerName` field equal to a registered provider ID, a simulated failing provider populates `failedProviders` array with its ID while still returning successful providers' records, and `failedProviders` is `[]` when all providers succeed
- [X] T005 [P] [US1] Create `tests/weather.html.test.js` (new file) and write DOM integration tests for: page load renders 13 rows in `#weather-body`, `getAllFromAllProviders()` is called on page init, a non-blocking `div.provider-warning[role="alert"]` banner appears when a provider fails, and the dismiss button removes the banner from the DOM

### Implementation for User Story 1

- [X] T006 [US1] Implement `WeatherApp.getAllFromAllProviders()` in `frontend/weather.js`: iterate `WeatherProviderRegistry.listProviders()`, call `WeatherProviderRegistry.getAllWeatherData(id)` for each, shallow-copy each record with `Object.assign({}, record, { providerName: id })`, catch per-provider errors into `failedProviders`, and return `{ data: [], failedProviders: [] }`
- [X] T007 [US1] Update `WeatherApp.getFilteredData()` in `frontend/weather.js` to operate on `getAllFromAllProviders().data` instead of the static `weatherData` array; preserve backward compatibility by keeping the two-argument signature working (third `providerIds` arg added in Phase 5)
- [X] T008 [US1] Update the inline `<script>` in `frontend/weather.html` to call `WeatherApp.getAllFromAllProviders()` on page load, store `{ data, failedProviders }`, pass `data` as the base dataset to the display pipeline, and call the table render function with the aggregated data
- [X] T009 [US1] Add non-blocking warning banner logic in `frontend/weather.html` inline script: if `failedProviders.length > 0`, inject `<div class="provider-warning" role="alert">⚠ Could not load data from provider(s): <strong>{ids}</strong>. <button class="provider-warning__dismiss" aria-label="Dismiss">×</button></div>` before `#weather-table`; wire dismiss button to remove the banner from the DOM

**Checkpoint**: User Story 1 is fully functional — opening `weather.html` shows all 13 records; `npm test` is green

---

## Phase 4: User Story 2 — Same City Shown Separately per Provider (Priority: P1)

**Goal**: Display each city as a distinct row per provider with a visible **Provider** attribution column; records are never merged, averaged, or de-duplicated

**Independent Test**: Verify "New York" appears as two separate rows in the table — one attributed to `primary`, one to `mock` — with all field values (temperature, condition, etc.) preserved intact on each row

### Tests for User Story 2

- [X] T010 [P] [US2] Add DOM integration tests in `tests/weather.html.test.js` for: `#weather-table` header contains a `<th>Provider</th>` column as the last header cell, each row in `#weather-body` contains a final `<td>` with `providerName` text, "New York" appears as exactly two rows with different `providerName` values, and a city covered by only one provider appears as exactly one row

### Implementation for User Story 2

- [X] T011 [US2] Add `<th>Provider</th>` as the last header cell in the `<thead>` row of `#weather-table` in `frontend/weather.html`
- [X] T012 [US2] Update the row-rendering logic in `frontend/weather.html` inline script to append `<td class="provider-badge provider-badge-${row.providerName}">${row.providerName}</td>` as the final cell of every generated `<tr>`

**Checkpoint**: User Stories 1 and 2 are both independently functional; "New York" shows two distinct rows; `npm test` is green

---

## Phase 5: User Story 3 — Filter Weather Data by Provider (Priority: P2)

**Goal**: Multi-select checkbox filter (`<fieldset id="filter-provider">`) lets users show records from one or more providers; combinable with the existing condition filter; resets to "all providers" on page reload

**Independent Test**: Check only the "primary" checkbox → 10 rows remain; uncheck "All Providers" → 0 rows; re-check "All Providers" → 13 rows; select "Sunny" in condition filter while "primary" only is active → only primary Sunny records appear

### Tests for User Story 3

- [X] T013 [P] [US3] Add unit tests for `WeatherApp.filterByProvider(data, selectedProviderIds)` in `tests/weather.test.js`: single-provider selection returns only that provider's records, multi-provider selection returns union of their records, empty array returns all records unchanged, `null`/`undefined` returns all records unchanged, and an unknown provider ID returns an empty array
- [X] T014 [P] [US3] Add unit tests for updated `WeatherApp.getFilteredData(condition, sortKey, providerIds)` in `tests/weather.test.js`: passing `providerIds=["primary"]` returns only primary records, omitting the third argument returns all records (backward-compatible), and combined condition + providerIds filters apply simultaneously
- [X] T015 [P] [US3] Add DOM integration tests for provider filter UI in `tests/weather.html.test.js`: `#filter-provider` fieldset is present, it contains one checkbox per registered provider (labelled with provider `id`) plus `#filter-provider-all`, all checkboxes are checked on page load, unchecking a provider checkbox reduces visible rows to that provider's count, and the "All Providers" checkbox state tracks individual checkboxes correctly
- [X] T016 [P] [US3] Add DOM integration tests for combined filtering in `tests/weather.html.test.js`: applying both a condition filter and a provider filter simultaneously shows only records matching both criteria; clearing provider filter (re-checking "All Providers") while a condition filter is active restores all records for that condition

### Implementation for User Story 3

- [X] T017 [US3] Implement `WeatherApp.filterByProvider(data, selectedProviderIds)` in `frontend/weather.js`: return `data` unchanged when `selectedProviderIds` is falsy or empty; otherwise return `data.filter(r => selectedProviderIds.includes(r.providerName))`; never mutate input; return a new array; never throw
- [X] T018 [US3] Update `WeatherApp.getFilteredData()` signature in `frontend/weather.js` to `getFilteredData(condition, sortKey, providerIds)`: chain `filterByCondition → filterByProvider(providerIds || []) → sortData`; default `providerIds` to `[]` so existing two-argument callers continue to work
- [X] T019 [US3] Add `<fieldset id="filter-provider" class="provider-filter"><legend>Filter by Provider:</legend></fieldset>` to `frontend/weather.html` and dynamically generate one `<label><input type="checkbox" class="provider-checkbox" value="{id}" checked />{id}</label>` per provider ID from `WeatherProviderRegistry.listProviders()`, plus `<label><input type="checkbox" id="filter-provider-all" checked />All Providers</label>` as the first option
- [X] T020 [US3] Implement "All Providers" toggle logic in `frontend/weather.html` inline script: checking `#filter-provider-all` sets all `.provider-checkbox` to `checked=true`; unchecking it sets all to `checked=false`; checking all individual providers auto-checks `#filter-provider-all`; unchecking any individual provider auto-unchecks `#filter-provider-all`
- [X] T021 [US3] Wire `.provider-checkbox` change events in `frontend/weather.html` inline script to derive `selectedProviderIds` from all checked `.provider-checkbox` values and call `WeatherApp.getFilteredData(activeCondition, activeSortKey, selectedProviderIds)` to re-render the table; ensure the existing condition `<select>` and sort `<select>` change handlers also pass the current `selectedProviderIds` so both filters always combine (FR-008)

**Checkpoint**: All three user stories are independently functional; provider filter works alone and combined with condition filter; `npm test` is fully green

---

## Phase 6: Polish & Verification

**Purpose**: Final quality pass and manual validation per quickstart.md

- [X] T022 [P] Run the full test suite (`npm test`) and confirm all tests pass with no regressions in `tests/weather.test.js`, `tests/weather.html.test.js`, `tests/providers/providerRegistry.test.js`, `tests/providers/primaryProvider.test.js`, and `tests/providers/mockProvider.test.js`
- [X] T023 [P] Add inline code comments in `frontend/weather.js` and `frontend/providerRegistry.js` for non-obvious decisions per research.md (e.g., why `providerName` is stamped at aggregation time, why empty `selectedProviderIds` returns all records, why per-provider try/catch is used)
- [X] T024 Manual/integration verification using `quickstart.md` scenarios: page load shows 13 records, unchecking "mock" shows 10, "All Providers" toggle empties and restores table, combined condition + provider filter, simulated provider failure shows warning banner without page error

---

## Dependencies & Execution Order

### Phase Dependencies

- **Audit (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS** all User Story phases
- **US1 (Phase 3)**: Depends on Phase 2 (needs `listProviders()`)
- **US2 (Phase 4)**: Depends on Phase 3 (needs `getAllFromAllProviders()` and the aggregated dataset)
- **US3 (Phase 5)**: Depends on Phase 3 (needs the aggregated dataset); can start independently of US2
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5 completion

### User Story Dependencies

| Story | Depends on | Can be tested independently? |
|-------|-----------|------------------------------|
| US1 (Phase 3) | Foundational (Phase 2) | ✅ Yes — check total record count |
| US2 (Phase 4) | US1 (Phase 3) — needs aggregated data with `providerName` | ✅ Yes — verify "New York" = 2 rows |
| US3 (Phase 5) | Foundational (Phase 2); integrates with US1/US2 | ✅ Yes — verify filter reduces row count |

### Within Each User Story

- Tests (T004/T005, T010, T013–T016): written **before** or **alongside** implementation
- `getAllFromAllProviders()` (T006) before `getFilteredData()` update (T007)
- `filterByProvider()` (T017) before `getFilteredData()` update (T018)
- Logic in `weather.js` before wiring in `weather.html`

### Parallel Opportunities

- T002 and T003 can run in parallel (different files: `providerRegistry.js` vs `providerRegistry.test.js`)
- T004 and T005 can run in parallel (both are test files for US1)
- T006, T007 (weather.js) and T008, T009 (weather.html) — T008/T009 depend on T006/T007
- T010 can start after T011 is in progress (test reads HTML structure)
- T013, T014, T015, T016 all marked [P] — can run in parallel (all test files, no cross-dependencies)
- T017 and T018 are sequential (T018 calls T017)
- T022, T023, T024 can run in parallel (different activities)

---

## Parallel Example: User Story 3 Tests

```
# Launch all US3 test tasks in parallel (different files/sections):
Task T013: filterByProvider() unit tests in tests/weather.test.js
Task T014: getFilteredData(providerIds) unit tests in tests/weather.test.js
Task T015: Provider filter checkbox DOM tests in tests/weather.html.test.js
Task T016: Combined filter DOM tests in tests/weather.html.test.js
```

## Parallel Example: Foundational Phase

```
# Launch T002 and T003 in parallel:
Task T002: Add listProviders() to frontend/providerRegistry.js
Task T003: Add listProviders() tests to tests/providers/providerRegistry.test.js
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2 Only — both P1)

1. Complete Phase 1: Audit
2. Complete Phase 2: Foundational (`listProviders()`) — **required blocker**
3. Complete Phase 3: User Story 1 (aggregation + `getAllFromAllProviders()` + page load wiring)
4. Complete Phase 4: User Story 2 (Provider column + row attribution)
5. **STOP and VALIDATE**: Open browser, confirm 13 rows, two "New York" rows, `npm test` green
6. Demo/deploy if ready

### Incremental Delivery

1. Phase 1 + 2 → Registry foundation ready
2. Phase 3 → All-provider data visible on screen → **MVP for US1 (P1)**
3. Phase 4 → Provider attribution column → **US2 complete (P1)**
4. Phase 5 → Provider filter control → **US3 complete (P2)**
5. Phase 6 → Polish + verification

### Parallel Team Strategy

With two developers after Phase 2 completes:

- Developer A: Phase 3 (US1 aggregation logic + page load wiring)
- Developer B: Phase 4 tests + Phase 5 tests (can write and run against Phase 3 output)

---

## Notes

- **No build step**: All changes are plain JS in `<script>` tags or `.js` files — no transpilation or bundler
- **Backward compatibility**: `getFilteredData(condition, sortKey)` two-argument form MUST continue to work (existing tests in `weather.test.js` use it)
- **Static array preserved**: The existing `weatherData` array and single-provider functions in `weather.js` remain intact for existing tests — new functions are strictly additive
- **`[P]` tasks** = operate on different files or independent code sections; no risk of merge conflict with each other
- **`[Story]` label** maps each task to its user story for traceability and independent PR review
- Commit after each phase checkpoint; run `npm test` before every commit
- `tests/weather.html.test.js` is a **new file** — create it from scratch using jsdom (already configured in `package.json`)
