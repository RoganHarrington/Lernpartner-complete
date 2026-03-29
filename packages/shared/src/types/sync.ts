import type { LearningItem, ReviewHistory, ReviewArtifact } from './learning.js';

export interface SyncPayload {
  deviceId: string;
  lastSyncAt: string;
  /** Items modified since last sync */
  learningItems: LearningItem[];
  /** New reviews since last sync */
  reviewHistory: ReviewHistory[];
  /** New artifacts since last sync */
  reviewArtifacts: ReviewArtifact[];
}

export interface SyncResponse {
  /** Server timestamp of this sync */
  syncedAt: string;
  /** Items updated by other devices since client's last sync */
  learningItems: LearningItem[];
  reviewHistory: ReviewHistory[];
  /** Conflicts detected (last-write-wins already applied) */
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entityType: 'learning_item' | 'review_history';
  entityId: string;
  clientValue: Record<string, unknown>;
  serverValue: Record<string, unknown>;
  resolution: 'client_wins' | 'server_wins';
  resolvedAt: string;
}
