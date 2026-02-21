# Training Monorepo

This repository is now organized as a monorepo.

## Structure
- `apps/web` — TypeScript web app + sync backend
- `apps/ios` — native iOS app scaffold (SwiftUI + XcodeGen)

## Web app
```bash
npm install
npm run web:start
# open http://localhost:8080
```

## iOS app
```bash
cd apps/ios
brew install xcodegen
xcodegen generate
open TrainingiOS.xcodeproj
```
