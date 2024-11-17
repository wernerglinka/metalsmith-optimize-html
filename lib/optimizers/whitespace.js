/**
 * Whitespace optimization module
 * Handles collapsing of unnecessary whitespace while preserving content in specific tags
 * @module whitespace-optimizer
 *  - Collapses multiple whitespace to single space
 *  - Removes whitespace between HTML tags
 *  - Preserves whitespace in special tags: pre, code, textarea, script, style
 *  - Creates single-line output except for preserved content
 */

export const whitespaceOptimizer = {
  /**
   * Optimizer name
   * @type {string}
   */
  name: 'whitespace',

  /**
   * Optimizes HTML content by managing whitespace
   * - Collapses multiple whitespace characters to single space
   * - Removes whitespace between HTML tags
   * - Preserves whitespace in specified tags (pre, code, textarea, script, style)
   * - Trims leading/trailing whitespace
   *
   * @param {string} content - HTML content to optimize
   * @returns {string} Optimized HTML content
   */
  optimize: ( content ) => {
    const preserveTags = [ 'pre', 'code', 'textarea', 'script', 'style' ];

    const preservePattern = new RegExp(
      `(<(${ preserveTags.join( '|' ) })[^>]*>[\\s\\S]*?</\\2>)`,
      'gi'
    );

    // Store preserved content
    const preserved = [];
    const processedHtml = content.replace( preservePattern, ( match ) => {
      preserved.push( match );
      return `___PRESERVE_${ preserved.length - 1 }___`;
    } );

    // Process content
    const result = processedHtml
      .split( /(<[^>]+>)/g )
      .map( part => part.startsWith( '<' ) ? part : part.replace( /\s+/g, ' ' ).trim() )
      .join( '' )
      .replace( />\s+</g, '><' );

    // Restore preserved content
    return preserved.reduce(
      ( text, content, i ) => text.replace( `___PRESERVE_${ i }___`, content ),
      result
    ).trim();
  }
};
