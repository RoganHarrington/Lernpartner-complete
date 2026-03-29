import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentLibrary } from '../../content/entities/content-library.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'content_id' })
  contentId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, unknown>;

  @Column({ type: 'varchar', name: 'canonical_item_key', unique: true })
  canonicalItemKey: string;

  @Column({ type: 'float', name: 'difficulty_rating', nullable: true })
  difficultyRating: number | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @ManyToOne(() => ContentLibrary, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: ContentLibrary;
}
