# Spec: Audio narration per stop (MP3)

**Status:** ✅ implemented 31.10 (ElevenLabs v3, voice Henry; see CLAUDE.md) · **Deadline:** before the walk (start 15:30 ET, 31.10.2026), so keep the scope tight.
**Why a laptop session:** the cloud sandbox can't reach TTS providers. The laptop can.

## Goal
Each stop's story sheet gets a **manually triggered** "🎧 Posłuchaj" ("Listen") button that plays a Polish narration of that stop: story → dark side → legend. It plays over the app's ambient sound, which ducks while the voice speaks. The audio is natural-sounding, generated once with a TTS service, and committed as static MP3s.

## Non-goals
- No auto-play on arrival. Narration is always manually triggered, so a group's phones don't talk over each other.
- No streaming or TTS at runtime, and no API keys in the client.
- No narration for quizzes.

## 1. Narration scripts (text)
- **Source:** `js/data.js` → `SPOOKY.stops[]`. Fields: `name`, `sub`, `story[]` (HTML strings), `dark`, `legend`, and `bonusFact` if present.
- **Build:** `tools/build_scripts.mjs` (Node, no dependencies) loads `js/data.js` by stubbing `window`, strips HTML tags, and writes `narration/scripts/<id>.txt`.
- **Structure of each script:**
  1. An intro line: `"<name>. <sub>."`
  2. The `story` paragraphs.
  3. `"A teraz… mroczna strona."` followed by `dark`.
  4. `"Legenda głosi…"` followed by `legend`, but only if the text doesn't already start with a legend phrasing. Avoid saying "legenda" twice.
  5. `bonusFact`, if present.
- **Text normalization for TTS:**
  - Expand `r.` → `roku` and `w.` (century) → `wieku`.
  - Make sure years read naturally (e.g. "1793" → "tysiąc siedemset dziewięćdziesiątym trzecim" is optional; check what the chosen voice does by default).
  - Replace `…` with a pause.
  - Keep English proper nouns as they are (Society Hill, Walnut Street).
- **Target length:** 60–120 s per stop, roughly 150–250 words. The scripts are already about that long.
- **Human review:** commit the `.txt` files so wording can be tweaked before audio is generated. Regenerate only the stops whose text changed.

Stops (17, keyed by stable `id`): `wash`, `jail`, `library`, `carpenters`, `todd`, `white`, `powel`, `kosciuszko`, `stpeters`, `oldpine`, `physick`, `stmarys`, `bethel`, `headhouse`, `mikveh`, `hospital`, `theatre`.
Optional extras: one intro track (`intro.mp3`, a welcome before Washington Square) and the dinner table tales (`tale-0..6.mp3`).

## 2. Voice generation
`tools/generate_audio.py` (Python 3) reads `narration/scripts/*.txt` and writes `narration/raw/<id>.wav|mp3`. The provider is pluggable and chosen by a CLI flag or env var. Candidates, in order of preference:

| Provider | Polish voice | Key needed | Notes |
|---|---|---|---|
| **ElevenLabs** (`eleven_multilingual_v2`) | Any voice; pick a deep, theatrical narrator | `ELEVENLABS_API_KEY` | Best drama. Has character limits on the free tier (all scripts come to about 25k chars, so check quota) |
| **Google Cloud TTS** | `pl-PL-Chirp3-HD-*` or `pl-PL-Wavenet-B` (male) / `-A` (female) | GCP credentials | Very good, cheap |
| **Microsoft Edge TTS** via `pip install edge-tts` | `pl-PL-MarekNeural` (male), `pl-PL-ZofiaNeural` (female) | **None** | Free and good quality. Supports `--rate=-10% --pitch=-8Hz` for a spookier delivery. **Good default if there's no key** |
| Piper (offline) | `pl_PL-darkman-medium`, `pl_PL-gosia-medium` | None | Fully offline, lower quality |

- **Voice direction:** a calm, low male narrator, slightly slower than normal (rate −10%), with dramatic pauses before "mroczna strona". It should be consistent across all stops.
- **Idempotent:** skip a stop if its output exists and the hash of its script hasn't changed. Store the hashes in `narration/manifest.json`.

## 3. Post-processing (ffmpeg)
For each raw file, write `audio/<id>.mp3`:
- **Required:** loudness-normalize, `loudnorm=I=-16:TP=-1.5:LRA=11`.
- **Optional:** a subtle "crypt" reverb, e.g. `aecho=0.8:0.6:40|80:0.25|0.15`. Keep it subtle so the speech stays intelligible outdoors.
- **Optional:** a low ambient bed (wind or drone) at about −28 dB under the voice, with a 0.5 s fade in and a 1.5 s fade out.
- **Encode:** `-ac 1 -ar 44100 -b:a 64k` MP3, which is about 0.5 MB per minute. Target under 1.2 MB per stop and under 15 MB total.
- Write `audio/manifest.json`, shaped like `{ "<id>": { "file": "audio/<id>.mp3", "duration": 93.4 } }`. The app reads this to know which stops have audio.

## 4. App integration (`js/app.js`, `css/style.css`)
- **Loading the manifest:** on startup, `fetch('audio/manifest.json')` and use `{}` if that fails. A stop has narration if its `id` is in the manifest.
- **Button:** in `openStory(id)`, render a player row under the hero: `🎧 Posłuchaj (1:33)` / `⏸ Pauza`, a thin progress bar, and `−15 s`. Hide it if the stop has no narration.
- **Playback:**
  - Use a single shared `HTMLAudioElement`, created lazily on the first tap. Tapping is what unlocks audio on iOS.
  - Set `preload="none"` so nothing downloads until someone taps.
  - Opening another stop's story while audio is playing should not stop it. Show a mini "now playing" chip on the main card (`🎧 Kościuszko ▮▮`) that toggles play/pause.
  - Stop playback when the show phase starts and the theatre has been visited.
- **Ducking:** while narration plays, lower the ambient level by calling a new `SpookyAudio.duck(true|false)`. It ramps the master or ambient gain to about 25% over 0.4 s. Suppress SFX such as Rączka's crawling hand and the scares while narration plays.
- **Media Session API:** set `navigator.mediaSession.metadata` (the title is the stop name, the artist is "Upiorny Spacer"). This makes lock-screen controls work, so people can pocket their phones while walking.
- **Fallback:** if a stop has no MP3, the button can use `speechSynthesis` with a `pl-PL` voice at rate 0.9 and pitch 0.8. Mark it as `🎧 (głos telefonu)`, meaning "phone voice".
- **Rewards:** award +2 dusze (souls) the first time a narration plays at least 80% of the way through, recorded in `st.eggs['listen_'+id]`.
- **Caching:** none needed. GitHub Pages and HTTP caching are enough. Optionally, prefetch the next target's MP3 when on Wi-Fi; skip this if time is short.

## 5. Acceptance criteria
- [ ] `narration/scripts/*.txt` exist for all 17 stops and were reviewed in Polish.
- [ ] `audio/*.mp3` and `audio/manifest.json` are committed. Total size is under 15 MB, and each file is 60–150 s long.
- [ ] On an iPhone in Safari, tapping 🎧 plays the narration, the ambient sound ducks, lock-screen controls work, and the narration keeps playing when the story sheet is closed.
- [ ] No narration auto-plays, and none plays during the show.
- [ ] A missing manifest or a network error leaves the app fully functional, with no console errors.
- [ ] A Playwright smoke test (iPhone 13 emulation, `?t=15:50`) opens the story for `wash`, taps 🎧, and asserts that `audio.paused === false`.
- [ ] Pushed to `main` and checked on the live Pages URL.

## 6. Suggested order (about 60–90 min)
1. `tools/build_scripts.mjs`, then review the texts. *(10 min)*
2. Generate audio with the provider: edge-tts if there's no key. *(15 min)*
3. ffmpeg normalization and the manifest. *(10 min)*
4. Player UI, ducking and Media Session in the app. *(30 min)*
5. Test on a phone, then push. *(15 min)*
