#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

KEYSTORE="android/ttwittun-upload-key.jks"
PROPS="android/keystore.properties"
ALIAS="ttwittun-upload"

if [ ! -f "$KEYSTORE" ]; then
  echo "[TTWITTUN] Creating Android upload keystore..."
  echo "[TTWITTUN] Keep the passwords you enter in a secure password manager. Do not commit or share them."
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias "$ALIAS"
else
  echo "[TTWITTUN] Existing upload keystore found: $KEYSTORE"
fi

if [ ! -f "$PROPS" ]; then
  echo ""
  echo "[TTWITTUN] Creating local signing properties. Input is hidden."
  read -s -p "Keystore password: " STORE_PASSWORD
  echo
  read -s -p "Key password (press Enter to use same password): " KEY_PASSWORD
  echo
  if [ -z "$KEY_PASSWORD" ]; then KEY_PASSWORD="$STORE_PASSWORD"; fi

  cat > "$PROPS" <<EOF
storeFile=ttwittun-upload-key.jks
storePassword=$STORE_PASSWORD
keyAlias=$ALIAS
keyPassword=$KEY_PASSWORD
EOF
  chmod 600 "$PROPS"
  unset STORE_PASSWORD KEY_PASSWORD
  echo "[TTWITTUN] Created $PROPS (local only)."
else
  echo "[TTWITTUN] Existing signing properties found: $PROPS"
fi

echo ""
echo "[TTWITTUN] Syncing Capacitor Android project..."
npx cap sync android

echo ""
echo "[TTWITTUN] Building signed release AAB..."
(
  cd android
  ./gradlew clean bundleRelease
)

AAB="android/app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB" ]; then
  echo "[TTWITTUN] ERROR: Release AAB was not created."
  exit 1
fi

echo ""
echo "[TTWITTUN] Release AAB ready:"
ls -lh "$AAB"
echo ""
echo "Next: upload this AAB to Google Play Console > Testing > Internal testing."
