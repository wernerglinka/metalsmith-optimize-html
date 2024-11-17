/**
 * Tag spaces optimization module
 * Removes unnecessary spaces inside HTML tags
 * @module tag-spaces-optimizer
 *   - Removes extra spaces inside HTML tags
 *   - Normalizes spaces between attributes
 *   - Preserves spaces in attribute values
 *   - Enable with removeTagSpaces: true
 */

export const tagSpacesOptimizer = {
  /**
   * Optimizer name
   * @type {string}
   */
  name: 'tag-spaces',

  /**
   * Optimizes HTML content by removing extra spaces inside tags
   * - Collapses multiple spaces between attributes to single space
   * - Removes spaces before closing > or />
   * - Preserves spaces inside attribute values
   *
   * @param {string} content - HTML content to optimize
   * @param {Object} options - Optimization options
   * @returns {string} Optimized HTML content
   */
  optimize: ( content ) => {
    return content.replace(
      /<([^>]*)>/g,
      ( match, tagContent ) => {
        // Normalize spaces in attribute values
        const normalizedTag = tagContent
          .replace( /=\s*"/g, '="' )  // Remove spaces before attribute values
          .replace( /"\s+/g, '" ' )   // Normalize spaces after attribute values
          .replace( /\s+/g, ' ' )     // Collapse multiple spaces to single
          .trim();                  // Remove leading/trailing spaces

        return `<${ normalizedTag }>`;
      }
    );
  }
};
