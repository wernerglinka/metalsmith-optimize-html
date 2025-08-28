# metalsmith-optimize-html - AI Development Context

## MCP Server Integration (CRITICAL)

**IMPORTANT**: This plugin was created with `metalsmith-plugin-mcp-server`. When working on this plugin, AI assistants (Claude) MUST use the MCP server tools rather than creating their own implementations.

### Essential MCP Commands

```bash
# List all available templates
list-templates

# Get specific template content (use these exactly as provided)
get-template plugin/CLAUDE.md
get-template configs/release-it.json
get-template configs/eslint.config.js

# Validate plugin and get actionable recommendations
validate .

# Generate configuration files
configs .

# Show recommended configuration templates
show-template release-it
show-template eslint

# Update dependencies
update-deps .
```

### CRITICAL RULES for AI Assistants

1. **ALWAYS use MCP server templates verbatim** - Never create simplified versions
2. **ALWAYS use `list-templates` first** to see what's available
3. **ALWAYS use `get-template`** to retrieve exact template content
4. **NEVER improvise or create custom implementations** when MCP server provides templates
5. **When validation recommends templates**, use the exact commands provided
6. **If a command seems unclear**, ask the user for clarification rather than improvising

### Common Mistakes to AVOID

**❌ Wrong Approach:**
- Creating custom CLAUDE.md content instead of using `get-template plugin/CLAUDE.md`
- Scaffolding entire new plugins when you just need a template
- Making up template content or "simplifying" official templates
- Ignoring validation recommendations
- Using commands like `npx metalsmith-plugin-mcp-server scaffold ./ CLAUDE.md claude-context`

**✅ Correct Approach:**
- Use `list-templates` to see what's available
- Use `get-template <template-name>` to get exact content
- Follow validation recommendations exactly as provided
- Ask for clarification when commands seem confusing
- Always use official templates verbatim

### Quick Commands

**Quality & Validation:**
```bash
npx metalsmith-plugin-mcp-server validate . --functional  # Validate with MCP server
npm test                                                   # Run tests with coverage
npm run lint                                              # Lint and fix code
```

**Release Process:**
```bash
npm run release:patch   # Bug fixes (1.5.4 → 1.5.5)
npm run release:minor   # New features (1.5.4 → 1.6.0)  
npm run release:major   # Breaking changes (1.5.4 → 2.0.0)
```

**Development:**
```bash
npm run build          # Build ESM/CJS versions
npm run test:coverage  # Run tests with detailed coverage
```



## Plugin Overview

This plugin optimizes HTML content in Metalsmith files using configurable HTML minification and optimization strategies. It processes HTML files to reduce file size while maintaining functionality.

## Current Architecture

### Core Components

- **Main Plugin**: `src/index.js` - Primary plugin entry point
- **Utilities**: `src/utils/` - Helper functions for HTML processing
- **Tests**: `test/` - Comprehensive test suite with fixtures
- **Build Output**: `lib/` - Dual ESM/CommonJS distribution

### Key Features

- HTML minification and optimization
- Configurable optimization strategies
- Pattern-based file filtering
- Comprehensive error handling
- Debug logging support
- ESM/CommonJS dual module support

## Development Standards

### Code Organization

- Functional programming patterns preferred
- Pure functions where possible
- Explicit data flow over side effects
- Modular utility functions
- Dependency injection for testability

### Performance Considerations

- Files are filtered before expensive transformations
- Buffer handling is optimized for memory efficiency
- RegExp patterns are optimally placed
- File content validation prevents crashes

### Testing Strategy

- Mocha test framework
- Both ESM and CommonJS test coverage
- Extensive fixture-based testing (149+ test files)
- Coverage reporting with c8

## Plugin-Specific Context

### HTML Processing Pipeline

The plugin follows Metalsmith's standard pattern:
1. File filtering based on patterns
2. Content validation and preprocessing
3. HTML optimization/minification
4. Result validation and error handling

### Configuration Options

The plugin accepts various optimization options that should be well-documented with JSDoc type definitions. Current implementation includes proper options validation and sensible defaults.

### Error Handling

- Graceful handling of malformed HTML
- Buffer validation before processing
- Comprehensive error messages with context
- Debug logging for troubleshooting

## AI Assistant Guidelines

When working on this plugin:

1. **Follow existing patterns** - The codebase uses functional programming and explicit data flow
2. **Maintain performance** - Always consider file filtering and buffer handling efficiency
3. **Preserve error handling** - Don't remove existing validation and error handling
4. **Update tests** - Any changes should include corresponding test updates
5. **Follow JSDoc standards** - All functions should have proper type annotations
6. **Consider both module formats** - Changes should work in both ESM and CommonJS environments

## Common Tasks

### Adding New Optimization Features
- Add utility functions to `src/utils/`
- Update options type definitions
- Add corresponding tests with fixtures
- Update README documentation

### Performance Improvements
- Focus on file filtering efficiency
- Optimize buffer operations
- Consider memory usage patterns
- Benchmark against existing fixtures

### Debugging Issues
- Use the debug module for logging
- Check buffer validation points
- Verify file pattern matching
- Review error handling paths