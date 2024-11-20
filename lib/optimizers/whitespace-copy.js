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
    /**
     * Define an array called preserveTags that contains the names of HTML tags
     * whose content should be preserved exactly as it is, without any
     * whitespace optimization.
     */
    const preserveTags = [ 'pre', 'code', 'textarea', 'script', 'style' ];

    /**
     * Create a regular expression pattern to match these HTML tags to be
     * presevered and their content in an HTML string. This pattern is used
     * later in the optimize function to temporarily replace the content of
     * these tags with placeholders, allowing the rest of the HTML content
     * to be processed without altering the preserved content.
     */
    const preservePattern = new RegExp(
      `(<(${ preserveTags.join( '|' ) })[^>]*>[\\s\\S]*?</\\2>)`,
      'gi'
    );

    /**
     * The replace method takes a regular expression (preservePattern) and a
     * replacement function as arguments.
     * For each match found by the regular expression:
     * - The matched content (match) is pushed into the preserved array.
     * - The matched content is replaced with a placeholder string in the format
     *  ___PRESERVE_<index>___, where <index> is the current length of the
     * preserved array minus one.
     */
    const preserved = [];
    const processedHtml = content.replace( preservePattern, ( match ) => {
      preserved.push( match );
      return `___PRESERVE_${ preserved.length - 1 }___`;
    } );

    /**
     * Example:
     * If the content string contains:
     * <div><pre>   Some preformatted text   </pre><code>   Some code   </code></div>
     * The preserved array will contain:
     * preserved = [
     *    '<pre>   Some preformatted text   </pre>',
     *    '<code>   Some code   </code>'
     * ]
     * The processedHtml string will contain:
     * <div>___PRESERVE_0______PRESERVE_1___</div>
     */

    /**
     * This code snippet processes the processedHtml string by:
     * - Splitting the string into an array of HTML tags and text content.
     * - Replacing multiple whitespace characters in the text content with a
     *   single space  and trimming leading/trailing whitespace.
     * - Joining the parts back into a single string.
     * - Removing any spaces between HTML tags.
     * The result is a string with optimized whitespace, where multiple spaces
     * in the text content are reduced to a single space, and spaces between
     * HTML tags are removed.
     */
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
