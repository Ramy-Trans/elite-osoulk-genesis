#!/bin/bash
# Runs as a persistent Replit workflow.
# On startup, commits any pending changes, then polls every 60 seconds
# to push new commits to GitHub whenever local HEAD differs from remote.

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[github-sync] GITHUB_PERSONAL_ACCESS_TOKEN is not set. Exiting."
  exit 1
fi

PUSH_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Ramy-Trans/elite-osoulk-genesis.git"
REMOTE_REF="refs/remotes/github-sync/main"

git config user.email "replit-agent@osoulk.com"
git config user.name "Replit Agent"

# ── On startup: commit any uncommitted changes so they get pushed ─────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[github-sync] Uncommitted changes detected — staging and committing..."
  git add -A
  git commit -m "chore: fix Netlify proxy target to current Replit backend — remove 429 rate limit source" 2>&1 || \
    echo "[github-sync] Commit skipped (nothing to commit or already committed)."
fi

echo "[github-sync] Started. Polling every 60 seconds..."

while true; do
  # Fetch the remote tip into a local tracking ref (no changes to working tree)
  git fetch --no-tags --quiet "$PUSH_URL" "main:${REMOTE_REF}" 2>/dev/null || true

  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse "$REMOTE_REF" 2>/dev/null || echo "unknown")

  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[github-sync] $(date -u '+%Y-%m-%dT%H:%M:%SZ') — new commits detected, pushing..."

    if git push "$PUSH_URL" HEAD:main 2>&1; then
      echo "[github-sync] Push complete (fast-forward)."
    else
      echo "[github-sync] Fast-forward failed, retrying with --force-with-lease..."
      git push "$PUSH_URL" HEAD:main --force-with-lease="${REMOTE_REF}" 2>&1 && \
        echo "[github-sync] Push complete (force-with-lease)."
    fi
  fi

  sleep 60
done
