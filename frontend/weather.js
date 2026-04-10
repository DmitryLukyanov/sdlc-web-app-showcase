// License: Proprietary. All rights reserved.

/**
 * Weather Forecast Portal - US Cities
 * Mock data and utility functions for the weather forecast table view.
 */

const weatherData = [
  {
    city: 'New York',
    state: 'NY',
    temperature: 68,
    humidity: 72,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Los Angeles',
    state: 'CA',
    temperature: 82,
    humidity: 45,
    windSpeed: 8,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Chicago',
    state: 'IL',
    temperature: 61,
    humidity: 65,
    windSpeed: 18,
    condition: 'Windy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Houston',
    state: 'TX',
    temperature: 91,
    humidity: 80,
    windSpeed: 10,
    condition: 'Rainy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Phoenix',
    state: 'AZ',
    temperature: 105,
    humidity: 15,
    windSpeed: 6,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Philadelphia',
    state: 'PA',
    temperature: 70,
    humidity: 68,
    windSpeed: 11,
    condition: 'Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Antonio',
    state: 'TX',
    temperature: 88,
    humidity: 74,
    windSpeed: 14,
    condition: 'Stormy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Diego',
    state: 'CA',
    temperature: 75,
    humidity: 60,
    windSpeed: 9,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
  {
    city: 'Dallas',
    state: 'TX',
    temperature: 94,
    humidity: 55,
    windSpeed: 16,
    condition: 'Partly Cloudy',
    forecastDate: '2024-06-15',
  },
  {
    city: 'San Jose',
    state: 'CA',
    temperature: 78,
    humidity: 50,
    windSpeed: 7,
    condition: 'Sunny',
    forecastDate: '2024-06-15',
  },
];

/**
 * Returns a copy of all weather data entries.
 * @returns {Array<Object>}
 */
function getAllWeatherData() {
  return weatherData.slice();
}

/**
 * Filters weather data by condition (case-insensitive).
 * @param {string} condition - Condition to filter by (empty string returns all).
 * @returns {Array<Object>}
 */
function filterByCondition(condition) {
  if (!condition) return weatherData.slice();
  const lower = condition.toLowerCase();
  return weatherData.filter(function (entry) {
    return entry.condition.toLowerCase() === lower;
  });
}

/**
 * Sorts an array of weather entries by a given key.
 * @param {Array<Object>} data
 * @param {string} key - One of: city, state, temperature, humidity, windSpeed, condition, forecastDate
 * @returns {Array<Object>} New sorted array.
 */
function sortData(data, key) {
  const validKeys = ['city', 'state', 'temperature', 'humidity', 'windSpeed', 'condition', 'forecastDate'];
  if (!validKeys.includes(key)) return data.slice();
  return data.slice().sort(function (a, b) {
    if (typeof a[key] === 'number') return a[key] - b[key];
    return String(a[key]).localeCompare(String(b[key]));
  });
}

/**
 * Returns filtered and sorted weather data.
 * @param {string} condition - Condition filter (empty = all).
 * @param {string} sortKey - Key to sort by (default: 'city').
 * @returns {Array<Object>}
 */
function getFilteredData(condition, sortKey) {
  const filtered = filterByCondition(condition);
  return sortData(filtered, sortKey || 'city');
}

/**
 * Returns a summary count grouped by condition.
 * @returns {Object} Map of condition -> count.
 */
function getConditionSummary() {
  return weatherData.reduce(function (acc, entry) {
    acc[entry.condition] = (acc[entry.condition] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Returns weather data for a specific city from the named provider.
 * Delegates to WeatherProviderRegistry.getWeatherByCity.
 *
 * @param {string} city - City name (alias-aware, case-insensitive per provider).
 * @param {string} providerId - Provider id (e.g. 'primary', 'mock').
 * @returns {Object|null} WeatherRecord or null if the city is unsupported by the provider.
 */
function getWeatherByCity(city, providerId) {
  var registry = (typeof module !== 'undefined' && module.exports)
    ? require('./providerRegistry')
    : window.WeatherProviderRegistry;
  return registry.getWeatherByCity(city, providerId);
}

/**
 * Returns all weather records from the named provider.
 * Delegates to WeatherProviderRegistry.getAllWeatherData.
 *
 * @param {string} providerId - Provider id (e.g. 'primary', 'mock').
 * @returns {Array<Object>} Array of WeatherRecord objects.
 */
function getAllFromProvider(providerId) {
  var registry = (typeof module !== 'undefined' && module.exports)
    ? require('./providerRegistry')
    : window.WeatherProviderRegistry;
  return registry.getAllWeatherData(providerId);
}

/**
 * Aggregates weather data from every registered provider.
 *
 * Each record is shallow-copied and stamped with a `providerName` field equal
 * to the provider's id — this happens at aggregation time so callers never
 * need to track which provider a record came from separately.
 *
 * Per-provider errors are caught non-fatally: the failing provider id is added
 * to `failedProviders` and aggregation continues with the remaining providers.
 * This ensures a single bad provider never blocks the display of valid data.
 *
 * @returns {{ data: Array<Object>, failedProviders: Array<string> }}
 *   data           — Combined array of WeatherRecord objects (with providerName).
 *   failedProviders — IDs of providers that threw during data retrieval.
 */
function getAllFromAllProviders() {
  var registry = (typeof module !== 'undefined' && module.exports)
    ? require('./providerRegistry')
    : window.WeatherProviderRegistry;
  var ids = registry.listProviders();
  var data = [];
  var failedProviders = [];
  ids.forEach(function (id) {
    try {
      var records = registry.getAllWeatherData(id);
      records.forEach(function (record) {
        // Stamp each record with its providerName at aggregation time so the
        // UI can attribute rows without re-querying the registry.
        data.push(Object.assign({}, record, { providerName: id }));
      });
    } catch (e) {
      failedProviders.push(id);
    }
  });
  return { data: data, failedProviders: failedProviders };
}

/**
 * Filters an array of WeatherRecord objects by provider id.
 *
 * Returns the input data unchanged (as a new array copy) when
 * `selectedProviderIds` is falsy or empty — this preserves the invariant
 * that "no filter selected = show everything" and makes the function safe to
 * call with a default/unset value without producing an empty result.
 *
 * Never mutates the input array. Never throws.
 *
 * @param {Array<Object>} data - Array of WeatherRecord objects (must have providerName).
 * @param {Array<string>|null|undefined} selectedProviderIds - Provider ids to keep.
 * @returns {Array<Object>} Filtered array (new array, input is not mutated).
 */
function filterByProvider(data, selectedProviderIds) {
  // Empty or absent selection means "all providers" — return everything.
  if (!selectedProviderIds || selectedProviderIds.length === 0) {
    return data.slice();
  }
  return data.filter(function (r) {
    return selectedProviderIds.includes(r.providerName);
  });
}

/**
 * Returns filtered and sorted weather data from ALL registered providers.
 *
 * This is the aggregated version of getFilteredData used by the browser UI.
 * It chains: getAllFromAllProviders → filterByCondition → filterByProvider → sortData.
 *
 * Passing an empty or omitted `providerIds` array returns records from ALL
 * providers (backward-compatible: callers that only supply condition + sortKey
 * continue to see all aggregated records).
 *
 * @param {string} condition - Condition filter (empty = all conditions).
 * @param {string} sortKey - Key to sort by (default: 'city').
 * @param {Array<string>|null|undefined} providerIds - Provider ids to include (empty = all).
 * @returns {Array<Object>} Filtered and sorted WeatherRecord objects with providerName.
 */
function getAggregatedFilteredData(condition, sortKey, providerIds) {
  var result = getAllFromAllProviders();
  var data = result.data;
  // Filter by condition across aggregated data
  if (condition) {
    var lower = condition.toLowerCase();
    data = data.filter(function (r) {
      return r.condition.toLowerCase() === lower;
    });
  }
  // Chain provider filter — empty providerIds returns all records unchanged
  data = filterByProvider(data, providerIds || []);
  return sortData(data, sortKey || 'city');
}

/**
 * Initialises the weather page: aggregates data, renders the provider filter
 * checkboxes, shows a warning banner for failed providers, and wires all
 * interactive controls (condition filter, sort, provider checkboxes).
 *
 * Designed to be called once on DOMContentLoaded. All DOM element ids match
 * those declared in weather.html.
 */
function initPage() {
  var registry = window.WeatherProviderRegistry;
  var filterSelect = document.getElementById('filter-condition');
  var sortSelect = document.getElementById('sort-by');
  var tbody = document.getElementById('weather-body');
  var noResults = document.getElementById('no-results');
  var filterProviderFieldset = document.getElementById('filter-provider');

  // ── Provider filter checkboxes ──────────────────────────────────────────────
  var providerIds = registry.listProviders();

  // "All Providers" master checkbox
  var allLabel = document.createElement('label');
  var allCheckbox = document.createElement('input');
  allCheckbox.type = 'checkbox';
  allCheckbox.id = 'filter-provider-all';
  allCheckbox.checked = true;
  allLabel.appendChild(allCheckbox);
  allLabel.appendChild(document.createTextNode('All Providers'));
  filterProviderFieldset.appendChild(allLabel);

  // One checkbox per registered provider
  providerIds.forEach(function (id) {
    var label = document.createElement('label');
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'provider-checkbox';
    cb.value = id;
    cb.checked = true;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(id));
    filterProviderFieldset.appendChild(label);
  });

  // ── Warning banner for failed providers ────────────────────────────────────
  var result = getAllFromAllProviders();
  var allData = result.data;
  var failedProviders = result.failedProviders;

  if (failedProviders.length > 0) {
    var banner = document.createElement('div');
    banner.className = 'provider-warning';
    banner.setAttribute('role', 'alert');
    var strong = document.createElement('strong');
    strong.textContent = failedProviders.join(', ');
    banner.appendChild(document.createTextNode('\u26a0 Could not load data from provider(s): '));
    banner.appendChild(strong);
    banner.appendChild(document.createTextNode('. '));
    var dismissBtn = document.createElement('button');
    dismissBtn.className = 'provider-warning__dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.textContent = '\u00d7';
    dismissBtn.addEventListener('click', function () {
      banner.parentNode && banner.parentNode.removeChild(banner);
    });
    banner.appendChild(dismissBtn);
    var table = document.getElementById('weather-table');
    table.parentNode.insertBefore(banner, table);
  }

  // ── Render helper ──────────────────────────────────────────────────────────
  function getSelectedProviderIds() {
    var checked = document.querySelectorAll('.provider-checkbox:checked');
    var ids = [];
    for (var i = 0; i < checked.length; i++) {
      ids.push(checked[i].value);
    }
    return ids;
  }

  function render() {
    var condition = filterSelect.value;
    var sortKey = sortSelect.value;
    var allProvCb = document.getElementById('filter-provider-all');
    var data;

    if (allProvCb && allProvCb.checked) {
      // "All Providers" is active — pass empty array so filterByProvider returns
      // everything (its documented behaviour for empty/falsy selectedProviderIds).
      data = getAggregatedFilteredData(condition, sortKey);
    } else {
      var selectedProviderIds = getSelectedProviderIds();
      if (selectedProviderIds.length === 0) {
        // No individual provider is checked — user explicitly wants nothing shown.
        data = [];
      } else {
        data = getAggregatedFilteredData(condition, sortKey, selectedProviderIds);
      }
    }

    tbody.innerHTML = '';
    if (data.length === 0) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
      data.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + row.city + '</td>' +
          '<td>' + row.state + '</td>' +
          '<td><span class="badge badge-' + row.condition.toLowerCase().replace(/ /g, '-') + '">' + row.condition + '</span></td>' +
          '<td>' + row.temperature + '</td>' +
          '<td>' + row.humidity + '</td>' +
          '<td>' + row.windSpeed + '</td>' +
          '<td>' + row.forecastDate + '</td>' +
          '<td class="provider-badge provider-badge-' + row.providerName + '">' + row.providerName + '</td>';
        tbody.appendChild(tr);
      });
    }
  }

  // ── "All Providers" toggle ──────────────────────────────────────────────────
  var allProvCb = document.getElementById('filter-provider-all');
  allProvCb.addEventListener('change', function () {
    var provCheckboxes = document.querySelectorAll('.provider-checkbox');
    for (var i = 0; i < provCheckboxes.length; i++) {
      provCheckboxes[i].checked = allProvCb.checked;
    }
    render();
  });

  // ── Individual provider checkbox events ────────────────────────────────────
  var provCheckboxes = document.querySelectorAll('.provider-checkbox');
  for (var i = 0; i < provCheckboxes.length; i++) {
    provCheckboxes[i].addEventListener('change', function () {
      var allChecked = document.querySelectorAll('.provider-checkbox');
      var allAreChecked = true;
      for (var j = 0; j < allChecked.length; j++) {
        if (!allChecked[j].checked) { allAreChecked = false; break; }
      }
      allProvCb.checked = allAreChecked;
      render();
    });
  }

  // ── Condition and sort selects ─────────────────────────────────────────────
  filterSelect.addEventListener('change', render);
  sortSelect.addEventListener('change', render);

  // Initial render
  render();
}

// Browser global exposure
if (typeof window !== 'undefined') {
  window.WeatherApp = {
    getAllWeatherData,
    filterByCondition,
    sortData,
    // Aggregated getFilteredData for browser UI (uses all providers)
    getFilteredData: getAggregatedFilteredData,
    getConditionSummary,
    getWeatherByCity,
    getAllFromProvider,
    getAllFromAllProviders,
    filterByProvider,
    initPage,
  };
}

// CommonJS export for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllWeatherData,
    filterByCondition,
    sortData,
    // Legacy getFilteredData (static 10-city array) preserved for existing tests
    getFilteredData,
    getConditionSummary,
    weatherData,
    getWeatherByCity,
    getAllFromProvider,
    // New aggregated functions (T006, T017, T018)
    getAllFromAllProviders,
    filterByProvider,
    getAggregatedFilteredData,
  };
}
