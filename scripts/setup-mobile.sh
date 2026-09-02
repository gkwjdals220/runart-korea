#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[TTWITTUN] Installing dependencies..."
npm install

echo "[TTWITTUN] Preparing Capacitor native projects..."
if [ ! -f ios/App/Podfile ]; then
  if [ -d ios ]; then
    backup_dir="ios_incomplete_$(date +%Y%m%d_%H%M%S)"
    mv ios "$backup_dir"
    echo "[TTWITTUN] Incomplete iOS project moved to $backup_dir"
  fi
  npx cap add ios
fi

if [ ! -f android/app/src/main/AndroidManifest.xml ]; then
  if [ -d android ]; then
    backup_dir="android_incomplete_$(date +%Y%m%d_%H%M%S)"
    mv android "$backup_dir"
    echo "[TTWITTUN] Incomplete Android project moved to $backup_dir"
  fi
  npx cap add android
fi

node scripts/configure-native.mjs
npm run mobile:assets
npx cap sync
npx cap doctor || true

echo ""
echo "TTWITTUN mobile projects are ready."
echo "Bundle / Application ID: com.ttwittun.korea"
echo "iOS:     npm run mobile:ios"
echo "Android: npm run mobile:android"
echo "Sync:    npm run mobile:sync"
