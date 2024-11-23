/**
 * Metalsmith plugin for HTML optimization
 */

//import { minimatch } from 'minimatch';

/**
 * Base configuration options
 * @constant {Object}
 */
const BASE_OPTIONS = {
  pattern: '**/*.html',
  excludeTags: []
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

      const debug = metalsmith.debug( 'metalsmith-optimize-html' );
      debug( 'running with options: %O', options );

      const activeOptimizers = plugin._testOptimizers || optimizers;

      Object.entries( files ).forEach( ( [ filename, file ] ) => {
        if ( metalsmith.match( filename, options.pattern ) ) {
          let content = file.contents.toString();

          // Handle excluded tags if any are specified
          if ( options.excludeTags && options.excludeTags.length > 0 ) {
            const preserved = [];
            const excludePattern = new RegExp(
              `<(${ options.excludeTags.join( '|' ) })[^>]*>[\\s\\S]*?</\\1>`,
              'gi'
            );

            // Preserve excluded tags
            content = content.replace( excludePattern, ( match ) => {
              preserved.push( match );
              return `___EXCLUDE_${ preserved.length - 1 }___`;
            } );

            // Apply optimizers
            content = activeOptimizers.reduce( ( result, optimizer ) =>
              optimizer.optimize( result, options ),
              content
            );

            // Restore excluded content
            content = preserved.reduce(
              ( text, preservedContent, i ) =>
                text.replace( `___EXCLUDE_${ i }___`, preservedContent ),
              content
            );
          } else {
            // Normal optimization without exclusions
            content = activeOptimizers.reduce( ( result, optimizer ) =>
              optimizer.optimize( result, options ),
              content
            );
          }

          file.contents = Buffer.from( content );
        }
      } );
      done();
    } catch ( error ) {
      done( error );
    }
  };

  plugin._testOptimizers = null;
  return plugin;
}
