#!/bin/bash

# Secure release script for metalsmith-optimize-html
# This script handles GitHub token management securely

set -e

# Check if GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Please install it: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

# Get the release type from the first argument
RELEASE_TYPE=$1
CI_FLAG=$2

if [ -z "$RELEASE_TYPE" ]; then
    echo "Usage: $0 <patch|minor|major> [--ci]"
    echo "Example: $0 patch --ci"
    exit 1
fi

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Release type must be patch, minor, or major"
    exit 1
fi

# Set GitHub token from GitHub CLI
export GH_TOKEN=$(gh auth token)

# Run the release with the specified type
if [ "$CI_FLAG" = "--ci" ]; then
    echo "Running release-it $RELEASE_TYPE with CI flag..."
    npx release-it "$RELEASE_TYPE" --ci
else
    echo "Running release-it $RELEASE_TYPE..."
    npx release-it "$RELEASE_TYPE"
fi

echo "Release completed successfully!"