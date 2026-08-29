#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[RUNART] Installing Capacitor packages..."
npm install --save-dev @capacitor/cli@^7.0.0
npm install @capacitor/core@^7.0.0 @capacitor/ios@^7.0.0 @capacitor/android@^7.0.0

if [ ! -d ios ]; then
  npx cap add ios
fi

if [ ! -d android ]; then
  npx cap add android
fi

npx cap sync

echo ""
echo "RUNART KOREA mobile projects are ready."
echo "iOS:     npx cap open ios"
echo "Android: npx cap open android"
