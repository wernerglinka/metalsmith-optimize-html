# Metalsmith HTML Optimizer Notes

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

## Available Optimizers

### Whitespace (Core)
- Always active
- Collapses whitespace while preserving content in `<pre>` and `<code>` tags
- Removes spaces between HTML tags
- Trims leading/trailing whitespace

### Comment Removal
```javascript
{
  removeComments: true,              // Remove HTML comments
  preserveConditionalComments: true  // Keep IE conditional comments
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

## Future Considerations
- HTML validation before optimization could be recommended
- Additional optimizers:
  - URL attribute cleaning
  - Quote standardization
- Performance optimizations for large files

## Development Guidelines
- Each optimizer should be in its own file
- Follow the optimizer interface pattern
- Include comprehensive tests
- Document limitations and assumptions
