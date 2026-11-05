import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  deleteCase,
  getCase,
  updateCase,
  type CasePatch,
} from '../../db/caseRepo';
import type { CaseHistory, CaseRecord } from '../../db/db';
import { useAppSettings } from '../../app/settingsContext';
import { useToast } from '../../app/toast';
import { navigate } from '../../app/router';
import {
  buildHandoverNote,
  bmi,
  elapsedSince,
  formatDecimal,
} from '../../engine';
import { complaintLabel, complaintTemplates } from '../../content';
import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  InlineAlert,
  Modal,
  PageHeader,
  SectionTitle,
  Select,
  Skeleton,
  TextArea,
  TextInput,
} from '../../ui/kit';
import {
  AlertTriangleIcon,
  CasesIcon,
  ChevronLeftIcon,
  EditIcon,
  PrinterIcon,
  TrashIcon,
} from '../../ui/icons';
import { handoverInputFor } from './handoverInput';
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../ui/format';

const HISTORY_FIELDS = [
  { key: 'hpi', labelKey: 'case.hpi' },
  { key: 'pmh', labelKey: 'case.pmh' },
  { key: 'drugs', labelKey: 'case.drugs' },
  { key: 'family', labelKey: 'case.family' },
  { key: 'social', labelKey: 'case.social' },
] as const;

type HistoryFieldKey = (typeof HISTORY_FIELDS)[number]['key'];

function mergePatch(current: CasePatch, next: CasePatch): CasePatch {
  return {
    demographics: { ...(current.demographics ?? {}), ...(next.demographics ?? {}) },
    history: { ...(current.history ?? {}), ...(next.history ?? {}) },
    notes: next.notes !== undefined ? next.notes : current.notes,
    lastKnownWell:
      next.lastKnownWell !== undefined ? next.lastKnownWell : current.lastKnownWell,
  };
}

function applyLocal(record: CaseRecord, patch: CasePatch): CaseRecord {
  return {
    ...record,
    demographics: { ...record.demographics, ...(patch.demographics ?? {}) },
    history: { ...record.history, ...(patch.history ?? {}) },
    notes: patch.notes !== undefined ? patch.notes : record.notes,
    lastKnownWell:
      patch.lastKnownWell !== undefined ? patch.lastKnownWell : record.lastKnownWell,
    updatedAt: new Date().toISOString(),
  };
}

export function CaseDetailPage({ caseId }: { caseId: string }) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const toast = useToast();

  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [lkwLocal, setLkwLocal] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const pending = useRef<CasePatch>({});
  const timer = useRef<number | null>(null);

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
        setLkwLocal(toDatetimeLocalValue(loaded.lastKnownWell));
      })
      .catch((error: unknown) => {
        console.error('[nrc] failed to load case', error);
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    try {
      await updateCase(caseId, patch);
      setSaveState('saved');
    } catch (error) {
      console.error('[nrc] autosave failed', error);
      setSaveState('error');
    }
  }, [caseId]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      const patch = pending.current;
      pending.current = {};
      if (Object.keys(patch).length > 0) {
        void updateCase(caseId, patch).catch((error: unknown) => {
          console.error('[nrc] final autosave failed', error);
        });
      }
    };
  }, [caseId]);

  function apply(patch: CasePatch) {
    setRecord((previous) => (previous ? applyLocal(previous, patch) : previous));
    pending.current = mergePatch(pending.current, patch);
    setSaveState('saving');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush();
    }, 700);
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteCase(caseId);
      setDeleteOpen(false);
      toast(t('cases.deleted'));
      navigate('#/cases');
    } catch (error) {
      console.error('[nrc] failed to delete case', error);
      setDeleting(false);
    }
  }

  if (missing) {
    return (
      <div>
        <a
          href="#/cases"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)]"
        >
          <ChevronLeftIcon width={16} height={16} className="rtl:rotate-180" />
          {t('case.back')}
        </a>
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
      </div>
    );
  }

  if (loadFailed) {
    return (
      <InlineAlert tone="danger" title={t('errors.loadFailed')}>
        {t('errors.generic')}
      </InlineAlert>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { demographics, history } = record;
  const complaint =
    complaintLabel(history.complaint, settings.language) ?? t('case.notRecorded');
  const elapsed = elapsedSince(record.lastKnownWell, now);
  const futureLkw = lkwLocal
    ? (fromDatetimeLocalValue(lkwLocal) ?? '') !== '' &&
      new Date(fromDatetimeLocalValue(lkwLocal) as string).getTime() > now.getTime()
    : false;

  const bmiValue =
    demographics.weightKg !== null && demographics.heightCm !== null
      ? bmi(demographics.weightKg, demographics.heightCm)
      : null;

  const handover = buildHandoverNote(
    handoverInputFor(record, t(`sex.${demographics.sex}`)),
    now,
  );

  const saveLabel =
    saveState === 'saving'
      ? t('case.saving')
      : saveState === 'saved'
        ? t('case.saved')
        : saveState === 'error'
          ? t('errors.saveFailed')
          : t('case.saveState');
  const saveTone =
    saveState === 'error' ? 'danger' : saveState === 'saved' ? 'ok' : 'neutral';

  function onHistoryChange(key: HistoryFieldKey, value: string) {
    apply({ history: { [key]: value } as Partial<CaseHistory> });
  }

  function onLkwChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setLkwLocal(value);
    apply({ lastKnownWell: fromDatetimeLocalValue(value) });
  }

  return (
    <div>
      <a
        href="#/cases"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ChevronLeftIcon width={16} height={16} className="rtl:rotate-180" />
        {t('case.back')}
      </a>

      <PageHeader
        title={t('case.ageYears', { age: demographics.ageYears })}
        subtitle={complaint}
        action={
          <a href={`#/cases/${record.id}/edit`} className="btn btn-secondary">
            <EditIcon width={17} height={17} />
            <span className="hidden sm:inline">{t('case.editData')}</span>
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={saveTone}>{saveLabel}</Badge>
        {elapsed && !elapsed.future ? (
          <Badge tone="info">
            LKW {elapsed.text} {t('case.elapsed')}
          </Badge>
        ) : null}
        <span className="text-xs text-[var(--muted)]">
          {formatDateTime(record.updatedAt, settings.language)}
        </span>
      </div>

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('case.demographics')}</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('form.sex')}</dt>
              <dd className="font-bold">{t(`sex.${demographics.sex}`)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('form.weight')}</dt>
              <dd className="stat font-bold">
                {demographics.weightKg !== null ? `${demographics.weightKg} kg` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('form.height')}</dt>
              <dd className="stat font-bold">
                {demographics.heightCm !== null ? `${demographics.heightCm} cm` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('case.bmi')}</dt>
              <dd className="stat font-bold">
                {bmiValue !== null ? formatDecimal(bmiValue, 1) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('form.creatinine')}</dt>
              <dd className="stat font-bold">
                {demographics.creatinineMgDl !== null
                  ? `${demographics.creatinineMgDl} mg/dL`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">{t('form.egfr')}</dt>
              <dd className="stat font-bold">
                {demographics.egfr !== null ? demographics.egfr : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs text-[var(--muted)]">{t('form.allergies')}</p>
            {demographics.allergies.length ? (
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {demographics.allergies.map((allergy) => (
                  <li key={allergy}>
                    <Badge tone="warn">{allergy}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm font-semibold">{t('case.noAllergies')}</p>
            )}
          </div>

          {demographics.pregnant !== null ? (
            <p className="mt-3 text-sm font-semibold text-[var(--primary)]">
              {demographics.pregnant ? t('case.pregnancyYes') : t('case.pregnancyNo')}
            </p>
          ) : null}
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('case.lastKnownWell')}</SectionTitle>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label={t('case.lkwEdit')} htmlFor="lkw-edit">
              <TextInput
                id="lkw-edit"
                type="datetime-local"
                value={lkwLocal}
                onChange={onLkwChange}
              />
            </Field>
            <div className="rounded-xl bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                {t('case.elapsed')}
              </p>
              <p className="stat mt-1 text-2xl font-extrabold">
                {elapsed && !elapsed.future ? elapsed.text : '—'}
              </p>
              {elapsed?.future ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--warn)]">
                  <AlertTriangleIcon width={14} height={14} />
                  {t('case.elapsedFuture')}
                </p>
              ) : null}
            </div>
          </div>
          {futureLkw ? (
            <p className="field-error mt-2">{t('case.elapsedFuture')}</p>
          ) : null}
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('case.notes')}</SectionTitle>
          <Field label={t('case.notes')} htmlFor="case-notes" optional>
            <TextArea
              id="case-notes"
              rows={4}
              maxLength={20_000}
              value={record.notes}
              onChange={(event) => apply({ notes: event.target.value })}
            />
          </Field>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('case.history')}</SectionTitle>
          <div className="space-y-4">
            <Field label={t('form.complaint')} htmlFor="detail-complaint">
              <Select
                id="detail-complaint"
                value={history.complaint ?? ''}
                onChange={(event) =>
                  apply({
                    history: { complaint: event.target.value || null },
                  })
                }
              >
                <option value="">{t('form.complaintPlaceholder')}</option>
                {complaintTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {settings.language === 'ar' ? template.ar : template.en}
                  </option>
                ))}
              </Select>
            </Field>

            {HISTORY_FIELDS.map((field) => (
              <Field
                key={field.key}
                label={t(field.labelKey)}
                htmlFor={`history-${field.key}`}
                optional
              >
                <TextArea
                  id={`history-${field.key}`}
                  rows={3}
                  maxLength={8_000}
                  value={history[field.key]}
                  onChange={(event) => onHistoryChange(field.key, event.target.value)}
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('case.scores')}</SectionTitle>
          <p className="text-sm text-[var(--muted)]">{t('case.noScores')}</p>
          <a href="#/clinical/scores" className="btn btn-secondary mt-3 inline-flex">
            {t('nav.clinical')}
          </a>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle hint={t('case.handoverHint')}>{t('case.handover')}</SectionTitle>
          <pre
            dir="ltr"
            className="mono max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--surface-2)] p-3 text-left text-[11px] leading-5"
          >
            {handover}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton
              text={handover}
              label={t('case.copyNote')}
              copiedLabel={t('case.noteCopied')}
            />
            <a
              href={`#/cases/${record.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <PrinterIcon width={17} height={17} />
              {t('case.printPdf')}
            </a>
          </div>
        </Card>

        <Card className="border-[var(--danger)] p-4 sm:p-5">
          <SectionTitle>{t('case.deleteCase')}</SectionTitle>
          <p className="mb-3 text-sm text-[var(--muted)]">{t('case.deleteBody')}</p>
          <Button variant="danger-soft" onClick={() => setDeleteOpen(true)}>
            <TrashIcon width={17} height={17} />
            {t('case.deleteCase')}
          </Button>
        </Card>
      </div>

      <Modal
        open={deleteOpen}
        title={t('case.deleteTitle')}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" disabled={deleting} onClick={() => void onDelete()}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-7">{t('case.deleteBody')}</p>
      </Modal>
    </div>
  );
}
