/**
 * Content processing utilities for metalsmith-optimize-html
 * @module utils/content-processor
 */

/**
 * Process content with optimizers, handling excluded tags if specified
 * @param {string} content - The HTML content to process
 * @param {import('../index.js').Optimizer[]} optimizers - The array of optimizers to apply
 * @param {import('../index.js').Options} options - Configuration options
 * @returns {string} - The processed HTML content
 */
export function processContent(content, optimizers, options) {
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
    content = optimizers.reduce((result, optimizer) => optimizer.optimize(result, options), content);

    // Restore excluded content
    return preserved.reduce(
      (text, preservedContent, i) => text.replace(`___EXCLUDE_${i}___`, preservedContent),
      content
    );
  }

  // Normal optimization without exclusions
  return optimizers.reduce((result, optimizer) => optimizer.optimize(result, options), content);
}