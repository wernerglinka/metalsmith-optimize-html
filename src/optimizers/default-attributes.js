/**
 * Default attributes optimization module
 * Removes default attribute values that browsers assume anyway
 * @module default-attributes-optimizer
 *   - Removes common default attributes:
 *     - script[type="text/javascript"]
 *     - style[type="text/css"]
 *     - link[type="text/css"]
 *     - form[method="get"]
 *     - input[type="text"]
 *   - Enable with removeDefaultAttributes: true
 */

export const defaultAttributesOptimizer = {
  name: 'defaultAttributes',
  optimize: (content, { removeDefaultAttributes = false } = {}) => {
    if (!removeDefaultAttributes) {
      return content;
    }

    // Map of elements to their default attributes
    const defaultAttributes = {
      script: { type: 'text/javascript' },
      style: { type: 'text/css' },
      link: { type: 'text/css' },
      form: { method: 'get' },
      input: { type: 'text' }
    };

    // Process tag by tag
    return content.replace(/<[^>]+>/g, (tag) => {
      // Don't process closing tags
      if (tag.startsWith('</')) {
        return tag;
      }

      // Get tag name
      const tagMatch = tag.match(/^<([^\s>]+)/);
      if (!tagMatch) {
        return tag;
      }
      const tagName = tagMatch[1].toLowerCase();

      // If tag has default attributes defined
      if (defaultAttributes[tagName]) {
        const defaults = defaultAttributes[tagName];
        // Remove each default attribute if present
        Object.entries(defaults).forEach(([attr, value]) => {
          const pattern = new RegExp(`\\s${attr}=["']${value}["']`, 'i');
          tag = tag.replace(pattern, '');
        });
      }

      return tag;
    });
  }
};
