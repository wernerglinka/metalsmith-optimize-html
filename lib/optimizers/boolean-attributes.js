/**
 * Boolean attributes optimization module
 * @module boolean-attributes-optimizer
 *   - Normalizes boolean attributes (checked="checked" → checked)
 *   - Handles HTML5 boolean attributes like disabled, required, etc.
 *   - Enable with normalizeBooleanAttributes: true
 */

export const booleanAttributesOptimizer = {
  name: 'booleanAttributes',
  optimize: ( content, { normalizeBooleanAttributes = false } = {} ) => {
    if ( !normalizeBooleanAttributes ) return content;

    // HTML5 boolean attributes
    const booleanAttributes = new Set( [
      'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked',
      'controls', 'default', 'defer', 'disabled', 'formnovalidate',
      'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
      'nomodule', 'novalidate', 'open', 'playsinline', 'readonly',
      'required', 'reversed', 'selected', 'truespeed'
    ] );

    // Process tag by tag to ensure proper attribute handling
    return content.replace( /<[^>]+>/g, tag => {
      // Don't process closing tags
      if ( tag.startsWith( '</' ) ) return tag;

      // Process each attribute in the tag
      return tag.replace( /\s([^\s=]+)(?:=["']([^"']*)["'])?/g, ( match, name, value ) => {
        if ( !booleanAttributes.has( name ) ) return match;

        // Remove attribute if value is "false"
        if ( value === 'false' ) return '';

        // Keep just the attribute name for boolean attributes with "true" or self-reference
        if ( value === 'true' || value === name ) return ` ${ name }`;

        // Keep original for other cases
        return match;
      } );
    } );
  }
};
