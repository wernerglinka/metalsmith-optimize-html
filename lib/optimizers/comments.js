/**
 * Comment optimization module
 * Removes HTML comments when enabled
 * @module comment-optimizer
 *   - Simple removal of all HTML comments
 *   - Enable with removeComments: true
 */

export const commentOptimizer = {
  /**
   * Optimizer name
   * @type {string}
   */
  name: 'comment',

  /**
   * Optimizes HTML content by removing comments
   *
   * @param {string} content - HTML content to optimize
   * @param {Object} options - Optimization options
   * @param {boolean} [options.removeComments=false] - Whether to remove comments
   * @returns {string} Optimized HTML content
   */
  optimize: ( content, { removeComments = false } = {} ) => {
    if ( !removeComments ) return content;

    // Remove all comments
    return content.replace( /<!--[\s\S]*?-->/g, '' );
  }
};
