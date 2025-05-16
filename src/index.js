/**
 * Metalsmith plugin for HTML optimization
 * @module metalsmith-optimize-html
 */

import optimizerRegistry from './optimizer-registry.js';
import validator from './validate-options.js';

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
  // If we have tags to exclude from processing
  if (options.excludeTags?.length > 0) {
    const preserved = [];
    const excludePattern = new RegExp(`<(${options.excludeTags.join('|')})[^>]*>[\\s\\S]*?</\\1>`, 'gi');

    // Preserve excluded tags
    content = content.replace(excludePattern, (match) => {
      preserved.push(match);
      return `___EXCLUDE_${preserved.length - 1}___`;
    });

    // Apply optimizers
    content = optimizers.reduce(
      (result, optimizer) => optimizer.optimize(result, options), 
      content
    );

    // Restore excluded content
    return preserved.reduce(
      (text, preservedContent, i) => text.replace(`___EXCLUDE_${i}___`, preservedContent),
      content
    );
  } 
  
  // Normal optimization without exclusions
  return optimizers.reduce(
    (result, optimizer) => optimizer.optimize(result, options), 
    content
  );
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
        if (matchedFiles.length === 0) {continue;}
        
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