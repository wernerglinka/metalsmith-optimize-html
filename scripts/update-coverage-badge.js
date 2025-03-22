#!/usr/bin/env node

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function determineBadgeColor(percentage) {
  if (percentage >= 90) {
    return 'brightgreen';
  }
  if (percentage >= 80) {
    return 'green';
  }
  if (percentage >= 70) {
    return 'yellowgreen';
  }
  if (percentage >= 60) {
    return 'yellow';
  }
  if (percentage >= 50) {
    return 'orange';
  }
  return 'red';
}

async function main() {
  try {
    // First, run npm test to generate the coverage data
    execSync('npm test', { stdio: 'inherit' });

    // Instead of using lcov-parse, we'll parse the c8 text report directly
    const coverageOutput = execSync('npx c8 report --reporter=text', { encoding: 'utf-8' });

    // Parse the coverage report
    const coverageData = parseC8Report(coverageOutput);

    if (!coverageData) {
      console.error('Could not parse coverage data from c8 report');
      process.exit(1);
    }

    // Update the README.md file with the coverage badge
    await updateReadme(coverageData);

    // Success
  } catch (error) {
    console.error('Error updating coverage badge:', error);
    process.exit(1);
  }
}

function parseC8Report(report) {
  try {
    // Extract the summary line from the coverage report
    // Example: "All files |   94.17 |    79.16 |     100 |   94.17 |"
    const summaryLineRegex = /All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/;
    const match = report.match(summaryLineRegex);

    if (match) {
      const [, statements, branches, functions, lines] = match;

      return {
        totalLines: 100, // We don't have this data directly from the report
        coveredLines: parseFloat(lines), // We use the percentage as reported
        percentage: Math.round(parseFloat(lines)), // Using lines coverage as the main percentage
        statements: parseFloat(statements),
        branches: parseFloat(branches),
        functions: parseFloat(functions),
        lines: parseFloat(lines)
      };
    }

    // If the standard format didn't match, try an alternate format
    // This handles variations in the c8 output format
    const altSummaryRegex = /All files[^|]*?(\d+\.?\d*)%[^|]*?(\d+\.?\d*)%[^|]*?(\d+\.?\d*)%[^|]*?(\d+\.?\d*)%/;
    const altMatch = report.match(altSummaryRegex);

    if (altMatch) {
      const [, statements, branches, functions, lines] = altMatch;

      return {
        totalLines: 100,
        coveredLines: parseFloat(lines),
        percentage: Math.round(parseFloat(lines)),
        statements: parseFloat(statements),
        branches: parseFloat(branches),
        functions: parseFloat(functions),
        lines: parseFloat(lines)
      };
    }

    // Last attempt - try to find any percentage values
    const percentageRegex = /(\d+\.?\d*)%/g;
    const percentages = [...report.matchAll(percentageRegex)].map((m) => parseFloat(m[1]));

    if (percentages.length >= 4) {
      // Use the average percentage as our coverage value
      const avg = percentages.reduce((sum, val) => sum + val, 0) / percentages.length;
      const percentage = Math.round(avg);

      return {
        totalLines: 100,
        coveredLines: percentage,
        percentage: percentage,
        statements: percentage,
        branches: percentage,
        functions: percentage,
        lines: percentage
      };
    }

    console.warn('Could not parse any coverage data from the report');
    return null;
  } catch (error) {
    console.error('Error parsing c8 report:', error);
    return null;
  }
}

async function updateReadme(coverageData) {
  const readmePath = path.join(rootDir, 'README.md');
  let readme = await fs.readFile(readmePath, 'utf8');

  const { percentage } = coverageData;
  const color = determineBadgeColor(percentage);

  // Create the coverage badge
  const coverageBadge = `[![Coverage](https://img.shields.io/badge/coverage-${percentage}%25-${color}.svg?style=flat-square)](https://github.com/wernerglinka/metalsmith-optimize-html/blob/master/README.md)`;

  // Create the coverage badge definition
  const coverageBadgeDef = `[coverage-badge]: https://img.shields.io/badge/coverage-${percentage}%25-${color}.svg\n[coverage-url]: https://github.com/wernerglinka/metalsmith-optimize-html/blob/master/README.md`;

  // Add or update the coverage badge and definition
  let updated = false;

  // Add the badge before adding or updating license badge definitions
  const licenseDefPos = readme.indexOf('[license-badge]');
  if (licenseDefPos !== -1) {
    // Check if coverage badge definitions already exist
    const coverageDefRegex = /\[coverage-badge\]:[^\n]+\n\[coverage-url\]:[^\n]+/;
    if (coverageDefRegex.test(readme)) {
      // Replace existing coverage badge definitions
      readme = readme.replace(coverageDefRegex, coverageBadgeDef);
    } else {
      // Add coverage badge definitions before license badge definitions
      readme = `${readme.substring(0, licenseDefPos) + coverageBadgeDef}\n${readme.substring(licenseDefPos)}`;
    }
    updated = true;
  }

  // Now add the actual badge after license badge
  const licenseBadgePos = readme.indexOf('[license-badge]');
  if (licenseBadgePos !== -1) {
    // Find the line with license badge
    const licenseLineEnd = readme.indexOf('\n', licenseBadgePos);

    // Check if a coverage badge already exists
    if (readme.indexOf('[coverage-badge]') !== -1) {
      // Check if coverage badge is present after license badge
      const afterLicense = readme.substring(licenseLineEnd);
      const coverageBadgeLinePos = afterLicense.indexOf('[coverage-badge]');

      if (coverageBadgeLinePos === -1) {
        // Add the coverage badge after license badge
        readme = `${readme.substring(0, licenseLineEnd)} ${coverageBadge}${readme.substring(licenseLineEnd)}`;
      }
    } else {
      // Add the coverage badge and reference after license badge

      // Convert the reference in the badge to markdown link syntax
      const badgeWithRef = `[![Coverage][coverage-badge]][coverage-url]`;

      // Add the badge reference
      readme = `${readme.substring(0, licenseLineEnd)} ${badgeWithRef}${readme.substring(licenseLineEnd)}`;
    }
    updated = true;
  }

  if (!updated) {
    console.warn('Could not update README.md with coverage badge');
    return;
  }

  // Get the individual coverage metrics
  const { statements, branches, functions, lines } = coverageData;

  // Add test coverage section if it doesn't exist
  const testCoverageSection = `\n## Test Coverage\n\n| Statements | Branches | Functions | Lines |\n|------------|----------|-----------|-------|\n| ${Math.round(statements)}% | ${Math.round(branches)}% | ${Math.round(functions)}% | ${Math.round(lines)}% |\n`;

  if (!readme.includes('## Test Coverage')) {
    // Add before license section
    const licenseSection = readme.indexOf('## License');
    if (licenseSection !== -1) {
      readme = readme.substring(0, licenseSection) + testCoverageSection + readme.substring(licenseSection);
    } else {
      // Add at the end
      readme += testCoverageSection;
    }
  } else {
    // Update existing coverage table
    const coverageTableRegex =
      /\| Statements \| Branches \| Functions \| Lines \|\n\|[-\s|]+\|\n\| \d+\.?\d*% \| \d+\.?\d*% \| \d+\.?\d*% \| \d+\.?\d*% \|/;
    const newTable = `| Statements | Branches | Functions | Lines |\n|------------|----------|-----------|-------|\n| ${Math.round(statements)}% | ${Math.round(branches)}% | ${Math.round(functions)}% | ${Math.round(lines)}% |`;

    if (coverageTableRegex.test(readme)) {
      readme = readme.replace(coverageTableRegex, newTable);
    }
  }

  // Write the updated README.md
  await fs.writeFile(readmePath, readme, 'utf8');
}

main();
