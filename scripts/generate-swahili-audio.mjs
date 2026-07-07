/*
 * Audio-Erzeugung für die Kiswahili-Lektion (einmalig zur Autorenzeit).
 *
 * Erzeugt fehlende Clips aus packages/client/src/exercises/swahili/clips.json
 * über die OpenRouter-TTS-API (Gemini, Stimme „Kore") nach den erprobten Regeln:
 *  - immer explizite Sprach-Anweisung (Auto-Erkennung kippt sonst ins Englische)
 *  - Einzelwörter (carrier=true) im Swahili-Trägersatz erzeugen und den letzten
 *    Teil automatisch herausschneiden
 *  - Pausenerkennung: min. 320 ms (länger als Plosiv-Verschlüsse), Schnitt am
 *    Pausen-Anfang (leise Anlaute wie /h/ schützen), Stille vorn/hinten trimmen
 *
 * Aufruf:  node scripts/generate-swahili-audio.mjs   (idempotent, überspringt Vorhandenes)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'packages/client/public/audio/sw');
const CLIPS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/client/src/exercises/swahili/clips.json'), 'utf8'),
).clips;

const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const keyLine = envText.split(/\r?\n/).find((l) => l.startsWith('OPENROUTER_API_KEY='));
if (!keyLine) {
  console.error('OPENROUTER_API_KEY fehlt in der .env');
  process.exit(1);
}
const key = keyLine.slice('OPENROUTER_API_KEY='.length).trim().replace(/^"|"$/g, '');

const RATE = 24000;
const INSTRUCTIONS = 'Speak in Kiswahili (Swahili) with natural East African pronunciation.';
const CARRIER_PREFIX = 'Usiwe na wasiwasi, rafiki yangu. ';

function wavWrap(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function ttsPcm(input) {
  const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-tts-preview',
      input,
      voice: 'Kore',
      response_format: 'pcm',
      instructions: INSTRUCTIONS,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

function rmsProfile(samples, win) {
  const rms = [];
  for (let i = 0; i + win <= samples.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += samples[j] * samples[j];
    rms.push(Math.sqrt(sum / win));
  }
  return rms;
}

/* Schneidet den Teil nach der letzten Satzpause heraus (>= 320 ms, damit
   Plosiv-Verschlüsse im Wortinneren nicht als Pause zählen). */
function cutTail(pcm) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const win = Math.round(RATE * 0.02);
  const rms = rmsProfile(samples, win);
  const threshold = Math.max(...rms) * 0.06;
  const minPauseWin = 16; // >= 320 ms
  let pauseStart = -1;
  let pauseEnd = -1;
  let run = 0;
  for (let w = 0; w < rms.length; w++) {
    if (rms[w] < threshold) {
      run++;
    } else {
      if (run >= minPauseWin && (rms.length - w) * 20 >= 300) {
        pauseStart = w - run;
        pauseEnd = w;
      }
      run = 0;
    }
  }
  if (pauseEnd < 0) return null;
  const cutWin = Math.max(pauseStart + 2, pauseEnd - 15);
  return samples.slice(cutWin * win);
}

/* Stille vorn (auf 120 ms) und hinten (auf 200 ms) kürzen. */
function trimSilence(samples) {
  const win = Math.round(RATE * 0.02);
  const rms = rmsProfile(samples, win);
  const threshold = Math.max(...rms) * 0.06;
  let first = 0;
  while (first < rms.length && rms[first] < threshold) first++;
  let last = rms.length - 1;
  while (last > first && rms[last] < threshold) last--;
  const start = Math.max(0, first * win - Math.round(RATE * 0.12));
  const end = Math.min(samples.length, (last + 1) * win + Math.round(RATE * 0.2));
  return samples.slice(start, end);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let generated = 0;
for (const clip of CLIPS) {
  const outPath = path.join(OUT_DIR, `${clip.id}.wav`);
  if (fs.existsSync(outPath)) {
    console.log(`${clip.id}: vorhanden, übersprungen`);
    continue;
  }
  try {
    const input = clip.carrier ? CARRIER_PREFIX + clip.text : clip.text;
    // TTS ist nicht deterministisch: manchmal fehlt die Satzpause im Trägersatz.
    // Dann neu erzeugen statt einen unbrauchbaren Clip zu speichern.
    let samples = null;
    for (let attempt = 1; attempt <= 3 && samples === null; attempt++) {
      const pcm = await ttsPcm(input);
      if (!clip.carrier) {
        samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
        break;
      }
      const tail = cutTail(pcm);
      if (tail) {
        samples = tail;
      } else {
        console.log(`${clip.id}: Versuch ${attempt} ohne Satzpause — neuer Versuch`);
      }
    }
    if (samples === null) {
      console.log(`${clip.id}: FEHLER — nach 3 Versuchen keine schneidbare Aufnahme`);
      continue;
    }
    samples = trimSilence(samples);
    const buffer = Buffer.from(samples.buffer, samples.byteOffset, samples.length * 2);
    fs.writeFileSync(outPath, wavWrap(Buffer.from(buffer)));
    generated++;
    console.log(`${clip.id}: OK (${(samples.length / RATE).toFixed(1)} s)`);
  } catch (err) {
    console.log(`${clip.id}: FEHLER ${err.message}`);
  }
}
console.log(`\nFertig: ${generated} neu erzeugt, Ziel: ${OUT_DIR}`);
