import { getItem, type ProgressMap } from '../../learning/leitner';

export type SwahiliMode = 'sound' | 'words' | 'dialog';

/*
 * Wörter: sw = Schreibweise, syllables/stress für die Klang-Einheit
 * (Betonung liegt im Kiswahili fast immer auf der vorletzten Silbe).
 * Bedeutungen und Herkunfts-Reveals liegen in i18n (swahili.meanings.*, swahili.origins.*).
 */
export interface Word {
  id: string;
  sw: string;
  syllables: string[];
  stress: number;
}

export const WORDS: Word[] = [
  { id: 'safari', sw: 'safari', syllables: ['sa', 'fa', 'ri'], stress: 1 },
  { id: 'simba', sw: 'simba', syllables: ['sim', 'ba'], stress: 0 },
  { id: 'rafiki', sw: 'rafiki', syllables: ['ra', 'fi', 'ki'], stress: 1 },
  { id: 'hakuna-matata', sw: 'hakuna matata', syllables: ['ha', 'ku', 'na', 'ma', 'ta', 'ta'], stress: 4 },
  { id: 'polisi', sw: 'polisi', syllables: ['po', 'li', 'si'], stress: 1 },
  { id: 'benki', sw: 'benki', syllables: ['ben', 'ki'], stress: 0 },
  { id: 'hoteli', sw: 'hoteli', syllables: ['ho', 'te', 'li'], stress: 1 },
  { id: 'chai', sw: 'chai', syllables: ['cha', 'i'], stress: 0 },
  { id: 'kahawa', sw: 'kahawa', syllables: ['ka', 'ha', 'wa'], stress: 1 },
  { id: 'kompyuta', sw: 'kompyuta', syllables: ['kom', 'pyu', 'ta'], stress: 1 },
  { id: 'shule', sw: 'shule', syllables: ['shu', 'le'], stress: 0 },
  { id: 'hela', sw: 'hela', syllables: ['he', 'la'], stress: 0 },
  { id: 'baiskeli', sw: 'baiskeli', syllables: ['bai', 'ske', 'li'], stress: 1 },
  { id: 'kiswahili', sw: 'Kiswahili', syllables: ['ki', 'swa', 'hi', 'li'], stress: 2 },
  { id: 'kilimanjaro', sw: 'Kilimanjaro', syllables: ['ki', 'li', 'ma', 'nja', 'ro'], stress: 3 },
];

export function wordById(id: string): Word {
  return WORDS.find((w) => w.id === id)!;
}

/* Anwendungs-Sätze der Wörter-Einheit: ganzer Satz, ein bekanntes Zielwort. */
export interface Sentence {
  id: string;
  clipId: string;
  targetId: string;
  text: string;
}

export const SENTENCES: Sentence[] = [
  { id: 's-shule', clipId: 's-shule', targetId: 'shule', text: 'Ninaenda shule kesho.' },
  { id: 's-simba', clipId: 's-simba', targetId: 'simba', text: 'Simba anakula nyama.' },
  { id: 's-hoteli', clipId: 's-hoteli', targetId: 'hoteli', text: 'Hoteli iko wapi?' },
  { id: 's-chai', clipId: 's-chai', targetId: 'chai', text: 'Chai ni tamu sana.' },
  { id: 's-polisi', clipId: 's-polisi', targetId: 'polisi', text: 'Polisi anakuja sasa.' },
];

/* Ritual-Dialoge: fester Ruf → feste Antwort. Glossen in i18n (swahili.dialogGloss.*). */
export interface Dialog {
  id: string;
  call: string;
  response: string;
  callClip: string;
  responseClip: string;
}

export const DIALOGS: Dialog[] = [
  { id: 'mambo', call: 'Mambo?', response: 'Poa!', callClip: 'mambo', responseClip: 'poa' },
  { id: 'hujambo', call: 'Hujambo?', response: 'Sijambo!', callClip: 'hujambo', responseClip: 'sijambo' },
  { id: 'habari', call: 'Habari yako?', response: 'Nzuri sana!', callClip: 'habari-yako', responseClip: 'nzuri-sana' },
  { id: 'asante', call: 'Asante sana!', response: 'Karibu!', callClip: 'asante-sana', responseClip: 'karibu' },
  { id: 'shikamoo', call: 'Shikamoo!', response: 'Marahaba.', callClip: 'shikamoo', responseClip: 'marahaba' },
];

export function dialogById(id: string): Dialog {
  return DIALOGS.find((d) => d.id === id)!;
}

/* Anwendung der Dialog-Einheit: Wen grüßt man wie? (soziale Regel) */
export interface Persona {
  id: string;
  dialogId: string;
}

export const PERSONAS: Persona[] = [
  { id: 'friend', dialogId: 'mambo' },
  { id: 'stranger', dialogId: 'hujambo' },
  { id: 'elder', dialogId: 'shikamoo' },
];

const TIERS: Record<SwahiliMode, string[][]> = {
  sound: [
    ['safari', 'simba', 'shule', 'rafiki'],
    ['polisi', 'hoteli', 'kahawa'],
    ['kiswahili', 'kilimanjaro'],
  ],
  words: [
    ['safari', 'simba', 'rafiki', 'hakuna-matata'],
    ['polisi', 'benki', 'hoteli', 'chai', 'kahawa', 'kompyuta'],
    ['shule', 'hela', 'baiskeli'],
  ],
  dialog: [['mambo', 'hujambo'], ['habari', 'asante'], ['shikamoo']],
};

export function unlockedTierCount(mode: SwahiliMode, progress: ProgressMap): number {
  const tiers = TIERS[mode];
  let count = 1;
  for (let n = 1; n < tiers.length; n++) {
    const previousMastered = tiers
      .slice(0, n)
      .flat()
      .every((id) => getItem(progress, id).box >= 2);
    if (!previousMastered) break;
    count = n + 1;
  }
  return count;
}

export function itemIdsForLevel(mode: SwahiliMode, level: number): string[] {
  return TIERS[mode].slice(0, level).flat();
}

export function activeItemIds(mode: SwahiliMode, progress: ProgressMap): string[] {
  return itemIdsForLevel(mode, unlockedTierCount(mode, progress));
}
