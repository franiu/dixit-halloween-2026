#!/usr/bin/env python3
"""Buduje audio/manifest.json ({id: {file, duration}}) z plików audio/*.mp3.
Długość: afinfo (macOS) lub ffprobe."""
import json, pathlib, re, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'audio'

def duration(p):
    if shutil.which('afinfo'):
        out = subprocess.run(['afinfo', str(p)], capture_output=True, text=True).stdout
        m = re.search(r'estimated duration:\s*([\d.]+)', out)
        if m:
            return float(m.group(1))
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)

man = {}
total = 0
for p in sorted(AUDIO.glob('*.mp3')):
    d = round(duration(p), 1)
    man[p.stem] = {'file': f'audio/{p.name}', 'duration': d}
    total += p.stat().st_size
    print(f'{p.stem:11} {d:6.1f}s {p.stat().st_size // 1024:5} KB')
(AUDIO / 'manifest.json').write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n')
print(f'{len(man)} plików, {total / 1e6:.1f} MB')
