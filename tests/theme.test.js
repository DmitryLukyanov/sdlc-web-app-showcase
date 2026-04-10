// License: Proprietary. All rights reserved.

'use strict';

const { sanitiseTheme, applyTheme, toggleTheme, getStoredTheme } = require('../frontend/theme.js');

// ---------------------------------------------------------------------------
// T006 — sanitiseTheme: allowlist validation
// ---------------------------------------------------------------------------
describe('sanitiseTheme', function () {
  test('returns "white" for valid value "white"', function () {
    expect(sanitiseTheme('white')).toBe('white');
  });

  test('returns "black" for valid value "black"', function () {
    expect(sanitiseTheme('black')).toBe('black');
  });

  test('returns "white" for invalid value "dark"', function () {
    expect(sanitiseTheme('dark')).toBe('white');
  });

  test('returns "white" for empty string', function () {
    expect(sanitiseTheme('')).toBe('white');
  });

  test('returns "white" for null', function () {
    expect(sanitiseTheme(null)).toBe('white');
  });

  test('returns "white" for undefined', function () {
    expect(sanitiseTheme(undefined)).toBe('white');
  });

  test('returns "white" for numeric value 42', function () {
    expect(sanitiseTheme(42)).toBe('white');
  });

  test('returns "white" for "WHITE" (case-sensitive — uppercase is invalid)', function () {
    expect(sanitiseTheme('WHITE')).toBe('white');
  });
});

// ---------------------------------------------------------------------------
// T007 — applyTheme: sets data-theme attribute and persists to localStorage
// ---------------------------------------------------------------------------
describe('applyTheme', function () {
  beforeEach(function () {
    // Reset DOM attribute and localStorage before each test
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  test('sets data-theme="white" on <html> when given "white"', function () {
    applyTheme('white');
    expect(document.documentElement.dataset.theme).toBe('white');
  });

  test('sets data-theme="black" on <html> when given "black"', function () {
    applyTheme('black');
    expect(document.documentElement.dataset.theme).toBe('black');
  });

  test('persists "white" to localStorage under "theme-preference"', function () {
    applyTheme('white');
    expect(localStorage.getItem('theme-preference')).toBe('white');
  });

  test('persists "black" to localStorage under "theme-preference"', function () {
    applyTheme('black');
    expect(localStorage.getItem('theme-preference')).toBe('black');
  });

  test('applies "white" as fallback when given an invalid value', function () {
    applyTheme('invalid');
    expect(document.documentElement.dataset.theme).toBe('white');
    expect(localStorage.getItem('theme-preference')).toBe('white');
  });

  test('applies "white" as fallback when given null', function () {
    applyTheme(null);
    expect(document.documentElement.dataset.theme).toBe('white');
  });
});

// ---------------------------------------------------------------------------
// T008 — toggleTheme: integration — validates, then delegates to applyTheme
// ---------------------------------------------------------------------------
describe('toggleTheme', function () {
  beforeEach(function () {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  test('delegates to applyTheme and sets data-theme="black"', function () {
    toggleTheme('black');
    expect(document.documentElement.dataset.theme).toBe('black');
  });

  test('delegates to applyTheme and sets data-theme="white"', function () {
    toggleTheme('white');
    expect(document.documentElement.dataset.theme).toBe('white');
  });

  test('invalid input results in "white" being applied', function () {
    toggleTheme('light');
    expect(document.documentElement.dataset.theme).toBe('white');
  });

  test('re-selecting the same theme is idempotent — no error thrown', function () {
    applyTheme('black');
    expect(function () { toggleTheme('black'); }).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('black');
  });
});

// ---------------------------------------------------------------------------
// T017 — getStoredTheme: reads and validates localStorage value
// ---------------------------------------------------------------------------
describe('getStoredTheme', function () {
  beforeEach(function () {
    localStorage.clear();
  });

  test('returns "white" when localStorage key is absent (first visit)', function () {
    expect(getStoredTheme()).toBe('white');
  });

  test('returns "black" when stored value is "black"', function () {
    localStorage.setItem('theme-preference', 'black');
    expect(getStoredTheme()).toBe('black');
  });

  test('returns "white" when stored value is "white"', function () {
    localStorage.setItem('theme-preference', 'white');
    expect(getStoredTheme()).toBe('white');
  });

  test('returns "white" when stored value is corrupted ("dark")', function () {
    localStorage.setItem('theme-preference', 'dark');
    expect(getStoredTheme()).toBe('white');
  });

  test('returns "white" when stored value is "42"', function () {
    localStorage.setItem('theme-preference', '42');
    expect(getStoredTheme()).toBe('white');
  });

  test('returns "white" when stored value is empty string', function () {
    localStorage.setItem('theme-preference', '');
    expect(getStoredTheme()).toBe('white');
  });
});
