/**
* Whitespace optimization module
* Handles complex whitespace optimization in HTML content while preserving
* necessary formatting and spacing.
*
* @module whitespace-optimizer
*
* Core functionality:
* - Collapses multiple whitespace characters to single space
* - Removes unnecessary whitespace between HTML tags
* - Preserves exact whitespace in special tags (pre, code, etc.)
* - Maintains appropriate spacing around inline elements based on context
* - Creates single-line output except for preserved content
* - Handles nested inline elements correctly
*
* Processing steps:
* 1. Preserve special tags (pre, code, etc.) with exact whitespace
* 2. Process inline elements maintaining contextual spacing
* 3. Handle remaining block-level content
* 4. Restore preserved content
*/

export const whitespaceOptimizer = {
  name: 'whitespace',

  /**
   * Optimizes HTML content by managing whitespace in various contexts
   * @param {string} content - HTML content to optimize
   * @returns {string} Optimized HTML content
   */
  optimize: ( content ) => {
    // Tags that must maintain exact internal whitespace
    // These are typically code-related or formatting-specific elements
    const preserveTags = [ 'pre', 'code', 'textarea', 'script', 'style' ];

    // Inline elements that may affect text flow and spacing
    // These elements should maintain spacing based on their context
    const inlineTags = [
      'a', 'span', 'em', 'strong', 'b', 'i', 'u', 's',      // Basic text formatting
      'small', 'mark', 'sub', 'sup',                        // Text presentation
      'time', 'cite', 'abbr',                               // Semantic elements
      'label', 'svg'                                        // UI and graphics elements
    ];

    // Storage for content that must be preserved or processed separately
    const preserved = [];

    // STEP 1: Preserve special tags
    // Matches complete tag pairs with their content and preserves them exactly
    let html = content.replace(
      new RegExp( `(<(${ preserveTags.join( '|' ) })[^>]*>[\\s\\S]*?</\\2>)`, 'gi' ),
      ( match ) => {
        preserved.push( match );
        return `___PRESERVE_${ preserved.length - 1 }___`;
      }
    );

    // STEP 2: Handle inline elements
    // Complex regex pattern to match inline elements with their surrounding context
    const inlinePattern = new RegExp(
      `(\\s*)` +                           // Leading whitespace
      `(<(${ inlineTags.join( '|' ) })[^>]*>)` + // Opening tag with attributes
      `([^<]*(?:(?!</\\3)[\\s\\S])*?)` +     // Content (including nested elements)
      `(</\\3>)` +                           // Closing tag
      `(\\s*)`,                              // Trailing whitespace
      'gi'
    );

    // Process nested inline elements iteratively from inside out
    let lastHtml;
    do {
      lastHtml = html;
      html = html.replace( inlinePattern,
        ( match, beforeSpace, openTag, tagName, content, closeTag, afterSpace ) => {
          // Normalize internal whitespace while preserving content
          const normalizedContent = content.replace( /\s+/g, ' ' ).trim();
          const normalized = `${ openTag }${ normalizedContent }${ closeTag }`;
          preserved.push( normalized );

          // Maintain contextual spacing - keep single space only where space existed
          const leadSpace = beforeSpace.length > 0 ? ' ' : '';
          const trailSpace = afterSpace.length > 0 ? ' ' : '';
          return `${ leadSpace }___INLINE_${ preserved.length - 1 }___${ trailSpace }`;
        }
      );
    } while ( html !== lastHtml ); // Continue until all nested elements are processed

    // STEP 3: Process remaining block-level content
    // Split content into tags and text, process text portions
    const blockParts = html.split( /(<\/?[^>]+>)/g );
    html = blockParts
      .map( part => {
        if ( part.startsWith( '<' ) ) return part;  // Keep tags unchanged
        return part.replace( /\s+/g, ' ' ).trim(); // Normalize text content
      } )
      .join( '' )
      .trim();

    // STEP 4: Restore preserved content
    // Replace placeholders with their preserved content in correct order
    return preserved.reduce( ( text, content, i ) =>
      text
        .replace( `___PRESERVE_${ i }___`, content )  // Restore preserved tags
        .replace( `___INLINE_${ i }___`, content ),   // Restore inline elements
      html
    );
  }
};
