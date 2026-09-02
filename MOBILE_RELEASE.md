# TTWITTUN mobile release

TTWITTUN uses Capacitor to package the production service as iOS and Android apps.

## App identity

- App name: `TTWITTUN`
- Bundle / Application ID: `com.ttwittun.korea`
- Production origin: `https://runart-korea.vercel.app`
- Initial version: `1.0.0`
- Capacitor fallback web assets: `native-web/`

The native shell loads the production Vercel origin. `native-web/index.html` exists so `cap sync` always has a valid local web asset directory and also provides a minimal fallback screen during native setup.

## 1. Generate native projects

On macOS in the repository root:

```bash
chmod +x scripts/setup-mobile.sh
npm run mobile:setup
```

The setup script installs dependencies, creates `ios/` and `android/`, applies native foreground-location permission text with `scripts/configure-native.mjs`, runs `cap sync`, and runs the Capacitor doctor check.

After native configuration changes:

```bash
npm run mobile:configure
npm run mobile:assets
npm run mobile:sync
```

The app icon source files are committed in `assets/`:

- `assets/icon-only.png`: 1024 x 1024 full icon master
- `assets/icon-foreground.png`: Android adaptive-icon foreground
- `assets/icon-background.png`: Android adaptive-icon cream background
- `assets/splash.png`: light launch screen master, 2732 x 2732
- `assets/splash-dark.png`: dark launch screen master, 2732 x 2732

Run `npm run mobile:assets` after creating the native `ios/` and `android/`
projects. This regenerates the iOS AppIcon set and Android launcher/adaptive
icon resources from the same approved master artwork.

The setup script also detects incomplete native project folders. It moves an
incomplete folder to a timestamped backup before recreating the platform, so a
partial `cap add` or stashed project cannot silently skip native generation.

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
- Confirm the generated AppIcon set uses the RUNART running-duck icon
- Confirm the generated `Info.plist` contains the TTWITTUN location usage descriptions
- Test login, email confirmation, GPS start/pause/finish, foreground/background app-state recovery, course map, race links/forms, sharing, favorites, and external links on a physical iPhone
- Archive > Distribute App > App Store Connect

The current release only declares foreground location. Do not enable background location unless TTWITTUN later implements and clearly discloses a real background-running use case.

## 3. Android

```bash
npm run mobile:android
```

In Android Studio:
- Application ID: `com.ttwittun.korea`
- App name: `TTWITTUN`
- Version name: `1.0.0`
- Version code: start with `1`
- Confirm the generated adaptive launcher icon uses the RUNART running-duck foreground
- Confirm `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` exist in the generated manifest
- Test login, GPS start/pause/finish, app resume recovery, course map, race links/forms, sharing, favorites, and external links on a physical Android device
- Build > Generate Signed Bundle / APK > Android App Bundle
- Upload the `.aab` to Google Play Console

## 4. Native capabilities already wired

The current native bridge handles:
- Capacitor native-platform detection
- native app lifecycle events
- Android hardware back button behavior
- external HTTP/HTTPS links through Capacitor Browser
- internal production deep-link handoff
- native splash-screen dismissal
- native share-sheet support where the sharing component uses Capacitor

Packages are prepared for:
- Geolocation
- Haptics
- Status bar

Native-only code is guarded with `Capacitor.isNativePlatform()` so the Vercel web app continues to work normally.

## 5. GPS plan

The current runner still uses the browser/WebView geolocation watch API. This is suitable for the first physical-shell test. Before store submission, field-test at least one iPhone and one Android device for GPS continuity, pause/resume, screen lock behavior, and permission recovery.

If WebView GPS behavior is inconsistent, migrate the runner watch implementation to `@capacitor/geolocation` while keeping the existing live-run recovery model.

## 6. Authentication and account deletion

The app loads the production origin `https://runart-korea.vercel.app` and keeps the existing Supabase auth callback flow.

Public store-facing pages:
- Privacy Policy: `https://runart-korea.vercel.app/privacy`
- Support: `https://runart-korea.vercel.app/support`

Signed-in users can start an account deletion request from:
- `MY > 계정 관리`
- `https://runart-korea.vercel.app/my/account`

The deletion-request table is protected by RLS so users can only create/view/update their own request. Before public launch, define the operational process that marks requests as processing/completed and removes the associated user data and auth account.

## 7. Store submission assets

Prepare:
- App icon 1024 x 1024 master (completed in `assets/icon-only.png`)
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

## 8. Review readiness

Do not submit a bare website wrapper. Before public review, verify at least these native-value behaviors on-device:
- GPS running/location permission
- native share
- app lifecycle recovery while a run is active
- sensible hardware back-button behavior on Android
- external registration/map links opening correctly
- offline/network-error fallback
- in-app account deletion entry point

## 9. Updating the app

Most UI/data updates continue to deploy through Vercel without a native store rebuild because the native shell points at the production origin. Rebuild and resubmit when native configuration, permissions, plugins, app icons, signing, bundle settings, or store metadata change.
