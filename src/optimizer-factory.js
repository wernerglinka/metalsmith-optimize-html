/**
 * Factory functions for creating HTML optimizer objects
 * @module optimizer-factory
 */

/**
 * @typedef {Object} Optimizer
 * @property {string} name - The name of the optimizer
 * @property {Function} optimize - The function that optimizes HTML content
 */

/**
 * Creates a standard HTML optimizer
 * 
 * @param {string} name - The optimizer name
 * @param {string} optionFlag - The option flag that enables this optimizer
 * @param {Function} optimizeImpl - The function that implements the optimization
 * @returns {Optimizer} - A standard optimizer object
 */
export function createOptimizer(name, optionFlag, optimizeImpl) {
  return {
    name,
    
    /**
     * Standard optimizer function that checks if it's enabled before proceeding
     * 
     * @param {string} content - HTML content to optimize
     * @param {Object} options - Configuration options
     * @returns {string} - Optimized HTML content
     */
    optimize(content, options = {}) {
      // Skip if explicitly disabled
      if (options[optionFlag] === false) {
        return content;
      }
      
      // Perform optimization
      return optimizeImpl(content, options);
    }
  };
}

/**
 * Creates a regex-based HTML optimizer
 * 
 * @param {string} name - The optimizer name
 * @param {string} optionFlag - The option flag that enables this optimizer
 * @param {RegExp} pattern - The regex pattern to match
 * @param {Function} replacer - The replacement function or string
 * @returns {Optimizer} - A regex-based optimizer
 */
export function createRegexOptimizer(name, optionFlag, pattern, replacer) {
  return createOptimizer(
    name,
    optionFlag,
    (content) => content.replace(pattern, replacer)
  );
}

/**
 * Creates a tag-level optimizer that processes HTML tags individually
 * 
 * @param {string} name - The optimizer name
 * @param {string} optionFlag - The option flag that enables this optimizer
 * @param {Function} tagProcessor - Function that processes a single tag
 * @returns {Optimizer} - A tag-level optimizer
 */
export function createTagOptimizer(name, optionFlag, tagProcessor) {
  // Regex to match HTML tags (excluding closing tags)
  const TAG_REGEX = /<[^>]+>/g;
  
  return createOptimizer(
    name,
    optionFlag,
    (content) => {
      return content.replace(TAG_REGEX, (tag) => {
        // Skip closing tags
        if (tag.startsWith('</')) {return tag;}
        
        // Process tag
        return tagProcessor(tag);
      });
    }
  );
}

/**
 * Creates an attribute-level optimizer that processes specific attributes
 * 
 * @param {string} name - The optimizer name
 * @param {string} optionFlag - The option flag that enables this optimizer
 * @param {Function} shouldProcessAttribute - Function that determines if an attribute should be processed
 * @param {Function} attributeProcessor - Function that processes an attribute's value
 * @returns {Optimizer} - An attribute-level optimizer
 */
export function createAttributeOptimizer(name, optionFlag, shouldProcessAttribute, attributeProcessor) {
  // Regex to match HTML attributes
  const ATTRIBUTE_REGEX = /\s([^\s=]+)(?:=["']([^"']*)["'])?/g;
  
  return createTagOptimizer(
    name,
    optionFlag,
    (tag) => {
      return tag.replace(ATTRIBUTE_REGEX, (match, name, value) => {
        // Skip if this attribute shouldn't be processed
        if (!shouldProcessAttribute(name, value)) {return match;}
        
        // Process attribute
        return attributeProcessor(match, name, value);
      });
    }
  );
}