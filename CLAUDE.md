# CLAUDE.md — Upiorny Spacer (dixit-halloween-2026)

Context for Claude sessions working in this repo.

## What this is
A static, map-centric single-page app (**all user-facing content in Polish**) for a Halloween walking tour in Philadelphia on **31.10.2026**:
garage (615 Chestnut St) → Washington Square (meeting another group) → Society Hill → dinner at **Brauhaus Schmitz, 718 South St, 16:30** → *The Addams Family* at **Walnut Street Theatre, 19:00** → back to the garage.

It is hosted on **GitHub Pages** from `main` / root at https://franiu.github.io/dixit-halloween-2026/. There is **no backend and no build step**: plain HTML/CSS/JS, with vendored libraries. Pushing to `main` deploys it.

## Files
| Path | Role |
|---|---|
| `index.html` | Page shell. Script order: leaflet → maplibre-gl → leaflet-maplibre-gl → `js/data.js` → `js/audio.js` → `js/app.js` |
| `js/data.js` | **All content and config** (`window.SPOOKY`): schedule, places (garage/dinner/theatre), `stops[]` with Polish stories, quizzes, rituals, links; `walkOrder`, `nightOrder`, `bingo`, `tableTales` |
| `js/app.js` | All app logic in one IIFE: phases and timing, target selection, Leaflet map, geolocation and compass, story/plan/book/bingo sheets, easter eggs |
| `js/audio.js` | `window.SpookyAudio`: WebAudio-synthesized SFX and ambient sound (no audio files). `play(name)`, `startAmbient()`, `stopAmbient()`, `setEnabled(bool)` |
| `css/style.css` | All styles. Color tokens are on `:root` |
| `vendor/leaflet`, `vendor/maplibre` | Leaflet 1.9.4, MapLibre GL 4.7.1, @maplibre/maplibre-gl-leaflet 0.1.4 (vendored from npm) |
| `docs/AUDIO_NARRATION_SPEC.md` | Spec for the next feature: MP3 narration per stop |

## Key behaviors
- **Map:** vector tiles from OpenFreeMap (keyless; the `dark` style is recolored by `spookify()`), falling back to the `positron` style, then to raster OSM, then to CARTO. `?tiles=raster` forces raster.
- **Phases** (by Philadelphia time, `America/New_York`): `approach` → `walk` → `dinner` → `night` → `show` → `home`. Each phase has a deadline. The status pill shows the time buffer, and tapping it when late skips optional stops (`trimRoute`).
- **Route progress:** stops before the last visited one count as passed. Arrival is automatic within `radius` (GPS), or manual via "Jesteśmy!".
- **Far from the route:** when more than 3 km from Washington Square, times are computed from the garage.
- **State** is kept in `localStorage` under key `upiorny-spacer-2026`.
- **Ambient audio** is stopped during the show phase and when the page is hidden.

## Testing
- Serve locally with `python3 -m http.server 8765`, then open `http://localhost:8765/`.
- URL params:
  - `?t=HH:MM` simulates the clock; add `&speed=N` to run it faster
  - `?lat=..&lng=..` simulates position
  - `?reset=1` clears state; `?intro=1` shows the intro again
  - `?dinner=lat,lng&dinnerName=..` and `?garage=..` override places
- Debug handle in the console: `window.__spooky` (`st()`, `planInfo()`, `target()`, `arrive(id)`, `setMe(lat,lng)`, `jumpScare()`, `thingWalk()`).
- Playwright with iPhone 13 emulation works well for screenshots. Before committing, run a syntax check: `node -e "new Function(require('fs').readFileSync('js/app.js','utf8'))"`.

## Conventions
- **Content is Polish.** Facts that are legends must be hedged ("legenda głosi", "podobno"). Don't invent hard facts.
- Keep it static: no bundler, no frameworks. Vendor any new library under `vendor/`. Don't add API keys to the client.
- Keep the stop `id`s stable (`wash`, `jail`, `library`, `carpenters`, `todd`, `white`, `powel`, `kosciuszko`, `stpeters`, `oldpine`, `physick`, `stmarys`, `bethel`, `headhouse`, `mikveh`, `hospital`, `theatre`). Audio files and saved state are keyed by them.
- Commit straight to `main` (that is what deploys). Keep commits small, because the app is in live use on the day.
