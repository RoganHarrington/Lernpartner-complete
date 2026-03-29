import type { CefrLevel } from '../types/content.js';

export const CEFR_LEVELS: Record<CefrLevel, { label: string; description: string }> = {
  A1: { label: 'Anfänger', description: 'Grundlegende Kenntnisse' },
  A2: { label: 'Grundlegende Kenntnisse', description: 'Einfache Alltagssituationen' },
  B1: { label: 'Fortgeschrittene Sprachverwendung', description: 'Selbständige Kommunikation' },
  B2: { label: 'Selbständige Sprachverwendung', description: 'Klare, detaillierte Äußerungen' },
  C1: { label: 'Fachkundige Sprachkenntnisse', description: 'Komplexe Sachverhalte' },
  C2: { label: 'Annähernd muttersprachlich', description: 'Müheloses Verstehen' },
} as const;
