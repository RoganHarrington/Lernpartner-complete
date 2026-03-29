export type ScriptSystem =
  | 'latin'
  | 'cyrillic'
  | 'greek'
  | 'arabic'
  | 'hebrew'
  | 'devanagari'
  | 'hiragana'
  | 'katakana'
  | 'hanzi'
  | 'hangul'
  | 'thai';

export type TextDirection = 'ltr' | 'rtl';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentType =
  | 'text'
  | 'dialogue'
  | 'article'
  | 'song_lyrics'
  | 'poem'
  | 'recipe'
  | 'news';

export type MediaRole =
  | 'illustration'
  | 'audio_native'
  | 'audio_slow'
  | 'video_explanation'
  | 'pronunciation_guide'
  | 'subtitle';

export interface LanguagePack {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  title: string;
  description: string;
  scriptSystem: ScriptSystem;
  textDirection: TextDirection;
  metadata: Record<string, unknown>;
}

export interface ContentLibrary {
  id: string;
  languagePackId: string;
  contentType: ContentType;
  title: string;
  body: string;
  difficultyLevel: number;
  cefrLevel: CefrLevel;
  tags: string[];
  metadata: Record<string, unknown>;
  licenseInfo: LicenseInfo;
  createdBy: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseInfo {
  type: string;
  source?: string;
  author?: string;
  expires?: string | null;
  restrictions?: string[];
}

export interface ContentMedia {
  id: string;
  contentId: string;
  role: MediaRole;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  licenseInfo: LicenseInfo;
  metadata: Record<string, unknown>;
}
