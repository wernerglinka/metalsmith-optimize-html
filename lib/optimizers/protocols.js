/**
 * Protocol optimization module
 * Removes http:// and https:// from URLs while preserving external links
 * @module protocols-optimizer
 *   - Removes http:// and https:// from URLs
 *   - Replaces with protocol-relative // URLs
 *   - Preserves protocols in links with rel="external"
 *   - Enable with removeProtocols: true
 */

export const protocolsOptimizer = {
  name: 'protocols',
  optimize: ( content, { removeProtocols = false } = {} ) => {
    if ( !removeProtocols ) return content;

    // URL attributes that can have protocols removed
    const urlAttributes = new Set( [
      'href',
      'src',
      'action',
      'data'
    ] );

    return content.replace( /<[^>]+>/g, tag => {
      // Skip tags with rel="external"
      if ( tag.includes( 'rel="external"' ) ) return tag;

      // Process URL attributes
      return tag.replace(
        /\s((?:href|src|action|data))=["'](https?:\/\/[^"']*)["']/gi,
        ( match, attr, url ) => {
          if ( !urlAttributes.has( attr.toLowerCase() ) ) return match;
          return ` ${ attr }="//${ url.replace( /^https?:\/\//, '' ) }"`;
        }
      );
    } );
  }
};
