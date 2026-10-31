# 🎃 Upiorny Spacer · Filadelfia · 31.10.2026

A single-page, map-centric Halloween walking tour (in Polish) for our walk from Washington Square through Society Hill, then dinner (16:30) and *The Addams Family* at Walnut Street Theatre (19:00).

Static files only. No build step and no backend, so it runs as-is on GitHub Pages.

## Features
- Dark, foggy Leaflet map with the route, numbered stops and your live position (GPS), plus an arrow that points to the next stop (uses the compass on phones that allow it).
- A countdown to the next deadline (dinner, then curtain) and a live "zapas / spóźnienie" (spare time / running late) indicator. When you're running late, tap it to drop optional stops. When there's spare time, it suggests a nearby bonus stop.
- Historical, spooky stories for each stop (yellow fever of 1793, body snatchers, duels, Kościuszko, Haym Salomon…). Each stop has a hidden "dark side" text you tap to reveal, a quiz, a small sound "ritual" and links to read more.
- Seals collected automatically when you arrive, "dusze" (souls) points and ranks, a Halloween-decoration bingo for Society Hill, and stories to read aloud at dinner.
- Sound synthesized in WebAudio, with no audio files. Ambient sound goes quiet automatically during the show.
- Easter eggs: tap the pumpkin 5×, shake the phone, catch the crawling hand ("Rączka"), and a few occasional surprises.

## Set the garage and the restaurant
Edit `places.garage` and `places.dinner` in `js/data.js`, **or** pass them in the link without editing code:

```
https://<user>.github.io/dixit-halloween-2026/?dinner=39.9480,-75.1440&dinnerName=Restaurant&garage=39.9490,-75.1550&garageName=Parking
```

## Testing
- `?t=16:05` simulates the clock (Philadelphia time). `&speed=10` makes it run faster.
- `?lat=39.947&lng=-75.152` simulates your position.
- `?reset=1` clears progress. `?intro=1` shows the intro screen again.

## Hosting
Settings → Pages → *Deploy from a branch* → `main` / `(root)`.

Map © OpenStreetMap contributors, © CARTO. Leaflet 1.9.4 (vendored).
