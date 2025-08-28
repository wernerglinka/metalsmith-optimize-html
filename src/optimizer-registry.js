/**
 * Optimizer Registry for metalsmith-optimize-html
 *
 * Centralizes the registration and loading of HTML optimizers
 * using a functional approach.
 *
 * @module optimizer-registry
 */

// Import optimizers directly to ensure proper bundling in both ESM and CJS
import { whitespaceOptimizer } from './optimizers/whitespace.js';
import { commentOptimizer } from './optimizers/comments.js';
import { emptyAttributesOptimizer } from './optimizers/empty-attributes.js';
import { booleanAttributesOptimizer } from './optimizers/boolean-attributes.js';
import { urlAttributesOptimizer } from './optimizers/url-attributes.js';
import { dataAttributesOptimizer } from './optimizers/data-attributes.js';
import { tagSpacesOptimizer } from './optimizers/tag-spaces.js';
import { defaultAttributesOptimizer } from './optimizers/default-attributes.js';
import { doctypeOptimizer } from './optimizers/doctype.js';
import { protocolsOptimizer } from './optimizers/protocols.js';
import { safeQuoteRemovalOptimizer } from './optimizers/safe-attributes-quote-removal.js';

/**
 * @typedef {Object} Optimizer
 * @property {string} name - Unique name of the optimizer
 * @property {Function} optimize - The optimization function
 */

/**
 * Map of option flag names to optimizer instances
 * Using direct imports instead of dynamic imports for better compatibility
 * @type {Record<string, Optimizer>}
 */
const OPTIMIZERS = {
  // Core optimizer - always loaded
  whitespace: whitespaceOptimizer,
  // Optional optimizers - loaded based on options
  removeComments: commentOptimizer,
  removeEmptyAttributes: emptyAttributesOptimizer, 
  normalizeBooleanAttributes: booleanAttributesOptimizer,
  cleanUrlAttributes: urlAttributesOptimizer,
  cleanDataAttributes: dataAttributesOptimizer,
  removeTagSpaces: tagSpacesOptimizer,
  removeDefaultAttributes: defaultAttributesOptimizer,
  simplifyDoctype: doctypeOptimizer,
  removeProtocols: protocolsOptimizer,
  safeRemoveAttributeQuotes: safeQuoteRemovalOptimizer
};

// Cache of loaded optimizers
const optimizers = new Map();

/**
 * Get an optimizer by its flag name
 * Now synchronously returns the optimizer from the OPTIMIZERS map
 *
 * @param {string} flag - The flag name
 * @returns {Optimizer|null} - The optimizer or null if not found
 */
function getOptimizer(flag) {
  // Return from cache if already loaded
  if (optimizers.has(flag)) {
    return optimizers.get(flag);
  }

  // Check if this optimizer exists
  if (!OPTIMIZERS[flag]) {
    return null;
  }

  // Get the optimizer and cache it
  const optimizer = OPTIMIZERS[flag];
  optimizers.set(flag, optimizer);
  return optimizer;
}

/**
 * Load optimizers based on configuration
 * Now synchronously builds and returns the optimizers array
 *
 * @param {Object} options - Configuration options
 * @returns {Optimizer[]} Array of initialized optimizers
 */
function loadOptimizers(options) {
  const loadedOptimizers = [];
  try {
    // Always load core whitespace optimizer
    const whitespaceOptimizer = getOptimizer('whitespace');
    if (whitespaceOptimizer) {
      loadedOptimizers.push(whitespaceOptimizer);
    }

    // Load optional optimizers based on options
    // Only load optimizers that are explicitly enabled (truthy), not undefined
    const flagsToLoad = Object.keys(OPTIMIZERS)
      .filter(flag => flag !== 'whitespace' && options[flag] === true); // Skip core optimizer and only load explicitly enabled flags
    
    // Load optimizers and filter out nulls
    flagsToLoad.forEach(flag => {
      const optimizer = getOptimizer(flag);
      if (optimizer) {
        loadedOptimizers.push(optimizer);
      }
    });
  } catch (error) {
    console.error('Error loading optimizers:', error);
  }

  return loadedOptimizers;
}

/**
 * Clear the optimizer cache - useful for testing
 */
function clearCache() {
  optimizers.clear();
}

export default {
  getOptimizer,
  loadOptimizers,
  clearCache
};