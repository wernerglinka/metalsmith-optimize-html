/**
 * Optimizer Registry for metalsmith-optimize-html
 *
 * Centralizes the registration and loading of HTML optimizers
 * using a functional approach.
 *
 * @module optimizer-registry
 */

/**
 * @typedef {Object} Optimizer
 * @property {string} name - Unique name of the optimizer
 * @property {Function} optimize - The optimization function
 */

/**
 * Map of option flag names to optimizer file paths
 * @type {Record<string, string>}
 */
const OPTIMIZER_MAP = {
  // Core optimizer - always loaded
  whitespace: './optimizers/whitespace.js',

  // Optional optimizers - loaded based on options
  removeComments: './optimizers/comments.js',
  removeEmptyAttributes: './optimizers/empty-attributes.js',
  normalizeBooleanAttributes: './optimizers/boolean-attributes.js',
  cleanUrlAttributes: './optimizers/url-attributes.js',
  cleanDataAttributes: './optimizers/data-attributes.js',
  removeTagSpaces: './optimizers/tag-spaces.js',
  removeDefaultAttributes: './optimizers/default-attributes.js',
  simplifyDoctype: './optimizers/doctype.js',
  removeProtocols: './optimizers/protocols.js',
  safeRemoveAttributeQuotes: './optimizers/safe-attributes-quote-removal.js'
};

// Cache of import promises
const importPromises = new Map();

// Cache of loaded optimizers
const optimizers = new Map();

/**
 * Get an optimizer by its flag name
 *
 * @param {string} flag - The flag name
 * @returns {Promise<Optimizer|null>} - The optimizer or null if not found
 */
async function getOptimizer(flag) {
  // Return from cache if already loaded
  if (optimizers.has(flag)) {
    return optimizers.get(flag);
  }

  // Check if this optimizer exists
  if (!OPTIMIZER_MAP[flag]) {
    return null;
  }

  try {
    // Create import promise if not already created
    if (!importPromises.has(flag)) {
      importPromises.set(
        flag,
        import(OPTIMIZER_MAP[flag]).then((module) => {
          const exportName = Object.keys(module)[0];
          return module[exportName];
        })
      );
    }

    // Await the import
    const optimizer = await importPromises.get(flag);

    // Cache the optimizer
    optimizers.set(flag, optimizer);

    return optimizer;
  } catch (error) {
    console.warn(`Failed to load optimizer for flag "${flag}":`, error);
    return null;
  }
}

/**
 * Load optimizers based on configuration
 *
 * @param {Object} options - Configuration options
 * @returns {Promise<Optimizer[]>} Array of initialized optimizers
 */
async function loadOptimizers(options) {
  const loadedOptimizers = [];

  try {
    // Always load core whitespace optimizer
    const whitespaceOptimizer = await getOptimizer('whitespace');
    if (whitespaceOptimizer) {
      loadedOptimizers.push(whitespaceOptimizer);
    }

    // Dynamically load optional optimizers based on options
    for (const flag of Object.keys(OPTIMIZER_MAP)) {
      if (flag === 'whitespace') {
        continue;
      } // Skip core optimizer

      // Load if option is not explicitly disabled
      if (options[flag] !== false) {
        // Get all optimizers in parallel instead of using await in a loop
        const optimizer = await getOptimizer(flag);
        if (optimizer) {
          loadedOptimizers.push(optimizer);
        }
      }
    }
  } catch (error) {
    console.error('Error loading optimizers:', error);
  }

  return loadedOptimizers;
}

/**
 * Clear the optimizer cache - useful for testing
 */
function clearCache() {
  importPromises.clear();
  optimizers.clear();
}

export default {
  getOptimizer,
  loadOptimizers,
  clearCache
};
