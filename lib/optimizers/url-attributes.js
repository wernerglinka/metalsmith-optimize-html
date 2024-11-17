/**
 * URL attributes optimization module
 * Cleans up URL values in attributes like href, src, action
 * @module url-attributes-optimizer
 *   - Cleans and normalizes URLs in attributes like href, src, action, srcset, data
 *   - Removes unnecessary whitespace in URLs
 *   - Trims whitespace
 *   - Enable with cleanUrlAttributes: true
 */

export const urlAttributesOptimizer = {
  name: 'urlAttributes',
  optimize: ( content, { cleanUrlAttributes = false } = {} ) => {
    if ( !cleanUrlAttributes ) return content;

    // List of attributes that can contain URLs
    const urlAttributes = new Set( [
      'href',
      'src',
      'action',
      'srcset',
      'data'
    ] );

    // Process tag by tag
    return content.replace( /<[^>]+>/g, tag => {
      // Don't process closing tags
      if ( tag.startsWith( '</' ) ) return tag;

      // Clean URL attributes
      return tag.replace( /\s([^\s=]+)=["']([^"']*)["']/g, ( match, name, value ) => {
        if ( !urlAttributes.has( name ) ) return match;

        // Trim whitespace and normalize spacing in URL
        const cleanedValue = value.trim().replace( /\s+/g, '' );
        return ` ${ name }="${ cleanedValue }"`;
      } );
    } );
  }
};
