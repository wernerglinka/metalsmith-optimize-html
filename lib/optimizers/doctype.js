/**
 * Doctype optimization module
 * Replaces any doctype declaration with simple HTML5 doctype
 * @module doctype-optimizer
 *   - Replaces any DOCTYPE declaration with simple HTML5 DOCTYPE
 *   - Handles multiple DOCTYPEs in a document
 *   - Always adds DOCTYPE if one existed
 *   - Enable with simplifyDoctype: true
 */

export const doctypeOptimizer = {
  name: 'doctype',
  optimize: ( content, { simplifyDoctype = false } = {} ) => {
    if ( !simplifyDoctype ) return content;

    // Remove all existing doctypes
    let result = content.replace( /<!DOCTYPE[^>]*>/gi, '' );

    // Add single HTML5 doctype at the start if there was at least one doctype
    if ( content.match( /<!DOCTYPE[^>]*>/i ) ) {
      result = '<!DOCTYPE html>' + result;
    }

    return result;
  }
};
