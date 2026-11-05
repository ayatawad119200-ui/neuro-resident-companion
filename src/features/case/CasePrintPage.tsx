import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCase } from '../../db/caseRepo';
import type { CaseRecord } from '../../db/db';
import { buildHandoverNote } from '../../engine';
import { complaintLabel } from '../../content';
import { useAppSettings } from '../../app/settingsContext';
import { Button, EmptyState, Skeleton } from '../../ui/kit';
import { CasesIcon, ChevronLeftIcon, PrinterIcon } from '../../ui/icons';
import { formatDateTime } from '../../ui/format';
import { handoverInputFor } from './handoverInput';

/**
 * Dedicated print/PDF view. Uses the browser print pipeline ("Save as PDF")
 * instead of a PDF library so Arabic shaping and RTL stay correct offline.
 */
export function CasePrintPage({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    getCase(caseId)
      .then((loaded) => {
        if (!alive) return;
        if (!loaded) {
          setMissing(true);
          return;
        }
        setRecord(loaded);
      })
      .catch((error: unknown) => {
        console.error('[nrc] failed to load case for printing', error);
        if (alive) setMissing(true);
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

  if (missing) {
    return (
      <EmptyState
        icon={<CasesIcon width={28} height={28} />}
        title={t('errors.notFound')}
        body={t('errors.notFoundBody')}
        action={
          <a href="#/cases" className="btn btn-primary">
            {t('case.back')}
          </a>
        }
      />
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const handover = buildHandoverNote(
    handoverInputFor(record, t(`sex.${record.demographics.sex}`)),
    now,
  );
  const complaint =
    complaintLabel(record.history.complaint, settings.language) ??
    t('case.notRecorded');

  return (
    <div className="print-doc">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <a
          href={`#/cases/${record.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ChevronLeftIcon width={16} height={16} className="rtl:rotate-180" />
          {t('case.backToCase')}
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-[var(--muted)]">{t('case.printHint')}</p>
          <Button variant="primary" onClick={() => window.print()}>
            <PrinterIcon width={17} height={17} />
            {t('case.printPdf')}
          </Button>
        </div>
      </div>

      <article className="card p-6 sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="mb-5 border-b border-[var(--line)] pb-4 print:border-black">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] print:text-black">
                {t('app.version')} {__APP_VERSION__}
              </p>
              <h1 className="mt-1 text-xl font-extrabold print:text-black">
                {t('app.name')}
              </h1>
              <p className="mt-1 text-sm font-semibold print:text-black">
                {t('case.handover')}
              </p>
            </div>
            <div className="text-end text-xs leading-5 text-[var(--muted)] print:text-black">
              <p>{formatDateTime(record.updatedAt, settings.language)}</p>
              <p className="font-semibold">{complaint}</p>
            </div>
          </div>
        </header>

        <pre
          dir="ltr"
          className="mono whitespace-pre-wrap break-words text-left text-[11px] leading-5 text-[var(--ink)] print:text-[10pt] print:leading-5 print:text-black"
        >
          {handover}
        </pre>

        <footer className="mt-5 border-t border-[var(--line)] pt-3 text-[10px] leading-5 text-[var(--muted)] print:border-black print:text-black">
          <p>{t('app.footer')}</p>
          <p>{t('disclaimer.footer')}</p>
        </footer>
      </article>
    </div>
  );
}
