/**
 * Metalsmith plugin to optimize HTML
 */

import { minimatch } from 'minimatch';

const DEFAULT_OPTIONS = {
  pattern: '**/*.html',
  removeComments: true,
  collapseWhitespace: true,
  preserveWhitespace: [ 'pre', 'code', 'script', 'style', 'textarea' ]
};

/**
 * Tokenize HTML into structural parts
 * @param {string} html
 * @returns {Array} Array of tokens with type and content
 */
function tokenize( html ) {
  const tokens = [];
  let currentPosition = 0;
  const length = html.length;

  while ( currentPosition < length ) {
    if ( html[ currentPosition ] === '<' ) {
      // Tag start
      const tagEnd = html.indexOf( '>', currentPosition );
      if ( tagEnd === -1 ) break;

      const tagContent = html.slice( currentPosition, tagEnd + 1 );
      const isClosingTag = tagContent.startsWith( '</' );
      const tagMatch = tagContent.match( /<\/?([^\s>]+)/ );
      const tagName = tagMatch ? tagMatch[ 1 ].toLowerCase() : '';

      tokens.push( {
        type: 'tag',
        content: tagContent,
        tagName,
        isClosing: isClosingTag
      } );
      currentPosition = tagEnd + 1;
    } else {
      // Text content
      let nextTag = html.indexOf( '<', currentPosition );
      if ( nextTag === -1 ) nextTag = length;

      tokens.push( {
        type: 'text',
        content: html.slice( currentPosition, nextTag )
      } );
      currentPosition = nextTag;
    }
  }
  return tokens;
}

/**
 * Process text content according to context
 * @param {string} text
 * @param {boolean} preserve
 * @returns {string}
 */
function processText( text, preserve ) {
  if ( preserve ) return text;
  return text.replace( /\s+/g, ' ' ).trim();
}

/**
 * Minify HTML content
 * @param {string} html
 * @param {Object} options
 * @returns {string}
 */
function minifyHTML( html, options ) {
  let result = html;

  // Remove comments if enabled
  if ( options.removeComments ) {
    result = result.replace( /<!--[\s\S]*?-->/g, '' );
  }

  if ( options.collapseWhitespace ) {
    const tokens = tokenize( result );
    const preserveTags = new Set( options.preserveWhitespace );
    let inPreserveTag = false;
    const preserveStack = [];

    result = tokens.map( ( token, index ) => {
      if ( token.type === 'tag' ) {
        if ( preserveTags.has( token.tagName ) ) {
          if ( token.isClosing ) {
            preserveStack.pop();
            inPreserveTag = preserveStack.length > 0;
          } else {
            preserveStack.push( token.tagName );
            inPreserveTag = true;
          }
          return token.content;
        }
        return token.content;
      } else if ( token.type === 'text' ) {
        return processText( token.content, inPreserveTag );
      }
      return token.content;
    } ).join( '' );

    // Final cleanup for spaces between tags
    if ( !inPreserveTag ) {
      result = result.replace( />\s+</g, '><' );
    }
  }

  return result;
}

/**
 * Metalsmith plugin
 */
export default function optimizeHTML( options = {} ) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return function( files, metalsmith, done ) {
    try {
      Object.entries( files ).forEach( ( [ filename, file ] ) => {
        if ( minimatch( filename, config.pattern ) ) {
          const content = file.contents.toString();
          const minified = minifyHTML( content, config );
          file.contents = Buffer.from( minified );
        }
      } );
      done();
    } catch ( error ) {
      done( error );
    }
  };
}
