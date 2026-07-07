import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildSession,
  loadProgress,
  recordResult,
  type ProgressMap,
} from '../../learning/leitner';
import { log } from '../../services/sessionLog';
import { playClip } from './audio';
import {
  activeItemIds,
  dialogById,
  itemIdsForLevel,
  PERSONAS,
  SENTENCES,
  unlockedTierCount,
  wordById,
  type SwahiliMode,
} from './data';

interface Props {
  mode: SwahiliMode;
  onExit: () => void;
}

interface Option {
  id: string;
  label?: string;
  labelKey?: string;
  clipId?: string;
}

type QuestionKind = 'word' | 'sentence' | 'stress' | 'spelling' | 'respond' | 'initiate';

interface Question {
  itemId: string;
  kind: QuestionKind;
  applied: boolean;
  clipId?: string;
  displayWord?: string;
  personaId?: string;
  sentenceText?: string;
  options: Option[];
  correctId: string;
}

const SESSION_LENGTH = 10;

function areaOf(mode: SwahiliMode): string {
  return `sw.${mode}`;
}

function levelPrefKey(mode: SwahiliMode): string {
  return `lernpartner.pref.level.${areaOf(mode)}`;
}

function initialLevel(mode: SwahiliMode): number {
  const unlocked = unlockedTierCount(mode, loadProgress(areaOf(mode)));
  const stored = parseInt(localStorage.getItem(levelPrefKey(mode)) ?? '', 10);
  return Number.isFinite(stored) && stored >= 1 ? Math.min(stored, unlocked) : unlocked;
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

/* Falschschreibung für den Hör-Lese-Abgleich: genau ein Vokal vertauscht. */
function misspell(sw: string, taken: Set<string>): string {
  for (let attempt = 0; attempt < 30; attempt++) {
    const vowelIndexes = [...sw]
      .map((c, i) => (VOWELS.includes(c) ? i : -1))
      .filter((i) => i >= 0);
    const i = vowelIndexes[Math.floor(Math.random() * vowelIndexes.length)];
    const v = VOWELS[Math.floor(Math.random() * VOWELS.length)];
    if (v === sw[i]) continue;
    const candidate = sw.slice(0, i) + v + sw.slice(i + 1);
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  return sw.split('').reverse().join('');
}

function wordOptions(correctId: string, active: string[], asMeaning: boolean): Option[] {
  const distractors = shuffled(active.filter((id) => id !== correctId)).slice(0, 3);
  return shuffled(
    [correctId, ...distractors].map((id) => ({
      id,
      ...(asMeaning ? { labelKey: `swahili.meanings.${id}` } : { label: wordById(id).sw }),
      clipId: id,
    })),
  );
}

function buildQuestions(mode: SwahiliMode, progress: ProgressMap, active: string[]): Question[] {
  if (mode === 'words') {
    const main: Question[] = buildSession(active, progress, SESSION_LENGTH - 2).map((id) => ({
      itemId: id,
      kind: 'word',
      applied: false,
      clipId: id,
      options: wordOptions(id, active, true),
      correctId: id,
    }));
    // „Natürlich anwenden": ganzer Satz, bekanntes Wort heraushören.
    const applied: Question[] = shuffled(SENTENCES.filter((s) => active.includes(s.targetId)))
      .slice(0, 2)
      .map((s) => ({
        itemId: s.targetId,
        kind: 'sentence',
        applied: true,
        clipId: s.clipId,
        sentenceText: s.text,
        options: wordOptions(s.targetId, active, false),
        correctId: s.targetId,
      }));
    const fill: Question[] = buildSession(active, progress, 2 - applied.length).map((id) => ({
      itemId: id,
      kind: 'word',
      applied: false,
      clipId: id,
      options: wordOptions(id, active, true),
      correctId: id,
    }));
    return [...main, ...applied, ...fill];
  }

  if (mode === 'sound') {
    return buildSession(active, progress, SESSION_LENGTH).map((id, index) => {
      const word = wordById(id);
      if (index % 2 === 0) {
        return {
          itemId: id,
          kind: 'stress' as const,
          applied: false,
          displayWord: word.sw,
          options: word.syllables.map((syl, i) => ({ id: `syl-${i}`, label: syl })),
          correctId: `syl-${word.stress}`,
        };
      }
      const taken = new Set([word.sw]);
      const variants: Option[] = [
        { id: 'sp-ok', label: word.sw, clipId: id },
        { id: 'sp-1', label: misspell(word.sw, taken) },
        { id: 'sp-2', label: misspell(word.sw, taken) },
      ];
      return {
        itemId: id,
        kind: 'spelling' as const,
        applied: false,
        clipId: id,
        options: shuffled(variants),
        correctId: 'sp-ok',
      };
    });
  }

  // dialog
  const main: Question[] = buildSession(active, progress, SESSION_LENGTH - 2).map((id) => {
    const dialog = dialogById(id);
    return {
      itemId: id,
      kind: 'respond' as const,
      applied: false,
      clipId: dialog.callClip,
      options: shuffled(
        active.map((d) => ({
          id: d,
          label: dialogById(d).response,
          clipId: dialogById(d).responseClip,
        })),
      ),
      correctId: id,
    };
  });
  // „Natürlich anwenden": Wen grüßt man wie? (soziale Regel)
  const applied: Question[] = shuffled(PERSONAS.filter((p) => active.includes(p.dialogId)))
    .slice(0, 2)
    .map((persona) => ({
      itemId: persona.dialogId,
      kind: 'initiate' as const,
      applied: true,
      personaId: persona.id,
      options: shuffled(
        active.map((d) => ({
          id: d,
          label: dialogById(d).call,
          clipId: dialogById(d).callClip,
        })),
      ),
      correctId: persona.dialogId,
    }));
  return [...main, ...applied];
}

function promptKey(question: Question, mode: SwahiliMode): string {
  switch (question.kind) {
    case 'stress':
      return 'swahili.sound.stressPrompt';
    case 'spelling':
      return 'swahili.sound.spellingPrompt';
    case 'sentence':
      return 'swahili.words.sentencePrompt';
    case 'respond':
      return 'swahili.dialog.respondPrompt';
    case 'initiate':
      return 'swahili.dialog.initiatePrompt';
    default:
      return `swahili.${mode}.prompt`;
  }
}

function SwahiliTraining({ mode, onExit }: Props) {
  const { t } = useTranslation();
  const area = areaOf(mode);

  const [level, setLevel] = useState(() => initialLevel(mode));
  const [unlockedLevels, setUnlockedLevels] = useState(() =>
    unlockedTierCount(mode, loadProgress(area)),
  );
  const [options, setOptions] = useState(() => itemIdsForLevel(mode, initialLevel(mode)));
  const [questions, setQuestions] = useState(() =>
    buildQuestions(mode, loadProgress(area), itemIdsForLevel(mode, initialLevel(mode))),
  );
  const [fullActiveBefore, setFullActiveBefore] = useState(() =>
    activeItemIds(mode, loadProgress(area)),
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playingChip, setPlayingChip] = useState<string | null>(null);

  const question = questions[index];
  // Betonungsfragen: erst die Regel anwenden, dann hören — kein Vorab-Abspielen.
  const needsListening = question.kind !== 'stress';
  const [played, setPlayed] = useState(!needsListening);
  const isCorrect = answer === question.correctId;
  const isLast = index + 1 >= questions.length;

  const loggedStart = useRef(false);
  const loggedFinish = useRef(false);
  if (!loggedStart.current) {
    loggedStart.current = true;
    log('lesson.start', {
      mode: area,
      level,
      options: options.join(','),
      items: questions.map((q) => `${q.kind}:${q.itemId}`).join(','),
    });
  }

  const highlightWhilePlaying = (clipId: string, optionId: string) => {
    playClip(clipId, {
      onStart: () => setPlayingChip(optionId),
      onEnd: () => setPlayingChip((current) => (current === optionId ? null : current)),
    });
  };

  const play = () => {
    if (!question.clipId) return;
    log('play', { q: index + 1, kind: question.kind, item: question.itemId });
    playClip(question.clipId);
    setPlayed(true);
  };

  const choose = (optionId: string) => {
    if (answer !== null || !played) return;
    setAnswer(optionId);
    const correct = optionId === question.correctId;
    log('answer', {
      q: index + 1,
      kind: question.kind,
      item: question.itemId,
      chosen: optionId,
      correct,
    });
    if (correct) {
      setCorrectCount((c) => c + 1);
      setXp((x) => x + (question.applied ? 15 : 10));
    }
    // Einprägen: nach der Antwort erklingt das Richtige, das Label leuchtet mit.
    const correctOption = question.options.find((o) => o.id === question.correctId)!;
    const confirmClip =
      correctOption.clipId ?? question.clipId ?? (question.kind === 'stress' ? question.itemId : undefined);
    if (confirmClip && (!correct || question.kind === 'stress' || question.kind === 'spelling')) {
      highlightWhilePlaying(confirmClip, question.correctId);
    }
    recordResult(area, question.itemId, correct);
  };

  const playOption = (option: Option) => {
    if (!option.clipId) return;
    log('playItem', { q: index + 1, item: option.id });
    highlightWhilePlaying(option.clipId, option.id);
  };

  const next = () => {
    setPlayingChip(null);
    log('next', { to: isLast ? 'ende' : index + 2 });
    if (isLast) {
      setFinished(true);
      return;
    }
    const upcoming = questions[index + 1];
    setIndex(index + 1);
    setAnswer(null);
    if (upcoming.kind === 'stress') {
      setPlayed(true);
    } else {
      setPlayed(true);
      if (upcoming.clipId) playClip(upcoming.clipId);
    }
  };

  const startSession = (wantedLevel: number) => {
    loggedFinish.current = false;
    const progress = loadProgress(area);
    const unlocked = unlockedTierCount(mode, progress);
    const clamped = Math.max(1, Math.min(wantedLevel, unlocked));
    setUnlockedLevels(unlocked);
    setLevel(clamped);
    const items = itemIdsForLevel(mode, clamped);
    setOptions(items);
    setFullActiveBefore(activeItemIds(mode, progress));
    const fresh = buildQuestions(mode, progress, items);
    setQuestions(fresh);
    setIndex(0);
    setAnswer(null);
    setPlayed(fresh[0].kind === 'stress');
    setCorrectCount(0);
    setXp(0);
    setFinished(false);
    setPlayingChip(null);
  };

  const restart = () => {
    log('lesson.restart', { mode: area, level });
    startSession(level);
  };

  const applyLevel = (wantedLevel: number) => {
    if (wantedLevel === level) return;
    localStorage.setItem(levelPrefKey(mode), String(wantedLevel));
    log('level', { level: wantedLevel });
    startSession(wantedLevel);
  };

  if (finished) {
    const newlyUnlocked = activeItemIds(mode, loadProgress(area)).filter(
      (id) => !fullActiveBefore.includes(id),
    );
    if (!loggedFinish.current) {
      loggedFinish.current = true;
      log('lesson.finished', {
        mode: area,
        correct: correctCount,
        total: questions.length,
        xp,
        unlocked: newlyUnlocked.join(','),
      });
    }
    const unlockLabel = (id: string) =>
      mode === 'dialog' ? dialogById(id).call : wordById(id).sw;
    return (
      <div className="lesson">
        <div className="stimulus-card">
          <h2>{t('learning.sessionComplete')}</h2>
          <p className="result-score">
            {t('session.score', { correct: correctCount, total: questions.length })}
          </p>
          <p className="result-xp">+{xp} XP</p>
          {newlyUnlocked.length > 0 && (
            <p className="unlock-note">
              {t('session.unlocked')} {newlyUnlocked.map(unlockLabel).join(', ')}
            </p>
          )}
          <div className="feedback-actions">
            <button className="btn btn-primary" type="button" onClick={restart}>
              {t('session.restart')}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onExit}>
              {t('session.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chipClass = (optionId: string) => {
    let cls = 'answer-chip';
    if (answer !== null && optionId === question.correctId) cls += ' is-correct';
    else if (answer !== null && optionId === answer) cls += ' is-wrong';
    if (playingChip === optionId) cls += ' is-playing';
    return cls;
  };

  const revealText = () => {
    switch (question.kind) {
      case 'word':
        return t(`swahili.origins.${question.itemId}`);
      case 'sentence':
        return `${t('swahili.sentenceWas', { text: question.sentenceText })} — ${t(`swahili.origins.${question.itemId}`)}`;
      case 'stress':
        return t('swahili.stressRule');
      case 'spelling':
        return `${wordById(question.itemId).sw} — ${t(`swahili.meanings.${question.itemId}`)}`;
      case 'respond':
      case 'initiate':
        return t(`swahili.dialogGloss.${question.itemId}`);
    }
  };

  return (
    <div className="lesson">
      <div className="lesson-head">
        <button className="back-btn" type="button" onClick={onExit}>
          ← {t('session.back')}
        </button>
        <span className="lesson-count">
          {t('session.question', { current: index + 1, total: questions.length })}
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((index + (answer !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {unlockedLevels > 1 && (
        <div className="level-row" role="group" aria-label={t('session.levelLabel')}>
          <span className="level-label">{t('session.levelLabel')}</span>
          {Array.from({ length: unlockedLevels }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`level-chip${n === level ? ' on' : ''}`}
              aria-pressed={n === level}
              onClick={() => applyLevel(n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <div className="stimulus-card">
        {question.applied && <span className="applied-tag">{t('session.application')}</span>}
        <p className="prompt">{t(promptKey(question, mode))}</p>
        {question.kind === 'stress' && <p className="big-word">{question.displayWord}</p>}
        {question.personaId && (
          <p className="context-line">{t(`swahili.personas.${question.personaId}`)}</p>
        )}

        {question.clipId && (
          <button className="play-big" type="button" onClick={play} aria-label={t('session.listen')}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5Z" />
            </svg>
          </button>
        )}
        {question.clipId && played && answer === null && (
          <button className="link-btn" type="button" onClick={play}>
            {t('session.replay')}
          </button>
        )}

        <div className="answer-grid">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={chipClass(option.id)}
              disabled={!played}
              onClick={() => (answer === null ? choose(option.id) : playOption(option))}
            >
              {option.label ?? t(option.labelKey!)}
            </button>
          ))}
        </div>

        {answer !== null && (
          <div className={`feedback-box ${isCorrect ? 'good' : 'bad'}`}>
            <p className="feedback-title">
              {isCorrect
                ? t('learning.correct')
                : `${t('learning.wrong')} — ${t('session.correctWas')} ${
                    question.options.find((o) => o.id === question.correctId)?.label ??
                    t(question.options.find((o) => o.id === question.correctId)!.labelKey!)
                  }`}
            </p>
            <p className="anchor-hint">{revealText()}</p>
            <p className="explore-hint">{t('session.exploreHint')}</p>
            <div className="feedback-actions">
              <button className="btn btn-primary" type="button" onClick={next}>
                {isLast ? t('session.done') : t('session.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwahiliTraining;
