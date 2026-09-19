#!/usr/bin/env bash
set -e

WIKI_REPO="https://github.com/zsh04/ztlo.wiki.git"
TEMP_DIR="/tmp/ztlo-wiki-sync"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.wiki" && pwd)"

echo "==> Syncing ZTLO Wiki from ${SOURCE_DIR} to ${WIKI_REPO}..."

rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

if git clone "${WIKI_REPO}" "${TEMP_DIR}" 2>/dev/null; then
  echo "==> Existing wiki cloned."
else
  echo "==> Initializing new wiki repository..."
  cd "${TEMP_DIR}"
  git init
  git checkout -b master
  git remote add origin "${WIKI_REPO}"
fi

cd "${TEMP_DIR}"

# Copy wiki pages
cp "${SOURCE_DIR}/Home.md" ./Home.md
cp "${SOURCE_DIR}/ARCHITECTURE.md" ./Architecture.md
cp "${SOURCE_DIR}/CONSTRAINTS.md" ./Constraints.md
cp "${SOURCE_DIR}/CURRICULUM.md" ./Curriculum.md
cp "${SOURCE_DIR}/DIRECTIVES.md" ./Directives.md
cp "${SOURCE_DIR}/_Sidebar.md" ./_Sidebar.md
cp "${SOURCE_DIR}/_Footer.md" ./_Footer.md

git add .
if git diff-index --quiet HEAD --; then
  echo "==> Wiki is already up to date. Nothing to commit."
else
  git commit -m "docs(wiki): update wiki documentation from .wiki/"
  git push -u origin master || git push -u origin main
  echo "==> Wiki successfully synchronized and published!"
fi

rm -rf "${TEMP_DIR}"
