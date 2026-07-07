/*
 * Sitzungs-Protokoll für Bug-Reports: zeichnet App-Ereignisse als Ringpuffer
 * im localStorage auf (überlebt Reload und Absturz). Rein lokal, wird nie
 * an einen Server geschickt.
 *
 * Zugriff: „Protokoll kopieren"-Knopf auf der Startseite oder in der
 * Browser-Konsole via `lernpartnerLog.dump()` / `lernpartnerLog.clear()`.
 */

export interface LogEntry {
  t: string;
  e: string;
  d?: Record<string, unknown>;
}

const STORAGE_KEY = 'lernpartner.sessionlog';
const MAX_ENTRIES = 400;

function load(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as LogEntry[];
  } catch {
    return [];
  }
}

let entries: LogEntry[] = load();

export function log(event: string, data?: Record<string, unknown>): void {
  entries.push({ t: new Date().toISOString(), e: event, ...(data ? { d: data } : {}) });
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Speicher nicht verfügbar — Protokoll lebt dann nur im Arbeitsspeicher.
  }
}

export function formatLog(): string {
  return entries
    .map((entry) => `${entry.t} ${entry.e}${entry.d ? ' ' + JSON.stringify(entry.d) : ''}`)
    .join('\n');
}

export function clearLog(): void {
  entries = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // s. o.
  }
}

export function installGlobalErrorLogging(): void {
  window.addEventListener('error', (event) => {
    log('error', { message: event.message, source: `${event.filename}:${event.lineno}` });
  });
  window.addEventListener('unhandledrejection', (event) => {
    log('unhandledrejection', { reason: String(event.reason) });
  });
  (window as unknown as Record<string, unknown>).lernpartnerLog = {
    dump: formatLog,
    clear: clearLog,
  };
}
