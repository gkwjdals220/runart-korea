# TTWITTUN mobile release

TTWITTUN uses Capacitor to package the production service as iOS and Android apps.

## App identity

- App name: `TTWITTUN`
- Bundle / Application ID: `com.ttwittun.korea`
- Production origin: `https://runart-korea.vercel.app`
- Initial version: `1.0.0`

## 1. Generate native projects

On macOS in the repository root:

```bash
chmod +x scripts/setup-mobile.sh
./scripts/setup-mobile.sh
```

The script installs the Capacitor toolchain, creates `ios/` and `android/`, runs `cap sync`, and runs the Capacitor doctor check.

After web/native dependency changes:

```bash
npm run mobile:sync
```

## 2. iOS

```bash
npm run mobile:ios
```

In Xcode:
- Bundle Identifier: `com.ttwittun.korea`
- Display Name: `TTWITTUN`
- Set the Apple Developer Team
- Version: `1.0.0`
- Build: start with `1`
- Add a 1024 x 1024 app icon master and launch assets
- Add location permission descriptions for GPS running and nearby course/facility discovery
- Test login, email confirmation, GPS start/pause/finish, background/foreground recovery, course map, race links/forms, sharing, favorites, and external links on a physical iPhone
- Archive > Distribute App > App Store Connect

Suggested iOS permission copy:

`TTWITTUN은 러닝 기록 측정과 주변 코스·편의시설 안내를 위해 사용자의 위치를 사용합니다.`

If background location is introduced later, add a separate background-location explanation and validate the App Store review requirement before enabling it.

## 3. Android

```bash
npm run mobile:android
```

In Android Studio:
- Application ID: `com.ttwittun.korea`
- App name: `TTWITTUN`
- Version name: `1.0.0`
- Version code: start with `1`
- Add adaptive launcher icon assets
- Verify foreground location permission and Android 13+ notification permission only if notifications are enabled
- Test login, GPS start/pause/finish, app resume recovery, course map, race links/forms, sharing, favorites, and external links on a physical Android device
- Build > Generate Signed Bundle / APK > Android App Bundle
- Upload the `.aab` to Google Play Console

## 4. Native capabilities included in the first app toolchain

The first TTWITTUN native shell includes packages for:
- Geolocation
- Native share sheet
- Browser/external links
- App lifecycle/back-button handling
- Haptics
- Status bar
- Splash screen

Native-only code should always guard with `Capacitor.isNativePlatform()` so the Vercel web app continues to work unchanged.

## 5. Supabase authentication

The app loads the production origin:

`https://runart-korea.vercel.app`

Keep the existing production auth callback URL enabled in Supabase. Verify signup confirmation, login persistence, logout, and auth callback behavior inside both native shells before store submission.

## 6. Store submission assets

Prepare:
- App icon 1024 x 1024 master
- iPhone screenshots
- Android phone screenshots
- Short description
- Full description
- Support URL
- Privacy Policy URL
- Location permission explanation
- Data collection/privacy declarations
- Apple Developer Program account
- Google Play Console developer account

## 7. Review readiness

Do not submit a bare website wrapper. Before public review, verify at least these native-value behaviors on-device:
- GPS running/location permission
- native share
- app lifecycle recovery while a run is active
- sensible hardware back-button behavior on Android
- external registration/map links opening correctly
- offline/network-error fallback

## 8. Updating the app

Most UI/data updates continue to deploy through Vercel without a native store rebuild because the native shell points at the production origin. Rebuild and resubmit when native configuration, permissions, plugins, app icons, signing, bundle settings, or store metadata change.
