# Metalsmith HTML Optimizer Notes

## Architecture

### Module Structure
- Source code is in `src/` directory
- Built output in `lib/` directory
- Dual module support (ESM and CommonJS)
- Tests in `test/` directory

### Optimizer Registry
- Centralized registry in `optimizer-registry.js`
- Dynamically loads optimizers based on configuration
- Caches optimizers for performance
- Provides error handling for optimizer loading

### Factory System
- Factory functions in `optimizer-factory.js`
- Creates standardized optimizer objects
- Supports various optimizer patterns:
  - Basic optimizers (`createOptimizer`)
  - Regex-based optimizers (`createRegexOptimizer`)
  - Tag-level optimizers (`createTagOptimizer`)
  - Attribute-level optimizers (`createAttributeOptimizer`)

### Validation
- Configuration validation in `validate-options.js`
- Type checking for all options
- Early detection of configuration errors
- Detailed error messages for misconfigured options

## Design Decisions

### Comment Handling
- Only valid HTML comments are supported
- Malformed or unclosed comments are not processed
- Reasoning: Processing invalid HTML comments could lead to unintended content removal and it's impossible to determine the original author's intent

### Optimizer Structure
- Core whitespace optimization is always applied
- Additional optimizers are loaded dynamically based on options
- New optimizers can be added by:
  1. Creating a new file in the `optimizers` directory
  2. Adding the corresponding option flag to `OPTIMIZER_MAP`
  3. Using factory functions for consistent structure

## Available Optimizers

### Whitespace (Core)
- Always active
- Collapses whitespace while preserving content in `<pre>` and `<code>` tags
- Removes spaces between HTML tags
- Trims leading/trailing whitespace

### Comment Removal
```javascript
{
  removeComments: true  // Remove HTML comments
}
```

### Empty Attribute Removal
```javascript
{
  removeEmptyAttributes: true   // Remove attributes with empty values
                               // Preserves empty alt and value attributes
}
```

### Boolean Attribute Optimization
```javascript
{
  normalizeBooleanAttributes: true   // Simplify boolean attributes
                                    // disabled="disabled" → disabled
                                    // checked="true" → checked
                                    // disabled="false" → removed
}
```

### URL Attributes
```javascript
{
  cleanUrlAttributes: true  // Normalize and clean URL attributes
}
```

### Data Attributes
```javascript
{
  cleanDataAttributes: true  // Normalize data-* attributes
                            // Format JSON values consistently
}
```

### Tag Spaces
```javascript
{
  removeTagSpaces: true  // Remove extra spaces inside HTML tags
}
```

### Default Attributes
```javascript
{
  removeDefaultAttributes: true  // Remove redundant default attributes
}
```

### Doctype
```javascript
{
  simplifyDoctype: true  // Normalize doctype to HTML5
}
```

### Protocols
```javascript
{
  removeProtocols: true  // Convert URLs to protocol-relative
}
```

### Attribute Quotes
```javascript
{
  safeRemoveAttributeQuotes: true  // Remove unnecessary quotes
}
```

## Creating New Optimizers

### Using Factory Functions
```javascript
import { createRegexOptimizer } from '../optimizer-factory.js';

// Regex to match pattern
const PATTERN = /<!--[\s\S]*?-->/g;

// Create the optimizer
export const commentOptimizer = createRegexOptimizer(
  'comment',           // Optimizer name
  'removeComments',    // Option flag
  PATTERN,             // Pattern to match
  ''                   // Replace with empty string
);
```

## Option Validation

All options are validated for type and validity. For example:

```javascript
// This will throw an error with clear message
optimizeHTML({
  pattern: 123,               // Error: pattern must be a string
  excludeTags: 'pre,code',    // Error: excludeTags must be an array
  unknownOption: true         // Error: unknown option
});
```

## Development Guidelines
- Each optimizer should be in its own file
- Use the factory functions for consistent interfaces
- Include comprehensive tests with edge cases
- Document limitations and assumptions
- Validate inputs early

## Testing Approach

This plugin uses Metalsmith's recommended testing approach combined with thorough edge case testing:

- Test with simple and complex HTML
- Test edge cases and error conditions
- Test performance with large files
- Test dual module support (ESM and CommonJS)

### Example Test

```javascript
import Metalsmith from 'metalsmith';
import assert from 'node:assert';
import optimizeHTML from '../src/index.js';

describe('metalsmith-optimize-html', function() {
  let metalsmith;

  beforeEach(function() {
    metalsmith = new Metalsmith('test-path');
  });

  it('should handle edge cases', async function() {
    const plugin = optimizeHTML({
      removeComments: true,
      excludeTags: ['pre', 'code']
    });
    
    const files = {
      'test.html': {
        contents: Buffer.from('<div><!-- comment -->test</div>')
      }
    };

    await plugin(files, metalsmith, (err) => {
      assert(!err);
    });
    
    assert.strictEqual(
      files['test.html'].contents.toString(),
      '<div>test</div>'
    );
  });
});
```