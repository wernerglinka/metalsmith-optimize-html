/**
 * Performance tests for metalsmith-optimize-html
 */

import assert from 'node:assert';
import Metalsmith from 'metalsmith';
import optimizeHTML from '../src/index.js';

describe('metalsmith-optimize-html performance', () => {
  let metalsmith;

  beforeEach(() => {
    metalsmith = new Metalsmith('test-path');
  });

  it('should handle large HTML files efficiently', async function () {
    // This test may take a bit of time
    this.timeout(10000);
    
    // Create a very large HTML string with lots of whitespace and nested elements
    let largeHtml = '<!DOCTYPE html><html><head><title>Large Test</title></head><body>';
    
    // Add 1000 div elements with nested content and extra whitespace
    for (let i = 0; i < 1000; i++) {
      largeHtml += `
        <div class="item" id="item-${i}" data-index="${i}">
          <h2>  Item ${i}  </h2>
          <p>
            This is item number ${i} with lots of    extra   whitespace.
            <span class="highlight">  Highlighted text  </span>
            <a href="https://example.com/item/${i}">  Link to item  </a>
          </p>
        </div>
      `;
    }
    
    largeHtml += '</body></html>';
    
    const plugin = optimizeHTML({ aggressive: true });
    
    const files = {
      'large.html': {
        contents: Buffer.from(largeHtml)
      }
    };
    
    // Measure time taken
    const startTime = process.hrtime.bigint();
    
    await plugin(files, metalsmith, (err) => {
      assert(!err);
    });
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    // Log performance for reference
    console.log(`Large HTML processing time: ${duration.toFixed(2)}ms`);
    
    // Verify the content was actually processed
    const optimizedContent = files['large.html'].contents.toString();
    
    // Check for optimizations
    assert(!optimizedContent.includes('  '), 'Should not contain multiple spaces');
    assert(optimizedContent.includes('<h2>Item'), 'Should have optimized heading whitespace');
    assert(optimizedContent.includes('href="//example.com/item/'), 'Should have optimized URLs');
    
    // Arbitrary performance threshold - adjust based on your needs
    // This is mainly to detect large performance regressions
    assert(duration < 5000, 'Processing time should be reasonable');
  });

  it('should handle multiple files efficiently', async function () {
    this.timeout(5000);
    
    // Create 100 small HTML files
    const files = {};
    
    for (let i = 0; i < 100; i++) {
      files[`file-${i}.html`] = {
        contents: Buffer.from(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>File ${i}</title>
            </head>
            <body>
              <div class="content">
                <h1>  Heading  ${i}  </h1>
                <p>  This is paragraph ${i} with extra  spaces.  </p>
              </div>
            </body>
          </html>
        `)
      };
    }
    
    const plugin = optimizeHTML({ aggressive: true });
    
    // Measure time taken
    const startTime = process.hrtime.bigint();
    
    await plugin(files, metalsmith, (err) => {
      assert(!err);
    });
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    // Log performance for reference
    console.log(`Multiple files processing time: ${duration.toFixed(2)}ms`);
    
    // Verify random sample file was processed
    const sampleFile = files['file-42.html'].contents.toString();
    assert(sampleFile.includes('<h1>Heading 42</h1>'), 'Should have optimized heading');
    
    // Arbitrary performance threshold
    assert(duration < 3000, 'Processing time should be reasonable');
  });
});