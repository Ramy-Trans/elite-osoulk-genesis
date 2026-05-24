#!/bin/bash
set -e

npm install --legacy-peer-deps

# Push to GitHub automatically after every merge
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Pushing to GitHub..."
  git config user.email "replit-agent@osoulk.com"
  git config user.name "Replit Agent"

  REPO_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/Ramy-Trans/elite-osoulk-genesis.git"

  git remote set-url origin "$REPO_URL"
  git push origin main --force

  git remote set-url origin "https://github.com/Ramy-Trans/elite-osoulk-genesis"
  echo "Successfully pushed to GitHub."
else
  echo "GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping GitHub push."
fi
