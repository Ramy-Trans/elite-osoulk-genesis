#!/bin/bash
set -e

npm install --legacy-peer-deps

# Push to GitHub automatically after every Replit task merge.
# Replit manages its own internal git history; GitHub is a mirror.
# We push directly to the authenticated URL — origin is never mutated.
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Pushing latest changes to GitHub..."

  git config user.email "replit-agent@osoulk.com"
  git config user.name "Replit Agent"

  # GitHub PAT authentication via URL — avoids any credential file or remote mutation
  PUSH_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Ramy-Trans/elite-osoulk-genesis.git"

  # Attempt a normal fast-forward push first.
  # If the remote has diverged from Replit's authoritative history, retry
  # with --force-with-lease after fetching to update the remote tracking ref.
  if git push "$PUSH_URL" HEAD:main; then
    echo "GitHub sync complete (fast-forward)."
  else
    echo "Fast-forward failed — fetching remote to reconcile tracking ref..."
    git fetch --no-tags "$PUSH_URL" main:refs/remotes/github-sync/main 2>/dev/null || true
    git push "$PUSH_URL" HEAD:main --force-with-lease="main:refs/remotes/github-sync/main"
    echo "GitHub sync complete (force-with-lease after fetch)."
  fi
else
  echo "GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping GitHub push."
fi
