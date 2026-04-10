# Developer Quickstart: Add Black/White CSS Themes

**Branch**: `copilot/add-black-white-css-themes`  
**Date**: 2026-04-10

---

## Prerequisites

- Node.js ≥ 18 (for running Jest)
- A modern browser (Chrome, Firefox, Edge, Safari) for manual verification
- `npm install` already run in the repository root

---

## Run Existing Tests

```bash
npm test
```

All existing tests in `tests/weather.test.js` must remain green before and after implementing this feature.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `frontend/theme.js` | **Create** — theme management module |
| `tests/theme.test.js` | **Create** — Jest unit tests for theme.js |
| `frontend/weather.html` | **Modify** — add FOUC inline script; add radio button to `<header>` |
| `frontend/weather.css` | **Modify** — add CSS variable declarations and theme selectors |

---

## Implementation Order

Follow this order to keep the build green after every logical commit:

### Step 1 — CSS Variables (weather.css)

Add `:root` variable declarations at the **top** of `weather.css`, before any other rules. Existing hardcoded colour values are replaced with `var(--color-*)` references.

**White theme** defaults (matches current visual):
```css
:root,
:root[data-theme="white"] {
  --color-bg:             #ffffff;
  --color-fg:             #000000;
  --color-surface:        #f5f5f5;
  --color-surface-border: #e0e0e0;
  --color-header-bg:      #000000;
  --color-header-fg:      #ffffff;
  --color-input-bg:       #ffffff;
  --color-input-fg:       #000000;
  --color-input-border:   #cccccc;
  --color-table-head-bg:  #e8e8e8;
  --color-table-head-fg:  #000000;
  --color-table-row-hover:#f0f0f0;
  --color-muted:          #555555;
  --color-focus-ring:     #000000;
}

:root[data-theme="black"] {
  --color-bg:             #000000;
  --color-fg:             #ffffff;
  --color-surface:        #111111;
  --color-surface-border: #333333;
  --color-header-bg:      #ffffff;
  --color-header-fg:      #000000;
  --color-input-bg:       #1a1a1a;
  --color-input-fg:       #ffffff;
  --color-input-border:   #555555;
  --color-table-head-bg:  #1a1a1a;
  --color-table-head-fg:  #ffffff;
  --color-table-row-hover:#222222;
  --color-muted:          #aaaaaa;
  --color-focus-ring:     #ffffff;
}
```

Then replace hardcoded colour values throughout `weather.css` with `var(--color-*)` references.

**Visually hidden utility** (needed for the `<legend>` in the radio group):
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Step 2 — theme.js Module

Create `frontend/theme.js` following the `weather.js` dual-export pattern. The module must export:
- `sanitiseTheme(value)` — validates against `["black", "white"]` allowlist
- `getStoredTheme()` — reads and sanitises localStorage
- `applyTheme(theme)` — sets `data-theme` attribute + writes localStorage
- `toggleTheme(theme)` — entry point for radio `change` events

See `contracts/theme-module.md` for full function specifications.

### Step 3 — Tests (tests/theme.test.js)

Create `tests/theme.test.js`. Use `beforeEach(() => localStorage.clear())` to reset state.

Key test scenarios:
- `sanitiseTheme`: valid values pass through; invalid/null/undefined return `"white"`
- `getStoredTheme`: returns `"white"` on first visit; returns stored valid value; returns `"white"` on corrupt value
- `applyTheme`: sets `document.documentElement.dataset.theme`; calls `localStorage.setItem`
- `toggleTheme`: validates input then applies; invalid input applies `"white"`

Run after creating the file:
```bash
npm test
```

All tests must pass before proceeding.

### Step 4 — HTML Changes (weather.html)

**4a. FOUC inline script** — Insert as the **first element inside `<head>`**, before the `<link>` stylesheet tag:

```html
<script>
  /* Inline theme — prevents FOUC. See research.md §2 for rationale. */
  (function () {
    var stored = localStorage.getItem('theme-preference');
    var theme = (stored === 'black' || stored === 'white') ? stored : 'white';
    document.documentElement.setAttribute('data-theme', theme);
  }());
</script>
```

**4b. Radio button control** — Add inside the existing `<header>` element, after the existing `<p class="subtitle">`:

```html
<fieldset class="theme-toggle" role="group">
  <legend class="visually-hidden">Choose colour theme</legend>
  <label class="theme-toggle__label">
    <input class="theme-toggle__radio" type="radio" name="theme" value="white" />
    White
  </label>
  <label class="theme-toggle__label">
    <input class="theme-toggle__radio" type="radio" name="theme" value="black" />
    Black
  </label>
</fieldset>
```

**4c. Script tag for theme.js** — Add before the existing `<script src="weather.js">`:

```html
<script src="theme.js"></script>
```

**4d. Initialisation script** — Inside the existing inline `<script>` block at the bottom of `<body>`, after the weather initialisation IIFE, add:

```js
// Initialise theme toggle radio buttons
(function () {
  var stored = window.ThemeManager.getStoredTheme();
  document.querySelectorAll('input[name="theme"]').forEach(function (radio) {
    radio.checked = (radio.value === stored);
    radio.addEventListener('change', function () {
      window.ThemeManager.toggleTheme(this.value);
    });
  });
}());
```

---

## Manual Verification Checklist

After implementing all steps, verify in a browser:

- [ ] Page loads with **white** theme on first visit (clear localStorage first: DevTools → Application → Clear Storage)
- [ ] Selecting "Black" radio immediately switches to dark theme (all backgrounds, text, table)
- [ ] Selecting "White" radio immediately switches back to light theme
- [ ] Refresh page → previously selected theme is restored automatically
- [ ] Open DevTools → Application → Local Storage: confirm `theme-preference` key is set after selection
- [ ] Tab to the radio group using keyboard only, then use arrow keys to switch theme — both options must be reachable without mouse
- [ ] Corrupt the localStorage value (`localStorage.setItem('theme-preference', 'invalid')`) then refresh — white theme loads, no error shown

---

## Accessibility Verification

```bash
# No automated a11y tool is configured; verify manually using browser DevTools Accessibility panel
# or an extension such as axe DevTools / WAVE
```

Manual checks:
- Header radio group is announced as "Choose colour theme, group" by screen reader
- Each option reads as "White, radio button, 1 of 2" / "Black, radio button, 2 of 2"
- Focus ring is visible in both themes (uses `--color-focus-ring` variable)

---

## Lint Check

```bash
npm run lint
```

`theme.js` must pass ESLint with zero errors (same rules as `weather.js`).

---

## Full Test Run

```bash
npm test
```

Expected output: all tests in `tests/weather.test.js` and `tests/theme.test.js` passing. No skipped or pending tests.
