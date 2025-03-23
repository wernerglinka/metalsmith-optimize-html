/**
 * Simple CommonJS compatibility test for metalsmith-optimize-html
 */

const metalsmith = require('metalsmith');
const optimizeHtml = require('../../lib/index.cjs');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Create a simple test
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>CommonJS Test</title>
</head>
<body>
  <h1>Hello, CommonJS!</h1>
  <p>This is a test of CommonJS compatibility.</p>
</body>
</html>
`;

// Write the test file
const testDir = path.join(__dirname, 'fixture');
const outputDir = path.join(__dirname, 'build');

// Create test directories
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write test file
fs.writeFileSync(path.join(testDir, 'index.html'), testHtml);

// Run the test
console.log('Testing CommonJS compatibility...');

metalsmith(path.dirname(testDir))
  .source(path.basename(testDir))
  .destination(path.basename(outputDir))
  .use(optimizeHtml())
  .build(function (err) {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    // Read the output file
    const output = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
    
    // Verify the output is optimized
    assert(output.length < testHtml.length, 'File should be optimized and smaller');
    
    console.log(' CommonJS compatibility test passed!');
  });