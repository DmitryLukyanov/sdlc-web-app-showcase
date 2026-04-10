# Tasks: Multi-Weather Provider Support

**Input**: Design documents from `/specs/001-multi-weather-provider/`
**Feature Branch**: `001-multi-weather-provider`
**Generated**: 2025-07-22
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **Contract**: [contracts/weather-provider-api.md](./contracts/weather-provider-api.md)
**Tests**: Unit tests and integration tests included per Tasks Directives (directives 4 and 5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no inter-task dependency)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Orient implementation — no new dependencies or build steps are required. The existing Jest 29 + jsdom environment handles all test execution via `npm test`.

- [ ] T001 Review `frontend/weather.js` exports and `tests/weather.test.js` patterns to confirm the WeatherRecord shape (`city`, `state`, `temperature`, `humidity`, `windSpeed`, `condition`, `forecastDate`) and existing CommonJS + `window.WeatherApp` dual-export convention before adding new modules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the WeatherProvider interface and the registry that all user stories depend on. No user story work can begin until both `primaryProvider.js` and `providerRegistry.js` exist and pass their tests.

**⚠️ CRITICAL**: T005 (mockProvider.js) is also required before T003's tests can execute — T002 and T005 may be coded in parallel, but all three files must exist before running `npm test`.

- [ ] T002 [P] Create `frontend/providers/primaryProvider.js` implementing the WeatherProvider interface (`id: 'primary'`, `getByCity(cityName)` with case-insensitive lookup returning `WeatherRecord | null`, `getAll()` returning a shallow copy of all 10 records); export via `module.exports` and attach to `window.PrimaryWeatherProvider`; inline the raw `weatherData` array — do **not** import from `weather.js` to avoid circular dependency
- [ ] T003 Create `frontend/providerRegistry.js` implementing `WeatherProviderRegistry` with an internal `Map`; expose `register(provider)` (throws `Error('Provider already registered: <id>')` on duplicate), `getProvider(id)` (throws `Error('Unknown weather provider: <id>')` on miss), `getAllWeatherData(providerId)`, and `getWeatherByCity(city, providerId)`; auto-register `PrimaryWeatherProvider` and `MockWeatherProvider` at module load using `require` in Node / `window.*` in browser; export via `module.exports` and attach to `window.WeatherProviderRegistry`
- [ ] T004 [P] Create `tests/providers/primaryProvider.test.js` with unit tests verifying: `id === 'primary'`; `getAll()` returns exactly 10 records; `getAll()` returns a copy (mutation does not affect internal state); `getByCity('seattle')` matches case-insensitively; `getByCity('NonExistentCity')` returns `null`; each record has all 7 required fields

**Checkpoint**: `PrimaryWeatherProvider` interface defined and green; registry skeleton ready — user story work can begin.

---

## Phase 3: User Story 1 — Switch Between Weather Providers (Priority: P1) 🎯 MVP

**Goal**: A caller can pass a `providerId` string (`'primary'` or `'mock'`) at request time and receive weather data from the correct provider without any global restart or environment change.

**Independent Test**: Configure the system to use the `'mock'` provider; request weather data for New York, LA, and Washington. Confirm conditions are Sunny, Snow, and Windy respectively. Then switch to `'primary'` and confirm the existing 10-city dataset is unaffected.

### Tests for User Story 1

> **Write tests FIRST — ensure they FAIL before implementation of the files they cover**

- [ ] T005 [P] [US1] Create `tests/providers/mockProvider.test.js` with unit tests verifying: `id === 'mock'`; `getByCity('New York')` returns `condition: 'Sunny'`; `getByCity('LA')` resolves alias and returns `condition: 'Snow'`; `getByCity('Washington')` resolves alias and returns `condition: 'Windy'`; `getAll()` returns exactly 3 records; `getAll()` returns a copy; each record has all 7 required `WeatherRecord` fields with correct types
- [ ] T006 [P] [US1] Create `tests/providers/providerRegistry.test.js` with unit tests verifying: both `'primary'` and `'mock'` providers are registered at load time; `getProvider('primary')` returns a provider with `id === 'primary'`; `getProvider('mock')` returns a provider with `id === 'mock'`; `getWeatherByCity('New York', 'mock')` returns `condition: 'Sunny'`; `getAllWeatherData('primary')` returns 10 records; `getAllWeatherData('mock')` returns 3 records

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create `frontend/providers/mockProvider.js` with `id: 'mock'`, an internal `mockData` array (New York → Sunny, Los Angeles → Snow, Washington D.C. → Windy — use placeholder values for `state`, `temperature`, `humidity`, `windSpeed`, `forecastDate` as specified in `data-model.md`), and an `aliasMap` with lowercase keys (`la`, `los angeles`, `washington`, `washington d.c.`, `washington dc`, `washington d.c.`, `new york`, `new york city`, `nyc`); implement `getByCity(cityName)` with `trim()` + `toLowerCase()` + alias resolution + `null` for unrecognised cities; implement `getAll()` returning `mockData.slice()`; export via `module.exports` and attach to `window.MockWeatherProvider`
- [ ] T008 [US1] Update `frontend/weather.js` to add two new methods at the end of both the CommonJS export block and the `window.WeatherApp` assignment: `getWeatherByCity(city, providerId)` delegating to `WeatherProviderRegistry.getWeatherByCity(city, providerId)` and `getAllFromProvider(providerId)` delegating to `WeatherProviderRegistry.getAllWeatherData(providerId)`; in Node context use `require('./providerRegistry')`; in browser context read `window.WeatherProviderRegistry`; **do not modify or remove any existing export**
- [ ] T009 [US1] Update `frontend/weather.html` to insert three `<script>` tags immediately before the existing `<script src="weather.js">` tag in this exact order: `<script src="providers/primaryProvider.js"></script>`, `<script src="providers/mockProvider.js"></script>`, `<script src="providerRegistry.js"></script>`; add an inline comment explaining the load-order dependency (providers → registry → weather.js)

**Checkpoint**: User Story 1 is fully functional. `getWeatherByCity('New York', 'mock')` returns `Sunny`; `getWeatherByCity('New York', 'primary')` returns the existing primary-provider value; all T005 and T006 tests pass.

---

## Phase 4: User Story 2 — Graceful Handling for Unsupported Cities (Priority: P2)

**Goal**: Requesting weather from the mock provider for a city outside its supported list returns `null` or a clear indicator — no unhandled exception, no silent data corruption, no data leakage from the primary provider.

**Independent Test**: Request weather data for `'Chicago'` using `providerId: 'mock'`. Verify the response is `null`, no exception is thrown, and the result contains no data sourced from `primaryProvider`.

### Tests for User Story 2

- [ ] T010 [P] [US2] Add test cases to `tests/providers/mockProvider.test.js` for graceful degradation: `getByCity('Chicago')` returns `null`; `getByCity('')` returns `null`; `getByCity('  ')` (whitespace-only) returns `null`; none of these calls throw; the returned value is strictly `null` (not `undefined`, not `{}`, not a primary-provider record)

### Implementation for User Story 2

- [ ] T011 [US2] Verify `frontend/providers/mockProvider.js` covers all required alias variants — run `npm test` and confirm T010 tests pass; if any alias (`la`, `los angeles`, `washington dc`, `washington d.c.`, `nyc`, `new york city`) fails, update the `aliasMap` in `frontend/providers/mockProvider.js` accordingly; confirm that any city not present in the alias map or `mockData` resolves to `null` with no exception

**Checkpoint**: User Stories 1 and 2 are both independently functional. Mock provider returns correct conditions for known cities and `null` for all others with zero exceptions.

---

## Phase 5: User Story 3 — Extensible Provider Registration (Priority: P3)

**Goal**: A developer can introduce a third weather provider by creating one new file and calling `register()` — no changes to `primaryProvider.js`, `mockProvider.js`, `providerRegistry.js`, or `weather.js` are required.

**Independent Test**: Create an inline third-provider object inside the test file (no separate source file needed) and register it with the registry. Confirm it can be selected via `getWeatherByCity` and `getAllWeatherData` using the same interface.

### Tests for User Story 3

- [ ] T012 [P] [US3] Add test cases to `tests/providers/providerRegistry.test.js` for extensibility: define an inline `thirdProvider` object (`id: 'third'`, `getByCity`, `getAll`) directly in the test; call `register(thirdProvider)`; verify `getProvider('third')` returns `thirdProvider`; verify `getAllWeatherData('third')` delegates correctly; verify registering a duplicate `id` throws `Error('Provider already registered: third')`; verify that adding this provider does not change `getAllWeatherData('primary')` or `getAllWeatherData('mock')` results

### Implementation for User Story 3

- [ ] T013 [US3] Verify `frontend/providerRegistry.js` enforces both error conditions — run `npm test` and confirm T012 tests pass; confirm `register()` throws the exact message `'Provider already registered: <id>'` and `getProvider()` throws `'Unknown weather provider: <id>'` as specified in `contracts/weather-provider-api.md`; no changes to existing provider files should be needed

**Checkpoint**: All three user stories are independently functional. A third provider can be added in under 30 minutes following the established pattern (SC-005).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm zero regression, add inline documentation, and satisfy success criteria SC-003 and SC-005.

- [ ] T014 Run `npm test` from the repository root and confirm: all tests in `tests/weather.test.js` pass without modification (SC-003 zero regression); all new tests in `tests/providers/primaryProvider.test.js`, `tests/providers/mockProvider.test.js`, and `tests/providers/providerRegistry.test.js` pass; total passing test count is reported
- [ ] T015 [P] Add JSDoc block comments to `frontend/providers/mockProvider.js` documenting: the `aliasMap` keys and their canonical targets; the `mockData` structure and which fields are spec-required vs placeholder; a `@example` showing how to add a fourth supported city for future developers (SC-005 — 30-minute onboarding target)
- [ ] T016 [P] Add JSDoc block comment to `frontend/providers/primaryProvider.js` documenting: the provider `id`, the source of the wrapped data, and the reason the `weatherData` array is inlined rather than imported from `weather.js` (circular-dependency avoidance)

---

## Dependency Graph

```text
T001 (orientation)
  └─► T002 [P] primaryProvider.js ──────────────────────────┐
  └─► T004 [P] primaryProvider.test.js (write in parallel)   │
                                                              │
  └─► T007 [P] [US1] mockProvider.js ──────────────────────┐ │
  └─► T005 [P] [US1] mockProvider.test.js (write in parallel)│ │
                                                             │ │
                                              T003 providerRegistry.js ◄─(needs T002 + T007)
                                              T006 [US1] providerRegistry.test.js
                                              T008 [US1] weather.js update
                                              T009 [US1] weather.html update
                                                             │
                                              T010 [P] [US2] mockProvider.test.js additions
                                              T011 [US2] mockProvider.js verification
                                                             │
                                              T012 [P] [US3] providerRegistry.test.js additions
                                              T013 [US3] providerRegistry.js verification
                                                             │
                                              T014 full regression run
                                              T015 [P] mockProvider.js JSDoc
                                              T016 [P] primaryProvider.js JSDoc
```

**User Story Completion Order** (required by spec priorities):

```text
Phase 2 (Foundational: T002–T004) → Phase 3 (US1: T005–T009) → Phase 4 (US2: T010–T011) → Phase 5 (US3: T012–T013)
```

---

## Parallel Execution Examples

**Foundational Phase (write in parallel):**
```text
Thread A: T002 → frontend/providers/primaryProvider.js
Thread B: T004 → tests/providers/primaryProvider.test.js
```

**User Story 1 (write in parallel, integrate sequentially):**
```text
Thread A: T005 → tests/providers/mockProvider.test.js
Thread B: T006 → tests/providers/providerRegistry.test.js
Thread C: T007 → frontend/providers/mockProvider.js
— sync point: T002, T003, T007 all exist —
Thread D: T008 → frontend/weather.js (sequential: needs T003)
Thread E: T009 → frontend/weather.html (sequential: needs T002, T003, T007)
```

**User Story 2 (parallel test → sequential verify):**
```text
Thread A: T010 → add test cases to tests/providers/mockProvider.test.js
— then: T011 → verify/patch frontend/providers/mockProvider.js —
```

**User Story 3 (parallel test → sequential verify):**
```text
Thread A: T012 → add test cases to tests/providers/providerRegistry.test.js
— then: T013 → verify frontend/providerRegistry.js —
```

**Polish Phase (parallel):**
```text
Thread A: T015 → mockProvider.js JSDoc
Thread B: T016 → primaryProvider.js JSDoc
```

---

## Implementation Strategy

### MVP Scope (Phase 3 alone — US1)

Completing Phases 1–3 (T001–T009) delivers the entire P1 user story: a developer can select either provider at request time and receive correct weather data. This is the MVP.

### Incremental Delivery

| After Phase | Deliverable | Success Criteria Met |
|---|---|---|
| Phase 2 | `primaryProvider` + registry skeleton tested | SC-003 foundation |
| Phase 3 | Full provider switching — both providers selectable | SC-001, SC-002, SC-003 |
| Phase 4 | Graceful null handling for unsupported cities | SC-004 |
| Phase 5 | Extensibility verified — third provider in < 30 min | SC-005 |
| Phase 6 | Full regression green; inline docs complete | All SCs |

### Key Implementation Notes

- **No build step**: All files are plain ES5-compatible JS loaded via `<script>` tags. Load order in `weather.html` is the dependency graph.
- **Dual export pattern**: Every new module exports via `module.exports` (for Jest) AND attaches to `window.*` (for browser). See `weather.js` for the existing pattern to follow.
- **Alias map is exhaustive**: `mockProvider.js` must handle `la`, `los angeles`, `washington`, `washington d.c.`, `washington dc`, `nyc`, `new york city`, `new york` (all lowercase after `trim().toLowerCase()`).
- **Null — not undefined — not throw**: `getByCity()` for unsupported cities returns the literal value `null`. `getProvider()` for unknown ids throws. This distinction is enforced by tests.
- **Never modify `tests/weather.test.js`**: SC-003 — any edit to the existing test file is a defect.

---

## Summary

| Metric | Value |
|---|---|
| **Total tasks** | 16 |
| **Phase 1 — Setup** | 1 (T001) |
| **Phase 2 — Foundational** | 3 (T002–T004) |
| **Phase 3 — US1 (P1 MVP)** | 5 (T005–T009) |
| **Phase 4 — US2 (P2)** | 2 (T010–T011) |
| **Phase 5 — US3 (P3)** | 2 (T012–T013) |
| **Phase 6 — Polish** | 3 (T014–T016) |
| **Parallelisable tasks** | 10 (marked [P]) |
| **Test tasks** | 5 (T004, T005, T006, T010, T012) |
| **New source files** | 3 (`primaryProvider.js`, `mockProvider.js`, `providerRegistry.js`) |
| **Modified source files** | 2 (`weather.js`, `weather.html`) |
| **New test files** | 3 (`primaryProvider.test.js`, `mockProvider.test.js`, `providerRegistry.test.js`) |
| **MVP scope** | Phases 1–3 (T001–T009) — delivers US1 in full |
