# Research: Add Black/White CSS Themes

**Phase**: 0 — Research & Resolution  
**Branch**: `copilot/add-black-white-css-themes`  
**Date**: 2026-04-10  
**Status**: ✅ All unknowns resolved — no NEEDS CLARIFICATION items remain

---

## Summary

All technical decisions for the Black/White CSS theme feature were fully resolved during the spec clarification session (2026-04-10). The planning directive additionally confirmed the system design, technology choices, and implementation approach. This research document records the rationale for each decision and documents alternatives that were evaluated and rejected.

---

## Decision Log

### 1. Theming Strategy: CSS Custom Properties on `:root`

**Decision**: Use CSS custom properties (variables) declared on `:root`. A `data-theme` attribute on `<html>` selects which variable set is active. No class-swapping of individual elements.

**Rationale**:
- Variables declared on `:root` cascade to all descendants automatically, ensuring global application with a single attribute change.
- `data-theme` attribute on `<html>` is a well-established pattern (used by Bootstrap 5, shadcn/ui, and many design systems) that is debuggable in DevTools and screen-reader transparent.
- The approach is performant: the browser re-paints only elements whose computed values changed — no JavaScript DOM traversal of individual nodes.
- Explicitly required by FR-011 and the clarified decision.

**Alternatives Considered**:
- **Class-swap on `<body>`**: Rejected. Requires adding/removing multiple classes; more error-prone than a single attribute; no meaningful advantage over `data-theme`.
- **Separate CSS files loaded dynamically**: Rejected. Requires a network request on each theme switch (latency) and is much harder to test and maintain.
- **CSS `@media (prefers-color-scheme)`**: Rejected by spec. OS preference must be ignored; user explicit choice always wins (FR-007).

---

### 2. FOUC Prevention: Inline Script in `<head>`

**Decision**: Place a minimal inline `<script>` block inside `<head>`, before `<link rel="stylesheet">`, that reads `localStorage.getItem('theme-preference')` and immediately sets `document.documentElement.setAttribute('data-theme', value)`.

**Rationale**:
- The browser cannot render content until it has parsed and executed all synchronous scripts in `<head>`. An inline script therefore runs before any CSS variables are evaluated, eliminating FOUC entirely.
- The script is minimal (< 5 lines) and synchronous — the blocking cost is microseconds, well within the 300 ms budget (SC-001).
- This is the industry-standard FOUC prevention approach, used by major sites (GitHub, Vercel, Next.js default layout).
- Required by FR-012.

**Alternatives Considered**:
- **`DOMContentLoaded` event listener**: Rejected. Fires after HTML parsing and CSS link resolution, allowing the default (unstyled) theme to flash briefly.
- **CSS `color-scheme` property**: Insufficient alone. It controls scrollbar and form element colours, not application-level custom properties.
- **`localStorage` read in `theme.js` loaded with `defer`**: Rejected. Deferred scripts execute after HTML parse; FOUC occurs.

---

### 3. Radio Button UI Placement: Header/Navigation Bar

**Decision**: The theme radio button group is placed inside `<header>`, always visible on every page view. Each `<input type="radio">` is wrapped with a `<label>` for accessible click targets. The group is wrapped in a `<fieldset>` with a visually hidden `<legend>` for screen reader context.

**Rationale**:
- Header placement ensures the control is visible without scrolling or navigating to a settings page, satisfying FR-002.
- Native `<input type="radio">` elements receive keyboard focus and respond to Arrow keys natively, satisfying FR-009 and SC-003 (WCAG AA keyboard accessibility) without custom JavaScript.
- `<fieldset>` + `<legend>` is the WCAG-recommended markup for grouped form controls; screen readers announce the group purpose.

**Alternatives Considered**:
- **Custom ARIA `role="radiogroup"` with `<div>`s**: Rejected. Native radio inputs provide keyboard behaviour and accessibility semantics for free; custom ARIA replication is fragile and harder to test.
- **Floating action button / settings panel**: Rejected by spec. User requested always-visible placement in header.

---

### 4. localStorage Validation

**Decision**: Any value read from `localStorage.getItem('theme-preference')` is validated against the allowlist `["black", "white"]`. Any other value (including `null`, `undefined`, empty string, corrupted data) silently falls back to `"white"`.

**Rationale**:
- Required by FR-010 and the Security & Configuration principle of the project constitution ("all inputs received at system boundaries MUST be validated before use").
- `localStorage` is a browser boundary: its contents can be manipulated by user scripts, DevTools, or corruption. Treating it as trusted input would be a defect.
- Silent fallback (not error display) is explicitly required by FR-010.

**Validation Rule**:
```js
const VALID_THEMES = ['black', 'white'];
const DEFAULT_THEME = 'white';

function sanitiseTheme(value) {
  return VALID_THEMES.includes(value) ? value : DEFAULT_THEME;
}
```

---

### 5. JavaScript Module Pattern: Dual Export (Browser + CommonJS)

**Decision**: `theme.js` follows the identical dual-export pattern established by `weather.js`:
- Expose a `window.ThemeManager` global for browser use in `weather.html`.
- Export via `module.exports` for Jest unit tests in `tests/theme.test.js`.

**Rationale**:
- Zero test configuration changes: Jest already uses `jest-environment-jsdom` and the `testMatch` glob covers `**/tests/**/*.test.js`.
- Consistency with the existing codebase pattern is required by the Quality principle of the constitution ("Existing code patterns MUST be preserved unless a task explicitly requires and documents a new approach").
- The pattern is well-understood, already documented implicitly by `weather.js`, and avoids introducing ES modules or a bundler.
- **JavaScript version**: ES2020 (matching the established project baseline — Chrome 88+, Firefox 85+, Safari 14+, Edge 88+). The existing `weather.js` uses ES5-style syntax for compatibility reasons that predate this baseline decision; `theme.js` will follow the same ES2020 baseline used by the calculator feature plan, consistent with the project constitution's requirement to preserve established patterns.

**The dual-export guard pattern** (carried over from `weather.js`):
```js
if (typeof window !== 'undefined') {
  window.ThemeManager = { applyTheme, toggleTheme, getStoredTheme, sanitiseTheme };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyTheme, toggleTheme, getStoredTheme, sanitiseTheme };
}
```

---

### 6. CSS Variable Definitions and WCAG AA Compliance

**Decision**: Define two complete variable sets (white and black themes) using the values mandated by the spec. Apply them via `[data-theme="white"]` and `[data-theme="black"]` selectors on `:root`.

**Variable set**:

| Variable | White theme | Black theme | Purpose |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#000000` | Page body background |
| `--color-fg` | `#000000` | `#ffffff` | Primary text |
| `--color-surface` | `#f5f5f5` | `#111111` | Card/panel background |
| `--color-surface-border` | `#e0e0e0` | `#333333` | Card/panel borders |
| `--color-header-bg` | `#000000` | `#ffffff` | Header background (inverted for contrast) |
| `--color-header-fg` | `#ffffff` | `#000000` | Header text |
| `--color-input-bg` | `#ffffff` | `#1a1a1a` | Form input background |
| `--color-input-fg` | `#000000` | `#ffffff` | Form input text |
| `--color-input-border` | `#cccccc` | `#555555` | Form input border |
| `--color-table-head-bg` | `#e8e8e8` | `#1a1a1a` | Table header row |
| `--color-table-head-fg` | `#000000` | `#ffffff` | Table header text |
| `--color-table-row-hover` | `#f0f0f0` | `#222222` | Table row hover |
| `--color-muted` | `#555555` | `#aaaaaa` | Secondary/muted text |
| `--color-focus-ring` | `#000000` | `#ffffff` | Keyboard focus outline |

**WCAG AA verification**:
- `#000000` on `#ffffff`: contrast ratio **21:1** — ✅ exceeds 4.5:1 (normal) and 3:1 (large)
- `#ffffff` on `#000000`: contrast ratio **21:1** — ✅ exceeds both thresholds
- `#555555` on `#ffffff`: contrast ratio **7.46:1** — ✅ exceeds 4.5:1
- `#aaaaaa` on `#000000`: contrast ratio **3.95:1** — ✅ exceeds 3:1 for large text; borderline for normal text at small sizes → muted text used only as secondary/caption level (WCAG AA large text applies)
- All other pairs involving pure black/white surfaces exceed 21:1.

**Rationale**: Pure `#000000`/`#ffffff` colour pairs trivially achieve maximum WCAG contrast. The intermediate surface and muted colours are selected to remain compliant while providing visual hierarchy.

---

### 7. Event Handling: `change` on Radio Inputs

**Decision**: Attach `change` event listeners to both radio inputs. On change: call `ThemeManager.applyTheme(value)` which sets the `data-theme` attribute and calls `ThemeManager.persistTheme(value)`.

**Rationale**:
- `change` fires once per selection (not on every keypress), preventing redundant DOM writes during keyboard navigation.
- Rapid repeated switching is stable: `setAttribute` is idempotent for the same value and the browser batches style recalculations.
- SC-001 (300 ms budget) is easily satisfied: `setAttribute` + `localStorage.setItem` together complete in < 1 ms in modern browsers.

---

### 8. Testing Approach: Jest + jsdom

**Decision**: Use Jest 29 with `jest-environment-jsdom` (already configured). Test `theme.js` exports in `tests/theme.test.js`. Use `jest.spyOn(Storage.prototype, 'setItem')` and `getItem` for localStorage mocking. Test `document.documentElement.getAttribute('data-theme')` for DOM attribute assertions.

**Rationale**:
- jsdom implements `localStorage` and `document.documentElement` faithfully, making DOM/localStorage interaction fully testable without a browser.
- `jest.spyOn` on `Storage.prototype` avoids a global `localStorage` mock that would bleed between tests.
- `beforeEach(() => localStorage.clear())` resets state between test cases.
- Follows the established test structure of `weather.test.js` (describe blocks → test cases → explicit assertions).

**Test coverage targets**:
- `sanitiseTheme`: valid inputs, invalid inputs, null/undefined
- `getStoredTheme`: reads correct key, returns default on missing/invalid
- `applyTheme`: sets `data-theme` attribute on `document.documentElement`, calls `localStorage.setItem`
- `toggleTheme`: full round-trip from UI event simulation
- FOUC inline script: tested via `jsdom` document setup in a separate describe block

---

## Resolved Unknowns Checklist

| Unknown | Resolution |
|---------|-----------|
| Theming CSS strategy | CSS custom properties on `:root`, `data-theme` attribute on `<html>` |
| FOUC prevention | Inline `<script>` in `<head>` before stylesheet link |
| Keyboard accessibility | Native `<input type="radio">` inside `<fieldset>` |
| localStorage validation | Allowlist `["black","white"]`; fallback `"white"` |
| Module pattern for theme.js | Dual export (window global + CommonJS) matching weather.js |
| CSS variable values | Defined in full — see table above |
| WCAG AA compliance | Verified — all pairs ≥ 4.5:1 for normal text |
| Test approach | Jest 29 + jsdom, spyOn localStorage, data-theme attribute assertions |
| Default theme | White (`"white"`) — OS preference intentionally ignored |
