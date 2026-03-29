export interface AnalyticsSnapshot {
  id: string;
  canonicalItemKey: string;
  period: string;
  totalAttempts: number;
  successRate: number;
  avgResponseTimeMs: number;
  avgBoxLevel: number;
  commonErrors: CommonError[];
  difficultyComputed: number;
  cohortData: CohortData[];
}

export interface CommonError {
  expected: string;
  actual: string;
  count: number;
}

export interface CohortData {
  /** Grouping dimension, e.g. "cefr_level", "source_language" */
  dimension: string;
  /** Value within that dimension, e.g. "A1", "de" */
  value: string;
  successRate: number;
  avgResponseTimeMs: number;
  sampleSize: number;
}
