---
description: "Task list for Add Black/White CSS Themes (SDLCSPAC-4)"
---

# Tasks: Add Black/White CSS Themes

**Feature**: SDLCSPAC-4 — Add Black/White CSS Themes  
**Input**: Design documents from `specs/copilot/add-black-white-css-themes/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/theme-module.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1 = Apply Theme, US2 = Persist Theme)
- Exact file paths included in every description

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the existing codebase is healthy before any changes are made. Establishes the test baseline that must remain green throughout implementation.

- [ ] T001 Run `npm test` and confirm all tests in tests/weather.test.js pass with zero failures (baseline established)

---

## Phase 2: Foundational (CSS Variable Infrastructure)

**Purpose**: Introduce CSS custom properties on `:root` with `[data-theme]` attribute selectors. This is a **blocking prerequisite** — both user stories require the variable layer before any theme switching can work. Existing visual appearance must be unchanged after this phase (white theme variables match current hardcoded values).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add white-theme default `:root` and `:root[data-theme="white"]` CSS variable block at the top of frontend/weather.css (all 14 `--color-*` variables per data-model.md)
- [ ] T003 [P] Add black-theme `:root[data-theme="black"]` CSS variable block immediately after the white-theme block in frontend/weather.css
- [ ] T004 [P] Add `.visually-hidden` utility class at the end of the variable declarations section in frontend/weather.css
- [ ] T005 Replace all hardcoded colour values throughout frontend/weather.css with their corresponding `var(--color-*)` references (body, header, .controls, table, select, footer, :focus-visible)

**Checkpoint**: Open weather.html in a browser with DevTools open — the page must look identical to before. Running `npm test` must still pass all weather tests.

---

## Phase 3: User Story 1 — Apply Theme via Radio Button (Priority: P1) 🎯 MVP

**Goal**: A user sees a radio button control in the header offering "Black" and "White" options. Selecting a theme immediately updates the entire page's visual appearance — no page reload required. The active theme persists for the current session (localStorage write is part of `applyTheme` but persistent load is US2).

**Independent Test**: Open weather.html in a browser (clear localStorage first). Locate the theme radio button in the header. Click "Black" — the entire page must instantly switch to dark backgrounds and light text. Click "White" — the page must instantly revert to light backgrounds and dark text. No page reload, no errors in DevTools console.

### Tests for User Story 1 ⚠️ Write FIRST — ensure they FAIL before implementing theme.js

- [ ] T006 [P] [US1] Create tests/theme.test.js with `sanitiseTheme` test cases: valid values (`"white"`, `"black"`) pass through; invalid values (`"dark"`, `""`, `null`, `undefined`, `42`, `"WHITE"`) return `"white"`
- [ ] T007 [P] [US1] Add `applyTheme` test cases to tests/theme.test.js: verify `document.documentElement.dataset.theme` is set to the sanitised theme; verify `localStorage.setItem('theme-preference', ...)` is called with the correct value; verify invalid input applies `"white"`
- [ ] T008 [P] [US1] Add `toggleTheme` test cases to tests/theme.test.js: verify it delegates to `applyTheme` after validation; verify invalid input results in `"white"` being applied; verify same-theme re-selection is idempotent with no errors

### Implementation for User Story 1

- [ ] T009 [US1] Create frontend/theme.js with `VALID_THEMES` constant (`["black", "white"]`) and implement `sanitiseTheme(value)` pure function (returns input if in allowlist, otherwise `"white"`)
- [ ] T010 [US1] Implement `applyTheme(theme)` in frontend/theme.js: call `sanitiseTheme(theme)`, set `document.documentElement.setAttribute('data-theme', validatedTheme)`, and call `localStorage.setItem('theme-preference', validatedTheme)`
- [ ] T011 [US1] Implement `toggleTheme(theme)` in frontend/theme.js: validate via `sanitiseTheme` then delegate to `applyTheme` (named entry point for radio `change` event handler)
- [ ] T012 [US1] Add dual-export pattern to frontend/theme.js: `window.ThemeManager = { sanitiseTheme, applyTheme, toggleTheme }` guarded by `typeof window !== 'undefined'`; `module.exports = { sanitiseTheme, applyTheme, toggleTheme }` guarded by `typeof module !== 'undefined' && module.exports` (mirrors weather.js lines 70–75 exactly)
- [ ] T013 [US1] Add `<script src="theme.js"></script>` tag to frontend/weather.html immediately before the existing `<script src="weather.js">` tag
- [ ] T014 [US1] Add `<fieldset class="theme-toggle" role="group">` radio button control (with `.visually-hidden` legend "Choose colour theme" and two labelled radio inputs for `value="white"` and `value="black"`) inside the `<header>` element in frontend/weather.html after the existing `<p class="subtitle">` element
- [ ] T015 [US1] Add radio button `change` event listener IIFE to the existing inline `<script>` block at the bottom of `<body>` in frontend/weather.html: attach `window.ThemeManager.toggleTheme(this.value)` on `change` for all `input[name="theme"]` elements
- [ ] T016 [US1] Add `.theme-toggle` fieldset, `.theme-toggle__label`, and `.theme-toggle__radio` CSS rules to frontend/weather.css (layout: inline flex row in the header; colours via `var(--color-header-fg)` and `var(--color-header-bg)` so the control is legible in both themes)

**Checkpoint**: Run `npm test` — all tests in tests/theme.test.js and tests/weather.test.js must pass. Open weather.html in a browser: clicking "Black" / "White" radio buttons must switch the full page appearance instantly.

---

## Phase 4: User Story 2 — Persist Theme Across Sessions (Priority: P2)

**Goal**: The user's chosen theme is remembered across page reloads and browser restarts. On page load, the stored preference is read from localStorage and applied — including before first paint (no FOUC). The correct radio button is pre-selected on load to match the persisted theme. First-visit default is white.

**Independent Test**: Select "Black" theme, then hard-refresh the page (Ctrl+Shift+R). The dark theme must be active immediately on page load with no flash of white. The "Black" radio button must appear selected without any user interaction. Then corrupt the value in DevTools (`localStorage.setItem('theme-preference', 'invalid')`) and refresh — white theme must load silently with no console errors.

### Tests for User Story 2 ⚠️ Write FIRST — ensure they FAIL before implementing getStoredTheme

- [ ] T017 [P] [US2] Add `getStoredTheme` test cases to tests/theme.test.js: returns `"white"` when localStorage key is absent (first visit); returns `"black"` when stored value is `"black"`; returns `"white"` when stored value is corrupted (e.g. `"dark"`, `"42"`, `""`); use `beforeEach(() => localStorage.clear())` to reset state between tests

### Implementation for User Story 2

- [ ] T018 [US2] Implement `getStoredTheme()` in frontend/theme.js: read `localStorage.getItem('theme-preference')`, pass through `sanitiseTheme`, and return the result; add to the `window.ThemeManager` browser global and `module.exports` CommonJS export
- [ ] T019 [US2] Add FOUC prevention inline `<script>` block as the **first child element of `<head>`** in frontend/weather.html (before the `<link>` stylesheet tag): IIFE reads `localStorage.getItem('theme-preference')`, validates against `"black"` / `"white"` allowlist, sets `document.documentElement.setAttribute('data-theme', theme)` — must not call any external function or write to localStorage
- [ ] T020 [US2] Update the radio button initialization IIFE in the inline `<script>` at the bottom of `<body>` in frontend/weather.html: call `window.ThemeManager.getStoredTheme()` and set `radio.checked = (radio.value === stored)` for each `input[name="theme"]` before attaching the `change` event listener

**Checkpoint**: Run `npm test` — all tests must pass including `getStoredTheme` cases. Verify in browser: theme survives page reload; "Black" radio is pre-selected after reload; corrupted localStorage value silently falls back to white.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Lint compliance, full test suite validation, accessibility confirmation, and quickstart manual verification.

- [ ] T021 [P] Run `npm run lint` on frontend/theme.js and resolve any ESLint errors (must follow the same style as frontend/weather.js — `var` declarations, no arrow functions in event handlers, no trailing commas in older syntax)
- [ ] T022 Run the full test suite with `npm test` and confirm both tests/weather.test.js (existing) and tests/theme.test.js (new) pass with zero failures or skipped tests
- [ ] T023 [P] Complete the manual verification checklist from quickstart.md in a browser: first-visit white default, Black/White switching, refresh persistence, keyboard-only navigation (Tab + Arrow keys), DevTools localStorage confirmation, corrupted value graceful fallback
- [ ] T024 [P] Verify WCAG AA accessibility in browser: confirm `.visually-hidden` legend is announced by screen reader; confirm focus ring is visible in both themes (uses `--color-focus-ring`); confirm `--color-muted` is applied only to text rendered at ≥ 18px (secondary/caption text only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 completion — CSS variables must exist before theme switching works
- **Phase 4 (US2)**: Depends on Phase 3 completion — `getStoredTheme` and radio pre-selection build on US1's `applyTheme` and radio structure
- **Phase 5 (Polish)**: Depends on Phase 3 and Phase 4 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 (Foundational). No dependency on US2.
- **User Story 2 (P2)**: Depends on US1 completion — FOUC script and initialization logic require the radio button structure (T014) and `applyTheme` function (T010) to already exist.

### Within Each User Story

1. Tests MUST be written first and confirmed to FAIL before implementing theme.js functions
2. `sanitiseTheme` before `applyTheme` before `toggleTheme` (dependency chain)
3. `getStoredTheme` (US2) after `sanitiseTheme` exists (it calls it internally)
4. HTML changes after theme.js is implemented and tested
5. CSS component styling (T016) after HTML structure (T014) exists

### Parallel Opportunities

- **T002, T003, T004** can run in parallel (all within frontend/weather.css, non-overlapping sections) — but T005 depends on T002–T004 being done
- **T006, T007, T008** (test writing) can run in parallel — different test blocks, same file, non-conflicting
- **T021, T022, T023, T024** (polish tasks) can run in parallel (different files / concerns)

---

## Parallel Example: User Story 1 Tests

```bash
# All three test groups for US1 can be drafted simultaneously (different describe blocks):
Task T006: "sanitiseTheme test cases in tests/theme.test.js"
Task T007: "applyTheme test cases in tests/theme.test.js"
Task T008: "toggleTheme test cases in tests/theme.test.js"

# CSS variables for both themes can be written in parallel:
Task T002: "White theme :root block in frontend/weather.css"
Task T003: "Black theme :root[data-theme='black'] block in frontend/weather.css"
Task T004: ".visually-hidden utility class in frontend/weather.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: CSS variables (critical foundation)
3. Complete Phase 3: User Story 1 (radio button + theme switching)
4. **STOP and VALIDATE**: Run `npm test`; manually verify switching in browser
5. Demo: Black/White toggle is immediately functional and visually correct

### Incremental Delivery

1. **Setup + Foundational** → CSS variable layer ready (no visible change to users)
2. **User Story 1** → Radio button in header; instant theme switching; `localStorage` writes already happen via `applyTheme` (MVP — fully demonstrable)
3. **User Story 2** → Theme survives reload; FOUC eliminated; radio pre-selected on load (full feature)
4. **Polish** → ESLint clean; all tests green; accessibility confirmed

---

## Notes

- **Dual-export pattern**: `frontend/theme.js` must follow `frontend/weather.js` exactly: `window.ThemeManager` for browser, `module.exports` for Jest. Both exports guarded with `typeof` checks.
- **FOUC script constraint**: The inline `<head>` script (T019) must NOT reference `theme.js` or `window.ThemeManager` — the module is not yet loaded at that parse point. It must be a self-contained IIFE.
- **localStorage write on first visit**: `applyTheme` writes to localStorage; the FOUC script does NOT write on first visit. This preserves the distinction between "user chose white" and "never visited" (FR-007).
- **`--color-muted` constraint**: Must only be applied to secondary/caption text at ≥ 18px — it achieves 3.95:1 contrast on the black theme, which is above the 3:1 large-text threshold but below the 4.5:1 normal-text threshold.
- **[P] tasks** = different files or non-overlapping sections; safe to implement concurrently
- **[Story] label** maps each task to its user story for traceability (US1 / US2)
- Commit after each logical group; run `npm test` before every commit
