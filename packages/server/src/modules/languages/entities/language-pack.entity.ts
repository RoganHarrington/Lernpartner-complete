import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('language_packs')
export class LanguagePack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'source_language' })
  sourceLanguage: string;

  @Column({ type: 'varchar', name: 'target_language' })
  targetLanguage: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', name: 'script_system' })
  scriptSystem: string;

  @Column({ type: 'varchar', name: 'text_direction', default: 'ltr' })
  textDirection: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;
}
