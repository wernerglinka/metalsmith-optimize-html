/**
 * Data attributes optimization module
 * Cleans up HTML5 data-* attributes
 * @module data-attributes-optimizer
 *   - Cleans data-* attribute values
 *   - Normalizes whitespace in data attribute values
 *   - Maintains valid JSON in data attributes
 *   - Enable with cleanDataAttributes: true
 */

export const dataAttributesOptimizer = {
  name: 'dataAttributes',
  optimize: (content, { cleanDataAttributes = false } = {}) => {
    if (!cleanDataAttributes) {return content;}

    return content.replace(/<[^>]+>/g, (tag) => {
      if (tag.startsWith('</')) {return tag;}

      return tag.replace(/\s(data-[^\s=]+)=(["'])([\s\S]*?)\2/g, (match, name, quote, value) => {
        // Remove empty data attributes
        if (!value.trim()) {return '';}

        // Try to parse and normalize JSON content
        const trimmedValue = value.trim();
        if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
          try {
            const jsonValue = JSON.parse(trimmedValue);
            // Use single quotes for JSON to avoid escaping
            return ` ${name}='${JSON.stringify(jsonValue)}'`;
          } catch (e) {
            // Not valid JSON, handle as regular string
          }
        }

        // Handle numeric values
        if (!isNaN(trimmedValue) && trimmedValue.length > 0) {
          return ` ${name}="${trimmedValue}"`;
        }

        // Handle boolean values
        if (trimmedValue.toLowerCase() === 'true') {return ` ${name}="true"`;}
        if (trimmedValue.toLowerCase() === 'false') {return ` ${name}="false"`;}

        // Regular strings - normalize spaces
        return ` ${name}="${trimmedValue.replace(/\s+/g, ' ')}"`;
      });
    });
  }
};
