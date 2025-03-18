/**
 * Comment optimization module
 * Removes HTML comments when enabled
 *
 * @module comment-optimizer
 *
 * Implements a simple HTML comment removal:
 * - Removes all <!-- --> style comments from HTML
 * - Preserves conditional comments by default (can be configured)
 * - Enable with removeComments: true
 */

import { createRegexOptimizer } from '../optimizer-factory.js';

// Regex to match HTML comments
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;

/**
 * Creates the comment optimizer using the factory
 */
export const commentOptimizer = createRegexOptimizer(
  'comment', // Optimizer name
  'removeComments', // Option flag
  COMMENT_REGEX, // Pattern to match
  '' // Replace with empty string
);
