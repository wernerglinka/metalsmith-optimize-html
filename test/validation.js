/**
 * Tests for option validation in metalsmith-optimize-html
 */

import assert from 'node:assert';
import optimizeHTML from '../src/index.js';

describe('metalsmith-optimize-html validation', () => {
  describe('option type validation', () => {
    it('should accept valid option types', () => {
      // Valid options shouldn't throw errors
      assert.doesNotThrow(() => {
        optimizeHTML({
          pattern: '**/*.html',
          excludeTags: ['pre', 'code'],
          aggressive: true,
          removeComments: false,
          removeTagSpaces: true
        });
      });
    });

    it('should reject invalid pattern type', () => {
      assert.throws(() => {
        optimizeHTML({
          pattern: 123
        });
      }, /Option "pattern" must be a string/);
    });

    it('should reject invalid excludeTags type', () => {
      assert.throws(() => {
        optimizeHTML({
          excludeTags: 'pre,code'
        });
      }, /Option "excludeTags" must be an array/);
    });

    it('should reject non-string values in excludeTags', () => {
      assert.throws(() => {
        optimizeHTML({
          excludeTags: ['pre', 123, 'code']
        });
      }, /Option "excludeTags" must contain only strings/);
    });

    it('should reject invalid aggressive type', () => {
      assert.throws(() => {
        optimizeHTML({
          aggressive: 'yes'
        });
      }, /Option "aggressive" must be a boolean/);
    });

    it('should reject invalid boolean option types', () => {
      assert.throws(() => {
        optimizeHTML({
          removeComments: 'yes'
        });
      }, /Option "removeComments" must be a boolean/);
    });
  });

  describe('unknown options', () => {
    it('should reject unknown options', () => {
      assert.throws(() => {
        optimizeHTML({
          unknownOption: true
        });
      }, /Unknown option "unknownOption"/);
    });

    it('should reject multiple unknown options', () => {
      assert.throws(() => {
        optimizeHTML({
          unknownOption1: true,
          unknownOption2: 'value'
        });
      }, /Unknown option "unknownOption1"/);
    });
  });

  describe('option combination validation', () => {
    it('should accept valid option combinations', () => {
      assert.doesNotThrow(() => {
        optimizeHTML({
          removeComments: true,
          removeEmptyAttributes: true
        });
      });
    });
  });

  describe('error formatting', () => {
    it('should format multiple errors clearly', () => {
      try {
        optimizeHTML({
          pattern: 123,
          excludeTags: 'wrong',
          unknownOption: true
        });
        assert.fail('Should have thrown an error');
      } catch (error) {
        const message = error.message;
        assert(message.includes('Invalid options'));
        assert(message.includes('Option "pattern" must be a string'));
        assert(message.includes('Option "excludeTags" must be an array'));
        assert(message.includes('Unknown option "unknownOption"'));
      }
    });
  });
});