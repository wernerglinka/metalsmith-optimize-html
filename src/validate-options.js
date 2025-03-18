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
  return ['Invalid options for metalsmith-optimize-html:', ...errors.map((err) => `  - ${err}`)].join('\n');
}

export default {
  validateOptions,
  formatValidationErrors
};
