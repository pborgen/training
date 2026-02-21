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
Use any static server from this folder:

```bash
cd training
python3 -m http.server 8080
# open http://localhost:8080
```

## Notes
- This app runs client-side.
- Google Sign-In currently stores an ID token in memory for optional authenticated sync calls.
- For production cloud sync, pair with a backend endpoint that validates Google tokens and stores per-user records.
