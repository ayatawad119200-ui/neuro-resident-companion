import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_SETTINGS,
  exportBackup,
  getSettings,
  importBackup,
  wipeAll,
  type Language,
  type Theme,
} from '../../db/db';
import { useAppSettings } from '../../app/settingsContext';
import { useToast } from '../../app/toast';
import { navigate } from '../../app/router';
import { CONTENT_VERSION } from '../../content';
import {
  Button,
  Card,
  InlineAlert,
  Modal,
  PageHeader,
  Segmented,
  TextInput,
  type SegmentedOption,
} from '../../ui/kit';
import {
  DownloadIcon,
  MonitorIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
} from '../../ui/icons';

const LANGUAGE_OPTIONS: ReadonlyArray<SegmentedOption<Language>> = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useAppSettings();
  const toast = useToast();

  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | 'wipe' | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState('');

  const themeOptions: ReadonlyArray<SegmentedOption<Theme>> = [
    { value: 'light', label: t('settings.themeLight'), icon: <SunIcon width={15} height={15} /> },
    { value: 'dark', label: t('settings.themeDark'), icon: <MoonIcon width={15} height={15} /> },
    { value: 'system', label: t('settings.themeSystem'), icon: <MonitorIcon width={15} height={15} /> },
  ];

  const canWipe = wipeText.trim().toUpperCase() === 'DELETE';

  async function onExport() {
    setBusy('export');
    setImportError(null);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nrc-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast(t('settings.exportDone'));
    } catch (error) {
      console.error('[nrc] export failed', error);
      toast(t('errors.generic'));
    } finally {
      setBusy(null);
    }
  }

  async function onImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy('import');
    setImportError(null);
    try {
      const raw: unknown = JSON.parse(await file.text());
      const result = await importBackup(raw);
      const next = await getSettings();
      await updateSetting('language', next.language);
      await updateSetting('theme', next.theme);
      await updateSetting('disclaimerAccepted', next.disclaimerAccepted);
      toast(
        t('settings.importDone', {
          cases: result.cases,
          settings: result.settings,
        }),
      );
    } catch (error) {
      console.error('[nrc] import failed', error);
      setImportError(error instanceof Error ? error.message : t('settings.importError'));
    } finally {
      setBusy(null);
    }
  }

  async function onWipe() {
    if (!canWipe) return;
    setBusy('wipe');
    try {
      await wipeAll();
      await updateSetting('language', DEFAULT_SETTINGS.language);
      await updateSetting('theme', DEFAULT_SETTINGS.theme);
      await updateSetting('disclaimerAccepted', DEFAULT_SETTINGS.disclaimerAccepted);
      setWipeOpen(false);
      setWipeText('');
      toast(t('settings.wipeDone'));
      navigate('#/cases');
    } catch (error) {
      console.error('[nrc] wipe failed', error);
      toast(t('errors.generic'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <div className="space-y-5">
            <div>
              <p className="field-label mb-2">{t('settings.language')}</p>
              <Segmented
                value={settings.language}
                label={t('settings.language')}
                options={LANGUAGE_OPTIONS}
                onChange={(value) => void updateSetting('language', value)}
              />
              <p className="field-hint">{t('settings.languageHint')}</p>
            </div>

            <div>
              <p className="field-label mb-2">{t('settings.theme')}</p>
              <Segmented
                value={settings.theme}
                label={t('settings.theme')}
                options={themeOptions}
                onChange={(value) => void updateSetting('theme', value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-base font-extrabold">{t('settings.dataTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {t('settings.dataBody')}
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[var(--line)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{t('settings.export')}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                    {t('settings.exportHint')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => void onExport()}
                >
                  <DownloadIcon width={17} height={17} />
                  {t('settings.export')}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{t('settings.import')}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                    {t('settings.importHint')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => fileInput.current?.click()}
                >
                  <UploadIcon width={17} height={17} />
                  {t('settings.import')}
                </Button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => void onImportFile(event)}
              />
              {importError ? (
                <div className="mt-3">
                  <InlineAlert tone="danger" title={t('settings.importError')}>
                    <p className="mono text-xs leading-5">{importError}</p>
                  </InlineAlert>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-[var(--danger)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{t('settings.wipe')}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                    {t('settings.wipeHint')}
                  </p>
                </div>
                <Button
                  variant="danger-soft"
                  disabled={busy !== null}
                  onClick={() => {
                    setWipeText('');
                    setWipeOpen(true);
                  }}
                >
                  <TrashIcon width={17} height={17} />
                  {t('settings.wipe')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-base font-extrabold">
            {t('settings.disclaimerTitle')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {t('settings.disclaimerBody')}
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => setDisclaimerOpen(true)}
          >
            <ShieldIcon width={17} height={17} />
            {t('settings.viewDisclaimer')}
          </Button>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-base font-extrabold">{t('settings.aboutTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {t('settings.aboutBody')}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('settings.version')}</dt>
              <dd className="mono mt-0.5 font-bold">{__APP_VERSION__}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                {t('sources.contentVersion')}
              </dt>
              <dd className="mono mt-0.5 font-bold">{CONTENT_VERSION}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-[var(--surface-2)] p-3">
            <p className="text-sm font-bold">{t('settings.installTitle')}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {t('settings.installBody')}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              {t('settings.offlineReady')}
            </p>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">
            {t('settings.privacy')}
          </p>
        </Card>
      </div>

      <Modal
        open={disclaimerOpen}
        title={t('disclaimer.title')}
        onClose={() => setDisclaimerOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setDisclaimerOpen(false)}>
            {t('common.close')}
          </Button>
        }
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <ShieldIcon width={24} height={24} />
        </div>
        <div className="space-y-3 text-sm leading-7">
          <p>{t('disclaimer.p1')}</p>
          <p>{t('disclaimer.p2')}</p>
          <p>{t('disclaimer.p3')}</p>
        </div>
      </Modal>

      <Modal
        open={wipeOpen}
        title={t('settings.wipeTitle')}
        onClose={() => setWipeOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWipeOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={!canWipe || busy === 'wipe'}
              onClick={() => void onWipe()}
            >
              <TrashIcon width={17} height={17} />
              {t('settings.wipeConfirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-7">{t('settings.wipeBody')}</p>
        <div className="mt-4">
          <label className="field-label" htmlFor="wipe-confirm">
            {t('settings.wipePlaceholder')}
          </label>
          <TextInput
            id="wipe-confirm"
            className="mono"
            autoComplete="off"
            value={wipeText}
            placeholder={t('settings.wipePlaceholder')}
            onChange={(event) => setWipeText(event.target.value)}
          />
          {wipeText.length > 0 && !canWipe ? (
            <p className="field-error">{t('settings.wipeMismatch')}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
