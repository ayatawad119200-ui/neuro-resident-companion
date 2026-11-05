import { useTranslation } from 'react-i18next';
import { plannedSources, sources, CONTENT_VERSION } from '../../content';
import { useAppSettings } from '../../app/settingsContext';
import {
  Badge,
  Card,
  InlineAlert,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from '../../ui/kit';
import { BookIcon, ShieldIcon } from '../../ui/icons';
import { formatDate } from '../../ui/format';

export function SourcesPage() {
  const { t } = useTranslation();
  const { settings } = useAppSettings();

  return (
    <div>
      <PageHeader title={t('sources.title')} subtitle={t('sources.subtitle')} />

      <div className="space-y-4">
        <InlineAlert
          tone="info"
          title={t('sources.governanceTitle')}
          icon={<ShieldIcon width={20} height={20} />}
        >
          {t('sources.governanceBody')}
        </InlineAlert>

        <Card className="p-4 sm:p-5">
          <SectionTitle hint={t('sources.registeredHint')}>
            {t('sources.registered')}
          </SectionTitle>

          {sources.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)] p-4">
              <span className="mt-0.5 shrink-0 text-[var(--muted)]">
                <BookIcon width={20} height={20} />
              </span>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {t('sources.registeredEmpty')}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.id} className="card-flat p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{source.title}</span>
                    <StatusBadge status={source.status} />
                    <Badge tone="neutral">
                      {t('sources.sourceVersion')} {source.version}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {source.org} · {source.year}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {source.reviewedBy
                      ? `${t('sources.reviewedBy')}: ${source.reviewedBy}`
                      : t('sources.noReview')}
                    {source.reviewedAt
                      ? ` · ${t('sources.reviewedAt')}: ${formatDate(
                          source.reviewedAt,
                          settings.language,
                        )}`
                      : null}
                  </p>
                  <p className="mono mt-1 text-[11px] text-[var(--muted)]">
                    id: {source.id}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('sources.statusTitle')}</SectionTitle>
          <ul className="space-y-3">
            <li className="flex flex-wrap items-start gap-2">
              <StatusBadge status="approved" />
              <span className="min-w-0 flex-1 text-xs leading-5 text-[var(--muted)]">
                {t('sources.statusApproved')}
              </span>
            </li>
            <li className="flex flex-wrap items-start gap-2">
              <StatusBadge status="draft" />
              <span className="min-w-0 flex-1 text-xs leading-5 text-[var(--muted)]">
                {t('sources.statusDraft')}
              </span>
            </li>
            <li className="flex flex-wrap items-start gap-2">
              <StatusBadge status="pending" />
              <span className="min-w-0 flex-1 text-xs leading-5 text-[var(--muted)]">
                {t('sources.statusPending')}
              </span>
            </li>
          </ul>
        </Card>

        <section>
          <SectionTitle>{t('sources.plannedTitle')}</SectionTitle>
          <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
            {t('sources.plannedBody')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {plannedSources.map((source) => (
              <li
                key={source.id}
                className="card-flat flex items-start justify-between gap-2 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{source.org}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                    {source.scope}
                  </p>
                </div>
                <StatusBadge status="pending" />
              </li>
            ))}
          </ul>
        </section>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('sources.appVersion')}</SectionTitle>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--muted)]">
                {t('sources.appVersion')}
              </dt>
              <dd className="mono mt-0.5 font-bold">{__APP_VERSION__}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">
                {t('sources.contentVersion')}
              </dt>
              <dd className="mono mt-0.5 font-bold">{CONTENT_VERSION}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
