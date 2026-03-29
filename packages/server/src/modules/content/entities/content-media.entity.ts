import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentLibrary } from './content-library.entity';

@Entity('content_media')
export class ContentMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'content_id' })
  contentId: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'varchar', name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'varchar', name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'int', name: 'duration_ms', nullable: true })
  durationMs: number | null;

  @Column({ type: 'jsonb', name: 'license_info', default: '{}' })
  licenseInfo: Record<string, unknown>;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @ManyToOne(() => ContentLibrary, (content) => content.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: ContentLibrary;
}
