# metalsmith-optimize-html - Development Context

This file gives Claude operational context for working in this plugin. Plugin
behavior is documented in [README.md](README.md) and the architecture
rationale in [docs/THEORY.md](docs/THEORY.md) — don't duplicate them here.

## Project Overview

Optimizes/minifies HTML in a Metalsmith build via a registry of independent,
pure optimizer functions (comments, whitespace, boolean/default/data/url/empty
attributes, doctype, protocols, tag-spaces, safe quote removal). The
performance-critical whitespace optimizer uses a single-pass tokenizer for
linear-time processing. `src/optimizers/` holds one module per concern;
`optimizer-registry.js`/`optimizer-factory.js` assemble the active set;
`utils/` holds the content processor and file filters.

ESM-only Metalsmith plugin, published directly from `src/` (no build step),
targeting Node.js 22+. CommonJS consumers can still load it via Node 22's ESM
interop. It has **no runtime dependencies**.

## MCP Server Integration (CRITICAL)

**IMPORTANT**: This plugin was created with `metalsmith-plugin-mcp-server`.
When working on this plugin, AI assistants (Claude) MUST use the MCP server
tools rather than improvising equivalents.

### Essential MCP Commands

```bash
list-templates                          # See what's available
get-template plugin/CLAUDE.md           # Retrieve exact template content
get-template configs/biome.json
get-template configs/release-it.json
validate .                              # Plugin validation + recommendations
diff-template .                         # Drift check vs current scaffold
configs .                               # Generate config files
update-deps .                           # Dependency update
```

### CRITICAL RULES for AI Assistants

1. **Use MCP server templates verbatim** — never paraphrase or "simplify"
2. **Run `list-templates` before guessing** at template names
3. **When `validate` produces a recommendation, copy it exactly** — including
   the exact command suggested
4. **Ask the user** before modifying `.release-it.json`, `package.json`,
   `biome.json`, or any other `.json` / `.yml` / `.config.js` file
5. **Never set `npm.publish` to `true`** in `.release-it.json` — releases
   here are deliberately manual

## Plugin Development Rules

### Use Metalsmith's native methods

Prefer the methods Metalsmith provides on the instance over external
packages:

```javascript
// ❌                                    // ✅
require('debug')('')                     metalsmith.debug('')
require('minimatch')(file, pattern)      metalsmith.match(pattern, file)
process.env.NODE_ENV                     metalsmith.env('NODE_ENV')
path.join(dir, file)                     metalsmith.path(file)
```

### Never mock Metalsmith in tests

Use a real `Metalsmith` instance. Metalsmith is in `devDependencies` for
exactly this reason. Mocking `metalsmith()`, `metalsmith.match`,
`metalsmith.debug`, `metalsmith.env`, `metalsmith.path`, or plugin invocation
has repeatedly hidden integration bugs. The tests here build in-memory `files`
objects and pass a real `Metalsmith` instance; one error-path test overrides
`.match` on a real instance to force a throw, which is a narrow injection, not a
full mock.

Mocking unrelated systems (network, non-Metalsmith fs concerns) is fine.

### Metalsmith goes in devDependencies, never peerDependencies

The plugin code itself never imports Metalsmith — it receives the instance
as a parameter. Tests import Metalsmith directly. Users have their own
Metalsmith install in their project.

### Optimizers are pure functions

Each `src/optimizers/*.js` module is a pure `content -> content` function.
Regex-replace callbacks often receive positional capture groups they don't all
use — prefix the unused ones with `_` (Biome's `noUnusedFunctionParameters`).
Note: `data-attributes.js` detects numeric strings with
`!Number.isNaN(Number(trimmedValue))` — this is deliberate coercion (checking
"is this a numeric string"); do not "simplify" it to a bare `Number.isNaN`,
which would invert the check.

## Pre-commit workflow

```bash
npm run lint       # Biome: lint + format with autofix
npm run format     # Format only
npm test           # node:test runner against src/
```

If any step fails, fix the underlying issue and re-run. Don't skip hooks.

## Release commands

```bash
npm run release:patch   # Bug fix
npm run release:minor   # New feature, backwards-compatible
npm run release:major   # Breaking change
```

This plugin is at 1.0+, so standard semver applies: breaking changes are major
releases. Releases use `./scripts/release.sh` (GitHub token via
`gh auth token`); npm publishing is intentionally manual.

## Before releasing: re-read the user-facing docs

Before any `npm run release:*`, read [README.md](README.md) and
[docs/THEORY.md](docs/THEORY.md) end-to-end and fix drift from `src/` — the
option names/defaults, the aggressive-preset list, and the before/after
examples. If a release has no user-visible surface, say so rather than
inventing drift.

## File organization

```
/
├── src/
│   ├── index.js              # Entry — validate, resolve options, filter, process
│   ├── optimizer-registry.js # Assemble active optimizer set
│   ├── optimizer-factory.js
│   ├── validate-options.js
│   ├── optimizers/           # One pure module per optimization
│   └── utils/                # content-processor, file-filters
├── test/
│   ├── index.test.js         # main suite (node:test, real Metalsmith)
│   ├── validation.test.js  edge-cases.test.js  attribute-edge-cases.test.js
│   ├── performance.test.js  import-formats.test.js
│   └── fixtures/
├── docs/
│   └── THEORY.md
└── .github/
    ├── workflows/            # test.yml, test-matrix.yml, claude-code.yml
    └── dependabot.yml
```

## Tooling

- **Biome** for lint + format (single tool, single config: `biome.json`)
- **node:test** + `node:assert` for testing; native coverage
- **Node >= 22** required

## When validation flags something

`validate` returns `failed` (must-fix), `warnings`, and `recommendations`.
Implement recommendations as written. The validator catches real maintainer
feedback patterns (marketing language, hardcoded values that should be options,
CJS examples in ESM-only plugins, performance anti-patterns, English-only
output strings). Run `validate .` and copy the suggested fixes.
