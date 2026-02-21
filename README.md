# Training App

MVP web app for workout planning and analysis.

## Implemented
- Editable workout table
- Volume auto-calc (`Weight * Sets * Reps`)
- Charts (volume by exercise, sets vs reps)
- Local save/reset via browser storage
- Load default data from `data/first_tab.csv`
- Upload `.xlsx` and preserve formula text where available (stored in `Formula` column)

## Run locally
Use any static server from this folder:

```bash
cd training
python3 -m http.server 8080
# open http://localhost:8080
```

## Notes
- This MVP runs fully client-side (no backend auth yet).
- Next step: add Google login + cloud sync.
