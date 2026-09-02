#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[TTWITTUN] Installing dependencies..."
npm install

echo "[TTWITTUN] Preparing Capacitor native projects..."
if [ ! -d ios ]; then
  npx cap add ios
fi

if [ ! -d android ]; then
  npx cap add android
fi

node scripts/configure-native.mjs
npx cap sync
npx cap doctor || true

echo ""
echo "TTWITTUN mobile projects are ready."
echo "Bundle / Application ID: com.ttwittun.korea"
echo "iOS:     npm run mobile:ios"
echo "Android: npm run mobile:android"
echo "Sync:    npm run mobile:sync"
