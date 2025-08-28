/**
 * Content processing utilities for metalsmith-optimize-html
 * @module utils/content-processor
 */

/**
 * Validates that all placeholders have been properly restored
 * @param {string} content - The content to validate
 * @returns {Object} Validation result with any remaining placeholders
 */
function validatePlaceholderRestoration(content) {
  // Look for ANY placeholder pattern - this should catch the user's issue
  const placeholderPattern = /___(?:PRESERVE|EXCLUDE|INLINE)_\d+___/g;
  const matches = content.match(placeholderPattern) || [];
  
  if (matches.length > 0) {
    // Filter out placeholders that might be inside quoted strings
    const actualPlaceholders = [];
    
    for (const match of matches) {
      const matchIndex = content.indexOf(match);
      const beforeMatch = content.substring(0, matchIndex);
      const afterMatch = content.substring(matchIndex + match.length, matchIndex + match.length + 50);
      
      // Check if this is inside a string literal by counting quotes
      const beforeQuotes = (beforeMatch.match(/["']/g) || []).length;
      
      // If even number of quotes before, it's likely NOT inside a string
      if (beforeQuotes % 2 === 0) {
        actualPlaceholders.push({
          placeholder: match,
          context: beforeMatch.slice(-20) + match + afterMatch.slice(0, 20)
        });
      }
    }
    
    return {
      isValid: actualPlaceholders.length === 0,
      placeholders: actualPlaceholders
    };
  }
  
  return {
    isValid: true,
    placeholders: []
  };
}

/**
 * Process content with optimizers, handling excluded tags if specified
 * @param {string} content - The HTML content to process
 * @param {import('../index.js').Optimizer[]} optimizers - The array of optimizers to apply
 * @param {import('../index.js').Options} options - Configuration options
 * @returns {string} - The processed HTML content
 */
export function processContent(content, optimizers, options) {
  let result;
  
  // If we have tags to exclude from processing
  if (options.excludeTags?.length > 0) {
    const preserved = [];
    const excludePattern = new RegExp(`<(${options.excludeTags.join('|')})[^>]*>[\\s\\S]*?</\\1>`, 'gi');

    // Preserve excluded tags
    content = content.replace(excludePattern, (match) => {
      preserved.push(match);
      return `___EXCLUDE_${preserved.length - 1}___`;
    });

    // Apply optimizers
    result = optimizers.reduce((text, optimizer) => optimizer.optimize(text, options), content);

    // Restore excluded content
    result = preserved.reduce(
      (text, preservedContent, i) => text.replace(`___EXCLUDE_${i}___`, preservedContent),
      result
    );
  } else {
    // Normal optimization without exclusions
    result = optimizers.reduce((text, optimizer) => optimizer.optimize(text, options), content);
  }

  // Validate that no actual placeholders remain
  const validation = validatePlaceholderRestoration(result);
  if (!validation.isValid) {
    const details = validation.placeholders.map(p => `${p.placeholder} (context: "${p.context}")`).join('\n  ');
    throw new Error(`METALSMITH-OPTIMIZE-HTML: Placeholder restoration failed! This is a bug.\n\nRemaining placeholders:\n  ${details}\n\nPlease report this issue with the above context to: https://github.com/wernerglinka/metalsmith-optimize-html/issues`);
  }

  return result;
}