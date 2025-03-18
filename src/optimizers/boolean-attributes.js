/**
 * Boolean attributes optimization module
 *
 * @module boolean-attributes-optimizer
 *
 * Normalizes HTML boolean attributes according to the HTML5 specification:
 * - Converts attribute="attribute" to just attribute (e.g., checked="checked" → checked)
 * - Handles all standard HTML5 boolean attributes
 * - Removes attributes with value="false"
 * - Preserves attributes with non-standard values
 *
 * @example
 * // Input
 * <input type="checkbox" checked="checked" disabled="disabled">
 * <button disabled="false">Button</button>
 *
 * // Output
 * <input type="checkbox" checked disabled>
 * <button>Button</button>
 */

import { createAttributeOptimizer } from '../optimizer-factory.js';

// Complete list of HTML5 boolean attributes
const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'truespeed'
]);

/**
 * Determine if an attribute is a boolean attribute that should be processed
 *
 * @param {string} name - Attribute name
 * @returns {boolean} - True if the attribute should be processed
 */
function isBooleanAttribute(name) {
  return BOOLEAN_ATTRIBUTES.has(name);
}

/**
 * Process a boolean attribute
 *
 * @param {string} match - The original attribute match
 * @param {string} name - The attribute name
 * @param {string} value - The attribute value
 * @returns {string} - The processed attribute
 */
function processBooleanAttribute(match, name, value) {
  // Handle different attribute value cases
  if (value === 'false') {
    // Remove attributes with value="false"
    return '';
  } else if (value === 'true' || value === name || value === '') {
    // Normalize to attribute-only form
    return ` ${name}`;
  }

  // Preserve original for non-standard values
  return match;
}

/**
 * Create the boolean attributes optimizer
 */
export const booleanAttributesOptimizer = createAttributeOptimizer(
  'booleanAttributes',
  'normalizeBooleanAttributes',
  isBooleanAttribute,
  processBooleanAttribute
);
