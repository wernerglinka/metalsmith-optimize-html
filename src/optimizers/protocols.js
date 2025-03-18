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
  optimize: (content, { removeProtocols = false } = {}) => {
    if (!removeProtocols) {
      return content;
    }

    // URL attributes are defined in the regex pattern below

    return content.replace(/<[^>]+>/g, (tag) => {
      // Skip tags with rel="external"
      if (tag.includes('rel="external"')) {
        return tag;
      }

      // Process URL attributes
      return tag.replace(
        /(\s(?:href|src|content|action)=["'])(https?:\/\/[^"']+)(["'])/gi,
        (match, prefix, url, quote) => `${prefix}//${url.replace(/^https?:\/\//, '')}${quote}`
      );
    });
  }
};
