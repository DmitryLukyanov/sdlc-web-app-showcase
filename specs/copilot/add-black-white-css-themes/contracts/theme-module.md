# Theme Module Contract: theme.js

**Phase**: 1 — Design / Contracts  
**Branch**: `copilot/add-black-white-css-themes`  
**Date**: 2026-04-10

---

## Overview

`frontend/theme.js` is a vanilla JavaScript module that manages the Black/White theme toggle for the application. It exposes a public API consumed by:

1. **`weather.html`** — via the `window.ThemeManager` browser global (inline event handlers and the radio button `change` listener)
2. **`tests/theme.test.js`** — via CommonJS `require('../frontend/theme.js')` in the Jest test environment

The module follows the **dual-export pattern** established by `weather.js` (see `frontend/weather.js` lines 70–75).

---

## Module Exports

### `sanitiseTheme(value)`

```
Signature : (value: any) → string
Pure       : yes (no side effects)
```

**Description**: Validates `value` against the theme allowlist. Returns the input unchanged if valid; returns the default theme otherwise. This is the boundary validation function for all external theme inputs (localStorage reads, event handler values).

**Allowlist**: `["black", "white"]`  
**Default return**: `"white"`

| Input | Return |
|-------|--------|
| `"white"` | `"white"` |
| `"black"` | `"black"` |
| `"dark"` | `"white"` |
| `""` | `"white"` |
| `null` | `"white"` |
| `undefined` | `"white"` |
| `42` | `"white"` |
| `"WHITE"` | `"white"` (case-sensitive; uppercase invalid) |

---

### `getStoredTheme()`

```
Signature  : () → string
Side effect: reads localStorage.getItem('theme-preference')
```

**Description**: Reads the persisted theme preference from localStorage. Passes the raw value through `sanitiseTheme` before returning. Never throws; always returns a valid theme string.

| Condition | Return |
|-----------|--------|
| `localStorage` contains `"black"` | `"black"` |
| `localStorage` contains `"white"` | `"white"` |
| `localStorage` key absent (first visit) | `"white"` |
| `localStorage` contains corrupted value | `"white"` |

**localStorage key**: `theme-preference`

---

### `applyTheme(theme)`

```
Signature  : (theme: string) → void
Side effects:
  1. document.documentElement.setAttribute('data-theme', sanitiseTheme(theme))
  2. localStorage.setItem('theme-preference', sanitiseTheme(theme))
```

**Description**: The authoritative function for changing the active theme. Validates `theme` before applying. Sets the `data-theme` attribute on `<html>` (which activates the CSS variable set) and persists the validated value to localStorage.

**Precondition**: `document` must be available (not safe to call from Node.js server context without a DOM).

**Idempotent**: Calling `applyTheme("white")` when `"white"` is already active produces no observable change (attribute is set to the same value; localStorage is overwritten with the same value).

---

### `toggleTheme(theme)`

```
Signature  : (theme: string) → void
Side effects: delegates to applyTheme(theme)
```

**Description**: Entry point called by the radio button `change` event handler. Validates `theme` via `sanitiseTheme` then delegates to `applyTheme`. Exists as a named, testable boundary between the UI event and the storage/DOM logic.

**Usage in weather.html**:
```js
document.querySelectorAll('input[name="theme"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    window.ThemeManager.toggleTheme(this.value);
  });
});
```

---

## Browser Global

```js
window.ThemeManager = {
  sanitiseTheme,
  getStoredTheme,
  applyTheme,
  toggleTheme
};
```

Exposed only when `typeof window !== 'undefined'` (guards against Jest/Node.js execution context).

---

## CommonJS Export

```js
module.exports = {
  sanitiseTheme,
  getStoredTheme,
  applyTheme,
  toggleTheme
};
```

Exposed only when `typeof module !== 'undefined' && module.exports` (guards against browser execution context where `module` is undefined).

---

## FOUC Inline Script (Not part of theme.js)

The inline script placed in `<head>` of `weather.html` replicates a minimal subset of the `applyTheme` logic synchronously, before `theme.js` is loaded. It is **not** a call to `ThemeManager.applyTheme` (the module is not yet available at that parse point).

```html
<script>
  /* Inline theme application — prevents FOUC. Must remain minimal. */
  (function () {
    var stored = localStorage.getItem('theme-preference');
    var theme = (stored === 'black' || stored === 'white') ? stored : 'white';
    document.documentElement.setAttribute('data-theme', theme);
  }());
</script>
```

**Constraints on this script**:
- Must run before `<link rel="stylesheet">` to guarantee the attribute is set before CSS is applied (place it as the first child of `<head>`).
- Must not call any external function or reference any variable outside its own IIFE.
- Must not write to localStorage (avoids storing a default on first visit, preserving the ability to distinguish "user chose white" from "never visited").

---

## Error Handling Contract

| Scenario | Behaviour |
|----------|-----------|
| `localStorage` unavailable (Safari private mode, security restriction) | `getStoredTheme` returns `"white"` gracefully; `applyTheme` may log a warning but must not throw |
| Invalid theme string passed to `applyTheme` | `sanitiseTheme` returns `"white"`; white theme is applied silently |
| `document.documentElement` not available | Caller's responsibility (FOUC script and main JS both run in browser context only) |

---

## Versioning

This module contract is **v1.0**. Any changes to the public API surface (function signatures, exported names, localStorage key, allowlist values) constitute a breaking change and require a new plan amendment.
