#!/usr/bin/env bash
set -euo pipefail

# NewChart JS — Release Script
# Usage: ./scripts/release.sh [patch|minor|major|x.y.z]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# --- Pre-flight checks ---
[[ -z "$(git status --porcelain)" ]] || error "Working directory is dirty. Commit or stash changes first."
[[ "$(git branch --show-current)" == "main" ]] || error "Must be on main branch."
npm whoami &>/dev/null || error "Not logged in to npm. Run: npm login"

CURRENT_VERSION=$(node -p "require('./package.json').version")
info "Current version: ${CURRENT_VERSION}"

# --- Determine new version ---
BUMP="${1:-}"
if [[ -z "$BUMP" ]]; then
  echo ""
  echo "Select version bump:"
  echo "  1) patch  (bug fixes)"
  echo "  2) minor  (new features)"
  echo "  3) major  (breaking changes)"
  echo "  4) custom (enter version)"
  echo ""
  read -rp "Choice [1-4]: " choice
  case "$choice" in
    1) BUMP="patch" ;;
    2) BUMP="minor" ;;
    3) BUMP="major" ;;
    4) read -rp "Enter version (e.g. 1.2.3): " BUMP ;;
    *) error "Invalid choice" ;;
  esac
fi

# --- Calculate new version ---
if [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEW_VERSION="$BUMP"
else
  IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
  case "$BUMP" in
    patch) NEW_VERSION="${major}.${minor}.$((patch + 1))" ;;
    minor) NEW_VERSION="${major}.$((minor + 1)).0" ;;
    major) NEW_VERSION="$((major + 1)).0.0" ;;
    *) error "Invalid bump type: $BUMP (use patch, minor, major, or x.y.z)" ;;
  esac
fi

echo ""
warn "Will release: ${CURRENT_VERSION} → ${NEW_VERSION}"
read -rp "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

echo ""

# --- Step 1: Tests ---
echo "Running tests..."
npm test || error "Tests failed. Fix before releasing."
info "Tests passed"

# --- Step 2: Production build ---
echo "Building production bundle..."
NODE_ENV=production npx rollup -c || error "Build failed."
info "Production build complete"

# --- Step 3: Copy UMD to docs ---
cp dist/newchartjs.umd.js docs/public/newchartjs.umd.js
info "Copied UMD bundle to docs/public/"

# --- Step 4: Bump version in package.json ---
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '${NEW_VERSION}';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
info "Version bumped to ${NEW_VERSION}"

# --- Step 5: Commit + tag ---
git add package.json dist/ docs/public/newchartjs.umd.js
git commit -m "Release v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "v${NEW_VERSION}"
info "Committed and tagged v${NEW_VERSION}"

# --- Step 6: Push to GitHub ---
echo "Pushing to GitHub..."
git push origin main --follow-tags
info "Pushed to GitHub"

# --- Step 7: Publish to npm ---
echo "Publishing to npm..."
npm publish --access public
info "Published to npm"

echo ""
echo -e "${GREEN}=== Released newchartjs v${NEW_VERSION} ===${NC}"
echo "  npm: https://www.npmjs.com/package/newchartjs"
echo "  tag: v${NEW_VERSION}"
