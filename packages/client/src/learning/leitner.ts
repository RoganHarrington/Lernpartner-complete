/*
 * Generischer Lernfortschritt (Leitner-Boxen) — themenunabhängig.
 * „Länger behalten": schwache Items kommen häufiger dran, alles bleibt
 * gemischt (Interleaving). Gespeichert wird lokal (offline-first);
 * die Synchronisation mit dem Server kommt später über /api/sync.
 */

export interface ItemProgress {
  box: number;
  correct: number;
  wrong: number;
  lastSeen: string | null;
}

export type ProgressMap = Record<string, ItemProgress>;

const STORAGE_PREFIX = 'lernpartner.progress.';
const MAX_BOX = 5;

export function getItem(progress: ProgressMap, itemId: string): ItemProgress {
  return progress[itemId] ?? { box: 1, correct: 0, wrong: 0, lastSeen: null };
}

export function loadProgress(area: string): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + area);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function recordResult(area: string, itemId: string, correct: boolean): ItemProgress {
  const progress = loadProgress(area);
  const item = getItem(progress, itemId);
  const updated: ItemProgress = {
    box: correct ? Math.min(MAX_BOX, item.box + 1) : Math.max(1, item.box - 1),
    correct: item.correct + (correct ? 1 : 0),
    wrong: item.wrong + (correct ? 0 : 1),
    lastSeen: new Date().toISOString(),
  };
  progress[itemId] = updated;
  try {
    localStorage.setItem(STORAGE_PREFIX + area, JSON.stringify(progress));
  } catch {
    // Speicher nicht verfügbar — Fortschritt gilt dann nur für diese Sitzung.
  }
  return updated;
}

function weightedPick(ids: string[], weightOf: (id: string) => number): string {
  const total = ids.reduce((sum, id) => sum + weightOf(id), 0);
  let r = Math.random() * total;
  for (const id of ids) {
    r -= weightOf(id);
    if (r <= 0) return id;
  }
  return ids[ids.length - 1];
}

export function buildSession(itemIds: string[], progress: ProgressMap, count: number): string[] {
  if (itemIds.length === 0 || count <= 0) return [];
  const weightOf = (id: string) => (MAX_BOX + 1 - getItem(progress, id).box) ** 2;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let pick = weightedPick(itemIds, weightOf);
    if (itemIds.length > 1 && pick === result[result.length - 1]) {
      pick = weightedPick(itemIds, weightOf);
    }
    result.push(pick);
  }
  return result;
}
