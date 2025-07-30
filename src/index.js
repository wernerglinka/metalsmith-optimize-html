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

// processContent function moved to utils/content-processor.js

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
        
        // Validate file.contents before processing
        if (!isProcessableFile(file)) {
          debug('skipping %s: contents is not processable', filename);
          continue;
        }

        // Destructure file properties for cleaner access
        const { contents } = file;
        
        // Get content and process it
        const content = contents.toString();
        const optimizedContent = processContent(content, activeOptimizers, mergedOptions);

        // Update file with optimized content
        file.contents = Buffer.from(optimizedContent);
        
        debug('processed %s (%d bytes -> %d bytes)', filename, content.length, optimizedContent.length);
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
