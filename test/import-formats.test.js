/**
 * Module format compatibility tests for metalsmith-optimize-html
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('metalsmith-optimize-html module formats', () => {
  describe('ESM import compatibility', () => {
    it('should work with default import', async () => {
      const plugin = (await import('../src/index.js')).default;
      assert(typeof plugin === 'function');

      const instance = plugin();
      assert(typeof instance === 'function');
    });
  });
});
