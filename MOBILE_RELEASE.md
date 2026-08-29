# RUNART KOREA mobile release

RUNART KOREA uses Capacitor to package the production web service as iOS and Android apps.

## 1. Generate native projects

On macOS in the repository root:

```bash
chmod +x scripts/setup-mobile.sh
./scripts/setup-mobile.sh
```

This installs Capacitor and creates `ios/` and `android/` projects.

## 2. iOS

```bash
npx cap open ios
```

In Xcode:
- Bundle Identifier: `com.runart.korea`
- Display Name: `RUNART KOREA`
- Set the Apple Developer Team
- Set deployment target supported by the installed Capacitor version
- Add app icons and launch screen assets
- Test login, geolocation, favorites, Kakao external links, RUN + EAT saving and sharing on a physical iPhone
- Archive > Distribute App > App Store Connect

Location usage description should explain that location is used to find running courses near the user.

## 3. Android

```bash
npx cap open android
```

In Android Studio:
- Application ID: `com.runart.korea`
- App name: `RUNART KOREA`
- Add launcher icon assets
- Test login, geolocation, favorites, Kakao external links, RUN + EAT saving and sharing on a physical Android device
- Build > Generate Signed Bundle / APK > Android App Bundle
- Upload the `.aab` to Google Play Console

## 4. Supabase authentication

The app loads the production origin:

`https://runart-korea.vercel.app`

Keep the existing production auth callback URL enabled in Supabase. Verify email confirmation and login inside both native shells before submitting to stores.

## 5. Store submission checklist

Prepare:
- App icon (1024 x 1024 master)
- iPhone and Android screenshots
- Short and full app descriptions
- Support URL
- Privacy Policy URL
- Location permission explanation
- Data collection/privacy declarations
- Apple Developer Program account
- Google Play Console developer account

## 6. Important review note

The first Capacitor version keeps the current RUNART service and navigation intact. Before public App Store review, add enough mobile-specific value (for example native geolocation behavior, native sharing, push notifications, deep links, or offline/error handling) so the app is more than a minimal website wrapper.

## 7. Updating the app

Most web UI/data changes continue to deploy through Vercel without rebuilding the native shell. Rebuild and resubmit native apps when native configuration, permissions, icons, plugins, bundle settings, or store metadata change.
