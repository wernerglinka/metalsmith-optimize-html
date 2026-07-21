/**
 * Whitespace optimization module
 * Handles complex whitespace optimization in HTML content while preserving
 * necessary formatting and spacing.
 *
 * @module whitespace-optimizer
 *
 * Core functionality:
 * - Collapses multiple whitespace characters to single space
 * - Removes unnecessary whitespace between HTML tags
 * - Preserves exact whitespace in special tags (pre, code, etc.)
 * - Maintains appropriate spacing around inline elements based on context
 * - Creates single-line output except for preserved content
 * - Handles nested inline elements correctly
 *
 * Processing approach:
 * Uses a single-pass tokenizer instead of iterative regex matching.
 * The content is split into tags and text segments once, then processed
 * via linear token scans — no complex backreference regex or do-while loops.
 */

/**
 * Pre-compiled regex patterns (module-level for reuse across files)
 * @private
 */
const TAG_SPLIT_RE = /(<\/?[^>]+>)/g;
const WHITESPACE_RE = /\s+/g;
const PLACEHOLDER_RE = /___(?:PRESERVE|INLINE)_\d+___/g;
const TRAILING_SPACE_RE = /\s+$/;
const LEADING_SPACE_RE = /^\s+/;

/**
 * Base preserve tag names (always preserved regardless of options)
 * @private
 */
const BASE_PRESERVE_TAGS = ['pre', 'code', 'textarea', 'script', 'style'];

/**
 * Inline element tag names that affect text flow and spacing
 * @private
 */
const INLINE_TAGS = new Set([
  'a',
  'span',
  'em',
  'strong',
  'b',
  'i',
  'u',
  's',
  'small',
  'mark',
  'sub',
  'sup',
  'time',
  'cite',
  'abbr',
  'label',
  'svg',
  'kbd',
  'samp',
  'var'
]);

/**
 * Preserve tags that are also inline elements. Their content is kept verbatim
 * (via the preserve path), but the whitespace around them must be maintained
 * like other inline elements rather than stripped at the surrounding text.
 * Only `code` is both a preserve tag and inline; kbd/samp/var are inline but
 * not content-preserved, so they live in INLINE_TAGS above.
 * @private
 */
const INLINE_PRESERVE_TAGS = new Set(['code']);

/**
 * Checks whether a character code is whitespace
 * @param {number} c - Character code
 * @returns {boolean}
 */
function isWS(c) {
  return c === 32 || c === 9 || c === 10 || c === 13 || c === 12;
}

/**
 * Checks whether a string ends with whitespace
 * @param {string} s - String to check
 * @returns {boolean}
 */
function endsWithWS(s) {
  return s.length > 0 && isWS(s.charCodeAt(s.length - 1));
}

/**
 * Checks whether a string starts with whitespace
 * @param {string} s - String to check
 * @returns {boolean}
 */
function startsWithWS(s) {
  return s.length > 0 && isWS(s.charCodeAt(0));
}

/**
 * Checks whether a string contains a placeholder pattern (PRESERVE or INLINE)
 * @param {string} s - String to check
 * @returns {boolean}
 */
function hasProcessedPlaceholder(s) {
  return s.indexOf('___PRESERVE_') !== -1 || s.indexOf('___INLINE_') !== -1;
}

/**
 * Checks whether a string contains any placeholder pattern (PRESERVE, INLINE, or EXCLUDE)
 * @param {string} s - String to check
 * @returns {boolean}
 */
function hasAnyPlaceholder(s) {
  return s.indexOf('___PRESERVE_') !== -1 || s.indexOf('___INLINE_') !== -1 || s.indexOf('___EXCLUDE_') !== -1;
}

/**
 * Extracts the tag name from an HTML tag string without using regex.
 * @param {string} tag - The HTML tag string (e.g., '<div>', '</span>', '<a href="...">')
 * @param {boolean} isClose - Whether this is a closing tag
 * @returns {string} The lowercase tag name, or empty string if not found
 */
function getTagName(tag, isClose) {
  const start = isClose ? 2 : 1;
  let end = start;
  const len = tag.length;
  while (end < len) {
    const c = tag.charCodeAt(end);
    // Stop at space (32), > (62), / (47), tab (9), newline (10), carriage return (13)
    if (c === 32 || c === 62 || c === 47 || c === 9 || c === 10 || c === 13) {
      break;
    }
    end++;
  }
  if (end === start) {
    return '';
  }
  return tag.substring(start, end).toLowerCase();
}

/**
 * Checks if an opening tag token is self-closing (ends with />)
 * @param {string} tag - The tag string
 * @returns {boolean}
 */
function isSelfClosing(tag) {
  const len = tag.length;
  return len >= 3 && tag.charCodeAt(len - 2) === 47; // '/' before '>'
}

export const whitespaceOptimizer = {
  name: 'whitespace',

  /**
   * Optimizes HTML content by managing whitespace in various contexts.
   * Uses a single-pass tokenizer approach for performance.
   * @param {string} content - HTML content to optimize
   * @param {Object} [options] - Optimization options
   * @param {string[]} [options.excludeTags] - Additional tags to preserve
   * @returns {string} Optimized HTML content
   */
  optimize: (content, options = {}) => {
    // Check if content already contains PRESERVE/INLINE placeholders (indicating double processing).
    // EXCLUDE placeholders from content-processor's excludeTags are fine — they're just inert text.
    if (hasProcessedPlaceholder(content)) {
      return content;
    }

    // Build preserve tag set from base tags + user excludeTags
    const excludeTags = options.excludeTags;
    const preserveSet = new Set(BASE_PRESERVE_TAGS);
    if (excludeTags) {
      for (let i = 0; i < excludeTags.length; i++) {
        preserveSet.add(excludeTags[i].toLowerCase());
      }
    }

    const preserved = [];
    const inlineElements = [];

    // TOKENIZE ONCE — all subsequent processing uses this token array
    const tokens = content.split(TAG_SPLIT_RE);
    const len = tokens.length;

    // STEP 1: Process preserve blocks (single linear pass)
    // For each preserve opening tag, find its first matching closing tag
    // and replace the entire range with a placeholder
    for (let i = 0; i < len; i++) {
      const token = tokens[i];
      if (!token || token.charCodeAt(0) !== 60 || token.charCodeAt(1) === 47) {
        continue;
      } // skip non-tags, closing tags (60='<', 47='/')
      if (isSelfClosing(token)) {
        continue;
      }

      const name = getTagName(token, false);
      if (!name || !preserveSet.has(name)) {
        continue;
      }

      // Find first matching closing tag (matches current regex lazy-match behavior)
      for (let j = i + 1; j < len; j++) {
        const t = tokens[j];
        if (!t || t.charCodeAt(0) !== 60 || t.charCodeAt(1) !== 47) {
          continue;
        }
        if (getTagName(t, true) === name) {
          // Preserve the entire block unchanged
          const parts = [];
          for (let k = i; k <= j; k++) {
            parts.push(tokens[k]);
          }
          const idx = preserved.length;
          preserved.push(parts.join(''));
          tokens[i] = `___PRESERVE_${idx}___`;
          for (let k = i + 1; k <= j; k++) {
            tokens[k] = '';
          }

          // Inline preserve tags (code, kbd, …) participate in text flow, so
          // carry the surrounding whitespace onto the placeholder the same way
          // Step 2 does for inline elements. Without this, Step 3 trims the
          // adjacent text tokens and the inline element butts against its
          // neighbours (e.g. "a <code>x</code> b" → "a<code>x</code>b").
          // At a block boundary (prev/next is a tag) Step 3 removes the carried
          // space again, so block-adjacent code is unaffected.
          if (INLINE_PRESERVE_TAGS.has(name)) {
            let lead = '';
            for (let k = i - 1; k >= 0; k--) {
              const t = tokens[k];
              if (!t) {
                continue;
              }
              if (t.charCodeAt(0) === 60 || hasProcessedPlaceholder(t)) {
                break;
              }
              if (endsWithWS(t)) {
                lead = ' ';
                tokens[k] = t.replace(TRAILING_SPACE_RE, '');
              }
              break;
            }
            let trail = '';
            for (let k = j + 1; k < len; k++) {
              const t = tokens[k];
              if (!t) {
                continue;
              }
              if (t.charCodeAt(0) === 60 || hasProcessedPlaceholder(t)) {
                break;
              }
              if (startsWithWS(t)) {
                trail = ' ';
                tokens[k] = t.replace(LEADING_SPACE_RE, '');
              }
              break;
            }
            tokens[i] = `${lead}___PRESERVE_${idx}___${trail}`;
          }
          break;
        }
      }
    }

    // STEP 2: Process inline elements (outer-first, single linear scan)
    for (let i = 0; i < len; i++) {
      const token = tokens[i];
      if (!token || token.charCodeAt(0) !== 60 || token.charCodeAt(1) === 47) {
        continue;
      }
      if (isSelfClosing(token)) {
        continue;
      }

      const name = getTagName(token, false);
      if (!name || !INLINE_TAGS.has(name)) {
        continue;
      }

      // Find matching closing tag with depth tracking for same-name nesting
      let depth = 1;
      let closeIdx = -1;
      for (let j = i + 1; j < len; j++) {
        const t = tokens[j];
        if (!t || t.charCodeAt(0) !== 60) {
          continue;
        }

        const isClose = t.charCodeAt(1) === 47;
        const tName = getTagName(t, isClose);
        if (tName !== name) {
          continue;
        }

        if (isClose) {
          depth--;
          if (depth === 0) {
            closeIdx = j;
            break;
          }
        } else if (!isSelfClosing(t)) {
          depth++;
        }
      }

      if (closeIdx === -1) {
        continue;
      }

      // Quick scan: check for placeholders before building inner content string
      let skip = false;
      for (let j = i + 1; j < closeIdx; j++) {
        if (tokens[j] && hasAnyPlaceholder(tokens[j])) {
          skip = true;
          break;
        }
      }
      if (skip) {
        continue;
      }

      // Build and normalize inner content
      let innerContent = '';
      for (let j = i + 1; j < closeIdx; j++) {
        innerContent += tokens[j];
      }

      const normalizedContent = innerContent.replace(WHITESPACE_RE, ' ').trim();
      const normalized = `${token}${normalizedContent}${tokens[closeIdx]}`;
      const idx = inlineElements.length;
      inlineElements.push(normalized);

      // Determine contextual spacing from adjacent text tokens.
      // Stop at tags and at PRESERVE/INLINE placeholders (not EXCLUDE).
      let hasLeadingSpace = false;
      for (let j = i - 1; j >= 0; j--) {
        const t = tokens[j];
        if (!t) {
          continue;
        }
        if (t.charCodeAt(0) === 60) {
          break;
        }
        if (hasProcessedPlaceholder(t)) {
          break;
        }
        hasLeadingSpace = endsWithWS(t);
        if (hasLeadingSpace) {
          tokens[j] = t.replace(TRAILING_SPACE_RE, '');
        }
        break;
      }

      let hasTrailingSpace = false;
      for (let j = closeIdx + 1; j < len; j++) {
        const t = tokens[j];
        if (!t) {
          continue;
        }
        if (t.charCodeAt(0) === 60) {
          break;
        }
        if (hasProcessedPlaceholder(t)) {
          break;
        }
        hasTrailingSpace = startsWithWS(t);
        if (hasTrailingSpace) {
          tokens[j] = t.replace(LEADING_SPACE_RE, '');
        }
        break;
      }

      const leadSpace = hasLeadingSpace ? ' ' : '';
      const trailSpace = hasTrailingSpace ? ' ' : '';

      // Replace the token range with a single placeholder
      tokens[i] = `${leadSpace}___INLINE_${idx}___${trailSpace}`;
      for (let k = i + 1; k <= closeIdx; k++) {
        tokens[k] = '';
      }
    }

    // STEP 3: Process all remaining text tokens and trim placeholders at block boundaries
    // (combines the previous separate Steps 2b and 3 into a single pass)
    for (let i = 0; i < len; i++) {
      const token = tokens[i];
      if (!token || token.charCodeAt(0) === 60) {
        continue;
      } // skip empty and tags

      if (hasProcessedPlaceholder(token)) {
        // PRESERVE/INLINE placeholder: trim spacing at block boundaries
        let prevIsBlockBoundary = true;
        for (let j = i - 1; j >= 0; j--) {
          if (tokens[j]) {
            prevIsBlockBoundary = tokens[j].charCodeAt(0) === 60;
            break;
          }
        }

        let nextIsBlockBoundary = true;
        for (let j = i + 1; j < len; j++) {
          if (tokens[j]) {
            nextIsBlockBoundary = tokens[j].charCodeAt(0) === 60;
            break;
          }
        }

        let val = token;
        if (prevIsBlockBoundary) {
          val = val.replace(LEADING_SPACE_RE, '');
        }
        if (nextIsBlockBoundary) {
          val = val.replace(TRAILING_SPACE_RE, '');
        }
        tokens[i] = val;
      } else {
        // Regular text (including EXCLUDE placeholders): collapse whitespace and trim
        tokens[i] = token.replace(WHITESPACE_RE, ' ').trim();
      }
    }

    // Join all non-empty tokens
    let html = '';
    for (let i = 0; i < len; i++) {
      if (tokens[i]) {
        html += tokens[i];
      }
    }
    html = html.trim();

    // STEP 4: Restore preserved content and inline elements
    if (preserved.length > 0 || inlineElements.length > 0) {
      const placeholderMap = new Map();
      for (let i = 0; i < preserved.length; i++) {
        placeholderMap.set(`___PRESERVE_${i}___`, preserved[i]);
      }
      for (let i = 0; i < inlineElements.length; i++) {
        placeholderMap.set(`___INLINE_${i}___`, inlineElements[i]);
      }

      html = html.replace(PLACEHOLDER_RE, (match) => {
        return placeholderMap.get(match) || match;
      });
    }

    return html;
  }
};
