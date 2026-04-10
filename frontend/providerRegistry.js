// License: Proprietary. All rights reserved.

/**
 * Weather Provider Registry
 *
 * Implements the Strategy pattern: maintains a Map of available WeatherProvider
 * implementations and routes `getWeatherByCity` / `getAllWeatherData` calls to
 * the provider selected by the caller-supplied `providerId` string.
 *
 * At module load time both built-in providers are auto-registered:
 *   - 'primary' → PrimaryWeatherProvider (10-city dataset)
 *   - 'mock'    → MockWeatherProvider    (3-city hardcoded mock)
 *
 * A third provider can be added without modifying this file:
 *   WeatherProviderRegistry.register(myNewProvider);
 *
 * @module providerRegistry
 */

(function () {
  // Resolve built-in providers: Node (CommonJS) vs browser (window.*)
  var PrimaryWeatherProvider;
  var MockWeatherProvider;

  if (typeof module !== 'undefined' && module.exports) {
    // Node / Jest environment
    PrimaryWeatherProvider = require('./providers/primaryProvider');
    MockWeatherProvider = require('./providers/mockProvider');
  } else {
    // Browser environment — providers must be loaded via <script> before this file
    PrimaryWeatherProvider = window.PrimaryWeatherProvider;
    MockWeatherProvider = window.MockWeatherProvider;
  }

  /**
   * Internal provider store.
   * @type {Map<string, WeatherProvider>}
   */
  var _providers = new Map();

  /**
   * Weather Provider Registry.
   *
   * @type {WeatherProviderRegistry}
   */
  var WeatherProviderRegistry = {
    /**
     * Registers a provider. Throws if a provider with the same id is already registered.
     *
     * @param {Object} provider - An object implementing the WeatherProvider interface.
     * @param {string} provider.id - Unique identifier for the provider.
     * @throws {Error} If a provider with this id has already been registered.
     */
    register: function (provider) {
      if (_providers.has(provider.id)) {
        throw new Error('Provider already registered: ' + provider.id);
      }
      _providers.set(provider.id, provider);
    },

    /**
     * Returns the provider registered under the given id.
     *
     * @param {string} id - The provider id to look up.
     * @returns {Object} The matching WeatherProvider.
     * @throws {Error} If no provider is registered with this id.
     */
    getProvider: function (id) {
      if (!_providers.has(id)) {
        throw new Error('Unknown weather provider: ' + id);
      }
      return _providers.get(id);
    },

    /**
     * Returns all WeatherRecord entries from the specified provider.
     *
     * @param {string} providerId - The provider id to delegate to.
     * @returns {Array<Object>} Array of WeatherRecord objects.
     * @throws {Error} If no provider is registered with this id.
     */
    getAllWeatherData: function (providerId) {
      return this.getProvider(providerId).getAll();
    },

    /**
     * Returns all registered provider IDs in registration order.
     *
     * Each element is the string `id` supplied when the provider was registered.
     * Returns a new array on every call so mutations do not affect the internal
     * Map — callers may safely modify the returned array.
     * This method never throws; an empty registry returns an empty array.
     *
     * @returns {Array<string>} Ordered array of provider id strings.
     */
    listProviders: function () {
      return Array.from(_providers.keys());
    },

    /**
     * Returns weather data for a specific city from the specified provider.
     *
     * @param {string} city - City name to look up (alias-aware, case-insensitive per provider).
     * @param {string} providerId - The provider id to delegate to.
     * @returns {Object|null} WeatherRecord if found, null if the city is unsupported.
     * @throws {Error} If no provider is registered with this id.
     */
    getWeatherByCity: function (city, providerId) {
      return this.getProvider(providerId).getByCity(city);
    },
  };

  // Auto-register built-in providers at module load time
  WeatherProviderRegistry.register(PrimaryWeatherProvider);
  WeatherProviderRegistry.register(MockWeatherProvider);

  // Browser global exposure
  if (typeof window !== 'undefined') {
    window.WeatherProviderRegistry = WeatherProviderRegistry;
  }

  // CommonJS export for Jest
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherProviderRegistry;
  }
}());
