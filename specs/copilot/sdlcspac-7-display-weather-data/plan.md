# Implementation Plan: Multi-Provider Weather Data Display

**Branch**: `copilot/sdlcspac-7-display-weather-data` | **Date**: 2025-07-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-multi-provider-display/spec.md`

## Summary

The main weather screen (`weather.html`) currently renders data from a single static array in `weather.js`, ignoring the already-registered `primary` and `mock` providers in `WeatherProviderRegistry`. This feature:

1. Extends `WeatherProviderRegistry` with `listProviders()` to expose all registered provider IDs.
2. Updates `weather.js` to aggregate data from all providers (stamping each record with `providerName`), provide a `filterByProvider()` function, and update `getFilteredData()` to chain condition + provider filters.
3. Updates `weather.html` to add a **Provider** attribution column and a multi-select checkbox provider filter (with "All Providers" toggle), show a non-blocking warning banner for failed providers, and render from the aggregated dataset on every page load.
4. Adds corresponding Jest tests for all new functions and DOM behaviour.

## Technical Context

**Language/Version**: JavaScript (ES5/ES6 mixed, no transpilation) — Node 20 (Jest) / evergreen browser
**Primary Dependencies**: Jest 29 (test runner), jest-environment-jsdom 29 (DOM emulation) — no production runtime dependencies
**Storage**: N/A — all data is in-memory; no persistence layer
**Testing**: Jest 29 (`npm test`) — tests live in `tests/` and match `**/*.test.js`
**Target Platform**: Static HTML page served from a web server / file system; client-side JS only
**Project Type**: Frontend web application (static)
**Performance Goals**: No hard latency targets — match existing application performance expectations (synchronous in-memory operations only)
**Constraints**: No build step; plain ES5-compatible script tags; no bundler. IE not supported (evergreen browsers only per existing code).
**Scale/Scope**: 2 built-in providers (primary: 10 records, mock: 3 records = 13 combined rows); designed to scale linearly with additional providers via `WeatherProviderRegistry.register()`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **1. Quality** — small, focused, single purpose | ✅ PASS | Feature is narrowly scoped: extend registry API, update data layer, update UI. No unrelated concerns mixed in. Existing Strategy pattern preserved. |
| **2. Testing** — tests added for observable behaviour changes | ✅ PASS | New functions (`listProviders`, `getAllFromAllProviders`, `filterByProvider`) and DOM rendering changes MUST have Jest test coverage. Existing tests MUST NOT be weakened. |
| **3. Security & Configuration** — no secrets committed, inputs validated | ✅ PASS | No secrets involved. Provider IDs come from the registry (trusted internal source); condition filter value comes from a static `<select>` — no free-text user input that reaches unsafe sinks. |
| **4. Delivery** — codebase remains buildable and typecheck-clean | ✅ PASS | No build step exists; `npm test` (Jest) must remain green after every logical change. Non-obvious decisions must be documented inline. |

**Post-design re-check**: ✅ All four principles pass. Design is additive (no existing APIs removed), backward-compatible (existing tests unaffected), and documented in research.md / data-model.md / contracts/.

## Project Structure

### Documentation (this feature)

```text
specs/copilot/sdlcspac-7-display-weather-data/
├── plan.md              # This file
├── spec.md              # Copied from specs/002-multi-provider-display/spec.md
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── provider-filter-ui.md   # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks — NOT this command)
```

### Source Code (repository root)

```text
frontend/
├── providerRegistry.js       # MODIFY: add listProviders() method
├── weather.js                # MODIFY: add getAllFromAllProviders(), filterByProvider(),
│                             #   update getFilteredData() signature & exports
├── weather.html              # MODIFY: add Provider column, checkbox filter fieldset,
│                             #   warning banner, update inline script
├── providers/
│   ├── primaryProvider.js    # NO CHANGE
│   └── mockProvider.js       # NO CHANGE
└── theme.js                  # NO CHANGE

tests/
├── weather.test.js           # MODIFY: add tests for new weather.js functions
│                             #   (getAllFromAllProviders, filterByProvider, updated getFilteredData)
├── weather.html.test.js      # NEW: DOM integration tests (provider column, checkbox filter,
│                             #   warning banner, combined filters)
└── providers/
    ├── providerRegistry.test.js  # MODIFY: add tests for listProviders()
    ├── primaryProvider.test.js   # NO CHANGE
    └── mockProvider.test.js      # NO CHANGE
```

**Structure Decision**: Single-project web application (frontend only, no backend). All source files live under `frontend/`; all tests under `tests/`. The existing flat layout is preserved; no new directories are required in the source tree. A new test file `tests/weather.html.test.js` is added for DOM-level integration tests via jsdom.
