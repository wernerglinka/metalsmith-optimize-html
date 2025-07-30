/**
 * Metalsmith plugin for HTML optimization
 * @module metalsmith-optimize-html
 */

import optimizerRegistry from './optimizer-registry.js';
import validator from './validate-options.js';
import { getMatchingFiles, isProcessableFile } from './utils/file-filters.js';
import { processContent } from './utils/content-processor.js';

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
 * @typedef {Object} Options
 * @property {string} [pattern='**\/*.html'] - Glob pattern for matching files
 * @property {string[]} [excludeTags=[]] - HTML tags to exclude from optimization
 * @property {boolean} [aggressive=false] - Enable all optimizations
 * @property {boolean} [removeComments=false] - Remove HTML comments
 * @property {boolean} [removeTagSpaces=false] - Remove spaces around tags
 * @property {boolean} [normalizeBooleanAttributes=false] - Normalize boolean attributes
 * @property {boolean} [cleanUrlAttributes=false] - Clean URL attributes
 * @property {boolean} [removeProtocols=false] - Remove protocols from URLs
 * @property {boolean} [removeDefaultAttributes=false] - Remove default attributes
 * @property {boolean} [cleanDataAttributes=false] - Clean data attributes
 * @property {boolean} [simplifyDoctype=false] - Simplify DOCTYPE declaration
 * @property {boolean} [safeRemoveAttributeQuotes=false] - Safely remove attribute quotes
 */

/**
 * Process a single file with error handling and validation
 * @param {string} filename - The filename being processed
 * @param {Object} file - The Metalsmith file object
 * @param {Array} activeOptimizers - Array of optimizer functions
 * @param {Object} mergedOptions - Merged optimization options
 * @param {Function} debug - Debug logging function
 * @returns {boolean} True if file was processed successfully
 */
function processFile(filename, file, activeOptimizers, mergedOptions, debug) {
  // Validate file.contents before processing
  if (!isProcessableFile(file)) {
    debug('skipping %s: contents is not processable', filename);
    return false;
  }

  // Early filtering: skip empty files only
  if (!file.contents || file.contents.length === 0) {
    debug('skipping %s: empty file', filename);
    return false;
  }

  // Destructure file properties for cleaner access
  const { contents } = file;
  
  // Get content and process it with error handling
  let content;
  try {
    content = contents.toString('utf8');
  } catch (error) {
    debug('skipping %s: failed to decode content as UTF-8 - %s', filename, error.message);
    return false;
  }
  
  // Early filtering: skip files that don't contain HTML tags
  if (!content.includes('<') || !content.includes('>')) {
    debug('skipping %s: no HTML tags detected', filename);
    return false;
  }
  
  // Process content with error handling
  let optimizedContent;
  try {
    optimizedContent = processContent(content, activeOptimizers, mergedOptions);
  } catch (error) {
    debug('skipping %s: optimization failed - %s', filename, error.message);
    return false;
  }

  // Validate optimized content before updating file
  if (typeof optimizedContent !== 'string' || optimizedContent.length === 0) {
    debug('skipping %s: optimization produced invalid content', filename);
    return false;
  }

  // Update file with optimized content
  try {
    file.contents = Buffer.from(optimizedContent, 'utf8');
  } catch (error) {
    debug('skipping %s: failed to create buffer from optimized content - %s', filename, error.message);
    return false;
  }
  
  debug('processed %s (%d bytes -> %d bytes)', filename, content.length, optimizedContent.length);
  return true;
}

/**
 * Creates a Metalsmith plugin for HTML optimization
 *
 * @param {Options} userOptions - Configuration options
 * @returns {import('metalsmith').Plugin} Metalsmith plugin function
 * @throws {Error} If options are invalid
 */
export default function optimizeHTML(userOptions = {}) {
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
   * The plugin function - Two-phase processing:
   * Phase 1: Filter and match files for optimal performance
   * Phase 2: Process matched files with optimizers
   * @param {import('metalsmith').Files} files - Metalsmith files object
   * @param {import('metalsmith')} metalsmith - Metalsmith instance
   * @param {Function} done - Callback function
   */
  const plugin = function (files, metalsmith, done) {
    try {
      // Load optimizers on first run - now synchronous
      if (!optimizers) {
        optimizers = optimizerRegistry.loadOptimizers(options);
      }

      const debug = metalsmith.debug ? metalsmith.debug('metalsmith-optimize-html') : () => {};
      debug('running with options: %O', options);

      const activeOptimizers = plugin._testOptimizers || optimizers;

      // Phase 1: Filter files before expensive transformations
      const matchingFiles = getMatchingFiles(files, options.pattern, metalsmith);
      debug('matched %d files for processing', matchingFiles.length);

      // Access site-wide metadata for potential configuration
      const metadata = metalsmith.metadata();
      const siteOptions = metadata.htmlOptimization || {};
      const mergedOptions = { ...options, ...siteOptions };

      // Phase 2: Process each matching file
      for (const filename of matchingFiles) {
        const file = files[filename];
        processFile(filename, file, activeOptimizers, mergedOptions, debug);
      }

      done();
    } catch (error) {
      done(error);
    }
  };

  // Property for testing
  plugin._testOptimizers = null;

  // Set function name for better debugging
  Object.defineProperty(plugin, 'name', { value: 'optimizeHTML' });

  return plugin;
}
