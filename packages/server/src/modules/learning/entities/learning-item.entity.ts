import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { ReviewHistory } from './review-history.entity';

@Entity('learning_items')
@Index(['userId', 'exerciseId'], { unique: true })
@Index(['userId', 'nextReviewAt'])
export class LearningItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'exercise_id' })
  exerciseId: string;

  @Column({ type: 'smallint', name: 'box_level', default: 1 })
  boxLevel: number;

  @Column({ type: 'varchar', default: 'new' })
  status: string;

  @Column({ type: 'int', name: 'consecutive_correct', default: 0 })
  consecutiveCorrect: number;

  @Column({ type: 'int', name: 'consecutive_wrong', default: 0 })
  consecutiveWrong: number;

  @Column({ type: 'int', name: 'total_attempts', default: 0 })
  totalAttempts: number;

  @Column({ type: 'int', name: 'total_correct', default: 0 })
  totalCorrect: number;

  @Column({ type: 'float', name: 'ease_factor', default: 2.5 })
  easeFactor: number;

  @Column({ type: 'float', name: 'interval_days', default: 0 })
  intervalDays: number;

  @Column({ type: 'timestamptz', name: 'next_review_at' })
  nextReviewAt: Date;

  @Column({ type: 'timestamptz', name: 'last_reviewed_at', nullable: true })
  lastReviewedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'first_seen_at' })
  firstSeenAt: Date;

  @Column({ type: 'timestamptz', name: 'last_synced_at', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @OneToMany(() => ReviewHistory, (review) => review.learningItem)
  reviews: ReviewHistory[];
}
