/**
 * Leitner box system configuration.
 * Each box level defines the interval (in days) before the next review.
 */
export const BOX_LEVELS = {
  1: { intervalDays: 0, label: 'Sofort wiederholen' },
  2: { intervalDays: 1, label: 'Nach 1 Tag' },
  3: { intervalDays: 3, label: 'Nach 3 Tagen' },
  4: { intervalDays: 7, label: 'Nach 1 Woche' },
  5: { intervalDays: 14, label: 'Nach 2 Wochen' },
  6: { intervalDays: 30, label: 'Nach 1 Monat' },
  7: { intervalDays: 90, label: 'Nach 3 Monaten' },
} as const;

export const MIN_BOX_LEVEL = 1;
export const MAX_BOX_LEVEL = 7;

export type BoxLevel = keyof typeof BOX_LEVELS;
