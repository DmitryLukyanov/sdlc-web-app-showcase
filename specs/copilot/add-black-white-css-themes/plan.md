# Implementation Plan: Add Black/White CSS Themes

**Branch**: `copilot/add-black-white-css-themes` | **Date**: 2026-04-10 | **Spec**: [specs/001-css-theme-toggle/spec.md](../../001-css-theme-toggle/spec.md)  
**Input**: Feature specification from `/specs/001-css-theme-toggle/spec.md`

## Summary

Add a radio button control in the application header that allows users to switch between a **Black** (dark) and **White** (light) theme. The selected theme is applied globally via CSS custom properties (variables) on `:root`. The preference is persisted in `localStorage` under the key `theme-preference` with values `"black"` or `"white"`. An inline `<script>` in `<head>` reads the stored preference before first paint to eliminate flash-of-unstyled-content (FOUC). Default theme is white. Both themes achieve WCAG AA contrast compliance (21:1 ratio — far exceeds the 4.5:1 minimum).

---

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)  
**Primary Dependencies**: None — vanilla frontend; no build toolchain; Jest 29 + jest-environment-jsdom for testing  
**Storage**: `localStorage` key `theme-preference` → `"black"` | `"white"`; default `"white"` when absent or invalid  
**Testing**: Jest 29 with `jest-environment-jsdom` (existing test runner); new `tests/theme.test.js`  
**Target Platform**: Web browser (evergreen); no server-side component  
**Project Type**: Web application (single-page, vanilla JS)  
**Performance Goals**: Theme switch visible within **300 ms** of radio button selection; no FOUC on page load  
**Constraints**: WCAG AA — ≥ 4.5:1 contrast for normal text, ≥ 3:1 for large text; no external library additions  
**Scale/Scope**: Single HTML page (`weather.html`); theme applies to all current and future pages that link the shared CSS

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| **Quality** — Small, focused, reviewable change | Single, clearly stated purpose: add theme toggle | ✅ PASS | No unrelated concerns mixed in |
| **Quality** — Preserve existing code patterns | Existing JS module dual-export pattern (`window.*` + `module.exports`) must be preserved in `theme.js` | ✅ PASS | `theme.js` will follow the exact same dual-export pattern as `weather.js` |
| **Testing** — Tests added for observable behaviour changes | `tests/theme.test.js` covering all exported functions | ✅ PASS | Planned; must not be skipped |
| **Testing** — Existing tests must not be weakened | `tests/weather.test.js` must remain green and unmodified | ✅ PASS | `weather.js` is not touched |
| **Security** — No secrets committed | No secrets involved; only CSS variables and localStorage | ✅ PASS | N/A |
| **Security** — Inputs validated at boundaries | `localStorage.getItem('theme-preference')` output validated; invalid values fall back to `"white"` | ✅ PASS | Validation required in inline FOUC script and `theme.js` |
| **Delivery** — Build/typecheck clean after every commit | No build pipeline; linter (`eslint frontend/**/*.js`) must pass on `theme.js` | ✅ PASS | Follow existing JS style |
| **Delivery** — Non-obvious decisions documented | FOUC prevention strategy and `data-theme` attribute approach must be commented inline | ✅ PASS | Inline comments planned |

**Post-Design Re-check**: All gates remain PASS after Phase 1 design (see research.md for rationale on each decision).

---

## Project Structure

### Documentation (this feature)

```text
specs/copilot/add-black-white-css-themes/
├── plan.md              # This file
├── research.md          # Phase 0 — all decisions resolved
├── data-model.md        # Phase 1 — localStorage schema + CSS variable definitions
├── quickstart.md        # Phase 1 — developer guide
├── contracts/
│   └── theme-module.md  # Phase 1 — theme.js public API contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks — NOT by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── weather.html          # MODIFY — add inline FOUC script in <head>; add radio button in <header>
├── weather.css           # MODIFY — add :root CSS variable declarations + theme attribute selectors
├── weather.js            # NO CHANGE
└── theme.js              # NEW — theme management: apply, persist, read, validate

tests/
├── weather.test.js       # NO CHANGE
└── theme.test.js         # NEW — Jest unit tests for theme.js exports
```

**Structure Decision**: Single web application layout. `theme.js` is a new sibling module to `weather.js`, following the identical dual-export pattern (`window.ThemeManager` for browser, `module.exports` for Jest). This keeps the test setup identical to the existing `weather.test.js` approach with zero configuration changes.

---

## Complexity Tracking

> No constitution violations requiring justification. All changes are focused, testable, and within the established pattern.
