// License: Proprietary. All rights reserved.

/**
 * DOM Integration Tests — weather.html
 *
 * These tests simulate the browser page-load environment using jsdom.
 * They verify rendering, the Provider column, the provider filter checkboxes,
 * and combined filter behaviour without requiring a real browser.
 *
 * Setup strategy:
 *   1. Reset module cache before each test (jest.resetModules) to get fresh state.
 *   2. Populate document.body with the minimal DOM structure from weather.html.
 *   3. Require providerRegistry and weather.js (which set window globals).
 *   4. Call WeatherApp.initPage() — the same function called by the HTML's inline script.
 *   5. Assert on the resulting DOM state.
 */

'use strict';

/**
 * Build the minimal DOM structure required by WeatherApp.initPage().
 * Mirrors the elements declared in weather.html.
 */
function setupDOM() {
  document.body.innerHTML = `
    <main>
      <section class="controls">
        <select id="filter-condition">
          <option value="">All Conditions</option>
          <option value="Sunny">Sunny</option>
          <option value="Partly Cloudy">Partly Cloudy</option>
          <option value="Cloudy">Cloudy</option>
          <option value="Rainy">Rainy</option>
          <option value="Stormy">Stormy</option>
          <option value="Windy">Windy</option>
          <option value="Snow">Snow</option>
        </select>
        <select id="sort-by">
          <option value="city">City</option>
          <option value="temperature">Temperature</option>
        </select>
        <fieldset id="filter-provider" class="provider-filter">
          <legend>Filter by Provider:</legend>
        </fieldset>
      </section>
      <section class="table-container">
        <table id="weather-table">
          <thead>
            <tr>
              <th>City</th>
              <th>State</th>
              <th>Condition</th>
              <th>Temperature (°F)</th>
              <th>Humidity (%)</th>
              <th>Wind Speed (mph)</th>
              <th>Forecast Date</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody id="weather-body"></tbody>
        </table>
      </section>
      <p id="no-results" class="no-results hidden">No cities match the selected condition.</p>
    </main>
  `;
}

// ── US1: All-provider aggregation (T004 DOM-side, T005) ─────────────────────

describe('US1 — page load renders data from all providers', () => {
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    require('../frontend/providers/primaryProvider.js');
    require('../frontend/providers/mockProvider.js');
    require('../frontend/providerRegistry.js');
    require('../frontend/weather.js');
    window.WeatherApp.initPage();
  });

  test('page load renders 13 rows in #weather-body (10 primary + 3 mock)', () => {
    const rows = document.querySelectorAll('#weather-body tr');
    expect(rows.length).toBe(13);
  });

  test('getAllFromAllProviders is available on WeatherApp', () => {
    expect(typeof window.WeatherApp.getAllFromAllProviders).toBe('function');
  });

  test('getAllFromAllProviders returns 13 records', () => {
    const result = window.WeatherApp.getAllFromAllProviders();
    expect(result.data).toHaveLength(13);
  });

  test('no provider-warning banner when all providers succeed', () => {
    const banner = document.querySelector('.provider-warning');
    expect(banner).toBeNull();
  });

  test('no-results paragraph remains hidden when data is present', () => {
    const noResults = document.getElementById('no-results');
    expect(noResults.classList.contains('hidden')).toBe(true);
  });
});

describe('US1 — non-blocking warning banner for failed provider', () => {
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    require('../frontend/providers/primaryProvider.js');
    require('../frontend/providers/mockProvider.js');
    const registry = require('../frontend/providerRegistry.js');
    // Register a provider that throws on getAll()
    registry.register({
      id: 'broken',
      getByCity: () => null,
      getAll: () => { throw new Error('Simulated network failure'); },
    });
    require('../frontend/weather.js');
    window.WeatherApp.initPage();
  });

  test('a .provider-warning[role="alert"] banner appears when a provider fails', () => {
    const banner = document.querySelector('.provider-warning[role="alert"]');
    expect(banner).not.toBeNull();
  });

  test('warning banner text mentions the failing provider id', () => {
    const banner = document.querySelector('.provider-warning');
    expect(banner.textContent).toContain('broken');
  });

  test('dismiss button is present inside the warning banner', () => {
    const dismissBtn = document.querySelector('.provider-warning .provider-warning__dismiss');
    expect(dismissBtn).not.toBeNull();
  });

  test('clicking dismiss button removes the banner from the DOM', () => {
    const dismissBtn = document.querySelector('.provider-warning__dismiss');
    dismissBtn.click();
    const banner = document.querySelector('.provider-warning');
    expect(banner).toBeNull();
  });

  test('page still renders records from working providers despite failure', () => {
    const rows = document.querySelectorAll('#weather-body tr');
    // primary (10) + mock (3) succeed; broken fails
    expect(rows.length).toBe(13);
  });
});

// ── US2: Provider attribution column (T010) ──────────────────────────────────

describe('US2 — Provider attribution column', () => {
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    require('../frontend/providers/primaryProvider.js');
    require('../frontend/providers/mockProvider.js');
    require('../frontend/providerRegistry.js');
    require('../frontend/weather.js');
    window.WeatherApp.initPage();
  });

  test('#weather-table header contains a <th>Provider</th> as the last header cell', () => {
    const headers = document.querySelectorAll('#weather-table thead th');
    const lastHeader = headers[headers.length - 1];
    expect(lastHeader.textContent).toBe('Provider');
  });

  test('each row in #weather-body has a final <td> with providerName text', () => {
    const rows = document.querySelectorAll('#weather-body tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const lastCell = cells[cells.length - 1];
      const providerName = lastCell.textContent.trim();
      expect(['primary', 'mock']).toContain(providerName);
    });
  });

  test('"New York" appears as exactly two rows with different providerName values', () => {
    const rows = document.querySelectorAll('#weather-body tr');
    const nyRows = [];
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[0] && cells[0].textContent === 'New York') {
        nyRows.push(cells[cells.length - 1].textContent.trim());
      }
    });
    expect(nyRows).toHaveLength(2);
    expect(nyRows[0]).not.toBe(nyRows[1]);
    expect(nyRows).toContain('primary');
    expect(nyRows).toContain('mock');
  });

  test('a city covered by only one provider appears as exactly one row', () => {
    // "Washington D.C." is only in the mock provider
    const rows = document.querySelectorAll('#weather-body tr');
    const dcRows = [];
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[0] && cells[0].textContent === 'Washington D.C.') {
        dcRows.push(row);
      }
    });
    expect(dcRows).toHaveLength(1);
  });

  test('all field values are preserved intact on each row', () => {
    const rows = document.querySelectorAll('#weather-body tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      // city, state, condition, temp, humidity, windSpeed, forecastDate, provider (8 columns)
      expect(cells.length).toBe(8);
      // All cells have non-empty text content
      cells.forEach((cell) => {
        expect(cell.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

// ── US3: Provider filter checkboxes (T015) ───────────────────────────────────

describe('US3 — Provider filter checkbox UI', () => {
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    require('../frontend/providers/primaryProvider.js');
    require('../frontend/providers/mockProvider.js');
    require('../frontend/providerRegistry.js');
    require('../frontend/weather.js');
    window.WeatherApp.initPage();
  });

  test('#filter-provider fieldset is present', () => {
    const fieldset = document.getElementById('filter-provider');
    expect(fieldset).not.toBeNull();
  });

  test('fieldset contains one checkbox per registered provider', () => {
    const checkboxes = document.querySelectorAll('.provider-checkbox');
    // Two built-in providers: primary and mock
    expect(checkboxes.length).toBe(2);
  });

  test('each provider checkbox is labelled with the provider id', () => {
    const checkboxes = document.querySelectorAll('.provider-checkbox');
    const values = Array.from(checkboxes).map((cb) => cb.value);
    expect(values).toContain('primary');
    expect(values).toContain('mock');
  });

  test('#filter-provider-all checkbox is present', () => {
    const allCb = document.getElementById('filter-provider-all');
    expect(allCb).not.toBeNull();
  });

  test('all checkboxes are checked on page load', () => {
    const allCb = document.getElementById('filter-provider-all');
    const provCbs = document.querySelectorAll('.provider-checkbox');
    expect(allCb.checked).toBe(true);
    provCbs.forEach((cb) => expect(cb.checked).toBe(true));
  });

  test('unchecking a provider checkbox reduces visible rows to remaining providers count', () => {
    // Uncheck "mock" — should leave only 10 primary rows
    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));
    const rows = document.querySelectorAll('#weather-body tr');
    expect(rows.length).toBe(10);
  });

  test('unchecking a provider checkbox auto-unchecks the "All Providers" checkbox', () => {
    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));
    const allCb = document.getElementById('filter-provider-all');
    expect(allCb.checked).toBe(false);
  });

  test('checking "All Providers" re-checks all individual provider checkboxes', () => {
    // Uncheck mock first
    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));

    // Now re-check All Providers
    const allCb = document.getElementById('filter-provider-all');
    allCb.checked = true;
    allCb.dispatchEvent(new Event('change'));

    const provCbs = document.querySelectorAll('.provider-checkbox');
    provCbs.forEach((cb) => expect(cb.checked).toBe(true));
    expect(document.querySelectorAll('#weather-body tr').length).toBe(13);
  });

  test('unchecking "All Providers" unchecks all individual provider checkboxes', () => {
    const allCb = document.getElementById('filter-provider-all');
    allCb.checked = false;
    allCb.dispatchEvent(new Event('change'));

    const provCbs = document.querySelectorAll('.provider-checkbox');
    provCbs.forEach((cb) => expect(cb.checked).toBe(false));
    // No rows shown when no providers selected
    expect(document.querySelectorAll('#weather-body tr').length).toBe(0);
  });

  test('when all individual providers are checked, "All Providers" auto-checks', () => {
    // Uncheck one, then re-check it
    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));

    // Now check it again
    mockCb.checked = true;
    mockCb.dispatchEvent(new Event('change'));

    const allCb = document.getElementById('filter-provider-all');
    expect(allCb.checked).toBe(true);
  });
});

// ── US3: Combined condition + provider filter (T016) ─────────────────────────

describe('US3 — Combined condition + provider filter', () => {
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    require('../frontend/providers/primaryProvider.js');
    require('../frontend/providers/mockProvider.js');
    require('../frontend/providerRegistry.js');
    require('../frontend/weather.js');
    window.WeatherApp.initPage();
  });

  test('applying both condition filter and provider filter shows only matching records', () => {
    // Select "Sunny" condition
    const conditionSelect = document.getElementById('filter-condition');
    conditionSelect.value = 'Sunny';
    conditionSelect.dispatchEvent(new Event('change'));

    // Uncheck mock provider
    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));

    // Only primary Sunny records should remain
    const rows = document.querySelectorAll('#weather-body tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const conditionCell = cells[2].textContent;
      const providerCell = cells[cells.length - 1].textContent.trim();
      expect(conditionCell).toContain('Sunny');
      expect(providerCell).toBe('primary');
    });
  });

  test('clearing provider filter while condition is active restores all providers for that condition', () => {
    // Set condition to "Sunny" and restrict to primary
    const conditionSelect = document.getElementById('filter-condition');
    conditionSelect.value = 'Sunny';
    conditionSelect.dispatchEvent(new Event('change'));

    const mockCb = document.querySelector('.provider-checkbox[value="mock"]');
    mockCb.checked = false;
    mockCb.dispatchEvent(new Event('change'));

    const restrictedCount = document.querySelectorAll('#weather-body tr').length;

    // Re-check "All Providers"
    const allCb = document.getElementById('filter-provider-all');
    allCb.checked = true;
    allCb.dispatchEvent(new Event('change'));

    const restoredCount = document.querySelectorAll('#weather-body tr').length;
    // Should have more rows after restoring all providers
    expect(restoredCount).toBeGreaterThanOrEqual(restrictedCount);

    // All shown rows must still match the "Sunny" condition filter
    const rows = document.querySelectorAll('#weather-body tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      expect(cells[2].textContent).toContain('Sunny');
    });
  });

  test('changing sort while provider filter active preserves filter', () => {
    // Restrict to mock only
    const primaryCb = document.querySelector('.provider-checkbox[value="primary"]');
    primaryCb.checked = false;
    primaryCb.dispatchEvent(new Event('change'));

    const rowsBefore = document.querySelectorAll('#weather-body tr').length;

    // Change sort
    const sortSelect = document.getElementById('sort-by');
    sortSelect.value = 'temperature';
    sortSelect.dispatchEvent(new Event('change'));

    const rowsAfter = document.querySelectorAll('#weather-body tr').length;
    expect(rowsAfter).toBe(rowsBefore);

    // All rows should be from mock
    const rows = document.querySelectorAll('#weather-body tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      expect(cells[cells.length - 1].textContent.trim()).toBe('mock');
    });
  });
});
