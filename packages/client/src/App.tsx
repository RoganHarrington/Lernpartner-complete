import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EarTraining from './exercises/music/EarTraining';
import type { MusicMode } from './exercises/music/data';
import { formatLog, log } from './services/sessionLog';
import './styles/global.css';

type View = 'home' | MusicMode;

function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('home');
  const [logCopied, setLogCopied] = useState(false);

  const go = (next: View) => {
    log('view', { view: next });
    setView(next);
  };

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(formatLog());
      setLogCopied(true);
      window.setTimeout(() => setLogCopied(false), 3000);
    } catch {
      log('error', { message: 'Protokoll konnte nicht kopiert werden' });
    }
  };

  if (view !== 'home') {
    return (
      <div className="app">
        <EarTraining mode={view} onExit={() => go('home')} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <p>{t('app.subtitle')}</p>
      </header>
      <main className="app-main">
        <section className="welcome">
          <h2>{t('home.welcome')}</h2>
          <p>{t('home.description')}</p>
          <button className="btn btn-primary" type="button" onClick={() => go('intervals')}>
            {t('home.startLearning')}
          </button>
        </section>
        <section className="units">
          <h2 className="units-title">{t('home.sampleLessons')}</h2>
          <div className="unit-grid">
            <article className="unit-card">
              <span className="unit-topic">
                <span className="unit-dot" />
                {t('music.title')}
              </span>
              <h3>{t('music.intervals.title')}</h3>
              <p>{t('music.intervals.desc')}</p>
              <button className="btn btn-primary" type="button" onClick={() => go('intervals')}>
                {t('home.startLearning')}
              </button>
            </article>
            <article className="unit-card">
              <span className="unit-topic">
                <span className="unit-dot" />
                {t('music.title')}
              </span>
              <h3>{t('music.chords.title')}</h3>
              <p>{t('music.chords.desc')}</p>
              <button className="btn btn-secondary" type="button" onClick={() => go('chords')}>
                {t('home.startLearning')}
              </button>
            </article>
          </div>
        </section>
        <button className="link-btn log-btn" type="button" onClick={copyLog}>
          {logCopied ? t('home.logCopied') : t('home.copyLog')}
        </button>
      </main>
    </div>
  );
}

export default App;
