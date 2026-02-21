# Training App

MVP web app for workout planning and analysis.

## Implemented
- Editable workout table
- Volume auto-calc (`Weight * Sets * Reps`)
- Charts (volume by exercise, sets vs reps)
- Local save/reset via browser storage
- Load default data from `data/first_tab.csv`
- Upload `.xlsx` and preserve formula text per row (stored in `Formula` column)
- JSON export/import for dataset portability
- Google Sign-In button (ID token acquisition on client)
- Optional cloud sync endpoint (push/pull JSON via GET/POST)

## Workbook notes (from your uploaded file)
- First sheet name: `Mary Nicole`
- Columns: `Phase, Order, Exercise, Weight, Sets, Reps, Volume, Notes`
- Contains formulas for weight and volume calculations (for example: plate math + SUM formulas)

## Run locally

### Full app + sync backend
```bash
cd training
npm install
cp .env.example .env   # set GOOGLE_CLIENT_ID for real Google token verification
npm start
# open http://localhost:8080
```

### Static-only mode (no backend sync)
```bash
cd training
python3 -m http.server 8080
```

## Notes
- Default backend sync endpoint is `http://localhost:8080/api/sync`.
- You can set that value in the UI "sync endpoint" box and use Push/Pull.
- Google Sign-In stores an ID token in memory; backend validates it when `GOOGLE_CLIENT_ID` is configured.
- For dev/testing, you can also send `x-user-email` header (already supported by the app).
