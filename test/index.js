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
  });
});
