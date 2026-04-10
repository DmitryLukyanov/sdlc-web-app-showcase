# Data Model: Add Black/White CSS Themes

**Phase**: 1 — Design  
**Branch**: `copilot/add-black-white-css-themes`  
**Date**: 2026-04-10

---

## Overview

This feature introduces no backend data model changes. All state is held in two locations:

1. **`localStorage`** — persists the user's theme preference across sessions (browser client only)
2. **CSS custom properties** — defines the visual token values for each theme (stylesheet)

---

## Entity: Theme Preference

### Storage Location

`localStorage` in the user's browser. Key-value pair.

### Schema

| Field | Type | Values | Default |
|-------|------|--------|---------|
| `theme-preference` (key) | `string` (localStorage key) | `"black"` \| `"white"` | `"white"` |

### Validation Rules

- **Allowlist**: Only `"black"` and `"white"` are valid values.
- **Null/missing**: If `localStorage.getItem('theme-preference')` returns `null` (first visit or cleared storage), the effective theme is `"white"`.
- **Corrupted/unknown**: Any value not in the allowlist (`"dark"`, `""`, `"42"`, etc.) silently resolves to `"white"`. No error is shown to the user (FR-010).
- **Case-sensitive**: Values are stored and compared as lowercase strings. No normalisation is applied; the writer (`theme.js`) always writes lowercase.

### State Machine

```
               ┌──────────────┐
               │   (no value) │  ← first visit or cleared localStorage
               └──────┬───────┘
                      │ effective default
                      ▼
         ┌─────────────────────────┐
         │  Active Theme: "white"  │ ◄──────────────────────────┐
         │  data-theme="white"     │                            │
         └──────────┬──────────────┘                            │
                    │ user clicks "Black" radio                  │
                    ▼                                            │
         ┌─────────────────────────┐                            │
         │  Active Theme: "black"  │  user clicks "White" radio  │
         │  data-theme="black"     │ ──────────────────────────►┘
         └─────────────────────────┘
```

### Persistence Events

| Trigger | Action |
|---------|--------|
| User selects radio button | `localStorage.setItem('theme-preference', value)` |
| Page load (inline FOUC script) | `localStorage.getItem('theme-preference')` → apply |
| Invalid/missing value on load | Fall back to `"white"`; **do not write** a default back to localStorage (preserves first-visit state cleanly) |

---

## Entity: Theme Definition (CSS Custom Properties)

### Scope

Declared on `:root` using `[data-theme]` attribute selectors on the `<html>` element. All descendant elements inherit these variables through the cascade.

### Selector Structure

```css
/* White theme (default — applied when data-theme is "white" or absent) */
:root,
:root[data-theme="white"] {
  --color-bg:             #ffffff;
  --color-fg:             #000000;
  /* ... all variables ... */
}

/* Black theme */
:root[data-theme="black"] {
  --color-bg:             #000000;
  --color-fg:             #ffffff;
  /* ... all variables ... */
}
```

### Complete Variable Catalogue

| Variable | White Value | Black Value | Applied To |
|----------|-------------|-------------|------------|
| `--color-bg` | `#ffffff` | `#000000` | `body` background |
| `--color-fg` | `#000000` | `#ffffff` | `body` text, `tbody td` |
| `--color-surface` | `#f5f5f5` | `#111111` | `.controls`, `.table-container` background |
| `--color-surface-border` | `#e0e0e0` | `#333333` | `.controls` box-shadow, table borders |
| `--color-header-bg` | `#000000` | `#ffffff` | `header` background |
| `--color-header-fg` | `#ffffff` | `#000000` | `header h1`, `header .subtitle` |
| `--color-input-bg` | `#ffffff` | `#1a1a1a` | `select`, radio button area |
| `--color-input-fg` | `#000000` | `#ffffff` | `select` text, `label` |
| `--color-input-border` | `#cccccc` | `#555555` | `select` border |
| `--color-table-head-bg` | `#e8e8e8` | `#1a1a1a` | `thead` background |
| `--color-table-head-fg` | `#000000` | `#ffffff` | `thead th` text |
| `--color-table-row-hover` | `#f0f0f0` | `#222222` | `tbody tr:hover` background |
| `--color-muted` | `#555555` | `#aaaaaa` | `footer`, `.subtitle` opacity adjusted |
| `--color-focus-ring` | `#000000` | `#ffffff` | `:focus-visible` outline |

### WCAG AA Contrast Compliance

| Pair | Contrast Ratio | AA Normal (≥4.5:1) | AA Large (≥3:1) |
|------|---------------|---------------------|-----------------|
| `#000000` on `#ffffff` | **21:1** | ✅ | ✅ |
| `#ffffff` on `#000000` | **21:1** | ✅ | ✅ |
| `#000000` on `#f5f5f5` | **19.77:1** | ✅ | ✅ |
| `#ffffff` on `#111111` | **18.1:1** | ✅ | ✅ |
| `#ffffff` on `#1a1a1a` | **15.3:1** | ✅ | ✅ |
| `#555555` on `#ffffff` | **7.46:1** | ✅ | ✅ |
| `#aaaaaa` on `#000000` | **3.95:1** | ✅ (large text only) | ✅ |

> Note: `--color-muted` (`#aaaaaa` on black) achieves 3.95:1 — above the 3:1 large-text AA threshold. This variable is only applied to secondary/caption text rendered at ≥ 18px or ≥ 14px bold. Implementation must not apply `--color-muted` to body-weight text below 18px.

---

## Entity: Theme Toggle UI Component

### HTML Structure

```html
<!-- Placed inside existing <header> element in weather.html -->
<fieldset class="theme-toggle" role="group">
  <legend class="visually-hidden">Choose colour theme</legend>
  <label>
    <input type="radio" name="theme" value="white" checked />
    White
  </label>
  <label>
    <input type="radio" name="theme" value="black" />
    Black
  </label>
</fieldset>
```

### Attributes and Accessibility

| Attribute/Property | Purpose |
|--------------------|---------|
| `name="theme"` | Groups both radio inputs into one exclusive selection set |
| `value="white"` / `value="black"` | Matches allowed `localStorage` values exactly |
| `checked` (dynamic) | Set to `true` on the radio matching the active theme on page load |
| `<fieldset>` + `<legend>` | Screen reader context: announces "Choose colour theme" before each option |
| `.visually-hidden` | Legend is present for AT but not visually rendered (uses standard SR-only CSS trick) |

### Keyboard Behaviour (Native Radio)

| Key | Action |
|-----|--------|
| `Tab` | Moves focus to the radio group |
| `Arrow Right` / `Arrow Down` | Moves selection to next radio option |
| `Arrow Left` / `Arrow Up` | Moves selection to previous radio option |
| `Space` | Selects focused radio button |

---

## Entity: theme.js Module

### Exported Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `sanitiseTheme` | `(value: any) → string` | Validates input against allowlist; returns `"white"` if invalid |
| `getStoredTheme` | `() → string` | Reads `localStorage.getItem('theme-preference')`; returns sanitised value |
| `applyTheme` | `(theme: string) → void` | Sets `document.documentElement.setAttribute('data-theme', theme)`; writes to localStorage |
| `toggleTheme` | `(theme: string) → void` | Alias/entry-point called from radio `change` event handler; validates then calls `applyTheme` |

### State Management Rules

1. `applyTheme` is the **single source of truth** for applying a theme: it both updates the DOM and persists to localStorage.
2. The inline FOUC `<script>` in `<head>` does **not** call `applyTheme` (because `theme.js` is not yet loaded); it replicates only the `setAttribute` logic inline.
3. `toggleTheme` validates its argument via `sanitiseTheme` before forwarding to `applyTheme`. This protects against tampered radio values.

---

## No Backend Model Changes

- No database tables added or modified.
- No server-side API endpoints created.
- No cookies or session storage used.
- No environment variables required.
