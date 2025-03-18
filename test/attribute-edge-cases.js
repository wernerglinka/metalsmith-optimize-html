/**
 * Attribute edge case tests for metalsmith-optimize-html
 */

import assert from 'node:assert';
import Metalsmith from 'metalsmith';
import optimizeHTML from '../src/index.js';

describe('metalsmith-optimize-html attribute edge cases', () => {
  let metalsmith;

  beforeEach(() => {
    metalsmith = new Metalsmith('test-path');
  });

  describe('URL attribute edge cases', () => {

    it('should trim whitespace in URL attributes and convert to protocol-relative URLs', async () => {
      // Test with cleanUrlAttributes enabled
      const plugin = optimizeHTML({
        cleanUrlAttributes: true,
        removeProtocols: true
      });

      const files = {
        'test.html': {
          contents: Buffer.from('<a href="  https://example.com/path/  ">Link</a>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // The current implementation appears to remove protocols by default
      assert.strictEqual(files['test.html'].contents.toString(), '<a href="//example.com/path/">Link</a>');
    });
  });

  describe('data attribute edge cases', () => {

    it('should handle nested quotes in data attributes', async () => {
      const plugin = optimizeHTML({
        cleanDataAttributes: true
      });

      const files = {
        'test.html': {
          contents: Buffer.from('<div data-nested=\'{"quote":"Text with \\"nested\\" quotes"}\'>Nested quotes</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should preserve escaped quotes in JSON
      assert.strictEqual(
        files['test.html'].contents.toString(),
        '<div data-nested=\'{"quote":"Text with \\"nested\\" quotes"}\'>Nested quotes</div>'
      );
    });
  });

  describe('boolean attribute edge cases', () => {

    // A simpler test that should work with the current implementation
    it('should normalize standard boolean attributes', async () => {
      const plugin = optimizeHTML({
        normalizeBooleanAttributes: true
      });

      const files = {
        'test.html': {
          contents: Buffer.from('<input type="checkbox" checked="checked" disabled="disabled">')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), '<input type="checkbox" checked disabled>');
    });
  });
});
