#!/usr/bin/env python3
"""Generuje narrację MP3 z narration/scripts/*.txt przez ElevenLabs.

Użycie:
  ELEVENLABS_API_KEY=... python3 tools/generate_audio.py [--only id1,id2] [--model eleven_v3]
                                                        [--out audio] [--force]
Klucz NIE trafia do repo. Pomija pliki, których tekst się nie zmienił (hash w audio/.hashes.json).
"""
import argparse, hashlib, json, os, pathlib, sys, time, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = '7wG1Xb86NcD408WGmfbJ'  # Henry – Investigative and Documentary (pl-PL)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--model', default='eleven_v3')
    ap.add_argument('--format', default='mp3_44100_64')
    ap.add_argument('--voice', default=VOICE)
    ap.add_argument('--out', default=str(ROOT / 'audio'))
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--stability', type=float, default=0.5)
    ap.add_argument('--style', type=float, default=0.25)
    ap.add_argument('--speed', type=float, default=0.95)
    a = ap.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('Brak ELEVENLABS_API_KEY')
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    man_path = out / '.hashes.json'
    man = json.loads(man_path.read_text()) if man_path.exists() else {}
    only = set(filter(None, a.only.split(',')))
    for txt in sorted((ROOT / 'narration' / 'scripts').glob('*.txt')):
        sid = txt.stem
        if only and sid not in only:
            continue
        text = txt.read_text().strip()
        h = hashlib.sha1(f'{text}|{a.model}|{a.voice}|{a.format}|{a.stability}|{a.style}|{a.speed}'.encode()).hexdigest()
        dst = out / f'{sid}.mp3'
        if dst.exists() and man.get(sid) == h and not a.force:
            print(f'= {sid} (bez zmian)'); continue
        body = {'text': text, 'model_id': a.model,
                'voice_settings': {'stability': a.stability, 'similarity_boost': 0.8, 'style': a.style,
                                   'use_speaker_boost': True, 'speed': a.speed}}
        if a.model == 'eleven_v3':
            body['voice_settings'] = {'stability': a.stability}  # v3: tylko stability (0, 0.5, 1)
            body['language_code'] = 'pl'
        req = urllib.request.Request(
            f'https://api.elevenlabs.io/v1/text-to-speech/{a.voice}?output_format={a.format}',
            data=json.dumps(body).encode(), method='POST',
            headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=180) as r:
                    dst.write_bytes(r.read())
                break
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors='replace')[:300]
                if e.code in (429, 500, 502, 503) and attempt < 2:
                    time.sleep(4 * (attempt + 1)); continue
                sys.exit(f'✗ {sid}: HTTP {e.code} {msg}')
        man[sid] = h
        man_path.write_text(json.dumps(man, indent=1))
        print(f'✓ {sid} ({len(text)} znaków, {dst.stat().st_size // 1024} KB)')

if __name__ == '__main__':
    main()
