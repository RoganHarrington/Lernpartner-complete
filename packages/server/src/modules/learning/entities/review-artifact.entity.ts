import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewHistory } from './review-history.entity';

@Entity('review_artifacts')
export class ReviewArtifact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'review_history_id' })
  reviewHistoryId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar', name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'varchar', name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'int', name: 'duration_ms', nullable: true })
  durationMs: number | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ReviewHistory, (review) => review.artifacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_history_id' })
  reviewHistory: ReviewHistory;
}
