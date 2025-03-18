'use strict';

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return n;
}

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
      importPromises.set(flag, (function (t) { return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(t)); }); })(OPTIMIZER_MAP[flag]).then(module => {
        const exportName = Object.keys(module)[0];
        return module[exportName];
      }));
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
var optimizerRegistry = {
  getOptimizer,
  loadOptimizers,
  clearCache
};

/**
 * Configuration validation for metalsmith-optimize-html
 * @module validate-options
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the options are valid
 * @property {string[]} errors - Array of error messages if invalid
 */

/**
 * Validate that a value is a boolean or undefined
 *
 * @param {any} value - The value to check
 * @param {string} name - Option name for error message
 * @returns {string|null} - Error message or null if valid
 */
function validateBoolean(value, name) {
  if (value === undefined || typeof value === 'boolean') {
    return null;
  }
  return `Option "${name}" must be a boolean, got ${typeof value}: ${value}`;
}

/**
 * Validate that a value is a string or undefined
 *
 * @param {any} value - The value to check
 * @param {string} name - Option name for error message
 * @returns {string|null} - Error message or null if valid
 */
function validateString(value, name) {
  if (value === undefined || typeof value === 'string') {
    return null;
  }
  return `Option "${name}" must be a string, got ${typeof value}: ${value}`;
}

/**
 * Validate that a value is an array of strings or undefined
 *
 * @param {any} value - The value to check
 * @param {string} name - Option name for error message
 * @returns {string|null} - Error message or null if valid
 */
function validateStringArray(value, name) {
  if (value === undefined) {
    return null;
  }
  if (!Array.isArray(value)) {
    return `Option "${name}" must be an array, got ${typeof value}: ${value}`;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (typeof item !== 'string') {
      return `Option "${name}" must contain only strings, item at index ${i} is ${typeof item}: ${item}`;
    }
  }
  return null;
}

/**
 * Option validators mapped by option name
 * @type {Object.<string, function>}
 */
const VALIDATORS = {
  // Core options
  pattern: validateString,
  excludeTags: validateStringArray,
  aggressive: validateBoolean,
  // Feature options
  removeComments: validateBoolean,
  removeTagSpaces: validateBoolean,
  normalizeBooleanAttributes: validateBoolean,
  cleanUrlAttributes: validateBoolean,
  removeProtocols: validateBoolean,
  removeDefaultAttributes: validateBoolean,
  cleanDataAttributes: validateBoolean,
  simplifyDoctype: validateBoolean,
  safeRemoveAttributeQuotes: validateBoolean,
  removeEmptyAttributes: validateBoolean
};

/**
 * Validate user options against the expected schema
 *
 * @param {Object} options - User options to validate
 * @returns {ValidationResult} - Validation result
 */
function validateOptions(options) {
  const errors = [];

  // Ensure options is an object
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return {
      valid: false,
      errors: ['Options must be an object']
    };
  }

  // Check for unknown options
  for (const key of Object.keys(options)) {
    if (!Object.prototype.hasOwnProperty.call(VALIDATORS, key)) {
      errors.push(`Unknown option "${key}"`);
    }
  }

  // Validate each option
  for (const [name, validator] of Object.entries(VALIDATORS)) {
    if (Object.prototype.hasOwnProperty.call(options, name)) {
      const error = validator(options[name], name);
      if (error) {
        errors.push(error);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format validation errors into a readable message
 *
 * @param {string[]} errors - Array of error messages
 * @returns {string} - Formatted error message
 */
function formatValidationErrors(errors) {
  return ['Invalid options for metalsmith-optimize-html:', ...errors.map(err => `  - ${err}`)].join('\n');
}
var validator = {
  validateOptions,
  formatValidationErrors
};

/**
 * Metalsmith plugin for HTML optimization
 * @module metalsmith-optimize-html
 */

// Configuration defaults
const BASE_OPTIONS = {
  pattern: '**/*.html',
  excludeTags: []
};
const DEFAULT_AGGRESSIVE_OPTIONS = {
  removeComments: true,
  removeTagSpaces: true,
  normalizeBooleanAttributes: true,
  cleanUrlAttributes: true,
  removeProtocols: true,
  removeDefaultAttributes: true,
  cleanDataAttributes: true,
  simplifyDoctype: true,
  safeRemoveAttributeQuotes: true
};

/**
 * @typedef {Object} Optimizer
 * @property {string} name - The name of the optimizer
 * @property {Function} optimize - The optimization function that processes HTML content
 */

/**
 * Process content with optimizers, handling excluded tags if specified
 * @param {string} content - The HTML content to process
 * @param {Optimizer[]} optimizers - The array of optimizers to apply
 * @param {Object} options - Configuration options
 * @returns {string} - The processed HTML content
 */
function processContent(content, optimizers, options) {
  var _options$excludeTags;
  // If we have tags to exclude from processing
  if (((_options$excludeTags = options.excludeTags) == null ? void 0 : _options$excludeTags.length) > 0) {
    const preserved = [];
    const excludePattern = new RegExp(`<(${options.excludeTags.join('|')})[^>]*>[\\s\\S]*?</\\1>`, 'gi');

    // Preserve excluded tags
    content = content.replace(excludePattern, match => {
      preserved.push(match);
      return `___EXCLUDE_${preserved.length - 1}___`;
    });

    // Apply optimizers
    content = optimizers.reduce((result, optimizer) => optimizer.optimize(result, options), content);

    // Restore excluded content
    return preserved.reduce((text, preservedContent, i) => text.replace(`___EXCLUDE_${i}___`, preservedContent), content);
  }

  // Normal optimization without exclusions
  return optimizers.reduce((result, optimizer) => optimizer.optimize(result, options), content);
}

/**
 * Creates a Metalsmith plugin for HTML optimization
 *
 * @param {Object} userOptions - Configuration options
 * @param {string} [userOptions.pattern] - Glob pattern for matching files
 * @param {string[]} [userOptions.excludeTags] - HTML tags to exclude from optimization
 * @param {boolean} [userOptions.aggressive] - Enable all optimizations
 * @returns {Function} Metalsmith plugin function
 * @throws {Error} If options are invalid
 */
function optimizeHTML(userOptions = {}) {
  // Validate user options
  const validation = validator.validateOptions(userOptions);
  if (!validation.valid) {
    throw new Error(validator.formatValidationErrors(validation.errors));
  }

  // Merge options with defaults
  const options = {
    ...BASE_OPTIONS,
    ...(userOptions.aggressive ? DEFAULT_AGGRESSIVE_OPTIONS : {}),
    ...userOptions
  };

  // Cache optimizers for reuse across multiple files
  let optimizers;

  /**
   * The plugin function
   * @param {Object} files - Metalsmith files object
   * @param {Object} metalsmith - Metalsmith instance
   * @param {Function} done - Callback function
   */
  const plugin = async function (files, metalsmith, done) {
    try {
      // Load optimizers on first run
      if (!optimizers) {
        optimizers = await optimizerRegistry.loadOptimizers(options);
      }
      const debug = metalsmith.debug('metalsmith-optimize-html');
      debug('running with options: %O', options);
      const activeOptimizers = plugin._testOptimizers || optimizers;

      // Process each file
      for (const [filename, file] of Object.entries(files)) {
        // Use metalsmith.match to leverage built-in file matching capabilities
        const matchedFiles = metalsmith.match(options.pattern, [filename]);
        if (matchedFiles.length === 0) {
          continue;
        }

        // Get content and process it
        const content = file.contents.toString();
        const optimizedContent = processContent(content, activeOptimizers, options);

        // Update file with optimized content
        file.contents = Buffer.from(optimizedContent);
      }
      done();
    } catch (error) {
      done(error);
    }
  };

  // Property for testing
  plugin._testOptimizers = null;
  return plugin;
}

module.exports = optimizeHTML;
//# sourceMappingURL=index.cjs.map
