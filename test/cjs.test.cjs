// Minimal CommonJS test file - just verifies the CJS module works
const assert = require('node:assert').strict;

// Import the plugin using the CommonJS format
const optimizeHTML = require('../lib/index.cjs');

describe('metalsmith-optimize-html (CommonJS)', () => {
  // Verify the module loads correctly and exports a function
  it('should be properly importable as a CommonJS module', () => {
    assert.strictEqual(typeof optimizeHTML, 'function', 'Plugin should be a function when required with CommonJS');
    assert.strictEqual(typeof optimizeHTML(), 'function', 'Plugin should return a function when called');
  });
  
  // We don't need to test functionality here, just module loading
  // The ESM tests cover functionality thoroughly
});