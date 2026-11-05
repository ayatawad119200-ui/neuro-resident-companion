import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSetting,
  type AppSettings,
} from '../db/db';
import { Layout } from './Layout';
import { DisclaimerGate } from './DisclaimerGate';
import { ToastProvider } from './toast';
import { SettingsContext } from './settingsContext';
import { useRoute, type Route } from './router';
import { applyLanguage, applyTheme, watchSystemTheme } from './preferences';
import { CaseListPage } from '../features/case/CaseListPage';
import { CaseFormPage } from '../features/case/CaseFormPage';
import { CaseDetailPage } from '../features/case/CaseDetailPage';
import { CasePrintPage } from '../features/case/CasePrintPage';
import { ClinicalPage } from '../features/clinical/ClinicalPage';
import { DrugsPage } from '../features/drugs/DrugsPage';
import { SourcesPage } from '../features/sources/SourcesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { NeuronIcon } from '../ui/icons';

function Splash() {
  const { t } = useTranslation();
  return (
    <div className="app-bg flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-ink)]">
          <NeuronIcon width={30} height={30} />
        </span>
        <p className="text-sm font-semibold">{t('common.loading')}</p>
      </div>
    </div>
  );
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'cases':
      return <CaseListPage />;
    case 'caseNew':
      return <CaseFormPage mode="create" />;
    case 'caseEdit':
      return <CaseFormPage key={route.id} mode="edit" caseId={route.id} />;
    case 'case':
      return <CaseDetailPage key={route.id} caseId={route.id} />;
    case 'casePrint':
      return <CasePrintPage key={route.id} caseId={route.id} />;
    case 'clinical':
      return <ClinicalPage tab={route.tab} />;
    case 'drugs':
      return <DrugsPage />;
    case 'sources':
      return <SourcesPage />;
    case 'settings':
      return <SettingsPage />;
  }
}

export function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const route = useRoute();

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((loaded) => {
        if (alive) setSettings(loaded);
      })
      .catch((error) => {
        console.error('[nrc] failed to load settings', error);
        if (alive) setSettings(DEFAULT_SETTINGS);
      });
    return () => {
      alive = false;
    };
  }, []);

  const language = settings?.language;
  useEffect(() => {
    if (!language) return;
    applyLanguage(language);
    void i18n.changeLanguage(language).then(() => {
      document.title = i18n.t('app.name');
    });
  }, [language]);

  const theme = settings?.theme;
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    return watchSystemTheme(() => applyTheme('system'));
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  if (!settings) return <Splash />;

  async function updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ): Promise<void> {
    setSettings((previous) => (previous ? { ...previous, [key]: value } : previous));
    try {
      await setSetting(key, value);
    } catch (error) {
      console.error('[nrc] failed to save setting', error);
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      <ToastProvider>
        <Layout route={route}>
          <RouteView route={route} />
        </Layout>
        <DisclaimerGate />
      </ToastProvider>
    </SettingsContext.Provider>
  );
}
