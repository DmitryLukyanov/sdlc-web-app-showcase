// License: Proprietary. All rights reserved.

/**
 * Theme Manager — Black/White CSS Theme Toggle
 *
 * Manages the active colour theme for the application via the data-theme
 * attribute on <html>. Theme preference is persisted to localStorage under
 * the key "theme-preference". The FOUC-prevention inline <script> in
 * weather.html's <head> reads the same key independently (before this
 * module loads) to eliminate flash-of-unstyled-content on page load.
 *
 * Dual-export pattern mirrors frontend/weather.js lines 70-75:
 *   - window.ThemeManager  → browser global (event handlers in weather.html)
 *   - module.exports       → CommonJS export (Jest tests in tests/theme.test.js)
 */

// Allowlist of valid theme values. Only these two strings are accepted.
var VALID_THEMES = ['black', 'white'];

// Default theme applied when stored or supplied value is invalid/absent.
var DEFAULT_THEME = 'white';

// localStorage key used to persist the user's preference across sessions.
var STORAGE_KEY = 'theme-preference';

/**
 * Validates a candidate theme value against the allowlist.
 * Pure function — no side effects.
 *
 * @param {*} value - Candidate theme string (or any untrusted input).
 * @returns {string} The validated theme ('black' | 'white'); defaults to 'white'.
 */
function sanitiseTheme(value) {
  if (VALID_THEMES.indexOf(value) !== -1) {
    return value;
  }
  return DEFAULT_THEME;
}

/**
 * Reads the persisted theme preference from localStorage.
 * Passes the raw stored value through sanitiseTheme before returning so
 * corrupted or absent values always resolve to a safe default.
 *
 * @returns {string} Stored theme ('black' | 'white'); defaults to 'white'.
 */
function getStoredTheme() {
  var stored = localStorage.getItem(STORAGE_KEY);
  return sanitiseTheme(stored);
}

/**
 * Applies a theme to the page and persists it to localStorage.
 * Sets data-theme on <html> to activate the matching CSS variable set.
 * Validates the supplied value via sanitiseTheme before applying.
 *
 * @param {string} theme - Desired theme ('black' | 'white').
 * @returns {void}
 */
function applyTheme(theme) {
  var validTheme = sanitiseTheme(theme);
  document.documentElement.setAttribute('data-theme', validTheme);
  localStorage.setItem(STORAGE_KEY, validTheme);
}

/**
 * Named entry point for the radio button change event handler.
 * Validates then delegates to applyTheme.
 *
 * @param {string} theme - Value from the radio input ('black' | 'white').
 * @returns {void}
 */
function toggleTheme(theme) {
  applyTheme(sanitiseTheme(theme));
}

// Browser global exposure — guarded so Node.js/Jest environments don't throw
if (typeof window !== 'undefined') {
  window.ThemeManager = {
    sanitiseTheme: sanitiseTheme,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    getStoredTheme: getStoredTheme,
  };
}

// CommonJS export for Jest — guarded to avoid errors in browser context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitiseTheme: sanitiseTheme,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    getStoredTheme: getStoredTheme,
  };
}
