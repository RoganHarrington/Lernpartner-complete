export type ExerciseType =
  | 'vocabulary'
  | 'fill_gap'
  | 'dictation'
  | 'shadowing'
  | 'translation'
  | 'multiple_choice'
  | 'matching'
  | 'ordering';

export interface Exercise {
  id: string;
  contentId: string;
  type: ExerciseType;
  config: ExerciseConfig;
  canonicalItemKey: string;
  difficultyRating: number | null;
  version: number;
}

/**
 * Base config shared by all exercise types.
 * Each type extends this with its own fields via the JSONB `config` column.
 */
export interface ExerciseConfig {
  /** Prompt shown to the user, e.g. "Translate this word" */
  prompt?: string;
  /** Hints available (cost: reduces score) */
  hints?: string[];
  /** Type-specific configuration */
  [key: string]: unknown;
}

export interface VocabularyConfig extends ExerciseConfig {
  term: string;
  translation: string;
  exampleSentence?: string;
  audioKey?: string;
}

export interface FillGapConfig extends ExerciseConfig {
  sentence: string;
  gaps: GapDefinition[];
}

export interface GapDefinition {
  index: number;
  answer: string;
  alternatives?: string[];
}

export interface DictationConfig extends ExerciseConfig {
  audioKey: string;
  expectedText: string;
  slowAudioKey?: string;
}
