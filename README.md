# MovieVenn

Compare two Letterboxd **watched** CSVs on your phone in Safari.

## On your iPhone

1. On your Mac, from this folder run:

```bash
python3 -m http.server 8765
```

2. Find your Mac’s local IP (e.g. System Settings → Network, or `ipconfig getifaddr en0`).
3. On your iPhone (same Wi‑Fi), open Safari to `http://YOUR_IP:8765`.
4. Optional: Share → **Add to Home Screen** for an app-like icon.

## How to use

1. Rename the two people (tap the names).
2. Upload each person’s Letterboxd `watched.csv`.
3. Tap Venn zones or the tabs to browse shared / only-you / only-them films.

Export from Letterboxd: **Settings → Import & Export → Export Your Data** → use `watched.csv`.
