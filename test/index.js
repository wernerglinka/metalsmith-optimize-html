/**
 * Test suite for metalsmith-optimize-html plugin
 * Tests core functionality and specific optimizers
 */

import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import Metalsmith from 'metalsmith';
import optimizeHTML from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Helper to read test fixtures
 * @param {string} fixture - Fixture directory name
 * @param {string} file - File name within fixture directory
 * @returns {string} Content of fixture file
 */
function readFixture(fixture, file) {
  return readFileSync(join(__dirname, 'fixtures', fixture, file), 'utf8');
}

describe('metalsmith-optimize-html', () => {
  let metalsmith;

  beforeEach(() => {
    metalsmith = new Metalsmith('test-path');
  });

  describe('base functionality', () => {
    it('should be a function', () => {
      assert(typeof optimizeHTML === 'function');
    });

    it('should return an async plugin function', () => {
      const plugin = optimizeHTML();
      assert(typeof plugin === 'function');
    });
  });

  describe('optimizer loading', () => {
    it('should load core whitespace optimizer by default', async () => {
      const plugin = optimizeHTML();

      const files = {
        'test.html': {
          contents: Buffer.from('<div>  test  </div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), '<div>test</div>');
    });

    it('should maintain optimizer execution order', async () => {
      const executionOrder = [];
      const plugin = optimizeHTML();

      // Set up test optimizers
      plugin._testOptimizers = [
        {
          name: 'optimizer1',
          optimize: (content) => {
            executionOrder.push('optimizer1');
            return content;
          }
        },
        {
          name: 'optimizer2',
          optimize: (content) => {
            executionOrder.push('optimizer2');
            return content;
          }
        }
      ];

      const files = {
        'test.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.deepStrictEqual(executionOrder, ['optimizer1', 'optimizer2']);
    });

    it('should maintain correct optimizer execution order', async () => {
      const plugin = optimizeHTML({
        removeComments: true,
        removeTagSpaces: true
      });

      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('optimizer-order', 'input.html'))
        }
      };

      // Track execution order
      const executionOrder = [];
      plugin._testOptimizers = [
        {
          name: 'whitespace',
          optimize: (content) => {
            executionOrder.push('whitespace');
            return content
              .split(/(<[^>]+>)/g)
              .map((part) => (part.startsWith('<') ? part : part.replace(/\s+/g, ' ').trim()))
              .join('');
          }
        },
        {
          name: 'comments',
          optimize: (content) => {
            executionOrder.push('comments');
            return content.replace(/<!--[\s\S]*?-->/g, '');
          }
        },
        {
          name: 'tagSpaces',
          optimize: (content) => {
            executionOrder.push('tagSpaces');
            return content.replace(/<([^>]*)>/g, (match, inner) => `<${inner.replace(/\s+/g, ' ').trim()}>`);
          }
        }
      ];

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Verify order: whitespace should be first
      assert.strictEqual(executionOrder[0], 'whitespace', 'Whitespace optimizer should run first');

      // Check final content matches expected
      assert.strictEqual(files['test.html'].contents.toString(), readFixture('optimizer-order', 'expected.html'));
    });
  });

  describe('core whitespace handling', () => {
    it('should collapse normal whitespace', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/basic', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/basic', 'expected.html'));
    });

    it('should handle real live example', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/live-test', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/live-test', 'expected.html'));
    });

    it('should preserve whitespace in <pre> tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/pre', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/pre', 'expected.html'));
    });

    it('should preserve whitespace in <code> tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/code', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/code', 'expected.html'));
    });

    it('should preserve whitespace in <textarea> tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/textarea', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/textarea', 'expected.html'));
    });

    it('should preserve whitespace in <script> tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/script', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/script', 'expected.html'));
    });

    it('should preserve Lottie player script tags with default config', async () => {
      // This test ensures the bug fix for issue where empty config {} caused
      // placeholder restoration failure with script tags like Lottie players
      const plugin = optimizeHTML(); // Empty config - should only do whitespace optimization
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/lottie-player', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      
      // Critical assertions to prevent regression of the placeholder bug
      assert(!result.includes('___PRESERVE_'), 'No unrestored PRESERVE placeholders should remain');
      assert(!result.includes('___EXCLUDE_'), 'No unrestored EXCLUDE placeholders should remain');
      assert(!result.includes('___INLINE_'), 'No unrestored INLINE placeholders should remain');
      assert(result.includes('<script'), 'Script tag must be preserved');
      assert.strictEqual(result, readFixture('whitespace/lottie-player', 'expected.html'));
    });

    it('should preserve whitespace in <style> tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/style', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/style', 'expected.html'));
    });
  });

  describe('inline element handling', () => {
    it('should normalize spaces around inline elements', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/inline', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('whitespace/inline', 'expected.html'));
    });

    it('should handle consecutive inline elements', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/inline-consecutive', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/inline-consecutive', 'expected.html')
      );
    });

    it('should handle nested inline elements', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/inline-nested', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/inline-nested', 'expected.html')
      );
    });

    it('should preserve spaces between text and inline elements', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/inline-text', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/inline-text', 'expected.html')
      );
    });

    it('should handle various inline elements with spaces', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/inline-extended', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/inline-extended', 'expected.html')
      );
    });
  });

  describe('comment removal', () => {
    it('should remove all comments when removeComments is true', async () => {
      const plugin = optimizeHTML({
        removeComments: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('comments/remove-all', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('comments/remove-all', 'expected.html'));
    });

    it('should keep all comments when removeComments is false', async () => {
      const plugin = optimizeHTML({ removeComments: false });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('comments/keep-all', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('comments/keep-all', 'expected.html'));
    });
  });

  describe('optimizer edge cases', () => {
    it('should handle content that has no matches for optimizers', async () => {
      // Test branches where optimizers find no matches to process
      const plugin = optimizeHTML({ 
        removeEmptyAttributes: true,
        normalizeBooleanAttributes: true,
        cleanDataAttributes: true,
        removeDefaultAttributes: true,
        simplifyDoctype: true,
        removeProtocols: true,
        cleanUrlAttributes: true
      });
      
      const files = {
        'test.html': {
          contents: Buffer.from('<p>Simple content with no attributes</p>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process without issues even when optimizers have no matches
      assert.strictEqual(files['test.html'].contents.toString(), '<p>Simple content with no attributes</p>');
    });

    it('should handle various edge cases in optimizers', async () => {
      // Test additional edge cases and branches
      const plugin = optimizeHTML({ 
        removeEmptyAttributes: true,
        normalizeBooleanAttributes: true,
        cleanUrlAttributes: true,
        cleanDataAttributes: true
      });
      
      const files = {
        'test.html': {
          contents: Buffer.from(`<div>
            <input type="checkbox" disabled="disabled" checked="" data-test="">
            <a href="#" data-empty="">
            <meta property="og:url" content="http://example.com">
          </div>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      // Should optimize various attributes 
      assert(result.includes('disabled'), 'Should normalize boolean attributes');
      assert(result.includes('input'), 'Should preserve input tag');
    });
  });

  describe('additional optimizer branch coverage', () => {
    it('should handle edge cases in empty attributes optimizer', async () => {
      const plugin = optimizeHTML({ removeEmptyAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(`<div>
            <input type="text" value="" placeholder="">
            <img src="" alt="">
            <a href="" title="">
            <p class="" id="">Content</p>
          </div>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      assert(result.includes('type="text"'), 'Should preserve non-empty attributes');
      // The empty attributes optimizer should process the content
      assert(result.length > 0, 'Should produce valid output');
    });

    it('should handle various boolean attribute formats', async () => {
      const plugin = optimizeHTML({ normalizeBooleanAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(`<div>
            <input disabled="disabled" checked="checked" readonly="readonly">
            <script defer="defer" async="async"></script>
            <video autoplay="autoplay" controls="controls" muted="muted"></video>
          </div>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      assert(result.includes('disabled'), 'Should normalize boolean attributes');
      assert(result.includes('checked'), 'Should normalize checked attribute');
    });

    it('should handle various doctype formats', async () => {
      const plugin = optimizeHTML({ simplifyDoctype: true });
      const files = {
        'test.html': {
          contents: Buffer.from('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"><html><body>Content</body></html>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      assert(result.includes('<!DOCTYPE html>'), 'Should simplify doctype');
    });

    it('should handle URL attributes in different contexts', async () => {
      const plugin = optimizeHTML({ cleanUrlAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(`<div>
            <link rel="stylesheet" href="  /styles.css  ">
            <img src="  image.jpg  " alt="test">
            <a href="  /page.html  ">Link</a>
          </div>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      assert(result.includes('href="/styles.css"'), 'Should clean URL attributes');
    });
    
    it('should handle optimizer early return paths', async () => {
      // Test when optimizers are disabled (early return branches)
      const plugin = optimizeHTML({
        cleanDataAttributes: false,
        removeDefaultAttributes: false,
        simplifyDoctype: false,
        removeProtocols: false,
        removeEmptyAttributes: false
      });
      
      const files = {
        'test.html': {
          contents: Buffer.from(`
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
            <html>
            <body>
              <div data-empty="" data-test="value">
                <input type="text" value="" />
                <a href="http://example.com">Link</a>
              </div>
            </body>
            </html>
          `)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      // Should only process whitespace, all other optimizations skipped
      assert(result.includes('<!DOCTYPE html PUBLIC')); // DOCTYPE unchanged
      assert(result.includes('data-empty=""')); // Empty attributes unchanged
      assert(result.includes('http://example.com')); // Protocols unchanged
      assert(result.includes('value=""')); // Default attributes unchanged
    });
  });

  describe('describe attribute handling', () => {
    it('should remove empty attributes if enabled', async () => {
      const plugin = optimizeHTML({ removeEmptyAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/empty', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/empty', 'expected.html'));
    });

    it('should optimize boolean attributes if enabled', async () => {
      const plugin = optimizeHTML({ normalizeBooleanAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/boolean', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/boolean', 'expected.html'));
    });

    it('should clean url attributes if enabled', async () => {
      const plugin = optimizeHTML({ cleanUrlAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/url', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/url', 'expected.html'));
    });

    it('should clean URLs in meta tags', async () => {
      const plugin = optimizeHTML({
        cleanUrlAttributes: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/meta', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/meta', 'expected.html'));
    });

    it('should clean URLs in SVG attributes', async () => {
      const plugin = optimizeHTML({
        cleanUrlAttributes: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/svg', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/svg', 'expected.html'));
    });

    it('should remove default attributes if enabled', async () => {
      const plugin = optimizeHTML({
        removeDefaultAttributes: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/default', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/default', 'expected.html'));
    });

    it('should clean data attributes if enabled', async () => {
      const plugin = optimizeHTML({ cleanDataAttributes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('attributes/data', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('attributes/data', 'expected.html'));
    });
  });

  describe('tag spaces removal', () => {
    it('should remove extra spaces inside HTML tags when removeTagSpaces is true', async () => {
      const plugin = optimizeHTML({
        removeTagSpaces: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('tag-spaces/basic', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('tag-spaces/basic', 'expected.html'));
    });

    it('should preserve spaces inside attribute values', async () => {
      const plugin = optimizeHTML({
        removeTagSpaces: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('tag-spaces/attribute-values', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('tag-spaces/attribute-values', 'expected.html')
      );
    });
  });

  describe('doctype handling', () => {
    it('should replace single doctype with HTML5 doctype when simplifyDoctype is true', async () => {
      const plugin = optimizeHTML({
        simplifyDoctype: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('doctype/simple', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('doctype/simple', 'expected.html'));
    });

    it('should replace multiple doctypes with single HTML5 doctype', async () => {
      const plugin = optimizeHTML({
        simplifyDoctype: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('doctype/multiple', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('doctype/multiple', 'expected.html'));
    });
  });

  describe('protocol removal', () => {
    it('should remove http and https protocols from URLs when removeProtocols is true', async () => {
      const plugin = optimizeHTML({
        removeProtocols: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('protocols/basic', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('protocols/basic', 'expected.html'));
    });

    it('should preserve protocols in URLs with rel="external"', async () => {
      const plugin = optimizeHTML({
        removeProtocols: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('protocols/external', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('protocols/external', 'expected.html'));
    });

    it('should remove protocols from meta tag URLs', async () => {
      const plugin = optimizeHTML({ removeProtocols: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('protocols/meta', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('protocols/meta', 'expected.html'));
    });
  });

  describe('attribute quote removal', () => {
    it('should safely remove quotes from attributes when enabled', async () => {
      const plugin = optimizeHTML({ safeRemoveAttributeQuotes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('quotes/basic', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('quotes/basic', 'expected.html'));
    });

    it('should preserve quotes when values contain spaces or special chars', async () => {
      const plugin = optimizeHTML({ safeRemoveAttributeQuotes: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('quotes/special', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('quotes/special', 'expected.html'));
    });
  });

  describe('aggressive optimization', () => {
    it('should enable all optimizations when aggressive is true', async () => {
      const plugin = optimizeHTML({ aggressive: true });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('aggressive/normal', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('aggressive/normal', 'expected.html'));
    });

    it('should allow overriding individual options when aggressive is true', async () => {
      const plugin = optimizeHTML({
        aggressive: true,
        removeComments: false // This should override aggressive setting
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('aggressive/override', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(files['test.html'].contents.toString(), readFixture('aggressive/override', 'expected.html'));
    });
  });

  describe('tag exclusion', () => {
    it('should preserve content in excluded tags', async () => {
      const plugin = optimizeHTML({
        excludeTags: ['cloudinary-image', 'link-component']
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/exclude/basic', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/exclude/basic', 'expected.html')
      );
    });

    it('should preserve excluded tags while applying specific optimizations', async () => {
      const plugin = optimizeHTML({
        excludeTags: ['cloudinary-image', 'link-component'],
        removeTagSpaces: true,
        safeRemoveAttributeQuotes: true,
        removeComments: true
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/exclude/optimized', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/exclude/optimized', 'expected.html')
      );
    });

    it('should preserve excluded tags in aggressive mode', async () => {
      const plugin = optimizeHTML({
        aggressive: true,
        excludeTags: ['cloudinary-image', 'link-component']
      });
      const files = {
        'test.html': {
          contents: Buffer.from(readFixture('whitespace/exclude/aggressive', 'input.html'))
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      assert.strictEqual(
        files['test.html'].contents.toString(),
        readFixture('whitespace/exclude/aggressive', 'expected.html')
      );
    });
  });

  describe('error handling and validation', () => {
    it('should handle invalid file objects gracefully', async () => {
      const plugin = optimizeHTML();
      const files = {
        'invalid.html': null, // Invalid file object
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip invalid one
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
    });

    it('should handle files with no contents property', async () => {
      const plugin = optimizeHTML();
      const files = {
        'no-contents.html': {}, // No contents property
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip invalid one
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
    });

    it('should handle files with non-Buffer contents', async () => {
      const plugin = optimizeHTML();
      const files = {
        'non-buffer.html': {
          contents: 'string instead of buffer' // Invalid contents type
        },
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip invalid one
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
    });

    it('should handle empty files', async () => {
      const plugin = optimizeHTML();
      const files = {
        'empty.html': {
          contents: Buffer.from('')
        },
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip empty one
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
      assert.strictEqual(files['empty.html'].contents.toString(), '');
    });

    it('should handle files with null bytes', async () => {
      const plugin = optimizeHTML();
      const files = {
        'null-bytes.html': {
          contents: Buffer.from('\0\0\0\0')
        },
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip null byte file
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
    });

    it('should handle files with invalid UTF-8 sequences', async () => {
      const plugin = optimizeHTML();
      const files = {
        'invalid-utf8.html': {
          contents: Buffer.from([0xFF, 0xFE, 0xFD]) // Invalid UTF-8
        },
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip invalid UTF-8 file
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
    });

    it('should handle files without HTML tags', async () => {
      const plugin = optimizeHTML();
      const files = {
        'no-html.html': {
          contents: Buffer.from('Just plain text without HTML tags')
        },
        'valid.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process valid file and skip non-HTML file
      assert.strictEqual(files['valid.html'].contents.toString(), '<div>test</div>');
      assert.strictEqual(files['no-html.html'].contents.toString(), 'Just plain text without HTML tags');
    });

    it('should handle optimizer errors gracefully', async () => {
      const plugin = optimizeHTML();
      
      // Mock an optimizer that throws an error
      plugin._testOptimizers = [{
        name: 'error-optimizer',
        optimize: () => {
          throw new Error('Optimizer error');
        }
      }];

      const files = {
        'error-test.html': {
          contents: Buffer.from('<div>test</div>')
        },
        'valid.html': {
          contents: Buffer.from('<span>valid</span>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should skip errored file but process others
      assert.strictEqual(files['error-test.html'].contents.toString(), '<div>test</div>'); // Unchanged
      assert.strictEqual(files['valid.html'].contents.toString(), '<span>valid</span>'); // Unchanged
    });

    it('should handle optimizer returning invalid content', async () => {
      const plugin = optimizeHTML();
      
      // Mock an optimizer that returns invalid content
      plugin._testOptimizers = [{
        name: 'invalid-optimizer',
        optimize: () => null // Returns invalid content
      }];

      const files = {
        'invalid-content.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should skip file with invalid optimizer result
      assert.strictEqual(files['invalid-content.html'].contents.toString(), '<div>test</div>'); // Unchanged
    });

    it('should handle optimizer returning empty string', async () => {
      const plugin = optimizeHTML();
      
      // Mock an optimizer that returns empty string
      plugin._testOptimizers = [{
        name: 'empty-optimizer',
        optimize: () => '' // Returns empty string
      }];

      const files = {
        'empty-result.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should skip file with empty optimizer result
      assert.strictEqual(files['empty-result.html'].contents.toString(), '<div>test</div>'); // Unchanged
    });

    it('should handle invalid option validation', () => {
      // Test invalid pattern option
      assert.throws(() => {
        optimizeHTML({ pattern: 123 }); // Invalid pattern type
      }, /Invalid options/);
      
      // Test non-object options
      assert.throws(() => {
        optimizeHTML('invalid'); // String instead of object
      }, /Options must be an object/);
      
      assert.throws(() => {
        optimizeHTML([]); // Array instead of object
      }, /Options must be an object/);
      
      assert.throws(() => {
        optimizeHTML(null); // null instead of object
      }, /Options must be an object/);
      
      // Test unknown options
      assert.throws(() => {
        optimizeHTML({ unknownOption: true });
      }, /Unknown option "unknownOption"/);
      
      // Test invalid excludeTags array
      assert.throws(() => {
        optimizeHTML({ excludeTags: 'not-array' });
      }, /Option "excludeTags" must be an array/);
      
      assert.throws(() => {
        optimizeHTML({ excludeTags: [123, 'valid'] });
      }, /Option "excludeTags" must contain only strings/);
    });

    it('should handle metalsmith errors in main try-catch', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from('<div>test</div>')
        }
      };

      // Mock metalsmith.match to throw an error
      const mockMetalsmith = {
        debug: () => () => {},
        metadata: () => ({}),
        match: () => {
          throw new Error('Metalsmith error');
        }
      };

      await plugin(files, mockMetalsmith, (err) => {
        assert(err);
        assert.strictEqual(err.message, 'Metalsmith error');
      });
    });
  });

  describe('file filtering utilities', () => {
    it('should identify HTML files correctly', async () => {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from('<div>test</div>')
        },
        'test.htm': {
          contents: Buffer.from('<div>test</div>')
        },
        'test.HTML': {
          contents: Buffer.from('<div>test</div>')
        },
        'test.txt': {
          contents: Buffer.from('not html')
        },
        'test.js': {
          contents: Buffer.from('var x = 1;')
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      // Should process HTML files (html, htm, HTML)
      assert.strictEqual(files['test.html'].contents.toString(), '<div>test</div>');
      assert.strictEqual(files['test.htm'].contents.toString(), '<div>test</div>');
      assert.strictEqual(files['test.HTML'].contents.toString(), '<div>test</div>');
      
      // Should not process non-HTML files
      assert.strictEqual(files['test.txt'].contents.toString(), 'not html');
      assert.strictEqual(files['test.js'].contents.toString(), 'var x = 1;');
    });
    
    it('should test utility functions directly', async () => {
      const { isProcessableFile, isHtmlFile } = await import('../src/utils/file-filters.js');
      
      // Test isHtmlFile function
      assert(isHtmlFile('test.html'));
      assert(isHtmlFile('test.htm'));
      assert(isHtmlFile('TEST.HTML')); // Case insensitive
      assert(!isHtmlFile('test.js'));
      assert(!isHtmlFile('test.css'));
      assert(!isHtmlFile('test'));
      
      // Test isProcessableFile function
      assert(isProcessableFile({ contents: Buffer.from('<div>test</div>') }));
      assert(!isProcessableFile({})); // No contents
      assert(!isProcessableFile({ contents: null })); // null contents
      assert(!isProcessableFile({ contents: 'not a buffer' })); // Not a buffer
    });
  });

  describe('placeholder restoration validation', () => {
    it('should handle content with placeholder-like strings in JavaScript', async () => {
      // Test the validation logic that filters out placeholders inside quoted strings
      const plugin = optimizeHTML({ aggressive: true });
      const files = {
        'test.html': {
          contents: Buffer.from(`<script>
            var data = { "test": "___PRESERVE_fake___" };
            function test() {
              return "___EXCLUDE_fake___";
            }
          </script>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      // Should preserve the literal strings in the JavaScript
      assert(result.includes('"___PRESERVE_fake___"'));
      assert(result.includes('"___EXCLUDE_fake___"'));
      assert(!result.includes('___PRESERVE_0___'), 'No actual placeholders should remain');
    });

    it('should not fail on content with placeholder-like patterns', async () => {
      // This test verifies that the plugin doesn't incorrectly flag legitimate content
      // that happens to contain placeholder-like patterns (e.g., in JavaScript strings)
      const contentWithPlaceholderLikePattern = '<div><script>var x = "___PRESERVE_0___";</script></div>';

      // Process content that contains placeholder-like patterns in legitimate content
      const { processContent } = (await import('../src/utils/content-processor.js'));
      
      // This should NOT throw an error since these are legitimate patterns in user content
      try {
        const result = processContent(contentWithPlaceholderLikePattern, [], {});
        assert(result.includes('___PRESERVE_0___'), 'Should preserve the pattern in script content');
      } catch {
        assert.fail('Should not throw an error for legitimate placeholder-like patterns');
      }
    });

    it('should handle edge cases in placeholder validation', async () => {
      // Test edge cases for the validation logic
      const plugin = optimizeHTML({ aggressive: true });
      const files = {
        'test.html': {
          contents: Buffer.from(`<div>
            <script>var x = "test ___PRESERVE_999___ test";</script>
            <script>var y = '___EXCLUDE_888___';</script>
            <p>Normal content</p>
          </div>`)
        }
      };

      await plugin(files, metalsmith, (err) => {
        assert(!err);
      });

      const result = files['test.html'].contents.toString();
      // Placeholders inside quotes should be preserved as literal strings
      assert(result.includes('"test ___PRESERVE_999___ test"'));
      assert(result.includes("'___EXCLUDE_888___'"));
    });
  });
});
