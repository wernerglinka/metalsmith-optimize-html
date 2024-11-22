/**
 * Test suite for metalsmith-optimize-html plugin
 * Tests core functionality and specific optimizers
 */

import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import Metalsmith from 'metalsmith';
import optimizeHTML from '../lib/index.js';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

/**
 * Helper to read test fixtures
 * @param {string} fixture - Fixture directory name
 * @param {string} file - File name within fixture directory
 * @returns {string} Content of fixture file
 */
function readFixture( fixture, file ) {
  return readFileSync( join( __dirname, 'fixtures', fixture, file ), 'utf8' );
}

describe( 'metalsmith-optimize-html', function() {
  let metalsmith;

  beforeEach( function() {
    metalsmith = new Metalsmith( 'test-path' );
  } );

  describe( 'base functionality', function() {
    it( 'should be a function', function() {
      assert( typeof optimizeHTML === 'function' );
    } );

    it( 'should return an async plugin function', function() {
      const plugin = optimizeHTML();
      assert( typeof plugin === 'function' );
    } );

  } );

  describe( 'optimizer loading', function() {
    it( 'should load core whitespace optimizer by default', async function() {
      const plugin = optimizeHTML();

      const files = {
        'test.html': {
          contents: Buffer.from( '<div>  test  </div>' )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        '<div>test</div>'
      );
    } );

    it( 'should maintain optimizer execution order', async function() {
      const executionOrder = [];
      const plugin = optimizeHTML();

      // Set up test optimizers
      plugin._testOptimizers = [
        {
          name: 'optimizer1',
          optimize: ( content ) => {
            executionOrder.push( 'optimizer1' );
            return content;
          }
        },
        {
          name: 'optimizer2',
          optimize: ( content ) => {
            executionOrder.push( 'optimizer2' );
            return content;
          }
        }
      ];

      const files = {
        'test.html': {
          contents: Buffer.from( '<div>test</div>' )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.deepStrictEqual( executionOrder, [ 'optimizer1', 'optimizer2' ] );
    } );

    it( 'should maintain correct optimizer execution order', async function() {
      const plugin = optimizeHTML( {
        removeComments: true,
        removeTagSpaces: true
      } );

      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'optimizer-order', 'input.html' ) )
        }
      };

      // Track execution order
      const executionOrder = [];
      plugin._testOptimizers = [
        {
          name: 'whitespace',
          optimize: ( content ) => {
            executionOrder.push( 'whitespace' );
            return content
              .split( /(<[^>]+>)/g )
              .map( part => part.startsWith( '<' ) ? part : part.replace( /\s+/g, ' ' ).trim() )
              .join( '' );
          }
        },
        {
          name: 'comments',
          optimize: ( content ) => {
            executionOrder.push( 'comments' );
            return content.replace( /<!--[\s\S]*?-->/g, '' );
          }
        },
        {
          name: 'tagSpaces',
          optimize: ( content ) => {
            executionOrder.push( 'tagSpaces' );
            return content.replace( /<([^>]*)>/g, ( match, inner ) =>
              `<${ inner.replace( /\s+/g, ' ' ).trim() }>`
            );
          }
        }
      ];

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      // Verify order: whitespace should be first
      assert.strictEqual( executionOrder[ 0 ], 'whitespace', 'Whitespace optimizer should run first' );

      // Check final content matches expected
      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'optimizer-order', 'expected.html' )
      );
    } );
  } );

  describe( 'core whitespace handling', function() {
    it( 'should collapse normal whitespace', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/basic', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/basic', 'expected.html' )
      );
    } );

    it( 'should handle real live example', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/live-test', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/live-test', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <pre> tags', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/pre', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/pre', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <code> tags', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/code', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/code', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <textarea> tags', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/textarea', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/textarea', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <script> tags', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/script', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/script', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <style> tags', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/style', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/style', 'expected.html' )
      );
    } );

  } );

  describe( 'inline element handling', function() {
    it( 'should normalize spaces around inline elements', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/inline', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/inline', 'expected.html' )
      );
    } );

    it( 'should handle consecutive inline elements', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/inline-consecutive', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/inline-consecutive', 'expected.html' )
      );
    } );

    it( 'should handle nested inline elements', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/inline-nested', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/inline-nested', 'expected.html' )
      );
    } );

    it( 'should preserve spaces between text and inline elements', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/inline-text', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/inline-text', 'expected.html' )
      );
    } );

    it( 'should handle various inline elements with spaces', async function() {
      const plugin = optimizeHTML();
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'whitespace/inline-extended', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'whitespace/inline-extended', 'expected.html' )
      );
    } );
  } );

  describe( 'comment removal', function() {
    it( 'should remove all comments when removeComments is true', async function() {
      const plugin = optimizeHTML( {
        removeComments: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'comments/remove-all', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'comments/remove-all', 'expected.html' )
      );
    } );

    it( 'should keep all comments when removeComments is false', async function() {
      const plugin = optimizeHTML( { removeComments: false } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'comments/keep-all', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'comments/keep-all', 'expected.html' )
      );
    } );
  } );

  describe( 'describe attribute handling', function() {
    it( 'should remove empty attributes if enabled', async function() {
      const plugin = optimizeHTML( { removeEmptyAttributes: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/empty', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/empty', 'expected.html' )
      );
    } );

    it( 'should optimize boolean attributes if enabled', async function() {
      const plugin = optimizeHTML( { normalizeBooleanAttributes: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/boolean', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/boolean', 'expected.html' )
      );
    } );

    it( 'should clean url attributes if enabled', async function() {
      const plugin = optimizeHTML( { cleanUrlAttributes: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/url', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/url', 'expected.html' )
      );
    } );

    it( 'should clean URLs in meta tags', async function() {
      const plugin = optimizeHTML( {
        cleanUrlAttributes: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/meta', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/meta', 'expected.html' )
      );
    } );

    it( 'should clean URLs in SVG attributes', async function() {
      const plugin = optimizeHTML( {
        cleanUrlAttributes: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/svg', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/svg', 'expected.html' )
      );
    } );

    it( 'should remove default attributes if enabled', async function() {
      const plugin = optimizeHTML( {
        removeDefaultAttributes: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/default', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/default', 'expected.html' )
      );
    } );

    it( 'should clean data attributes if enabled', async function() {
      const plugin = optimizeHTML( { cleanDataAttributes: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'attributes/data', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'attributes/data', 'expected.html' )
      );
    } );
  } );

  describe( 'tag spaces removal', function() {
    it( 'should remove extra spaces inside HTML tags when removeTagSpaces is true', async function() {
      const plugin = optimizeHTML( {
        removeTagSpaces: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'tag-spaces/basic', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'tag-spaces/basic', 'expected.html' )
      );
    } );

    it( 'should preserve spaces inside attribute values', async function() {
      const plugin = optimizeHTML( {
        removeTagSpaces: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'tag-spaces/attribute-values', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'tag-spaces/attribute-values', 'expected.html' )
      );
    } );
  } );

  describe( 'doctype handling', function() {
    it( 'should replace single doctype with HTML5 doctype when simplifyDoctype is true', async function() {
      const plugin = optimizeHTML( {
        simplifyDoctype: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'doctype/simple', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'doctype/simple', 'expected.html' )
      );
    } );

    it( 'should replace multiple doctypes with single HTML5 doctype', async function() {
      const plugin = optimizeHTML( {
        simplifyDoctype: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'doctype/multiple', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'doctype/multiple', 'expected.html' )
      );
    } );
  } );

  describe( 'protocol removal', function() {
    it( 'should remove http and https protocols from URLs when removeProtocols is true', async function() {
      const plugin = optimizeHTML( {
        removeProtocols: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'protocols/basic', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'protocols/basic', 'expected.html' )
      );
    } );

    it( 'should preserve protocols in URLs with rel="external"', async function() {
      const plugin = optimizeHTML( {
        removeProtocols: true
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'protocols/external', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'protocols/external', 'expected.html' )
      );
    } );
  } );

  describe( 'aggressive optimization', function() {
    it( 'should enable all optimizations when aggressive is true', async function() {
      const plugin = optimizeHTML( { aggressive: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'aggressive/normal', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'aggressive/normal', 'expected.html' )
      );
    } );

    it( 'should allow overriding individual options when aggressive is true', async function() {
      const plugin = optimizeHTML( {
        aggressive: true,
        removeComments: false // This should override aggressive setting
      } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'aggressive/override', 'input.html' ) )
        }
      };

      await plugin( files, metalsmith, ( err ) => {
        assert( !err );
      } );

      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'aggressive/override', 'expected.html' )
      );
    } );
  } );
} );
