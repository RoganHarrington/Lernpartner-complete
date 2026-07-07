import { getItem, type ProgressMap } from '../../learning/leitner';

export type MusicMode = 'intervals' | 'chords';

export const INTERVALS: { id: string; semitones: number }[] = [
  { id: 'min2', semitones: 1 },
  { id: 'maj2', semitones: 2 },
  { id: 'min3', semitones: 3 },
  { id: 'maj3', semitones: 4 },
  { id: 'p4', semitones: 5 },
  { id: 'tritone', semitones: 6 },
  { id: 'p5', semitones: 7 },
  { id: 'min6', semitones: 8 },
  { id: 'maj6', semitones: 9 },
  { id: 'min7', semitones: 10 },
  { id: 'maj7', semitones: 11 },
  { id: 'oct', semitones: 12 },
];

export const CHORDS: { id: string; offsets: number[] }[] = [
  { id: 'chordMajor', offsets: [0, 4, 7] },
  { id: 'chordMinor', offsets: [0, 3, 7] },
  { id: 'chordMaj7', offsets: [0, 4, 7, 11] },
  { id: 'chordDom7', offsets: [0, 4, 7, 10] },
];

/*
 * „Schneller lernen": klein anfangen, meistern, freischalten.
 * Stufe 1 enthält maximal kontrastreiche Items; die nächste Stufe öffnet
 * sich erst, wenn alle bisherigen Items Box ≥ 2 erreicht haben.
 */
const TIERS: Record<MusicMode, string[][]> = {
  intervals: [
    ['maj3', 'p5', 'oct'],
    ['maj2', 'p4'],
    ['min3', 'maj6'],
    ['min2', 'tritone', 'min6', 'min7', 'maj7'],
  ],
  chords: [['chordMajor', 'chordMinor'], ['chordMaj7'], ['chordDom7']],
};

export function semitonesOf(id: string): number {
  return INTERVALS.find((i) => i.id === id)!.semitones;
}

export function offsetsOf(id: string): number[] {
  return CHORDS.find((c) => c.id === id)!.offsets;
}

export interface Melody {
  id: string;
  titleKey: string;
  itemId: string;
  notes: number[];
}

/*
 * „Natürlich anwenden": echte Melodien. INVARIANTE: Der größte Sprung der
 * Phrase muss genau das Zielintervall (itemId) sein — gefragt wird nach dem
 * „größten Sprung", nie nach einem vagen „markanten". Nur gemeinfreie
 * Melodien verwenden (Volkslieder, alte Klassik) — keine urheberrechtlich
 * geschützten Songs!
 */
export const MELODIES: Melody[] = [
  { id: 'fuerElise', titleKey: 'music.melodies.fuerElise', itemId: 'min2', notes: [76, 75, 76, 75, 76] },
  { id: 'entchen', titleKey: 'music.melodies.entchen', itemId: 'maj2', notes: [60, 62, 64, 65, 67, 67] },
  { id: 'kuckuck', titleKey: 'music.melodies.kuckuck', itemId: 'min3', notes: [67, 64, 67, 64] },
  { id: 'saints', titleKey: 'music.melodies.saints', itemId: 'maj3', notes: [60, 64, 65, 67] },
  { id: 'tannenbaum', titleKey: 'music.melodies.tannenbaum', itemId: 'p4', notes: [60, 65, 65, 65, 67, 69] },
  { id: 'weihnachtsmann', titleKey: 'music.melodies.weihnachtsmann', itemId: 'p5', notes: [60, 60, 67, 67, 69, 69, 67] },
  { id: 'bonnie', titleKey: 'music.melodies.bonnie', itemId: 'maj6', notes: [60, 69, 67, 65] },
];

/* Index, an dem der größte Sprung der Phrase beginnt (bei Gleichstand: der erste). */
export function largestLeapIndex(notes: number[]): number {
  let best = 0;
  for (let i = 1; i < notes.length - 1; i++) {
    if (Math.abs(notes[i + 1] - notes[i]) > Math.abs(notes[best + 1] - notes[best])) {
      best = i;
    }
  }
  return best;
}

/*
 * Tastenkürzel für den Schnellmodus: Ziffer = Stufenzahl des Intervallnamens
 * (Terz = 3, Quinte = 5 …), danach k/g für klein/groß, t (oder 0) für den
 * Tritonus. Solange nur eine Variante einer Stufe freigeschaltet ist,
 * genügt die Ziffer allein.
 */
export interface Hotkey {
  digit: string;
  quality?: 'k' | 'g';
}

const HOTKEYS: Record<MusicMode, Record<string, Hotkey>> = {
  intervals: {
    min2: { digit: '2', quality: 'k' },
    maj2: { digit: '2', quality: 'g' },
    min3: { digit: '3', quality: 'k' },
    maj3: { digit: '3', quality: 'g' },
    p4: { digit: '4' },
    tritone: { digit: 't' },
    p5: { digit: '5' },
    min6: { digit: '6', quality: 'k' },
    maj6: { digit: '6', quality: 'g' },
    min7: { digit: '7', quality: 'k' },
    maj7: { digit: '7', quality: 'g' },
    oct: { digit: '8' },
  },
  chords: {
    chordMajor: { digit: 'd' },
    chordMinor: { digit: 'm' },
    chordMaj7: { digit: 'j' },
    chordDom7: { digit: 's' },
  },
};

export function hotkeyOf(mode: MusicMode, itemId: string): Hotkey {
  return HOTKEYS[mode][itemId];
}

export function hotkeyLabel(mode: MusicMode, itemId: string): string {
  const hotkey = hotkeyOf(mode, itemId);
  return hotkey.quality ? hotkey.digit + hotkey.quality : hotkey.digit;
}

export function activeItemIds(mode: MusicMode, progress: ProgressMap): string[] {
  const tiers = TIERS[mode];
  const active = [...tiers[0]];
  for (let n = 1; n < tiers.length; n++) {
    const previousMastered = tiers
      .slice(0, n)
      .flat()
      .every((id) => getItem(progress, id).box >= 2);
    if (!previousMastered) break;
    active.push(...tiers[n]);
  }
  if (mode === 'intervals') {
    active.sort((a, b) => semitonesOf(a) - semitonesOf(b));
  }
  return active;
}
