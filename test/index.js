import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import optimizeHTML from '../lib/index.js';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

/**
 * Read fixture file
 * @param {string} fixture - Fixture directory name
 * @param {string} file - File name (input.html or expected.html)
 * @returns {string} File contents
 */
function readFixture( fixture, file ) {
  return readFileSync( join( __dirname, 'fixtures', fixture, file ), 'utf8' );
}

describe( 'metalsmith-optimize-html', function() {
  it( 'should be a function', function() {
    assert( typeof optimizeHTML === 'function' );
  } );

  it( 'should return a plugin function', function() {
    const plugin = optimizeHTML();
    assert( typeof plugin === 'function' );
  } );

  describe( 'whitespace handling', function() {
    it( 'should collapse normal whitespace', function() {
      const plugin = optimizeHTML( { collapseWhitespace: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'normal-whitespace', 'input.html' ) )
        }
      };

      plugin( files, {}, () => { } );
      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'normal-whitespace', 'expected.html' )
      );
    } );

    it( 'should preserve whitespace in <pre> tags', function() {
      const plugin = optimizeHTML( { collapseWhitespace: true } );
      const input = readFixture( 'pre-tag', 'input.html' );
      const files = {
        'test.html': {
          contents: Buffer.from( input )
        }
      };

      plugin( files, {}, () => { } );
      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'pre-tag', 'expected.html' )
      );
    } );

    it( 'should handle mixed content correctly', function() {
      const plugin = optimizeHTML( { collapseWhitespace: true } );
      const files = {
        'test.html': {
          contents: Buffer.from( readFixture( 'mixed-content', 'input.html' ) )
        }
      };

      plugin( files, {}, () => { } );
      assert.strictEqual(
        files[ 'test.html' ].contents.toString(),
        readFixture( 'mixed-content', 'expected.html' )
      );
    } );

    // Add more test cases following the same pattern...
  } );
} );
