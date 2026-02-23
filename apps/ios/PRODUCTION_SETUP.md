# iOS + Web Production Setup Values

## Apple (iOS)
- Bundle ID: `com.pborgen.training`
- Product Name: `TrainingiOS`
- Deployment target: iOS 16+

## Google OAuth (iOS)
1. Create iOS OAuth client in Google Cloud
2. Download `GoogleService-Info.plist`
3. Add plist to app target
4. Add URL Type in Xcode:
   - URL Schemes: `REVERSED_CLIENT_ID` from plist

## Web backend env (`apps/web/.env`)
- `PORT=8080`
- `GOOGLE_CLIENT_ID=<your-web-client-id>`
- `ALLOW_DEV_AUTH_HEADERS=false` (production)

## Runtime checks
- `GET /api/health` should return `{ ok: true }`
- `GET /api/session` should return authenticated user when Bearer token provided
- iOS app Session panel should show `Authenticated: Yes` after Google sign-in
