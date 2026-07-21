# Theory of Operation

This document explains how `metalsmith-optimize-html` works and why it is built
the way it is. The README covers usage; this covers design.

## Problem

Generated HTML carries bytes the browser never needs: comments, redundant
whitespace between tags, default attributes browsers already assume, verbose
boolean attributes, long doctypes, and so on. Stripping them shrinks payloads
without changing rendering — but only if it is done *safely*, preserving
whitespace-significant content (`<pre>`, `<code>`, `<textarea>`, `<script>`,
`<style>`) and never altering meaning. The previous ecosystem standard became
unmaintained, so this plugin re-implements HTML optimization from scratch with a
modular, functional design and no runtime dependencies.

## Approach

The plugin is a registry of independent **optimizers**, each a pure function
that takes HTML content and returns optimized HTML. `src/optimizers/` holds one
module per concern (comments, whitespace, boolean-attributes, doctype,
url-attributes, protocols, default-attributes, data-attributes, tag-spaces,
empty-attributes, safe-attributes-quote-removal). `optimizer-registry.js` +
`optimizer-factory.js` assemble the active set from the resolved options;
`utils/content-processor.js` runs content through that set; `utils/file-filters.js`
selects which files to touch.

Per build the plugin:

1. **Validates options** up front (`validate-options.js`) and throws a
   descriptive error on invalid config, rather than silently misbehaving.
2. **Resolves options** by merging `BASE_OPTIONS`, the aggressive preset (if
   `aggressive: true`), and the user's explicit options — with explicit options
   winning even under aggressive mode.
3. **Loads optimizers once** and caches them across files (and across builds via
   a closure) so the active set isn't rebuilt per file.
4. **Filters files** by `pattern`, then for each: validates `contents` is a
   processable Buffer, skips empty/non-HTML content, runs the optimizer chain,
   validates the result is a non-empty string, and writes it back.

## The whitespace tokenizer

The performance-critical optimizer is whitespace normalization. Naive
regex-with-backreferences approaches backtrack catastrophically on
real-world content full of nested inline elements. Instead the whitespace
optimizer does a **single-pass tokenize** — splitting HTML into tag and text
segments once — then processes linear token arrays. This turned a >15s
optimization into <51ms on a production site. The linear-time design is the
single most important architectural choice in the plugin.

## Key decisions

- **Optimizers are pure and independent.** Each can be enabled in isolation and
  tested in isolation; adding a concern means adding a module, not editing a
  monolith.
- **Explicit options beat the aggressive preset.** `aggressive: true` turns
  everything on, but a user can still switch one thing off because their
  explicit value is merged last.
- **Site metadata can configure it.** `metalsmith.metadata().htmlOptimization`
  is merged under per-invocation options so global defaults are possible while
  local options still override.
- **Fail soft per file, loud per build.** A single file that can't be decoded,
  optimized, or re-buffered is skipped with a debug note (one bad file
  shouldn't sink the build), but an invalid *configuration* throws immediately.

## Invariants and failure modes

- **Buffer validation.** `contents` is checked before `toString`; non-Buffer,
  empty, or non-HTML content is skipped.
- **Result validation.** Optimized output must be a non-empty string or the
  file is left untouched — an optimizer bug can't blank a page.
- **Whitespace-significant tags preserved.** `<pre>`, `<code>`, `<textarea>`,
  `<script>`, `<style>` are never whitespace-collapsed; `excludeTags` extends
  this protection.
- **Errors propagate at the plugin boundary.** The plugin body is wrapped in
  try/catch routing to `done(error)`; option validation throws synchronously.
- **Options are copied, not mutated.** Defaults and presets merge into fresh
  objects; the caller's options are never mutated.
