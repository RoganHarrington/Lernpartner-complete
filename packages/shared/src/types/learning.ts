export type LearningStatus =
  | 'new'
  | 'learning'
  | 'known'
  | 'difficult'
  | 'suspended';

export type ReviewResult =
  | 'correct'
  | 'wrong'
  | 'partial'
  | 'skipped';

export type ArtifactType =
  | 'audio_recording'
  | 'drawing'
  | 'handwriting'
  | 'photo';

export interface LearningItem {
  id: string;
  userId: string;
  exerciseId: string;
  boxLevel: number;
  status: LearningStatus;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  totalAttempts: number;
  totalCorrect: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  firstSeenAt: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewHistory {
  id: string;
  learningItemId: string;
  reviewedAt: string;
  result: ReviewResult;
  responseTimeMs: number;
  boxBefore: number;
  boxAfter: number;
  context: ReviewContext;
  deviceId: string;
}

/**
 * Flexible context for different exercise types.
 * Stores what the user actually did during a review.
 */
export interface ReviewContext {
  /** What the user entered / selected */
  userAnswer?: string;
  /** What was expected */
  expectedAnswer?: string;
  /** Specific errors detected */
  errors?: string[];
  /** Number of hints the user requested */
  hintsUsed?: number;
  /** Exercise-type-specific data */
  [key: string]: unknown;
}

export interface ReviewArtifact {
  id: string;
  reviewHistoryId: string;
  type: ArtifactType;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}
