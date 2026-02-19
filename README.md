# Metalsmith Optimize HTML

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![Coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-optimize-html/badge.svg)](https://snyk.io/test/npm/metalsmith-optimize-html)

> A Metalsmith plugin for optimizing and minifying HTML files

A modern, modular HTML optimizer for Metalsmith that reduces file sizes by removing unnecessary whitespace, comments, and redundant markup while preserving functionality.

## Features

- **Modular Architecture**: Enable only the optimizations you need
- **Dual Module Support**: Works with both ESM and CommonJS imports
- **Safe Optimizations**: Preserves functionality while reducing file size
- **Comprehensive Options**: Fine-grained control over optimizations
- **Tag Exclusion**: Exclude specific tags from optimization
- **Validation**: Robust input validation with helpful error messages
- **Reliable Compatibility**: Fixed in v0.5.3 to work correctly in CommonJS environments
- **ESM and CommonJS support**:
  - ESM: `import optimizeHTML from 'metalsmith-optimize-html'`;
  - CommonJS: `const optimizeHTML = require('metalsmith-optimize-html'`;')`

## Why this plugin?

[Metalsmith HTML Minifier](https://github.com/whymarrh/metalsmith-html-minifier) was historically the standard plugin for HTML optimization, but it became abandoned with security issues. This plugin is built from scratch with modern JavaScript practices, a functional approach, and minimal dependencies. It offers more granular control over optimizations while maintaining better security and compatibility with current projects.

## Installation

```bash
npm install metalsmith-optimize-html
```

## Usage

### JavaScript API

```javascript
Metalsmith(__dirname).use(
  optimizeHTML({
    // options
    removeComments: true,
    removeTagSpaces: true
  })
);
```

### CLI Usage

In your `metalsmith.json`:

```json
{
  "plugins": {
    "metalsmith-optimize-html": {
      "removeComments": true,
      "removeTagSpaces": true,
      "simplifyDoctype": true
    }
  }
}
```

## Examples

### Basic Usage

```javascript
import Metalsmith from 'metalsmith';
import optimizeHTML from 'metalsmith-optimize-html';

Metalsmith(__dirname)
  .use(
    optimizeHTML({
      removeComments: true,
      removeTagSpaces: true
    })
  )
  .build((err) => {
    if (err) throw err;
    console.log('Build complete!');
  });
```

### Aggressive Optimization

Enable all optimizations for maximum compression:

```javascript
Metalsmith(__dirname)
  .use(
    optimizeHTML({
      aggressive: true
    })
  )
  .build();
```

### Custom Configuration

Fine-tune specific optimizations:

```javascript
Metalsmith(__dirname)
  .use(
    optimizeHTML({
      removeComments: true,
      removeTagSpaces: true,
      normalizeBooleanAttributes: true,
      cleanUrlAttributes: true,
      removeProtocols: true,
      removeDefaultAttributes: true,
      simplifyDoctype: true,
      safeRemoveAttributeQuotes: true,
      pattern: '**/*.html', // Only process HTML files
      excludeTags: ['pre', 'code'] // Preserve content in these tags
    })
  )
  .build();
```

### With Site-wide Configuration

Use Metalsmith metadata for global settings:

```javascript
Metalsmith(__dirname)
  .metadata({
    htmlOptimization: {
      removeComments: true,
      removeTagSpaces: true
    }
  })
  .use(
    optimizeHTML({
      // Local options will override metadata settings
      simplifyDoctype: true
    })
  )
  .build();
```

### Production vs Development

```javascript
const isProduction = process.env.NODE_ENV === 'production';

Metalsmith(__dirname)
  .use(
    optimizeHTML({
      aggressive: isProduction,
      removeComments: isProduction,
      // Keep readable formatting in development
      removeTagSpaces: isProduction
    })
  )
  .build();
```

### Before and After

**Input HTML:**

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
  <head>
    <!-- This is a comment -->
    <title>My Website</title>
    <script type="text/javascript" src="app.js"></script>
  </head>
  <body>
    <div class="container" id="main">
      <p>Hello world!</p>
      <input type="checkbox" checked="checked" />
    </div>
  </body>
</html>
```

**Output HTML (with aggressive optimization):**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
    <script src="app.js"></script>
  </head>
  <body>
    <div class="container" id="main">
      <p>Hello world!</p>
      <input type="checkbox" checked />
    </div>
  </body>
</html>
```

## Options

The plugin validates all options for correct types and will throw detailed error messages if invalid options are provided. This helps catch configuration mistakes early.

### Core Optimization (Always On)

#### Whitespace normalization

- Collapses multiple whitespace to single space
- Removes whitespace between HTML tags
- Preserves whitespace in `<pre>`, `<code>`, `<textarea>`, `<script>`, `<style>` tags

### Optional Optimizations

**removeComments**: boolean (default: false)

- Removes all HTML comments

```html
<!-- This comment will be removed -->
```

**removeTagSpaces**: boolean (default: false)

- Removes extra spaces inside HTML tags
- Normalizes spaces between attributes

```html
<div class="example" id="test">
  <!-- becomes -->
  <div class="example" id="test"></div>
</div>
```

**removeDefaultAttributes**: boolean (default: false)

- Removes common default attributes that browsers assume anyway

```html
<script type="text/javascript" src="main.js">
<link type="text/css" rel="stylesheet">
<form method="get">
<input type="text">
<!-- becomes -->
<script src="main.js">
<link rel="stylesheet">
<form>
<input>
```

**normalizeBooleanAttributes**: boolean (default: false)

- Normalizes boolean attributes to their shorter form

```html
<input type="checkbox" checked="checked" disabled="disabled" />
<select multiple="multiple">
  <!-- becomes -->
  <input type="checkbox" checked disabled />
  <select multiple></select>
</select>
```

**cleanUrlAttributes**: boolean (default: false)

- Cleans and normalizes URLs in href, src, action, srcset, and data attributes
- Removes unnecessary whitespace in URLs

```html
<a href="  https://example.com/page   ">
  <!-- becomes -->
  <a href="https://example.com/page"></a
></a>
```

**cleanDataAttributes**: boolean (default: false)

- Normalizes whitespace in data-\* attribute values
- Maintains valid JSON in data attributes

```html
<div data-config='{ "key" :  "value" }'>
  <!-- becomes -->
  <div data-config='{"key":"value"}'></div>
</div>
```

**removeEmptyAttributes**: boolean (default: false)

- Removes attributes with empty values

```html
<div id="" class="   " data-value="">
  <!-- becomes -->
  <div></div>
</div>
```

**removeProtocols**: boolean (default: false)

- Converts URLs to protocol-relative URLs
- Preserves protocols in links with `rel="external"`

```html
<a href="https://example.com">
  <a href="http://example.com" rel="external">
    <!-- becomes -->
    <a href="//example.com"> <a href="http://example.com" rel="external"></a></a></a
></a>
```

**simplifyDoctype**: boolean (default: false)

- Replaces any DOCTYPE declaration with `HTML5 DOCTYPE`

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<!-- becomes -->
<!DOCTYPE html>
```

**safeRemoveAttributeQuotes**: boolean (default: false)

- Only removes quotes if value contains no special characters
- Preserves quotes for values with spaces, brackets, etc.

```html
<div class="example" id="test" data-value='{"key":"value"}'>
  <!-- becomes -->
  <div class="example" id="test" data-value='{"key":"value"}'></div>
</div>
```

**aggressive**: boolean (default: false)

- Enables all optimizations with a single option:
  - removeComments
  - removeTagSpaces
  - removeDefaultAttributes
  - normalizeBooleanAttributes
  - cleanUrlAttributes
  - cleanDataAttributes
  - removeEmptyAttributes
  - removeProtocols
  - simplifyDoctype
  - safeRemoveAttributeQuotes

```javascript
Metalsmith(__dirname).use(optimizeHTML({ aggressive: true }));
```

All individual option settings are ignored when aggressive is true, except when explicitly overridden:

```javascript
Metalsmith(__dirname).use(
  optimizeHTML({
    aggressive: true,
    removeComments: false // This override will be respected
  })
);
```

## Debugging

Debug messages can be enabled by setting the DEBUG environment variable.

```bash
metalsmith.env( 'DEBUG', 'metalsmith-optimize-html' );
```

## Limitations and Edge Cases

### Malformed HTML Comments

- The plugin cannot safely handle nested or malformed HTML comments
- If a comment is not properly closed, it might affect subsequent content

### Preserved Content

- Content within `<pre>`, `<code>`, `<textarea>`, `<script>`, and `<style>` tags is preserved
- Whitespace and formatting within these tags remains untouched

### URL Processing

- Protocol removal only affects `http://` and `https://` protocols
- Other protocols (`ftp://`, `ws://`, etc.) remain unchanged
- Handles URLs in meta tags (`og:url`, `twitter:url`, `canonical`)
- Processes SVG attributes (`xmlns`, `xlink:href`, `href`, `src`)

### Data Attributes

- JSON values in data attributes must be valid JSON
- Invalid JSON structures are left unchanged

## Test Coverage

This project maintains high statement and line coverage for the source code. Coverage is automatically verified and updated via GitHub Actions using the c8 coverage tool.

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 95%        | 87%      | 89%       | 95%   |

## Author

[werner@glinka.co](https://github.com/wernerglinka)

## License

[MIT](LICENSE)

## Development transparency

Portions of this project were developed with the assistance of AI tools including Claude and Claude Code. These tools were used to:

- Generate or refactor code
- Assist with documentation
- Troubleshoot bugs and explore alternative approaches

All AI-assisted code has been reviewed and tested to ensure it meets project standards. See the included [CLAUDE.md](CLAUDE.md) file for more details.

[npm-badge]: https://img.shields.io/npm/v/metalsmith-optimize-html.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-optimize-html
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-optimize-html
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-95%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-optimize-html/blob/master/README.md
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue
