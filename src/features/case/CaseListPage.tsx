import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listCases } from '../../db/caseRepo';
import type { CaseRecord } from '../../db/db';
import { useAppSettings } from '../../app/settingsContext';
import { complaintLabel } from '../../content';
import { elapsedSince } from '../../engine';
import { Badge, EmptyState, InlineAlert, PageHeader, Skeleton } from '../../ui/kit';
import { CasesIcon, ChevronLeftIcon, PlusIcon } from '../../ui/icons';
import { formatDateTime } from '../../ui/format';

export function CaseListPage() {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    listCases()
      .then((rows) => {
        if (alive) setCases(rows);
      })
      .catch((loadError: unknown) => {
        console.error('[nrc] failed to list cases', loadError);
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      <PageHeader
        title={t('cases.title')}
        subtitle={t('cases.subtitle')}
        action={
          <a href="#/cases/new" className="btn btn-primary">
            <PlusIcon width={18} height={18} />
            <span className="hidden sm:inline">{t('cases.new')}</span>
            <span className="sm:hidden">{t('cases.new')}</span>
          </a>
        }
      />

      {error ? (
        <InlineAlert tone="danger" title={t('errors.loadFailed')}>
          {t('errors.generic')}
        </InlineAlert>
      ) : cases === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<CasesIcon width={28} height={28} />}
          title={t('cases.emptyTitle')}
          body={t('cases.emptyBody')}
          action={
            <a href="#/cases/new" className="btn btn-primary">
              <PlusIcon width={18} height={18} />
              {t('cases.new')}
            </a>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <Badge tone="neutral">{t('cases.count', { n: cases.length })}</Badge>
          </div>
          <ul className="space-y-3">
            {cases.map((record) => {
              const complaint =
                complaintLabel(record.history.complaint, settings.language) ??
                t('cases.noComplaint');
              const lkw = elapsedSince(record.lastKnownWell, now);
              const allergyCount = record.demographics.allergies.length;

              return (
                <li key={record.id}>
                  <a
                    href={`#/cases/${record.id}`}
                    className="card block p-4 transition-colors hover:border-[var(--primary)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold">
                          {t('case.ageYears', { age: record.demographics.ageYears })}
                          <span className="mx-1.5 text-[var(--line)]">·</span>
                          {t(`sex.${record.demographics.sex}`)}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                          {complaint}
                        </p>
                      </div>
                      <ChevronLeftIcon
                        width={18}
                        height={18}
                        className="mt-1 shrink-0 text-[var(--muted)] rtl:rotate-180"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span>
                        {t('cases.updatedAt')}:{' '}
                        {formatDateTime(record.updatedAt, settings.language)}
                      </span>
                      {lkw && !lkw.future ? (
                        <Badge tone="info">
                          LKW {lkw.text}
                        </Badge>
                      ) : null}
                      {allergyCount > 0 ? (
                        <Badge tone="warn">
                          {t('cases.allergyCount', { n: allergyCount })}
                        </Badge>
                      ) : null}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
