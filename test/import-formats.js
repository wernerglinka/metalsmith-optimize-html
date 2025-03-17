/**
 * Module format compatibility tests for metalsmith-optimize-html
 */

import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('metalsmith-optimize-html module formats', () => {
  // Test imports, don't need metalsmith instance

  // No beforeEach needed for this test

  describe('ESM import compatibility', () => {
    it('should work with default import', async () => {
      // This is already tested in the main test suite, but we explicitly test it here
      const plugin = (await import('../src/index.js')).default;
      assert(typeof plugin === 'function');
      
      const instance = plugin();
      assert(typeof instance === 'function');
    });

    it('should work with import from package root', async function () {
      try {
        // This test will only work after build when the package is properly set up
        const plugin = (await import('../lib/index.modern.js')).default;
        assert(typeof plugin === 'function');
        
        const instance = plugin();
        assert(typeof instance === 'function');
      } catch (err) {
        // Skip if lib doesn't exist yet (during development)
        if (err.code === 'ERR_MODULE_NOT_FOUND') {
          this.skip();
        } else {
          throw err;
        }
      }
    });
  });

  // Testing CJS requires a separate test file with require()
  // This test just verifies our exports configuration makes sense
  describe('CommonJS export configuration', () => {
    it('should have correct exports field in package.json', async () => {
      const packageJson = JSON.parse(
        await import('node:fs/promises').then(fs => 
          fs.readFile(join(__dirname, '..', 'package.json'), 'utf8')
        )
      );
      
      assert(packageJson.exports, 'package.json should have exports field');
      assert(packageJson.exports.import, 'exports should define import field');
      assert(packageJson.exports.require, 'exports should define require field');
      
      assert.strictEqual(
        packageJson.exports.import, 
        './lib/index.modern.js', 
        'import should point to ESM build'
      );
      
      assert.strictEqual(
        packageJson.exports.require, 
        './lib/index.cjs', 
        'require should point to CommonJS build'
      );
    });
  });
});