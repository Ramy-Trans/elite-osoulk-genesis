#!/bin/bash
# Runs as a persistent Replit workflow.
# Every 60 seconds, checks if the local HEAD differs from the remote GitHub
# branch and pushes if there are new commits. This covers checkpoints and
# edits that happen outside of task-merge events.

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[github-sync] GITHUB_PERSONAL_ACCESS_TOKEN is not set. Exiting."
  exit 1
fi

PUSH_URL="https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Ramy-Trans/elite-osoulk-genesis.git"
REMOTE_REF="refs/remotes/github-sync/main"

git config user.email "replit-agent@osoulk.com"
git config user.name "Replit Agent"

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
