// Buduje teksty narracji z js/data.js → narration/scripts/<id>.txt
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../js/data.js', import.meta.url), 'utf8'), ctx);
const D = ctx.window.SPOOKY;
const clean = (h) => h
  .replace(/<[^>]+>/g, '')
  .replace(/„|”|“/g, '"')
  .replace(/(\d)\s*r\./g, '$1 roku')
  .replace(/(\d|X|V|I)\s*w\./g, '$1 wieku')
  .replace(/\bok\.\s/g, 'około ')
  .replace(/\bm\.in\./g, 'między innymi')
  .replace(/\bdr\.\s/g, 'doktora ').replace(/\bdr\s/g, 'doktor ')
  .replace(/(^|\s)św\.\s/g, '$1świętego ')
  .replace(/ · /g, ', ')
  .replace(/(\d{4})\/(\d{2})\b/g, (m, a, b) => `${a} na ${a.slice(0, 2)}${b}`)
  .replace(/\s*\(Little Turtle\)/g, ', po angielsku Little Turtle,')
  .replace(/\s*\(([^)]+)\)/g, ', $1,')
  .replace(/6th & Walnut/g, 'Szóstej i Walnut')
  .replace(/\s+/g, ' ')
  .replace(/,\s*,/g, ',')
  .replace(/\b(\d{2})(\d{2})–(\d{2})\b/g, '$1$2–$1$3')
  .replace(/,\s*([.!?])/g, '$1')
  .trim();
const out = new URL('../narration/scripts/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
let total = 0;
for (const s of D.stops) {
  const parts = [clean(`${s.name}. ${s.sub}.`), ...s.story.map(clean), 'A teraz… mroczna strona.', clean(s.dark)];
  const leg = clean(s.legend);
  parts.push('A na koniec… ' + leg);
  if (s.bonusFact) parts.push('A przy okazji: ' + clean(s.bonusFact));
  const txt = parts.join('\n\n') + '\n';
  fs.writeFileSync(new URL(`${s.id}.txt`, out), txt);
  total += txt.length;
  console.log(s.id.padEnd(11), txt.length);
}
console.log('TOTAL chars', total);
