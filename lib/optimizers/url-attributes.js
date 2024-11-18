/**
* URL attributes optimization module
* Cleans up URL values in attributes like href, src, action
* @module url-attributes-optimizer
*/

export const urlAttributesOptimizer = {
  name: 'urlAttributes',
  optimize: ( content, { cleanUrlAttributes = false } = {} ) => {
    if ( !cleanUrlAttributes ) return content;

    const urlAttributes = new Set( [
      // Standard attributes
      'href', 'src', 'action', 'srcset', 'data',
      // Meta tag URLs
      'content',
      // SVG attributes
      'xmlns', 'xlink:href'
    ] );

    // Process tag by tag
    return content.replace( /<[^>]+>/g, tag => {
      // Don't process closing tags
      if ( tag.startsWith( '</' ) ) return tag;

      // Clean URL attributes
      return tag.replace( /\s([^\s=]+)=["']([^"']*)["']/g, ( match, name, value ) => {
        if ( !urlAttributes.has( name ) ) return match;

        // For meta tags, only process URL-specific tags
        if ( name === 'content' &&
          !tag.includes( 'og:url' ) &&
          !tag.includes( 'twitter:url' ) ) return match;

        // For xlink:href with #, preserve the value
        if ( name === 'xlink:href' && value.startsWith( '#' ) ) {
          return ` ${ name }="${ value.trim() }"`;
        }

        // Clean and normalize URL
        const cleanedValue = value.trim()
          .replace( /\s+/g, '' )
          .replace( /^https?:/, '' );

        return ` ${ name }="${ cleanedValue }"`;
      } );
    } );
  }
};
