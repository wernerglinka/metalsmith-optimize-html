/**
 * Safe attribute quote removal optimizer
 * Removes quotes from HTML attributes when it's safe to do so
 * @module safe-quote-removal-optimizer
 */
export const safeQuoteRemovalOptimizer = {
  /**
   * Optimizer name
   * @type {string}
   */
  name: 'safeQuoteRemoval',

  /**
   * Removes quotes from attribute values when safe
   * - Only removes quotes if value contains no special characters
   * - Preserves quotes for values with spaces, brackets, etc.
   * - Preserves quotes for URL values (//example.com)
   * - Processes each HTML tag separately to avoid false matches
   *
   * @param {string} content - HTML content to optimize
   * @param {Object} options - Optimization options
   * @param {boolean} [options.safeRemoveAttributeQuotes=false] - Whether to remove safe quotes
   * @returns {string} Optimized HTML content
   *
   * @example
   * // Safe to remove quotes:
   * <div class="container"> -> <div class=container>
   *
   * // Quotes preserved:
   * <div class="multiple classes">
   * <div data-json='{"key":"value"}'>
   * <a href="//example.com">
   */
  optimize: (content, { safeRemoveAttributeQuotes = false } = {}) => {
    if (!safeRemoveAttributeQuotes) {return content;}

    // URL attributes that should keep their quotes
    const urlAttributes = new Set([
      'href',
      'src',
      'action',
      'content',
      'srcset',
      'xmlns',
      'xlink:href'
    ]);

    return content.replace(/<[^>]+>/g, (tag) => {
      return tag.replace(
        /(\s)([\w-]+)=(["'])([^"'<>`\s{}()[\]?=]+)\3/g,
        (match, space, name, quote, value) => {
          // Preserve quotes for URL attributes
          if (urlAttributes.has(name) && (value.startsWith('//') || value.includes(':'))) {
            return match;
          }
          return `${space}${name}=${value}`;
        }
      );
    });
  }
};
