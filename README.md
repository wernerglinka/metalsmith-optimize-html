# Metalsmith Optimize HTML

[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]

> A Metalsmith plugin for optimizing and minifying HTML files - **UNDER DEVELOPMENT**

Build with lots of inspiration from [htmlcompressor](https://code.google.com/archive/p/htmlcompressor/). This plugin optimizes HTML files by removing unnecessary whitespace, comments, and attributes. It also normalizes URLs, boolean attributes, and data attributes.

## Why this plugin?
There was a time when [Metalsmith HTML Minifier](https://github.com/whymarrh/metalsmith-html-minifier) was the go-to plugin for HTML optimization. However, it looks abondoned and has some serious security issues. It is build as a wrapper for [HTML Minifier](https://github.com/kangax/html-minifier) which has now a security fix, but sadly the wrapper has not been updated. This plugin is build from scratch with just a few up-to-date dependencies. This is still a work in progress, but it is already usable. Please test it and report any issues you find.

## Installation

```bash
npm install metalsmith-optimize-html
```
## Usage
### JavaScript API

```javascript
import Metalsmith from 'metalsmith'
import optimizeHTML from 'metalsmith-optimize-html'

Metalsmith(__dirname)
  .use(optimizeHTML({
    // options
    removeComments: true,
    removeTagSpaces: true
  }))
```

## CLI Usage

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

## Options

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
<div   class="example"   id="test"  >
<!-- becomes -->
<div class="example" id="test">
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
<input type="checkbox" checked="checked" disabled="disabled">
<select multiple="multiple">
<!-- becomes -->
<input type="checkbox" checked disabled>
<select multiple>
```

**cleanUrlAttributes**: boolean (default: false)
- Cleans and normalizes URLs in href, src, action, srcset, and data attributes
- Removes unnecessary whitespace in URLs
```html
<a href="  https://example.com/page   ">
<!-- becomes -->
<a href="https://example.com/page">
```

**cleanDataAttributes**: boolean (default: false)
- Normalizes whitespace in data-* attribute values
- Maintains valid JSON in data attributes
```html
<div data-config='{ "key" :  "value" }'>
<!-- becomes -->
<div data-config='{"key":"value"}'>
```

**removeEmptyAttributes**: boolean (default: false)
- Removes attributes with empty values
```html
<div id="" class="   " data-value="">
<!-- becomes -->
<div>
```

**removeProtocols**: boolean (default: false)
- Converts URLs to protocol-relative URLs
- Preserves protocols in links with `rel="external"`
```html
<a href="https://example.com">
<a href="http://example.com" rel="external">
<!-- becomes -->
<a href="//example.com">
<a href="http://example.com" rel="external">
```

**simplifyDoctype**: boolean (default: false)
- Replaces any DOCTYPE declaration with `HTML5 DOCTYPE`
```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<!-- becomes -->
<!DOCTYPE html>
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

```javascript
Metalsmith(__dirname)
 .use(optimizeHTML({ aggressive: true }))
```
All individual option settings are ignored when aggressive is true, except when explicitly overridden:

```javascript
Metalsmith(__dirname)
  .use(optimizeHTML({
    aggressive: true,
    removeComments: false  // This override will be respected
  }))
```

## Debugging
Debug messages can be enabled by setting the DEBUG environment variable. Metalsmith is expecting the DEBUG environment variable in this format: `metalsmith-<pluginName>`.
The debug variable should be set to `metalsmith-htmlOptimize` as we have previously imported the plugin as `optimizeHTML`.
```bash
metalsmith.env( 'DEBUG', 'metalsmith-htmlOptimize' );
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

## License
[MIT](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/metalsmith-optimize-html.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-optimize-html
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-optimize-html
[license-url]: LICENSE
