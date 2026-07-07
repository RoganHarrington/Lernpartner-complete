import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildSession,
  getItem,
  loadProgress,
  recordResult,
  type ProgressMap,
} from '../../learning/leitner';
import { log } from '../../services/sessionLog';
import { playSequence, type PlayOptions } from './audio';
import {
  activeItemIds,
  hotkeyLabel,
  hotkeyOf,
  largestLeapIndex,
  MELODIES,
  offsetsOf,
  semitonesOf,
  type MusicMode,
} from './data';

interface Props {
  mode: MusicMode;
  onExit: () => void;
}

interface Question {
  itemId: string;
  root: number;
  applied: boolean;
  melodyTitleKey?: string;
  melodyNotes?: number[];
  melodyTarget?: number;
}

const SESSION_LENGTH = 10;
/* Schnellmodus wird angeboten, sobald so viele Items Box ≥ 3 erreicht haben. */
const SPEED_UNLOCK_MASTERED = 3;

function areaOf(mode: MusicMode): string {
  return mode === 'intervals' ? 'music.intervals' : 'music.chords';
}

function speedPrefKey(mode: MusicMode): string {
  return `lernpartner.pref.speedMode.${areaOf(mode)}`;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(mode: MusicMode, progress: ProgressMap): Question[] {
  const active = activeItemIds(mode, progress);
  // „Natürlich anwenden": die Sitzung endet mit Sprüngen in echten Melodien.
  const appliedCount = mode === 'intervals' ? 2 : 0;
  const main: Question[] = buildSession(active, progress, SESSION_LENGTH - appliedCount).map(
    (id) => ({ itemId: id, root: randomInt(55, 69), applied: false }),
  );
  const melodies = shuffled(MELODIES.filter((m) => active.includes(m.itemId))).slice(
    0,
    appliedCount,
  );
  const applied: Question[] = melodies.map((melody) => {
    // Leichte Transposition: wiedererkennbar, aber nie exakt gleich.
    const shift = randomInt(-2, 2);
    return {
      itemId: melody.itemId,
      root: 0,
      applied: true,
      melodyTitleKey: melody.titleKey,
      melodyNotes: melody.notes.map((n) => n + shift),
      melodyTarget: largestLeapIndex(melody.notes),
    };
  });
  // Falls für die aktiven Items (noch) keine Melodie existiert: generische Anwendungs-Aufgabe.
  const generic: Question[] = buildSession(active, progress, appliedCount - applied.length).map(
    (id) => ({ itemId: id, root: randomInt(50, 58), applied: true }),
  );
  return [...main, ...applied, ...generic];
}

function midisFor(question: Question, mode: MusicMode): number[] {
  if (question.melodyNotes) return question.melodyNotes;
  if (mode === 'chords') {
    return offsetsOf(question.itemId).map((offset) => question.root + offset);
  }
  const semitones = semitonesOf(question.itemId);
  if (question.applied) {
    // Kleine Melodie: zwei Schritte, dann der Zielsprung am Ende.
    return [question.root, question.root + 2, question.root + 4, question.root + 4 + semitones];
  }
  return [question.root, question.root + semitones];
}

function timingFor(question: Question, mode: MusicMode): PlayOptions {
  if (question.melodyNotes) {
    // Der gefragte (größte) Sprung wird hörbar betont.
    const target = question.melodyTarget ?? 0;
    return { noteDur: 0.42, gap: 0.1, accents: [target, target + 1] };
  }
  if (mode === 'chords') return { noteDur: 0.5, gap: 0.12 };
  if (question.applied) return { noteDur: 0.45, gap: 0.12 };
  return {};
}

/* Isolierter Vergleichsklang für ein (richtiges oder gewähltes) Item. */
function contrastMidis(question: Question, itemId: string, mode: MusicMode): number[] {
  if (mode === 'chords') {
    return offsetsOf(itemId).map((offset) => question.root + offset);
  }
  const semitones = semitonesOf(itemId);
  if (question.melodyNotes && question.melodyTarget !== undefined) {
    const start = question.melodyNotes[question.melodyTarget];
    const direction =
      Math.sign(question.melodyNotes[question.melodyTarget + 1] - start) || 1;
    return [start, start + direction * semitones];
  }
  const base = question.applied ? question.root + 4 : question.root;
  return [base, base + semitones];
}

function EarTraining({ mode, onExit }: Props) {
  const { t } = useTranslation();
  const area = areaOf(mode);

  const [options, setOptions] = useState(() => activeItemIds(mode, loadProgress(area)));
  const [questions, setQuestions] = useState(() => buildQuestions(mode, loadProgress(area)));
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);

  // Schnellmodus: Tastatur-Antworten, sofortiges Weiterschalten.
  const [speedAvailable, setSpeedAvailable] = useState(() => {
    const progress = loadProgress(area);
    const mastered = activeItemIds(mode, progress).filter(
      (id) => getItem(progress, id).box >= 3,
    );
    return mastered.length >= SPEED_UNLOCK_MASTERED;
  });
  const [speedMode, setSpeedMode] = useState(
    () => speedAvailable && localStorage.getItem(speedPrefKey(mode)) === '1',
  );
  const [pendingDigit, setPendingDigit] = useState<string | null>(null);
  const playStartRef = useRef(0);
  const responseTimes = useRef<number[]>([]);

  // „Einprägen": das Label leuchtet, während sein Klang gespielt wird.
  const [playingChip, setPlayingChip] = useState<string | null>(null);
  const highlightTimers = useRef<number[]>([]);

  const loggedStart = useRef(false);
  const loggedFinish = useRef(false);
  if (!loggedStart.current) {
    loggedStart.current = true;
    log('lesson.start', {
      mode,
      options: options.join(','),
      items: questions.map((q) => q.itemId).join(','),
      speedAvailable,
      speedMode,
    });
  }

  useEffect(() => {
    const timers = highlightTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const clearHighlights = () => {
    highlightTimers.current.forEach(clearTimeout);
    highlightTimers.current = [];
    setPlayingChip(null);
  };

  const highlightWhile = (itemId: string, startSec: number, durationSec: number) => {
    highlightTimers.current.push(
      window.setTimeout(() => setPlayingChip(itemId), startSec * 1000),
      window.setTimeout(
        () => setPlayingChip((current) => (current === itemId ? null : current)),
        (startSec + durationSec) * 1000,
      ),
    );
  };

  const question = questions[index];
  const isCorrect = answer === question.itemId;
  const isLast = index + 1 >= questions.length;

  const play = () => {
    log('play', { q: index + 1, item: question.itemId, melody: question.melodyTitleKey ?? null });
    playSequence(midisFor(question, mode), timingFor(question, mode));
    playStartRef.current = performance.now();
    setPlayed(true);
  };

  const next = () => {
    clearHighlights();
    setPendingDigit(null);
    log('next', { to: isLast ? 'ende' : index + 2 });
    if (isLast) {
      setFinished(true);
      return;
    }
    const upcoming = questions[index + 1];
    setIndex(index + 1);
    setAnswer(null);
    setPlayed(true);
    playSequence(midisFor(upcoming, mode), timingFor(upcoming, mode));
    playStartRef.current = performance.now();
  };

  const choose = (itemId: string) => {
    if (answer !== null || !played) return;
    setPendingDigit(null);
    setAnswer(itemId);
    const correct = itemId === question.itemId;
    log('answer', {
      q: index + 1,
      item: question.itemId,
      chosen: itemId,
      correct,
      ms: Math.round(performance.now() - playStartRef.current),
    });
    if (correct) {
      responseTimes.current.push(performance.now() - playStartRef.current);
      setCorrectCount((c) => c + 1);
      setXp((x) => x + (question.applied ? 15 : 10));
      if (speedMode) {
        // Kurzer Blitz auf dem richtigen Chip, dann sofort weiter.
        setPlayingChip(itemId);
        highlightTimers.current.push(window.setTimeout(next, 500));
      }
    } else {
      // Kontrastives Feedback: die richtige Antwort isoliert hören, Label leuchtet mit.
      const total = playSequence(contrastMidis(question, question.itemId, mode), {
        ...(mode === 'chords' ? timingFor(question, mode) : {}),
        delay: 0.35,
      });
      highlightWhile(question.itemId, 0.35, total - 0.35);
      if (speedMode) {
        highlightTimers.current.push(window.setTimeout(next, (total + 1.2) * 1000));
      }
    }
    recordResult(area, question.itemId, correct);
  };

  // Jede Wiederholung in der Feedback-Phase pausiert das Auto-Weiterschalten
  // (clearHighlights entfernt den Timer): Wiederholen im eigenen Tempo,
  // weiter geht es per „Weiter"-Knopf oder Enter.
  const hearDifference = () => {
    log('hearDifference', { item: question.itemId, chosen: answer });
    clearHighlights();
    const timing = mode === 'chords' ? timingFor(question, mode) : {};
    const firstEnd = playSequence(contrastMidis(question, question.itemId, mode), timing);
    highlightWhile(question.itemId, 0, firstEnd);
    const secondStart = firstEnd + 0.5;
    const total = playSequence(contrastMidis(question, answer!, mode), {
      ...timing,
      delay: secondStart,
    });
    highlightWhile(answer!, secondStart, total - secondStart);
  };

  // Feedback-Phase: Klick auf einen Chip spielt gezielt dieses Item.
  const playItem = (itemId: string) => {
    log('playItem', { q: index + 1, item: itemId });
    clearHighlights();
    const timing = mode === 'chords' ? timingFor(question, mode) : {};
    const duration = playSequence(contrastMidis(question, itemId, mode), timing);
    highlightWhile(itemId, 0, duration);
  };

  const restart = () => {
    log('lesson.restart', { mode });
    loggedFinish.current = false;
    clearHighlights();
    const progress = loadProgress(area);
    const active = activeItemIds(mode, progress);
    setOptions(active);
    setQuestions(buildQuestions(mode, progress));
    setSpeedAvailable(
      active.filter((id) => getItem(progress, id).box >= 3).length >= SPEED_UNLOCK_MASTERED,
    );
    setIndex(0);
    setPlayed(false);
    setAnswer(null);
    setPendingDigit(null);
    setCorrectCount(0);
    setXp(0);
    setFinished(false);
    responseTimes.current = [];
  };

  const toggleSpeed = () => {
    log('speedMode', { on: !speedMode });
    setSpeedMode((on) => {
      localStorage.setItem(speedPrefKey(mode), on ? '0' : '1');
      return !on;
    });
  };

  // Tastatur: Ziffer (+ k/g) antwortet — bzw. spielt in der Feedback-Phase
  // gezielt das Item. Leertaste spielt die Frage, Enter geht weiter, u = Unterschied.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'enter') {
        if (answer !== null) {
          e.preventDefault();
          next();
        }
        return;
      }
      if (answer === null && key === ' ') {
        e.preventDefault();
        play();
        return;
      }
      if (answer !== null && key === 'u' && !isCorrect) {
        hearDifference();
        return;
      }
      if (!played) return;
      if (key === 'escape') {
        setPendingDigit(null);
        return;
      }
      const act = answer === null ? choose : playItem;
      const norm = key === '0' ? 't' : key;
      if (pendingDigit !== null && (norm === 'k' || norm === 'g')) {
        const target = options.find((id) => {
          const hotkey = hotkeyOf(mode, id);
          return hotkey.digit === pendingDigit && hotkey.quality === norm;
        });
        setPendingDigit(null);
        if (target) act(target);
        return;
      }
      const candidates = options.filter((id) => hotkeyOf(mode, id).digit === norm);
      if (candidates.length === 1) {
        setPendingDigit(null);
        act(candidates[0]);
      } else if (candidates.length > 1) {
        setPendingDigit(norm);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const newlyUnlocked = activeItemIds(mode, loadProgress(area)).filter(
      (id) => !options.includes(id),
    );
    if (!loggedFinish.current) {
      loggedFinish.current = true;
      log('lesson.finished', {
        correct: correctCount,
        total: questions.length,
        xp,
        unlocked: newlyUnlocked.join(','),
      });
    }
    const avgSeconds =
      responseTimes.current.length > 0
        ? (
            responseTimes.current.reduce((sum, ms) => sum + ms, 0) /
            responseTimes.current.length /
            1000
          ).toFixed(1)
        : null;
    return (
      <div className="lesson">
        <div className="stimulus-card">
          <h2>{t('learning.sessionComplete')}</h2>
          <p className="result-score">
            {t('session.score', { correct: correctCount, total: questions.length })}
          </p>
          <p className="result-xp">+{xp} XP</p>
          {speedMode && avgSeconds !== null && (
            <p className="result-time">{t('session.avgTime', { seconds: avgSeconds })}</p>
          )}
          {newlyUnlocked.length > 0 && (
            <p className="unlock-note">
              {t('session.unlocked')}{' '}
              {newlyUnlocked.map((id) => t(`music.items.${id}`)).join(', ')}
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

  const chipClass = (itemId: string) => {
    let cls = 'answer-chip';
    if (answer !== null && itemId === question.itemId) cls += ' is-correct';
    else if (answer !== null && itemId === answer) cls += ' is-wrong';
    if (playingChip === itemId) cls += ' is-playing';
    if (pendingDigit !== null && hotkeyOf(mode, itemId).digit === pendingDigit)
      cls += ' is-candidate';
    return cls;
  };

  return (
    <div className="lesson">
      <div className="lesson-head">
        <button className="back-btn" type="button" onClick={onExit}>
          ← {t('session.back')}
        </button>
        <div className="lesson-head-right">
          {speedAvailable && (
            <button
              className={`speed-toggle${speedMode ? ' on' : ''}`}
              type="button"
              aria-pressed={speedMode}
              onClick={toggleSpeed}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
              {t('session.speedMode')}
            </button>
          )}
          <span className="lesson-count">
            {t('session.question', { current: index + 1, total: questions.length })}
          </span>
        </div>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((index + (answer !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="stimulus-card">
        {question.applied && <span className="applied-tag">{t('session.application')}</span>}
        <p className="prompt">
          {question.melodyNotes
            ? t('music.intervals.melodyPrompt')
            : question.applied
              ? t('music.intervals.appliedPrompt')
              : t(`music.${mode}.prompt`)}
        </p>

        <button className="play-big" type="button" onClick={play} aria-label={t('session.listen')}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5Z" />
          </svg>
        </button>
        {played && answer === null && (
          <button className="link-btn" type="button" onClick={play}>
            {t('session.replay')}
          </button>
        )}

        <div className="answer-grid">
          {options.map((itemId) => (
            <button
              key={itemId}
              type="button"
              className={chipClass(itemId)}
              disabled={!played}
              onClick={() => (answer === null ? choose(itemId) : playItem(itemId))}
            >
              {t(`music.items.${itemId}`)}
              <kbd className="chip-key">{hotkeyLabel(mode, itemId)}</kbd>
            </button>
          ))}
        </div>
        {pendingDigit !== null && (
          <p className="pending-hint">{t('session.pendingQuality', { digit: pendingDigit })}</p>
        )}

        {answer !== null && (
          <div className={`feedback-box ${isCorrect ? 'good' : 'bad'}`}>
            <p className="feedback-title">
              {isCorrect
                ? t('learning.correct')
                : `${t('learning.wrong')} — ${t('session.correctWas')} ${t(`music.items.${question.itemId}`)}`}
            </p>
            {question.melodyTitleKey ? (
              <p className="anchor-hint">
                {t('session.melodyReveal', { song: t(question.melodyTitleKey) })}
              </p>
            ) : (
              mode === 'intervals' && (
                <p className="anchor-hint">
                  {t(`music.items.${question.itemId}`)}: {t(`music.anchors.${question.itemId}`)}
                </p>
              )
            )}
            <p className="explore-hint">{t('session.exploreHint')}</p>
            <div className="feedback-actions">
              {!isCorrect && (
                <button className="btn btn-secondary" type="button" onClick={hearDifference}>
                  {t('session.hearDifference')}
                </button>
              )}
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

export default EarTraining;
