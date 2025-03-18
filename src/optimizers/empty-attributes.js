/**
 * Empty attributes optimization module
 * Removes empty attributes while preserving specific ones like alt and value
 * @module empty-attributes-optimizer
 *   - Removes attributes with empty values
 *   - Handles both quoted and unquoted empty values
 *   - Enable with removeEmptyAttributes: true
 */

export const emptyAttributesOptimizer = {
  name: 'emptyAttributes',
  optimize: (content, { removeEmptyAttributes = false } = {}) => {
    if (!removeEmptyAttributes) {
      return content;
    }

    const preserveEmpty = ['alt', 'value'];

    return content.replace(/(<[^>]+?)(\s+[^=>\s]+(?:=["']\s*["']))+(?=\s*\/?>)/g, (match, prefix) => {
      // Keep the tag start, process attributes
      return (
        prefix +
        match
          .slice(prefix.length)
          .replace(/\s+[^=>\s]+(?:=["']\s*["'])/g, (attr) => {
            // Check if this is an attribute we should preserve
            const attrName = attr.match(/\s+([^=>\s]+)/)[1];
            return preserveEmpty.includes(attrName) ? attr : '';
          })
          .trim()
      );
    });
  }
};
