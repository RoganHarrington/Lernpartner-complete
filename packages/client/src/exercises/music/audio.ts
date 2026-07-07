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
  /**
   * Rhythmus: Zeitfenster pro Note in Sekunden (inkl. Pause danach).
   * Überschreibt noteDur/gap — für Melodien mit echten Notenwerten.
   */
  slots?: number[];
}

/**
 * Spielt MIDI-Noten nacheinander ab. Rückgabe: Gesamtdauer in Sekunden (inkl. delay).
 * Wirft nie — bei Audio-Problemen läuft die Übung stumm weiter, statt zu blockieren.
 */
export function playSequence(midis: number[], options: PlayOptions = {}): number {
  const { noteDur = 0.65, gap = 0.18, delay = 0, accents = [], slots } = options;
  const total = slots
    ? delay + slots.reduce((sum, slot) => sum + slot, 0)
    : delay + midis.length * (noteDur + gap);
  let ac: AudioContext;
  try {
    ac = ensureContext();
  } catch {
    return total;
  }
  const start = ac.currentTime + 0.05 + delay;

  let offset = 0;
  midis.forEach((midi, i) => {
    const slot = slots ? slots[i] : noteDur + gap;
    const sound = slots ? Math.max(0.15, slot - 0.08) : noteDur;
    const t = start + offset;
    offset += slot;
    // Betonung deutlich hörbar machen: Zielnoten ~3-fache Amplitude,
    // der Rest der Phrase wird dafür abgesenkt.
    const level = accents.includes(i) ? 0.6 : accents.length > 0 ? 0.2 : 0.3;
    const release = Math.min(0.15, sound * 0.4);

    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(midi);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.02);
    gain.gain.setValueAtTime(level, t + sound - release);
    gain.gain.linearRampToValueAtTime(0.001, t + sound);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + sound + 0.05);
  });

  return total;
}
