import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createCase,
  getCase,
  replaceCaseFromForm,
  type NewCaseInput,
} from '../../db/caseRepo';
import type { CaseRecord, Sex } from '../../db/db';
import { useAppSettings } from '../../app/settingsContext';
import { useToast } from '../../app/toast';
import { navigate } from '../../app/router';
import { complaintTemplates } from '../../content';
import { elapsedSince } from '../../engine';
import {
  Button,
  Card,
  EmptyState,
  Field,
  InlineAlert,
  PageHeader,
  SectionTitle,
  Select,
  Skeleton,
  TextArea,
  TextInput,
} from '../../ui/kit';
import {
  CasesIcon,
  ChevronLeftIcon,
  CloseIcon,
  PlusIcon,
} from '../../ui/icons';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../ui/format';

type PregnantChoice = 'yes' | 'no' | 'unknown';

interface FormState {
  ageYears: string;
  sex: Sex | '';
  weightKg: string;
  heightCm: string;
  pregnant: PregnantChoice;
  creatinineMgDl: string;
  egfr: string;
  allergies: string[];
  allergyDraft: string;
  complaint: string;
  lkwLocal: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  ageYears: '',
  sex: '',
  weightKg: '',
  heightCm: '',
  pregnant: 'unknown',
  creatinineMgDl: '',
  egfr: '',
  allergies: [],
  allergyDraft: '',
  complaint: '',
  lkwLocal: '',
  notes: '',
};

function fromRecord(record: CaseRecord): FormState {
  return {
    ageYears: String(record.demographics.ageYears),
    sex: record.demographics.sex,
    weightKg:
      record.demographics.weightKg === null ? '' : String(record.demographics.weightKg),
    heightCm:
      record.demographics.heightCm === null ? '' : String(record.demographics.heightCm),
    pregnant:
      record.demographics.pregnant === true
        ? 'yes'
        : record.demographics.pregnant === false
          ? 'no'
          : 'unknown',
    creatinineMgDl:
      record.demographics.creatinineMgDl === null
        ? ''
        : String(record.demographics.creatinineMgDl),
    egfr: record.demographics.egfr === null ? '' : String(record.demographics.egfr),
    allergies: record.demographics.allergies,
    allergyDraft: '',
    complaint: record.history.complaint ?? '',
    lkwLocal: toDatetimeLocalValue(record.lastKnownWell),
    notes: record.notes,
  };
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function CaseFormPage({
  mode,
  caseId,
}: {
  mode: 'create' | 'edit';
  caseId?: string;
}) {
  const { t } = useTranslation();
  const { settings } = useAppSettings();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(mode === 'create');
  const [missing, setMissing] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !caseId) return;
    let alive = true;
    getCase(caseId)
      .then((record) => {
        if (!alive) return;
        if (!record) {
          setMissing(true);
        } else {
          setForm(fromRecord(record));
          setReady(true);
        }
      })
      .catch((loadError: unknown) => {
        console.error('[nrc] failed to load case', loadError);
        if (alive) setMissing(true);
      });
    return () => {
      alive = false;
    };
  }, [mode, caseId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function addAllergy() {
    const value = form.allergyDraft.trim();
    if (!value) return;
    if (value.length > 80) {
      setAllergyError(t('form.errAllergy'));
      return;
    }
    if (form.allergies.length >= 30) {
      setAllergyError(t('form.errTooManyAllergies'));
      return;
    }
    setAllergyError(null);
    if (!form.allergies.includes(value)) {
      setForm((previous) => ({
        ...previous,
        allergies: [...previous.allergies, value],
        allergyDraft: '',
      }));
    } else {
      setForm((previous) => ({ ...previous, allergyDraft: '' }));
    }
  }

  function validate(): { errors: Record<string, string>; input: NewCaseInput | null } {
    const nextErrors: Record<string, string> = {};

    const age = parseNumber(form.ageYears);
    if (age === null) nextErrors.age = t('form.errRequired');
    else if (Number.isNaN(age) || age < 0 || age > 120) nextErrors.age = t('form.errAge');

    if (!form.sex) nextErrors.sex = t('form.errRequired');

    const weight = parseNumber(form.weightKg);
    if (weight !== null && (Number.isNaN(weight) || weight < 0.5 || weight > 400)) {
      nextErrors.weight = t('form.errWeight');
    }

    const height = parseNumber(form.heightCm);
    if (height !== null && (Number.isNaN(height) || height < 30 || height > 250)) {
      nextErrors.height = t('form.errHeight');
    }

    const creatinine = parseNumber(form.creatinineMgDl);
    if (
      creatinine !== null &&
      (Number.isNaN(creatinine) || creatinine < 0 || creatinine > 30)
    ) {
      nextErrors.creatinine = t('form.errCreatinine');
    }

    const egfr = parseNumber(form.egfr);
    if (egfr !== null && (Number.isNaN(egfr) || egfr < 0 || egfr > 300)) {
      nextErrors.egfr = t('form.errEgfr');
    }

    const lkw = fromDatetimeLocalValue(form.lkwLocal);
    if (form.lkwLocal && !lkw) {
      nextErrors.lkw = t('form.errInvalid');
    } else if (lkw && new Date(lkw).getTime() > now.getTime()) {
      nextErrors.lkw = t('form.errLkwFuture');
    }

    const input: NewCaseInput = {
      ageYears: age ?? 0,
      sex: (form.sex || 'unknown') as Sex,
      weightKg: weight !== null && !Number.isNaN(weight) ? weight : null,
      heightCm: height !== null && !Number.isNaN(height) ? height : null,
      pregnant:
        form.sex === 'female'
          ? form.pregnant === 'yes'
            ? true
            : form.pregnant === 'no'
              ? false
              : null
          : null,
      creatinineMgDl:
        creatinine !== null && !Number.isNaN(creatinine) ? creatinine : null,
      egfr: egfr !== null && !Number.isNaN(egfr) ? egfr : null,
      allergies: form.allergies,
      complaint: form.complaint || null,
      lastKnownWell: lkw,
      notes: form.notes.slice(0, 20_000),
    };

    return {
      errors: nextErrors,
      input: Object.keys(nextErrors).length ? null : input,
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const result = validate();
    if (!result.input) {
      setErrors(result.errors);
      const order = ['age', 'sex', 'weight', 'height', 'creatinine', 'egfr', 'lkw'];
      const first = order.find((key) => result.errors[key]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === 'create') {
        const id = await createCase(result.input);
        navigate(`#/cases/${id}`);
      } else if (caseId) {
        await replaceCaseFromForm(caseId, result.input);
        toast(t('common.saved'));
        navigate(`#/cases/${caseId}`);
      }
    } catch (submitError) {
      console.error('[nrc] failed to save case', submitError);
      setFormError(
        mode === 'create' ? t('errors.caseCreate') : t('errors.caseUpdate'),
      );
    } finally {
      setBusy(false);
    }
  }

  const backHref = mode === 'edit' && caseId ? `#/cases/${caseId}` : '#/cases';

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

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const lkwIso = fromDatetimeLocalValue(form.lkwLocal);
  const elapsed = lkwIso ? elapsedSince(lkwIso, now) : null;

  return (
    <div>
      <a
        href={backHref}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ChevronLeftIcon width={16} height={16} className="rtl:rotate-180" />
        {t('common.back')}
      </a>

      <PageHeader
        title={mode === 'create' ? t('form.titleNew') : t('form.titleEdit')}
        subtitle={t('form.subtitle')}
      />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError ? <InlineAlert tone="danger">{formError}</InlineAlert> : null}

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('form.sectionDemo')}</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('form.age')}
              htmlFor="age"
              hint={t('form.ageHint')}
              error={errors.age}
            >
              <TextInput
                id="age"
                type="number"
                inputMode="decimal"
                min={0}
                max={120}
                step="any"
                value={form.ageYears}
                aria-invalid={Boolean(errors.age)}
                onChange={(event) => update('ageYears', event.target.value)}
              />
            </Field>

            <Field label={t('form.sex')} htmlFor="sex" error={errors.sex}>
              <Select
                id="sex"
                value={form.sex}
                aria-invalid={Boolean(errors.sex)}
                onChange={(event) => update('sex', event.target.value as Sex | '')}
              >
                <option value="">—</option>
                <option value="male">{t('sex.male')}</option>
                <option value="female">{t('sex.female')}</option>
                <option value="other">{t('sex.other')}</option>
                <option value="unknown">{t('sex.unknown')}</option>
              </Select>
            </Field>

            <Field
              label={t('form.weight')}
              htmlFor="weight"
              optional
              error={errors.weight}
            >
              <TextInput
                id="weight"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={400}
                step="any"
                value={form.weightKg}
                aria-invalid={Boolean(errors.weight)}
                onChange={(event) => update('weightKg', event.target.value)}
              />
            </Field>

            <Field
              label={t('form.height')}
              htmlFor="height"
              optional
              error={errors.height}
            >
              <TextInput
                id="height"
                type="number"
                inputMode="decimal"
                min={30}
                max={250}
                step="any"
                value={form.heightCm}
                aria-invalid={Boolean(errors.height)}
                onChange={(event) => update('heightCm', event.target.value)}
              />
            </Field>

            {form.sex === 'female' ? (
              <Field
                label={t('form.pregnant')}
                htmlFor="pregnant"
                hint={t('form.pregnantHint')}
              >
                <Select
                  id="pregnant"
                  value={form.pregnant}
                  onChange={(event) =>
                    update('pregnant', event.target.value as PregnantChoice)
                  }
                >
                  <option value="unknown">{t('common.unknown')}</option>
                  <option value="no">{t('common.no')}</option>
                  <option value="yes">{t('common.yes')}</option>
                </Select>
              </Field>
            ) : null}

            <Field
              label={t('form.creatinine')}
              htmlFor="creatinine"
              optional
              error={errors.creatinine}
            >
              <TextInput
                id="creatinine"
                type="number"
                inputMode="decimal"
                min={0}
                max={30}
                step="any"
                value={form.creatinineMgDl}
                aria-invalid={Boolean(errors.creatinine)}
                onChange={(event) => update('creatinineMgDl', event.target.value)}
              />
            </Field>

            <Field
              label={t('form.egfr')}
              htmlFor="egfr"
              optional
              error={errors.egfr}
            >
              <TextInput
                id="egfr"
                type="number"
                inputMode="decimal"
                min={0}
                max={300}
                step="any"
                value={form.egfr}
                aria-invalid={Boolean(errors.egfr)}
                onChange={(event) => update('egfr', event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <span className="field-label">{t('form.allergies')}</span>
            <div className="flex gap-2">
              <TextInput
                id="allergy"
                value={form.allergyDraft}
                placeholder={t('form.allergyPlaceholder')}
                aria-label={t('form.allergies')}
                onChange={(event) => update('allergyDraft', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addAllergy();
                  }
                }}
              />
              <Button variant="secondary" onClick={addAllergy} className="shrink-0">
                <PlusIcon width={16} height={16} />
                {t('form.addAllergy')}
              </Button>
            </div>
            <p className="field-hint">{t('form.allergiesHint')}</p>
            {allergyError ? (
              <p className="field-error" role="alert">
                {allergyError}
              </p>
            ) : null}
            {form.allergies.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {form.allergies.map((allergy) => (
                  <li key={allergy} className="chip">
                    <span>{allergy}</span>
                    <button
                      type="button"
                      aria-label={`${t('common.remove')}: ${allergy}`}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          allergies: previous.allergies.filter(
                            (item) => item !== allergy,
                          ),
                        }))
                      }
                    >
                      <CloseIcon width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('form.sectionLkw')}</SectionTitle>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              label={t('form.lkw')}
              htmlFor="lkw"
              hint={t('form.lkwHint')}
              error={errors.lkw}
            >
              <TextInput
                id="lkw"
                type="datetime-local"
                value={form.lkwLocal}
                aria-invalid={Boolean(errors.lkw)}
                onChange={(event) => update('lkwLocal', event.target.value)}
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
                <p className="mt-1 text-xs font-semibold text-[var(--warn)]">
                  {t('case.elapsedFuture')}
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle>{t('form.sectionPresentation')}</SectionTitle>
          <div className="space-y-4">
            <Field label={t('form.complaint')} htmlFor="complaint">
              <Select
                id="complaint"
                value={form.complaint}
                onChange={(event) => update('complaint', event.target.value)}
              >
                <option value="">{t('form.complaintPlaceholder')}</option>
                {complaintTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {settings.language === 'ar' ? template.ar : template.en}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('form.notes')} htmlFor="notes" optional>
              <TextArea
                id="notes"
                rows={4}
                maxLength={20_000}
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a href={backHref} className="btn btn-secondary">
            {t('common.cancel')}
          </a>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy
              ? t('common.saving')
              : mode === 'create'
                ? t('form.create')
                : t('form.saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}
