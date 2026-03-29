import { useTranslation } from 'react-i18next';
import './styles/global.css';

function App() {
  const { t } = useTranslation();

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
        </section>
      </main>
    </div>
  );
}

export default App;
