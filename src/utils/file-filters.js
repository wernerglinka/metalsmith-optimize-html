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
 * @param {Object} file - Metalsmith file object
 * @returns {boolean} True if file can be processed
 */
export function isProcessableFile(file) {
  return Buffer.isBuffer(file.contents);
}

/**
 * Filter files by HTML extension for pre-processing optimization
 * @param {string} filename - The filename to check
 * @returns {boolean} True if file is likely HTML
 */
export function isHtmlFile(filename) {
  return /\.html?$/i.test(filename);
}