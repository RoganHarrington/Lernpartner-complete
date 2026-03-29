import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { LearningItem } from './learning-item.entity';
import { Device } from '../../users/entities/device.entity';
import { ReviewArtifact } from './review-artifact.entity';

@Entity('review_history')
@Index(['learningItemId', 'reviewedAt'])
export class ReviewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'learning_item_id' })
  learningItemId: string;

  @Column({ type: 'timestamptz', name: 'reviewed_at' })
  reviewedAt: Date;

  @Column({ type: 'varchar' })
  result: string;

  @Column({ type: 'int', name: 'response_time_ms' })
  responseTimeMs: number;

  @Column({ type: 'smallint', name: 'box_before' })
  boxBefore: number;

  @Column({ type: 'smallint', name: 'box_after' })
  boxAfter: number;

  @Column({ type: 'jsonb', default: '{}' })
  context: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string | null;

  @ManyToOne(() => LearningItem, (item) => item.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'learning_item_id' })
  learningItem: LearningItem;

  @ManyToOne(() => Device, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device | null;

  @OneToMany(() => ReviewArtifact, (artifact) => artifact.reviewHistory)
  artifacts: ReviewArtifact[];
}
