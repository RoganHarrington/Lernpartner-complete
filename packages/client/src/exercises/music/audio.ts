/*
 * Klangerzeugung über die Web Audio API — keine Audiodateien nötig,
 * funktioniert offline. Muss aus einer Nutzer-Geste heraus aufgerufen
 * werden (Browser-Autoplay-Regel), daher nur aus Click-Handlern verwenden.
 */

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export interface PlayOptions {
  noteDur?: number;
  gap?: number;
  delay?: number;
  /** Indizes von Noten, die betont (lauter) gespielt werden. */
  accents?: number[];
}

/**
 * Spielt MIDI-Noten nacheinander ab. Rückgabe: Gesamtdauer in Sekunden (inkl. delay).
 * Wirft nie — bei Audio-Problemen läuft die Übung stumm weiter, statt zu blockieren.
 */
export function playSequence(midis: number[], options: PlayOptions = {}): number {
  const { noteDur = 0.65, gap = 0.18, delay = 0, accents = [] } = options;
  const fallbackDuration = delay + midis.length * (noteDur + gap);
  let ac: AudioContext;
  try {
    ac = ensureContext();
  } catch {
    return fallbackDuration;
  }
  const start = ac.currentTime + 0.05 + delay;

  midis.forEach((midi, i) => {
    const t = start + i * (noteDur + gap);
    const level = accents.includes(i) ? 0.48 : 0.3;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(midi);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.02);
    gain.gain.setValueAtTime(level, t + noteDur - 0.15);
    gain.gain.linearRampToValueAtTime(0.001, t + noteDur);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + noteDur + 0.05);
  });

  return delay + midis.length * (noteDur + gap);
}
