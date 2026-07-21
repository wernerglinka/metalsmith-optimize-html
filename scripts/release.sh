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

echo "Starting $RELEASE_TYPE release..."
# Sync with the remote before releasing. release-it bumps the version,
# writes the changelog, commits, and tags locally, then pushes the
# release commit and tag at the very end. If origin has moved ahead in
# the meantime (e.g. the CI coverage-badge bot pushes to main), that
# final push is rejected as non-fast-forward and the release is left
# half-done. Rebasing our local commits onto the remote first keeps the
# push fast-forwardable. Requires a clean working tree, which release-it
# enforces anyway; a conflict here aborts the release via `set -e`.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Syncing with origin/$BRANCH..."
git pull --rebase origin "$BRANCH"

# Set the GitHub token securely
export GH_TOKEN=$(gh auth token)

# Run release-it with the specified type
npx release-it "$RELEASE_TYPE" $CI_FLAG

echo "Release completed successfully!"