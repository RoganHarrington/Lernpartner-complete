import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('analytics_snapshots')
@Index(['canonicalItemKey', 'period'])
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'canonical_item_key' })
  canonicalItemKey: string;

  @Column({ type: 'date' })
  period: string;

  @Column({ type: 'int', name: 'total_attempts', default: 0 })
  totalAttempts: number;

  @Column({ type: 'float', name: 'success_rate', default: 0 })
  successRate: number;

  @Column({ type: 'float', name: 'avg_response_time_ms', default: 0 })
  avgResponseTimeMs: number;

  @Column({ type: 'float', name: 'avg_box_level', default: 0 })
  avgBoxLevel: number;

  @Column({ type: 'jsonb', name: 'common_errors', default: '[]' })
  commonErrors: Record<string, unknown>[];

  @Column({ type: 'float', name: 'difficulty_computed', default: 0 })
  difficultyComputed: number;

  @Column({ type: 'jsonb', name: 'cohort_data', default: '[]' })
  cohortData: Record<string, unknown>[];
}
