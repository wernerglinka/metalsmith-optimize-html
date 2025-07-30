/**
 * File filtering utilities for metalsmith-optimize-html
 * @module utils/file-filters
 */

/**
 * Filter files by pattern before processing for better performance
 * @param {import('metalsmith').Files} files - Metalsmith files object
 * @param {string} pattern - Glob pattern to match
 * @param {import('metalsmith')} metalsmith - Metalsmith instance for matching
 * @returns {string[]} Array of matching filenames
 */
export function getMatchingFiles(files, pattern, metalsmith) {
  const filenames = Object.keys(files);
  return metalsmith.match(pattern, filenames);
}

/**
 * Check if file has valid contents for processing
 * Validates Buffer type, non-zero length, and basic content structure
 * @param {Object} file - Metalsmith file object
 * @returns {boolean} True if file can be processed
 */
export function isProcessableFile(file) {
  // Check if file object exists
  if (!file || typeof file !== 'object') {
    return false;
  }
  
  // Check if contents property exists and is a Buffer
  if (!file.contents || !Buffer.isBuffer(file.contents)) {
    return false;
  }
  
  // Check if buffer is not empty
  if (file.contents.length === 0) {
    return false;
  }
  
  // Validate that buffer can be safely converted to string
  try {
    const content = file.contents.toString('utf8');
    // Basic validation - ensure it's not just null bytes or invalid characters
    if (content.length === 0 || content === '\0'.repeat(content.length)) {
      return false;
    }
    return true;
  } catch {
    // Buffer contains invalid UTF-8 sequences
    return false;
  }
}

/**
 * Filter files by HTML extension for pre-processing optimization
 * @param {string} filename - The filename to check
 * @returns {boolean} True if file is likely HTML
 */
export function isHtmlFile(filename) {
  return /\.html?$/i.test(filename);
}