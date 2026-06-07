# Training Monorepo

This repository is now organized as a monorepo.

## Structure
- `apps/api` — Python FastAPI backend (serves the API + the built React client)
- `apps/web` — React SPA client (Vite)
- `apps/agent` — Python LangChain agents
- `apps/knowledge` — Python scraper for workout content
- `apps/ios` — native iOS app scaffold (SwiftUI + XcodeGen)

## Web app
```bash
npm install
./scripts/dev.sh   # Postgres check + FastAPI on :8080 + Vite client
# open the Vite URL it prints (it proxies /api → :8080)
```

## iOS app
```bash
cd apps/ios
brew install xcodegen
xcodegen generate
open TrainingiOS.xcodeproj
```
