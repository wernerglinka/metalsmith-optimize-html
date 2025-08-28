#!/bin/bash

# Secure release script for GitHub releases
# Usage: ./scripts/release.sh [patch|minor|major] [--ci]

set -e

# Check for GitHub CLI authentication
if ! gh auth status >/dev/null 2>&1; then
    echo "Error: GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Get release type
RELEASE_TYPE=${1:-patch}
CI_FLAG=""

# Check for --ci flag
if [[ "$*" == *"--ci"* ]]; then
    CI_FLAG="--ci"
fi

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Release type must be patch, minor, or major"
    echo "Usage: ./scripts/release.sh [patch|minor|major] [--ci]"
    exit 1
fi

echo "🚀 Starting $RELEASE_TYPE release..."

# Set the GitHub token securely
export GH_TOKEN=$(gh auth token)

# Run release-it with the specified type
npx release-it "$RELEASE_TYPE" $CI_FLAG

echo "✅ Release completed successfully!"