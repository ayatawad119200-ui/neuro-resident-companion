import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from './settingsContext';
import { resolveTheme } from './preferences';
import type { Route } from './router';
import { Badge, IconButton } from '../ui/kit';
import {
  BookIcon,
  CasesIcon,
  MoonIcon,
  NeuronIcon,
  PillIcon,
  SettingsIcon,
  SunIcon,
  WifiIcon,
  WifiOffIcon,
} from '../ui/icons';

interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: (props: { width?: number; height?: number }) => ReactNode;
  active: (route: Route) => boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'cases',
    href: '#/cases',
    labelKey: 'nav.cases',
    icon: CasesIcon,
    active: (route) =>
      route.name === 'cases' ||
      route.name === 'case' ||
      route.name === 'caseNew' ||
      route.name === 'caseEdit' ||
      route.name === 'casePrint',
  },
  {
    key: 'clinical',
    href: '#/clinical/scores',
    labelKey: 'nav.clinical',
    icon: NeuronIcon,
    active: (route) => route.name === 'clinical',
  },
  {
    key: 'drugs',
    href: '#/drugs',
    labelKey: 'nav.drugs',
    icon: PillIcon,
    active: (route) => route.name === 'drugs',
  },
  {
    key: 'sources',
    href: '#/sources',
    labelKey: 'nav.sources',
    icon: BookIcon,
    active: (route) => route.name === 'sources',
  },
  {
    key: 'settings',
    href: '#/settings',
    labelKey: 'nav.settings',
    icon: SettingsIcon,
    active: (route) => route.name === 'settings',
  },
];

function useOnline(): boolean {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}

function ConnectivityBadge() {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <Badge tone={online ? 'neutral' : 'warn'} className="gap-1.5">
      {online ? <WifiIcon width={13} height={13} /> : <WifiOffIcon width={13} height={13} />}
      <span className="hidden sm:inline">
        {online ? t('offline.online') : t('offline.offlineShort')}
      </span>
    </Badge>
  );
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { t } = useTranslation();
  const { settings, updateSetting } = useAppSettings();
  const isDark = resolveTheme(settings.theme) === 'dark';

  const toggleTheme = () => {
    void updateSetting('theme', isDark ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    void updateSetting('language', settings.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <div className="app-bg">
      <a href="#main" className="skip-link print:hidden">
        {t('common.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-3 sm:px-6">
          <a
            href="#/cases"
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl pe-1"
            aria-label={t('app.name')}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-ink)]">
              <NeuronIcon width={20} height={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold leading-5">
                {t('app.name')}
              </span>
              <span className="hidden truncate text-[10px] text-[var(--muted)] sm:block">
                {t('app.tagline')}
              </span>
            </span>
          </a>

          <div className="ms-auto flex items-center gap-1">
            <ConnectivityBadge />
            <IconButton label={t('settings.theme')} onClick={toggleTheme}>
              {isDark ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
            </IconButton>
            <button
              type="button"
              onClick={toggleLanguage}
              className="btn btn-secondary min-h-11 px-2.5 text-xs font-extrabold"
              aria-label={`${t('settings.language')}: ${
                settings.language === 'ar' ? 'English' : 'العربية'
              }`}
            >
              {settings.language === 'ar' ? 'EN' : 'ع'}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 sm:px-6 print:max-w-none print:p-0"
      >
        {children}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-center text-[11px] leading-5 text-[var(--muted)] sm:px-6 print:hidden">
        <p>{t('app.footer')}</p>
        <p className="mono mt-1">
          {t('app.version')} {__APP_VERSION__}
        </p>
      </footer>

      <nav
        aria-label={t('app.name')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md print:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-stretch gap-1 px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.active(route);
            return (
              <a
                key={item.key}
                href={item.href}
                className="nav-item"
                aria-current={active ? 'page' : undefined}
              >
                <Icon width={22} height={22} />
                <span>{t(item.labelKey)}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
