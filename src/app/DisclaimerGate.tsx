import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from './settingsContext';
import { Button, Modal } from '../ui/kit';
import { ShieldIcon } from '../ui/icons';

export function DisclaimerGate() {
  const { settings, updateSetting } = useAppSettings();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (settings.disclaimerAccepted) return null;

  return (
    <Modal
      open
      dismissible={false}
      title={t('disclaimer.title')}
      onClose={() => undefined}
      footer={
        <Button
          variant="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await updateSetting('disclaimerAccepted', true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('disclaimer.accept')}
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
      <p className="mt-4 rounded-xl bg-[var(--surface-2)] p-3 text-xs font-semibold text-[var(--muted)]">
        {t('disclaimer.footer')}
      </p>
    </Modal>
  );
}
