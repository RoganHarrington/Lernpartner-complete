import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { LanguagePack } from '../../languages/entities/language-pack.entity';
import { ContentMedia } from './content-media.entity';

@Entity('content_library')
export class ContentLibrary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'language_pack_id' })
  languagePackId: string;

  @Column({ type: 'varchar', name: 'content_type' })
  contentType: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'int', name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column({ type: 'varchar', name: 'cefr_level', default: 'A1' })
  cefrLevel: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'license_info', default: '{}' })
  licenseInfo: Record<string, unknown>;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => LanguagePack, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_pack_id' })
  languagePack: LanguagePack;

  @OneToMany(() => ContentMedia, (media) => media.content)
  media: ContentMedia[];
}
