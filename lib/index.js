/**
 * Metalsmith plugin for HTML optimization
 */

import { minimatch } from 'minimatch';

/**
 * Base configuration options
 * @constant {Object}
 */
const BASE_OPTIONS = {
  pattern: '**/*.html'
};

const DEFAULT_AGGRESSIVE_OPTIONS = {
  removeComments: true,
  removeTagSpaces: true,
  normalizeBooleanAttributes: true,
  cleanUrlAttributes: true,
  removeProtocols: true,
  removeDefaultAttributes: true,
  cleanDataAttributes: true,
  simplifyDoctype: true,
  safeRemoveAttributeQuotes: true
};

/**
 * Maps option flags to their corresponding optimizer files
 * Add new optimizers here by mapping their option flag to their file
 * @constant {Object}
 */
const OPTIMIZER_MAP = {
  // Core optimizer - always loaded
  whitespace: 'whitespace.js',

  // Optional optimizers - loaded based on options
  removeComments: 'comments.js',
  removeEmptyAttributes: 'empty-attributes.js',
  normalizeBooleanAttributes: 'boolean-attributes.js',
  cleanUrlAttributes: 'url-attributes.js',
  cleanDataAttributes: 'data-attributes.js',
  removeTagSpaces: 'tag-spaces.js',
  removeDefaultAttributes: 'default-attributes.js',
  simplifyDoctype: 'doctype.js',
  removeProtocols: 'protocols.js',
  safeRemoveAttributeQuotes: 'safe-attributes-quote-removal.js'
};

/**
 * Load and initialize optimizers based on configuration
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of initialized optimizers
 */
async function loadOptimizers( options ) {
  const optimizers = [];

  // Always load core whitespace optimizer
  const { whitespaceOptimizer } = await import( './optimizers/whitespace.js' );
  optimizers.push( whitespaceOptimizer );

  // Dynamically load optional optimizers based on options
  for ( const [ flag, file ] of Object.entries( OPTIMIZER_MAP ) ) {
    if ( flag === 'whitespace' ) continue; // Skip core optimizer

    if ( options[ flag ] !== false ) { // Load if option is not explicitly disabled
      try {
        const module = await import( `./optimizers/${ file }` );
        const optimizer = module[ Object.keys( module )[ 0 ] ]; // Get first export
        optimizers.push( optimizer );
      } catch ( error ) {
        console.warn( `Failed to load optimizer: ${ file }`, error );
      }
    }
  }

  return optimizers;
}

/**
 * Creates a Metalsmith plugin for HTML optimization
 *
 * @param {Object} userOptions - Configuration options
 * @param {string} userOptions.pattern - Glob pattern for matching files
 * @returns { Function; } Metalsmith plugin function
 * */
export default function optimizeHTML( userOptions = {} ) {
  let options = { ...BASE_OPTIONS };

  if ( userOptions.aggressive ) {
    options = { ...options, ...DEFAULT_AGGRESSIVE_OPTIONS, ...userOptions };
  } else {
    options = { ...options, ...userOptions };
  }

  let optimizers;

  const plugin = async function( files, metalsmith, done ) {
    try {
      // Load optimizers on first run
      if ( !optimizers ) {
        optimizers = await loadOptimizers( options );
      }

      // Allow tests to access optimizers
      const debug = metalsmith.debug( 'metalsmith-optimize-html' );
      debug( 'running with options: %O', options );

      // Use test optimizers if provided
      const activeOptimizers = plugin._testOptimizers || optimizers;

      Object.entries( files ).forEach( ( [ filename, file ] ) => {
        if ( minimatch( filename, options.pattern ) ) {
          let content = file.contents.toString();

          // Sequentially apply a series of optimizers to the content, with
          // each optimizer further refining the result.
          content = activeOptimizers.reduce( ( result, optimizer ) =>
            optimizer.optimize( result, options ),
            content
          );

          file.contents = Buffer.from( content );
        }
      } );
      done();
    } catch ( error ) {
      done( error );
    }
  };

  // Expose for testing
  plugin._testOptimizers = null;

  return plugin;
}
