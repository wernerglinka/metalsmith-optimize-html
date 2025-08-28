#!/bin/bash

# Generate release notes for the current version only
# Usage: ./scripts/release-notes.sh <previous-tag>

set -e

PREV_TAG="${1:-$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null)}"
REPO_URL="https://github.com/wernerglinka/metalsmith-optimize-html"

# Fallback for first release if no previous tag exists
if [ -z "$PREV_TAG" ]; then
    PREV_TAG="HEAD~20"  # Show last 20 commits for first release
fi

# Get commits since the previous tag, excluding merge commits and chore commits
echo "## Changes"
echo ""

# Check if we have any commits to show
if git log --pretty=format:"- %s ([%h]($REPO_URL/commit/%H))" \
  "${PREV_TAG}..HEAD" \
  --no-merges \
  --grep="^chore:" --grep="^ci:" --grep="^dev:" --invert-grep 2>/dev/null | grep -q "."; then
    
    git log --pretty=format:"- %s ([%h]($REPO_URL/commit/%H))" \
      "${PREV_TAG}..HEAD" \
      --no-merges \
      --grep="^chore:" --grep="^ci:" --grep="^dev:" --invert-grep
else
    echo "- Initial release"
fi

echo ""
echo ""

# Only show full changelog link if we have a previous tag
if [ "$PREV_TAG" != "HEAD~20" ]; then
    CURRENT_TAG=$(git describe --tags --exact-match HEAD 2>/dev/null || echo "HEAD")
    echo "**Full Changelog**: [$PREV_TAG...$CURRENT_TAG](${REPO_URL}/compare/${PREV_TAG}...${CURRENT_TAG})"
fi